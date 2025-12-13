const http = require('http');
const {
  TOURNAMENTS_FILE,
  DATA_BACKEND,
  DATA_BUCKET,
  DATA_PREFIX,
  IS_PROD,
  PORT,
  HOST,
} = require('./config');
const { readJsonFile } = require('./services/dataStore');
const { info, warn, error: logError } = require('./utils/logger');

const METADATA_BASE = 'http://metadata.google.internal/computeMetadata/v1';
const METADATA_HEADERS = { 'Metadata-Flavor': 'Google' };
const METADATA_TIMEOUT_MS = 1200;

function formatUptime(seconds) {
  const totalSeconds = Math.floor(seconds);
  const s = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const h = totalHours % 24;
  const d = Math.floor(totalHours / 24);

  const parts = [];
  if (d) parts.push(`${d}일`);
  if (h || parts.length) parts.push(`${h}시간`);
  if (m || parts.length) parts.push(`${m}분`);
  parts.push(`${s}초`);
  return parts.join(' ');
}

function fetchMetadata(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `${METADATA_BASE}/${path}`,
      {
        method: 'GET',
        headers: METADATA_HEADERS,
        timeout: METADATA_TIMEOUT_MS,
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`Metadata status ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve(Buffer.concat(chunks).toString('utf-8'));
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('Metadata request timed out'));
    });
    req.end();
  });
}

async function fetchMetadataSafe(path) {
  try {
    return await fetchMetadata(path);
  } catch (_error) {
    return null;
  }
}

async function getGcpServerStatus() {
  const base = {
    isGcp: false,
    ok: true,
    projectId: null,
    zone: null,
    instanceName: null,
    instanceId: null,
    machineType: null,
    internalIp: null,
    externalIp: null,
    uptimeSec: null,
    message: null,
  };

  try {
    const projectId = await fetchMetadataSafe('project/project-id');
    if (!projectId) {
      return {
        ...base,
        ok: true,
        message: 'GCP 메타데이터 서버 응답 없음 (로컬/테스트 환경일 수 있습니다).',
      };
    }

    const [
      zonePath,
      instanceName,
      instanceId,
      machineTypePath,
      internalIp,
      externalIp,
      uptimeSecRaw,
    ] = await Promise.all([
      fetchMetadataSafe('instance/zone'),
      fetchMetadataSafe('instance/name'),
      fetchMetadataSafe('instance/id'),
      fetchMetadataSafe('instance/machine-type'),
      fetchMetadataSafe('instance/network-interfaces/0/ip'),
      fetchMetadataSafe('instance/network-interfaces/0/access-configs/0/external-ip'),
      fetchMetadataSafe('instance/uptime'),
    ]);

    const zone = zonePath ? zonePath.split('/').pop() : null;
    const machineType = machineTypePath ? machineTypePath.split('/').pop() : null;
    const uptimeSec = uptimeSecRaw ? Number(uptimeSecRaw) : null;

    return {
      ...base,
      isGcp: true,
      ok: true,
      projectId,
      zone,
      instanceName,
      instanceId,
      machineType,
      internalIp,
      externalIp,
      uptimeSec,
      message: 'GCP 메타데이터 조회 성공',
    };
  } catch (error) {
    logError('GCP metadata check failed', { message: error?.message });
    return {
      ...base,
      isGcp: true,
      ok: false,
      message: error?.message || 'GCP 메타데이터 확인 실패',
    };
  }
}

async function checkStorageHealth() {
  if (DATA_BACKEND !== 'gcs') {
    return {
      backend: DATA_BACKEND,
      ok: true,
      message: '로컬 파일 시스템 백엔드 사용 중',
      bucket: null,
      prefix: null,
    };
  }

  const prefix = (DATA_PREFIX || '').replace(/(^\/+|\/+$)/g, '') || null;

  if (!DATA_BUCKET) {
    return {
      backend: DATA_BACKEND,
      ok: false,
      message: 'DATA_BUCKET이 설정되어 있지 않습니다.',
      bucket: null,
      prefix,
    };
  }

  try {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage();
    const bucket = storage.bucket(DATA_BUCKET);
    const [exists] = await bucket.exists();
    if (!exists) {
      return {
        backend: DATA_BACKEND,
        ok: false,
        message: `버킷 "${DATA_BUCKET}" 을(를) 찾을 수 없습니다.`,
        bucket: DATA_BUCKET,
        prefix,
      };
    }

    let detail = `버킷 "${DATA_BUCKET}" 에 접근 가능합니다.`;
    if (prefix) {
      const [files] = await bucket.getFiles({
        prefix,
        maxResults: 1,
      });
      if (files.length) {
        detail += ` prefix "${prefix}" 아래에 데이터가 존재합니다.`;
      } else {
        detail += ` prefix "${prefix}" 아래에 아직 객체가 없습니다.`;
      }
    }

    return {
      backend: DATA_BACKEND,
      ok: true,
      message: detail,
      bucket: DATA_BUCKET,
      prefix,
    };
  } catch (error) {
    logError('GCS health check failed', { message: error?.message });
    return {
      backend: DATA_BACKEND,
      ok: false,
      message: error?.message || 'GCS 상태 확인 중 오류가 발생했습니다.',
      bucket: DATA_BUCKET,
      prefix,
    };
  }
}

async function getTournamentStats() {
  try {
    const tournaments = await readJsonFile(TOURNAMENTS_FILE, []);
    const list = Array.isArray(tournaments) ? tournaments : [];

    const statusCounts = {
      scheduled: 0,
      live: 0,
      completed: 0,
      other: 0,
    };
    const phaseCounts = {
      waiting: 0,
      'ready-check': 0,
      'map-selected': 0,
      banning: 0,
      picking: 0,
      locked: 0,
      other: 0,
    };

    let matchCount = 0;

    list.forEach((t) => {
      const status = t.status || 'scheduled';
      if (statusCounts[status] != null) {
        statusCounts[status] += 1;
      } else {
        statusCounts.other += 1;
      }

      const matches = Array.isArray(t.matches) ? t.matches : [];
      matchCount += matches.length;
      matches.forEach((m) => {
        const phase = m.phase || 'waiting';
        if (phaseCounts[phase] != null) {
          phaseCounts[phase] += 1;
        } else {
          phaseCounts.other += 1;
        }
      });
    });

    return {
      ok: true,
      tournaments: list.length,
      matches: matchCount,
      statusCounts,
      phaseCounts,
      message: null,
    };
  } catch (error) {
    logError('Failed to read tournaments for status', { message: error?.message });
    return {
      ok: false,
      tournaments: 0,
      matches: 0,
      statusCounts: null,
      phaseCounts: null,
      message: error?.message || '대회 데이터 읽기 실패',
    };
  }
}

function buildStatusEmbed(status, EmbedBuilder) {
  const { storage, tournaments, gcp } = status;
  const overallOk = storage.ok && tournaments.ok && (gcp.ok || !gcp.isGcp);
  const color = overallOk ? 0x57f287 : 0xed4245;

  const storageStatusLabel = storage.ok ? '정상' : '오류';
  const tournamentStatusLabel = tournaments.ok ? '정상' : '오류';
  const gcpStatusLabel = gcp.isGcp ? (gcp.ok ? '정상' : '오류') : 'GCP 아님';

  const mem = process.memoryUsage();
  const toMb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  const phaseLines = tournaments.phaseCounts
    ? [
        `waiting: ${tournaments.phaseCounts.waiting}`,
        `ready-check: ${tournaments.phaseCounts['ready-check']}`,
        `map-selected: ${tournaments.phaseCounts['map-selected']}`,
        `banning: ${tournaments.phaseCounts.banning}`,
        `picking: ${tournaments.phaseCounts.picking}`,
        `locked: ${tournaments.phaseCounts.locked}`,
      ].join('\n')
    : '데이터 없음';

  const statusLines = tournaments.statusCounts
    ? [
        `scheduled: ${tournaments.statusCounts.scheduled}`,
        `live: ${tournaments.statusCounts.live}`,
        `completed: ${tournaments.statusCounts.completed}`,
      ].join('\n')
    : '데이터 없음';

  const embed = new EmbedBuilder()
    .setTitle('서버 상태 (/status)')
    .setDescription('웹 서버 · GCP 서버 · 데이터(GCP/로컬) · 대회 진행 상황 요약입니다.')
    .setColor(color)
    .addFields(
      {
        name: '프로세스',
        value: [
          `환경: ${IS_PROD ? 'production' : 'development'}`,
          `호스트: ${HOST}:${PORT}`,
          `업타임: ${formatUptime(process.uptime())}`,
          `PID: ${process.pid}`,
          `Node: ${process.version}`,
          `메모리: rss=${toMb(mem.rss)}, heapUsed=${toMb(mem.heapUsed)}`,
        ].join('\n'),
        inline: false,
      },
      {
        name: 'GCP 서버',
        value: gcp.isGcp
          ? [
              `상태: ${gcpStatusLabel}`,
              `프로젝트: ${gcp.projectId || '-'}`,
              `존: ${gcp.zone || '-'}`,
              `인스턴스: ${gcp.instanceName || '-'} (${gcp.instanceId || '-'})`,
              `머신타입: ${gcp.machineType || '-'}`,
              `내부 IP: ${gcp.internalIp || '-'}`,
              `외부 IP: ${gcp.externalIp || '-'}`,
              gcp.uptimeSec ? `GCP 업타임: ${formatUptime(gcp.uptimeSec)}` : null,
              gcp.message,
            ]
              .filter(Boolean)
              .join('\n')
          : gcp.message || 'GCP 인스턴스가 아닌 환경으로 감지되었습니다.',
        inline: false,
      },
      {
        name: '데이터 백엔드',
        value: [
          `종류: ${storage.backend}`,
          storage.backend === 'gcs' && storage.bucket ? `버킷: ${storage.bucket}` : null,
          storage.backend === 'gcs' && storage.prefix ? `프리픽스: ${storage.prefix}` : null,
          `상태: ${storageStatusLabel}`,
          storage.message,
        ]
          .filter(Boolean)
          .join('\n'),
        inline: false,
      },
      {
        name: '대회/매치 개수',
        value: tournaments.ok
          ? [
              `토너먼트: ${tournaments.tournaments}개`,
              `매치: ${tournaments.matches}개`,
              `상태 요약:\n${statusLines}`,
            ].join('\n')
          : `상태: 오류\n메시지: ${tournaments.message}`,
        inline: false,
      },
      {
        name: '매치 단계별 개수',
        value: tournaments.ok ? phaseLines : '데이터 없음',
        inline: false,
      },
    )
    .setTimestamp(new Date());

  return embed;
}

function startDiscordBotIfConfigured() {
  const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    info('Discord bot token not set; skipping Discord integration');
    return;
  }

  let Discord;
  try {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    Discord = require('discord.js');
  } catch (error) {
    warn('Discord integration disabled; discord.js is not installed', {
      message: error?.message,
    });
    return;
  }

  const {
    Client,
    GatewayIntentBits,
    Events,
    EmbedBuilder,
  } = Discord;

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  const commands = [
    {
      name: 'status',
      description: '서버 · 데이터 · 대회 상태를 표시합니다.',
      descriptionLocalizations: {
        ko: '서버 · 데이터 · 대회 상태를 표시합니다.',
      },
    },
  ];

  client.once(Events.ClientReady, async () => {
    info('Discord bot logged in', { user: client.user?.tag });
    try {
      const guildId = process.env.DISCORD_GUILD_ID;
      if (guildId) {
        const guild = await client.guilds.fetch(guildId);
        await guild.commands.set(commands);
        info('Registered guild commands', { guildId, count: commands.length });
      } else {
        await client.application.commands.set(commands);
        info('Registered global commands', { count: commands.length });
      }
    } catch (error) {
      logError('Failed to register Discord slash commands', {
        message: error?.message,
      });
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (!interaction.isChatInputCommand()) {
        return;
      }
      if (interaction.commandName !== 'status') {
        return;
      }

      // 모두에게 보이도록 ephemeral 사용하지 않음
      await interaction.deferReply();

      const [storage, tournaments, gcp] = await Promise.all([
        checkStorageHealth(),
        getTournamentStats(),
        getGcpServerStatus(),
      ]);
      const embed = buildStatusEmbed({ storage, tournaments, gcp }, EmbedBuilder);

      await interaction.editReply({
        embeds: [embed],
      });
    } catch (error) {
      logError('Failed to handle /status command', { message: error?.message });
      const message = '상태 정보를 불러오는 중 오류가 발생했습니다.';
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({
            content: message,
          });
        } else {
          await interaction.reply({
            content: message,
          });
        }
      } catch (_ignored) {
        // ignore
      }
    }
  });

  client
    .login(token)
    .catch((error) => {
      logError('Discord bot login failed', { message: error?.message });
    });
}

module.exports = {
  startDiscordBotIfConfigured,
};

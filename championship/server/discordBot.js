const {
  TOURNAMENTS_FILE,
  DATA_BACKEND,
  DATA_BUCKET,
  DATA_PREFIX,
  IS_PROD,
} = require('./config');
const { readJsonFile } = require('./services/dataStore');
const { info, warn, error: logError } = require('./utils/logger');

const FACTIONS = [
  {
    id: '영국',
    name: '영국군',
    battlegroups: [
      '인도 포병 전투단',
      '영국 중기갑 전투단',
      '영국 공군 및 해군 전투단',
      '오스트레일리아 수비 전투단',
      '캐나다 충격군 전투단',
      '폴란드 기병 전투단',
    ],
  },
  {
    id: '미국',
    name: '미군',
    battlegroups: [
      '중화기 전투단',
      '공수 전투단',
      '기갑 전투단',
      '특수 작전 전투단',
      '고급 보병 전투단',
      '이탈리아 파르티잔 전투단',
    ],
  },
  {
    id: '국방',
    name: '국방군',
    battlegroups: [
      '루프트바페 전투단',
      '기계화 전투단',
      '전선 돌파 전투단',
      '이탈리아 해안 전투단',
      '공포 전투단',
      '최후의 저항 전투단',
    ],
  },
  {
    id: '아프리카',
    name: '아프리카 군단',
    battlegroups: [
      '이탈리아 보병 전투단',
      '이탈리아 제병협동 전투단',
      '기갑 지원 전투단',
      '전장 첩보 전투단',
      '기갑엽병 지휘부 전투단',
      '크릭스마리네 전투단',
    ],
  },
];

const ALL_BATTLEGROUPS = FACTIONS.flatMap((faction) =>
  faction.battlegroups.map((name) => ({
    id: `${faction.id}::${name}`,
    name,
    factionId: faction.id,
    factionName: faction.name,
    label: `${faction.name} · ${name}`,
  })),
);

const BATTLEGROUP_MAP = new Map(ALL_BATTLEGROUPS.map((bg) => [bg.id, bg]));

function formatBattlegroupLabel(id) {
  return BATTLEGROUP_MAP.get(id)?.label || id;
}

function getFactionName(factionId) {
  return FACTIONS.find((faction) => faction.id === factionId)?.name || factionId || '알 수 없음';
}

function describePhase(phase) {
  switch (phase) {
    case 'waiting':
      return '대기';
    case 'ready-check':
      return '준비 확인';
    case 'map-selected':
      return '맵 확정';
    case 'banning':
      return '밴 진행 중';
    case 'picking':
      return '픽 진행 중';
    case 'locked':
      return '확정됨';
    default:
      return '진행 중';
  }
}

function formatDateTime(value) {
  if (!value) {
    return '미정';
  }
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return String(value);
  }
}

async function findMatchForCommand(roundInput, playerInput) {
  const round = String(roundInput || '').trim().toLowerCase();
  const playerName = String(playerInput || '').trim().toLowerCase();

  if (!round || !playerName) {
    return null;
  }

  const tournaments = await readJsonFile(TOURNAMENTS_FILE, []);
  const list = Array.isArray(tournaments) ? tournaments : [];

  for (const tournament of list) {
    const matches = Array.isArray(tournament.matches) ? tournament.matches : [];
    for (const match of matches) {
      const roundName = String(match.round || '').trim().toLowerCase();
      if (!roundName && !round) {
        continue;
      }
      if (!roundName.includes(round) && !round.includes(roundName)) {
        continue;
      }

      const players = Array.isArray(match.players) ? match.players : [];
      const foundPlayer = players.find((p) => {
        const display = String(p.displayName || p.accountId || '').toLowerCase();
        return display === playerName || display.includes(playerName);
      });

      if (!foundPlayer) {
        continue;
      }

      return {
        tournament,
        match,
        focusAccountId: foundPlayer.accountId,
      };
    }
  }

  return null;
}

function buildPlayerSideText(selection, bans) {
  const factionText = selection?.faction ? getFactionName(selection.faction) : '진영 미정';
  const picks =
    Array.isArray(selection?.battlegroups) && selection.battlegroups.length
      ? selection.battlegroups.map((id) => `• ${formatBattlegroupLabel(id)}`).join('\n')
      : '• 픽 미정';
  const bansText =
    Array.isArray(bans) && bans.length
      ? bans.map((id) => `• ${formatBattlegroupLabel(id)}`).join('\n')
      : '• 밴 없음';

  return `진영: ${factionText}\n픽:\n${picks}\n밴:\n${bansText}`;
}

function buildTournamentEmbed(payload, EmbedBuilder) {
  const { tournament, match, focusAccountId } = payload;
  const players = Array.isArray(match.players) ? match.players : [];
  const vsLabel = players.map((p) => p.displayName).join(' vs ');

  const embed = new EmbedBuilder()
    .setTitle(`${tournament.name} · ${match.round || '경기'}`)
    .setDescription(
      [
        `경기: ${vsLabel || '미정'}`,
        `맵: ${match.map || '미정'}`,
        `상태: ${describePhase(match.phase)}`,
        `시작 시간: ${formatDateTime(match.scheduled || tournament.startTime)}`,
      ].join('\n'),
    )
    .setColor(0x2b2d31);

  const sortedPlayers = [...players].sort((a, b) => {
    if (a.accountId === focusAccountId) return -1;
    if (b.accountId === focusAccountId) return 1;
    return 0;
  });

  sortedPlayers.forEach((player) => {
    const selection = match.selections?.[player.accountId] || null;
    const bans = match.bans?.[player.accountId] || [];
    const name =
      player.accountId === focusAccountId
        ? `${player.displayName} (요청 대상)`
        : player.displayName;
    embed.addFields({
      name,
      value: buildPlayerSideText(selection, bans),
      inline: true,
    });
  });

  const links = tournament.streamLinks || {};
  const streams = [];
  if (links.withgo) {
    streams.push(`[치지직 (Withgo)](${links.withgo})`);
  }
  if (links.soop) {
    streams.push(`[SOOP](${links.soop})`);
  }
  if (streams.length) {
    embed.addFields({
      name: '중계 링크',
      value: streams.join(' · '),
      inline: false,
    });
  }

  embed.setTimestamp(match.scheduled ? new Date(match.scheduled) : new Date());

  return embed;
}

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

async function checkStorageHealth() {
  if (DATA_BACKEND !== 'gcs') {
    return {
      backend: DATA_BACKEND,
      ok: true,
      message: '로컬 데이터 백엔드 사용 중',
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
    const matches = list.reduce(
      (sum, t) => sum + (Array.isArray(t.matches) ? t.matches.length : 0),
      0,
    );
    return {
      ok: true,
      tournaments: list.length,
      matches,
      message: null,
    };
  } catch (error) {
    logError('Failed to read tournaments for status', { message: error?.message });
    return {
      ok: false,
      tournaments: 0,
      matches: 0,
      message: error?.message || '대회 데이터 읽기 실패',
    };
  }
}

function buildStatusEmbed(status, EmbedBuilder) {
  const { storage, tournaments } = status;
  const overallOk = storage.ok && tournaments.ok;
  const color = overallOk ? 0x57f287 : 0xed4245;

  const storageStatusLabel = storage.ok ? '정상' : '오류';
  const tournamentStatusLabel = tournaments.ok ? '정상' : '오류';

  const embed = new EmbedBuilder()
    .setTitle('서버 상태 (/status)')
    .setDescription('웹 서버와 데이터(GCP) 상태 요약입니다.')
    .setColor(color)
    .addFields(
      {
        name: '프로세스',
        value: [
          `환경: ${IS_PROD ? 'production' : 'development'}`,
          `업타임: ${formatUptime(process.uptime())}`,
          `PID: ${process.pid}`,
          `Node: ${process.version}`,
        ].join('\n'),
        inline: false,
      },
      {
        name: '데이터 백엔드',
        value: [
          `종류: ${DATA_BACKEND}`,
          DATA_BACKEND === 'gcs' && storage.bucket ? `버킷: ${storage.bucket}` : null,
          DATA_BACKEND === 'gcs' && storage.prefix ? `프리픽스: ${storage.prefix}` : null,
          `상태: ${storageStatusLabel}`,
          storage.message,
        ]
          .filter(Boolean)
          .join('\n'),
        inline: false,
      },
      {
        name: '대회 데이터',
        value: tournaments.ok
          ? [
              `토너먼트: ${tournaments.tournaments}개`,
              `매치: ${tournaments.matches}개`,
              `상태: ${tournamentStatusLabel}`,
            ].join('\n')
          : `상태: 오류\n메시지: ${tournaments.message}`,
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

  const { Client, GatewayIntentBits, Events, EmbedBuilder } = Discord;

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  const commands = [
    {
      name: 'tournament',
      description: '지정한 라운드/플레이어의 대회 정보를 보여줍니다.',
      descriptionLocalizations: {
        ko: '지정한 라운드/플레이어의 대회 정보를 보여줍니다.',
      },
      options: [
        {
          type: 3,
          name: 'round',
          nameLocalizations: { ko: '라운드' },
          description: '라운드 이름 (예: 1, 준결승 등)',
          descriptionLocalizations: {
            ko: '라운드 이름 (예: 1, 준결승 등)',
          },
          required: true,
        },
        {
          type: 3,
          name: 'player',
          nameLocalizations: { ko: '플레이어' },
          description: '해당 라운드에 참가한 플레이어의 닉네임',
          descriptionLocalizations: {
            ko: '해당 라운드에 참가한 플레이어의 닉네임',
          },
          required: true,
        },
      ],
    },
    {
      name: 'status',
      description: '서버 및 GCP 상태를 표시합니다.',
      descriptionLocalizations: {
        ko: '서버 및 GCP 상태를 표시합니다.',
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
        info('Registered guild slash commands', {
          guildId,
          count: commands.length,
        });
      } else {
        await client.application.commands.set(commands);
        info('Registered global slash commands', {
          count: commands.length,
        });
      }
    } catch (error) {
      logError('Failed to register Discord slash commands', {
        message: error?.message,
      });
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    if (interaction.commandName === 'tournament') {
      const round = interaction.options.getString('round', true);
      const player = interaction.options.getString('player', true);

      try {
        const payload = await findMatchForCommand(round, player);
        if (!payload) {
          await interaction.reply({
            content:
              '해당 라운드 / 플레이어 조합의 경기를 찾지 못했습니다.\n라운드 이름과 플레이어 닉네임을 다시 확인해 주세요.',
            ephemeral: true,
          });
          return;
        }

        const embed = buildTournamentEmbed(payload, EmbedBuilder);
        await interaction.reply({
          embeds: [embed],
        });
      } catch (error) {
        logError('Failed to handle /tournament command', {
          message: error?.message,
        });
        const message = '경기 정보를 불러오는 중 오류가 발생했습니다.';
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.followUp({
              content: message,
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: message,
              ephemeral: true,
            });
          }
        } catch (_ignored) {
          // ignore
        }
      }
      return;
    }

    if (interaction.commandName === 'status') {
      try {
        await interaction.deferReply({ ephemeral: true });
        const [storage, tournaments] = await Promise.all([
          checkStorageHealth(),
          getTournamentStats(),
        ]);
        const embed = buildStatusEmbed({ storage, tournaments }, EmbedBuilder);
        await interaction.editReply({
          embeds: [embed],
        });
      } catch (error) {
        logError('Failed to handle /status command', {
          message: error?.message,
        });
        const message = '상태 정보를 불러오는 중 오류가 발생했습니다.';
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.followUp({
              content: message,
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: message,
              ephemeral: true,
            });
          }
        } catch (_ignored) {
          // ignore
        }
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


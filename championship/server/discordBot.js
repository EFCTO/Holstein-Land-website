const { TOURNAMENTS_FILE, DATA_BACKEND, DATA_BUCKET } = require('./config');
const { readJsonFile, writeJsonFile } = require('./services/dataStore');
const { info, warn, error: logError } = require('./utils/logger');

const MAX_BAN_PER_PLAYER = 4;
const MAX_PICK_SELECTION = 3;

// 웹 사이트와 동일한 전투단 ID 포맷 (진영::전투단 이름)
const BATTLEGROUP_IDS = [
  '영국::인도 포병 전투단',
  '영국::영국 중기갑 전투단',
  '영국::영국 공군 및 해군 전투단',
  '영국::오스트레일리아 수비 전투단',
  '영국::캐나다 충격군 전투단',
  '영국::폴란드 기병 전투단',
  '미국::중화기 전투단',
  '미국::공수 전투단',
  '미국::기갑 전투단',
  '미국::특수 작전 전투단',
  '미국::고급 보병 전투단',
  '미국::이탈리아 파르티잔 전투단',
  '국방::루프트바페 전투단',
  '국방::기계화 전투단',
  '국방::전선 돌파 전투단',
  '국방::이탈리아 해안 전투단',
  '국방::공포 전투단',
  '국방::최후의 저항 전투단',
  '아프리카::이탈리아 보병 전투단',
  '아프리카::이탈리아 제병협동 전투단',
  '아프리카::기갑 지원 전투단',
  '아프리카::전장 첩보 전투단',
  '아프리카::기갑엽병 지휘부 전투단',
  '아프리카::크릭스마리네 전투단',
];

function formatBattlegroupId(id) {
  return typeof id === 'string' && id.length ? id : '미정';
}

function getFactionFromId(id) {
  const [factionId] = String(id || '').split('::');
  return factionId || null;
}

function getFactionIds() {
  const set = new Set();
  BATTLEGROUP_IDS.forEach((raw) => {
    const factionId = getFactionFromId(raw);
    if (factionId) {
      set.add(factionId);
    }
  });
  return Array.from(set);
}

function getBattlegroupsByFaction(factionId) {
  if (!factionId) {
    return [];
  }
  return BATTLEGROUP_IDS.filter((raw) => getFactionFromId(raw) === factionId);
}

function getPlayer(match, accountId) {
  const players = Array.isArray(match.players) ? match.players : [];
  return players.find((p) => p.accountId === accountId) || null;
}

function getOpponent(match, accountId) {
  const players = Array.isArray(match.players) ? match.players : [];
  return players.find((p) => p.accountId !== accountId) || null;
}

async function findMatchForCommand(tournamentInput, roundInput, playerInput) {
  const tournamentName = String(tournamentInput || '').trim().toLowerCase();
  const round = String(roundInput || '').trim().toLowerCase();
  const playerName = String(playerInput || '').trim().toLowerCase();

  if (!tournamentName || !round || !playerName) {
    return null;
  }

  const tournaments = await readJsonFile(TOURNAMENTS_FILE, []);
  const list = Array.isArray(tournaments) ? tournaments : [];

  const candidates = list.filter((t) => {
    const name = String(t.name || '').trim().toLowerCase();
    if (!name) return false;
    return name === tournamentName || name.includes(tournamentName) || tournamentName.includes(name);
  });

  const search = candidates.length ? candidates : list;

  for (const tournament of search) {
    const matches = Array.isArray(tournament.matches) ? tournament.matches : [];
    for (const match of matches) {
      const roundName = String(match.round || '').trim().toLowerCase();
      if (roundName) {
        if (!roundName.includes(round) && !round.includes(roundName)) {
          continue;
        }
      }

      const players = Array.isArray(match.players) ? match.players : [];
      const foundPlayer = players.find((p) => {
        const display = String(p.displayName || p.accountId || '').trim().toLowerCase();
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
      ].join('\n'),
    )
    .setColor(0x2b2d31);

  players.forEach((player) => {
    const selection = match.selections?.[player.accountId] || null;
    const bans = match.bans?.[player.accountId] || [];
    const picks = Array.isArray(selection?.battlegroups) ? selection.battlegroups : [];
    const name =
      player.accountId === focusAccountId
        ? `${player.displayName} (이 메시지로 조작 중)`
        : player.displayName;
    embed.addFields({
      name,
      value: [
        `레디: ${player.ready ? '준비 완료' : '대기 중'}`,
        `밴: ${bans.length ? bans.map(formatBattlegroupId).join(', ') : '없음'}`,
        `픽: ${picks.length ? picks.map(formatBattlegroupId).join(', ') : '없음'}`,
        `픽 확정: ${selection?.confirmed ? '예' : '아니오'}`,
      ].join('\n'),
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

  embed.setTimestamp(new Date());

  return embed;
}

async function updateMatch(tournamentId, matchId, updater) {
  const tournaments = await readJsonFile(TOURNAMENTS_FILE, []);
  const list = Array.isArray(tournaments) ? tournaments : [];

  const tournament = list.find((t) => t.id === tournamentId);
  if (!tournament) {
    return { error: '토너먼트를 찾을 수 없습니다.' };
  }
  const matches = Array.isArray(tournament.matches) ? tournament.matches : [];
  const match = matches.find((m) => m.id === matchId);
  if (!match) {
    return { error: '경기를 찾을 수 없습니다.', tournament };
  }

  const result = await updater(tournament, match);
  if (result && result.modified) {
    await writeJsonFile(TOURNAMENTS_FILE, list);
  }

  return { tournament, match, ...result };
}

function parseCustomId(customId) {
  if (typeof customId !== 'string') return null;
  const parts = customId.split(':');
  if (parts.length !== 4) return null;
  const [action, tournamentId, matchId, accountId] = parts;
  return { action, tournamentId, matchId, accountId };
}

function buildControlComponents(payload, builders) {
  const { tournament, match, focusAccountId } = payload;
  const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = builders;

  const selection = match.selections?.[focusAccountId] || null;
  const player = getPlayer(match, focusAccountId);
  const phase = match.phase || 'waiting';

  const rows = [];

  // 1) 레디 버튼 (waiting / ready-check 단계에서만 활성)
  if (player) {
    const readyDisabled =
      player.ready || (phase !== 'waiting' && phase !== 'ready-check');
    const readyRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ready:${tournament.id}:${match.id}:${focusAccountId}`)
        .setLabel('준비 완료')
        .setStyle(ButtonStyle.Success)
        .setDisabled(readyDisabled),
    );
    rows.push(readyRow);
  }

  // 2) 밴 단계: phase === 'banning' 일 때만 노출
  if (phase === 'banning') {
    const banRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`ban:${tournament.id}:${match.id}:${focusAccountId}`)
        .setPlaceholder('밴 전투단 선택 (최대 4개)')
        .setMinValues(1)
        .setMaxValues(MAX_BAN_PER_PLAYER)
        .addOptions(
          BATTLEGROUP_IDS.map((id) => ({
            label: id,
            value: id,
          })),
        ),
    );
    rows.push(banRow);
  }

  // 3) 픽 단계: phase === 'picking' 이거나, locked 이지만 아직 내 픽이 확정되지 않은 경우
  const canPick =
    phase === 'picking' || (phase === 'locked' && selection && !selection.confirmed);

  if (canPick && player) {
    const factionIds = getFactionIds();
    const factionRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`faction:${tournament.id}:${match.id}:${focusAccountId}`)
        .setPlaceholder(selection?.faction ? selection.faction : '진영 선택')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          factionIds.map((id) => ({
            label: id,
            value: id,
            default: selection?.faction === id,
          })),
        ),
    );
    rows.push(factionRow);

    const picksDisabled = !selection || !selection.faction;
    const pickRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`pick:${tournament.id}:${match.id}:${focusAccountId}`)
        .setPlaceholder('전투단 픽 선택 (최대 3개)')
        .setMinValues(1)
        .setMaxValues(MAX_PICK_SELECTION)
        .setDisabled(picksDisabled)
        .addOptions(
          (selection && selection.faction
            ? getBattlegroupsByFaction(selection.faction)
            : BATTLEGROUP_IDS
          ).map((id) => ({
            label: id,
            value: id,
          })),
        ),
    );
    rows.push(pickRow);

    const confirmDisabled =
      !selection ||
      !selection.faction ||
      !Array.isArray(selection.battlegroups) ||
      selection.battlegroups.length !== MAX_PICK_SELECTION ||
      selection.confirmed;

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirm:${tournament.id}:${match.id}:${focusAccountId}`)
        .setLabel('픽 확정')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(confirmDisabled),
    );
    rows.push(buttonRow);
  }

  return rows;
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
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
  } = Discord;

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  const commands = [
    {
      name: 'tournament',
      description: '지정한 토너먼트/라운드/플레이어의 대회 정보를 보여줍니다.',
      options: [
        {
          type: 3,
          name: 'tournament',
          description: '토너먼트 이름',
          required: true,
        },
        {
          type: 3,
          name: 'round',
          description: '라운드 이름',
          required: true,
        },
        {
          type: 3,
          name: 'player',
          description: '해당 라운드에 참가한 플레이어 닉네임',
          required: true,
        },
      ],
    },
    {
      name: 'status',
      description: '서버 상태를 간단히 표시합니다.',
    },
  ];

  client.once(Events.ClientReady, async () => {
    info('Discord bot logged in', { user: client.user?.tag });
    try {
      const guildId = process.env.DISCORD_GUILD_ID;
      if (guildId) {
        const guild = await client.guilds.fetch(guildId);
        await guild.commands.set(commands);
      } else {
        await client.application.commands.set(commands);
      }
    } catch (error) {
      logError('Failed to register Discord slash commands', {
        message: error?.message,
      });
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'tournament') {
          const tournamentName = interaction.options.getString('tournament', true);
          const round = interaction.options.getString('round', true);
          const player = interaction.options.getString('player', true);

          const payload = await findMatchForCommand(tournamentName, round, player);
          if (!payload) {
            await interaction.reply({
              content: '해당 토너먼트 / 라운드 / 플레이어 조합의 경기를 찾지 못했습니다.\n이름을 다시 확인해 주세요.',
              ephemeral: true,
            });
            return;
          }

          const embed = buildTournamentEmbed(payload, EmbedBuilder);
          const components = buildControlComponents(payload, {
            ActionRowBuilder,
            StringSelectMenuBuilder,
            ButtonBuilder,
            ButtonStyle,
          });

          await interaction.reply({
            embeds: [embed],
            components,
          });
          return;
        }

        if (interaction.commandName === 'status') {
          const description = [
            `DATA_BACKEND: ${DATA_BACKEND}`,
            `DATA_BUCKET: ${DATA_BUCKET || '(none)'}`,
            `Uptime: ${Math.floor(process.uptime())}s`,
          ].join('\n');

          const embed = new EmbedBuilder().setTitle('서버 상태').setDescription(description);

          await interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
          return;
        }
      }

      if (interaction.isStringSelectMenu() || interaction.isButton()) {
        const meta = parseCustomId(interaction.customId);
        if (!meta) {
          return;
        }

        if (interaction.isStringSelectMenu()) {
          if (meta.action === 'ban') {
            const selected = interaction.values || [];
            if (!selected.length) {
              await interaction.reply({
                content: '최소 하나 이상의 전투단을 밴해야 합니다.',
                ephemeral: true,
              });
              return;
            }

            const unique = new Set(selected);
            if (unique.size !== selected.length) {
              await interaction.reply({
                content: '전투단을 중복으로 밴할 수 없습니다.',
                ephemeral: true,
              });
              return;
            }

            const result = await updateMatch(meta.tournamentId, meta.matchId, (tournament, match) => {
              if (!match.bans || typeof match.bans !== 'object') {
                match.bans = {};
              }
              match.bans[meta.accountId] = [...selected];
              // 두 플레이어 모두 밴을 완료했으면 픽 단계로 이동 (간소화된 조건)
              const players = Array.isArray(match.players) ? match.players : [];
              if (
                players.length === 2 &&
                players.every((p) => Array.isArray(match.bans[p.accountId]) && match.bans[p.accountId].length > 0)
              ) {
                match.phase = 'picking';
              }
              return { modified: true };
            });

            if (result.error) {
              await interaction.reply({
                content: result.error,
                ephemeral: true,
              });
              return;
            }

            const payload = {
              tournament: result.tournament,
              match: result.match,
              focusAccountId: meta.accountId,
            };
            const embed = buildTournamentEmbed(payload, EmbedBuilder);
            const components = buildControlComponents(payload, {
              ActionRowBuilder,
              StringSelectMenuBuilder,
              ButtonBuilder,
              ButtonStyle,
            });

            await interaction.update({
              embeds: [embed],
              components,
            });
            return;
          }

          if (meta.action === 'faction') {
            const [value] = interaction.values || [];
            if (!value) {
              await interaction.reply({
                content: '진영을 선택해야 합니다.',
                ephemeral: true,
              });
              return;
            }

            const factionIds = getFactionIds();
            if (!factionIds.includes(value)) {
              await interaction.reply({
                content: '알 수 없는 진영입니다.',
                ephemeral: true,
              });
              return;
            }

            const result = await updateMatch(meta.tournamentId, meta.matchId, (_tournament, match) => {
              if (!match.selections || typeof match.selections !== 'object') {
                match.selections = {};
              }
              const selection =
                match.selections[meta.accountId] || {
                  faction: null,
                  battlegroups: [],
                  confirmed: false,
                  confirmedAt: null,
                };
              selection.faction = value;
              selection.battlegroups = [];
              selection.confirmed = false;
              selection.confirmedAt = null;
              match.selections[meta.accountId] = selection;
              return { modified: true };
            });

            if (result.error) {
              await interaction.reply({
                content: result.error,
                ephemeral: true,
              });
              return;
            }

            const payload = {
              tournament: result.tournament,
              match: result.match,
              focusAccountId: meta.accountId,
            };
            const embed = buildTournamentEmbed(payload, EmbedBuilder);
            const components = buildControlComponents(payload, {
              ActionRowBuilder,
              StringSelectMenuBuilder,
              ButtonBuilder,
              ButtonStyle,
            });

            await interaction.update({
              embeds: [embed],
              components,
            });
            return;
          }

          if (meta.action === 'pick') {
            const selected = interaction.values || [];
            if (!selected.length) {
              await interaction.reply({
                content: '최소 하나 이상의 전투단을 선택해야 합니다.',
                ephemeral: true,
              });
              return;
            }

            if (selected.length > MAX_PICK_SELECTION) {
              await interaction.reply({
                content: `최대 ${MAX_PICK_SELECTION}개까지만 픽할 수 있습니다.`,
                ephemeral: true,
              });
              return;
            }

            const unique = new Set(selected);
            if (unique.size !== selected.length) {
              await interaction.reply({
                content: '전투단은 중복될 수 없습니다.',
                ephemeral: true,
              });
              return;
            }

            const result = await updateMatch(meta.tournamentId, meta.matchId, (_tournament, match) => {
              if (!match.selections || typeof match.selections !== 'object') {
                match.selections = {};
              }
              const selection =
                match.selections[meta.accountId] || {
                  faction: null,
                  battlegroups: [],
                  confirmed: false,
                  confirmedAt: null,
                };

              if (!selection.faction) {
                return {
                  modified: false,
                  error: '먼저 진영을 선택해야 합니다.',
                };
              }

              const opponent = getOpponent(match, meta.accountId);
              const opponentBans =
                (opponent && match.bans && match.bans[opponent.accountId]) || [];

              for (const id of selected) {
                const factionId = getFactionFromId(id);
                if (factionId !== selection.faction) {
                  return {
                    modified: false,
                    error: '전투단은 선택한 진영에 속해야 합니다.',
                  };
                }
                if (Array.isArray(opponentBans) && opponentBans.includes(id)) {
                  return {
                    modified: false,
                    error: '상대가 밴한 전투단은 선택할 수 없습니다.',
                  };
                }
              }

              selection.battlegroups = [...selected];
              selection.confirmed = false;
              selection.confirmedAt = null;
              match.selections[meta.accountId] = selection;
              return { modified: true };
            });

            if (result.error) {
              await interaction.reply({
                content: result.error,
                ephemeral: true,
              });
              return;
            }

            const payload = {
              tournament: result.tournament,
              match: result.match,
              focusAccountId: meta.accountId,
            };
            const embed = buildTournamentEmbed(payload, EmbedBuilder);
            const components = buildControlComponents(payload, {
              ActionRowBuilder,
              StringSelectMenuBuilder,
              ButtonBuilder,
              ButtonStyle,
            });

            await interaction.update({
              embeds: [embed],
              components,
            });
            return;
          }
        }

        if (interaction.isButton()) {
          if (meta.action === 'ready') {
            const result = await updateMatch(meta.tournamentId, meta.matchId, (tournament, match) => {
              const player = getPlayer(match, meta.accountId);
              if (!player || player.ready) {
                return { modified: false };
              }
              player.ready = true;
              player.readyAt = new Date().toISOString();

              if (match.phase === 'waiting') {
                match.phase = 'ready-check';
              }

              const players = Array.isArray(match.players) ? match.players : [];
              if (
                players.length === 2 &&
                players.every((p) => p.ready) &&
                !match.map
              ) {
                const pool =
                  Array.isArray(tournament.mapPool) && tournament.mapPool.length
                    ? tournament.mapPool
                    : [];
                if (pool.length) {
                  match.map = pool[Math.floor(Math.random() * pool.length)];
                  match.mapDecidedAt = new Date().toISOString();
                }
                match.phase = 'banning';
                tournament.status = 'live';
              }

              return { modified: true };
            });

            if (result.error) {
              await interaction.reply({
                content: result.error,
                ephemeral: true,
              });
              return;
            }

            const payload = {
              tournament: result.tournament,
              match: result.match,
              focusAccountId: meta.accountId,
            };
            const embed = buildTournamentEmbed(payload, EmbedBuilder);
            const components = buildControlComponents(payload, {
              ActionRowBuilder,
              StringSelectMenuBuilder,
              ButtonBuilder,
              ButtonStyle,
            });

            await interaction.update({
              embeds: [embed],
              components,
            });
            return;
          }

          if (meta.action === 'confirm') {
            const result = await updateMatch(meta.tournamentId, meta.matchId, (_tournament, match) => {
              const selection = match.selections?.[meta.accountId];
              if (
                !selection ||
                !selection.faction ||
                !Array.isArray(selection.battlegroups) ||
                selection.battlegroups.length !== MAX_PICK_SELECTION
              ) {
                return {
                  modified: false,
                  error: `전투단을 정확히 ${MAX_PICK_SELECTION}개 선택한 후 확정할 수 있습니다.`,
                };
              }

              const opponent = getOpponent(match, meta.accountId);
              const opponentBans =
                (opponent && match.bans && match.bans[opponent.accountId]) || [];

              for (const id of selection.battlegroups) {
                const factionId = getFactionFromId(id);
                if (factionId !== selection.faction) {
                  return {
                    modified: false,
                    error: '전투단은 선택한 진영에 속해야 합니다.',
                  };
                }
                if (Array.isArray(opponentBans) && opponentBans.includes(id)) {
                  return {
                    modified: false,
                    error: '상대가 밴한 전투단은 선택할 수 없습니다.',
                  };
                }
              }

              selection.confirmed = true;
              selection.confirmedAt = new Date().toISOString();

              const players = Array.isArray(match.players) ? match.players : [];
              const allLocked = players.every((p) => {
                const sel = match.selections?.[p.accountId];
                return (
                  sel &&
                  sel.confirmed &&
                  Array.isArray(sel.battlegroups) &&
                  sel.battlegroups.length === MAX_PICK_SELECTION
                );
              });
              if (allLocked) {
                match.phase = 'locked';
              }

              return { modified: true };
            });

            if (result.error) {
              await interaction.reply({
                content: result.error,
                ephemeral: true,
              });
              return;
            }

            const payload = {
              tournament: result.tournament,
              match: result.match,
              focusAccountId: meta.accountId,
            };
            const embed = buildTournamentEmbed(payload, EmbedBuilder);
            const components = buildControlComponents(payload, {
              ActionRowBuilder,
              StringSelectMenuBuilder,
              ButtonBuilder,
              ButtonStyle,
            });

            await interaction.update({
              embeds: [embed],
              components,
            });
          }
        }
      }
    } catch (error) {
      logError('Discord interaction handler failed', { message: error?.message });
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            content: '디스코드 봇 처리 중 오류가 발생했습니다.',
            ephemeral: true,
          });
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


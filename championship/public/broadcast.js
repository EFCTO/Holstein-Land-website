(() => {
  const shared = window.COH_APP || {};

  const normalizeTournament =
    typeof shared.normalizeTournament === 'function'
      ? shared.normalizeTournament
      : (tournament) => normalizeTournamentFallback(tournament);

  const normalizeMatch =
    typeof shared.normalizeMatch === 'function'
      ? shared.normalizeMatch
      : (match) => normalizeMatchFallback(match);

  const describePhase =
    typeof shared.describePhase === 'function'
      ? shared.describePhase
      : (phase) => phase || '단계 정보 없음';

  const formatDateTime =
    typeof shared.formatDateTime === 'function'
      ? shared.formatDateTime
      : (value) => {
          if (!value) return '미정';
          try {
            return new Intl.DateTimeFormat('ko-KR', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(value));
          } catch (_e) {
            return String(value);
          }
        };

  const renderViewerSide =
    typeof shared.renderViewerSide === 'function'
      ? shared.renderViewerSide
      : null;

  const mapImageForName =
    typeof shared.mapImageForName === 'function'
      ? shared.mapImageForName
      : () => '/images/maps/map.png';

  const REALTIME_ENDPOINT = '/api/events';
  const STATUS_PRIORITY = { live: 0, scheduled: 1, completed: 2 };
  const PHASE_PRIORITY = {
    picking: 0,
    banning: 1,
    'map-selected': 2,
    'ready-check': 3,
    waiting: 4,
    locked: 5,
  };

  const state = {
    tournaments: [],
    selectedTournamentId: null,
    selectedMatchId: null,
    source: null,
    retryId: null,
    lastUpdated: null,
  };

  const dom = {};

  document.addEventListener('DOMContentLoaded', () => {
    cacheDom();
    bindEvents();
    refreshData().then(() => {
      render();
      startRealtime();
    });
  });

  function cacheDom() {
    dom.board = document.getElementById('broadcast-board');
    dom.tournamentSelect = document.getElementById('broadcast-tournament');
    dom.matchSelect = document.getElementById('broadcast-match');
    dom.refresh = document.getElementById('broadcast-refresh');
    dom.lastUpdate = document.getElementById('broadcast-last-update');
  }

  function bindEvents() {
    dom.tournamentSelect?.addEventListener('change', handleTournamentChange);
    dom.matchSelect?.addEventListener('change', handleMatchChange);
    dom.refresh?.addEventListener('click', () => {
      refreshData().then(render);
    });
    window.addEventListener('beforeunload', stopRealtime);
  }

  async function refreshData() {
    const tournaments = await fetchJson('/api/tournaments');
    applyTournamentData(tournaments);
  }

  function applyTournamentData(nextTournaments) {
    state.tournaments = normalizeTournamentList(nextTournaments);
    ensureSelection();
    state.lastUpdated = Date.now();
  }

  function normalizeTournamentList(list) {
    return (Array.isArray(list) ? list : []).map((item) =>
      normalizeTournament(item),
    );
  }

  function ensureSelection() {
    const tournaments = state.tournaments;
    let tournament =
      tournaments.find((t) => t.id === state.selectedTournamentId) ||
      pickDefaultTournament(tournaments);

    if (!tournament) {
      state.selectedTournamentId = null;
      state.selectedMatchId = null;
      return { tournament: null, match: null };
    }

    let match =
      tournament.matches.find((m) => m.id === state.selectedMatchId) ||
      pickDefaultMatch(tournament);

    state.selectedTournamentId = tournament.id;
    state.selectedMatchId = match ? match.id : null;

    return { tournament, match };
  }

  function pickDefaultTournament(tournaments) {
    if (!Array.isArray(tournaments) || !tournaments.length) return null;
    return [...tournaments].sort((a, b) => {
      const statusDiff =
        (STATUS_PRIORITY[a.status] ?? 3) - (STATUS_PRIORITY[b.status] ?? 3);
      if (statusDiff !== 0) return statusDiff;
      const aTime = a.startTime
        ? new Date(a.startTime).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bTime = b.startTime
        ? new Date(b.startTime).getTime()
        : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    })[0];
  }

  function pickDefaultMatch(tournament) {
    if (!tournament?.matches?.length) return null;
    return [...tournament.matches].sort((a, b) => {
      const phaseDiff =
        (PHASE_PRIORITY[a.phase] ?? 99) - (PHASE_PRIORITY[b.phase] ?? 99);
      if (phaseDiff !== 0) return phaseDiff;
      const aTime = a.scheduled
        ? new Date(a.scheduled).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bTime = b.scheduled
        ? new Date(b.scheduled).getTime()
        : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    })[0];
  }

  function render() {
    const selection = ensureSelection();
    renderSelectors(selection);
    renderBoard(selection);
    renderStatus();
  }

  function renderSelectors(selection) {
    if (!dom.tournamentSelect || !dom.matchSelect) return;

    if (!state.tournaments.length) {
      dom.tournamentSelect.innerHTML =
        '<option value="">토너먼트 없음</option>';
      dom.tournamentSelect.disabled = true;
      dom.matchSelect.innerHTML = '<option value=\"\">경기 없음</option>';
      dom.matchSelect.disabled = true;
      return;
    }

    dom.tournamentSelect.disabled = false;
    dom.tournamentSelect.innerHTML = state.tournaments
      .map(
        (tournament) => `
          <option value="${tournament.id}" ${
            tournament.id === state.selectedTournamentId ? 'selected' : ''
          }>${tournament.name}</option>
        `,
      )
      .join('');

    const tournament = selection.tournament;
    if (!tournament || !tournament.matches.length) {
      dom.matchSelect.innerHTML = '<option value=\"\">경기 없음</option>';
      dom.matchSelect.disabled = true;
      return;
    }

    dom.matchSelect.disabled = false;
    dom.matchSelect.innerHTML = tournament.matches
      .map(
        (match) => `
          <option value="${match.id}" ${
            match.id === state.selectedMatchId ? 'selected' : ''
          }>${match.round || '경기'} - ${match.players
          .map((p) => p.displayName)
          .join(' vs ')}</option>
        `,
      )
      .join('');
  }

  function renderBoard(selection) {
    if (!dom.board) return;
    const { tournament, match } = selection;

    if (!tournament || !match) {
      dom.board.innerHTML =
        '<p class="empty-state">표시할 경기가 없습니다.</p>';
      return;
    }

    dom.board.innerHTML = renderBroadcastBoard(tournament, match);
  }

  function renderBroadcastBoard(tournament, match) {
    const left = match.players[0] || null;
    const right = match.players[1] || null;
    const leftBans = left ? match.bans[left.accountId] || [] : [];
    const rightBans = right ? match.bans[right.accountId] || [] : [];
    const leftSelection = left ? match.selections[left.accountId] || null : null;
    const rightSelection = right
      ? match.selections[right.accountId] || null
      : null;
    const result = tournament.result || null;

    const mapName = match.map || '맵이 아직 정해지지 않았습니다';
    const mapSrc = match.map ? mapImageForName(match.map) : mapImageForName(null);

    return `
      <article class="match-card match-card--broadcast">
        <header class="match-card__header broadcast-header">
          <div>
            <p class="match-card__tournament">${tournament.name}</p>
            <h3 class="match-card__round">${match.round || '경기'}</h3>
            <p class="muted small">시작 시간: ${formatDateTime(
              match.scheduled || tournament.startTime,
            )}</p>
          </div>
          <div class="broadcast-phase">
            <span class="match-card__status match-card__status--${match.phase}">${describePhase(
              match.phase,
            )}</span>
            <p class="muted small">맵: ${mapName}</p>
          </div>
        </header>
        <div class="board-grid board-grid--broadcast">
          ${renderBroadcastSide(left, leftBans, leftSelection)}
          ${renderBroadcastSide(right, rightBans, rightSelection)}
        </div>
        <div class="broadcast-footer">
          <div class="broadcast-map">
            <strong>맵</strong>
            <div class="broadcast-map__content">
              <img
                class="broadcast-map__image"
                src="${mapSrc}"
                alt="${mapName} 미니맵"
              />
              <span class="broadcast-map__name">${mapName}</span>
            </div>
          </div>
          <div class="broadcast-ready">
            <strong>준비 상태</strong>
            <ul class="status-list status-list--compact">
              ${renderReadyItems(match)}
            </ul>
          </div>
          ${
            result
              ? `
          <div class="broadcast-result">
            <strong>결과</strong>
            <span class="broadcast-result__text">승리: ${
              result.winner?.displayName || '-'
            } · 패배: ${result.loser?.displayName || '-'}</span>
          </div>
          `
              : ''
          }
        </div>
      </article>
    `;
  }

  function renderBroadcastSide(player, bans, selection) {
    if (!player) {
      return `
        <div class="board-side">
          <p class="muted small">플레이어 없음</p>
        </div>
      `;
    }
    if (renderViewerSide) {
      return renderViewerSide(player, bans, selection);
    }
    return `
      <div class="board-side">
        <div class="board-header">
          <span>${player.displayName}</span>
          <span class="board-label">선택 정보</span>
        </div>
        <div class="card-row">
          <div class="muted small">선택 정보가 아직 없습니다.</div>
        </div>
      </div>
    `;
  }

  function renderReadyItems(match) {
    if (!Array.isArray(match.players) || !match.players.length) {
      return '<li class="muted small">참가자가 없습니다.</li>';
    }

    return match.players
      .map((player) => {
        const selection = match.selections?.[player.accountId];
        const locked =
          selection &&
          selection.confirmed &&
          Array.isArray(selection.battlegroups)
            ? selection.battlegroups.filter(Boolean).length
            : 0;
        const selectionLabel = locked
          ? `${locked}개 선택 완료`
          : '선택 대기';
        return `
          <li class="ready-row">
            <span>${player.displayName}</span>
            <span class="${
              player.ready
                ? 'status-pill status-pill--ready'
                : 'status-pill'
            }">${player.ready ? '준비 완료' : '대기'}</span>
            <span class="tag">${selectionLabel}</span>
          </li>
        `;
      })
      .join('');
  }

  function renderStatus() {
    if (!dom.lastUpdate) return;
    const count = state.tournaments.reduce(
      (acc, t) => acc + (t.matches?.length || 0),
      0,
    );
    const time = state.lastUpdated
      ? formatUpdateTime(state.lastUpdated)
      : '업데이트 대기 중';
    dom.lastUpdate.textContent = `${count}개 경기 · 마지막 업데이트: ${time}`;
  }

  function formatUpdateTime(timestamp) {
    try {
      return new Date(timestamp).toLocaleTimeString('ko-KR', {
        hour12: false,
      });
    } catch (_e) {
      return String(timestamp);
    }
  }

  function startRealtime() {
    if (typeof window.EventSource === 'undefined') {
      renderStatus();
      return;
    }
    stopRealtime();
    try {
      state.source = new EventSource(REALTIME_ENDPOINT);
      state.source.onmessage = (event) => {
        handleRealtime(event.data);
      };
      state.source.onerror = () => {
        scheduleReconnect();
      };
    } catch (_error) {
      scheduleReconnect();
    }
  }

  function stopRealtime() {
    if (state.source) {
      state.source.close();
      state.source = null;
    }
    if (state.retryId) {
      window.clearTimeout(state.retryId);
      state.retryId = null;
    }
  }

  function scheduleReconnect() {
    stopRealtime();
    if (state.retryId) return;
    state.retryId = window.setTimeout(() => {
      state.retryId = null;
      startRealtime();
    }, 4000);
  }

  function handleRealtime(raw) {
    if (!raw) return;
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (_e) {
      return;
    }
    if (!payload || typeof payload !== 'object') {
      return;
    }
    if (payload.type === 'tournaments') {
      applyTournamentData(payload.data);
      render();
    }
  }

  function handleTournamentChange(event) {
    state.selectedTournamentId = event.target.value || null;
    state.selectedMatchId = null;
    render();
  }

  function handleMatchChange(event) {
    state.selectedMatchId = event.target.value || null;
    render();
  }

  async function fetchJson(url) {
    try {
      const response = await fetch(url, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (_error) {
      return [];
    }
  }

  function normalizeTournamentFallback(tournament) {
    const matches = Array.isArray(tournament?.matches)
      ? tournament.matches.map((match) => normalizeMatch(match))
      : [];
    return {
      id: tournament?.id || `t-${Date.now().toString(36)}`,
      name: tournament?.name || '토너먼트',
      status: ['scheduled', 'live', 'completed'].includes(tournament?.status)
        ? tournament.status
        : 'scheduled',
      startTime: tournament?.startTime || null,
      streamLinks: tournament?.streamLinks || {},
      matches,
    };
  }

  function normalizeMatchFallback(match) {
    const players = Array.isArray(match?.players)
      ? match.players.map((p) => ({
          accountId: String(p.accountId),
          displayName: p.displayName || p.accountId,
          ready: Boolean(p.ready),
          readyAt: p.readyAt || null,
        }))
      : [];
    const selections =
      match?.selections && typeof match.selections === 'object'
        ? { ...match.selections }
        : {};
    const bans =
      match?.bans && typeof match.bans === 'object' ? { ...match.bans } : {};

    players.forEach((player) => {
      if (!Array.isArray(bans[player.accountId])) {
        bans[player.accountId] = [];
      }
      if (!selections[player.accountId]) {
        selections[player.accountId] = {
          faction: null,
          battlegroups: [],
          confirmed: false,
          confirmedAt: null,
        };
      }
      if (!Array.isArray(selections[player.accountId].battlegroups)) {
        selections[player.accountId].battlegroups = [];
      }
    });

    return {
      id: match?.id || `match-${Date.now().toString(36)}`,
      round: match?.round || '경기',
      scheduled: match?.scheduled || null,
      players,
      map: match?.map || null,
      mapDecidedAt: match?.mapDecidedAt || null,
      phase: match?.phase || 'waiting',
      selections,
      bans,
    };
  }
})();


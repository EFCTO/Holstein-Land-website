const MAX_BATTLEGROUP_SELECTION = 3;

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
      `폴란드 기병 전투단`,
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
      `이탈리아 파르티잔 전투단`,
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
      '크릭스마리네 전투단'
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

const IMAGE_PATHS = {
  map: '/images/maps/map.png',
  battlegroup: '/images/battlegroups/전투단.png',
};

// 맵 이름별 전용 미니맵 이미지 매핑
const MAP_IMAGE_BY_NAME = {
  '단장의 골목': '/images/maps/Heartbreak_Alley.png',
  '두 해변': '/images/maps/twin_beach_2p_mkii_mm_handmade.webp',
  '랑그로': '/images/maps/langres_2p_mm_handmade.webp',
  '볼로냐': '/images/maps/bologna_2p_mm_handmade.webp',
  '빌라 피오레': '/images/maps/villa_fiore_2p_mkii_mm_handmade.webp',
  '세무아': '/images/maps/semois_2p_mm_handmade.webp',
  '숲속 교차로': '/images/maps/crossing_in_the_woods_2p_mm_handmade.webp',
  '앙고빌 농장': '/images/maps/angoville_farms_2p_mm_handmade.webp',
  '자발 오솔길': '/images/maps/djebel_2p_mm_handmade.webp',
  '정원': '/images/maps/gardens_2p_mm_handmade.webp',
  '타란토 해안': '/images/maps/cliff_crossing_2p_mm_handmade.webp',
  '토스카나 포도밭': '/images/maps/tuscan_vineyard_2p_mm_handmade.webp',
  '튀니지로 가는 길': '/images/maps/desert_village_2p_mkiii_mm_handmade.webp',
  '파치노 교착점': '/images/maps/pachino_2p_mm_handmade.webp',
  '페몽빌': '/images/maps/faymonville_mm_handmade.webp',
};

// 전투단별 전용 아이콘 매핑 (지정되지 않은 전투단은 공통 아이콘 사용)
const BATTLEGROUP_IMAGE_BY_NAME = {
  // 영국
  '인도 포병 전투단': '/images/battlegroups/indian_artillery_uk_square.webp',
  '영국 중기갑 전투단': '/images/battlegroups/armored_uk_square.webp',
  '영국 공군 및 해군 전투단': '/images/battlegroups/air_and_sea_uk_square.webp',
  '오스트레일리아 수비 전투단': '/images/battlegroups/ausdefense_uk_square.webp',
  '캐나다 충격군 전투단': '/images/battlegroups/can_shock_uk_square.webp',
  '폴란드 기병 전투단': '/images/battlegroups/polish_cavalry_uk_square.webp',
  // 미국
  '중화기 전투단': '/images/battlegroups/special_weapons_us_square.webp',
  '공수 전투단': '/images/battlegroups/paratroopers_us_square.webp',
  '기갑 전투단': '/images/battlegroups/armored_us_square.webp',
  '특수 작전 전투단': '/images/battlegroups/spec_ops_us_square.webp',
  '고급 보병 전투단': '/images/battlegroups/infantry_us_square.webp',
  '이탈리아 파르티잔 전투단': '/images/battlegroups/italian_partisan_us_square.webp',
  // 국방군
  '루프트바페 전투단': '/images/battlegroups/luftwaffe_ger_square.webp',
  '기계화 전투단': '/images/battlegroups/mechanized_ger_square.webp',
  '전선 돌파 전투단': '/images/battlegroups/breakthrough_ger_square.webp',
  '이탈리아 해안 전투단': '/images/battlegroups/coastal_ger_square.webp',
  '공포 전투단': '/images/battlegroups/terror_ger_square.webp',
  '최후의 저항 전투단': '/images/battlegroups/last_stand_ger_square.webp',
  // 아프리카 군단
  '이탈리아 보병 전투단': '/images/battlegroups/italian_infantry_ak_square.webp',
  '이탈리아 제병협동 전투단': '/images/battlegroups/combined_arms_ak_square.webp',
  '기갑 지원 전투단': '/images/battlegroups/armored_ak_square.webp',
  '전장 첩보 전투단': '/images/battlegroups/dak_battlefield_ak_square.webp',
  '기갑엽병 지휘부 전투단': '/images/battlegroups/panzerjager_kommand_ak_square.webp',
  '크릭스마리네 전투단': '/images/battlegroups/kriegsmarine_ak_square.webp',
};

ALL_BATTLEGROUPS.forEach((bg) => {
  const image = BATTLEGROUP_IMAGE_BY_NAME[bg.name];
  bg.image = image || IMAGE_PATHS.battlegroup;
});

const DEFAULT_MAP_POOL = [
  '단장의 골목',
  '두 해변',
  '랑그로',
  '볼로냐',
  '빌라 피오레',
  '세무아',
  '숲속 교차로',
  '앙고빌 농장',
  '자발 오솔길',
  '정원',
  '타란토 해안',
  '토스카나 포도밭',
  '튀니지로 가는 길',
  '파치노 교착점',
  '페몽빌',
];

const STORAGE_KEYS = {
  users: 'coh3-users',
  tournaments: 'coh3-tournaments',
  session: 'coh3-session',
};

const MAX_BAN_PER_PLAYER = 1;
const MAX_PICK_SELECTION = 3;
const REALTIME_ENDPOINT = '/api/events';
const REALTIME_RECONNECT_DELAY = 5000;


let users = [];
let tournaments = [];
let realtimeSource = null;
let realtimeRetryId = null;

// 밴을 모두 선택하지 않았을 때 경고를 한 번만 띄우기 위한 상태
const banConfirmOverrides = new Set();

const state = {
  currentUserId: null,
  ui: {
    activeMatchId: null,
    signupTab: 'viewer',
  },
  tournaments,
};

const dom = {};

const IS_BROADCAST_PAGE =
  (document.body && document.body.dataset.broadcast === 'true') ||
  (document.documentElement && document.documentElement.dataset.broadcast === 'true');

if (!IS_BROADCAST_PAGE) {
  document.addEventListener('DOMContentLoaded', () => {
    initialize().catch((error) => console.error('Initialization failed', error));
  });
}

async function initialize() {
  cacheDom();
  bindEvents();
  await loadInitialData();
  await restoreSession();
  render();
  startRealtimeUpdates();
}

async function loadInitialData() {
  const [apiUsers, apiTournaments] = await Promise.all([
    fetchJson('/api/users'),
    fetchJson('/api/tournaments'),
  ]);

  users = mergeUsers(apiUsers);
  tournaments = mergeTournaments(apiTournaments);
  state.tournaments = tournaments;

  populateAdminPlayerOptions();
}

async function fetchJson(url) {
  try {
    const response = await fetch(url, { cache: 'no-store', credentials: 'include' });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Failed to fetch', url, error);
    return [];
  }
}

function mergeUsers(...sources) {
  const map = new Map();
  sources
    .filter((list) => Array.isArray(list))
    .forEach((list) => {
      list.forEach((user) => {
        if (user?.accountId) {
          map.set(user.accountId, normalizeUser(user));
        }
      });
    });
  return Array.from(map.values());
}

function mergeTournaments(...sources) {
  const map = new Map();
  sources
    .filter((list) => Array.isArray(list))
    .forEach((list) => {
      list.forEach((tournament) => {
        if (tournament?.id) {
          map.set(tournament.id, normalizeTournament(tournament));
        }
      });
    });
  return Array.from(map.values());
}

function normalizeUser(user) {
  return {
    accountId: String(user.accountId),
    displayName: user.displayName || user.accountId,
    role: ['player', 'viewer', 'admin'].includes(user.role) ? user.role : 'viewer',
    password: user.password || '',
    email: user.email || '',
    rank: user.role === 'player' ? user.rank || '언랭크' : null,
    seed: Boolean(user.seed),
  };
}

function normalizeTournament(tournament) {
  const normalized = {
    id:
      tournament.id ||
      `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: tournament.name || '토너먼트',
    startTime: tournament.startTime || null,
    status: ['scheduled', 'live', 'completed'].includes(tournament.status)
      ? tournament.status
      : 'scheduled',
    result: tournament.result || null,
    streamLinks: {
      withgo: tournament.streamLinks?.withgo || '',
      soop: tournament.streamLinks?.soop || '',
    },
    mapPool:
      Array.isArray(tournament.mapPool) && tournament.mapPool.length
        ? [...tournament.mapPool]
        : [...DEFAULT_MAP_POOL],
    matches: Array.isArray(tournament.matches)
      ? tournament.matches.map((match) => normalizeMatch(match))
      : [],
  };

  if (!normalized.matches.length) {
    normalized.matches.push(createEmptyMatch());
  }

  return normalized;
}

function createEmptyMatch() {
  return normalizeMatch({
    id: `match-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    round: '경기',
    scheduled: null,
    players: [],
    map: null,
    mapDecidedAt: null,
    phase: 'waiting',
    selections: {},
    bans: {},
  });
}

function handleModalBackdrop(event) {
  if (event.target.classList.contains('modal-backdrop')) {
    closeModal(event.currentTarget);
  }
}

function openModal(modal) {
  if (!modal) {
    return;
  }
  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  const focusable = modal.querySelector('input, button');
  focusable?.focus();
}

function closeModal(modal) {
  if (!modal) {
    return;
  }
  modal.classList.add('hidden');
  if (![dom.loginModal, dom.signupModal].some((item) => item && !item.classList.contains('hidden'))) {
    document.body.classList.remove('modal-open');
  }
}

function closeAllModals() {
  [dom.loginModal, dom.signupModal].forEach((modal) => closeModal(modal));
}

function switchSignupTab(target) {
  if (!target || state.ui.signupTab === target) {
    return;
  }
  state.ui.signupTab = target;
  dom.signupTabButtons.forEach((button) => {
    const active = button.dataset.signupTab === target;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  dom.signupForms.forEach((form) => {
    const active = form.dataset.signupForm === target;
    form.classList.toggle('hidden', !active);
  });
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const formData = new FormData(dom.loginForm);
  const account = formData.get('account')?.toString().trim();
  const password = formData.get('password')?.toString() || '';

  if (!account || !password) {
    showToast('계정과 비밀번호를 입력하세요.', 'error');
    return;
  }

  // 서버 인증 우선 시도
  try {
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ accountId: account, password }),
    });
    if (resp.ok) {
      const user = await resp.json();
      state.currentUserId = user.accountId;
      state.ui.activeMatchId = user.role === 'player' ? findFirstMatchId(user.accountId) : null;
      closeModal(dom.loginModal);
      render();
      showToast(`${user.displayName}님 환영합니다.`, 'success');
      return;
    }
  } catch (_err) {
    // 서버 미응답 시, 기존 로직으로 진행
  }

  // Legacy admin fallback removed; rely on server authentication.

  const user = findUser(account);
  if (!user || user.password !== password) {
    // no-op: server auth handles sessions
    showToast('계정 정보를 다시 확인하세요.', 'error');
    return;
  }

  state.currentUserId = user.accountId;
  state.ui.activeMatchId = user.role === 'player' ? findFirstMatchId(user.accountId) : null;
  // no-op: server auth handles sessions
  closeModal(dom.loginModal);
  render();
  showToast(`${user.displayName}님 환영합니다.`, 'success');
}

function handleLogout() {
  state.currentUserId = null;
  state.ui.activeMatchId = null;
  fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  render();
  showToast('로그아웃되었습니다.', 'success');
}

async function handleViewerSignupSubmit(event) {
  event.preventDefault();
  const formData = new FormData(dom.signupViewerForm);
  const accountId = formData.get('accountId')?.toString().trim();
  const password = formData.get('password')?.toString() || '';
  const email = formData.get('email')?.toString().trim();

  if (!accountId || !password || !email) {
    showToast('모든 항목을 입력하세요.', 'error');
    return;
  }

  if (findUser(accountId)) {
    showToast('이미 사용 중인 계정 ID입니다.', 'error');
    return;
  }

  try {
    const createdUser = await createUserAccount({
      accountId,
      displayName: accountId,
      password,
      email,
      role: 'viewer',
    });
    upsertUserList(createdUser);
    saveUsersToStorage();
    populateAdminPlayerOptions();
    dom.signupViewerForm.reset();
    showToast('계정이 생성되었습니다. 로그인하세요.', 'success');
    closeModal(dom.signupModal);
    openModal(dom.loginModal);
    prefillLoginForm(createdUser.accountId || accountId);
  } catch (error) {
    const message =
      error instanceof Error && error.message ? error.message : '계정을 생성할 수 없습니다.';
    showToast(message, 'error');
  }
}

async function handlePlayerSignupSubmit(event) {
  event.preventDefault();
  const formData = new FormData(dom.signupPlayerForm);
  const nickname = formData.get('nickname')?.toString().trim();
  const password = formData.get('password')?.toString() || '';
  const rank = formData.get('rank')?.toString().trim();

  if (!nickname || !password || !rank) {
    showToast('닉네임, 비밀번호, 최대 티어를 입력하세요.', 'error');
    return;
  }

  if (findUser(nickname)) {
    showToast('이미 등록된 닉네임입니다.', 'error');
    return;
  }

  try {
    const createdUser = await createUserAccount({
      accountId: nickname,
      displayName: nickname,
      password,
      role: 'player',
      rank,
      email: '',
    });
    upsertUserList(createdUser);
    saveUsersToStorage();
    populateAdminPlayerOptions();
    dom.signupPlayerForm.reset();
    showToast('플레이어 계정이 생성되었습니다. 로그인하세요.', 'success');
    closeModal(dom.signupModal);
    openModal(dom.loginModal);
    prefillLoginForm(createdUser.accountId || nickname);
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : '플레이어 계정을 생성할 수 없습니다.';
    showToast(message, 'error');
  }
}

function prefillLoginForm(accountId) {
  const accountInput = dom.loginForm?.querySelector('[name="account"]');
  const passwordInput = dom.loginForm?.querySelector('[name="password"]');
  if (accountInput) {
    accountInput.value = accountId;
  }
  passwordInput?.focus();
}

function render() {
  renderActiveUser();
  renderDashboards();
}

function renderActiveUser() {
  const container = dom.activeUser;
  if (!container) {
    return;
  }

  const user = getActiveUser();
  if (!user) {
    container.classList.add('hidden');
    container.innerHTML = '';
    dom.panelCta?.classList.remove('hidden');
    return;
  }

  const extras = [];
  const roleLabel =
    user.role === 'admin' ? '관리자' : user.role === 'player' ? '플레이어' : '시청자';
  if (user.role === 'player' && user.rank) {
    extras.push(`최대 티어 ${user.rank}`);
  }
  if (user.role === 'viewer' && user.email) {
    extras.push(user.email);
  }
  if (user.role === 'admin') {
    extras.push('토너먼트 관리 권한');
  }

  container.innerHTML = `
    <div class="active-user__details">
      <p>
        <strong>${user.displayName}</strong> · ${roleLabel}
      </p>
      ${extras.length ? `<p class="active-user__meta">${extras.join(' · ')}</p>` : ''}
    </div>
    <button type="button" class="text-button" data-action="logout">로그아웃</button>
  `;
  container.classList.remove('hidden');
  dom.panelCta?.classList.add('hidden');
}

function renderDashboards() {
  const user = getActiveUser();
  togglePanel(dom.playerDashboard, user?.role === 'player');
  togglePanel(dom.viewerDashboard, user?.role === 'viewer');
  togglePanel(dom.adminDashboard, user?.role === 'admin');

  if (!user) {
    return;
  }

  if (user.role === 'player') {
    renderPlayerSchedule(user);
    renderPlayerMatchFlow();
  }

  if (user.role === 'viewer') {
    renderViewerTournaments();
  }

  if (user.role === 'admin') {
    renderAdminTournaments();
  }
}

function togglePanel(panel, show) {
  if (!panel) {
    return;
  }
  panel.classList.toggle('hidden', !show);
}

function renderPlayerSchedule(user) {
  const wrapper = dom.playerSchedule;
  if (!wrapper) {
    return;
  }
  const matches = getPlayerMatches(user);
  if (!matches.length) {
    wrapper.innerHTML = '<p class="empty-state">예정된 경기가 없습니다.</p>';
    state.ui.activeMatchId = null;
    return;
  }

  if (!matches.some(({ match }) => match.id === state.ui.activeMatchId)) {
    state.ui.activeMatchId = matches[0].match.id;
  }

  wrapper.innerHTML = matches
    .map(({ tournament, match, player }) => {
      const opponent = getOpponentPlayer(match, player.accountId);
      const readyLabel = player.ready ? '준비 완료' : '대기 중';
      const isFocused = match.id === state.ui.activeMatchId;
      return `
        <article class="match-card${isFocused ? ' match-card--active' : ''}">
          <header class="match-card__header">
            <div>
              <p class="match-card__tournament">${tournament.name}</p>
              <h3 class="match-card__round">${match.round || '경기'}</h3>
            </div>
            <span class="match-card__status match-card__status--${match.phase}">${describePhase(match.phase)}</span>
          </header>
          <dl class="match-card__meta">
            <div>
              <dt>시작 시간</dt>
              <dd>${formatDateTime(match.scheduled || tournament.startTime)}</dd>
            </div>
            <div>
              <dt>상대</dt>
              <dd>${opponent?.displayName || '미정'}</dd>
            </div>
            <div>
              <dt>내 상태</dt>
              <dd>${readyLabel}</dd>
            </div>
          </dl>
          <div class="match-card__actions">
            ${
              player.ready
                ? '<span class="status-pill status-pill--ready">준비 완료</span>'
                : `<button class="primary-button compact" data-action="ready" data-match-id="${match.id}" data-account-id="${player.accountId}">준비 완료 표시</button>`
            }
            <button class="secondary-button compact" data-action="focus" data-match-id="${match.id}">자세히 보기</button>
          </div>
        </article>
      `;
    })
    .join('');
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

function renderPlayerMatchFlow() {
  const wrapper = dom.playerMatchFlow;
  if (!wrapper) {
    return;
  }
  const entry = getActiveMatchEntry();
  if (!entry) {
    wrapper.innerHTML = '<p class="empty-state">상세 정보를 보려면 경기를 선택하세요.</p>';
    return;
  }

  const { tournament, match, player } = entry;
  const opponent = getOpponentPlayer(match, player.accountId);
  const myBans = match.bans[player.accountId] || [];
  const opponentBans = opponent ? match.bans[opponent.accountId] || [] : [];
  const mySelection = match.selections[player.accountId];
  const opponentSelection = opponent ? match.selections[opponent.accountId] : null;

  wrapper.innerHTML = `
    <article class="flow-card">
      <header class="flow-card__header">
        <div>
          <p class="match-card__tournament">${tournament.name}</p>
          <h3 class="match-card__round">${match.round || '경기'}</h3>
        </div>
        <span class="match-card__status match-card__status--${match.phase}">${describePhase(match.phase)}</span>
      </header>
      ${renderReadyStatus(match)}
      ${renderMapSection(match)}
      ${renderSelectionSection(match, player, opponent, opponentBans, mySelection, opponentSelection)}
      ${renderBanSection(match, player, myBans, opponentBans)}
    </article>
  `;
}

function renderReadyStatus(match) {
  const items = match.players
    .map(
      (p) => `
      <li>
        <span>${p.displayName}</span>
        <span class="${p.ready ? 'status-pill status-pill--ready' : 'status-pill'}">${p.ready ? '준비 완료' : '대기'}</span>
      </li>
    `,
    )
    .join('');
  return `
    <section class="flow-block">
      <h3>준비 상태</h3>
      <ul class="status-list">${items}</ul>
    </section>
  `;
}

function renderMapSection(match) {
  const imageSrc =
    match.map && MAP_IMAGE_BY_NAME[match.map]
      ? MAP_IMAGE_BY_NAME[match.map]
      : IMAGE_PATHS.map;
  const altText = match.map ? `${match.map} 미리보기` : '맵 미리보기';
  return `
    <section class="flow-block">
      <h3>선택된 맵</h3>
      <figure class="media-card ${match.map ? '' : 'media-card--pending'}">
        <img src="${imageSrc}" alt="${altText}" loading="lazy" />
        <figcaption>${match.map || '추첨 대기 중'}</figcaption>
      </figure>
    </section>
  `;
}

function renderBanSection(match, player, myBans, opponentBans) {
  const myBanList = myBans.length
    ? `<div class="card-row">${myBans.map((id) => viewerTile(id, 'ban')).join('')}</div>`
    : '<p class="muted small">제출된 밴이 없습니다.</p>';
  const opponentBanList = opponentBans.length
    ? `<div class="card-row">${opponentBans.map((id) => viewerTile(id, 'ban')).join('')}</div>`
    : '<p class="muted small">상대가 밴을 제출하지 않았습니다.</p>';

  const activeUser = getActiveUser();
  const showForm =
    match.phase === 'banning' &&
    activeUser?.accountId === player.accountId &&
    myBans.length < MAX_BAN_PER_PLAYER;

  const form = showForm ? renderBanForm(match, player, myBans) : '';

  return `
    <section class="flow-block">
      <h3>밴 단계</h3>
      <div class="ban-columns">
        <article>
          <h4>내 밴</h4>
          ${myBanList}
        </article>
        <article>
          <h4>상대 밴</h4>
          ${opponentBanList}
        </article>
      </div>
      ${form}
    </section>
  `;
}

function renderBanForm(match, player, currentBans) {
  // 현재 밴 목록을 슬롯 개수에 맞춰 정규화 (최대 개수 초과분 제거)
  const values = [...currentBans].slice(0, MAX_BAN_PER_PLAYER);
  while (values.length < MAX_BAN_PER_PLAYER) {
    values.push('');
  }

  const selects = values
    .map((value, index) => {
      const name = `ban${index + 1}`;
      const taken = values.filter((_, slot) => slot !== index && values[slot]);
      return renderBanSelect(name, value, taken);
    })
    .join('');

  return `
    <form class="stacked-form ban-form" data-form="ban" data-match-id="${match.id}" data-player-id="${player.accountId}">
      <h4>밴할 전투단을 하나 선택하세요</h4>
      ${selects}
      <button type="submit" class="primary-button">Confirm Bans</button>
    </form>
  `;
}

function renderBanSelect(name, value, takenIds = []) {
  const takenFactions = new Set(
    takenIds.map((id) => BATTLEGROUP_MAP.get(id)?.factionId || null).filter(Boolean),
  );

  const options = ALL_BATTLEGROUPS.map((bg) => {
    const selected = bg.id === value;
    const disabled = !selected && (takenIds.includes(bg.id) || takenFactions.has(bg.factionId));
    return `<option value="${bg.id}" ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}>${bg.label}</option>`;
  }).join('');

  const labelIndex = Number.parseInt(name.replace('ban', ''), 10);
  return `
    <div class="form-row">
      <label for="${name}">밴 ${labelIndex}</label>
      <select id="${name}" name="${name}">
        <option value="">전투단 선택</option>
        ${options}
      </select>
    </div>
  `;
}

function renderSelectionSection(match, player, opponent, opponentBans, mySelection, opponentSelection) {
  const mySummary = renderSelectionSummary(mySelection, '내 픽');
  const opponentSummary = opponent ? renderOpponentSummary(opponentSelection, match) : '';
  const activeUser = getActiveUser();
  const showForm =
    (match.phase === 'picking' || (match.phase === 'locked' && !mySelection.confirmed)) &&
    activeUser?.accountId === player.accountId;

  const form = showForm ? renderSelectionForm(match, opponentBans, mySelection) : '';

  return `
    <section class="flow-block">
      <h3>픽 단계</h3>
      <div class="selection-columns">
        ${mySummary}
        ${opponentSummary}
      </div>
      ${form}
    </section>
  `;
}

function renderSelectionForm(match, opponentBans, selection) {
  const locked = match.phase === 'locked' && selection.confirmed;
  const factionOptions = [
    '<option value="">진영 선택</option>',
    ...FACTIONS.map(
      (faction) => `<option value="${faction.id}" ${selection.faction === faction.id ? 'selected' : ''}>${faction.name}</option>`,
    ),
  ].join('');

  const pickSelectors = renderBattlegroupPickers(selection, opponentBans, locked);

  return `
    <form class="stacked-form selection-form" data-form="selection">
      <h4>선택한 진영에서 전투단 ${MAX_PICK_SELECTION}개를 고르세요</h4>
      <div class="form-row">
        <label for="select-faction">진영</label>
        <select id="select-faction" name="faction" data-select="faction" required ${locked ? 'disabled' : ''}>
          ${factionOptions}
        </select>
      </div>
      ${pickSelectors}
      <p class="muted small">상대가 밴한 전투단은 선택할 수 없습니다.</p>
      <button type="submit" class="primary-button" ${locked ? 'disabled' : ''}>픽 확정</button>
    </form>
  `;
}

function renderBattlegroupPickers(selection, opponentBans, locked) {
  if (!selection.faction) {
    return '<p class="muted small">먼저 진영을 선택하세요.</p>';
  }

  const available = getBattlegroupsByFaction(selection.faction);
  const picks = selection.battlegroups || [];
  const slots = Array.from({ length: MAX_PICK_SELECTION }, (_, idx) => idx);

  return `
    <div class="form-grid">
      ${slots
        .map((index) => {
          const current = picks[index] || '';
          const takenIds = new Set(
            picks.map((id, idx) => (idx !== index ? id : null)).filter(Boolean),
          );
          const label = MAX_PICK_SELECTION === 1 ? '전투단' : `전투단 ${index + 1}`;

          const options = available
            .filter((bg) => !opponentBans.includes(bg.id) || bg.id === current)
            .map((bg) => {
              const selected = bg.id === current;
              const disabled = !selected && takenIds.has(bg.id);
              return `<option value="${bg.id}" ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}>${bg.label}</option>`;
            })
            .join('');

          return `
            <div class="form-row">
              <label for="pick${index + 1}">${label}</label>
              <select id="pick${index + 1}" name="pick${index + 1}" data-select="pick" data-pick-index="${index + 1}" ${locked ? 'disabled' : ''}>
                <option value="">전투단 선택</option>
                ${options}
              </select>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderSelectionSummary(selection, title) {
  if (!selection) {
    return `<article class="selection-summary"><h4>${title}</h4><p class="muted small">데이터 없음</p></article>`;
  }
  const factionLabel = selection.faction ? getFactionName(selection.faction) : '진영 미정';
  const picks = selection.battlegroups.length
    ? selection.battlegroups.map((id) => `<li>${formatBattlegroupLabel(id)}</li>`).join('')
    : '<li class="muted small">픽을 기다리는 중</li>';
  const status = selection.confirmed
    ? '<span class="tag tag--status">확정됨</span>'
    : '<span class="muted small">확정 대기 중</span>';

  return `
    <article class="selection-summary">
      <h4>${title}</h4>
      <p class="selection-faction">${factionLabel}</p>
      <ul class="pill-list">${picks}</ul>
      ${status}
    </article>
  `;
}

function renderOpponentSummary(selection, match) {
  if (!areSelectionsLocked(match)) {
    return `
      <article class="selection-summary">
        <h4>상대</h4>
        <p class="muted small">두 플레이어가 모두 확정할 때까지 숨김</p>
      </article>
    `;
  }
  return renderSelectionSummary(selection, '상대');
}

function renderViewerTournaments() {
  const container = dom.viewerTournaments;
  if (!container) {
    return;
  }
  const tournamentsList = state.tournaments.filter(isTournamentRelevantForViewer);
  if (!tournamentsList.length) {
    container.innerHTML = '<p class="empty-state">현재 진행 중인 토너먼트가 없습니다.</p>';
    return;
  }

  container.innerHTML = tournamentsList
    .map((tournament) =>
      tournament.matches.map((match) => renderViewerMatchBoard(tournament, match)).join(''),
    )
    .join('');
}

function renderViewerMatchBoard(tournament, match) {
  normalizeMatch(match);
  const streams = renderStreamButtons(tournament.streamLinks);
  const left = match.players[0];
  const right = match.players[1];
  const leftSelection = left ? match.selections[left.accountId] || null : null;
  const rightSelection = right ? match.selections[right.accountId] || null : null;
  const leftBans = left ? match.bans[left.accountId] || [] : [];
  const rightBans = right ? match.bans[right.accountId] || [] : [];

  return `
    <section class="match-card">
      <header class="match-card__header">
        <div>
          <p class="match-card__tournament">${tournament.name}</p>
          <h3 class="match-card__round">${match.round || '경기'}</h3>
        </div>
        <span class="match-card__status match-card__status--${match.phase}">${describePhase(match.phase)}</span>
      </header>
      ${streams}
      <div class="board-grid">
        ${renderViewerSide(left, leftBans, leftSelection)}
        ${right ? renderViewerSide(right, rightBans, rightSelection) : ''}
      </div>
    </section>
  `;
}

function renderViewerSide(player, bans, selection) {
  if (!player) {
    return '';
  }
  const banTiles = bans.length
    ? bans.map((id) => viewerTile(id, 'ban')).join('')
    : '<div class="muted small">밴 없음</div>';
  const pickRow = viewerPickRow(selection);

  return `
    <div class="board-side">
      <div class="board-header">
        <span>${player.displayName}</span>
        <span class="board-label">밴</span>
      </div>
      <div class="card-row">${banTiles}</div>
      <div class="board-label">픽</div>
      ${pickRow}
    </div>
  `;
}

function viewerTile(battlegroupId, kind) {
  const meta = BATTLEGROUP_MAP.get(battlegroupId);
  const label = meta ? meta.label : battlegroupId;
  const className = kind === 'ban' ? 'tile tile--ban' : 'tile tile--pick';
  const src = meta && meta.image ? meta.image : IMAGE_PATHS.battlegroup;
  return `
    <div class="${className}">
      <img class="tile__img" src="${src}" alt="${label}" />
      <div class="tile__cap">${label}</div>
    </div>
  `;
}

function viewerPickRow(selection) {
  if (!selection || !selection.faction) {
    return `
      <div class="pick-row">
        <div class="tile tile--faction"><div class="tile__circle">대기</div></div>
        <div class="card-row"><div class="muted small">픽을 기다리는 중</div></div>
      </div>
    `;
  }

  const factionLabel = getFactionName(selection.faction);
  const picks = selection.battlegroups.length
    ? selection.battlegroups.map((id) => viewerTile(id, 'pick')).join('')
    : '<div class="muted small">픽을 기다리는 중</div>';

  return `
    <div class="pick-row">
      <div class="tile tile--faction"><div class="tile__circle">${factionLabel}</div></div>
      <div class="card-row">${picks}</div>
    </div>
  `;
}

function renderAdminTournaments() {
  const container = dom.adminTournaments;
  if (!container) {
    return;
  }
  if (!state.tournaments.length) {
    container.innerHTML = '<p class="empty-state">생성된 토너먼트가 없습니다.</p>';
    return;
  }

  container.innerHTML = state.tournaments
    .map((tournament) => {
      const participants = getTournamentParticipants(tournament);
      const participantOptions = participants
        .map((player) => `<option value="${player.accountId}">${player.displayName}</option>`)
        .join('');

      const resultForm = participants.length >= 2
        ? `
          <form class="stacked-form result-form" data-action="record-result" data-tournament-id="${tournament.id}">
            <h4>결과 기록</h4>
            <div class="form-row">
              <label for="winner-${tournament.id}">승리자</label>
              <select id="winner-${tournament.id}" name="winner" required>
                <option value="">플레이어 선택</option>
                ${participantOptions}
              </select>
            </div>
            <div class="form-row">
              <label for="loser-${tournament.id}">패배자</label>
              <select id="loser-${tournament.id}" name="loser" required>
                <option value="">플레이어 선택</option>
                ${participantOptions}
              </select>
            </div>
            <button type="submit" class="primary-button">결과 저장</button>
          </form>
        `
        : '<p class="muted small">결과를 기록하려면 최소 두 명의 플레이어가 필요합니다.</p>';

      const matchesOverview = tournament.matches.length
        ? `<ul>${tournament.matches
            .map((match) => {
              const players = match.players.map((p) => p.displayName).join(' vs ');
              return `<li>${match.round || '경기'} · ${players} · ${describePhase(match.phase)}</li>`;
            })
            .join('')}</ul>`
        : '<p class="muted small">등록된 경기가 없습니다.</p>';

      const resultSummary = tournament.result
        ? `<p class="tournament-result">승리: ${tournament.result.winner.displayName} · 패배: ${tournament.result.loser.displayName}</p>`
        : '';

      return `
        <article class="tournament-admin-card">
          <header>
            <div>
              <h3>${tournament.name}</h3>
              <p>${formatDateTime(tournament.startTime)}</p>
            </div>
            <div class="status-selector">
              <label for="status-${tournament.id}">진행 상태</label>
              <select id="status-${tournament.id}" data-action="update-status" data-tournament-id="${tournament.id}">
                ${['scheduled', 'live', 'completed']
                  .map(
                    (value) =>
                      `<option value="${value}" ${tournament.status === value ? 'selected' : ''}>${describeTournamentStatus(value)}</option>`,
                  )
                  .join('')}
              </select>
            </div>
          </header>
          <section class="matches-overview">
            <h4>경기 요약</h4>
            ${matchesOverview}
          </section>
          ${resultSummary}
          ${resultForm}
        </article>
      `;
    })
    .join('');
}

function handlePlayerMatchFlowSubmit(event) {
  const form = event.target;
  if (form.dataset.form === 'ban') {
    event.preventDefault();
    handleBanSubmit(form);
    return;
  }
  if (form.dataset.form === 'selection') {
    event.preventDefault();
    handleSelectionSubmit(form);
  }
}

function handlePlayerMatchFlowChange(event) {
  const target = event.target;
  if (!target) {
    return;
  }
  const entry = getActiveMatchEntry();
  const user = getActiveUser();
  if (!entry || !user) {
    return;
  }

  const selection = entry.match.selections[user.accountId];
  if (!selection) {
    return;
  }

  if (target.dataset.select === 'faction') {
    selection.faction = target.value || null;
    selection.battlegroups = [];
    selection.confirmed = false;
    selection.confirmedAt = null;
    normalizeMatch(entry.match);
    renderPlayerMatchFlow();
    return;
  }

  if (target.dataset.select === 'pick') {
    const slot = Number.parseInt(target.dataset.pickIndex || '0', 10) - 1;
    if (Number.isNaN(slot) || slot < 0) {
      return;
    }
    if (!Array.isArray(selection.battlegroups)) {
      selection.battlegroups = [];
    }
    selection.battlegroups[slot] = target.value || '';
    selection.battlegroups = selection.battlegroups
      .map((id) => id || '')
      .slice(0, MAX_PICK_SELECTION);
    selection.confirmed = false;
    selection.confirmedAt = null;
    normalizeMatch(entry.match);
    renderPlayerMatchFlow();
  }
}

function handlePlayerReady(matchId, accountId) {
  const entry = findMatchEntry(matchId);
  if (!entry) {
    return;
  }
  const { match } = entry;
  const player = match.players.find((p) => p.accountId === accountId);
  if (!player || player.ready) {
    return;
  }

  player.ready = true;
  player.readyAt = new Date().toISOString();

  if (match.phase === 'waiting') {
    match.phase = 'ready-check';
  }

  if (match.players.every((p) => p.ready)) {
    beginMapSelection(match, entry.tournament);
  }

  const activeUser = getActiveUser();
  if (activeUser?.role === 'player') {
    renderPlayerSchedule(activeUser);
  }
  renderPlayerMatchFlow();
  renderViewerTournaments();
  saveTournamentsToStorage();
}

function beginMapSelection(match, tournament) {
  if (match.map) {
    return;
  }
  const pool = tournament.mapPool?.length ? tournament.mapPool : DEFAULT_MAP_POOL;
  match.map = pool[Math.floor(Math.random() * pool.length)];
  match.mapDecidedAt = new Date().toISOString();
  match.phase = 'map-selected';
  tournament.status = 'live';

  setTimeout(() => {
    match.phase = 'picking';
    renderPlayerMatchFlow();
    renderViewerTournaments();
    saveTournamentsToStorage();
  }, 5000);

  renderPlayerMatchFlow();
  renderViewerTournaments();
  saveTournamentsToStorage();
}

function handleBanSubmit(form) {
  const entry = getActiveMatchEntry();
  const user = getActiveUser();
  if (!entry || !user) {
    return;
  }

  const bans = [];
  for (let index = 1; index <= MAX_BAN_PER_PLAYER; index += 1) {
    const value = form.elements[`ban${index}`]?.value?.toString();
    if (!value) {
      continue;
    }
    if (!BATTLEGROUP_MAP.has(value)) {
      showToast('알 수 없는 전투단입니다.', 'error');
      return;
    }
    bans.push(value);
  }

  if (bans.length === 0) {
    showToast('최소 하나 이상의 전투단을 밴하세요.', 'error');
    return;
  }

  if (new Set(bans).size !== bans.length) {
    showToast('전투단을 중복으로 밴할 수 없습니다.', 'error');
    return;
  }

  const factions = bans.map((id) => BATTLEGROUP_MAP.get(id)?.factionId || null);
  if (new Set(factions).size !== bans.length) {
    showToast('진영마다 하나씩만 밴할 수 있습니다.', 'error');
    return;
  }

  // 밴을 모두 선택하지 않은 경우에는 경고 배너를 한 번만 표시
  if (bans.length < MAX_BAN_PER_PLAYER) {
    const matchKey = `${entry.match.id}:${user.accountId}`;
    if (!banConfirmOverrides.has(matchKey)) {
      banConfirmOverrides.add(matchKey);
      showToast(
        '밴이 모두 선택되지 않았습니다. 그래도 진행하시겠습니까?',
        'warning',
      );
    }
  }

  const match = entry.match;
  match.bans[user.accountId] = bans;
  cleanupSelectionsAfterBan(match);
  normalizeMatch(match);

  if (haveAllBans(match)) {
    match.phase = areSelectionsLocked(match) ? 'locked' : 'picking';
  }

  renderPlayerMatchFlow();
  renderViewerTournaments();
  saveTournamentsToStorage();
}

function handleSelectionSubmit(form) {
  const entry = getActiveMatchEntry();
  const user = getActiveUser();
  if (!entry || !user) {
    return;
  }

  const match = entry.match;
  const selection = match.selections[user.accountId];
  const opponent = getOpponentPlayer(match, user.accountId);
  const opponentBans = opponent ? match.bans[opponent.accountId] || [] : [];

  if (!selection.faction) {
    showToast('먼저 진영을 선택하세요.', 'error');
    return;
  }

  const picks = (selection.battlegroups || []).filter((id) => id);
  if (picks.length !== MAX_PICK_SELECTION) {
    showToast(`전투단을 정확히 ${MAX_PICK_SELECTION}개 선택하세요.`, 'error');
    return;
  }

  if (new Set(picks).size !== picks.length) {
    showToast('전투단은 중복될 수 없습니다.', 'error');
    return;
  }

  for (const id of picks) {
    const meta = BATTLEGROUP_MAP.get(id);
    if (!meta) {
      showToast('알 수 없는 전투단입니다.', 'error');
      return;
    }
    if (meta.factionId !== selection.faction) {
      showToast('전투단은 선택한 진영에 속해야 합니다.', 'error');
      return;
    }
    if (opponentBans.includes(id)) {
      showToast('상대가 밴한 전투단은 선택할 수 없습니다.', 'error');
      return;
    }
  }

  selection.battlegroups = picks;
  selection.confirmed = true;
  selection.confirmedAt = new Date().toISOString();

  if (areSelectionsLocked(match)) {
    match.phase = haveAllBans(match) ? 'locked' : 'banning';
  }

  renderPlayerMatchFlow();
  renderViewerTournaments();
  saveTournamentsToStorage();
}

function handleTournamentCreate(formData) {
  const name = formData.get('name')?.toString().trim();
  const start = formData.get('start')?.toString();
  const round = formData.get('round')?.toString().trim() || '경기';
  const player1Id = formData.get('player1')?.toString();
  const player2Id = formData.get('player2')?.toString();
  const withgo = formData.get('withgo')?.toString().trim() || '';
  const soop = formData.get('soop')?.toString().trim() || '';

  if (!name || !start || !player1Id || !player2Id) {
    showToast('토너먼트 이름, 시작 시간, 두 명의 플레이어를 입력하세요.', 'error');
    return;
  }

  if (player1Id === player2Id) {
    showToast('서로 다른 두 플레이어를 선택하세요.', 'error');
    return;
  }

  const player1 = findUser(player1Id);
  const player2 = findUser(player2Id);
  if (!player1 || !player2 || player1.role !== 'player' || player2.role !== 'player') {
    showToast('선택한 플레이어 중 한 명을 찾을 수 없습니다.', 'error');
    return;
  }

  const match = normalizeMatch({
    id: `match-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    round,
    scheduled: start,
    players: [
      { accountId: player1.accountId, displayName: player1.displayName, ready: false, readyAt: null },
      { accountId: player2.accountId, displayName: player2.displayName, ready: false, readyAt: null },
    ],
    map: null,
    phase: 'waiting',
    selections: {},
    bans: {},
  });

  const tournament = normalizeTournament({
    id: `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    startTime: start,
    status: 'scheduled',
    result: null,
    streamLinks: { withgo, soop },
    mapPool: DEFAULT_MAP_POOL,
    matches: [match],
  });

  state.tournaments.push(tournament);
  dom.tournamentForm?.reset();
  renderAdminTournaments();
  renderViewerTournaments();
  saveTournamentsToStorage();
  showToast('토너먼트가 생성되었습니다.', 'success');
}

function handleTournamentResultSubmit(formData, tournamentId) {
  const tournament = state.tournaments.find((item) => item.id === tournamentId);
  if (!tournament) {
    showToast('토너먼트를 찾을 수 없습니다.', 'error');
    return;
  }

  const winnerId = formData.get('winner')?.toString();
  const loserId = formData.get('loser')?.toString();

  if (!winnerId || !loserId) {
    showToast('승리자와 패배자를 모두 선택하세요.', 'error');
    return;
  }

  if (winnerId === loserId) {
    showToast('승리자와 패배자는 서로 달라야 합니다.', 'error');
    return;
  }

  const participants = getTournamentParticipants(tournament);
  const winner = participants.find((player) => player.accountId === winnerId);
  const loser = participants.find((player) => player.accountId === loserId);

  if (!winner || !loser) {
    showToast('선택한 플레이어를 찾을 수 없습니다.', 'error');
    return;
  }

  tournament.result = {
    winner,
    loser,
    recordedAt: new Date().toISOString(),
  };
  tournament.status = 'completed';

  renderAdminTournaments();
  renderViewerTournaments();
  saveTournamentsToStorage();
  showToast('결과가 기록되었습니다.', 'success');
}

function updateTournamentStatus(tournamentId, nextStatus) {
  const tournament = state.tournaments.find((item) => item.id === tournamentId);
  if (!tournament) {
    showToast('토너먼트를 찾을 수 없습니다.', 'error');
    return;
  }

  tournament.status = nextStatus;
  renderViewerTournaments();
  saveTournamentsToStorage();

  if (nextStatus === 'completed' && !tournament.result) {
    showToast('최종 결과 기록을 잊지 마세요.', 'info');
  } else {
    showToast('상태가 업데이트되었습니다.', 'success');
  }
}



function normalizeMatch(match) {
  const players = Array.isArray(match.players)
    ? match.players.map((player) => ({
        accountId: String(player.accountId),
        displayName: player.displayName || player.accountId,
        ready: Boolean(player.ready),
        readyAt: player.readyAt || null,
      }))
    : [];

  const selections =
    match.selections && typeof match.selections === 'object'
      ? { ...match.selections }
      : {};
  const bans =
    match.bans && typeof match.bans === 'object' ? { ...match.bans } : {};

  players.forEach((player) => {
    if (!Array.isArray(bans[player.accountId])) {
      bans[player.accountId] = [];
    }
    // 밴 슬롯 감소 시 기존 데이터에 남아있는 초과 밴 제거
    bans[player.accountId] = bans[player.accountId].slice(0, MAX_BAN_PER_PLAYER);

    const selection =
      selections[player.accountId] || {
        faction: null,
        battlegroups: [],
        confirmed: false,
        confirmedAt: null,
      };

    if (!Array.isArray(selection.battlegroups)) {
      selection.battlegroups = [];
    }

    selection.faction = selection.faction || null;
    selection.battlegroups = selection.battlegroups
      .filter((id) => id)
      .slice(0, MAX_PICK_SELECTION);

    const hasCompletePick = selection.battlegroups.length === MAX_PICK_SELECTION;
    selection.confirmed = Boolean(selection.confirmed && hasCompletePick);
    selection.confirmedAt = selection.confirmed ? selection.confirmedAt || null : null;

    selections[player.accountId] = selection;
  });

  return {
    id:
      match.id ||
      `match-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    round: match.round || '경기',
    scheduled: match.scheduled || null,
    players,
    map: match.map || null,
    mapDecidedAt: match.mapDecidedAt || null,
    phase: ['waiting', 'ready-check', 'map-selected', 'banning', 'picking', 'locked'].includes(
      match.phase,
    )
      ? match.phase
      : 'waiting',
    selections,
    bans,
  };
}

function loadUsersFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.users);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Unable to load users from storage', error);
    return [];
  }
}

function loadTournamentsFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.tournaments);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Unable to load tournaments from storage', error);
    return [];
  }
}

function saveUsersToStorage() {
  try {
    window.localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  } catch (error) {
    console.warn('Unable to persist users', error);
  }
}

async function createUserAccount(payload) {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      let message = '계정 생성에 실패했습니다.';
      try {
        const errorBody = await response.json();
        if (errorBody?.message) {
          message = errorBody.message;
        }
      } catch (parseError) {
        // ignore parsing issues and fall back to default message
      }
      throw new Error(message);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.message) {
      throw error;
    }
    throw new Error('계정 생성에 실패했습니다.');
  }
}

function upsertUserList(user) {
  if (!user) {
    return;
  }
  const normalized = normalizeUser(user);
  if (!normalized.accountId) {
    return;
  }
  const index = users.findIndex(
    (existing) =>
      existing.accountId.toLowerCase() === normalized.accountId.toLowerCase(),
  );
  if (index >= 0) {
    users[index] = normalized;
  } else {
    users.push(normalized);
  }
}

function saveTournamentsToStorage() {
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.tournaments,
      JSON.stringify(state.tournaments),
    );
  } catch (error) {
    console.warn('Unable to persist tournaments', error);
  }
  syncTournamentsToServer();
}

function loadSessionFromStorage() {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.session);
  } catch (error) {
    console.warn('Unable to load session from storage', error);
    return null;
  }
}

function saveSessionToStorage(accountId) {
  try {
    if (accountId) {
      window.localStorage.setItem(STORAGE_KEYS.session, accountId);
    }
  } catch (error) {
    console.warn('Unable to persist session', error);
  }
}

function clearSessionFromStorage() {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.session);
  } catch (error) {
    console.warn('Unable to clear session', error);
  }
}

async function restoreSession() {
  try {
    const resp = await fetch('/api/me', { credentials: 'include' });
    if (!resp.ok) return;
    const me = await resp.json();
    if (me && me.accountId) {
      state.currentUserId = me.accountId;
      state.ui.activeMatchId = me.role === 'player' ? findFirstMatchId(me.accountId) : null;
    }
  } catch (_e) {
    // ignore
  }
}

async function syncTournamentsToServer() {
  try {
    const response = await fetch('/api/tournaments', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(state.tournaments),
    });
    if (!response.ok) {
      throw new Error(`서버 응답 코드: ${response.status}`);
    }
  } catch (error) {
    console.warn('토너먼트를 서버에 저장하지 못했습니다.', error);
  }
}

function cacheDom() {
  dom.activeUser = document.getElementById('active-user');
  dom.playerDashboard = document.getElementById('player-dashboard');
  dom.playerSchedule = document.getElementById('player-schedule');
  dom.playerMatchFlow = document.getElementById('player-match-flow');
  dom.viewerDashboard = document.getElementById('viewer-dashboard');
  dom.viewerTournaments = document.getElementById('viewer-tournaments');
  dom.adminDashboard = document.getElementById('admin-dashboard');
  dom.tournamentForm = document.getElementById('tournament-form');
  dom.adminTournaments = document.getElementById('admin-tournaments');
  dom.panelCta = document.querySelector('#user-status .panel-cta');

  dom.headerLogin = document.getElementById('header-login');
  dom.headerSignup = document.getElementById('header-signup');
  dom.statusLogin = document.getElementById('status-login');
  dom.statusSignup = document.getElementById('status-signup');

  dom.loginModal = document.getElementById('login-modal');
  dom.signupModal = document.getElementById('signup-modal');
  dom.loginForm = document.getElementById('login-form');
  dom.signupViewerForm = document.getElementById('signup-viewer-form');
  dom.signupPlayerForm = document.getElementById('signup-player-form');

  dom.signupTabButtons = document.querySelectorAll('[data-signup-tab]');
  dom.signupForms = document.querySelectorAll('.signup-form');
  dom.toastStack = document.getElementById('toast-stack');

  dom.tournamentPlayer1 = document.getElementById('tournament-player1');
  dom.tournamentPlayer2 = document.getElementById('tournament-player2');
}

function bindEvents() {
  const loginTriggers = [dom.headerLogin, dom.statusLogin].filter(Boolean);
  const signupTriggers = [dom.headerSignup, dom.statusSignup].filter(Boolean);

  loginTriggers.forEach((button) =>
    button.addEventListener('click', () => openModal(dom.loginModal)),
  );
  signupTriggers.forEach((button) =>
    button.addEventListener('click', () => openModal(dom.signupModal)),
  );

  dom.loginModal?.addEventListener('click', handleModalBackdrop);
  dom.signupModal?.addEventListener('click', handleModalBackdrop);

  document.querySelectorAll('[data-modal-close]').forEach((button) => {
    button.addEventListener('click', () => closeModal(button.closest('.modal')));
  });

  dom.loginForm?.addEventListener('submit', handleLoginSubmit);
  dom.signupViewerForm?.addEventListener('submit', handleViewerSignupSubmit);
  dom.signupPlayerForm?.addEventListener('submit', handlePlayerSignupSubmit);

  dom.signupTabButtons.forEach((button) => {
    button.addEventListener('click', () => switchSignupTab(button.dataset.signupTab));
  });

  dom.activeUser?.addEventListener('click', (event) => {
    if (event.target.dataset.action === 'logout') {
      handleLogout();
    }
  });

  dom.playerSchedule?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) {
      return;
    }
    const action = button.dataset.action;
    const matchId = button.dataset.matchId;
    const accountId = button.dataset.accountId;

    if (action === 'ready' && matchId && accountId) {
      handlePlayerReady(matchId, accountId);
    }

    if (action === 'focus' && matchId) {
      state.ui.activeMatchId = matchId;
      renderPlayerMatchFlow();
    }
  });

  dom.playerMatchFlow?.addEventListener('submit', handlePlayerMatchFlowSubmit);
  dom.playerMatchFlow?.addEventListener('change', handlePlayerMatchFlowChange);

  dom.tournamentForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    handleTournamentCreate(new FormData(dom.tournamentForm));
  });

  dom.adminTournaments?.addEventListener('change', (event) => {
    const target = event.target;
    if (target.dataset.action === 'update-status') {
      updateTournamentStatus(target.dataset.tournamentId, target.value);
    }
  });

  dom.adminTournaments?.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.dataset.action === 'record-result') {
      event.preventDefault();
      handleTournamentResultSubmit(new FormData(form), form.dataset.tournamentId);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllModals();
    }
  });
}

function populateAdminPlayerOptions() {
  if (!dom.tournamentPlayer1 || !dom.tournamentPlayer2) {
    return;
  }
  const players = getAllRegisteredPlayers();
  const options = [
    '<option value="">플레이어 선택</option>',
    ...players.map((player) => `<option value="${player.accountId}">${player.displayName}</option>`),
  ].join('');

  const previous1 = dom.tournamentPlayer1.value;
  const previous2 = dom.tournamentPlayer2.value;

  dom.tournamentPlayer1.innerHTML = options;
  dom.tournamentPlayer2.innerHTML = options;

  if (players.some((player) => player.accountId === previous1)) {
    dom.tournamentPlayer1.value = previous1;
  }
  if (players.some((player) => player.accountId === previous2)) {
    dom.tournamentPlayer2.value = previous2;
  }
}

function getActiveUser() {
  return state.currentUserId ? findUser(state.currentUserId) : null;
}

function findUser(accountId) {
  return (
    users.find((user) => user.accountId.toLowerCase() === accountId.toLowerCase()) || null
  );
}

function getAllRegisteredPlayers() {
  return users
    .filter((user) => user.role === 'player')
    .map((user) => ({ accountId: user.accountId, displayName: user.displayName }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ko'));
}

function getPlayerMatches(user) {
  if (user.role !== 'player') {
    return [];
  }
  const results = [];
  state.tournaments.forEach((tournament) => {
    tournament.matches.forEach((match) => {
      const player = match.players.find((p) => p.accountId === user.accountId);
      if (player) {
        normalizeMatch(match);
        results.push({ tournament, match, player });
      }
    });
  });
  return results;
}

function getActiveMatchEntry() {
  const user = getActiveUser();
  if (!user || user.role !== 'player') {
    return null;
  }
  const matchId = state.ui.activeMatchId || findFirstMatchId(user.accountId);
  if (!matchId) {
    return null;
  }
  const entry = findMatchEntry(matchId);
  if (!entry) {
    return null;
  }
  normalizeMatch(entry.match);
  ensureMatchPhaseProgression(entry.tournament, entry.match);
  const player = entry.match.players.find((p) => p.accountId === user.accountId);
  if (!player) {
    return null;
  }
  return { ...entry, player };
}

function findMatchEntry(matchId) {
  for (const tournament of state.tournaments) {
    for (const match of tournament.matches) {
      if (match.id === matchId) {
        return { tournament, match };
      }
    }
  }
  return null;
}

function findFirstMatchId(accountId) {
  for (const tournament of state.tournaments) {
    for (const match of tournament.matches) {
      if (match.players.some((player) => player.accountId === accountId)) {
        return match.id;
      }
    }
  }
  return null;
}

function getOpponentPlayer(match, accountId) {
  return match.players.find((player) => player.accountId !== accountId) || null;
}

function ensureMatchPhaseProgression(tournament, match) {
  if (!match || !tournament) {
    return;
  }

  // If map has been selected and both players are ready,
  // but the phase is still stuck at map-selected, advance to picking.
  if (match.phase === 'map-selected') {
    const allReady = Array.isArray(match.players)
      && match.players.length === 2
      && match.players.every((p) => p.ready);
    if (allReady) {
      match.phase = 'picking';
      saveTournamentsToStorage();
      return;
    }
  }

  // If both sides locked picks, move to banning (or lock if bans already done).
  if (match.phase === 'picking' && areSelectionsLocked(match)) {
    match.phase = haveAllBans(match) ? 'locked' : 'banning';
    saveTournamentsToStorage();
    return;
  }

  // If we are in banning but picks are not locked (legacy/state drift), return to picking.
  if (match.phase === 'banning' && !areSelectionsLocked(match) && !haveAllBans(match)) {
    match.phase = 'picking';
    saveTournamentsToStorage();
    return;
  }

  // If all bans are present, either finish or return to picking if selections were cleared.
  if (match.phase === 'banning' && haveAllBans(match)) {
    match.phase = areSelectionsLocked(match) ? 'locked' : 'picking';
    saveTournamentsToStorage();
  }
}

function getTournamentParticipants(tournament) {
  const map = new Map();
  tournament.matches.forEach((match) => {
    match.players.forEach((player) => {
      map.set(player.accountId, {
        accountId: player.accountId,
        displayName: player.displayName,
      });
    });
  });
  return Array.from(map.values());
}

function cleanupSelectionsAfterBan(match) {
  match.players.forEach((player) => {
    const opponent = getOpponentPlayer(match, player.accountId);
    if (!opponent) {
      return;
    }
    const bans = match.bans[player.accountId] || [];
    const selection = match.selections[opponent.accountId];
    if (!selection) {
      return;
    }
    const filtered = selection.battlegroups.filter((id) => !bans.includes(id));
    if (filtered.length !== selection.battlegroups.length) {
      selection.battlegroups = filtered;
      selection.confirmed = false;
      selection.confirmedAt = null;
    }
  });
}

function haveAllBans(match) {
  return match.players.every(
    (player) => (match.bans[player.accountId] || []).length >= MAX_BAN_PER_PLAYER,
  );
}

function areSelectionsLocked(match) {
  return match.players.every((player) => {
    const selection = match.selections[player.accountId];
    return (
      selection &&
      selection.confirmed &&
      Array.isArray(selection.battlegroups) &&
      selection.battlegroups.length === MAX_PICK_SELECTION
    );
  });
}

function formatBattlegroupLabel(id) {
  return BATTLEGROUP_MAP.get(id)?.label || id;
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
    return value;
  }
}

function describeTournamentStatus(status) {
  switch (status) {
    case 'scheduled':
      return '예정';
    case 'live':
      return '진행 중';
    case 'completed':
      return '완료';
    default:
      return status;
  }
}

function isTournamentRelevantForViewer(tournament) {
  if (tournament.status === 'live' || tournament.status === 'completed') {
    return true;
  }
  return tournament.matches.some((match) => !['waiting', 'ready-check'].includes(match.phase));
}

function renderStreamButtons(streamLinks = {}) {
  const buttons = [];
  if (streamLinks.withgo) {
    buttons.push(
      `<a class="primary-button" href="${streamLinks.withgo}" target="_blank" rel="noopener noreferrer">치지직 (Withgo)</a>`,
    );
  }
  if (streamLinks.soop) {
    buttons.push(
      `<a class="secondary-button" href="${streamLinks.soop}" target="_blank" rel="noopener noreferrer">SOOP</a>`,
    );
  }
  if (!buttons.length) {
    return '';
  }
  return `<div class="viewer-links">${buttons.join('')}</div>`;
}

function showToast(message, variant = 'info') {
  if (!dom.toastStack) {
    return;
  }
  const toast = document.createElement('div');
  toast.className = `toast toast--${variant}`;
  toast.textContent = message;
  dom.toastStack.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('toast--visible');
  });

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 3200);
}

function startRealtimeUpdates() {
  if (typeof window.EventSource === 'undefined') {
    console.warn('EventSource is not supported; realtime updates disabled.');
    return;
  }
  cleanupRealtimeSource();
  try {
    const source = new EventSource(REALTIME_ENDPOINT);
    source.onmessage = (event) => {
      handleRealtimeMessage(event.data);
    };
    source.onerror = () => {
      cleanupRealtimeSource();
      scheduleRealtimeReconnect();
    };
    realtimeSource = source;
  } catch (error) {
    console.warn('Failed to establish realtime connection', error);
    scheduleRealtimeReconnect();
  }
}

function cleanupRealtimeSource() {
  if (realtimeSource) {
    realtimeSource.close();
    realtimeSource = null;
  }
  if (realtimeRetryId) {
    window.clearTimeout(realtimeRetryId);
    realtimeRetryId = null;
  }
}

function scheduleRealtimeReconnect() {
  if (realtimeRetryId) {
    return;
  }
  realtimeRetryId = window.setTimeout(() => {
    realtimeRetryId = null;
    startRealtimeUpdates();
  }, REALTIME_RECONNECT_DELAY);
}

function handleRealtimeMessage(raw) {
  if (!raw) {
    return;
  }
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (_error) {
    return;
  }
  if (!payload || typeof payload !== 'object') {
    return;
  }
  switch (payload.type) {
    case 'users':
      applyRealtimeUsers(payload.data);
      break;
    case 'tournaments':
      applyRealtimeTournaments(payload.data);
      break;
    default:
      break;
  }
}

function applyRealtimeUsers(nextUsers) {
  const normalized = mergeUsers(Array.isArray(nextUsers) ? nextUsers : []);
  users = normalized;
  populateAdminPlayerOptions();
  const currentId = state.currentUserId;
  if (currentId && !findUser(currentId)) {
    state.currentUserId = null;
    state.ui.activeMatchId = null;
    showToast('현재 계정이 더 이상 존재하지 않아 로그아웃되었습니다.', 'info');
  }
  render();
}

function applyRealtimeTournaments(nextTournaments) {
  const normalized = mergeTournaments(Array.isArray(nextTournaments) ? nextTournaments : []);
  tournaments = normalized;
  state.tournaments = normalized;
  const user = getActiveUser();
  if (user?.role === 'player') {
    const matches = getPlayerMatches(user);
    if (!matches.some(({ match }) => match.id === state.ui.activeMatchId)) {
      state.ui.activeMatchId = findFirstMatchId(user.accountId);
    }
  }
  render();
}

function getBattlegroupsByFaction(factionId) {
  return ALL_BATTLEGROUPS.filter((bg) => bg.factionId === factionId);
}

function getFactionName(factionId) {
  return FACTIONS.find((faction) => faction.id === factionId)?.name || factionId || '알 수 없음';
}

if (typeof window !== 'undefined') {
  window.COH_APP = {
    IS_BROADCAST_PAGE,
    describePhase,
    formatDateTime,
    renderViewerMatchBoard,
    renderViewerSide,
    viewerTile,
    viewerPickRow,
    renderStreamButtons,
    normalizeMatch,
    normalizeTournament,
    BATTLEGROUP_MAP,
    getFactionName,
    mapImageForName: (name) =>
      (name && MAP_IMAGE_BY_NAME[name]) ? MAP_IMAGE_BY_NAME[name] : IMAGE_PATHS.map,
  };
}

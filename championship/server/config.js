const path = require('path');
const crypto = require('crypto');

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ROOT_DIR = path.join(__dirname, '..');

// 카페24 환경에서는 PORT 환경변수가 고정되지만, 로컬에서는 기본값 8001을 사용합니다.
const DEFAULT_PORT = 8001;
const PORT = toNumber(process.env.PORT, DEFAULT_PORT);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = path.join(ROOT_DIR, 'data');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const DATA_BACKEND = (process.env.DATA_BACKEND || (process.env.DATA_BUCKET ? 'gcs' : 'local')).toLowerCase();
const DATA_BUCKET = process.env.DATA_BUCKET || process.env.GCS_BUCKET || '';
const DATA_PREFIX = process.env.DATA_PREFIX || 'championship';
const USERS_FILE = path.join(DATA_DIR, 'user.json');
const TOURNAMENTS_FILE = path.join(DATA_DIR, 'contest.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'python1234';
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_COOKIE_NAME = 'token';
const EVENT_PING_INTERVAL_MS = toNumber(process.env.EVENT_PING_INTERVAL_MS, 25_000);
const MAX_EVENT_LISTENERS = toNumber(process.env.MAX_EVENT_LISTENERS, 0);
const IS_PROD = process.env.NODE_ENV === 'production';

module.exports = {
  ROOT_DIR,
  PORT,
  HOST,
  DATA_DIR,
  PUBLIC_DIR,
  DATA_BACKEND,
  DATA_BUCKET,
  DATA_PREFIX,
  USERS_FILE,
  TOURNAMENTS_FILE,
  ADMIN_PASSWORD,
  JWT_SECRET,
  JWT_COOKIE_NAME,
  EVENT_PING_INTERVAL_MS,
  MAX_EVENT_LISTENERS,
  IS_PROD,
};


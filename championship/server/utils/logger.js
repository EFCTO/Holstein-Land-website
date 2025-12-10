const LEVELS = ['debug', 'info', 'warn', 'error'];
const LEVEL_PRIORITIES = LEVELS.reduce((acc, level, index) => {
  acc[level] = index;
  return acc;
}, {});

const envLevel = (process.env.LOG_LEVEL || 'debug').toLowerCase();
const ACTIVE_LEVEL =
  envLevel in LEVEL_PRIORITIES ? envLevel : LEVELS[0];

function log(level, message, meta) {
  if (LEVEL_PRIORITIES[level] < LEVEL_PRIORITIES[ACTIVE_LEVEL]) {
    return;
  }
  const timestamp = new Date().toISOString();
  const payload = meta ? { ...meta } : undefined;
  const formatted = payload ? `${message} ${JSON.stringify(payload)}` : message;
  const line = `[${timestamp}] [${level.toUpperCase()}] ${formatted}`;
  console[level === 'debug' ? 'log' : level](line);
}

const debug = (msg, meta) => log('debug', msg, meta);
const info = (msg, meta) => log('info', msg, meta);
const warn = (msg, meta) => log('warn', msg, meta);
const error = (msg, meta) => log('error', msg, meta);

module.exports = {
  debug,
  info,
  warn,
  error,
};

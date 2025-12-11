const fs = require('fs');
const path = require('path');

const LEVELS = ['debug', 'info', 'warn', 'error'];
const LEVEL_PRIORITIES = LEVELS.reduce((acc, level, index) => {
  acc[level] = index;
  return acc;
}, {});

const envLevel = (process.env.LOG_LEVEL || 'debug').toLowerCase();
const ACTIVE_LEVEL = envLevel in LEVEL_PRIORITIES ? envLevel : LEVELS[0];

// 프로젝트 루트의 log.log 에 기록
const LOG_FILE_PATH = path.resolve(__dirname, '../../../log.log');
let fileStream = null;

function getFileStream() {
  if (fileStream) {
    return fileStream;
  }
  try {
    fileStream = fs.createWriteStream(LOG_FILE_PATH, { flags: 'a' });
    fileStream.on('error', (error) => {
      console.error('[LOGGER] Failed writing to log file', {
        message: error?.message,
      });
      fileStream = null;
    });
  } catch (error) {
    console.error('[LOGGER] Failed to open log file', {
      message: error?.message,
    });
    fileStream = null;
  }
  return fileStream;
}

function log(level, message, meta) {
  if (LEVEL_PRIORITIES[level] < LEVEL_PRIORITIES[ACTIVE_LEVEL]) {
    return;
  }
  const timestamp = new Date().toISOString();
  const payload = meta ? { ...meta } : undefined;
  const formatted = payload ? `${message} ${JSON.stringify(payload)}` : message;
  const line = `[${timestamp}] [${level.toUpperCase()}] ${formatted}`;

  console[level === 'debug' ? 'log' : level](line);

  const stream = getFileStream();
  if (stream) {
    stream.write(`${line}\n`);
  }
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

const fs = require('fs/promises');
const path = require('path');
const { EventEmitter } = require('events');
const {
  USERS_FILE,
  TOURNAMENTS_FILE,
  MAX_EVENT_LISTENERS,
  DATA_BACKEND,
  DATA_BUCKET,
  DATA_PREFIX,
  DATA_DIR,
} = require('../config');
const { debug, warn, error: logError } = require('../utils/logger');
const CLOUD_BACKEND = 'gcs';
let useCloudStorage = DATA_BACKEND === CLOUD_BACKEND;
const objectPrefix = (DATA_PREFIX || '').replace(/(^\/+|\/+$)/g, '');
let storageBucket = null;

function switchToDiskBackend(reason) {
  if (!useCloudStorage) {
    return;
  }
  warn('Falling back to filesystem data backend', {
    reason: reason || 'Cloud backend unavailable',
    directory: DATA_DIR,
  });
  useCloudStorage = false;
  storageBucket = null;
}

if (useCloudStorage) {
  if (!DATA_BUCKET) {
    switchToDiskBackend('DATA_BUCKET is not set for gcs backend');
  } else {
    try {
      // eslint-disable-next-line global-require, import/no-extraneous-dependencies
      const { Storage } = require('@google-cloud/storage');
      const storage = new Storage();
      storageBucket = storage.bucket(DATA_BUCKET);
      debug('Initialized Cloud Storage data backend', {
        bucket: DATA_BUCKET,
        prefix: objectPrefix || '(root)',
      });
    } catch (error) {
      switchToDiskBackend(error?.message || 'Cloud Storage initialization failed');
    }
  }
}

if (!useCloudStorage) {
  debug('Initialized filesystem data backend', { directory: DATA_DIR });
}

const dataEvents = new EventEmitter();
dataEvents.setMaxListeners(MAX_EVENT_LISTENERS || 0);

function stripBom(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/^\uFEFF/, '');
}

function resolveObjectName(filePath) {
  const relative = path.isAbsolute(filePath)
    ? path.relative(DATA_DIR, filePath)
    : filePath;
  const safeSegment =
    relative && !relative.startsWith('..') && !path.isAbsolute(relative)
      ? relative
      : path.basename(filePath);
  const normalized = safeSegment.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized) {
    return objectPrefix;
  }
  return objectPrefix ? `${objectPrefix}/${normalized}` : normalized;
}

function parseJsonContent(raw, fallback, meta) {
  const normalized = stripBom(raw).trim();
  if (!normalized) {
    debug('Read empty JSON source', meta);
    return fallback;
  }
  const parsed = JSON.parse(normalized);
  debug('Read JSON source', {
    ...meta,
    size: normalized.length,
  });
  if (Array.isArray(parsed) || (parsed && typeof parsed === 'object')) {
    return parsed;
  }
  return fallback;
}

function shouldFallbackToDisk(error) {
  if (!useCloudStorage) {
    return false;
  }
  if (!error) {
    return false;
  }
  const codes = new Set([
    'EAI_AGAIN',
    'ENOTFOUND',
    'EACCES',
    'ECONNREFUSED',
    'EHOSTUNREACH',
    'ECONNRESET',
    401,
    403,
  ]);
  if (error.code != null && codes.has(error.code)) {
    return true;
  }
  const message = String(error.message || '').toLowerCase();
  return (
    message.includes('could not load the default credentials') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('permission') ||
    message.includes('unauthenticated')
  );
}

async function readJsonFile(filePath, fallback) {
  if (useCloudStorage) {
    try {
      return await readJsonFromStorage(filePath, fallback);
    } catch (error) {
      if (shouldFallbackToDisk(error)) {
        switchToDiskBackend(error.message || error.code);
        return readJsonFromDisk(filePath, fallback);
      }
      throw error;
    }
  }
  return readJsonFromDisk(filePath, fallback);
}

async function readJsonFromDisk(filePath, fallback) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return parseJsonContent(content, fallback, { filePath });
  } catch (error) {
    if (error.code === 'ENOENT') {
      warn('JSON file missing, creating with fallback', { filePath });
      await writeJsonFile(filePath, fallback);
      return fallback;
    }
    logError('Failed to read JSON file', { filePath, message: error.message });
    throw error;
  }
}

async function readJsonFromStorage(filePath, fallback) {
  const objectName = resolveObjectName(filePath);
  try {
    const file = storageBucket.file(objectName);
    const [exists] = await file.exists();
    if (!exists) {
      warn('Cloud Storage object missing, creating with fallback', { objectName });
      await writeJsonFile(filePath, fallback);
      return fallback;
    }
    const [content] = await file.download();
    return parseJsonContent(content.toString('utf-8'), fallback, { objectName });
  } catch (error) {
    logError('Failed to read JSON object', { objectName, message: error.message });
    throw error;
  }
}

async function writeJsonFile(filePath, data) {
  if (useCloudStorage) {
    try {
      await writeJsonToStorage(filePath, data);
    } catch (error) {
      if (shouldFallbackToDisk(error)) {
        switchToDiskBackend(error.message || error.code);
        await writeJsonToDisk(filePath, data);
      } else {
        throw error;
      }
    }
  } else {
    await writeJsonToDisk(filePath, data);
  }
  notifyDataSubscribers(filePath, data);
}

async function writeJsonToDisk(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  debug('Wrote JSON file', {
    filePath,
    recordCount: Array.isArray(data) ? data.length : undefined,
  });
}

async function writeJsonToStorage(filePath, data) {
  const objectName = resolveObjectName(filePath);
  try {
    const file = storageBucket.file(objectName);
    await file.save(JSON.stringify(data, null, 2), {
      contentType: 'application/json',
      resumable: false,
    });
    debug('Wrote JSON object', {
      objectName,
      recordCount: Array.isArray(data) ? data.length : undefined,
    });
  } catch (error) {
    logError('Failed to write JSON object', { objectName, message: error.message });
    throw error;
  }
}

function publicUser(user) {
  const { password, ...rest } = user || {};
  return rest;
}

function notifyDataSubscribers(filePath, data) {
  if (filePath === USERS_FILE) {
    const payload = Array.isArray(data) ? data.map(publicUser) : [];
    emitDataUpdate('users', payload);
    return;
  }
  if (filePath === TOURNAMENTS_FILE) {
    const payload = Array.isArray(data) ? data : [];
    emitDataUpdate('tournaments', payload);
  }
}

function emitDataUpdate(type, data) {
  debug('Emitting data update', {
    type,
    size: Array.isArray(data) ? data.length : undefined,
  });
  dataEvents.emit('update', {
    type,
    data,
    timestamp: Date.now(),
  });
}

module.exports = {
  dataEvents,
  readJsonFile,
  writeJsonFile,
  publicUser,
  notifyDataSubscribers,
};

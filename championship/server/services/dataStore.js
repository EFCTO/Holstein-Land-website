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
const useCloudStorage = DATA_BACKEND === CLOUD_BACKEND;
const objectPrefix = (DATA_PREFIX || '').replace(/(^\/+|\/+$)/g, '');
let storageBucket = null;

if (useCloudStorage) {
  if (!DATA_BUCKET) {
    throw new Error('DATA_BUCKET must be set when DATA_BACKEND is "gcs".');
  }
  const { Storage } = require('@google-cloud/storage');
  const storage = new Storage();
  storageBucket = storage.bucket(DATA_BUCKET);
  debug('Initialized Cloud Storage data backend', {
    bucket: DATA_BUCKET,
    prefix: objectPrefix || '(root)',
  });
} else {
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

async function readJsonFile(filePath, fallback) {
  if (useCloudStorage) {
    return readJsonFromStorage(filePath, fallback);
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
    await writeJsonToStorage(filePath, data);
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

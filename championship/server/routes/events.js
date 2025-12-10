const express = require('express');
const router = express.Router();

const { EVENT_PING_INTERVAL_MS, USERS_FILE, TOURNAMENTS_FILE } = require('../config');
const { dataEvents, readJsonFile, publicUser } = require('../services/dataStore');
const { info, error: logError } = require('../utils/logger');

router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const handleUpdate = (payload) => send(payload);
  dataEvents.on('update', handleUpdate);

  const heartbeat = setInterval(() => {
    send({ type: 'ping', timestamp: Date.now() });
  }, EVENT_PING_INTERVAL_MS);

  info('SSE client connected');
  send({ type: 'connected', timestamp: Date.now() });

  Promise.all([
    readJsonFile(USERS_FILE, []),
    readJsonFile(TOURNAMENTS_FILE, []),
  ])
    .then(([users, tournaments]) => {
      send({ type: 'users', data: (Array.isArray(users) ? users : []).map(publicUser) });
      send({ type: 'tournaments', data: Array.isArray(tournaments) ? tournaments : [] });
    })
    .catch((error) => {
      logError('Failed to send initial SSE payload', { message: error.message });
    });

  req.on('close', () => {
    clearInterval(heartbeat);
    dataEvents.off('update', handleUpdate);
    info('SSE client disconnected');
  });
});

module.exports = router;


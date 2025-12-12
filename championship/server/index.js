const express = require('express');
const path = require('path');

const { PORT, HOST, PUBLIC_DIR } = require('./config');
const bootstrap = require('./bootstrap');
const authRouter = require('./routes/auth');
const { startDiscordBotIfConfigured } = require('./discordBot');
const usersRouter = require('./routes/users');
const tournamentsRouter = require('./routes/tournaments');
const eventsRouter = require('./routes/events');
const requestLogger = require('./middleware/requestLogger');
const { error: logError, info } = require('./utils/logger');

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use(express.static(PUBLIC_DIR));

app.use('/api', authRouter);
app.use('/api', usersRouter);
app.use('/api', tournamentsRouter);
app.use('/api', eventsRouter);

app.get('/', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.use((err, _req, res, _next) => {
  logError('Unhandled error', {
    message: err?.message,
    stack: err?.stack,
  });
  if (res.headersSent) {
    return;
  }
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

const server = app.listen(PORT, HOST, () => {
  info('Server listening', { host: HOST, port: PORT });
});

bootstrap().catch((error) => {
  logError('Bootstrap failed', { message: error?.message, stack: error?.stack });
});

startDiscordBotIfConfigured();

module.exports = server;

console.log('Server module loaded');

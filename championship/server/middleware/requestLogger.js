const { info } = require('../utils/logger');

function requestLogger(req, res, next) {
  const start = Date.now();
  info('Incoming request', { method: req.method, url: req.originalUrl });
  res.on('finish', () => {
    const duration = Date.now() - start;
    info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
    });
  });
  next();
}

module.exports = requestLogger;

const { info } = require('../utils/logger');

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.connection && req.connection.socket && req.connection.socket.remoteAddress) ||
    null
  );
}

function requestLogger(req, res, next) {
  const start = Date.now();
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || null;
  const referer = req.headers.referer || req.headers.referrer || null;

  info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip,
    userAgent,
    referer,
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip,
    });
  });

  next();
}

module.exports = requestLogger;

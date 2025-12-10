const { JWT_COOKIE_NAME, IS_PROD } = require('../config');

function parseCookies(req) {
  const header = req.headers?.cookie;
  if (!header) return {};
  return header.split(';').reduce((acc, part) => {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      acc[k] = decodeURIComponent(v);
    }
    return acc;
  }, {});
}

function getTokenFromReq(req) {
  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice('Bearer '.length).trim();
  }
  const cookies = parseCookies(req);
  return cookies[JWT_COOKIE_NAME] || null;
}

function setAuthCookie(res, token) {
  const cookie = [
    `${JWT_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    IS_PROD ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
  res.setHeader('Set-Cookie', cookie);
}

function clearAuthCookie(res) {
  const cookie = [
    `${JWT_COOKIE_NAME}=; Path=/`,
    'HttpOnly',
    'SameSite=Lax',
    IS_PROD ? 'Secure' : '',
    'Max-Age=0',
  ]
    .filter(Boolean)
    .join('; ');
  res.setHeader('Set-Cookie', cookie);
}

module.exports = {
  getTokenFromReq,
  setAuthCookie,
  clearAuthCookie,
};

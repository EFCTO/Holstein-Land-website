const crypto = require('crypto');
const { JWT_SECRET } = require('../config');

const b64url = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const b64urlJson = (obj) => b64url(JSON.stringify(obj));

function signJwt(payload, { expiresInSec = 60 * 60 * 8 } = {}) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const nowSec = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: nowSec, exp: nowSec + expiresInSec };
  const headerPart = b64urlJson(header);
  const payloadPart = b64urlJson(body);
  const data = `${headerPart}.${payloadPart}`;
  const sig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${sig}`;
}

function verifyJwt(token) {
  try {
    const [headerB64, payloadB64, sig] = token.split('.');
    if (!headerB64 || !payloadB64 || !sig) return null;
    const data = `${headerB64}.${payloadB64}`;
    const expected = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
      return null;
    }
    const payloadJson = Buffer.from(
      payloadB64.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf8');
    const payload = JSON.parse(payloadJson);
    if (!payload.exp || Math.floor(Date.now() / 1000) >= payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

module.exports = {
  signJwt,
  verifyJwt,
};

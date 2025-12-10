const express = require('express');
const router = express.Router();

const { USERS_FILE } = require('../config');
const { readJsonFile } = require('../services/dataStore');
const { sanitizeString } = require('../utils/text');
const { verifyPassword } = require('../services/passwords');
const { signJwt, verifyJwt } = require('../utils/jwt');
const { setAuthCookie, clearAuthCookie, getTokenFromReq } = require('../utils/cookies');
const { info, warn, error: logError } = require('../utils/logger');

router.post('/login', async (req, res) => {
  const { accountId, password } = req.body || {};
  const id = sanitizeString(accountId);
  const pw = typeof password === 'string' ? password : '';
  if (!id || !pw) {
    return res.status(400).json({ message: '계정과 비밀번호가 필요합니다.' });
  }
  try {
    const allUsers = await readJsonFile(USERS_FILE, []);
    const users = Array.isArray(allUsers) ? allUsers : [];
    const user = users.find((u) => u.accountId?.toLowerCase() === id.toLowerCase());
    if (!user) {
      warn('로그인 실패 - unknown account', { accountId: id });
      return res.status(401).json({ message: '로그인 정보를 확인하세요.' });
    }
    const ok = await verifyPassword(pw, user.password);
    if (!ok) {
      warn('로그인 실패 - invalid password', { accountId: id });
      return res.status(401).json({ message: '로그인 정보를 확인하세요.' });
    }
    const token = signJwt({
      sub: user.accountId,
      role: user.role,
      displayName: user.displayName,
    });
    setAuthCookie(res, token);
    info('로그인 성공', { accountId: user.accountId, role: user.role });
    res.json({
      accountId: user.accountId,
      role: user.role,
      displayName: user.displayName,
    });
  } catch (error) {
    logError('로그인 실패', { message: error.message });
    res.status(500).json({ message: '로그인 처리에 실패했습니다.' });
  }
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  info('로그아웃 처리');
  res.status(204).end();
});

router.get('/me', (req, res) => {
  const token = getTokenFromReq(req);
  if (!token) return res.status(200).json(null);
  const payload = verifyJwt(token);
  if (!payload) return res.status(200).json(null);
  info('세션 확인', { accountId: payload.sub, role: payload.role });
  res.json({
    accountId: payload.sub,
    role: payload.role,
    displayName: payload.displayName,
  });
});

module.exports = router;

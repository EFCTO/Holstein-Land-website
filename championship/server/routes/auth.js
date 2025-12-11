const express = require('express');
const router = express.Router();

const { USERS_FILE } = require('../config');
const { readJsonFile } = require('../services/dataStore');
const { sanitizeString } = require('../utils/text');
const { verifyPassword } = require('../services/passwords');
const { signJwt, verifyJwt } = require('../utils/jwt');
const {
  setAuthCookie,
  clearAuthCookie,
  getTokenFromReq,
} = require('../utils/cookies');
const { info, warn, error: logError } = require('../utils/logger');

router.post('/login', async (req, res) => {
  const { accountId, password } = req.body || {};
  const id = sanitizeString(accountId);
  const pw = typeof password === 'string' ? password : '';

  if (!id || !pw) {
    return res
      .status(400)
      .json({ message: '계정 ID와 비밀번호를 모두 입력해주세요.' });
  }

  try {
    const allUsers = await readJsonFile(USERS_FILE, []);
    const users = Array.isArray(allUsers) ? allUsers : [];
    const user =
      users.find(
        (u) => u.accountId && u.accountId.toLowerCase() === id.toLowerCase(),
      ) || null;

    if (!user) {
      warn('Login failed - unknown account', { accountId: id });
      return res
        .status(401)
        .json({ message: '계정 ID 또는 비밀번호가 올바르지 않습니다.' });
    }

    const ok = await verifyPassword(pw, user.password);
    if (!ok) {
      warn('Login failed - invalid password', { accountId: id });
      return res
        .status(401)
        .json({ message: '계정 ID 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = signJwt({
      sub: user.accountId,
      role: user.role,
      displayName: user.displayName,
    });

    setAuthCookie(res, token);
    info('User logged in', { accountId: user.accountId, role: user.role });

    res.json({
      accountId: user.accountId,
      role: user.role,
      displayName: user.displayName,
    });
  } catch (error) {
    logError('Login failed with server error', { message: error.message });
    res.status(500).json({
      message: '로그인 처리 중 서버 오류가 발생했습니다.',
    });
  }
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  info('User logged out');
  res.status(204).end();
});

router.get('/me', (req, res) => {
  const token = getTokenFromReq(req);
  if (!token) {
    return res.status(200).json(null);
  }
  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(200).json(null);
  }

  info('Loaded current user from token', {
    accountId: payload.sub,
    role: payload.role,
  });

  res.json({
    accountId: payload.sub,
    role: payload.role,
    displayName: payload.displayName,
  });
});

module.exports = router;


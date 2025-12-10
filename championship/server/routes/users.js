const express = require('express');
const router = express.Router();

const { USERS_FILE } = require('../config');
const { readJsonFile, writeJsonFile, publicUser } = require('../services/dataStore');
const { hashPassword } = require('../services/passwords');
const { sanitizeString, parsePositiveInteger } = require('../utils/text');
const { info, error: logError } = require('../utils/logger');

router.get('/users', async (_req, res) => {
  try {
    const users = await readJsonFile(USERS_FILE, []);
    const safeUsers = (Array.isArray(users) ? users : []).map(publicUser);
    info('Fetched users', { count: safeUsers.length });
    res.json(safeUsers);
  } catch (error) {
    logError('Failed to read users', { message: error.message });
    res.status(500).json({ message: '사용자 목록을 불러오지 못했습니다.' });
  }
});

router.post('/users', async (req, res) => {
  const { accountId, password, role, email, displayName, rank, seed } = req.body || {};

  const trimmedAccountId = sanitizeString(accountId);
  const trimmedPassword = typeof password === 'string' ? password : '';
  const normalizedRole = role === 'player' ? 'player' : 'viewer';
  const trimmedDisplayName = sanitizeString(displayName) || trimmedAccountId;
  const trimmedEmail = sanitizeString(email);
  const normalizedRank =
    normalizedRole === 'player' ? sanitizeString(rank) || '언랭크' : null;
  const normalizedSeed = Boolean(seed);

  if (!trimmedAccountId || !trimmedPassword) {
    return res.status(400).json({ message: 'accountId와 password는 모두 필요합니다.' });
  }
  if (trimmedAccountId.toLowerCase() === 'admin') {
    return res.status(403).json({ message: 'admin 계정은 생성할 수 없습니다.' });
  }

  try {
    const existingUsers = await readJsonFile(USERS_FILE, []);
    const users = Array.isArray(existingUsers) ? existingUsers : [];

    const alreadyExists = users.some(
      (user) => user.accountId.toLowerCase() === trimmedAccountId.toLowerCase(),
    );
    if (alreadyExists) {
      return res.status(409).json({ message: '이미 등록된 계정 ID입니다.' });
    }

    const hashed = await hashPassword(trimmedPassword);
    const newUser = {
      accountId: trimmedAccountId,
      displayName: trimmedDisplayName,
      role: normalizedRole,
      password: hashed,
      email: trimmedEmail || '',
      rank: normalizedRank,
      seed: normalizedSeed,
    };

    users.push(newUser);
    await writeJsonFile(USERS_FILE, users);

    const safeUser = publicUser(newUser);
    info('Created user', { accountId: safeUser.accountId, role: safeUser.role });
    res.status(201).json(safeUser);
  } catch (error) {
    logError('사용자 생성 실패', { message: error.message });
    res.status(500).json({ message: '사용자 생성에 실패했습니다.' });
  }
});

module.exports = router;

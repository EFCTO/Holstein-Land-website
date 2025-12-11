const express = require('express');
const router = express.Router();

const { TOURNAMENTS_FILE } = require('../config');
const { readJsonFile, writeJsonFile } = require('../services/dataStore');
const authRequired = require('../middleware/authRequired');
const { info, error: logError } = require('../utils/logger');

router.get('/tournaments', async (_req, res) => {
  try {
    const tournaments = await readJsonFile(TOURNAMENTS_FILE, []);
    const list = Array.isArray(tournaments) ? tournaments : [];
    info('Fetched tournaments', { count: list.length });
    res.json(list);
  } catch (error) {
    logError('Failed to read tournaments', { message: error.message });
    res.status(500).json({
      message: '토너먼트 데이터를 불러오는 중 오류가 발생했습니다.',
    });
  }
});

router.put('/tournaments', authRequired(), async (req, res) => {
  const tournaments = Array.isArray(req.body) ? req.body : [];
  try {
    await writeJsonFile(TOURNAMENTS_FILE, tournaments);
    info('Saved tournaments', { count: tournaments.length });
    res.status(204).end();
  } catch (error) {
    logError('Failed to save tournaments', { message: error.message });
    res.status(500).json({
      message: '토너먼트 데이터를 저장하는 중 오류가 발생했습니다.',
    });
  }
});

module.exports = router;


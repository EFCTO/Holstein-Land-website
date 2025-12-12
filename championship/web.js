// 서버 엔트리 포인트입니다. 서버 모듈을 불러오기 전에 .env를 로드합니다.
const fs = require('fs');
const path = require('path');

(function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      return;
    }
    const content = fs.readFileSync(envPath, 'utf-8');
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .forEach((line) => {
        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) {
          return;
        }
        const key = line.slice(0, eqIndex).trim();
        const value = line.slice(eqIndex + 1).trim();
        if (key && !(key in process.env)) {
          process.env[key] = value;
        }
      });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load .env file', {
      message: error?.message,
    });
  }
})();

require('./server');


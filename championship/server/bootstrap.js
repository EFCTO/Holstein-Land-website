const { USERS_FILE, ADMIN_PASSWORD } = require('./config');
const { readJsonFile, writeJsonFile } = require('./services/dataStore');
const { hashPassword } = require('./services/passwords');
const { info, warn } = require('./utils/logger');

async function bootstrap() {
  try {
    const existingUsers = await readJsonFile(USERS_FILE, []);
    const users = Array.isArray(existingUsers) ? existingUsers : [];

    const hasAdmin = users.some((u) => u.accountId?.toLowerCase() === 'admin');
    if (!hasAdmin) {
      const hashed = await hashPassword(ADMIN_PASSWORD);
      users.push({
        accountId: 'admin',
        displayName: 'Broadcast Admin',
        role: 'admin',
        password: hashed,
        email: '',
        elo: null,
        seed: false,
      });
      info('Seeded default admin account');
    }

    let migrated = false;
    for (const u of users) {
      if (u.password && typeof u.password === 'string' && !u.password.startsWith('s2$')) {
        u.password = await hashPassword(u.password);
        migrated = true;
      }
    }

    if (!hasAdmin || migrated) {
      await writeJsonFile(USERS_FILE, users);
    }
  } catch (error) {
    warn('Bootstrap warning', { message: error?.message || error });
  }
}

module.exports = bootstrap;

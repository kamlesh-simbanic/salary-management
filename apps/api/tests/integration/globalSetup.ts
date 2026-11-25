import { loadEnv } from '../../src/config/env.js';
import { createMigrator } from '../../src/db/migrator.js';
import { createSequelize } from '../../src/db/sequelize.js';

// Brings the test database to the latest schema once before the integration suite.
export default async function setup() {
  const { TEST_DATABASE_URL } = loadEnv({
    ...process.env,
    DATABASE_URL: process.env.TEST_DATABASE_URL,
  });
  if (!TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is required for integration tests');
  const sequelize = createSequelize(TEST_DATABASE_URL);
  await createMigrator(sequelize).up();
  await sequelize.close();
}

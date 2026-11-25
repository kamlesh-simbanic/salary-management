import { defineConfig } from 'vitest/config';

// Runs against the MySQL database in TEST_DATABASE_URL. Files run one at a time because they share a database.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    fileParallelism: false,
    globalSetup: ['tests/integration/globalSetup.ts'],
    testTimeout: 15_000,
  },
});

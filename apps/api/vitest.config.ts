import { defineConfig } from 'vitest/config';

// Fast unit tests only (no database). Integration tests use vitest.integration.config.ts.
export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'], exclude: ['tests/integration/**'] },
});

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:4000' } }, // avoids CORS in local dev
  test: { environment: 'jsdom', globals: true, setupFiles: ['./tests/setup.ts'] },
});

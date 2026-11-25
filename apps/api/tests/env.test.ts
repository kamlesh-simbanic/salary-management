import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env.js';

describe('loadEnv', () => {
  it('applies the default port and accepts a valid DATABASE_URL', () => {
    const env = loadEnv({ DATABASE_URL: 'mysql://u:p@localhost:3306/db' });

    expect(env.PORT).toBe(4000);
    expect(env.DATABASE_URL).toBe('mysql://u:p@localhost:3306/db');
  });

  it('fails fast with a readable message when DATABASE_URL is missing', () => {
    expect(() => loadEnv({})).toThrow(/DATABASE_URL/);
  });
});

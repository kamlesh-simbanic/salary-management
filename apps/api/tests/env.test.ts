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

  it('keeps TLS off by default and turns it on only for the exact value "true"', () => {
    const base = { DATABASE_URL: 'mysql://u:p@localhost:3306/db' };

    expect(loadEnv(base).DATABASE_SSL).toBe(false);
    expect(loadEnv({ ...base, DATABASE_SSL: 'true' }).DATABASE_SSL).toBe(true);
    expect(() => loadEnv({ ...base, DATABASE_SSL: 'yes' })).toThrow(/DATABASE_SSL/);
  });

  it('parses a comma-separated CORS_ORIGIN list and drops trailing slashes', () => {
    const env = loadEnv({
      DATABASE_URL: 'mysql://u:p@localhost:3306/db',
      CORS_ORIGIN: 'https://app.vercel.app/, http://localhost:5173',
    });

    expect(env.CORS_ORIGIN).toEqual(['https://app.vercel.app', 'http://localhost:5173']);
  });

  it('allows no cross-origin callers when CORS_ORIGIN is unset', () => {
    expect(loadEnv({ DATABASE_URL: 'mysql://u:p@localhost:3306/db' }).CORS_ORIGIN).toEqual([]);
  });
});

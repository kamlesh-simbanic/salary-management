import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { EmployeeService } from '../src/services/employeeService.js';
import { InsightsService } from '../src/services/insightsService.js';
import { fakeInsightsRepository } from './support/fakeInsightsRepository.js';
import { InMemoryEmployeeRepository } from './support/inMemoryEmployeeRepository.js';

const appWith = (corsOrigins?: string[]) =>
  createApp({
    employeeService: new EmployeeService(new InMemoryEmployeeRepository()),
    insightsService: new InsightsService(fakeInsightsRepository()),
    corsOrigins,
  });

describe('CORS', () => {
  it('lets the configured UI origin read responses', async () => {
    const res = await request(appWith(['https://app.vercel.app']))
      .get('/api/v1/meta/filters')
      .set('Origin', 'https://app.vercel.app');

    expect(res.headers['access-control-allow-origin']).toBe('https://app.vercel.app');
  });

  it('answers the browser preflight for a JSON write from the UI origin', async () => {
    const res = await request(appWith(['https://app.vercel.app']))
      .options('/api/v1/employees')
      .set('Origin', 'https://app.vercel.app')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-methods']).toMatch(/POST/);
  });

  it('does not grant access to any other origin', async () => {
    const res = await request(appWith(['https://app.vercel.app']))
      .get('/api/v1/meta/filters')
      .set('Origin', 'https://evil.example');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('adds no CORS headers at all when no origin is configured', async () => {
    const res = await request(appWith())
      .get('/api/v1/meta/filters')
      .set('Origin', 'https://app.vercel.app');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { EmployeeService } from '../src/services/employeeService.js';
import { InsightsService } from '../src/services/insightsService.js';
import { InMemoryEmployeeRepository } from './support/inMemoryEmployeeRepository.js';
import { fakeInsightsRepository } from './support/fakeInsightsRepository.js';

const appWith = (insights = fakeInsightsRepository()) =>
  createApp({
    employeeService: new EmployeeService(new InMemoryEmployeeRepository()),
    insightsService: new InsightsService(insights),
  });

describe('insights API', () => {
  it('GET /summary defaults to grouping by country and passes filters through', async () => {
    let received: unknown[] = [];
    const app = appWith(
      fakeInsightsRepository({
        summary: async (...args) => {
          received = args;
          return [{ group: 'IN', headcount: 1, minUsd: 1, medianUsd: 1, avgUsd: 1, maxUsd: 1 }];
        },
      }),
    );

    const res = await request(app).get('/api/v1/insights/summary?department=Sales&country=in');

    expect(res.status).toBe(200);
    expect(res.body.groupBy).toBe('country');
    expect(received).toEqual(['country', { country: 'IN', department: 'Sales' }]);
  });

  it('rejects an unknown groupBy with 400', async () => {
    const res = await request(appWith()).get('/api/v1/insights/summary?groupBy=salary');

    expect(res.status).toBe(400);
  });

  it('GET /distribution validates the number of bands', async () => {
    expect((await request(appWith()).get('/api/v1/insights/distribution?bands=1')).status).toBe(
      400,
    );
    expect((await request(appWith()).get('/api/v1/insights/distribution')).status).toBe(200);
  });

  it('GET /outliers returns total and items', async () => {
    const res = await request(appWith()).get('/api/v1/insights/outliers?limit=5');

    expect(res.body).toEqual({ total: 0, items: [] });
  });
});

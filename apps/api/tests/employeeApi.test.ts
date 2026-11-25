import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { EmployeeService } from '../src/services/employeeService.js';
import { InsightsService } from '../src/services/insightsService.js';
import { fakeInsightsRepository } from './support/fakeInsightsRepository.js';
import { InMemoryEmployeeRepository } from './support/inMemoryEmployeeRepository.js';
import { anEmployee } from './support/builders.js';

// HTTP contract tests: real routes, validation and error handler; fake repository (no DB).
describe('employee API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp({
      employeeService: new EmployeeService(new InMemoryEmployeeRepository()),
      insightsService: new InsightsService(fakeInsightsRepository()),
    });
  });

  it('GET /health reports the service is up', async () => {
    expect((await request(app).get('/health')).body).toEqual({ status: 'ok' });
  });

  it('POST creates an employee and returns 201', async () => {
    const res = await request(app).post('/api/v1/employees').send(anEmployee());

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, email: 'asha.rao@acme.example' });
  });

  it('POST with invalid data returns 400 with field-level details', async () => {
    const res = await request(app)
      .post('/api/v1/employees')
      .send(anEmployee({ annualSalary: -1 }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0]).toMatchObject({ path: 'annualSalary' });
  });

  it('POST with a duplicate email returns 409', async () => {
    await request(app).post('/api/v1/employees').send(anEmployee());
    const res = await request(app).post('/api/v1/employees').send(anEmployee());

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('GET /:id returns 404 for an unknown employee and 400 for a bad id', async () => {
    expect((await request(app).get('/api/v1/employees/42')).status).toBe(404);
    expect((await request(app).get('/api/v1/employees/abc')).status).toBe(400);
  });

  it('PUT updates and DELETE removes', async () => {
    await request(app).post('/api/v1/employees').send(anEmployee());

    const put = await request(app)
      .put('/api/v1/employees/1')
      .send(anEmployee({ jobTitle: 'Staff Engineer' }));
    const del = await request(app).delete('/api/v1/employees/1');

    expect(put.body.jobTitle).toBe('Staff Engineer');
    expect(del.status).toBe(204);
    expect((await request(app).get('/api/v1/employees/1')).status).toBe(404);
  });

  it('GET list returns a page envelope', async () => {
    await request(app).post('/api/v1/employees').send(anEmployee());

    const res = await request(app).get('/api/v1/employees?pageSize=10');

    expect(res.body).toMatchObject({ page: 1, pageSize: 10, total: 1, totalPages: 1 });
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/v1/employees')
      .set('Content-Type', 'application/json')
      .send('{bad');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_JSON');
  });
});

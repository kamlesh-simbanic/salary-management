import type { Sequelize } from 'sequelize';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SequelizeInsightsRepository } from '../../src/repositories/sequelizeInsightsRepository.js';
import { anEmployee } from '../support/builders.js';
import { connectTestDb, insert, resetDb } from './db.js';

// Test rates (see db.ts): USD = 1, INR = 0.01. So an INR salary of 3,000 is 30 USD.
const repo = new SequelizeInsightsRepository();
const usd = (n: number, i: number, over = {}) =>
  insert(
    anEmployee({
      email: `u${i}@x.io`,
      currencyCode: 'USD',
      countryCode: 'US',
      annualSalary: n,
      ...over,
    }),
  );

describe('SequelizeInsightsRepository (MySQL)', () => {
  let sequelize: Sequelize;
  beforeAll(() => {
    sequelize = connectTestDb();
  });
  afterAll(() => sequelize.close());
  beforeEach(resetDb);

  describe('summary', () => {
    it('computes headcount, min, median, average and max in USD', async () => {
      // Odd count: median is the middle value.
      for (const [i, salary] of [10, 20, 30, 40, 100].entries()) await usd(salary, i);

      const [row] = await repo.summary('country', {});

      expect(row).toEqual({
        group: 'US',
        headcount: 5,
        minUsd: 10,
        medianUsd: 30,
        avgUsd: 40,
        maxUsd: 100,
      });
    });

    it('takes the mean of the two middle values when the count is even', async () => {
      for (const [i, salary] of [10, 20, 30, 40].entries()) await usd(salary, i);

      const [row] = await repo.summary('country', {});

      expect(row?.medianUsd).toBe(25);
    });

    it('converts local currencies before aggregating and groups by the requested field', async () => {
      await insert(
        anEmployee({
          email: 'a@x.io',
          annualSalary: 3_000,
          currencyCode: 'INR',
          department: 'Sales',
        }),
      ); // 30 USD
      await usd(50, 1, { department: 'Sales' });
      await usd(70, 2, { department: 'Engineering' });

      const rows = await repo.summary('department', {});

      expect(rows).toEqual([
        { group: 'Sales', headcount: 2, minUsd: 30, medianUsd: 40, avgUsd: 40, maxUsd: 50 },
        { group: 'Engineering', headcount: 1, minUsd: 70, medianUsd: 70, avgUsd: 70, maxUsd: 70 },
      ]);
    });

    it('applies filters before aggregating', async () => {
      await usd(10, 0, { department: 'Sales' });
      await usd(90, 1, { department: 'Engineering' });

      const rows = await repo.summary('country', { department: 'Sales' });

      expect(rows[0]).toMatchObject({ headcount: 1, maxUsd: 10 });
    });
  });

  describe('distribution queries', () => {
    it('reports count and max, then buckets by the given step', async () => {
      for (const [i, salary] of [5, 15, 19, 25].entries()) await usd(salary, i);

      expect(await repo.salaryRange({})).toEqual({ count: 4, maxUsd: 25 });
      expect(await repo.histogram({}, 10)).toEqual([
        { bucket: 0, count: 1 },
        { bucket: 1, count: 2 },
        { bucket: 2, count: 1 },
      ]);
    });
  });

  describe('outlierCandidates', () => {
    it('flags values beyond 1.5 x IQR within the same job title and country', async () => {
      // Quartiles of [10,20,30,40,100]: q1=20, median=30, q3=40 -> fences -10..70, so only 100 is an outlier.
      for (const [i, salary] of [10, 20, 30, 40, 100].entries()) await usd(salary, i);

      const result = await repo.outlierCandidates({});

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        salaryUsd: 100,
        q1Usd: 20,
        medianUsd: 30,
        q3Usd: 40,
        peerCount: 5,
      });
    });

    it('ignores peer groups that are too small to judge', async () => {
      for (const [i, salary] of [10, 20, 30, 1000].entries()) await usd(salary, i);

      expect(await repo.outlierCandidates({})).toEqual([]);
    });

    it('compares people only with the same job title in the same country', async () => {
      for (const [i, salary] of [10, 20, 30, 40, 50].entries()) await usd(salary, i);
      // A very high earner in another country/title must not distort, nor be flagged by, the group above.
      await usd(5000, 9, { jobTitle: 'Staff Engineer' });

      expect(await repo.outlierCandidates({})).toEqual([]);
    });

    it('can narrow the report to one job title', async () => {
      for (const [i, salary] of [10, 20, 30, 40, 100].entries()) await usd(salary, i);

      expect(await repo.outlierCandidates({ jobTitle: 'Software Engineer' })).toHaveLength(1);
      expect(await repo.outlierCandidates({ jobTitle: 'Accountant' })).toEqual([]);
    });

    it('keeps peer groups complete when a filter narrows the report', async () => {
      for (const [i, salary] of [10, 20, 30, 40, 100].entries())
        await usd(salary, i, { department: i === 4 ? 'Sales' : 'Engineering' });

      expect(await repo.outlierCandidates({ department: 'Engineering' })).toEqual([]);
      expect(await repo.outlierCandidates({ department: 'Sales' })).toHaveLength(1);
    });
  });
});

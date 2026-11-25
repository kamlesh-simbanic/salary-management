import type { Sequelize } from 'sequelize';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ConflictError } from '../../src/errors.js';
import { anEmployee } from '../support/builders.js';
import { connectTestDb, insert, repo, resetDb } from './db.js';

const listQuery = { page: 1, pageSize: 25, sort: 'fullName', order: 'asc' } as const;

describe('SequelizeEmployeeRepository (MySQL)', () => {
  let sequelize: Sequelize;
  beforeAll(() => {
    sequelize = connectTestDb();
  });
  afterAll(() => sequelize.close());
  beforeEach(resetDb);

  it('stores money exactly and returns numbers plus the USD value', async () => {
    const created = await insert(anEmployee({ annualSalary: 1_234_567.89, currencyCode: 'INR' }));

    expect(created.annualSalary).toBe(1_234_567.89);
    expect(created.salaryUsd).toBe(12_345.68);
    expect(typeof created.id).toBe('number');
  });

  it('rejects a duplicate email with ConflictError', async () => {
    await insert(anEmployee());

    await expect(insert(anEmployee())).rejects.toBeInstanceOf(ConflictError);
  });

  it('filters by country, department and job title together', async () => {
    await insert(anEmployee({ email: 'a@x.io', countryCode: 'IN' }));
    await insert(anEmployee({ email: 'b@x.io', countryCode: 'US', currencyCode: 'USD' }));
    await insert(anEmployee({ email: 'c@x.io', countryCode: 'IN', department: 'Sales' }));

    const { items, total } = await repo.list({
      ...listQuery,
      country: 'IN',
      department: 'Engineering',
    });

    expect(total).toBe(1);
    expect(items[0]?.email).toBe('a@x.io');
  });

  it('searches name or email and treats % literally', async () => {
    await insert(anEmployee({ email: 'priya@x.io', fullName: 'Priya Nair' }));
    await insert(anEmployee({ email: 'tom@x.io', fullName: 'Tom 50% Smith' }));

    expect((await repo.list({ ...listQuery, q: 'nair' })).total).toBe(1);
    expect((await repo.list({ ...listQuery, q: 'tom@' })).total).toBe(1);
    expect((await repo.list({ ...listQuery, q: '%' })).total).toBe(1);
  });

  it('sorts by USD value, not by the local amount', async () => {
    // 1,000,000 INR = 10,000 USD; 50,000 USD is larger even though the local number is smaller.
    await insert(anEmployee({ email: 'in@x.io', annualSalary: 1_000_000, currencyCode: 'INR' }));
    await insert(
      anEmployee({
        email: 'us@x.io',
        annualSalary: 50_000,
        currencyCode: 'USD',
        countryCode: 'US',
      }),
    );

    const { items } = await repo.list({ ...listQuery, sort: 'salaryUsd', order: 'desc' });

    expect(items.map((e) => e.email)).toEqual(['us@x.io', 'in@x.io']);
  });

  it('paginates with a stable order and reports the total', async () => {
    for (let i = 1; i <= 5; i++)
      await insert(anEmployee({ email: `e${i}@x.io`, fullName: 'Same Name' }));

    const page2 = await repo.list({ ...listQuery, page: 2, pageSize: 2 });
    const page3 = await repo.list({ ...listQuery, page: 3, pageSize: 2 });

    expect(page2.total).toBe(5);
    expect(page2.items.map((e) => e.email)).toEqual(['e3@x.io', 'e4@x.io']);
    expect(page3.items.map((e) => e.email)).toEqual(['e5@x.io']);
  });

  it('updates, deletes and reports missing rows', async () => {
    const { id } = await insert(anEmployee());

    const updated = await repo.update(id, anEmployee({ jobTitle: 'Staff Engineer' }));

    expect(updated?.jobTitle).toBe('Staff Engineer');
    expect(await repo.delete(id)).toBe(true);
    expect(await repo.delete(id)).toBe(false);
    expect(await repo.update(id, anEmployee())).toBeNull();
  });

  it('knows which currencies are supported and lists distinct filter values', async () => {
    await insert(anEmployee({ email: 'a@x.io' }));
    await insert(
      anEmployee({ email: 'b@x.io', countryCode: 'US', currencyCode: 'USD', department: 'Sales' }),
    );

    expect(await repo.currencyExists('INR')).toBe(true);
    expect(await repo.currencyExists('XYZ')).toBe(false);
    expect(await repo.currencyCodes()).toEqual(['INR', 'USD']);
    expect(await repo.filterOptions()).toEqual({
      countries: ['IN', 'US'],
      departments: ['Engineering', 'Sales'],
      jobTitles: ['Software Engineer'],
    });
  });
});

describe('SequelizeEmployeeRepository bulk operations (MySQL)', () => {
  let sequelize: Sequelize;
  beforeAll(() => {
    sequelize = connectTestDb();
  });
  afterAll(() => sequelize.close());
  beforeEach(resetDb);

  it('creates many rows and finds which emails already exist', async () => {
    const inserted = await repo.createMany([
      anEmployee({ email: 'a@x.io' }),
      anEmployee({ email: 'b@x.io' }),
    ]);

    expect(inserted).toBe(2);
    expect(await repo.findExistingEmails(['a@x.io', 'zzz@x.io'])).toEqual(new Set(['a@x.io']));
  });

  it('rolls back the whole batch if any row conflicts', async () => {
    await insert(anEmployee({ email: 'taken@x.io' }));

    await expect(
      repo.createMany([anEmployee({ email: 'new@x.io' }), anEmployee({ email: 'taken@x.io' })]),
    ).rejects.toBeInstanceOf(ConflictError);

    expect((await repo.list(listQuery)).total).toBe(1); // 'new@x.io' was not kept
  });
});

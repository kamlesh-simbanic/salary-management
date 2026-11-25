import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError, NotFoundError, ValidationError } from '../src/errors.js';
import { EmployeeService } from '../src/services/employeeService.js';
import { InMemoryEmployeeRepository } from './support/inMemoryEmployeeRepository.js';
import { anEmployee } from './support/builders.js';

describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(() => {
    service = new EmployeeService(new InMemoryEmployeeRepository());
  });

  it('creates and then fetches an employee', async () => {
    const created = await service.create(anEmployee());

    expect(await service.get(created.id)).toMatchObject({ fullName: 'Asha Rao' });
  });

  it('rejects a currency that has no exchange rate', async () => {
    await expect(service.create(anEmployee({ currencyCode: 'XYZ' }))).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('rejects a duplicate email on create', async () => {
    await service.create(anEmployee());

    await expect(service.create(anEmployee())).rejects.toBeInstanceOf(ConflictError);
  });

  it('lets an employee keep their own email on update', async () => {
    const created = await service.create(anEmployee());

    const updated = await service.update(created.id, anEmployee({ annualSalary: 2_000_000 }));

    expect(updated.annualSalary).toBe(2_000_000);
  });

  it('throws NotFound for get, update and delete of a missing employee', async () => {
    await expect(service.get(99)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.update(99, anEmployee())).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.remove(99)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('computes pagination metadata', async () => {
    for (let i = 0; i < 5; i++) await service.create(anEmployee({ email: `e${i}@acme.example` }));

    const page = await service.list({ page: 2, pageSize: 2, sort: 'fullName', order: 'asc' });

    expect(page).toMatchObject({ page: 2, pageSize: 2, total: 5, totalPages: 3 });
    expect(page.items).toHaveLength(2);
  });
});

describe('EmployeeService.importCsv', () => {
  const HEADER =
    'fullName,email,jobTitle,department,countryCode,currencyCode,annualSalary,hireDate';
  const row = (email: string, currency = 'INR') =>
    `Asha Rao,${email},Software Engineer,Engineering,IN,${currency},1500000,2022-04-01`;
  const file = (...rows: string[]) => [HEADER, ...rows].join('\n');
  let service: EmployeeService;

  beforeEach(() => {
    service = new EmployeeService(new InMemoryEmployeeRepository());
  });

  it('imports valid rows and reports invalid ones without blocking the rest', async () => {
    const result = await service.importCsv(
      file(row('a@x.io'), 'Bad,bad-email,QA,Eng,IN,INR,1,2022-01-01', row('b@x.io')),
    );

    expect(result).toMatchObject({ totalRows: 3, imported: 2, skipped: 1, errorsTruncated: false });
    expect(result.errors[0]?.row).toBe(3);
    expect(
      (await service.list({ page: 1, pageSize: 10, sort: 'fullName', order: 'asc' })).total,
    ).toBe(2);
  });

  it('skips rows whose email already exists in the database', async () => {
    await service.create(anEmployee({ email: 'a@x.io' }));

    const result = await service.importCsv(file(row('a@x.io'), row('b@x.io')));

    expect(result.imported).toBe(1);
    expect(result.errors).toEqual([{ row: 2, message: 'email: a@x.io already exists' }]);
  });

  it('skips rows with a currency that has no exchange rate', async () => {
    const result = await service.importCsv(file(row('a@x.io', 'XYZ'), row('b@x.io')));

    expect(result.imported).toBe(1);
    expect(result.errors[0]?.message).toMatch(/no exchange rate for XYZ/);
  });

  it('imports nothing and says so when every row is invalid', async () => {
    const result = await service.importCsv(file(row('a@x.io', 'XYZ')));

    expect(result).toMatchObject({ imported: 0, skipped: 1 });
  });

  it('caps the error list but still reports the true skipped count', async () => {
    const rows = Array.from({ length: 250 }, (_, i) => row(`u${i}@x.io`, 'XYZ'));

    const result = await service.importCsv(file(...rows));

    expect(result).toMatchObject({ skipped: 250, errorsTruncated: true });
    expect(result.errors).toHaveLength(200);
  });
});

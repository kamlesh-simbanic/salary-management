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

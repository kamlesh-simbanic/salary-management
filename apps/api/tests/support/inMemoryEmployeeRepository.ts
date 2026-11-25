import type { Employee, EmployeeInput } from '../../src/domain/employee.js';
import { ConflictError } from '../../src/errors.js';
import type { EmployeeRepository } from '../../src/repositories/employeeRepository.js';

// Minimal fake for service/HTTP tests. Filtering/sorting/SQL are covered by the integration tests instead.
export class InMemoryEmployeeRepository implements EmployeeRepository {
  private rows = new Map<number, Employee>();
  private nextId = 1;
  constructor(private readonly currencies = ['USD', 'INR']) {}

  async list(query: { page: number; pageSize: number }) {
    const all = [...this.rows.values()];
    const start = (query.page - 1) * query.pageSize;
    return { items: all.slice(start, start + query.pageSize), total: all.length };
  }
  async findById(id: number) {
    return this.rows.get(id) ?? null;
  }
  async create(input: EmployeeInput) {
    this.assertEmailFree(input.email);
    const employee = { ...input, id: this.nextId++, salaryUsd: input.annualSalary };
    this.rows.set(employee.id, employee);
    return employee;
  }
  async update(id: number, input: EmployeeInput) {
    if (!this.rows.has(id)) return null;
    this.assertEmailFree(input.email, id);
    const employee = { ...input, id, salaryUsd: input.annualSalary };
    this.rows.set(id, employee);
    return employee;
  }
  async delete(id: number) {
    return this.rows.delete(id);
  }
  async currencyExists(code: string) {
    return this.currencies.includes(code);
  }
  async filterOptions() {
    return { countries: [], departments: [], jobTitles: [] };
  }

  private assertEmailFree(email: string, exceptId?: number) {
    for (const e of this.rows.values()) {
      if (e.email === email && e.id !== exceptId) throw new ConflictError(`Email ${email} exists`);
    }
  }
}

import type {
  Employee,
  EmployeeInput,
  EmployeeListQuery,
  FilterOptions,
  Page,
} from '../domain/employee.js';
import { NotFoundError, ValidationError } from '../errors.js';
import type { EmployeeRepository } from '../repositories/employeeRepository.js';

export class EmployeeService {
  constructor(private readonly repo: EmployeeRepository) {}

  async list(query: EmployeeListQuery): Promise<Page<Employee>> {
    const { items, total } = await this.repo.list(query);
    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async get(id: number): Promise<Employee> {
    const employee = await this.repo.findById(id);
    if (!employee) throw new NotFoundError(`Employee ${id} not found`);
    return employee;
  }

  async create(input: EmployeeInput): Promise<Employee> {
    await this.assertCurrencySupported(input.currencyCode);
    return this.repo.create(input);
  }

  async update(id: number, input: EmployeeInput): Promise<Employee> {
    await this.assertCurrencySupported(input.currencyCode);
    const updated = await this.repo.update(id, input);
    if (!updated) throw new NotFoundError(`Employee ${id} not found`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new NotFoundError(`Employee ${id} not found`);
  }

  filterOptions(): Promise<FilterOptions> {
    return this.repo.filterOptions();
  }

  // A salary without an FX rate can't be compared across countries, so reject it up front with a clear message.
  private async assertCurrencySupported(code: string): Promise<void> {
    if (!(await this.repo.currencyExists(code))) {
      throw new ValidationError(`Unsupported currency: ${code}`, [
        { path: 'currencyCode', message: `No exchange rate configured for ${code}` },
      ]);
    }
  }
}

import type {
  Employee,
  EmployeeInput,
  EmployeeListQuery,
  FilterOptions,
  Page,
} from '../domain/employee.js';
import { parseEmployeeCsv, type RowError } from '../domain/employeeCsv.js';
import { NotFoundError, ValidationError } from '../errors.js';
import type { EmployeeRepository } from '../repositories/employeeRepository.js';

const MAX_REPORTED_ERRORS = 200;

export interface ImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: RowError[]; // capped; see errorsTruncated
  errorsTruncated: boolean;
}

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

  /**
   * Imports every valid row and reports the rest by row number, so one typo doesn't block 9,999 good rows.
   * The valid rows are inserted in one transaction: they all land or none do.
   */
  async importCsv(text: string): Promise<ImportResult> {
    const parsed = parseEmployeeCsv(text);
    const errors = [...parsed.errors];
    let candidates = parsed.rows;

    const supported = new Set<string>();
    for (const code of new Set(candidates.map((c) => c.input.currencyCode))) {
      if (await this.repo.currencyExists(code)) supported.add(code);
    }
    candidates = candidates.filter(({ row, input }) => {
      if (supported.has(input.currencyCode)) return true;
      errors.push({ row, message: `currencyCode: no exchange rate for ${input.currencyCode}` });
      return false;
    });

    const existing = await this.repo.findExistingEmails(candidates.map((c) => c.input.email));
    candidates = candidates.filter(({ row, input }) => {
      if (!existing.has(input.email)) return true;
      errors.push({ row, message: `email: ${input.email} already exists` });
      return false;
    });

    const imported = await this.repo.createMany(candidates.map((c) => c.input));
    errors.sort((a, b) => a.row - b.row);
    return {
      totalRows: parsed.totalRows,
      imported,
      skipped: errors.length,
      errors: errors.slice(0, MAX_REPORTED_ERRORS),
      errorsTruncated: errors.length > MAX_REPORTED_ERRORS,
    };
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

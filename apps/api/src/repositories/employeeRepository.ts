import type {
  Employee,
  EmployeeInput,
  EmployeeListQuery,
  FilterOptions,
} from '../domain/employee.js';

// The service depends on this interface, not on Sequelize, so business rules are testable with an in-memory fake.
export interface EmployeeRepository {
  list(query: EmployeeListQuery): Promise<{ items: Employee[]; total: number }>;
  findById(id: number): Promise<Employee | null>;
  /** Throws ConflictError if the email is already used. */
  create(input: EmployeeInput): Promise<Employee>;
  /** Returns null if the employee doesn't exist. Throws ConflictError on a duplicate email. */
  update(id: number, input: EmployeeInput): Promise<Employee | null>;
  delete(id: number): Promise<boolean>;
  /** Which of these emails already belong to an employee (used by the CSV import). */
  findExistingEmails(emails: string[]): Promise<Set<string>>;
  /** Inserts all rows or none (single transaction). Returns the number inserted. */
  createMany(inputs: EmployeeInput[]): Promise<number>;
  currencyExists(code: string): Promise<boolean>;
  /** Currency codes that have an exchange rate, alphabetically. */
  currencyCodes(): Promise<string[]>;
  filterOptions(): Promise<FilterOptions>;
}

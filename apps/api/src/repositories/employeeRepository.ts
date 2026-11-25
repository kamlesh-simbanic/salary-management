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
  currencyExists(code: string): Promise<boolean>;
  filterOptions(): Promise<FilterOptions>;
}

import type { EmployeeInput } from '../../src/domain/employee.js';

// Valid employee with overridable fields, so each test states only what it cares about.
export function anEmployee(overrides: Partial<EmployeeInput> = {}): EmployeeInput {
  return {
    fullName: 'Asha Rao',
    email: 'asha.rao@acme.example',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    countryCode: 'IN',
    currencyCode: 'INR',
    annualSalary: 1_500_000,
    hireDate: '2022-04-01',
    ...overrides,
  };
}

import { describe, expect, it } from 'vitest';
import { employeeInputSchema, employeeListQuerySchema } from '../src/domain/employee.js';
import { toUsd } from '../src/domain/currency.js';
import { anEmployee } from './support/builders.js';

describe('employeeInputSchema', () => {
  it('accepts a valid employee', () => {
    expect(employeeInputSchema.safeParse(anEmployee()).success).toBe(true);
  });

  it('normalises email, country and currency casing and trims text', () => {
    const parsed = employeeInputSchema.parse(
      anEmployee({
        email: '  Asha.Rao@ACME.example ',
        countryCode: 'in',
        currencyCode: 'inr',
        fullName: ' Asha Rao ',
      }),
    );

    expect(parsed).toMatchObject({
      email: 'asha.rao@acme.example',
      countryCode: 'IN',
      currencyCode: 'INR',
      fullName: 'Asha Rao',
    });
  });

  it.each([
    ['zero salary', { annualSalary: 0 }],
    ['negative salary', { annualSalary: -5 }],
    ['salary with 3 decimals', { annualSalary: 10.123 }],
    ['invalid email', { email: 'not-an-email' }],
    ['blank name', { fullName: '   ' }],
    ['3-letter country', { countryCode: 'IND' }],
    ['2-letter currency', { currencyCode: 'IN' }],
    ['impossible date', { hireDate: '2023-02-30' }],
    ['wrong date format', { hireDate: '01/04/2022' }],
  ])('rejects %s', (_label, override) => {
    expect(employeeInputSchema.safeParse(anEmployee(override)).success).toBe(false);
  });
});

describe('employeeListQuerySchema', () => {
  it('applies defaults', () => {
    expect(employeeListQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 25,
      sort: 'fullName',
      order: 'asc',
    });
  });

  it('coerces numeric strings from the query string', () => {
    expect(employeeListQuerySchema.parse({ page: '3', pageSize: '50' })).toMatchObject({
      page: 3,
      pageSize: 50,
    });
  });

  it('caps page size at 100 and rejects unknown sort fields', () => {
    expect(employeeListQuerySchema.safeParse({ pageSize: '101' }).success).toBe(false);
    expect(employeeListQuerySchema.safeParse({ sort: 'password' }).success).toBe(false);
  });
});

describe('toUsd', () => {
  it('converts using the rate and rounds to cents', () => {
    expect(toUsd(1_500_000, 0.012)).toBe(18000);
    expect(toUsd(100, 1.0833)).toBe(108.33);
  });
});

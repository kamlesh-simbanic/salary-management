import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/api/http';
import {
  EMPTY_FORM,
  describeApiError,
  toInput,
  validateForm,
  type EmployeeFormValues,
} from '../src/features/employees/formValues';

const valid: EmployeeFormValues = {
  fullName: 'Asha Rao',
  email: 'asha@acme.example',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  countryCode: 'IN',
  currencyCode: 'INR',
  annualSalary: '1500000',
  hireDate: '2022-04-01',
};

describe('validateForm', () => {
  it('accepts a complete form', () => {
    expect(validateForm(valid)).toEqual({});
  });

  it('flags every required field on an empty form', () => {
    expect(Object.keys(validateForm(EMPTY_FORM)).sort()).toEqual(Object.keys(EMPTY_FORM).sort());
  });

  it.each([
    ['zero', '0'],
    ['negative', '-5'],
    ['text', 'lots'],
    ['3 decimals', '10.123'],
  ])('rejects a %s salary', (_label, salary) => {
    expect(validateForm({ ...valid, annualSalary: salary }).annualSalary).toBeDefined();
  });

  it('rejects a malformed email and a country that is not 2 letters', () => {
    const errors = validateForm({ ...valid, email: 'nope', countryCode: 'IND' });

    expect(errors.email).toBeDefined();
    expect(errors.countryCode).toBeDefined();
  });
});

describe('toInput', () => {
  it('trims text, upper-cases the country and converts salary to a number', () => {
    const input = toInput({
      ...valid,
      fullName: '  Asha Rao ',
      countryCode: 'in',
      annualSalary: ' 1500000.50 ',
    });

    expect(input).toMatchObject({
      fullName: 'Asha Rao',
      countryCode: 'IN',
      annualSalary: 1_500_000.5,
    });
  });
});

describe('describeApiError', () => {
  it('puts a duplicate-email conflict on the email field', () => {
    const result = describeApiError(new ApiError(409, 'CONFLICT', 'Email already exists'));

    expect(result).toEqual({ fields: { email: 'Email already exists' } });
  });

  it('maps server validation details to their fields and ignores unknown paths', () => {
    const err = new ApiError(400, 'VALIDATION_ERROR', 'Invalid input', [
      { path: 'annualSalary', message: 'Salary must be greater than 0' },
      { path: 'somethingElse', message: 'ignored' },
    ]);

    expect(describeApiError(err)).toEqual({
      fields: { annualSalary: 'Salary must be greater than 0' },
    });
  });

  it('falls back to a general message for anything else', () => {
    expect(describeApiError(new ApiError(0, 'NETWORK', 'Cannot reach the server')).general).toBe(
      'Cannot reach the server',
    );
    expect(describeApiError(new Error('x')).general).toBe('Something went wrong');
  });
});

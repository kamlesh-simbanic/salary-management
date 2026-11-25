import { ApiError } from '../../api/http';
import type { Employee, EmployeeInput } from '../../api/types';

// Form fields are always strings (that is what inputs hold); they become typed values only in toInput().
export interface EmployeeFormValues {
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  countryCode: string;
  currencyCode: string;
  annualSalary: string;
  hireDate: string;
}
export type FormErrors = Partial<Record<keyof EmployeeFormValues, string>>;

export const EMPTY_FORM: EmployeeFormValues = {
  fullName: '',
  email: '',
  jobTitle: '',
  department: '',
  countryCode: '',
  currencyCode: '',
  annualSalary: '',
  hireDate: '',
};

const FIELD_NAMES = Object.keys(EMPTY_FORM) as (keyof EmployeeFormValues)[];

export function fromEmployee(e: Employee): EmployeeFormValues {
  return {
    fullName: e.fullName,
    email: e.email,
    jobTitle: e.jobTitle,
    department: e.department,
    countryCode: e.countryCode,
    currencyCode: e.currencyCode,
    annualSalary: String(e.annualSalary),
    hireDate: e.hireDate,
  };
}

/**
 * Quick feedback before a round trip. The server re-validates everything and stays the source of truth;
 * this only covers the mistakes a person can fix immediately.
 */
export function validateForm(v: EmployeeFormValues): FormErrors {
  const errors: FormErrors = {};
  if (!v.fullName.trim()) errors.fullName = 'Name is required';
  if (!v.email.trim()) errors.email = 'Email is required';
  else if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) errors.email = 'Enter a valid email address';
  if (!v.jobTitle.trim()) errors.jobTitle = 'Job title is required';
  if (!v.department.trim()) errors.department = 'Department is required';
  if (!/^[A-Za-z]{2}$/.test(v.countryCode.trim()))
    errors.countryCode = 'Use a 2-letter country code, e.g. IN';
  if (!v.currencyCode) errors.currencyCode = 'Choose a currency';
  if (!v.annualSalary.trim()) errors.annualSalary = 'Salary is required';
  else if (!/^\d+(\.\d{1,2})?$/.test(v.annualSalary.trim()) || Number(v.annualSalary) <= 0) {
    errors.annualSalary = 'Enter an amount greater than 0 (max 2 decimals)';
  }
  if (!v.hireDate) errors.hireDate = 'Hire date is required';
  return errors;
}

export function toInput(v: EmployeeFormValues): EmployeeInput {
  return {
    fullName: v.fullName.trim(),
    email: v.email.trim(),
    jobTitle: v.jobTitle.trim(),
    department: v.department.trim(),
    countryCode: v.countryCode.trim().toUpperCase(),
    currencyCode: v.currencyCode,
    annualSalary: Number(v.annualSalary),
    hireDate: v.hireDate,
  };
}

/** Turns an API failure into per-field messages where possible, otherwise one general message. */
export function describeApiError(err: unknown): { fields: FormErrors; general?: string } {
  if (!(err instanceof ApiError)) return { fields: {}, general: 'Something went wrong' };

  if (err.code === 'CONFLICT') return { fields: { email: err.message } };

  if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details)) {
    const fields: FormErrors = {};
    for (const d of err.details as { path?: string; message?: string }[]) {
      const field = FIELD_NAMES.find((f) => f === d.path);
      if (field && d.message && !fields[field]) fields[field] = d.message;
    }
    if (Object.keys(fields).length > 0) return { fields };
  }
  return { fields: {}, general: err.message };
}

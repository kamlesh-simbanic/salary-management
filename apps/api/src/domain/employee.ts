import { z } from 'zod';

// ---------- Input (create / update). One schema, reused by the CSV import later. ----------
const isRealDate = (value: string) => {
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
};

export const employeeInputSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().toLowerCase().email('Invalid email').max(190),
  jobTitle: z.string().trim().min(1, 'Job title is required').max(100),
  department: z.string().trim().min(1, 'Department is required').max(100),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, 'Use a 2-letter country code'),
  currencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Use a 3-letter currency code'),
  annualSalary: z
    .number({ error: 'Salary must be a number' })
    .positive('Salary must be greater than 0')
    .max(99_999_999_999.99, 'Salary is too large')
    .refine((n) => Math.round(n * 100) / 100 === n, 'Salary can have at most 2 decimal places'),
  hireDate: z.string().refine(isRealDate, 'Use a valid date in YYYY-MM-DD format'),
});

export type EmployeeInput = z.infer<typeof employeeInputSchema>;

// ---------- Output ----------
export interface Employee extends EmployeeInput {
  id: number;
  salaryUsd: number; // annualSalary converted at the current static rate
}

// ---------- List query ----------
export const SORT_FIELDS = [
  'fullName',
  'jobTitle',
  'department',
  'countryCode',
  'hireDate',
  'salaryUsd',
] as const;

export const employeeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().max(100).optional(),
  country: z.string().trim().toUpperCase().length(2).optional(),
  department: z.string().trim().min(1).optional(),
  jobTitle: z.string().trim().min(1).optional(),
  sort: z.enum(SORT_FIELDS).default('fullName'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface FilterOptions {
  countries: string[];
  departments: string[];
  jobTitles: string[];
}

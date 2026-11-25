// Mirrors the API's JSON shapes (apps/api/src/domain). Kept by hand: with two small apps a shared package
// would cost more than it saves; an OpenAPI-generated client is the upgrade if the API grows.
export interface Employee {
  id: number;
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  countryCode: string;
  currencyCode: string;
  annualSalary: number; // local currency
  salaryUsd: number;
  hireDate: string; // YYYY-MM-DD
}

/** What the API accepts on create/update (an Employee without the server-computed fields). */
export type EmployeeInput = Omit<Employee, 'id' | 'salaryUsd'>;

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

export const SORT_FIELDS = [
  'fullName',
  'jobTitle',
  'department',
  'countryCode',
  'hireDate',
  'salaryUsd',
] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export interface EmployeeListParams {
  page: number; // 1-based, as in the API
  pageSize: number;
  q: string;
  country: string;
  department: string;
  jobTitle: string;
  sort: SortField;
  order: 'asc' | 'desc';
}

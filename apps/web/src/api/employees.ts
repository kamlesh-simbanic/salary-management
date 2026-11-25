import { request, toQueryString } from './http';
import type { Employee, EmployeeInput, EmployeeListParams, FilterOptions, Page } from './types';

export function listEmployees(params: EmployeeListParams, signal?: AbortSignal) {
  return request<Page<Employee>>(`/employees${toQueryString({ ...params })}`, { signal });
}

export function getFilterOptions(signal?: AbortSignal) {
  return request<FilterOptions>('/meta/filters', { signal });
}

export async function getCurrencies(signal?: AbortSignal) {
  const body = await request<{ currencies: string[] }>('/meta/currencies', { signal });
  return body.currencies;
}

const jsonBody = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export function createEmployee(input: EmployeeInput) {
  return request<Employee>('/employees', jsonBody('POST', input));
}

export function updateEmployee(id: number, input: EmployeeInput) {
  return request<Employee>(`/employees/${id}`, jsonBody('PUT', input));
}

export function deleteEmployee(id: number) {
  return request<void>(`/employees/${id}`, { method: 'DELETE' });
}

export interface ImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[]; // capped by the server
  errorsTruncated: boolean;
}

/** The file's text is sent as the body; the API parses and validates it row by row. */
export function importEmployees(csvText: string) {
  return request<ImportResult>('/employees/import', {
    method: 'POST',
    headers: { 'Content-Type': 'text/csv' },
    body: csvText,
  });
}

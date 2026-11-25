import { request, toQueryString } from './http';
import type { Employee, EmployeeListParams, FilterOptions, Page } from './types';

export function listEmployees(params: EmployeeListParams, signal?: AbortSignal) {
  return request<Page<Employee>>(`/employees${toQueryString({ ...params })}`, { signal });
}

export function getFilterOptions(signal?: AbortSignal) {
  return request<FilterOptions>('/meta/filters', { signal });
}

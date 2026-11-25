import { Alert, Button } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { getFilterOptions } from '../../api/employees';
import type { EmployeeListParams, FilterOptions, SortField } from '../../api/types';
import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeTable } from './EmployeeTable';
import { useEmployees } from './useEmployees';

const SEARCH_DEBOUNCE_MS = 300;

const INITIAL: EmployeeListParams = {
  page: 1,
  pageSize: 25,
  q: '',
  country: '',
  department: '',
  jobTitle: '',
  sort: 'fullName',
  order: 'asc',
};

export function EmployeeDirectory() {
  const [params, setParams] = useState(INITIAL);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { data, loading, error, reload } = useEmployees(params);

  useEffect(() => {
    const controller = new AbortController();
    getFilterOptions(controller.signal)
      .then(setOptions)
      .catch(() => undefined); // dropdowns just stay empty
    return () => controller.abort();
  }, []);

  useEffect(() => () => clearTimeout(searchTimer.current), []);

  // Typing updates the box immediately, but the query only changes once typing pauses. The new text and
  // "back to page 1" are applied in one update, so five keystrokes produce a single request.
  const changeSearch = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(
      () => setParams((p) => ({ ...p, q: value.trim(), page: 1 })),
      SEARCH_DEBOUNCE_MS,
    );
  };

  const changeFilters = (changes: Partial<EmployeeListParams>) =>
    setParams((p) => ({ ...p, ...changes, page: 1 }));

  const toggleSort = (field: SortField) =>
    setParams((p) => ({
      ...p,
      sort: field,
      order: p.sort === field && p.order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));

  const hasActiveFilters = Boolean(
    search || params.country || params.department || params.jobTitle,
  );
  const clearFilters = () => {
    clearTimeout(searchTimer.current);
    setSearch('');
    setParams((p) => ({ ...p, q: '', country: '', department: '', jobTitle: '', page: 1 }));
  };

  return (
    <>
      <EmployeeFilters
        search={search}
        onSearchChange={changeSearch}
        country={params.country}
        department={params.department}
        jobTitle={params.jobTitle}
        options={options}
        onChange={changeFilters}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={reload}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      <EmployeeTable
        employees={data?.items ?? []}
        total={data?.total ?? 0}
        loading={loading}
        params={params}
        onSort={toggleSort}
        onPageChange={(page) => setParams((p) => ({ ...p, page }))}
        onPageSizeChange={(pageSize) => changeFilters({ pageSize })}
      />
    </>
  );
}

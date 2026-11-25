import AddIcon from '@mui/icons-material/Add';
import { Alert, Box, Button, Snackbar } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import {
  createEmployee,
  deleteEmployee,
  getCurrencies,
  getFilterOptions,
  updateEmployee,
} from '../../api/employees';
import type {
  Employee,
  EmployeeInput,
  EmployeeListParams,
  FilterOptions,
  SortField,
} from '../../api/types';
import { DeleteEmployeeDialog } from './DeleteEmployeeDialog';
import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeFormDialog } from './EmployeeFormDialog';
import { EmployeeTable } from './EmployeeTable';
import { useEmployees } from './useEmployees';

const SEARCH_DEBOUNCE_MS = 300;

type Dialog =
  { kind: 'form'; employee: Employee | null } | { kind: 'delete'; employee: Employee } | null;

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
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [toast, setToast] = useState<string>();
  const { data, loading, error, reload } = useEmployees(params);

  const loadOptions = () =>
    getFilterOptions()
      .then(setOptions)
      .catch(() => undefined); // dropdowns just stay empty

  useEffect(() => {
    loadOptions();
    getCurrencies()
      .then(setCurrencies)
      .catch(() => undefined);
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

  // After a change, close the dialog, tell the user, refresh the table and the dropdowns (a new department may exist now).
  const afterMutation = (message: string) => {
    setDialog(null);
    setToast(message);
    reload();
    loadOptions();
  };

  const save = async (input: EmployeeInput) => {
    const editing = dialog?.kind === 'form' ? dialog.employee : null;
    if (editing) await updateEmployee(editing.id, input);
    else await createEmployee(input);
    afterMutation(editing ? 'Employee updated' : 'Employee added');
  };

  const remove = async (employee: Employee) => {
    await deleteEmployee(employee.id);
    afterMutation(`${employee.fullName} deleted`);
  };

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
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialog({ kind: 'form', employee: null })}
        >
          Add employee
        </Button>
      </Box>
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
        onEdit={(employee) => setDialog({ kind: 'form', employee })}
        onDelete={(employee) => setDialog({ kind: 'delete', employee })}
        onPageChange={(page) => setParams((p) => ({ ...p, page }))}
        onPageSizeChange={(pageSize) => changeFilters({ pageSize })}
      />
      {dialog?.kind === 'form' && (
        <EmployeeFormDialog
          employee={dialog.employee}
          options={options}
          currencies={currencies}
          onClose={() => setDialog(null)}
          onSubmit={save}
        />
      )}
      {dialog?.kind === 'delete' && (
        <DeleteEmployeeDialog
          employee={dialog.employee}
          onClose={() => setDialog(null)}
          onConfirm={() => remove(dialog.employee)}
        />
      )}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(undefined)}
        message={toast}
      />
    </>
  );
}

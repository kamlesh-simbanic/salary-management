import {
  Box,
  IconButton,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import type { Employee, EmployeeListParams, SortField } from '../../api/types';
import { countryName, formatMoney } from '../../lib/format';

interface Column {
  field: SortField;
  label: string;
  align?: 'right';
}

const COLUMNS: Column[] = [
  { field: 'fullName', label: 'Employee' },
  { field: 'jobTitle', label: 'Job title' },
  { field: 'department', label: 'Department' },
  { field: 'countryCode', label: 'Country' },
  { field: 'hireDate', label: 'Hired' },
  { field: 'salaryUsd', label: 'Salary (USD)', align: 'right' },
];

interface Props {
  employees: Employee[];
  total: number;
  loading: boolean;
  params: EmployeeListParams;
  onSort: (field: SortField) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onPageChange: (page: number) => void; // 1-based
  onPageSizeChange: (pageSize: number) => void;
}

export function EmployeeTable({
  employees,
  total,
  loading,
  params,
  onSort,
  onEdit,
  onDelete,
  onPageChange,
  onPageSizeChange,
}: Props) {
  return (
    <Paper variant="outlined">
      <Box sx={{ height: 4 }}>{loading && <LinearProgress />}</Box>
      <TableContainer>
        <Table size="small" aria-label="Employees" sx={{ opacity: loading ? 0.6 : 1 }}>
          <TableHead>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableCell
                  key={col.field}
                  align={col.align}
                  sortDirection={params.sort === col.field ? params.order : false}
                >
                  <TableSortLabel
                    active={params.sort === col.field}
                    direction={params.sort === col.field ? params.order : 'asc'}
                    onClick={() => onSort(col.field)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell align="right" sx={{ width: 100 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((e) => (
              <TableRow key={e.id} hover>
                <TableCell>
                  <Typography variant="body2">{e.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {e.email}
                  </Typography>
                </TableCell>
                <TableCell>{e.jobTitle}</TableCell>
                <TableCell>{e.department}</TableCell>
                <TableCell>{countryName(e.countryCode)}</TableCell>
                <TableCell>{e.hireDate}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{formatMoney(e.salaryUsd, 'USD')}</Typography>
                  {e.currencyCode !== 'USD' && (
                    <Typography variant="caption" color="text.secondary">
                      {formatMoney(e.annualSalary, e.currencyCode)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      aria-label={`Edit ${e.fullName}`}
                      onClick={() => onEdit(e)}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      aria-label={`Delete ${e.fullName}`}
                      onClick={() => onDelete(e)}
                    >
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!loading && employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 1} align="center" sx={{ py: 6 }}>
                  No employees match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={params.page - 1} // MUI pages are 0-based, the API's are 1-based
        rowsPerPage={params.pageSize}
        rowsPerPageOptions={[10, 25, 50, 100]}
        onPageChange={(_e, page) => onPageChange(page + 1)}
        onRowsPerPageChange={(e) => onPageSizeChange(Number(e.target.value))}
      />
    </Paper>
  );
}

import { Button, Stack, TextField } from '@mui/material';
import type { FilterOptions } from '../../api/types';
import { FilterSelects, type FilterValues } from './FilterSelects';

interface Props extends FilterValues {
  search: string;
  onSearchChange: (value: string) => void;
  options: FilterOptions | null;
  onChange: (changes: Partial<FilterValues>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function EmployeeFilters({
  search,
  onSearchChange,
  onClear,
  hasActiveFilters,
  ...selects
}: Props) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
      <TextField
        label="Search name or email"
        size="small"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ minWidth: 260 }}
      />
      <FilterSelects {...selects} />
      {hasActiveFilters && (
        <Button onClick={onClear} size="small">
          Clear filters
        </Button>
      )}
    </Stack>
  );
}

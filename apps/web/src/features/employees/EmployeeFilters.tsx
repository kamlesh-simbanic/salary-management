import { Button, MenuItem, Stack, TextField } from '@mui/material';
import type { FilterOptions } from '../../api/types';
import { countryName } from '../../lib/format';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  country: string;
  department: string;
  jobTitle: string;
  options: FilterOptions | null;
  onChange: (changes: { country?: string; department?: string; jobTitle?: string }) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const ALL = '';

export function EmployeeFilters(props: Props) {
  const { options } = props;
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
      <TextField
        label="Search name or email"
        size="small"
        value={props.search}
        onChange={(e) => props.onSearchChange(e.target.value)}
        sx={{ minWidth: 260 }}
      />
      <TextField
        select
        label="Country"
        size="small"
        value={props.country}
        onChange={(e) => props.onChange({ country: e.target.value })}
        sx={{ minWidth: 160 }}
      >
        <MenuItem value={ALL}>All countries</MenuItem>
        {options?.countries.map((c) => (
          <MenuItem key={c} value={c}>
            {countryName(c)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Department"
        size="small"
        value={props.department}
        onChange={(e) => props.onChange({ department: e.target.value })}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value={ALL}>All departments</MenuItem>
        {options?.departments.map((d) => (
          <MenuItem key={d} value={d}>
            {d}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Job title"
        size="small"
        value={props.jobTitle}
        onChange={(e) => props.onChange({ jobTitle: e.target.value })}
        sx={{ minWidth: 200 }}
      >
        <MenuItem value={ALL}>All job titles</MenuItem>
        {options?.jobTitles.map((t) => (
          <MenuItem key={t} value={t}>
            {t}
          </MenuItem>
        ))}
      </TextField>
      {props.hasActiveFilters && (
        <Button onClick={props.onClear} size="small">
          Clear filters
        </Button>
      )}
    </Stack>
  );
}

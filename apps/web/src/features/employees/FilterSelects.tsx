import { MenuItem, TextField } from '@mui/material';
import type { FilterOptions } from '../../api/types';
import { countryName } from '../../lib/format';

export interface FilterValues {
  country: string;
  department: string;
  jobTitle: string;
}

interface Props extends FilterValues {
  options: FilterOptions | null;
  onChange: (changes: Partial<FilterValues>) => void;
}

// The three dropdown filters, shared by the directory and the insights page so both behave the same.
export function FilterSelects({ country, department, jobTitle, options, onChange }: Props) {
  return (
    <>
      <TextField
        select
        label="Country"
        size="small"
        value={country}
        onChange={(e) => onChange({ country: e.target.value })}
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="">All countries</MenuItem>
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
        value={department}
        onChange={(e) => onChange({ department: e.target.value })}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="">All departments</MenuItem>
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
        value={jobTitle}
        onChange={(e) => onChange({ jobTitle: e.target.value })}
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="">All job titles</MenuItem>
        {options?.jobTitles.map((t) => (
          <MenuItem key={t} value={t}>
            {t}
          </MenuItem>
        ))}
      </TextField>
    </>
  );
}

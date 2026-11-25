import { Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { FilterSelects, type FilterValues } from '../employees/FilterSelects';
import { useFilterOptions } from '../../lib/useFilterOptions';
import { DistributionChart } from './DistributionChart';
import { OutliersTable } from './OutliersTable';
import { SummaryTable } from './SummaryTable';

const NO_FILTERS: FilterValues = { country: '', department: '', jobTitle: '' };

export function InsightsPage() {
  const [filters, setFilters] = useState<FilterValues>(NO_FILTERS);
  const { options } = useFilterOptions();
  const active = Object.values(filters).some(Boolean);

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h5" component="h2" gutterBottom>
          How we pay people
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <FilterSelects
            {...filters}
            options={options}
            onChange={(c) => setFilters((f) => ({ ...f, ...c }))}
          />
          {active && (
            <Button size="small" onClick={() => setFilters(NO_FILTERS)}>
              Clear filters
            </Button>
          )}
        </Stack>
      </div>
      <SummaryTable filters={filters} />
      <DistributionChart filters={filters} />
      <OutliersTable filters={filters} />
    </Stack>
  );
}

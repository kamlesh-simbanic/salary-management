import {
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import { getSummary, type GroupBy, type InsightFilters } from '../../api/insights';
import { countryName, formatMoney } from '../../lib/format';
import { useAsync } from '../../lib/useAsync';
import { useState } from 'react';

const GROUPS: { value: GroupBy; label: string }[] = [
  { value: 'country', label: 'Country' },
  { value: 'department', label: 'Department' },
  { value: 'jobTitle', label: 'Job title' },
];

export function SummaryTable({ filters }: { filters: InsightFilters }) {
  const [groupBy, setGroupBy] = useState<GroupBy>('country');
  const { data, loading, error } = useAsync(getSummary, { ...filters, groupBy });
  const label = (group: string) => (data?.groupBy === 'country' ? countryName(group) : group);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="h6" component="h2">
          Pay by group
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={groupBy}
          onChange={(_e, value: GroupBy | null) => value && setGroupBy(value)}
          aria-label="Group by"
        >
          {GROUPS.map((g) => (
            <ToggleButton key={g.value} value={g.value}>
              {g.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Annual base salary in USD, converted at the static exchange rates.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ my: 1 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ height: 4, mt: 1 }}>{loading && <LinearProgress />}</Box>
      <TableContainer sx={{ maxHeight: 420, opacity: loading ? 0.6 : 1 }}>
        <Table size="small" stickyHeader aria-label="Pay by group">
          <TableHead>
            <TableRow>
              <TableCell>{GROUPS.find((g) => g.value === groupBy)?.label}</TableCell>
              <TableCell align="right">Headcount</TableCell>
              <TableCell align="right">Min</TableCell>
              <TableCell align="right">Median</TableCell>
              <TableCell align="right">Average</TableCell>
              <TableCell align="right">Max</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.rows.map((r) => (
              <TableRow key={r.group} hover>
                <TableCell>{label(r.group)}</TableCell>
                <TableCell align="right">{r.headcount.toLocaleString('en-US')}</TableCell>
                <TableCell align="right">{formatMoney(r.minUsd, 'USD')}</TableCell>
                <TableCell align="right">
                  <strong>{formatMoney(r.medianUsd, 'USD')}</strong>
                </TableCell>
                <TableCell align="right">{formatMoney(r.avgUsd, 'USD')}</TableCell>
                <TableCell align="right">{formatMoney(r.maxUsd, 'USD')}</TableCell>
              </TableRow>
            ))}
            {!loading && data?.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No employees match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

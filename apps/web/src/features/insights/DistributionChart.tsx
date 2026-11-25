import {
  Alert,
  Box,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getDistribution, type InsightFilters, type SalaryBucket } from '../../api/insights';
import { formatCompactUsd } from '../../lib/format';
import { useAsync } from '../../lib/useAsync';

const bandLabel = (b: SalaryBucket) => `${formatCompactUsd(b.from)}–${formatCompactUsd(b.to)}`;

export function DistributionChart({ filters }: { filters: InsightFilters }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const { data, loading, error } = useAsync(getDistribution, filters);
  const theme = useTheme();
  const total = data?.total ?? 0;
  const pct = (count: number) => (total ? `${((count / total) * 100).toFixed(1)}%` : '0%');

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="h6" component="h2">
          Salary distribution
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_e, v: 'chart' | 'table' | null) => v && setView(v)}
          aria-label="View"
        >
          <ToggleButton value="chart">Chart</ToggleButton>
          <ToggleButton value="table">Table</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Number of employees per annual salary band (USD)
        {data ? `, ${total.toLocaleString('en-US')} employees` : ''}.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ my: 1 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ height: 4, mt: 1 }}>{loading && <LinearProgress />}</Box>

      {data && data.buckets.length === 0 && (
        <Typography sx={{ py: 6, textAlign: 'center' }}>
          No employees match these filters.
        </Typography>
      )}

      {data && data.buckets.length > 0 && view === 'chart' && (
        <Box
          sx={{ height: 320, opacity: loading ? 0.6 : 1 }}
          role="img"
          aria-label={`Bar chart of employee counts across ${data.buckets.length} salary bands`}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 600, height: 320 }}
          >
            <BarChart
              data={data.buckets.map((b) => ({ ...b, label: bandLabel(b) }))}
              margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <CartesianGrid vertical={false} stroke={theme.palette.divider} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: theme.palette.divider }}
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                allowDecimals={false}
                tickFormatter={(v: number) => v.toLocaleString('en-US')}
              />
              <Tooltip
                cursor={{ fill: theme.palette.action.hover }}
                formatter={(value) => [
                  `${Number(value).toLocaleString('en-US')} (${pct(Number(value))})`,
                  'Employees',
                ]}
                labelFormatter={(label) => `Salary ${label}`}
              />
              {/* Rounded data-end (top), square at the baseline; one hue because it is one measure. */}
              <Bar
                dataKey="count"
                fill={theme.palette.primary.main}
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}

      {data && data.buckets.length > 0 && view === 'table' && (
        <Table size="small" aria-label="Salary distribution">
          <TableHead>
            <TableRow>
              <TableCell>Salary band (USD)</TableCell>
              <TableCell align="right">Employees</TableCell>
              <TableCell align="right">Share</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.buckets.map((b) => (
              <TableRow key={b.from}>
                <TableCell>{bandLabel(b)}</TableCell>
                <TableCell align="right">{b.count.toLocaleString('en-US')}</TableCell>
                <TableCell align="right">{pct(b.count)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
}

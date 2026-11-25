import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { getOutliers, type InsightFilters } from '../../api/insights';
import { countryName, formatMoney } from '../../lib/format';
import { useAsync } from '../../lib/useAsync';

export function OutliersTable({ filters }: { filters: InsightFilters }) {
  const { data, loading, error } = useAsync(getOutliers, filters);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" component="h2">
        Pay outliers
      </Typography>
      <Typography variant="caption" color="text.secondary" component="p">
        People paid far above or below others with the same job title in the same country (more than
        1.5 × the interquartile range outside the middle 50%; groups under 5 people are skipped).
        These can be pay inequities or data-entry mistakes, so review rather than assume.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ my: 1 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ height: 4, mt: 1 }}>{loading && <LinearProgress />}</Box>
      {data && (
        <>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {data.total === 0
              ? 'No outliers found for these filters.'
              : `${data.total.toLocaleString('en-US')} outlier${data.total === 1 ? '' : 's'}${data.items.length < data.total ? `; showing the ${data.items.length} furthest from their peers` : ''}`}
          </Typography>
          {data.items.length > 0 && (
            <TableContainer sx={{ maxHeight: 440, opacity: loading ? 0.6 : 1 }}>
              <Table size="small" stickyHeader aria-label="Pay outliers">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Job title</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell align="right">Salary (USD)</TableCell>
                    <TableCell align="right">Peer median</TableCell>
                    <TableCell align="right">Normal range</TableCell>
                    <TableCell>Difference</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.items.map((o) => (
                    <TableRow key={o.id} hover>
                      <TableCell>{o.fullName}</TableCell>
                      <TableCell>{o.jobTitle}</TableCell>
                      <TableCell>{countryName(o.countryCode)}</TableCell>
                      <TableCell align="right">{formatMoney(o.salaryUsd, 'USD')}</TableCell>
                      <TableCell align="right">
                        {formatMoney(o.medianUsd, 'USD')}
                        <Typography variant="caption" color="text.secondary" component="div">
                          {o.peerCount} peers
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatMoney(Math.max(0, o.lowerFenceUsd), 'USD')} –{' '}
                        {formatMoney(o.upperFenceUsd, 'USD')}
                      </TableCell>
                      <TableCell>
                        {/* Icon + text, never colour alone. */}
                        <Chip
                          size="small"
                          variant="outlined"
                          color={o.direction === 'above' ? 'warning' : 'info'}
                          icon={o.direction === 'above' ? <ArrowUpward /> : <ArrowDownward />}
                          label={`${o.deviationPct}% ${o.direction} median`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Paper>
  );
}

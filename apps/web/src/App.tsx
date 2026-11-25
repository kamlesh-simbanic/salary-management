import { AppBar, CircularProgress, Container, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { EmployeeDirectory } from './features/employees/EmployeeDirectory';
import { ImportPage } from './features/import/ImportPage';
// Loaded on demand: it carries the charting library, which the directory page doesn't need.
const InsightsPage = lazy(() =>
  import('./features/insights/InsightsPage').then((m) => ({ default: m.InsightsPage })),
);

const PAGES = [
  { path: '/', label: 'Employees' },
  { path: '/insights', label: 'Insights' },
  { path: '/import', label: 'Import' },
];

export function App() {
  const { pathname } = useLocation();
  const current = PAGES.some((p) => p.path === pathname) ? pathname : false;

  return (
    <>
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 4 }}>
          <Typography variant="h6" component="h1">
            ACME Salary Management
          </Typography>
          <Tabs value={current} aria-label="Main navigation">
            {PAGES.map((p) => (
              <Tab key={p.path} value={p.path} label={p.label} component={Link} to={p.path} />
            ))}
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<EmployeeDirectory />} />
          <Route
            path="/insights"
            element={
              <Suspense fallback={<CircularProgress aria-label="Loading insights" />}>
                <InsightsPage />
              </Suspense>
            }
          />
          <Route path="/import" element={<ImportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </>
  );
}

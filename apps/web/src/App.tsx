import { AppBar, Container, Toolbar, Typography } from '@mui/material';
import { EmployeeDirectory } from './features/employees/EmployeeDirectory';

export function App() {
  return (
    <>
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar>
          <Typography variant="h6" component="h1">
            ACME Salary Management
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <EmployeeDirectory />
      </Container>
    </>
  );
}

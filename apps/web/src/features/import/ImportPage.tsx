import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFile from '@mui/icons-material/UploadFile';
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { importEmployees, type ImportResult } from '../../api/employees';
import { downloadTextFile, errorsToCsv, TEMPLATE_CSV } from '../../lib/csv';

const MAX_BYTES = 5 * 1024 * 1024; // mirrors the API's request limit, so the user finds out before uploading

export function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<ImportResult>();

  const choose = (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0] ?? null;
    event.target.value = ''; // lets the same file be picked again after fixing it
    setResult(undefined);
    setError(
      chosen && chosen.size > MAX_BYTES
        ? 'This file is larger than 5 MB. Split it into smaller files.'
        : undefined,
    );
    setFile(chosen && chosen.size <= MAX_BYTES ? chosen : null);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError(undefined);
    setResult(undefined);
    try {
      setResult(await importEmployees(await file.text()));
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 900 }}>
      <div>
        <Typography variant="h5" component="h2" gutterBottom>
          Import employees from CSV
        </Typography>
        <Typography color="text.secondary">
          Export your Excel sheet as CSV and upload it here. Valid rows are added; rows with
          problems are skipped and listed so you can fix them and upload again. Existing employees
          are never changed: a row whose email already exists is skipped.
        </Typography>
      </div>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" component="h3" gutterBottom>
          Columns
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <code>
            fullName, email, jobTitle, department, countryCode, currencyCode, annualSalary, hireDate
          </code>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Header names are flexible (&quot;Full Name&quot;, &quot;Country&quot;, &quot;Salary&quot;
          also work) and column order does not matter. Country is a 2-letter code (IN), currency a
          3-letter code (INR), salary is the yearly amount in that local currency, and dates are
          YYYY-MM-DD.
        </Typography>
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={() => downloadTextFile('employee-import-template.csv', TEMPLATE_CSV)}
        >
          Download template
        </Button>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction="row"
          spacing={2}
          useFlexGap
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFile />}
            disabled={uploading}
          >
            Choose CSV file
            <input type="file" hidden accept=".csv,text/csv" onChange={choose} />
          </Button>
          <Typography color={file ? 'text.primary' : 'text.secondary'}>
            {file
              ? `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`
              : 'No file chosen'}
          </Typography>
          <Button
            variant="contained"
            onClick={upload}
            disabled={!file || uploading}
            startIcon={uploading ? <CircularProgress size={16} /> : undefined}
          >
            {uploading ? 'Importing…' : 'Import'}
          </Button>
        </Stack>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {result && <ResultPanel result={result} />}
    </Stack>
  );
}

function ResultPanel({ result }: { result: ImportResult }) {
  const nothingImported = result.imported === 0;
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Alert
        severity={nothingImported ? 'warning' : result.skipped > 0 ? 'info' : 'success'}
        icon={nothingImported ? undefined : <CheckCircleOutlined />}
      >
        {result.imported.toLocaleString('en-US')} of {result.totalRows.toLocaleString('en-US')} rows
        imported
        {result.skipped > 0 ? `, ${result.skipped.toLocaleString('en-US')} skipped.` : '.'}
      </Alert>

      {result.imported > 0 && (
        <Button component={Link} to="/" size="small" sx={{ mt: 1 }}>
          View employees
        </Button>
      )}

      {result.errors.length > 0 && (
        <>
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}
          >
            <Typography variant="subtitle1" component="h3">
              Rows that were skipped
            </Typography>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => downloadTextFile('import-errors.csv', errorsToCsv(result.errors))}
            >
              Download error report
            </Button>
          </Stack>
          {result.errorsTruncated && (
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
              Showing the first {result.errors.length} problems. Fix these and upload again to see
              the rest.
            </Typography>
          )}
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader aria-label="Skipped rows">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 90 }}>Row</TableCell>
                  <TableCell>Problem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.errors.map((e) => (
                  <TableRow key={`${e.row}-${e.message}`}>
                    <TableCell>{e.row}</TableCell>
                    <TableCell>{e.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Paper>
  );
}

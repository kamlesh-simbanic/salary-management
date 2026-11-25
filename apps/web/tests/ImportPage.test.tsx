import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImportPage } from '../src/features/import/ImportPage';

const CSV = 'fullName,email\nAsha,asha@acme.example\n';
const csvFile = (content = CSV, name = 'people.csv') =>
  new File([content], name, { type: 'text/csv' });

function stubImport(respond: () => Response) {
  const fetchMock = vi.fn(async () => respond());
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
const setup = () =>
  render(
    <MemoryRouter>
      <ImportPage />
    </MemoryRouter>,
  );
const chooseFile = (file: File) => userEvent.upload(screen.getByLabelText('Choose CSV file'), file);

afterEach(() => vi.unstubAllGlobals());

describe('ImportPage', () => {
  it('keeps Import disabled until a file is chosen', async () => {
    setup();
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();

    await chooseFile(csvFile());

    expect(screen.getByText(/people\.csv/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import' })).toBeEnabled();
  });

  it('sends the file text as text/csv and summarises the outcome', async () => {
    const fetchMock = stubImport(() =>
      Response.json({
        totalRows: 5000,
        imported: 4999,
        skipped: 1,
        errors: [{ row: 11, message: 'email: Invalid email' }],
        errorsTruncated: false,
      }),
    );
    setup();
    await chooseFile(csvFile());

    await userEvent.click(screen.getByRole('button', { name: 'Import' }));

    expect(await screen.findByText(/4,999 of 5,000 rows imported, 1 skipped/)).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/employees\/import$/);
    expect(init).toMatchObject({ method: 'POST', body: CSV });
    expect(new Headers(init.headers).get('Content-Type')).toBe('text/csv');
  });

  it('lists skipped rows by row number with the reason', async () => {
    stubImport(() =>
      Response.json({
        totalRows: 2,
        imported: 0,
        skipped: 2,
        errors: [
          { row: 2, message: 'email: Invalid email' },
          { row: 3, message: 'annualSalary: Salary must be a number' },
        ],
        errorsTruncated: false,
      }),
    );
    setup();
    await chooseFile(csvFile());
    await userEvent.click(screen.getByRole('button', { name: 'Import' }));

    const table = await screen.findByRole('table', { name: 'Skipped rows' });

    expect(within(table).getByText('annualSalary: Salary must be a number')).toBeInTheDocument();
    expect(screen.getByText(/0 of 2 rows imported/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View employees' })).not.toBeInTheDocument(); // nothing to view
    expect(screen.getByRole('button', { name: /download error report/i })).toBeInTheDocument();
  });

  it('says when the error list was cut off', async () => {
    stubImport(() =>
      Response.json({
        totalRows: 300,
        imported: 0,
        skipped: 300,
        errors: [{ row: 2, message: 'x' }],
        errorsTruncated: true,
      }),
    );
    setup();
    await chooseFile(csvFile());

    await userEvent.click(screen.getByRole('button', { name: 'Import' }));

    expect(await screen.findByText(/showing the first 1 problems/i)).toBeInTheDocument();
  });

  it('shows a whole-file problem from the server, such as missing columns', async () => {
    stubImport(() =>
      Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Missing required column(s): jobTitle' } },
        { status: 400 },
      ),
    );
    setup();
    await chooseFile(csvFile());

    await userEvent.click(screen.getByRole('button', { name: 'Import' }));

    expect(await screen.findByText('Missing required column(s): jobTitle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import' })).toBeEnabled(); // file stays selected so a retry needs no re-pick
  });

  it('rejects a file over 5 MB without uploading it', async () => {
    const fetchMock = stubImport(() => Response.json({}));
    setup();
    const big = csvFile('x'.repeat(5 * 1024 * 1024 + 1), 'big.csv');

    await chooseFile(big);

    expect(await screen.findByText(/larger than 5 MB/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

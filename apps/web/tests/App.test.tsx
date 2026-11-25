import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';

afterEach(() => vi.unstubAllGlobals());

// Every endpoint answers with an empty-but-valid payload; this test is about navigation, not data.
function stubEmptyApi() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const path = new URL(String(input), 'http://localhost').pathname;
      if (path.endsWith('/meta/filters'))
        return Response.json({ countries: [], departments: [], jobTitles: [] });
      if (path.endsWith('/meta/currencies')) return Response.json({ currencies: [] });
      if (path.endsWith('/insights/summary'))
        return Response.json({ groupBy: 'country', rows: [] });
      if (path.endsWith('/insights/distribution'))
        return Response.json({ bandSize: 0, total: 0, buckets: [] });
      if (path.endsWith('/insights/outliers')) return Response.json({ total: 0, items: [] });
      return Response.json({ items: [], page: 1, pageSize: 25, total: 0, totalPages: 0 });
    }),
  );
}

describe('App', () => {
  it('shows the title and the employee directory by default', async () => {
    stubEmptyApi();
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /salary management/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /add employee/i })).toBeInTheDocument();
  });

  it('navigates to the insights page from the tabs', async () => {
    stubEmptyApi();
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('tab', { name: 'Insights' }));

    expect(await screen.findByRole('heading', { name: /how we pay people/i })).toBeInTheDocument();
  });

  it('navigates to the import page from the tabs', async () => {
    stubEmptyApi();
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('tab', { name: 'Import' }));

    expect(
      await screen.findByRole('heading', { name: /import employees from csv/i }),
    ).toBeInTheDocument();
  });

  it('sends unknown URLs back to the directory', async () => {
    stubEmptyApi();
    render(
      <MemoryRouter initialEntries={['/nope']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('button', { name: /add employee/i })).toBeInTheDocument();
  });
});

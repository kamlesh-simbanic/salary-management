import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InsightsPage } from '../src/features/insights/InsightsPage';

const summaryRows = [
  { group: 'IN', headcount: 2960, minUsd: 3484, medianUsd: 27288, avgUsd: 28547, maxUsd: 118901 },
  { group: 'US', headcount: 2243, minUsd: 18455, medianUsd: 90190, avgUsd: 94692, maxUsd: 309301 },
];
const distribution = {
  bandSize: 50_000,
  total: 100,
  buckets: [
    { from: 0, to: 50_000, count: 60 },
    { from: 50_000, to: 100_000, count: 40 },
  ],
};
const outlier = {
  id: 1,
  fullName: 'Zara Brown',
  jobTitle: 'Finance Manager',
  department: 'Finance',
  countryCode: 'US',
  salaryUsd: 309_301,
  peerCount: 59,
  q1Usd: 108_858,
  medianUsd: 113_343,
  q3Usd: 118_225,
  direction: 'above',
  lowerFenceUsd: 94_808,
  upperFenceUsd: 132_275,
  deviationPct: 172.9,
};

function stubApi(overrides: Record<string, () => Response> = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost');
    const handler = overrides[url.pathname.split('/api/v1')[1] ?? ''];
    if (handler) return handler();
    switch (url.pathname.split('/api/v1')[1]) {
      case '/meta/filters':
        return Response.json({ countries: ['IN', 'US'], departments: ['Finance'], jobTitles: [] });
      case '/insights/summary':
        return Response.json({
          groupBy: url.searchParams.get('groupBy') ?? 'country',
          rows: summaryRows,
        });
      case '/insights/distribution':
        return Response.json(distribution);
      case '/insights/outliers':
        return Response.json({ total: 150, items: [outlier] });
      default:
        return new Response('not found', { status: 404 });
    }
  });
  vi.stubGlobal('fetch', fetchMock);
  const callsTo = (path: string) =>
    fetchMock.mock.calls
      .map(([u]) => new URL(String(u), 'http://localhost'))
      .filter((u) => u.pathname.endsWith(path));
  return { callsTo };
}

afterEach(() => vi.unstubAllGlobals());

describe('InsightsPage', () => {
  it('shows pay by country with USD amounts and readable country names', async () => {
    stubApi();
    render(<InsightsPage />);

    const table = await screen.findByRole('table', { name: 'Pay by group' });
    const india = within(table).getByText('India').closest('tr')!;
    expect(within(india).getByText('2,960')).toBeInTheDocument();
    expect(within(india).getByText('$27,288')).toBeInTheDocument(); // median
  });

  it('regroups when the group-by switch changes', async () => {
    const api = stubApi();
    render(<InsightsPage />);
    await screen.findByRole('table', { name: 'Pay by group' });

    await userEvent.click(screen.getByRole('button', { name: 'Department' }));

    await waitFor(() =>
      expect(api.callsTo('/insights/summary').at(-1)?.searchParams.get('groupBy')).toBe(
        'department',
      ),
    );
  });

  it('applies a filter to every panel', async () => {
    const api = stubApi();
    render(<InsightsPage />);
    await screen.findByRole('table', { name: 'Pay by group' });

    await userEvent.click(screen.getByLabelText('Country'));
    await userEvent.click(await screen.findByRole('option', { name: 'India' }));

    await waitFor(() => {
      for (const path of ['/insights/summary', '/insights/distribution', '/insights/outliers']) {
        expect(api.callsTo(path).at(-1)?.searchParams.get('country')).toBe('IN');
      }
    });
  });

  it('offers the distribution as a table with counts and shares', async () => {
    stubApi();
    render(<InsightsPage />);
    await screen.findByRole('table', { name: 'Pay by group' });

    await userEvent.click(screen.getByRole('button', { name: 'Table' }));

    const table = await screen.findByRole('table', { name: 'Salary distribution' });
    expect(within(table).getByText('$0–$50k')).toBeInTheDocument();
    expect(within(table).getByText('60.0%')).toBeInTheDocument();
  });

  it('lists outliers with direction in text and how many exist in total', async () => {
    stubApi();
    render(<InsightsPage />);

    expect(await screen.findByText('Zara Brown')).toBeInTheDocument();
    expect(screen.getByText('172.9% above median')).toBeInTheDocument();
    expect(screen.getByText(/150 outliers; showing the 1 furthest/)).toBeInTheDocument();
  });

  it('shows a friendly message in a panel when its request fails, without breaking the others', async () => {
    stubApi({
      '/insights/outliers': () =>
        Response.json(
          { error: { code: 'INTERNAL', message: 'Outlier query failed' } },
          { status: 500 },
        ),
    });
    render(<InsightsPage />);

    expect(await screen.findByText('Outlier query failed')).toBeInTheDocument();
    expect(await screen.findByText('India')).toBeInTheDocument();
  });
});

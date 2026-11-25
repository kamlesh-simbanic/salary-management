import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Employee } from '../src/api/types';
import { EmployeeDirectory } from '../src/features/employees/EmployeeDirectory';

const person = (over: Partial<Employee> = {}): Employee => ({
  id: 1,
  fullName: 'Asha Rao',
  email: 'asha@acme.example',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  countryCode: 'IN',
  currencyCode: 'INR',
  annualSalary: 1_500_000,
  salaryUsd: 18_000,
  hireDate: '2022-04-01',
  ...over,
});

const page = (items: Employee[], total = items.length) => ({
  items,
  page: 1,
  pageSize: 25,
  total,
  totalPages: Math.ceil(total / 25),
});

// Routes fetch calls by URL so each test only describes the data it cares about.
function mockApi(listResponse: (url: URL) => Response | Promise<Response>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost');
    if (url.pathname.endsWith('/meta/filters')) {
      return Response.json({
        countries: ['IN', 'US'],
        departments: ['Engineering'],
        jobTitles: [],
      });
    }
    return listResponse(url);
  });
  vi.stubGlobal('fetch', fetchMock);
  const listCalls = () =>
    fetchMock.mock.calls
      .map(([u]) => new URL(String(u), 'http://localhost'))
      .filter((u) => u.pathname.endsWith('/employees'));
  return { listCalls };
}

beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
afterEach(() => vi.unstubAllGlobals());

describe('EmployeeDirectory', () => {
  it('shows employees with USD and local salary', async () => {
    mockApi(() => Response.json(page([person()])));

    render(<EmployeeDirectory />);

    const row = (await screen.findByText('Asha Rao')).closest('tr')!;
    expect(within(row).getByText('India')).toBeInTheDocument();
    expect(within(row).getByText('$18,000')).toBeInTheDocument();
    expect(within(row).getByText(/₹/)).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    mockApi(() => Response.json(page([])));

    render(<EmployeeDirectory />);

    expect(await screen.findByText(/no employees match/i)).toBeInTheDocument();
  });

  it('shows the error and retries on request', async () => {
    let calls = 0;
    mockApi(() => {
      calls += 1;
      return calls === 1
        ? Response.json({ error: { code: 'INTERNAL', message: 'Boom' } }, { status: 500 })
        : Response.json(page([person()]));
    });

    render(<EmployeeDirectory />);
    expect(await screen.findByText('Boom')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByText('Asha Rao')).toBeInTheDocument();
  });

  it('sorts server-side: first click ascending, second click descending', async () => {
    const api = mockApi(() => Response.json(page([person()])));
    render(<EmployeeDirectory />);
    await screen.findByText('Asha Rao');

    await userEvent.click(screen.getByRole('button', { name: /salary \(usd\)/i }));
    await waitFor(() => expect(api.listCalls().at(-1)?.searchParams.get('sort')).toBe('salaryUsd'));
    expect(api.listCalls().at(-1)?.searchParams.get('order')).toBe('asc');

    await userEvent.click(screen.getByRole('button', { name: /salary \(usd\)/i }));
    await waitFor(() => expect(api.listCalls().at(-1)?.searchParams.get('order')).toBe('desc'));
  });

  it('debounces search into one request and returns to page 1', async () => {
    const api = mockApi(() => Response.json(page([person()], 100)));
    render(<EmployeeDirectory />);
    await screen.findByText('Asha Rao');
    await userEvent.click(screen.getByRole('button', { name: /next page/i }));
    await waitFor(() => expect(api.listCalls().at(-1)?.searchParams.get('page')).toBe('2'));
    const before = api.listCalls().length;

    await userEvent.type(screen.getByLabelText(/search name or email/i), 'priya');

    await waitFor(() => expect(api.listCalls().at(-1)?.searchParams.get('q')).toBe('priya'));
    expect(api.listCalls().at(-1)?.searchParams.get('page')).toBe('1');
    expect(api.listCalls().length - before).toBe(1); // 5 keystrokes, a single request
  });
});

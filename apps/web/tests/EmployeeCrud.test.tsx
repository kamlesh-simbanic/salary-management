import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Employee } from '../src/api/types';
import { EmployeeDirectory } from '../src/features/employees/EmployeeDirectory';

const asha: Employee = {
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
};

// A tiny fake server: remembers one employee list and records mutating calls.
function fakeServer(initial: Employee[] = [asha]) {
  let employees = [...initial];
  const mutations: { method: string; path: string; body?: unknown }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input), 'http://localhost');
      const method = init?.method ?? 'GET';
      const path = url.pathname.replace('/api/v1', '');
      if (path === '/meta/filters')
        return Response.json({
          countries: ['IN'],
          departments: ['Engineering'],
          jobTitles: ['Software Engineer'],
        });
      if (path === '/meta/currencies') return Response.json({ currencies: ['INR', 'USD'] });
      if (method === 'GET' && path === '/employees') {
        return Response.json({
          items: employees,
          page: 1,
          pageSize: 25,
          total: employees.length,
          totalPages: 1,
        });
      }
      mutations.push({
        method,
        path,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });
      if (method === 'DELETE') {
        employees = employees.filter((e) => `/employees/${e.id}` !== path);
        return new Response(null, { status: 204 });
      }
      const saved = {
        ...JSON.parse(String(init?.body)),
        id: method === 'POST' ? 2 : 1,
        salaryUsd: 1,
      };
      employees =
        method === 'POST'
          ? [...employees, saved]
          : employees.map((e) => (e.id === saved.id ? saved : e));
      return Response.json(saved, { status: method === 'POST' ? 201 : 200 });
    }),
  );
  return { mutations };
}

afterEach(() => vi.unstubAllGlobals());

describe('employee create / edit / delete', () => {
  it('asks for confirmation, deletes, refreshes the table and confirms with a toast', async () => {
    const server = fakeServer();
    render(<EmployeeDirectory />);
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Asha Rao' }));

    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    expect(server.mutations).toHaveLength(0); // nothing happens until confirmed
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Asha Rao deleted')).toBeInTheDocument();
    expect(server.mutations).toEqual([{ method: 'DELETE', path: '/employees/1', body: undefined }]);
    await waitFor(() => expect(screen.queryByText('asha@acme.example')).not.toBeInTheDocument());
  });

  it('cancelling the delete dialog changes nothing', async () => {
    const server = fakeServer();
    render(<EmployeeDirectory />);
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Asha Rao' }));

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(server.mutations).toHaveLength(0);
    expect(screen.getByText('asha@acme.example')).toBeInTheDocument();
  });

  it('edits an employee with a PUT and refreshes the table', async () => {
    const server = fakeServer();
    render(<EmployeeDirectory />);
    await userEvent.click(await screen.findByRole('button', { name: 'Edit Asha Rao' }));
    const dialog = within(screen.getByRole('dialog'));
    const jobTitle = dialog.getByLabelText('Job title');
    await userEvent.clear(jobTitle);
    await userEvent.type(jobTitle, 'Staff Engineer');

    await userEvent.click(dialog.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Employee updated')).toBeInTheDocument();
    expect(server.mutations[0]).toMatchObject({
      method: 'PUT',
      path: '/employees/1',
      body: { jobTitle: 'Staff Engineer', annualSalary: 1_500_000 },
    });
    expect(await screen.findByText('Staff Engineer')).toBeInTheDocument();
  });

  it('adds an employee with a POST', async () => {
    const server = fakeServer([]);
    render(<EmployeeDirectory />);
    await userEvent.click(await screen.findByRole('button', { name: 'Add employee' }));
    const dialog = within(screen.getByRole('dialog'));
    await userEvent.type(dialog.getByLabelText('Full name'), 'New Person');
    await userEvent.type(dialog.getByLabelText('Email'), 'new@acme.example');
    await userEvent.type(dialog.getByLabelText('Department'), 'Sales');
    await userEvent.type(dialog.getByLabelText('Job title'), 'Account Executive');
    await userEvent.type(dialog.getByLabelText('Country code'), 'US');
    await userEvent.click(dialog.getByLabelText('Currency'));
    await userEvent.click(await screen.findByRole('option', { name: 'USD' })); // the menu renders outside the dialog
    await userEvent.type(dialog.getByLabelText(/annual salary/i), '80000');
    await userEvent.type(dialog.getByLabelText('Hire date'), '2024-02-01');

    await userEvent.click(dialog.getByRole('button', { name: 'Add employee' }));

    expect(await screen.findByText('Employee added')).toBeInTheDocument();
    expect(server.mutations[0]).toMatchObject({
      method: 'POST',
      path: '/employees',
      body: { email: 'new@acme.example', currencyCode: 'USD' },
    });
  });
});

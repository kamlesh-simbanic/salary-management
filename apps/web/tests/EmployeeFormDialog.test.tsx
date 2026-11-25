import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/api/http';
import type { Employee } from '../src/api/types';
import { EmployeeFormDialog } from '../src/features/employees/EmployeeFormDialog';

const options = {
  countries: ['IN'],
  departments: ['Engineering'],
  jobTitles: ['Software Engineer'],
};
const currencies = ['INR', 'USD'];

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText('Full name'), 'Asha Rao');
  await userEvent.type(screen.getByLabelText('Email'), 'asha@acme.example');
  await userEvent.type(screen.getByLabelText('Department'), 'Engineering');
  await userEvent.type(screen.getByLabelText('Job title'), 'Software Engineer');
  await userEvent.type(screen.getByLabelText('Country code'), 'in');
  await userEvent.click(screen.getByLabelText('Currency'));
  await userEvent.click(await screen.findByRole('option', { name: 'INR' }));
  await userEvent.type(screen.getByLabelText(/annual salary/i), '1500000');
  await userEvent.type(screen.getByLabelText('Hire date'), '2022-04-01');
}

function setup(props: { employee?: Employee | null; onSubmit?: () => Promise<void> } = {}) {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined);
  render(
    <EmployeeFormDialog
      employee={props.employee ?? null}
      options={options}
      currencies={currencies}
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />,
  );
  return { onSubmit };
}

describe('EmployeeFormDialog', () => {
  it('shows errors and does not submit when required fields are empty', async () => {
    const { onSubmit } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Add employee' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Salary is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits normalised values: upper-case country, numeric salary', async () => {
    const { onSubmit } = setup();
    await fillValidForm();

    await userEvent.click(screen.getByRole('button', { name: 'Add employee' }));

    expect(onSubmit).toHaveBeenCalledWith({
      fullName: 'Asha Rao',
      email: 'asha@acme.example',
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      countryCode: 'IN',
      currencyCode: 'INR',
      annualSalary: 1_500_000,
      hireDate: '2022-04-01',
    });
  });

  it('pre-fills an existing employee when editing', () => {
    setup({
      employee: {
        id: 7,
        fullName: 'Bob Stone',
        email: 'bob@acme.example',
        jobTitle: 'QA Engineer',
        department: 'Engineering',
        countryCode: 'US',
        currencyCode: 'USD',
        annualSalary: 90_000,
        salaryUsd: 90_000,
        hireDate: '2020-01-15',
      },
    });

    expect(screen.getByRole('heading', { name: 'Edit employee' })).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toHaveValue('Bob Stone');
    expect(screen.getByLabelText(/annual salary/i)).toHaveValue('90000');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('shows a duplicate-email error from the server on the email field and stays open', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        new ApiError(409, 'CONFLICT', 'An employee with email asha@acme.example already exists'),
      );
    setup({ onSubmit });
    await fillValidForm();

    await userEvent.click(screen.getByRole('button', { name: 'Add employee' }));

    expect(await screen.findByText(/already exists/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add employee' })).toBeEnabled(); // can fix and retry
  });

  it('clears a field error as soon as the user edits that field', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Add employee' }));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Full name'), 'A');

    expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
  });
});

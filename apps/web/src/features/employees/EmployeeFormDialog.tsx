import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import type { Employee, EmployeeInput, FilterOptions } from '../../api/types';
import { countryName } from '../../lib/format';
import {
  EMPTY_FORM,
  describeApiError,
  fromEmployee,
  toInput,
  validateForm,
  type EmployeeFormValues,
  type FormErrors,
} from './formValues';

interface Props {
  employee: Employee | null; // null = create
  options: FilterOptions | null;
  currencies: string[];
  onClose: () => void;
  onSubmit: (input: EmployeeInput) => Promise<void>;
}

export function EmployeeFormDialog({ employee, options, currencies, onClose, onSubmit }: Props) {
  const [values, setValues] = useState<EmployeeFormValues>(
    employee ? fromEmployee(employee) : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [general, setGeneral] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof EmployeeFormValues, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined })); // editing a field clears its error
  };
  const text = (field: keyof EmployeeFormValues) => ({
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(field, e.target.value),
    error: Boolean(errors[field]),
    helperText: errors[field],
    size: 'small' as const,
    fullWidth: true,
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateForm(values);
    setErrors(found);
    setGeneral(undefined);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit(toInput(values));
    } catch (err) {
      const { fields, general: message } = describeApiError(err);
      setErrors(fields);
      setGeneral(message);
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <form onSubmit={submit} noValidate>
        <DialogTitle>{employee ? 'Edit employee' : 'Add employee'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {general && <Alert severity="error">{general}</Alert>}
            <TextField label="Full name" autoFocus {...text('fullName')} />
            <TextField label="Email" type="email" {...text('email')} />
            <Autocomplete
              freeSolo
              options={options?.departments ?? []}
              inputValue={values.department}
              onInputChange={(_e, value) => set('department', value)}
              renderInput={(p) => (
                <TextField
                  {...p}
                  label="Department"
                  size="small"
                  error={Boolean(errors.department)}
                  helperText={errors.department}
                />
              )}
            />
            <Autocomplete
              freeSolo
              options={options?.jobTitles ?? []}
              inputValue={values.jobTitle}
              onInputChange={(_e, value) => set('jobTitle', value)}
              renderInput={(p) => (
                <TextField
                  {...p}
                  label="Job title"
                  size="small"
                  error={Boolean(errors.jobTitle)}
                  helperText={errors.jobTitle}
                />
              )}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Country code"
                {...text('countryCode')}
                slotProps={{ htmlInput: { maxLength: 2 } }}
                helperText={
                  errors.countryCode ??
                  (values.countryCode.length === 2
                    ? countryName(values.countryCode.toUpperCase())
                    : 'e.g. IN, US, DE')
                }
              />
              <TextField select label="Currency" {...text('currencyCode')}>
                {currencies.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Annual salary (local currency)"
                inputMode="decimal"
                {...text('annualSalary')}
              />
              <TextField
                label="Hire date"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                {...text('hireDate')}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {employee ? 'Save changes' : 'Add employee'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

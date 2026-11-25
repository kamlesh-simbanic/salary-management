import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useState } from 'react';
import type { Employee } from '../../api/types';

interface Props {
  employee: Employee;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteEmployeeDialog({ employee, onClose, onConfirm }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const confirm = async () => {
    setSubmitting(true);
    setError(undefined);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={submitting ? undefined : onClose}>
      <DialogTitle>Delete {employee.fullName}?</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <DialogContentText>
          This permanently removes {employee.fullName} ({employee.email}) and their salary record.
          It cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button color="error" variant="contained" onClick={confirm} disabled={submitting}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

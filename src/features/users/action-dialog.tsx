'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import { useId, type FormEventHandler, type ReactNode } from 'react';

type ActionDialogProps = {
  title: string;
  submitLabel: string;
  submitting: boolean;
  error?: string;
  danger?: boolean;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
};

/** Diálogo com formulário: título, erro do servidor, conteúdo e Cancelar / ação principal. */
export function ActionDialog(props: ActionDialogProps) {
  const titleId = useId();
  return (
    <Dialog open onClose={props.onClose} aria-labelledby={titleId} fullWidth maxWidth="xs">
      <form noValidate onSubmit={props.onSubmit}>
        <DialogTitle id={titleId}>{props.title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {props.error && <Alert severity="error">{props.error}</Alert>}
            {props.children}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={props.onClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            color={props.danger ? 'error' : 'primary'}
            disabled={props.submitting}
          >
            {props.submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

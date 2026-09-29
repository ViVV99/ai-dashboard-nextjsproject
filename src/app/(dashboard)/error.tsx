'use client';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import { useEffect } from 'react';

type ErrorProps = { error: Error & { digest?: string }; retry: () => void; reset: () => void };

// Mensagem genérica: detalhes do erro ficam só no log (o digest liga os dois).
export default function DashboardError({ error, retry }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={() => retry()}>
          Tentar novamente
        </Button>
      }
    >
      <AlertTitle>Não foi possível carregar esta página</AlertTitle>
      Tente novamente em instantes.
      {error.digest && ` Código: ${error.digest}`}
    </Alert>
  );
}

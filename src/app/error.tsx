'use client';

import Box from '@mui/material/Box';
import { ErrorPanel, type ErrorBoundaryProps } from '@/components/error-panel';

// Cobre erros fora do dashboard, inclusive no layout `(dashboard)` (ex.: banco indisponível
// ao validar a sessão), que o `(dashboard)/error.tsx` não alcança.
export default function RootError({ error, retry }: ErrorBoundaryProps) {
  return (
    <Box component="main" sx={{ maxWidth: 640, mx: 'auto', px: 2, py: 8 }}>
      <ErrorPanel error={error} retry={retry} />
    </Box>
  );
}

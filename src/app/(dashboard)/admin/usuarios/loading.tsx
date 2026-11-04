import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

/** Mesma estrutura da página de usuários: cabeçalho, filtros e tabela. */
export default function UsersLoading() {
  return (
    <Box role="status" aria-busy="true" aria-label="Carregando usuários">
      <Skeleton variant="text" width={160} height={40} />
      <Skeleton variant="text" width={360} sx={{ mb: 3 }} />
      <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
      <Skeleton data-testid="table-skeleton" variant="rounded" height={420} />
    </Box>
  );
}

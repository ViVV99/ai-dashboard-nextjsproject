import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

/** Mesma estrutura da página de compras, para não deslocar o layout ao carregar. */
export default function PurchasesLoading() {
  return (
    <Box role="status" aria-busy="true" aria-label="Carregando compras">
      <Skeleton variant="text" width={160} height={40} />
      <Skeleton variant="text" width={320} sx={{ mb: 3 }} />
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          }}
        >
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} data-testid="stat-skeleton" variant="rounded" height={112} />
          ))}
        </Box>
        <Box
          sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}
        >
          <Skeleton data-testid="chart-skeleton" variant="rounded" height={380} />
          <Skeleton data-testid="chart-skeleton" variant="rounded" height={380} />
        </Box>
      </Box>
    </Box>
  );
}

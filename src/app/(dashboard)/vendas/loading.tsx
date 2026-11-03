import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

const chart = (height: number) => (
  <Skeleton data-testid="chart-skeleton" variant="rounded" height={height} />
);

/** Mesma estrutura da página de vendas, para não deslocar o layout ao carregar. */
export default function SalesLoading() {
  return (
    <Box role="status" aria-busy="true" aria-label="Carregando vendas">
      <Skeleton variant="text" width={160} height={40} />
      <Skeleton variant="text" width={320} sx={{ mb: 3 }} />
      <Box sx={{ display: 'grid', gap: 2 }}>
        {chart(380)}
        <Box
          sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}
        >
          {chart(420)}
          {chart(420)}
        </Box>
      </Box>
    </Box>
  );
}

import type { Metadata } from 'next';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { PageHeader } from '@/components/page-header';
import { SourcesChart } from '@/features/access/sources-chart';
import { TopPagesChart } from '@/features/access/top-pages-chart';
import { TrafficChart } from '@/features/access/traffic-chart';
import { PeriodFilter } from '@/features/period/period-filter';
import { resolvePeriod } from '@/schemas/period';
import { loadAccess } from '@/server/services/metrics';

export const metadata: Metadata = { title: 'Acessos' };

export default async function AccessPage({ searchParams }: PageProps<'/acessos'>) {
  const { period, invalid } = resolvePeriod(await searchParams);
  const access = await loadAccess(period);

  return (
    <>
      <PageHeader
        title="Acessos"
        description="Visitas, visitantes únicos, páginas e origens."
        actions={<PeriodFilter period={period} invalid={invalid} />}
      />
      {!access.hasData && (
        <Alert severity="info" role="status" sx={{ mb: 2 }}>
          Nenhum acesso neste período.
        </Alert>
      )}
      <Stack spacing={2}>
        <TrafficChart data={access.traffic} granularity={access.granularity} />
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            // Topo: o card de origens (5 barras) não estica até a altura do top 10.
            alignItems: 'start',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
          }}
        >
          <TopPagesChart data={access.topPages} />
          <SourcesChart data={access.bySource} />
        </Box>
      </Stack>
    </>
  );
}

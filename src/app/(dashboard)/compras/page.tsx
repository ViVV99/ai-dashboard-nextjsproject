import type { Metadata } from 'next';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { PageHeader } from '@/components/page-header';
import { PeriodFilter } from '@/features/period/period-filter';
import { PurchaseCostChart } from '@/features/purchases/purchase-cost-chart';
import { PurchasesSummary } from '@/features/purchases/purchases-summary';
import { RevenueCogsChart } from '@/features/purchases/revenue-cogs-chart';
import { resolvePeriod } from '@/schemas/period';
import { loadPurchases } from '@/server/services/metrics';

export const metadata: Metadata = { title: 'Compras' };

export default async function PurchasesPage({ searchParams }: PageProps<'/compras'>) {
  const { period, invalid } = resolvePeriod(await searchParams);
  const metrics = await loadPurchases(period);

  return (
    <>
      <PageHeader
        title="Compras"
        description="Custo de compras e margem bruta."
        actions={<PeriodFilter period={period} invalid={invalid} />}
      />
      {!metrics.hasData && (
        <Alert severity="info" role="status" sx={{ mb: 2 }}>
          Nenhuma compra ou venda paga neste período.
        </Alert>
      )}
      <Stack spacing={2}>
        <PurchasesSummary summary={metrics.summary} />
        <Box
          sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}
        >
          <PurchaseCostChart data={metrics.series} granularity={metrics.granularity} />
          <RevenueCogsChart data={metrics.series} granularity={metrics.granularity} />
        </Box>
      </Stack>
    </>
  );
}

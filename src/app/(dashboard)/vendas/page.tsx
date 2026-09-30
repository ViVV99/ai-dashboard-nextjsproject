import type { Metadata } from 'next';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { PageHeader } from '@/components/page-header';
import { PeriodFilter } from '@/features/period/period-filter';
import { CategoryChart } from '@/features/sales/category-chart';
import { RevenueChart } from '@/features/sales/revenue-chart';
import { TopProductsChart } from '@/features/sales/top-products-chart';
import { resolvePeriod } from '@/schemas/period';
import { loadSales } from '@/server/services/metrics';

export const metadata: Metadata = { title: 'Vendas' };

export default async function SalesPage({ searchParams }: PageProps<'/vendas'>) {
  const { period, invalid } = resolvePeriod(await searchParams);
  const sales = await loadSales(period);

  return (
    <>
      <PageHeader
        title="Vendas"
        description="Receita, produtos mais vendidos e categorias."
        actions={<PeriodFilter period={period} invalid={invalid} />}
      />
      {!sales.hasData && (
        <Alert severity="info" role="status" sx={{ mb: 2 }}>
          Nenhuma venda paga neste período.
        </Alert>
      )}
      <Stack spacing={2}>
        <RevenueChart data={sales.revenue} granularity={sales.granularity} />
        <Box
          sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}
        >
          <TopProductsChart byRevenue={sales.topByRevenue} byQuantity={sales.topByQuantity} />
          <CategoryChart data={sales.byCategory} />
        </Box>
      </Stack>
    </>
  );
}

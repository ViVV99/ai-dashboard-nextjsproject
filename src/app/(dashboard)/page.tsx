import type { Metadata } from 'next';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import { PageHeader } from '@/components/page-header';
import { KpiGrid } from '@/features/overview/kpi-grid';
import { PeriodFilter } from '@/features/period/period-filter';
import { formatDate } from '@/lib/format';
import { resolvePeriod } from '@/schemas/period';
import { loadOverview } from '@/server/services/metrics';
import type { Period } from '@/types/period';

export const metadata: Metadata = { title: 'Visão geral' };

const range = ({ from, to }: Period) => `${formatDate(from)} a ${formatDate(to)}`;

export default async function OverviewPage({ searchParams }: PageProps<'/'>) {
  const { period, invalid } = resolvePeriod(await searchParams);
  const metrics = await loadOverview(period);

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Receita, pedidos e acessos da loja no período."
        actions={<PeriodFilter period={period} invalid={invalid} />}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {`${range(metrics.period)}, comparado com ${range(metrics.previousPeriod)}.`}
      </Typography>
      {!metrics.hasData && (
        <Alert severity="info" role="status" sx={{ mb: 2 }}>
          Nenhuma venda paga ou acesso neste período.
        </Alert>
      )}
      <KpiGrid kpis={metrics.kpis} />
    </>
  );
}

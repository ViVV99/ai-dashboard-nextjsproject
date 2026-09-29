import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';
import { PageHeader } from '@/components/page-header';
import { PeriodFilter } from '@/features/period/period-filter';
import { resolvePeriod } from '@/schemas/period';

export const metadata: Metadata = { title: 'Visão geral' };

export default async function OverviewPage({ searchParams }: PageProps<'/'>) {
  const { period, invalid } = resolvePeriod(await searchParams);

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Receita, pedidos e acessos da loja no período."
        actions={<PeriodFilter period={period} invalid={invalid} />}
      />
      <ComingSoon>Os indicadores chegam na próxima etapa (F4).</ComingSoon>
    </>
  );
}

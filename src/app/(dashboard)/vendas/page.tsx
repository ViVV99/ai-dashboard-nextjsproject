import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';
import { PageHeader } from '@/components/page-header';
import { PeriodFilter } from '@/features/period/period-filter';
import { resolvePeriod } from '@/schemas/period';

export const metadata: Metadata = { title: 'Vendas' };

export default async function SalesPage({ searchParams }: PageProps<'/vendas'>) {
  const { period, invalid } = resolvePeriod(await searchParams);

  return (
    <>
      <PageHeader
        title="Vendas"
        description="Receita, produtos mais vendidos e categorias."
        actions={<PeriodFilter period={period} invalid={invalid} />}
      />
      <ComingSoon>Os gráficos de vendas chegam na F5.</ComingSoon>
    </>
  );
}

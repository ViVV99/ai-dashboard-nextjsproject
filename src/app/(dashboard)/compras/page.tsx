import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';
import { PageHeader } from '@/components/page-header';
import { PeriodFilter } from '@/features/period/period-filter';
import { resolvePeriod } from '@/schemas/period';

export const metadata: Metadata = { title: 'Compras' };

export default async function PurchasesPage({ searchParams }: PageProps<'/compras'>) {
  const { period, invalid } = resolvePeriod(await searchParams);

  return (
    <>
      <PageHeader
        title="Compras"
        description="Custo de compras e margem bruta."
        actions={<PeriodFilter period={period} invalid={invalid} />}
      />
      <ComingSoon>Os gráficos de compras chegam na F6.</ComingSoon>
    </>
  );
}

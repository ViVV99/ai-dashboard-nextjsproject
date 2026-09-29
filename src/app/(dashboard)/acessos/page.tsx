import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';
import { PageHeader } from '@/components/page-header';
import { PeriodFilter } from '@/features/period/period-filter';
import { resolvePeriod } from '@/schemas/period';

export const metadata: Metadata = { title: 'Acessos' };

export default async function AccessPage({ searchParams }: PageProps<'/acessos'>) {
  const { period, invalid } = resolvePeriod(await searchParams);

  return (
    <>
      <PageHeader
        title="Acessos"
        description="Visitas, visitantes únicos, páginas e origens."
        actions={<PeriodFilter period={period} invalid={invalid} />}
      />
      <ComingSoon>Os gráficos de acessos chegam na F7.</ComingSoon>
    </>
  );
}

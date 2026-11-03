'use client';

import { ChartCard } from '@/components/chart-card';
import { formatInteger } from '@/lib/format';
import type { PageRank } from '@/types/metrics';
import { HorizontalBars } from './horizontal-bars';

export function TopPagesChart({ data }: { data: PageRank[] }) {
  const table = {
    columns: ['Página', 'Caminho', 'Acessos'],
    rows: data.map((page) => [page.label, page.path, formatInteger(page.views)]),
  };

  return (
    <ChartCard
      title="Páginas mais vistas"
      description="As 10 páginas com mais acessos no período."
      table={table}
      empty={data.length === 0 ? 'Nenhum acesso no período.' : undefined}
    >
      <HorizontalBars
        label="Acessos"
        categories={data.map((page) => page.label)}
        values={data.map((page) => page.views)}
      />
    </ChartCard>
  );
}

'use client';

import { ChartCard } from '@/components/chart-card';
import { formatInteger, formatPercent } from '@/lib/format';
import type { SourceViews } from '@/types/metrics';
import { HorizontalBars } from './horizontal-bars';
import { SOURCE_LABEL } from './source-labels';

export function SourcesChart({ data }: { data: SourceViews[] }) {
  const total = data.reduce((sum, item) => sum + item.views, 0);
  const share = (views: number) => (total === 0 ? 0 : views / total);
  const table = {
    columns: ['Origem', 'Acessos', 'Participação'],
    rows: data.map((item) => [
      SOURCE_LABEL[item.source],
      formatInteger(item.views),
      formatPercent(share(item.views)),
    ]),
  };

  return (
    <ChartCard
      title="Acessos por origem"
      description="De onde vieram os acessos do período."
      table={table}
      empty={total === 0 ? 'Nenhum acesso no período.' : undefined}
    >
      <HorizontalBars
        label="Acessos"
        categories={data.map((item) => SOURCE_LABEL[item.source])}
        values={data.map((item) => item.views)}
      />
    </ChartCard>
  );
}

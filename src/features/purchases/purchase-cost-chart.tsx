'use client';

import { BarChart } from '@mui/x-charts/BarChart';
import { ChartCard } from '@/components/chart-card';
import {
  formatBucket,
  formatCompactCurrency,
  formatCurrency,
  GRANULARITY_TEXT,
} from '@/lib/format';
import type { Granularity, PurchasesPoint } from '@/types/metrics';

type PurchaseCostChartProps = { data: PurchasesPoint[]; granularity: Granularity };

/** Série única (cor primária, sem legenda): custo das compras de reposição por bucket. */
export function PurchaseCostChart({ data, granularity }: PurchaseCostChartProps) {
  const labels = data.map((point) => formatBucket(point.bucket, granularity));
  const { label, per } = GRANULARITY_TEXT[granularity];
  const table = {
    columns: [label, 'Custo'],
    rows: data.map((point, index) => [labels[index] ?? '', formatCurrency(point.purchaseCents)]),
  };

  return (
    <ChartCard
      title="Custo de compras"
      description={`Custo das compras de reposição por ${per}.`}
      table={table}
      empty={
        data.every((point) => point.purchaseCents === 0) ? 'Nenhuma compra no período.' : undefined
      }
    >
      <BarChart
        height={300}
        hideLegend
        borderRadius={4}
        xAxis={[{ scaleType: 'band', data: labels, tickLabelMinGap: 12 }]}
        yAxis={[{ valueFormatter: (value: number) => formatCompactCurrency(value), width: 72 }]}
        series={[
          {
            label: 'Custo de compras',
            color: 'var(--mui-palette-primary-main)',
            data: data.map((point) => point.purchaseCents),
            valueFormatter: (value) => (value === null ? '—' : formatCurrency(value)),
          },
        ]}
        grid={{ horizontal: true }}
      />
    </ChartCard>
  );
}

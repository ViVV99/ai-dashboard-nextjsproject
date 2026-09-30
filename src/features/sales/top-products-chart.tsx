'use client';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { BarChart } from '@mui/x-charts/BarChart';
import { useState } from 'react';
import { formatCompactCurrency, formatCurrency, formatInteger } from '@/lib/format';
import type { ProductRank } from '@/types/metrics';
import { ChartCard } from './chart-card';

type Metric = 'revenue' | 'quantity';

const METRICS: Record<Metric, { label: string; value: (p: ProductRank) => number }> = {
  revenue: { label: 'Receita', value: (p) => p.revenueCents },
  quantity: { label: 'Quantidade', value: (p) => p.quantity },
};

type TopProductsChartProps = { byRevenue: ProductRank[]; byQuantity: ProductRank[] };

export function TopProductsChart({ byRevenue, byQuantity }: TopProductsChartProps) {
  const [metric, setMetric] = useState<Metric>('revenue');
  const products = metric === 'revenue' ? byRevenue : byQuantity;
  const { label, value } = METRICS[metric];
  const format = metric === 'revenue' ? formatCurrency : formatInteger;
  const table = {
    columns: ['Produto', 'Receita', 'Quantidade'],
    rows: products.map((p) => [p.name, formatCurrency(p.revenueCents), formatInteger(p.quantity)]),
  };

  return (
    <ChartCard
      title="Top 10 produtos"
      description={`Produtos mais vendidos por ${label.toLowerCase()}, só pedidos pagos.`}
      table={table}
      empty={products.length === 0 ? 'Nenhum produto vendido no período.' : undefined}
      actions={
        <ToggleButtonGroup
          size="small"
          exclusive
          value={metric}
          onChange={(_, next: Metric | null) => next && setMetric(next)}
          aria-label="Ordenar por"
          sx={{ alignSelf: 'flex-start' }}
        >
          <ToggleButton value="revenue">Receita</ToggleButton>
          <ToggleButton value="quantity">Quantidade</ToggleButton>
        </ToggleButtonGroup>
      }
    >
      <BarChart
        height={Math.max(160, products.length * 36 + 48)}
        layout="horizontal"
        hideLegend
        borderRadius={4}
        yAxis={[{ scaleType: 'band', data: products.map((p) => p.name), width: 150 }]}
        xAxis={[
          {
            valueFormatter: (v: number) =>
              metric === 'revenue' ? formatCompactCurrency(v) : formatInteger(v),
          },
        ]}
        series={[
          {
            label,
            data: products.map(value),
            valueFormatter: (v) => (v === null ? '—' : format(v)),
          },
        ]}
        grid={{ vertical: true }}
      />
    </ChartCard>
  );
}

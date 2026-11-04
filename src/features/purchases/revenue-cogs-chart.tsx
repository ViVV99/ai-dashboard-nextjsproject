'use client';

import Box from '@mui/material/Box';
import { LineChart, lineClasses } from '@mui/x-charts/LineChart';
import { ChartCard } from '@/components/chart-card';
import { categoryColorVars, paletteColor } from '@/components/chart-colors';
import { SeriesLegend } from '@/components/series-legend';
import {
  formatBucket,
  formatCompactCurrency,
  formatCurrency,
  formatKpiValue,
  GRANULARITY_TEXT,
} from '@/lib/format';
import { ratio } from '@/lib/kpi-math';
import type { Granularity, PurchasesPoint } from '@/types/metrics';

// Mesma unidade (BRL) ⇒ um eixo só. Cores: slots 0 e 1 da paleta validada (0004).
const SERIES = [
  { id: 'revenue', label: 'Receita', color: paletteColor(0), key: 'revenueCents' },
  { id: 'cogs', label: 'CMV', color: paletteColor(1), key: 'cogsCents' },
] as const;

const margin = (point: PurchasesPoint) =>
  formatKpiValue('percent', ratio(point.revenueCents - point.cogsCents, point.revenueCents));

type RevenueCogsChartProps = { data: PurchasesPoint[]; granularity: Granularity };

export function RevenueCogsChart({ data, granularity }: RevenueCogsChartProps) {
  const labels = data.map((point) => formatBucket(point.bucket, granularity));
  const { label, per } = GRANULARITY_TEXT[granularity];
  const table = {
    columns: [label, 'Receita', 'CMV', 'Margem'],
    rows: data.map((point, index) => [
      labels[index] ?? '',
      formatCurrency(point.revenueCents),
      formatCurrency(point.cogsCents),
      margin(point),
    ]),
  };

  return (
    <ChartCard
      title="Receita × CMV"
      description={`Receita e custo das mercadorias vendidas (pedidos pagos) por ${per}.`}
      table={table}
      empty={
        data.every((point) => point.revenueCents === 0)
          ? 'Nenhuma venda paga no período.'
          : undefined
      }
    >
      <Box
        sx={(theme) => ({
          ...categoryColorVars.light,
          ...theme.applyStyles('dark', categoryColorVars.dark),
        })}
      >
        <SeriesLegend series={SERIES} />
        <LineChart
          height={300}
          hideLegend
          xAxis={[{ scaleType: 'point', data: labels, tickLabelMinGap: 12 }]}
          yAxis={[
            // Base zero: a distância entre as linhas é a margem; um eixo cortado a exageraria.
            { min: 0, valueFormatter: (value: number) => formatCompactCurrency(value), width: 72 },
          ]}
          series={SERIES.map((series) => ({
            id: series.id,
            label: series.label,
            color: series.color,
            data: data.map((point) => point[series.key]),
            valueFormatter: (value: number | null) =>
              value === null ? '—' : formatCurrency(value),
            showMark: data.length <= 31,
          }))}
          grid={{ horizontal: true }}
          sx={{ [`& .${lineClasses.line}`]: { strokeWidth: 2 } }}
        />
      </Box>
    </ChartCard>
  );
}

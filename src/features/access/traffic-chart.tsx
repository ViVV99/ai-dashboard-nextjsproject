'use client';

import Box from '@mui/material/Box';
import { LineChart, lineClasses } from '@mui/x-charts/LineChart';
import { ChartCard } from '@/components/chart-card';
import { categoryColorVars, paletteColor } from '@/components/chart-colors';
import { SeriesLegend } from '@/components/series-legend';
import { formatBucket, formatInteger, GRANULARITY_TEXT } from '@/lib/format';
import type { Granularity, TrafficPoint } from '@/types/metrics';

// Mesma unidade (contagem) ⇒ um eixo só, base zero. Cores: slots 0 e 1 da paleta (0004).
const SERIES = [
  { id: 'views', label: 'Acessos', color: paletteColor(0), key: 'views' },
  { id: 'visitors', label: 'Visitantes únicos', color: paletteColor(1), key: 'visitors' },
] as const;

type TrafficChartProps = { data: TrafficPoint[]; granularity: Granularity };

export function TrafficChart({ data, granularity }: TrafficChartProps) {
  const labels = data.map((point) => formatBucket(point.bucket, granularity));
  const { label, per } = GRANULARITY_TEXT[granularity];
  const table = {
    columns: [label, 'Acessos', 'Visitantes únicos'],
    rows: data.map((point, index) => [
      labels[index] ?? '',
      formatInteger(point.views),
      formatInteger(point.visitors),
    ]),
  };

  return (
    <ChartCard
      title="Acessos e visitantes"
      description={`Acessos e visitantes únicos por ${per}.`}
      table={table}
      empty={data.every((point) => point.views === 0) ? 'Nenhum acesso no período.' : undefined}
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
          yAxis={[{ min: 0, valueFormatter: (value: number) => formatInteger(value), width: 64 }]}
          series={SERIES.map((series) => ({
            id: series.id,
            label: series.label,
            color: series.color,
            data: data.map((point) => point[series.key]),
            valueFormatter: (value: number | null) => (value === null ? '—' : formatInteger(value)),
            showMark: data.length <= 31,
          }))}
          grid={{ horizontal: true }}
          sx={{ [`& .${lineClasses.line}`]: { strokeWidth: 2 } }}
        />
      </Box>
    </ChartCard>
  );
}

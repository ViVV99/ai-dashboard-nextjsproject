'use client';

import { BarChart } from '@mui/x-charts/BarChart';
import { formatInteger } from '@/lib/format';

type HorizontalBarsProps = { label: string; categories: string[]; values: number[] };

/** Barras horizontais de série única (cor primária, sem legenda: o eixo nomeia cada barra). */
export function HorizontalBars({ label, categories, values }: HorizontalBarsProps) {
  return (
    <BarChart
      height={Math.max(160, categories.length * 36 + 48)}
      layout="horizontal"
      hideLegend
      borderRadius={4}
      margin={{ right: 40 }}
      yAxis={[{ scaleType: 'band', data: categories, width: 150 }]}
      xAxis={[{ tickNumber: 4, valueFormatter: (value: number) => formatInteger(value) }]}
      series={[
        {
          label,
          color: 'var(--mui-palette-primary-main)',
          data: values,
          valueFormatter: (value) => (value === null ? '—' : formatInteger(value)),
        },
      ]}
      grid={{ vertical: true }}
    />
  );
}

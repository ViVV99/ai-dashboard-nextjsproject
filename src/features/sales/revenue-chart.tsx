'use client';

import { LineChart } from '@mui/x-charts/LineChart';
import { lineClasses } from '@mui/x-charts/LineChart';
import { formatBucket, formatCompactCurrency, formatCurrency, formatInteger } from '@/lib/format';
import type { Granularity, RevenuePoint } from '@/types/metrics';
import { ChartCard } from './chart-card';

const PER: Record<Granularity, string> = { day: 'dia', week: 'semana', month: 'mês' };
const BUCKET_LABEL: Record<Granularity, string> = { day: 'Dia', week: 'Semana', month: 'Mês' };

type RevenueChartProps = { data: RevenuePoint[]; granularity: Granularity };

export function RevenueChart({ data, granularity }: RevenueChartProps) {
  const labels = data.map((point) => formatBucket(point.bucket, granularity));
  const table = {
    columns: [BUCKET_LABEL[granularity], 'Receita', 'Pedidos'],
    rows: data.map((point, index) => [
      labels[index],
      formatCurrency(point.revenueCents),
      formatInteger(point.orders),
    ]),
  };

  return (
    <ChartCard
      title="Receita ao longo do tempo"
      description={`Receita de pedidos pagos por ${PER[granularity]}.`}
      table={table}
      empty={
        data.every((point) => point.revenueCents === 0)
          ? 'Nenhuma venda paga no período.'
          : undefined
      }
    >
      <LineChart
        height={300}
        hideLegend
        xAxis={[{ scaleType: 'point', data: labels, tickLabelMinGap: 12 }]}
        yAxis={[{ valueFormatter: (value: number) => formatCompactCurrency(value), width: 72 }]}
        series={[
          {
            label: 'Receita',
            data: data.map((point) => point.revenueCents),
            valueFormatter: (value) => (value === null ? '—' : formatCurrency(value)),
            area: true,
            showMark: data.length <= 31,
          },
        ]}
        grid={{ horizontal: true }}
        sx={{
          [`& .${lineClasses.area}`]: { fillOpacity: 0.12 },
          [`& .${lineClasses.line}`]: { strokeWidth: 2 },
        }}
      />
    </ChartCard>
  );
}

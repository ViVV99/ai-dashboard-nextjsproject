'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PieChart } from '@mui/x-charts/PieChart';
import { formatCurrency, formatPercent } from '@/lib/format';
import type { CategoryRevenue } from '@/types/metrics';
import { ChartCard } from './chart-card';
import { categoryColor, categoryColorVars } from './category-colors';

type Slice = CategoryRevenue & { share: number };

function Legend({ slices }: { slices: Slice[] }) {
  return (
    <Box component="ul" aria-label="Legenda" sx={{ listStyle: 'none', m: 0, p: 0, flex: 1 }}>
      {slices.map((slice) => (
        <Stack
          component="li"
          key={slice.categoryId}
          direction="row"
          spacing={1}
          sx={{ py: 0.5, alignItems: 'center' }}
        >
          <Box
            aria-hidden
            sx={{
              width: 12,
              height: 12,
              borderRadius: 0.5,
              flexShrink: 0,
              bgcolor: categoryColor(slice.categoryId),
            }}
          />
          <Typography variant="body2" sx={{ flex: 1 }}>
            {slice.name}
          </Typography>
          <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(slice.revenueCents)}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ width: 56, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
          >
            {formatPercent(slice.share)}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}

export function CategoryChart({ data }: { data: CategoryRevenue[] }) {
  const total = data.reduce((sum, item) => sum + item.revenueCents, 0);
  const slices = data.map((item) => ({
    ...item,
    share: total === 0 ? 0 : item.revenueCents / total,
  }));
  const table = {
    columns: ['Categoria', 'Receita', 'Participação'],
    rows: slices.map((s) => [s.name, formatCurrency(s.revenueCents), formatPercent(s.share)]),
  };

  return (
    <ChartCard
      title="Receita por categoria"
      description="Participação de cada categoria na receita de pedidos pagos."
      table={table}
      empty={total === 0 ? 'Nenhuma venda no período.' : undefined}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={(theme) => ({
          alignItems: 'center',
          ...categoryColorVars.light,
          ...theme.applyStyles('dark', categoryColorVars.dark),
        })}
      >
        <Box sx={{ width: 220, flexShrink: 0 }}>
          <PieChart
            height={220}
            hideLegend
            series={[
              {
                innerRadius: '60%',
                paddingAngle: 1,
                cornerRadius: 4,
                data: slices.map((s) => ({
                  id: s.categoryId,
                  label: s.name,
                  value: s.revenueCents,
                  color: categoryColor(s.categoryId),
                })),
                valueFormatter: (item) => formatCurrency(item.value),
              },
            ]}
          />
        </Box>
        <Legend slices={slices} />
      </Stack>
    </ChartCard>
  );
}

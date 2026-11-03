import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { formatKpiValue } from '@/lib/format';
import type { KpiFormat, PurchasesSummary as Summary } from '@/types/metrics';

type Tile = { label: string; format: KpiFormat; value: number | null; hint: string };

const tiles = (summary: Summary): Tile[] => [
  {
    label: 'Custo de compras',
    format: 'currency',
    value: summary.purchaseCents,
    hint: 'Reposição de estoque com fornecedores.',
  },
  {
    label: 'Receita',
    format: 'currency',
    value: summary.revenueCents,
    hint: 'Itens de pedidos pagos.',
  },
  {
    label: 'CMV',
    format: 'currency',
    value: summary.cogsCents,
    hint: 'Custo das mercadorias vendidas.',
  },
  {
    label: 'Margem bruta',
    format: 'percent',
    value: summary.grossMargin,
    hint: '(Receita − CMV) ÷ receita.',
  },
];

/** Totais do período em stat tiles (sem variação: a comparação fica na visão geral). */
export function PurchasesSummary({ summary }: { summary: Summary }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
      }}
    >
      {tiles(summary).map((tile) => (
        <Paper
          key={tile.label}
          component="article"
          aria-label={tile.label}
          variant="outlined"
          sx={{ p: 2.5 }}
        >
          <Typography variant="body2" color="text.secondary" component="h2">
            {tile.label}
          </Typography>
          <Typography
            variant="h5"
            component="p"
            sx={{ fontWeight: 600, my: 0.5, fontVariantNumeric: 'tabular-nums' }}
          >
            {formatKpiValue(tile.format, tile.value)}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="p">
            {tile.hint}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}

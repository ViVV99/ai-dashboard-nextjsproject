import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import Remove from '@mui/icons-material/Remove';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatKpiValue, formatVariation } from '@/lib/format';
import type { Kpi } from '@/types/metrics';

// Todos os KPIs da visão geral são "quanto maior, melhor": alta = success, queda = error.
function Variation({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <Typography variant="body2" color="text.secondary">
        — <span>sem base de comparação</span>
      </Typography>
    );
  }
  const [Icon, color] =
    value > 0
      ? [ArrowUpward, 'success.main']
      : value < 0
        ? [ArrowDownward, 'error.main']
        : [Remove, 'text.secondary'];
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      <Icon aria-hidden fontSize="inherit" sx={{ color }} />
      <Typography variant="body2" component="span" sx={{ color, fontWeight: 600 }}>
        {formatVariation(value)}
      </Typography>
      <Typography variant="body2" component="span" color="text.secondary">
        vs. período anterior
      </Typography>
    </Stack>
  );
}

/** Stat tile: rótulo, valor e variação (seta + sinal + texto, nunca só cor). */
export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <Paper component="article" aria-label={kpi.label} variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="body2" color="text.secondary" component="h2">
        {kpi.label}
      </Typography>
      <Typography
        data-testid="kpi-value"
        variant="h4"
        component="p"
        sx={{ fontWeight: 600, my: 1, letterSpacing: '-0.01em' }}
      >
        {formatKpiValue(kpi.format, kpi.value)}
      </Typography>
      <Variation value={kpi.variation} />
      {kpi.hint && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
          {kpi.hint}
        </Typography>
      )}
    </Paper>
  );
}

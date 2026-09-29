import Box from '@mui/material/Box';
import type { Kpi } from '@/types/metrics';
import { KpiCard } from './kpi-card';

export function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
      }}
    >
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </Box>
  );
}

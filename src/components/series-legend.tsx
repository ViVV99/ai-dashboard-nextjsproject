import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export type LegendSeries = { id: string; label: string; color: string };

/** Legenda de gráficos com ≥ 2 séries: amostra de cor + rótulo em texto (nunca só cor). */
export function SeriesLegend({ series }: { series: readonly LegendSeries[] }) {
  return (
    <Stack component="ul" aria-label="Legenda" direction="row" spacing={2} sx={{ m: 0, p: 0 }}>
      {series.map((item) => (
        <Stack
          key={item.id}
          component="li"
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', listStyle: 'none' }}
        >
          <Box aria-hidden sx={{ width: 16, height: 3, borderRadius: 1, bgcolor: item.color }} />
          <Typography variant="body2">{item.label}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}

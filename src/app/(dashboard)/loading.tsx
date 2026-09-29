import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

export default function DashboardLoading() {
  return (
    <Box role="status" aria-busy="true" aria-label="Carregando">
      <Skeleton variant="text" width={220} height={40} />
      <Skeleton variant="text" width={320} sx={{ mb: 3 }} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} variant="rounded" height={104} sx={{ flex: 1 }} />
        ))}
      </Stack>
      <Skeleton variant="rounded" height={320} />
    </Box>
  );
}

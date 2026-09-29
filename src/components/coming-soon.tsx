import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

/** Área reservada para o conteúdo de uma fase futura do backlog. */
export function ComingSoon({ children }: { children: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed' }}>
      <Typography color="text.secondary">{children}</Typography>
    </Paper>
  );
}

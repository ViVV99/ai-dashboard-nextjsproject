import type { Metadata } from 'next';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { safeCallbackUrl } from '@/features/auth/callback-url';
import { LoginForm } from '@/features/auth/login-form';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { callbackUrl } = await searchParams;
  const target = safeCallbackUrl(typeof callbackUrl === 'string' ? callbackUrl : undefined);

  return (
    <Box
      component="main"
      sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', px: 2, py: 6 }}
    >
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 400, p: { xs: 3, sm: 4 } }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Entrar no AI Dashboard
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Use o e-mail e a senha cadastrados pelo administrador.
        </Typography>
        <LoginForm callbackUrl={target} />
      </Paper>
    </Box>
  );
}

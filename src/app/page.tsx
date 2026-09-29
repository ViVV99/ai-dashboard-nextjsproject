import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { logoutAction } from '@/features/auth/actions';
import { requirePageUser } from '@/server/auth';

// Provisório: o menu, a barra superior e o logout definitivo chegam na F3.
export default async function HomePage() {
  const user = await requirePageUser();

  return (
    <Container component="main" maxWidth="md" sx={{ py: 8 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          AI Dashboard
        </Typography>
        <form action={logoutAction}>
          <Button type="submit" variant="outlined">
            Sair
          </Button>
        </form>
      </Stack>
      <Typography color="text.secondary">
        Olá, {user.name}. Dashboard de vendas, compras e acessos da loja — em construção.
      </Typography>
    </Container>
  );
}

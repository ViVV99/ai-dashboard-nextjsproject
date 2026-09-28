import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export default function HomePage() {
  return (
    <Container component="main" maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AI Dashboard
      </Typography>
      <Typography color="text.secondary">
        Dashboard de vendas, compras e acessos da loja — em construção.
      </Typography>
    </Container>
  );
}

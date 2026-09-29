import type { Metadata } from 'next';
import Typography from '@mui/material/Typography';
import { PageHeader } from '@/components/page-header';

export const metadata: Metadata = { title: 'Visão geral' };

// KPIs chegam na F4.
export default async function OverviewPage() {
  return (
    <>
      <PageHeader title="Visão geral" description="Receita, pedidos e acessos da loja." />
      <Typography color="text.secondary">Os indicadores chegam na próxima etapa.</Typography>
    </>
  );
}

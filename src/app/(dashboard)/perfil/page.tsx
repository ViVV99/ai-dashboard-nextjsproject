import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';
import { PageHeader } from '@/components/page-header';

export const metadata: Metadata = { title: 'Meu perfil' };

// O layout já exige sessão; a edição (nome e senha) chega na F9.
export default async function ProfilePage() {
  return (
    <>
      <PageHeader title="Meu perfil" description="Seu nome e sua senha." />
      <ComingSoon>A edição do perfil chega na F9.</ComingSoon>
    </>
  );
}

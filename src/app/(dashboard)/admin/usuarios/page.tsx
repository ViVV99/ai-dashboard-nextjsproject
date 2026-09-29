import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';
import { PageHeader } from '@/components/page-header';
import { requirePageRole } from '@/server/auth';

export const metadata: Metadata = { title: 'Usuários' };

export default async function UsersPage() {
  await requirePageRole('admin');

  return (
    <>
      <PageHeader title="Usuários" description="Contas de leitores: criação, edição e bloqueio." />
      <ComingSoon>A gestão de usuários chega na F9.</ComingSoon>
    </>
  );
}

import type { Metadata } from 'next';
import { ComingSoon } from '@/components/coming-soon';
import { PageHeader } from '@/components/page-header';
import { requirePageRole } from '@/server/auth';

export const metadata: Metadata = { title: 'Auditoria' };

export default async function AuditPage() {
  await requirePageRole('admin');

  return (
    <>
      <PageHeader title="Auditoria" description="Registro das ações administrativas." />
      <ComingSoon>O log de auditoria chega na F9.</ComingSoon>
    </>
  );
}

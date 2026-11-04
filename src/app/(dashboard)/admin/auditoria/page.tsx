import type { Metadata } from 'next';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { z } from 'zod';
import { PageHeader } from '@/components/page-header';
import { PageLinks } from '@/components/page-links';
import { AuditTable } from '@/features/audit/audit-table';
import { requirePageRole } from '@/server/auth';
import { loadAudit } from '@/server/services/users';

export const metadata: Metadata = { title: 'Auditoria' };

const pageSchema = z.coerce.number().int().min(1).max(10_000);

export default async function AuditPage({ searchParams }: PageProps<'/admin/auditoria'>) {
  await requirePageRole('admin');
  const parsed = pageSchema.safeParse((await searchParams).page);
  const audit = await loadAudit(parsed.success ? parsed.data : 1);
  const pages = Math.ceil(audit.total / audit.pageSize);

  return (
    <>
      <PageHeader
        title="Auditoria"
        description="Ações dos administradores sobre as contas de leitores, da mais recente à mais antiga."
      />
      <AuditTable entries={audit.items} />
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {audit.total} {audit.total === 1 ? 'registro' : 'registros'}
        </Typography>
        <PageLinks page={audit.page} pages={pages} pathname="/admin/auditoria" params={{}} />
      </Stack>
    </>
  );
}

import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import { UsersManager } from '@/features/users/users-manager';
import { userListQuerySchema } from '@/schemas/users';
import { requirePageRole } from '@/server/auth';
import { loadUsers } from '@/server/services/users';

export const metadata: Metadata = { title: 'Usuários' };

type SearchParams = Record<string, string | string[] | undefined>;

// Filtro inválido ou repetido na URL cai no padrão (lista completa), como o período.
function resolveQuery(params: SearchParams) {
  const parsed = userListQuerySchema.safeParse(params);
  return parsed.success ? parsed.data : userListQuerySchema.parse({});
}

export default async function UsersPage({ searchParams }: PageProps<'/admin/usuarios'>) {
  await requirePageRole('admin');
  const query = resolveQuery(await searchParams);
  const list = await loadUsers(query);

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Contas de leitores: criação, edição, bloqueio e redefinição de senha."
      />
      <UsersManager list={list} query={query} />
    </>
  );
}

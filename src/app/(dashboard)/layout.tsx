import { AppShell } from '@/features/layout/app-shell';
import { requirePageUser } from '@/server/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();

  // Só o que a casca exibe cruza para o Client Component (nome e perfil).
  return <AppShell user={{ name: user.name, role: user.role }}>{children}</AppShell>;
}

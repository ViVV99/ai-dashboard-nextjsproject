import { AppShell } from '@/features/layout/app-shell';
import { requirePageUser } from '@/server/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();

  // Só dados serializáveis e não sensíveis cruzam para o Client Component.
  return (
    <AppShell user={{ name: user.name, email: user.email, role: user.role }}>{children}</AppShell>
  );
}

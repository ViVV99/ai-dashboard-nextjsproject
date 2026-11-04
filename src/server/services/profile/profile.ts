import { and, eq, sql } from 'drizzle-orm';
import type { ChangePasswordInput, ProfileNameInput } from '@/schemas/users';
import type { SessionUser } from '@/types/auth';
import type { AppDatabase } from '../../db/client';
import { users } from '../../db/schema';
import { AuthError } from '../../auth/errors';
import { UserRuleError } from '../users/errors';

// Ações do usuário sobre a própria conta (não são administrativas: sem auditoria).

type Hash = (password: string) => Promise<string>;
type Verify = (hashed: string, password: string) => Promise<boolean>;

const now = () => new Date().toISOString();

export function updateOwnName(
  db: AppDatabase,
  user: SessionUser,
  input: ProfileNameInput,
): { name: string } {
  db.update(users).set({ name: input.name, updatedAt: now() }).where(eq(users.id, user.id)).run();
  return { name: input.name };
}

/**
 * Confere a senha atual e grava a nova com `session_version + 1` (todas as sessões caem;
 * a fachada renova a atual). O UPDATE exige o `session_version` da sessão: se ela foi
 * revogada no meio (bloqueio, outra troca), nada muda e a resposta é 401.
 */
export async function changeOwnPassword(
  db: AppDatabase,
  user: SessionUser,
  input: ChangePasswordInput,
  verify: Verify,
  hash: Hash,
): Promise<{ sessionVersion: number }> {
  const current = db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .get();
  if (!current) throw new AuthError('unauthorized');
  if (!(await verify(current.passwordHash, input.currentPassword))) {
    throw new UserRuleError('wrong_password');
  }

  const passwordHash = await hash(input.newPassword);
  const updated = db
    .update(users)
    .set({ passwordHash, sessionVersion: sql`${users.sessionVersion} + 1`, updatedAt: now() })
    .where(and(eq(users.id, user.id), eq(users.sessionVersion, user.sessionVersion)))
    .returning({ sessionVersion: users.sessionVersion })
    .get();
  if (!updated) throw new AuthError('unauthorized');
  return updated;
}

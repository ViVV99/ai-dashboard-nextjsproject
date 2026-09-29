import { eq } from 'drizzle-orm';
import type { SessionUser } from '@/types/auth';
import type { AppDatabase } from '../db/client';
import { users } from '../db/schema';

/** Dados mínimos guardados no JWT. */
export type SessionClaims = { userId: number; sessionVersion: number };

/** Extrai as claims do JWT/sessão do Auth.js (`sub` é string). */
export function tokenClaims(token: {
  sub?: string;
  sessionVersion?: number;
}): SessionClaims | null {
  const userId = Number(token.sub);
  if (!token.sub || !Number.isInteger(userId) || token.sessionVersion === undefined) return null;
  return { userId, sessionVersion: token.sessionVersion };
}

/**
 * Revalida a sessão contra o banco (1 consulta por PK). Retorna null se o usuário
 * não existe, está bloqueado ou se o `session_version` do token está desatualizado.
 */
export async function loadSessionUser(
  db: AppDatabase,
  claims: SessionClaims | null,
): Promise<SessionUser | null> {
  if (!claims) return null;
  const user = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      sessionVersion: users.sessionVersion,
    })
    .from(users)
    .where(eq(users.id, claims.userId))
    .get();
  if (!user || user.status !== 'active' || user.sessionVersion !== claims.sessionVersion) {
    return null;
  }
  const { id, name, email, role, sessionVersion } = user;
  return { id, name, email, role, sessionVersion };
}

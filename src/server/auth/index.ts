import type { SessionUser } from '@/types/auth';
import type { Role } from '@/types/domain';
import { getDb } from '../db';
import { auth } from './config';
import { assertRole, assertUser } from './guards';
import { loadSessionUser, type SessionClaims } from './session';

async function readClaims(): Promise<SessionClaims | null> {
  const session = await auth();
  const userId = Number(session?.user?.id);
  const sessionVersion = session?.user?.sessionVersion;
  if (!Number.isInteger(userId) || sessionVersion === undefined) return null;
  return { userId, sessionVersion };
}

/** Usuário da sessão revalidado no banco; lança AuthError 401 se inválido. */
export async function requireUser(): Promise<SessionUser> {
  return assertUser(await loadSessionUser(getDb(), await readClaims()));
}

/** Como requireUser, mas exige o perfil informado (AuthError 403). */
export async function requireRole(role: Role): Promise<SessionUser> {
  return assertRole(await loadSessionUser(getDb(), await readClaims()), role);
}

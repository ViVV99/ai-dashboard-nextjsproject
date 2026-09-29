import { redirect } from 'next/navigation';
import type { SessionUser } from '@/types/auth';
import type { Role } from '@/types/domain';
import { getDb } from '../db';
import { auth } from './config';
import { AuthError } from './errors';
import { assertRole, assertUser } from './guards';
import { loadSessionUser, tokenClaims, type SessionClaims } from './session';

async function readClaims(): Promise<SessionClaims | null> {
  const session = await auth();
  return session
    ? tokenClaims({ sub: session.user.id, sessionVersion: session.user.sessionVersion })
    : null;
}

/** Usuário da sessão revalidado no banco; lança AuthError 401 se inválido. */
export async function requireUser(): Promise<SessionUser> {
  return assertUser(await loadSessionUser(getDb(), await readClaims()));
}

/** Como requireUser, mas exige o perfil informado (AuthError 403). */
export async function requireRole(role: Role): Promise<SessionUser> {
  return assertRole(await loadSessionUser(getDb(), await readClaims()), role);
}

/** Para Server Components: sessão inválida redireciona para o login em vez de lançar. */
export async function requirePageUser(): Promise<SessionUser> {
  try {
    return await requireUser();
  } catch (error) {
    if (error instanceof AuthError) redirect('/login');
    throw error;
  }
}

/** Para Server Components com perfil exigido: sem sessão → login; sem permissão → visão geral. */
export async function requirePageRole(role: Role): Promise<SessionUser> {
  try {
    return await requireRole(role);
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    redirect(error.status === 403 ? '/' : '/login');
  }
}

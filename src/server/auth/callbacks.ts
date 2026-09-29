import type { JWT } from '@auth/core/jwt';
import { CredentialsSignin, type Session, type User } from 'next-auth';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import type { LoginResult } from '@/types/auth';
import type { AppDatabase } from '../db/client';
import { clientIp } from './client-ip';
import { loadSessionUser, tokenClaims } from './session';

// Callbacks do Auth.js como funções puras (dependências por parâmetro) para teste.

/** Duração absoluta da sessão, contada do login (sem renovação por atividade). */
export const SESSION_MAX_AGE_S = 8 * 60 * 60;

/** Código exposto na URL/erro quando o rate limit do login é atingido. */
export class RateLimitedSignin extends CredentialsSignin {
  override code = 'rate_limited';
}

type Verify = (input: LoginInput, ip: string) => Promise<LoginResult>;

export async function authorizeCredentials(
  credentials: unknown,
  request: Request,
  verify: Verify,
  trustedHops: number,
): Promise<User | null> {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return null;
  const result = await verify(parsed.data, clientIp(request.headers, trustedHops));
  if (result.ok) return { ...result.user, id: String(result.user.id) };
  if (result.reason === 'rate_limited') throw new RateLimitedSignin();
  return null;
}

/**
 * No login grava as claims; nas leituras seguintes revalida no banco. Retornar null
 * faz o Auth.js remover o cookie (bloqueio, session_version novo ou sessão expirada).
 */
export async function jwtCallback(
  db: AppDatabase,
  { token, user }: { token: JWT; user?: User },
  now = Date.now(),
): Promise<JWT | null> {
  if (user) {
    const { id, role, sessionVersion } = user;
    return { ...token, sub: id, role, sessionVersion, loginAt: now };
  }
  if (token.loginAt === undefined || now - token.loginAt >= SESSION_MAX_AGE_S * 1000) return null;
  const current = await loadSessionUser(db, tokenClaims(token));
  return current ? { ...token, name: current.name, role: current.role } : null;
}

export function sessionCallback({
  session,
  token,
}: {
  session: Omit<Session, 'user'> & { user?: Partial<Session['user']> };
  token: JWT;
}): Session {
  if (!token.sub || !token.role || token.sessionVersion === undefined) return session as Session;
  const user = {
    ...session.user,
    id: token.sub,
    role: token.role,
    sessionVersion: token.sessionVersion,
  };
  return { ...session, user: user as Session['user'] };
}

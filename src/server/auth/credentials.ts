import { randomUUID } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import { normalizeEmail, type LoginInput } from '@/schemas/auth';
import type { LoginResult } from '@/types/auth';
import type { AppDatabase } from '../db/client';
import { users } from '../db/schema';
import { createRateLimiter, type RateLimiter } from './rate-limit';

const WINDOW_MS = 15 * 60 * 1000;

type VerifierDeps = {
  byEmailAndIp?: RateLimiter;
  byIp?: RateLimiter;
  verifyPassword?: (hashed: string, password: string) => Promise<boolean>;
};

// Hash fictício: e-mail inexistente também paga o custo do argon2 (tempo constante).
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hash(randomUUID()));

/**
 * Cria a função que valida e-mail e senha com rate limit (ADR 0002, itens 8 e 9).
 * Toda falha retorna `invalid`, sem dizer se o e-mail existe ou se o usuário está bloqueado.
 */
export function createCredentialsVerifier(db: AppDatabase, deps: VerifierDeps = {}) {
  const byEmailAndIp = deps.byEmailAndIp ?? createRateLimiter({ limit: 5, windowMs: WINDOW_MS });
  const byIp = deps.byIp ?? createRateLimiter({ limit: 20, windowMs: WINDOW_MS });
  const verifyPassword = deps.verifyPassword ?? verify;

  return async function verifyCredentials(input: LoginInput, ip: string): Promise<LoginResult> {
    const email = normalizeEmail(input.email);
    const emailKey = `${email}|${ip}`;
    if (!byIp.hit(ip).allowed || !byEmailAndIp.hit(emailKey).allowed) {
      return { ok: false, reason: 'rate_limited' };
    }

    const user = db.select().from(users).where(eq(users.email, email)).get();
    const matches = await verifyPassword(
      user?.passwordHash ?? (await getDummyHash()),
      input.password,
    );
    if (!user || !matches || user.status !== 'active') return { ok: false, reason: 'invalid' };

    byEmailAndIp.reset(emailKey);
    const { id, name, role, sessionVersion } = user;
    return { ok: true, user: { id, name, email: user.email, role, sessionVersion } };
  };
}

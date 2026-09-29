import type { Role } from './domain';

/** Usuário autenticado, sem dados sensíveis (nunca inclui o hash da senha). */
export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  sessionVersion: number;
};

export type LoginResult =
  { ok: true; user: SessionUser } | { ok: false; reason: 'invalid' | 'rate_limited' };

import type { SessionUser } from '@/types/auth';
import type { Role } from '@/types/domain';
import { AuthError } from './errors';

/** Exige um usuário autenticado (401 caso contrário). */
export function assertUser(user: SessionUser | null): SessionUser {
  if (!user) throw new AuthError('unauthorized');
  return user;
}

/** Exige um usuário autenticado com o perfil informado (401 ou 403). */
export function assertRole(user: SessionUser | null, role: Role): SessionUser {
  const current = assertUser(user);
  if (current.role !== role) throw new AuthError('forbidden');
  return current;
}

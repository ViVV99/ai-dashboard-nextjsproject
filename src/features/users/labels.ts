import type { Role, UserStatus } from '@/types/domain';

export const ROLE_LABEL: Record<Role, string> = { admin: 'Administrador', viewer: 'Leitor' };
export const STATUS_LABEL: Record<UserStatus, string> = { active: 'Ativo', blocked: 'Bloqueado' };

import type { Role, UserStatus } from './domain';

/** Usuário como a gestão o vê: sem hash de senha nem `session_version`. */
export type UserSummary = {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
};

export type UserListPage = {
  items: UserSummary[];
  total: number;
  page: number;
  pageSize: number;
};

export type AuditAction =
  'user.create' | 'user.update' | 'user.block' | 'user.unblock' | 'user.reset_password';

export type AuditEntry = {
  id: number;
  action: AuditAction;
  actorName: string;
  targetName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type AuditPage = { items: AuditEntry[]; total: number; page: number; pageSize: number };

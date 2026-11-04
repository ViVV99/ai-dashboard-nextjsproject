import { hash } from '@node-rs/argon2';
import type { CreateUserInput, UpdateUserInput, UserListQuery } from '@/schemas/users';
import type { AuditPage, UserListPage, UserSummary } from '@/types/users';
import { requireRole } from '../../auth';
import { getDb } from '../../db';
import { listAudit } from './audit';
import {
  createViewer,
  listUsers,
  resetViewerPassword,
  setViewerStatus,
  updateViewer,
} from './users';

// Fachada da gestão de usuários: exige admin antes de abrir o banco (defesa em profundidade).
// Actions, páginas e a API REST chamam estas funções, nunca os services direto.

const hashPassword = (password: string) => hash(password);

export async function loadUsers(query: UserListQuery): Promise<UserListPage> {
  await requireRole('admin');
  return listUsers(getDb(), query);
}

export async function createUser(input: CreateUserInput): Promise<UserSummary> {
  const actor = await requireRole('admin');
  return createViewer(getDb(), actor, input, hashPassword);
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<UserSummary> {
  const actor = await requireRole('admin');
  return updateViewer(getDb(), actor, id, input);
}

export async function blockUser(id: number): Promise<UserSummary> {
  const actor = await requireRole('admin');
  return setViewerStatus(getDb(), actor, id, 'blocked');
}

export async function unblockUser(id: number): Promise<UserSummary> {
  const actor = await requireRole('admin');
  return setViewerStatus(getDb(), actor, id, 'active');
}

export async function resetUserPassword(id: number, password: string): Promise<UserSummary> {
  const actor = await requireRole('admin');
  return resetViewerPassword(getDb(), actor, id, password, hashPassword);
}

export async function loadAudit(page: number): Promise<AuditPage> {
  await requireRole('admin');
  return listAudit(getDb(), page);
}

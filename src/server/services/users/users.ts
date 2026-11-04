import { and, asc, count, eq, ne, or, sql } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import type { CreateUserInput, UpdateUserInput, UserListQuery } from '@/schemas/users';
import type { SessionUser } from '@/types/auth';
import type { UserStatus } from '@/types/domain';
import type { UserListPage, UserSummary } from '@/types/users';
import type { AppDatabase } from '../../db/client';
import { users } from '../../db/schema';
import { recordAudit } from './audit';
import { UserRuleError } from './errors';
import type { DbExecutor } from './executor';

// Gestão de viewers pelo admin. Regras em .ai/domains/usuarios-e-perfis.md.
// Cada mudança e sua auditoria rodam na mesma transação (síncrona no better-sqlite3);
// o hash (argon2, assíncrono) é calculado antes dela.

export const USERS_PAGE_SIZE = 20;
type Hash = (password: string) => Promise<string>;

const summary = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  status: users.status,
  createdAt: users.createdAt,
};

// LIKE com ESCAPE: % e _ digitados na busca são literais.
const escapeLike = (text: string) => text.replace(/[\\%_]/g, (char) => `\\${char}`);
const contains = (column: AnySQLiteColumn, text: string) =>
  sql`${column} like ${`%${escapeLike(text)}%`} escape '\\'`;

function listFilter({ q, status }: UserListQuery) {
  return and(
    q ? or(contains(users.name, q), contains(users.email, q)) : undefined,
    status === 'all' ? undefined : eq(users.status, status),
  );
}

export function listUsers(db: AppDatabase, query: UserListQuery): UserListPage {
  const where = listFilter(query);
  const items = db
    .select(summary)
    .from(users)
    .where(where)
    .orderBy(asc(users.name), asc(users.id))
    .limit(USERS_PAGE_SIZE)
    .offset((query.page - 1) * USERS_PAGE_SIZE)
    .all();
  const total = db.select({ total: count() }).from(users).where(where).get()?.total ?? 0;
  return { items, total, page: query.page, pageSize: USERS_PAGE_SIZE };
}

const getSummary = (db: DbExecutor, id: number) =>
  db.select(summary).from(users).where(eq(users.id, id)).get();

/** Alvo das ações do admin: precisa existir, não ser o próprio ator e ser viewer. */
function viewerTarget(db: DbExecutor, actor: SessionUser, id: number): UserSummary {
  if (id === actor.id) throw new UserRuleError('self_action');
  const target = getSummary(db, id);
  if (!target) throw new UserRuleError('not_found');
  if (target.role !== 'viewer') throw new UserRuleError('admin_target');
  return target;
}

function assertEmailFree(db: DbExecutor, email: string, exceptId?: number) {
  const taken = db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), exceptId ? ne(users.id, exceptId) : undefined))
    .get();
  if (taken) throw new UserRuleError('email_taken');
}

// Corrida entre a checagem e o insert: a UNIQUE do banco vira o mesmo 409.
function rethrowUniqueEmail(error: unknown): never {
  const code = (error as { code?: unknown }).code;
  if (code === 'SQLITE_CONSTRAINT_UNIQUE') throw new UserRuleError('email_taken');
  throw error;
}

const now = () => new Date().toISOString();

export async function createViewer(
  db: AppDatabase,
  actor: SessionUser,
  input: CreateUserInput,
  hash: Hash,
): Promise<UserSummary> {
  const passwordHash = await hash(input.password);
  try {
    return db.transaction((tx) => {
      assertEmailFree(tx, input.email);
      const created = tx
        .insert(users)
        .values({ name: input.name, email: input.email, passwordHash, role: 'viewer' })
        .returning(summary)
        .get();
      recordAudit(tx, { actorId: actor.id, action: 'user.create', targetId: created.id });
      return created;
    });
  } catch (error) {
    return rethrowUniqueEmail(error);
  }
}

export function updateViewer(
  db: AppDatabase,
  actor: SessionUser,
  id: number,
  input: UpdateUserInput,
): UserSummary {
  try {
    return db.transaction((tx) => {
      const target = viewerTarget(tx, actor, id);
      const changed = (['name', 'email'] as const).filter(
        (field) => target[field] !== input[field],
      );
      if (changed.length === 0) return target;
      if (changed.includes('email')) assertEmailFree(tx, input.email, id);
      tx.update(users)
        .set({ ...input, updatedAt: now() })
        .where(eq(users.id, id))
        .run();
      recordAudit(tx, {
        actorId: actor.id,
        action: 'user.update',
        targetId: id,
        metadata: { changed },
      });
      return { ...target, ...input };
    });
  } catch (error) {
    return rethrowUniqueEmail(error);
  }
}

/** Bloquear derruba as sessões (session_version + 1); desbloquear não mexe nelas. */
export function setViewerStatus(
  db: AppDatabase,
  actor: SessionUser,
  id: number,
  status: UserStatus,
): UserSummary {
  return db.transaction((tx) => {
    const target = viewerTarget(tx, actor, id);
    if (target.status === status) return target;
    const blocking = status === 'blocked';
    tx.update(users)
      .set({
        status,
        updatedAt: now(),
        ...(blocking && { sessionVersion: sql`${users.sessionVersion} + 1` }),
      })
      .where(eq(users.id, id))
      .run();
    const action = blocking ? 'user.block' : 'user.unblock';
    recordAudit(tx, { actorId: actor.id, action, targetId: id });
    return { ...target, status };
  });
}

/** Nova senha definida pelo admin; derruba as sessões do viewer. */
export async function resetViewerPassword(
  db: AppDatabase,
  actor: SessionUser,
  id: number,
  password: string,
  hash: Hash,
): Promise<UserSummary> {
  viewerTarget(db, actor, id); // falha cedo, sem pagar o argon2
  const passwordHash = await hash(password);
  return db.transaction((tx) => {
    const target = viewerTarget(tx, actor, id);
    tx.update(users)
      .set({ passwordHash, sessionVersion: sql`${users.sessionVersion} + 1`, updatedAt: now() })
      .where(eq(users.id, id))
      .run();
    recordAudit(tx, { actorId: actor.id, action: 'user.reset_password', targetId: id });
    return target;
  });
}

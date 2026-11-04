import { count, desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import type { AuditAction, AuditEntry, AuditPage } from '@/types/users';
import type { AppDatabase } from '../../db/client';
import { auditLogs, users } from '../../db/schema';
import type { DbExecutor } from './executor';

export const AUDIT_PAGE_SIZE = 20;

type AuditInput = {
  actorId: number;
  action: AuditAction;
  targetId: number | null;
  /** Nunca senha nem hash (regra 8). */
  metadata?: Record<string, unknown>;
};

/** Grava a ação administrativa; chame dentro da transação da própria mudança. */
export function recordAudit(db: DbExecutor, { actorId, action, targetId, metadata }: AuditInput) {
  db.insert(auditLogs)
    .values({ actorId, action, targetId, metadata: metadata ?? null })
    .run();
}

const actor = alias(users, 'actor');
const target = alias(users, 'target');

/** Log de auditoria, mais recente primeiro. */
export function listAudit(db: AppDatabase, page: number): AuditPage {
  const items = db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      actorName: actor.name,
      targetName: target.name,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .innerJoin(actor, eq(actor.id, auditLogs.actorId))
    .leftJoin(target, eq(target.id, auditLogs.targetId))
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
    .limit(AUDIT_PAGE_SIZE)
    .offset((page - 1) * AUDIT_PAGE_SIZE)
    .all();
  const total = db.select({ total: count() }).from(auditLogs).get()?.total ?? 0;
  // `action` é gravado só por recordAudit, sempre com um AuditAction.
  return { items: items as AuditEntry[], total, page, pageSize: AUDIT_PAGE_SIZE };
}

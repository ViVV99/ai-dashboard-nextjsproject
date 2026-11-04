import { beforeEach, describe, expect, it } from 'vitest';
import { createDatabase, migrateDatabase, type AppDatabase } from '../../db/client';
import { auditLogs, users } from '../../db/schema';
import { listAudit, recordAudit } from './audit';

let db: AppDatabase;

beforeEach(() => {
  db = createDatabase(':memory:');
  migrateDatabase(db);
  db.insert(users)
    .values([
      { id: 1, name: 'Admin', email: 'a@x.com', passwordHash: 'h', role: 'admin' },
      { id: 3, name: 'Bia', email: 'b@x.com', passwordHash: 'h', role: 'viewer' },
    ])
    .run();
});

describe('recordAudit', () => {
  it('grava ator, ação, alvo e metadata', () => {
    recordAudit(db, {
      actorId: 1,
      action: 'user.update',
      targetId: 3,
      metadata: { changed: ['name'] },
    });

    expect(db.select().from(auditLogs).all()).toEqual([
      expect.objectContaining({
        actorId: 1,
        action: 'user.update',
        targetId: 3,
        metadata: { changed: ['name'] },
      }),
    ]);
  });
});

describe('listAudit', () => {
  it('mais recentes primeiro, com nomes do ator e do alvo, 20 por página', () => {
    for (let n = 0; n < 22; n++) {
      db.insert(auditLogs)
        .values({
          actorId: 1,
          action: 'user.block',
          targetId: 3,
          createdAt: `2026-09-01T00:00:${String(n).padStart(2, '0')}.000Z`,
        })
        .run();
    }

    const first = listAudit(db, 1);
    const second = listAudit(db, 2);

    expect(first).toMatchObject({ total: 22, page: 1, pageSize: 20 });
    expect(first.items[0]).toMatchObject({
      action: 'user.block',
      actorName: 'Admin',
      targetName: 'Bia',
      createdAt: '2026-09-01T00:00:21.000Z',
    });
    expect(second.items).toHaveLength(2);
  });
});

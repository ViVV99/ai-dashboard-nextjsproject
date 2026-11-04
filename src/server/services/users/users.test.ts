import { beforeEach, describe, expect, it } from 'vitest';
import type { SessionUser } from '@/types/auth';
import type { Role, UserStatus } from '@/types/domain';
import { createDatabase, migrateDatabase, type AppDatabase } from '../../db/client';
import { auditLogs, users } from '../../db/schema';
import { loadSessionUser } from '../../auth/session';
import {
  createViewer,
  listUsers,
  resetViewerPassword,
  setViewerStatus,
  updateViewer,
} from './users';

const hash = async (password: string) => `hash:${password}`;
const admin: SessionUser = {
  id: 1,
  name: 'Admin',
  email: 'admin@x.com',
  role: 'admin',
  sessionVersion: 1,
};
let db: AppDatabase;

function user(id: number, name: string, role: Role = 'viewer', status: UserStatus = 'active') {
  db.insert(users)
    .values({
      id,
      name,
      email: `${name.toLowerCase().replace(/\W/g, '')}@x.com`,
      passwordHash: 'h',
      role,
      status,
    })
    .run();
}

const row = (id: number) =>
  db
    .select()
    .from(users)
    .all()
    .find((u) => u.id === id);
const audits = () => db.select().from(auditLogs).all();

beforeEach(() => {
  db = createDatabase(':memory:');
  migrateDatabase(db);
  user(1, 'Admin', 'admin');
  user(2, 'Outro Admin', 'admin');
  user(3, 'Bia');
  user(4, 'Ana', 'viewer', 'blocked');
});

describe('listUsers', () => {
  it('ordena por nome, sem expor hash nem session_version', () => {
    const page = listUsers(db, { q: '', status: 'all', page: 1 });

    expect(page).toMatchObject({ total: 4, page: 1, pageSize: 20 });
    expect(page.items.map((u) => u.name)).toEqual(['Admin', 'Ana', 'Bia', 'Outro Admin']);
    expect(Object.keys(page.items[0] ?? {}).sort()).toEqual(
      ['createdAt', 'email', 'id', 'name', 'role', 'status'].sort(),
    );
  });

  it('busca em nome ou e-mail, sem diferenciar maiúsculas, e filtra por status', () => {
    expect(listUsers(db, { q: 'BIA', status: 'all', page: 1 }).items.map((u) => u.id)).toEqual([3]);
    expect(listUsers(db, { q: 'ana@', status: 'all', page: 1 }).items.map((u) => u.id)).toEqual([
      4,
    ]);
    expect(listUsers(db, { q: '', status: 'blocked', page: 1 }).items.map((u) => u.id)).toEqual([
      4,
    ]);
  });

  it('% e _ na busca são literais, não curingas', () => {
    expect(listUsers(db, { q: '%', status: 'all', page: 1 }).total).toBe(0);
    expect(listUsers(db, { q: 'a_a', status: 'all', page: 1 }).total).toBe(0);
  });

  it('pagina de 20 em 20', () => {
    for (let id = 10; id < 35; id++) user(id, `Viewer ${id}`);

    const second = listUsers(db, { q: 'viewer', status: 'all', page: 2 });

    expect(second).toMatchObject({ total: 25, page: 2 });
    expect(second.items).toHaveLength(5);
  });
});

describe('createViewer', () => {
  it('cria viewer ativo com a senha em hash e audita na mesma operação', async () => {
    const created = await createViewer(
      db,
      admin,
      { name: 'Caio', email: 'caio@x.com', password: 'senha123' },
      hash,
    );

    expect(created).toMatchObject({
      name: 'Caio',
      email: 'caio@x.com',
      role: 'viewer',
      status: 'active',
    });
    expect(row(created.id)?.passwordHash).toBe('hash:senha123');
    expect(audits()).toEqual([
      expect.objectContaining({ actorId: 1, action: 'user.create', targetId: created.id }),
    ]);
    expect(JSON.stringify(audits())).not.toContain('senha123');
  });

  it('e-mail já cadastrado → 409, sem usuário nem auditoria', async () => {
    const input = { name: 'Bia 2', email: 'bia@x.com', password: 'senha123' };

    await expect(createViewer(db, admin, input, hash)).rejects.toMatchObject({ status: 409 });
    expect(db.select().from(users).all()).toHaveLength(4);
    expect(audits()).toEqual([]);
  });

  it('se a auditoria falha, o usuário também não é criado', async () => {
    const ghost = { ...admin, id: 999 }; // FK de actor_id falha no insert da auditoria
    const input = { name: 'Caio', email: 'caio@x.com', password: 'senha123' };

    await expect(createViewer(db, ghost, input, hash)).rejects.toThrow();
    expect(db.select().from(users).all()).toHaveLength(4);
  });
});

describe('regras de alvo', () => {
  const edit = { name: 'Novo', email: 'novo@x.com' };

  it.each([
    ['inexistente', 99, 404],
    ['outro admin', 2, 422],
    ['o próprio admin', 1, 422],
  ])('%s → %i em todas as ações, sem auditoria', async (_, id, status) => {
    expect(() => updateViewer(db, admin, id, edit)).toThrow(expect.objectContaining({ status }));
    expect(() => setViewerStatus(db, admin, id, 'blocked')).toThrow(
      expect.objectContaining({ status }),
    );
    await expect(resetViewerPassword(db, admin, id, 'senha123', hash)).rejects.toMatchObject({
      status,
    });
    expect(audits()).toEqual([]);
  });

  it('a si mesmo tem código próprio (self_action), checado antes do perfil', () => {
    expect(() => setViewerStatus(db, admin, 1, 'blocked')).toThrow(
      expect.objectContaining({ code: 'self_action' }),
    );
  });
});

describe('updateViewer', () => {
  it('altera nome e e-mail e audita os campos alterados', () => {
    const updated = updateViewer(db, admin, 3, { name: 'Bia Souza', email: 'bia@x.com' });

    expect(updated).toMatchObject({ name: 'Bia Souza', email: 'bia@x.com' });
    expect(audits()).toEqual([
      expect.objectContaining({
        action: 'user.update',
        targetId: 3,
        metadata: { changed: ['name'] },
      }),
    ]);
  });

  it('e-mail de outro usuário → 409 sem mudança', () => {
    expect(() => updateViewer(db, admin, 3, { name: 'Bia', email: 'ana@x.com' })).toThrow(
      expect.objectContaining({ status: 409 }),
    );
    expect(row(3)?.email).toBe('bia@x.com');
    expect(audits()).toEqual([]);
  });

  it('sem mudança real não grava nem audita', () => {
    updateViewer(db, admin, 3, { name: 'Bia', email: 'bia@x.com' });

    expect(audits()).toEqual([]);
  });
});

describe('setViewerStatus', () => {
  it('bloquear incrementa session_version e derruba a sessão do viewer', async () => {
    const claims = { userId: 3, sessionVersion: 1 };
    expect(await loadSessionUser(db, claims)).not.toBeNull();

    const blocked = setViewerStatus(db, admin, 3, 'blocked');

    expect(blocked.status).toBe('blocked');
    expect(row(3)?.sessionVersion).toBe(2);
    expect(await loadSessionUser(db, claims)).toBeNull();
    expect(audits()).toEqual([expect.objectContaining({ action: 'user.block', targetId: 3 })]);
  });

  it('desbloquear reativa sem mexer no session_version', () => {
    setViewerStatus(db, admin, 4, 'active');

    expect(row(4)).toMatchObject({ status: 'active', sessionVersion: 1 });
    expect(audits()).toEqual([expect.objectContaining({ action: 'user.unblock', targetId: 4 })]);
  });

  it('status já igual não grava nem audita', () => {
    setViewerStatus(db, admin, 4, 'blocked');

    expect(audits()).toEqual([]);
  });
});

describe('resetViewerPassword', () => {
  it('troca o hash, derruba as sessões e audita sem a senha', async () => {
    await resetViewerPassword(db, admin, 3, 'nova1234', hash);

    expect(row(3)).toMatchObject({ passwordHash: 'hash:nova1234', sessionVersion: 2 });
    expect(audits()).toEqual([
      expect.objectContaining({ action: 'user.reset_password', targetId: 3, metadata: null }),
    ]);
  });
});

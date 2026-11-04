import { describe, expect, it } from 'vitest';
import {
  changePasswordSchema,
  createUserSchema,
  profileNameSchema,
  updateUserSchema,
  userListQuerySchema,
} from './users';

const issues = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.error?.issues.map((issue) => issue.path.join('.')) ?? [];

describe('createUserSchema', () => {
  it('normaliza nome e e-mail', () => {
    expect(
      createUserSchema.parse({ name: '  Ana  ', email: ' Ana@X.COM ', password: 'senha123' }),
    ).toEqual({ name: 'Ana', email: 'ana@x.com', password: 'senha123' });
  });

  it.each([
    ['nome curto', { name: 'A', email: 'a@x.com', password: 'senha123' }, 'name'],
    ['nome longo', { name: 'a'.repeat(101), email: 'a@x.com', password: 'senha123' }, 'name'],
    ['e-mail inválido', { name: 'Ana', email: 'ana', password: 'senha123' }, 'email'],
    ['senha sem número', { name: 'Ana', email: 'a@x.com', password: 'senhasenha' }, 'password'],
  ])('%s → erro no campo', (_, input, field) => {
    expect(issues(createUserSchema.safeParse(input))).toContain(field);
  });
});

describe('updateUserSchema e profileNameSchema', () => {
  it('editam só nome e e-mail / só nome', () => {
    expect(updateUserSchema.parse({ name: 'Bia', email: 'B@x.com', role: 'admin' })).toEqual({
      name: 'Bia',
      email: 'b@x.com',
    });
    expect(profileNameSchema.parse({ name: ' Bia ' })).toEqual({ name: 'Bia' });
  });
});

describe('changePasswordSchema', () => {
  const base = {
    currentPassword: 'velha123',
    newPassword: 'nova1234',
    confirmPassword: 'nova1234',
  };

  it('aceita confirmação igual', () => {
    expect(changePasswordSchema.safeParse(base).success).toBe(true);
  });

  it('confirmação diferente → erro em confirmPassword', () => {
    expect(
      issues(changePasswordSchema.safeParse({ ...base, confirmPassword: 'outra123' })),
    ).toEqual(['confirmPassword']);
  });

  it('nova igual à atual → erro em newPassword', () => {
    const same = {
      currentPassword: 'nova1234',
      newPassword: 'nova1234',
      confirmPassword: 'nova1234',
    };
    expect(issues(changePasswordSchema.safeParse(same))).toEqual(['newPassword']);
  });
});

describe('userListQuerySchema', () => {
  it('padrões: sem busca, todos os status, página 1', () => {
    expect(userListQuerySchema.parse({})).toEqual({ q: '', status: 'all', page: 1 });
  });

  it('converte a página e apara a busca', () => {
    expect(userListQuerySchema.parse({ q: ' ana ', status: 'blocked', page: '3' })).toEqual({
      q: 'ana',
      status: 'blocked',
      page: 3,
    });
  });

  it.each([{ page: '0' }, { page: 'x' }, { status: 'deleted' }, { q: 'a'.repeat(101) }])(
    'recusa %o',
    (input) => {
      expect(userListQuerySchema.safeParse(input).success).toBe(false);
    },
  );
});

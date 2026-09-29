import { describe, expect, it } from 'vitest';
import type { SessionUser } from '@/types/auth';
import { AuthError } from './errors';
import { assertRole, assertUser } from './guards';

const viewer: SessionUser = {
  id: 2,
  name: 'V',
  email: 'v@x.com',
  role: 'viewer',
  sessionVersion: 1,
};
const admin: SessionUser = { ...viewer, id: 1, role: 'admin' };

describe('assertUser', () => {
  it('sem usuário lança 401', () => {
    expect(() => assertUser(null)).toThrow(
      expect.objectContaining({ status: 401, code: 'unauthorized' }),
    );
  });

  it('retorna o usuário', () => {
    expect(assertUser(viewer)).toBe(viewer);
  });
});

describe('assertRole', () => {
  it('viewer em rota admin lança 403', () => {
    expect(() => assertRole(viewer, 'admin')).toThrow(AuthError);
    expect(() => assertRole(viewer, 'admin')).toThrow(
      expect.objectContaining({ status: 403, code: 'forbidden' }),
    );
  });

  it('admin passa', () => {
    expect(assertRole(admin, 'admin')).toBe(admin);
  });

  it('sem usuário lança 401 antes de checar o perfil', () => {
    expect(() => assertRole(null, 'admin')).toThrow(expect.objectContaining({ status: 401 }));
  });
});

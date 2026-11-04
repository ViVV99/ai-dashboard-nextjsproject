import type { UserSummary } from '@/types/users';

// Dados de teste compartilhados pelos testes da gestão de usuários.

export const ana: UserSummary = {
  id: 7,
  name: 'Ana Lima',
  email: 'ana@x.com',
  role: 'viewer',
  status: 'active',
  createdAt: '2026-09-03T15:05:00.000Z',
};

export const caio: UserSummary = {
  ...ana,
  id: 8,
  name: 'Caio',
  email: 'caio@x.com',
  status: 'blocked',
};

export const admin: UserSummary = {
  ...ana,
  id: 1,
  name: 'Admin',
  email: 'admin@x.com',
  role: 'admin',
};

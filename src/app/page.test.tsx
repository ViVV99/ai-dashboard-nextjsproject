import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HomePage from './page';

vi.mock('@/server/auth', () => ({
  requirePageUser: vi.fn().mockResolvedValue({
    id: 1,
    name: 'Ana Admin',
    email: 'ana@exemplo.com',
    role: 'admin',
    sessionVersion: 1,
  }),
}));
vi.mock('@/features/auth/actions', () => ({ logoutAction: vi.fn() }));

describe('HomePage', () => {
  it('renderiza o título principal', async () => {
    render(await HomePage());

    expect(screen.getByRole('heading', { level: 1, name: 'AI Dashboard' })).toBeInTheDocument();
  });

  it('saúda o usuário da sessão e oferece logout', async () => {
    render(await HomePage());

    expect(screen.getByText(/Ana Admin/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });
});

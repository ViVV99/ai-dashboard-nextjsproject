import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { theme } from '@/theme/theme';
import DashboardLayout from './layout';

const { requirePageUser } = vi.hoisted(() => ({
  requirePageUser: vi.fn().mockResolvedValue({
    id: 1,
    name: 'Ana Admin',
    email: 'ana@exemplo.com',
    role: 'admin',
    sessionVersion: 3,
  }),
}));
vi.mock('@/server/auth', () => ({ requirePageUser }));
vi.mock('@/features/auth/actions', () => ({ logoutAction: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

describe('DashboardLayout', () => {
  it('exige sessão e monta a casca com o usuário e o conteúdo', async () => {
    render(
      <ThemeProvider theme={theme}>
        {await DashboardLayout({ children: <p>página</p> })}
      </ThemeProvider>,
    );

    expect(requirePageUser).toHaveBeenCalled();
    expect(screen.getByText('Ana Admin')).toBeInTheDocument();
    expect(screen.getByText('página')).toBeInTheDocument();
  });
});

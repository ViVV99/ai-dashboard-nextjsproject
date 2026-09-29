import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OverviewPage from './page';
import PurchasesPage from './compras/page';
import AccessPage from './acessos/page';
import SalesPage from './vendas/page';
import ProfilePage from './perfil/page';
import AuditPage from './admin/auditoria/page';
import UsersPage from './admin/usuarios/page';

const { requirePageRole } = vi.hoisted(() => ({ requirePageRole: vi.fn() }));
vi.mock('@/server/auth', () => ({ requirePageRole }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

type MetricsPage = (props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => Promise<ReactElement>;

const metricsPages: [string, MetricsPage][] = [
  ['Visão geral', OverviewPage as MetricsPage],
  ['Vendas', SalesPage as MetricsPage],
  ['Compras', PurchasesPage as MetricsPage],
  ['Acessos', AccessPage as MetricsPage],
];

const renderPage = async (Page: MetricsPage, params: Record<string, string> = {}) =>
  render(await Page({ searchParams: Promise.resolve(params) }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-29T15:00:00Z'));
  requirePageRole.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe.each(metricsPages)('página %s', (title, Page) => {
  it('mostra o título e o filtro com o período da URL', async () => {
    await renderPage(Page, { from: '2026-01-01', to: '2026-01-31' });

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByLabelText('De')).toHaveValue('2026-01-01');
    expect(screen.getByLabelText('Até')).toHaveValue('2026-01-31');
  });

  it('sem período na URL usa os últimos 30 dias, sem aviso', async () => {
    await renderPage(Page);

    expect(screen.getByLabelText('De')).toHaveValue('2026-08-31');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('período inválido na URL usa o padrão e avisa', async () => {
    await renderPage(Page, { from: '2026-02-30', to: '2026-03-10' });

    expect(screen.getByLabelText('De')).toHaveValue('2026-08-31');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('páginas sem filtro', () => {
  it('perfil renderiza o título', async () => {
    render(await ProfilePage());

    expect(screen.getByRole('heading', { level: 1, name: 'Meu perfil' })).toBeInTheDocument();
  });

  it.each([
    ['Usuários', UsersPage],
    ['Auditoria', AuditPage],
  ])('%s exige perfil admin', async (title, Page) => {
    render(await Page());

    expect(requirePageRole).toHaveBeenCalledWith('admin');
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  });
});

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

const { requirePageRole, loadOverview, loadSales } = vi.hoisted(() => ({
  requirePageRole: vi.fn(),
  loadOverview: vi.fn(),
  loadSales: vi.fn(),
}));
vi.mock('@/server/auth', () => ({ requirePageRole }));
vi.mock('@/server/services/metrics', () => ({ loadOverview, loadSales }));

const overview = (hasData = true) => ({
  period: { from: '2026-01-01', to: '2026-01-31' },
  previousPeriod: { from: '2025-12-01', to: '2025-12-31' },
  hasData,
  kpis: [
    { id: 'revenue', label: 'Receita', format: 'currency', value: 100, previous: 50, variation: 1 },
  ],
});
const sales = (hasData = true) => ({
  period: { from: '2026-01-01', to: '2026-01-31' },
  granularity: 'day',
  revenue: [{ bucket: '2026-01-01', revenueCents: hasData ? 100 : 0, orders: hasData ? 1 : 0 }],
  topByRevenue: [],
  topByQuantity: [],
  byCategory: [],
  hasData,
});
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
  loadOverview.mockReset().mockResolvedValue(overview());
  loadSales.mockReset().mockResolvedValue(sales());
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

describe('visão geral', () => {
  it('carrega os KPIs do período resolvido e mostra o intervalo comparado', async () => {
    await renderPage(OverviewPage as MetricsPage, { from: '2026-01-01', to: '2026-01-31' });

    expect(loadOverview).toHaveBeenCalledWith({ from: '2026-01-01', to: '2026-01-31' });
    expect(screen.getByRole('article', { name: 'Receita' })).toBeInTheDocument();
    expect(
      screen.getByText('01/01/2026 a 31/01/2026, comparado com 01/12/2025 a 31/12/2025.'),
    ).toBeInTheDocument();
  });

  it('período sem movimento mostra aviso, mas mantém os cards', async () => {
    loadOverview.mockResolvedValue(overview(false));
    await renderPage(OverviewPage as MetricsPage);

    expect(screen.getByText('Nenhuma venda paga ou acesso neste período.')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Receita' })).toBeInTheDocument();
  });
});

describe('vendas', () => {
  it('carrega as vendas do período resolvido e mostra os três gráficos', async () => {
    await renderPage(SalesPage as MetricsPage, { from: '2026-01-01', to: '2026-01-31' });

    expect(loadSales).toHaveBeenCalledWith({ from: '2026-01-01', to: '2026-01-31' });
    for (const name of ['Receita ao longo do tempo', 'Top 10 produtos', 'Receita por categoria']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
  });

  it('período sem vendas mostra aviso', async () => {
    loadSales.mockResolvedValue(sales(false));
    await renderPage(SalesPage as MetricsPage);

    expect(screen.getByText('Nenhuma venda paga neste período.')).toBeInTheDocument();
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

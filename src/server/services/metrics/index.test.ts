import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthError } from '../../auth/errors';
import { loadOverview, loadSales } from './index';

const { requireUser, getDb, getOverviewMetrics, getSalesMetrics } = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getDb: vi.fn(() => 'db'),
  getOverviewMetrics: vi.fn(() => 'métricas'),
  getSalesMetrics: vi.fn(() => 'vendas'),
}));
vi.mock('../../auth', () => ({ requireUser }));
vi.mock('../../db', () => ({ getDb }));
vi.mock('./overview', () => ({ getOverviewMetrics }));
vi.mock('./sales', () => ({ getSalesMetrics }));

const period = { from: '2026-09-01', to: '2026-09-30' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loadOverview', () => {
  it('exige sessão antes de consultar o banco', async () => {
    requireUser.mockRejectedValue(new AuthError('unauthorized'));

    await expect(loadOverview(period)).rejects.toMatchObject({ status: 401 });
    expect(getOverviewMetrics).not.toHaveBeenCalled();
  });

  it('com sessão, calcula as métricas do período no banco da aplicação', async () => {
    requireUser.mockResolvedValue({ id: 1 });

    await expect(loadOverview(period)).resolves.toBe('métricas');
    expect(getOverviewMetrics).toHaveBeenCalledWith('db', period);
  });
});

describe('loadSales', () => {
  it('exige sessão antes de consultar o banco', async () => {
    requireUser.mockRejectedValue(new AuthError('unauthorized'));

    await expect(loadSales(period)).rejects.toMatchObject({ status: 401 });
    expect(getSalesMetrics).not.toHaveBeenCalled();
  });

  it('com sessão, calcula as vendas do período no banco da aplicação', async () => {
    requireUser.mockResolvedValue({ id: 1 });

    await expect(loadSales(period)).resolves.toBe('vendas');
    expect(getSalesMetrics).toHaveBeenCalledWith('db', period);
  });
});

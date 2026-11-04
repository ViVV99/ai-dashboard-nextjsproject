// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as accessGET } from './access/route';
import { GET as overviewGET } from './overview/route';
import { GET as purchasesGET } from './purchases/route';
import { GET as salesGET } from './sales/route';

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  loadOverview: vi.fn(async () => 'overview'),
  loadSales: vi.fn(async () => 'sales'),
  loadPurchases: vi.fn(async () => 'purchases'),
  loadAccess: vi.fn(async () => 'access'),
}));
vi.mock('@/server/auth', () => ({ requireUser: mocks.requireUser }));
vi.mock('@/server/services/metrics', () => ({
  loadOverview: mocks.loadOverview,
  loadSales: mocks.loadSales,
  loadPurchases: mocks.loadPurchases,
  loadAccess: mocks.loadAccess,
}));

const period = { from: '2026-01-01', to: '2026-01-31' };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ id: 1 });
});

describe.each([
  ['overview', overviewGET, mocks.loadOverview],
  ['sales', salesGET, mocks.loadSales],
  ['purchases', purchasesGET, mocks.loadPurchases],
  ['access', accessGET, mocks.loadAccess],
] as const)('GET /api/metrics/%s', (name, GET, load) => {
  it('repassa o período à fachada certa e devolve o resultado', async () => {
    const response = await GET(
      new Request(`http://localhost/api/metrics/${name}?from=${period.from}&to=${period.to}`),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toBe(name);
    expect(load).toHaveBeenCalledWith(period);
  });
});

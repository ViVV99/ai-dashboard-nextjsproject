import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthError } from '../auth/errors';
import { metricsHandler, parsePeriodQuery } from './metrics-handler';

const { requireUser } = vi.hoisted(() => ({ requireUser: vi.fn() }));
vi.mock('../auth', () => ({ requireUser }));

const load = vi.fn(async (period: unknown) => ({ period }));
const handler = metricsHandler(load);
const get = (query: string) => handler(new Request(`http://localhost/api/metrics/x${query}`));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-29T15:00:00Z'));
  requireUser.mockReset().mockResolvedValue({ id: 1 });
  load.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('parsePeriodQuery', () => {
  it('sem from e to usa os últimos 30 dias', () => {
    expect(parsePeriodQuery(new URLSearchParams())).toEqual({
      ok: true,
      period: { from: '2026-08-31', to: '2026-09-29' },
    });
  });

  it.each([
    ['só from', 'from=2026-01-01', 'to'],
    ['data inválida', 'from=2026-02-30&to=2026-03-10', 'from'],
    ['from depois de to', 'from=2026-03-10&to=2026-03-01', 'to'],
    ['367 dias', 'from=2025-01-01&to=2026-01-02', 'to'],
    ['parâmetro repetido', 'from=2026-01-01&from=2026-02-01&to=2026-02-10', 'from'],
  ])('%s → inválido, apontando o campo', (_, query, field) => {
    const result = parsePeriodQuery(new URLSearchParams(query));

    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.details.map((d) => d.field)).toContain(field);
  });
});

describe('metricsHandler', () => {
  it('com sessão e período válido, responde 200 com o resultado do load', async () => {
    const response = await get('?from=2026-01-01&to=2026-01-31');

    expect(response.status).toBe(200);
    expect(load).toHaveBeenCalledWith({ from: '2026-01-01', to: '2026-01-31' });
    expect(await response.json()).toEqual({ period: { from: '2026-01-01', to: '2026-01-31' } });
  });

  it('período inválido → 400 com details, sem chamar o load', async () => {
    const response = await get('?from=2026-03-10&to=2026-03-01');

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: 'invalid_request',
        message: 'Parâmetros inválidos.',
        details: [{ field: 'to', message: 'A data final deve ser igual ou posterior à inicial.' }],
      },
    });
    expect(load).not.toHaveBeenCalled();
  });

  it('sem sessão → 401 antes de validar a query', async () => {
    requireUser.mockRejectedValue(new AuthError('unauthorized'));

    const response = await get('?from=lixo');

    expect(response.status).toBe(401);
    expect(load).not.toHaveBeenCalled();
  });

  it('erro inesperado no load → 500 genérico', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    load.mockRejectedValueOnce(new Error('no such index: page_views_path_idx'));

    const response = await get('');

    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain('page_views');
  });
});

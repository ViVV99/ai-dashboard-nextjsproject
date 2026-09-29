import { describe, expect, it } from 'vitest';
import { defaultPeriod, periodSchema, periodToSearch, resolvePeriod } from './period';

const now = new Date('2026-09-29T15:00:00Z');

describe('defaultPeriod', () => {
  it('são os últimos 30 dias terminando hoje (inclusive)', () => {
    expect(defaultPeriod(now)).toEqual({ from: '2026-08-31', to: '2026-09-29' });
  });
});

describe('periodSchema', () => {
  it('aceita from ≤ to dentro de 366 dias', () => {
    expect(periodSchema.safeParse({ from: '2025-09-29', to: '2026-09-29' }).success).toBe(true);
  });

  it('rejeita intervalo de 367 dias', () => {
    const result = periodSchema.safeParse({ from: '2025-09-28', to: '2026-09-29' });
    expect(result.success).toBe(false);
  });

  it('rejeita from depois de to, apontando o campo to', () => {
    const result = periodSchema.safeParse({ from: '2026-09-10', to: '2026-09-01' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['to']);
  });

  it('rejeita data inexistente em vez de normalizar', () => {
    expect(periodSchema.safeParse({ from: '2026-02-30', to: '2026-03-10' }).success).toBe(false);
  });
});

describe('resolvePeriod', () => {
  it('sem parâmetros → padrão, sem aviso', () => {
    expect(resolvePeriod({}, now)).toEqual({ period: defaultPeriod(now), invalid: false });
  });

  it('parâmetros válidos são usados', () => {
    expect(resolvePeriod({ from: '2026-01-01', to: '2026-01-31' }, now)).toEqual({
      period: { from: '2026-01-01', to: '2026-01-31' },
      invalid: false,
    });
  });

  it.each([
    [{ from: '2026-01-01' }],
    [{ to: '2026-01-31' }],
    [{ from: ['2026-01-01', '2026-01-02'], to: '2026-01-31' }],
    [{ from: '2026-02-30', to: '2026-03-10' }],
    [{ from: '2026-09-10', to: '2026-09-01' }],
  ])('parâmetros inválidos %o → padrão com aviso', (params) => {
    expect(resolvePeriod(params, now)).toEqual({ period: defaultPeriod(now), invalid: true });
  });
});

describe('periodToSearch', () => {
  it('grava from/to preservando outros parâmetros', () => {
    const current = new URLSearchParams('tab=top&from=2020-01-01');
    expect(periodToSearch({ from: '2026-01-01', to: '2026-01-31' }, current)).toBe(
      '?tab=top&from=2026-01-01&to=2026-01-31',
    );
  });
});

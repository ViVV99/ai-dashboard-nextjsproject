import { describe, expect, it } from 'vitest';
import { bucketKeys, granularityFor } from './granularity';

describe('granularityFor', () => {
  it.each([
    ['2026-09-01', '2026-09-01', 'day'],
    ['2026-08-01', '2026-08-31', 'day'], // 31 dias
    ['2026-08-01', '2026-09-01', 'week'], // 32 dias
    ['2026-01-01', '2026-06-29', 'week'], // 180 dias
    ['2026-01-01', '2026-06-30', 'month'], // 181 dias
  ])('%s a %s → %s', (from, to, expected) => {
    expect(granularityFor({ from, to })).toBe(expected);
  });
});

describe('bucketKeys', () => {
  it('dia: todos os dias do período, inclusive as pontas', () => {
    expect(bucketKeys({ from: '2026-08-30', to: '2026-09-02' }, 'day')).toEqual([
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
    ]);
  });

  it('semana: chave é a segunda-feira, mesmo antes de `from`', () => {
    // 2026-09-02 é quarta; 2026-09-13 é domingo; 2026-09-14 é segunda.
    expect(bucketKeys({ from: '2026-09-02', to: '2026-09-14' }, 'week')).toEqual([
      '2026-08-31',
      '2026-09-07',
      '2026-09-14',
    ]);
  });

  it('semana atravessando o ano', () => {
    // 2026-01-01 é quinta → semana de 2025-12-29.
    expect(bucketKeys({ from: '2025-12-28', to: '2026-01-05' }, 'week')).toEqual([
      '2025-12-22',
      '2025-12-29',
      '2026-01-05',
    ]);
  });

  it('mês: chave é o dia 1, atravessando o ano', () => {
    expect(bucketKeys({ from: '2025-11-15', to: '2026-02-03' }, 'month')).toEqual([
      '2025-11-01',
      '2025-12-01',
      '2026-01-01',
      '2026-02-01',
    ]);
  });
});

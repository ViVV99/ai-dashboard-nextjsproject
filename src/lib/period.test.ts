import { describe, expect, it } from 'vitest';
import { previousPeriod, toUtcRange } from './period';

describe('previousPeriod', () => {
  it('mesma duração, imediatamente antes (exemplo da spec: 01–30/09 → 02–31/08)', () => {
    expect(previousPeriod({ from: '2026-09-01', to: '2026-09-30' })).toEqual({
      from: '2026-08-02',
      to: '2026-08-31',
    });
  });

  it('período de um dia compara com o dia anterior', () => {
    expect(previousPeriod({ from: '2026-09-29', to: '2026-09-29' })).toEqual({
      from: '2026-09-28',
      to: '2026-09-28',
    });
  });

  it('atravessa a virada de ano', () => {
    expect(previousPeriod({ from: '2026-01-01', to: '2026-01-07' })).toEqual({
      from: '2025-12-25',
      to: '2025-12-31',
    });
  });
});

describe('toUtcRange', () => {
  it('converte o dia local (UTC-3) em intervalo UTC semiaberto', () => {
    expect(toUtcRange({ from: '2026-09-01', to: '2026-09-30' })).toEqual({
      start: '2026-09-01T03:00:00.000Z',
      end: '2026-10-01T03:00:00.000Z',
    });
  });
});

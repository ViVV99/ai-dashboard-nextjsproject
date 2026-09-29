import { describe, expect, it } from 'vitest';
import { activePresetId, PERIOD_PRESETS, presetPeriod } from './presets';

const now = new Date('2026-09-29T15:00:00Z');

describe('presets de período', () => {
  it('oferece 7, 30 e 90 dias e 12 meses', () => {
    expect(PERIOD_PRESETS.map((preset) => preset.label)).toEqual([
      '7 dias',
      '30 dias',
      '90 dias',
      '12 meses',
    ]);
  });

  it('cada preset termina hoje e inclui as duas pontas', () => {
    expect(presetPeriod(7, now)).toEqual({ from: '2026-09-23', to: '2026-09-29' });
    expect(presetPeriod(365, now)).toEqual({ from: '2025-09-30', to: '2026-09-29' });
  });

  it('identifica o preset ativo, ou nenhum para um intervalo personalizado', () => {
    expect(activePresetId({ from: '2026-08-31', to: '2026-09-29' }, now)).toBe('30d');
    expect(activePresetId({ from: '2026-08-01', to: '2026-08-31' }, now)).toBeNull();
  });
});

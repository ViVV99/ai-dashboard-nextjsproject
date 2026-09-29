import { addDays, todayInStore } from '@/lib/dates';
import type { Period } from '@/types/period';

export type PeriodPreset = { id: string; label: string; days: number };

export const PERIOD_PRESETS: readonly PeriodPreset[] = [
  { id: '7d', label: '7 dias', days: 7 },
  { id: '30d', label: '30 dias', days: 30 },
  { id: '90d', label: '90 dias', days: 90 },
  { id: '12m', label: '12 meses', days: 365 },
];

/** Os últimos `days` dias terminando hoje (fuso da loja), com as duas pontas inclusivas. */
export function presetPeriod(days: number, now: Date = new Date()): Period {
  const to = todayInStore(now);
  return { from: addDays(to, -(days - 1)), to };
}

export function activePresetId(period: Period, now: Date = new Date()): string | null {
  const match = PERIOD_PRESETS.find((preset) => {
    const candidate = presetPeriod(preset.days, now);
    return candidate.from === period.from && candidate.to === period.to;
  });
  return match?.id ?? null;
}

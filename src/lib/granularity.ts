import type { Granularity } from '@/types/metrics';
import type { Period } from '@/types/period';
import { addDays, daysBetween } from './dates';

// Granularidade automática dos gráficos temporais. Ver .ai/domains/metricas.md.

export function granularityFor({ from, to }: Period): Granularity {
  const days = daysBetween(from, to);
  if (days <= 31) return 'day';
  if (days <= 180) return 'week';
  return 'month';
}

/** Segunda-feira da semana (segunda a domingo) que contém `date`. */
function weekStart(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = domingo
  return addDays(date, -((weekday + 6) % 7));
}

function nextMonth(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const next = month === 12 ? [year + 1, 1] : [year, month + 1];
  return `${next[0]}-${String(next[1]).padStart(2, '0')}-01`;
}

/** Chave de cada bucket do período, em ordem (dia, segunda-feira ou dia 1 do mês). */
export function bucketKeys({ from, to }: Period, granularity: Granularity): string[] {
  const first =
    granularity === 'day'
      ? from
      : granularity === 'week'
        ? weekStart(from)
        : `${from.slice(0, 8)}01`;
  const step = (key: string) =>
    granularity === 'day'
      ? addDays(key, 1)
      : granularity === 'week'
        ? addDays(key, 7)
        : nextMonth(key);
  const keys: string[] = [];
  for (let key = first; key <= to; key = step(key)) keys.push(key);
  return keys;
}

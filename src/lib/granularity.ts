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
  // Date.UTC normaliza o mês 12 (0-based) para janeiro do ano seguinte.
  const next = new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)), 1));
  return next.toISOString().slice(0, 10);
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

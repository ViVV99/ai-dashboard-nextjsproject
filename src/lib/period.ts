import type { Period } from '@/types/period';
import { addDays, daysBetween, STORE_OFFSET_MS } from './dates';

/** Período de mesma duração imediatamente anterior. Ver .ai/domains/metricas.md. */
export function previousPeriod({ from, to }: Period): Period {
  const days = daysBetween(from, to);
  return { from: addDays(from, -days), to: addDays(to, -days) };
}

const localMidnightUtc = (date: string) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + STORE_OFFSET_MS).toISOString();

/**
 * Intervalo UTC semiaberto `[start, end)` que cobre os dias locais do período.
 * Compatível com `created_at` gravado como ISO 8601 UTC (comparação de texto).
 */
export function toUtcRange({ from, to }: Period): { start: string; end: string } {
  return { start: localMidnightUtc(from), end: localMidnightUtc(addDays(to, 1)) };
}

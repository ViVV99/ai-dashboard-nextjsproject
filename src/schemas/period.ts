import { z } from 'zod';
import { addDays, daysBetween, isValidIsoDate, todayInStore } from '@/lib/dates';
import type { Period } from '@/types/period';

export const DEFAULT_PERIOD_DAYS = 30;
export const MAX_PERIOD_DAYS = 366;

const isoDate = z.string().refine(isValidIsoDate, 'Informe uma data válida.');

// Os refines do objeto rodam mesmo com campo inválido (Zod 4): só comparam datas válidas,
// para não acusar o campo correto.
const bothValid = ({ from, to }: Period) => isValidIsoDate(from) && isValidIsoDate(to);

/** Período do filtro. Ver .ai/domains/metricas.md. */
export const periodSchema = z
  .object({ from: isoDate, to: isoDate })
  .refine((value) => !bothValid(value) || value.from <= value.to, {
    path: ['to'],
    message: 'A data final deve ser igual ou posterior à inicial.',
  })
  .refine(
    (value) =>
      !bothValid(value) ||
      value.from > value.to ||
      daysBetween(value.from, value.to) <= MAX_PERIOD_DAYS,
    {
      path: ['to'],
      message: `O período pode ter no máximo ${MAX_PERIOD_DAYS} dias.`,
    },
  );

export function defaultPeriod(now: Date = new Date()): Period {
  const to = todayInStore(now);
  return { from: addDays(to, -(DEFAULT_PERIOD_DAYS - 1)), to };
}

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Lê o período da URL. Sem `from` e `to` → padrão. Qualquer outro caso inválido também
 * cai no padrão, mas com `invalid: true` para a página avisar.
 */
export function resolvePeriod(
  params: SearchParams,
  now: Date = new Date(),
): { period: Period; invalid: boolean } {
  if (params.from === undefined && params.to === undefined) {
    return { period: defaultPeriod(now), invalid: false };
  }
  const parsed = periodSchema.safeParse({ from: params.from, to: params.to });
  return parsed.success
    ? { period: parsed.data, invalid: false }
    : { period: defaultPeriod(now), invalid: true };
}

/** Query string com o período, preservando os outros parâmetros atuais. */
export function periodToSearch(period: Period, current?: URLSearchParams): string {
  const params = new URLSearchParams(current);
  params.set('from', period.from);
  params.set('to', period.to);
  return `?${params.toString()}`;
}

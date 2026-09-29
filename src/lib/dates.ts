// Datas de calendário no formato YYYY-MM-DD, no fuso da loja.
// A loja opera em America/Sao_Paulo: UTC-3 fixo (sem horário de verão desde 2019).

export const STORE_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const toMs = (date: string) => Date.parse(`${date}T00:00:00Z`);
const fromMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Dia corrente da loja. */
export function todayInStore(now: Date = new Date()): string {
  return fromMs(now.getTime() - STORE_OFFSET_MS);
}

/** Formato YYYY-MM-DD e data existente (rejeita 2026-02-30 em vez de normalizar). */
export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const ms = toMs(value);
  return !Number.isNaN(ms) && fromMs(ms) === value;
}

export function addDays(date: string, days: number): string {
  return fromMs(toMs(date) + days * DAY_MS);
}

/** Quantidade de dias do intervalo, contando as duas pontas. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toMs(to) - toMs(from)) / DAY_MS) + 1;
}

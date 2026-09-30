import type { Granularity, KpiFormat } from '@/types/metrics';

// Formatação pt-BR para a UI. Valores monetários chegam em centavos.

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const integer = new Intl.NumberFormat('pt-BR');
const percent = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const signedPercent = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

export const formatCurrency = (cents: number) => currency.format(cents / 100);
export const formatInteger = (value: number) => integer.format(value);
export const formatPercent = (value: number) => percent.format(value);
export const formatVariation = (value: number) => signedPercent.format(value);

/** `YYYY-MM-DD` → `dd/mm/aaaa`, sem passar por `Date` (evita deslocamento de fuso). */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/** Valor de KPI conforme o tipo; `null` (razão sem denominador) vira "—". */
export function formatKpiValue(format: KpiFormat, value: number | null) {
  if (value === null) return '—';
  if (format === 'currency') return formatCurrency(value);
  if (format === 'percent') return formatPercent(value);
  return formatInteger(value);
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Rótulo curto de um bucket: `07/09`, `sem. 07/09` ou `set/26`. */
export function formatBucket(key: string, granularity: Granularity): string {
  const month = key.slice(5, 7);
  if (granularity === 'month') return `${MONTHS[Number(month) - 1]}/${key.slice(2, 4)}`;
  const dayMonth = `${key.slice(8, 10)}/${month}`;
  return granularity === 'week' ? `sem. ${dayMonth}` : dayMonth;
}

const compactCurrency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Moeda abreviada para eixos (`R$ 12,3 mil`), a partir de centavos. */
export const formatCompactCurrency = (cents: number) => compactCurrency.format(cents / 100);

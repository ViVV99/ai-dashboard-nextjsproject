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
  const [year, month, day] = key.split('-');
  if (granularity === 'month') return `${MONTHS[Number(month) - 1]}/${year.slice(2)}`;
  const dayMonth = `${day}/${month}`;
  return granularity === 'week' ? `sem. ${dayMonth}` : dayMonth;
}

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

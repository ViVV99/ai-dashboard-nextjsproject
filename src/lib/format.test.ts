import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatBucket,
  formatCompactCurrency,
  formatDate,
  formatInteger,
  formatPercent,
  formatVariation,
} from './format';
import { formatDateTime } from './format';

// Intl usa espaço sem quebra (U+00A0) entre "R$" e o número.
const plain = (text: string) => text.replace(/ /g, ' ');

describe('formatação pt-BR', () => {
  it('moeda a partir de centavos', () => {
    expect(plain(formatCurrency(12345670))).toBe('R$ 123.456,70');
    expect(plain(formatCurrency(0))).toBe('R$ 0,00');
  });

  it('inteiros com separador de milhar', () => {
    expect(formatInteger(1234567)).toBe('1.234.567');
  });

  it('percentual com uma casa decimal', () => {
    expect(formatPercent(0.0345)).toBe('3,5%');
  });

  it('variação com sinal', () => {
    expect(formatVariation(0.1234)).toBe('+12,3%');
    expect(formatVariation(-0.0456)).toBe('-4,6%');
    expect(formatVariation(0)).toBe('0,0%');
  });

  it('data dd/mm/aaaa sem depender do fuso do servidor', () => {
    expect(formatDate('2026-09-01')).toBe('01/09/2026');
  });
});

describe('formatBucket', () => {
  it.each([
    ['2026-09-07', 'day', '07/09'],
    ['2026-09-07', 'week', 'sem. 07/09'],
    ['2026-09-01', 'month', 'set/26'],
    ['2027-01-01', 'month', 'jan/27'],
  ] as const)('%s (%s) → %s', (key, granularity, expected) => {
    expect(formatBucket(key, granularity)).toBe(expected);
  });
});

describe('formatCompactCurrency', () => {
  it('abrevia a partir de centavos', () => {
    expect(plain(formatCompactCurrency(12345_67))).toBe('R$ 12,3 mil');
    expect(plain(formatCompactCurrency(500_00))).toBe('R$ 500');
  });
});

describe('formatDateTime', () => {
  it('data e hora no fuso da loja (UTC−3)', () => {
    expect(formatDateTime('2026-09-03T02:59:00.000Z')).toBe('02/09/2026 23:59');
    expect(formatDateTime('2026-09-03T15:05:00.000Z')).toBe('03/09/2026 12:05');
  });
});

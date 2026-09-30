import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatInteger,
  formatPercent,
  formatVariation,
} from './format';

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

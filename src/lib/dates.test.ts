import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, isValidIsoDate, todayInStore } from './dates';

describe('todayInStore', () => {
  it('usa o fuso da loja (UTC-3): 01h UTC ainda é o dia anterior', () => {
    expect(todayInStore(new Date('2026-09-29T01:00:00Z'))).toBe('2026-09-28');
    expect(todayInStore(new Date('2026-09-29T03:00:00Z'))).toBe('2026-09-29');
  });
});

describe('isValidIsoDate', () => {
  it.each(['2026-09-29', '2024-02-29', '2026-12-31'])('aceita %s', (value) => {
    expect(isValidIsoDate(value)).toBe(true);
  });

  it.each(['2026-02-29', '2026-02-30', '2026-13-01', '2026-9-29', '29/09/2026', '', 'abc'])(
    'rejeita %s',
    (value) => {
      expect(isValidIsoDate(value)).toBe(false);
    },
  );
});

describe('addDays / daysBetween', () => {
  it('soma e subtrai dias atravessando meses e anos', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
  });

  it('conta o intervalo de forma inclusiva', () => {
    expect(daysBetween('2026-09-01', '2026-09-01')).toBe(1);
    expect(daysBetween('2026-09-01', '2026-09-30')).toBe(30);
  });
});

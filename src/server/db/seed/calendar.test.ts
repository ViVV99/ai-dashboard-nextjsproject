import { describe, expect, it } from 'vitest';
import { lastDays, localToUtcIso, randomTimestamp, seasonality } from './calendar';
import { createRandom } from './random';

describe('lastDays', () => {
  it('lista os dias terminando na data final, em ordem crescente', () => {
    expect(lastDays('2026-03-02', 3)).toEqual(['2026-02-28', '2026-03-01', '2026-03-02']);
  });

  it('rejeita datas inválidas', () => {
    expect(() => lastDays('2026-13-45', 1)).toThrow('Data inválida');
  });
});

describe('localToUtcIso', () => {
  it('converte o horário de São Paulo para UTC (+3h)', () => {
    expect(localToUtcIso('2026-09-28', 22 * 60)).toBe('2026-09-29T01:00:00.000Z');
  });
});

describe('randomTimestamp', () => {
  it('gera horários que pertencem ao dia local informado', () => {
    const random = createRandom(1);
    for (let i = 0; i < 200; i++) {
      const utc = Date.parse(randomTimestamp(random, '2026-09-28'));
      const local = new Date(utc - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
      expect(local).toBe('2026-09-28');
    }
  });
});

describe('seasonality', () => {
  it('aumenta o volume no fim de semana', () => {
    const saturday = seasonality('2026-09-26', 0, 1);
    const monday = seasonality('2026-09-28', 0, 1);

    expect(saturday).toBeGreaterThan(monday);
  });

  it('aumenta o volume em novembro e dezembro', () => {
    expect(seasonality('2026-11-25', 0, 1)).toBeGreaterThan(seasonality('2026-10-28', 0, 1));
  });
});

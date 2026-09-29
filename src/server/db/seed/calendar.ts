import type { Random } from './random';

// A loja opera em America/Sao_Paulo: UTC-3 fixo (sem horário de verão desde 2019).
const SAO_PAULO_OFFSET_MINUTES = 3 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Dia local da loja no formato YYYY-MM-DD. */
export type LocalDay = string;

function parseDay(day: LocalDay): number {
  const ms = Date.parse(`${day}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(ms)) {
    throw new Error(`Data inválida: ${day}`);
  }
  return ms;
}

/** Os `days` dias locais que terminam em `endDay` (inclusivo), em ordem crescente. */
export function lastDays(endDay: LocalDay, days: number): LocalDay[] {
  const end = parseDay(endDay);
  return Array.from({ length: days }, (_, i) =>
    new Date(end - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10),
  );
}

/** Converte um horário local da loja (dia + minutos desde 00:00) para ISO 8601 UTC. */
export function localToUtcIso(day: LocalDay, minuteOfDay: number): string {
  const ms = parseDay(day) + (SAO_PAULO_OFFSET_MINUTES + minuteOfDay) * 60_000;
  return new Date(ms).toISOString();
}

/** Horário aleatório dentro do dia local, concentrado entre 9h e 23h. */
export function randomTimestamp(random: Random, day: LocalDay): string {
  const hour = random.chance(0.9) ? random.int(9, 23) : random.int(0, 8);
  return localToUtcIso(day, hour * 60 + random.int(0, 59));
}

/** Multiplicador de volume: fim de semana ×1.3, nov/dez ×1.5, crescimento de 0.85 a 1.15. */
export function seasonality(day: LocalDay, index: number, total: number): number {
  const date = new Date(parseDay(day));
  const weekday = date.getUTCDay();
  const month = date.getUTCMonth() + 1;
  const weekend = weekday === 0 || weekday === 6 ? 1.3 : 1;
  const holidays = month === 11 || month === 12 ? 1.5 : 1;
  const growth = 0.85 + 0.3 * (index / Math.max(total - 1, 1));
  return weekend * holidays * growth;
}

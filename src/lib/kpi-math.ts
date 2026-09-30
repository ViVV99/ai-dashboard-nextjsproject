// Fórmulas das métricas. Divisão por zero e anterior 0 viram `null` (UI mostra "—").

export function ratio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

/** Variação relativa ao período anterior (0,2 = +20%). */
export function variation(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return (current - previous) / previous;
}

// PRNG determinístico (mulberry32): a mesma seed gera sempre os mesmos dados.

export type Random = {
  next: () => number;
  int: (min: number, max: number) => number;
  chance: (probability: number) => boolean;
  pick: <T>(items: readonly T[]) => T;
  weighted: <T>(entries: readonly (readonly [T, number])[]) => T;
  hex: (length: number) => string;
};

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRandom(seed: number): Random {
  const next = mulberry32(seed);
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));

  function pick<T>(items: readonly T[]): T {
    const item = items[int(0, items.length - 1)];
    if (item === undefined) throw new Error('pick: lista vazia');
    return item;
  }

  function weighted<T>(entries: readonly (readonly [T, number])[]): T {
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = next() * total;
    for (const [value, weight] of entries) {
      roll -= weight;
      if (weight > 0 && roll < 0) return value;
    }
    return pick(entries.filter(([, weight]) => weight > 0))[0];
  }

  const hex = (length: number) => Array.from({ length }, () => int(0, 15).toString(16)).join('');

  return { next, int, chance: (p) => next() < p, pick, weighted, hex };
}

// Rate limit de janela fixa, em memória. Exige instância única do servidor
// (ver .ai/decisions/0002-auth-e-perfis.md, item 8).

export type RateLimitResult = { allowed: boolean; retryAfterMs: number };

export type RateLimiter = {
  hit(key: string): RateLimitResult;
  reset(key: string): void;
  size(): number;
};

type RateLimiterOptions = { limit: number; windowMs: number; now?: () => number };
type Entry = { count: number; resetAt: number };

// Acima deste número de chaves, as expiradas são varridas antes de inserir uma nova.
const SWEEP_THRESHOLD = 1000;

export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: RateLimiterOptions): RateLimiter {
  const entries = new Map<string, Entry>();

  const sweep = (time: number) => {
    for (const [key, entry] of entries) if (entry.resetAt <= time) entries.delete(key);
  };

  return {
    hit(key) {
      const time = now();
      let entry = entries.get(key);
      if (!entry || entry.resetAt <= time) {
        if (entries.size >= SWEEP_THRESHOLD) sweep(time);
        entry = { count: 0, resetAt: time + windowMs };
        entries.set(key, entry);
      }
      entry.count += 1;
      const allowed = entry.count <= limit;
      return { allowed, retryAfterMs: allowed ? 0 : entry.resetAt - time };
    },
    reset: (key) => void entries.delete(key),
    size: () => entries.size,
  };
}

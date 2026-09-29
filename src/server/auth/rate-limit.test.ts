import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './rate-limit';

const WINDOW = 15 * 60 * 1000;

function setup(limit = 3) {
  let clock = 0;
  const limiter = createRateLimiter({ limit, windowMs: WINDOW, now: () => clock });
  return { limiter, advance: (ms: number) => (clock += ms) };
}

describe('createRateLimiter', () => {
  it('permite até limit hits na janela', () => {
    const { limiter } = setup();

    const results = [1, 2, 3].map(() => limiter.hit('k'));

    expect(results.every((r) => r.allowed)).toBe(true);
  });

  it('bloqueia o hit limit+1 e informa quanto falta', () => {
    const { limiter, advance } = setup();
    [1, 2, 3].forEach(() => limiter.hit('k'));
    advance(1000);

    expect(limiter.hit('k')).toEqual({ allowed: false, retryAfterMs: WINDOW - 1000 });
  });

  it('conta chaves de forma independente', () => {
    const { limiter } = setup(1);
    limiter.hit('a');

    expect(limiter.hit('b').allowed).toBe(true);
  });

  it('libera após windowMs', () => {
    const { limiter, advance } = setup();
    [1, 2, 3, 4].forEach(() => limiter.hit('k'));
    advance(WINDOW);

    expect(limiter.hit('k').allowed).toBe(true);
  });

  it('reset limpa a chave', () => {
    const { limiter } = setup(1);
    limiter.hit('k');
    limiter.reset('k');

    expect(limiter.hit('k').allowed).toBe(true);
  });

  it('remove chaves expiradas ao ultrapassar 1000 entradas', () => {
    const { limiter, advance } = setup();
    for (let i = 0; i < 1000; i++) limiter.hit(`old-${i}`);
    advance(WINDOW);
    limiter.hit('new');

    expect(limiter.size()).toBe(1);
  });

  it('com maxKeys chaves vivas, recusa chaves novas mas mantém as existentes', () => {
    const limiter = createRateLimiter({ limit: 5, windowMs: WINDOW, maxKeys: 2, now: () => 0 });
    limiter.hit('a');
    limiter.hit('b');

    expect(limiter.hit('c').allowed).toBe(false);
    expect(limiter.hit('a').allowed).toBe(true);
    expect(limiter.size()).toBe(2);
  });
});

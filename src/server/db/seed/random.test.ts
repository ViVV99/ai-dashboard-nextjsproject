import { describe, expect, it } from 'vitest';
import { createRandom } from './random';

describe('createRandom', () => {
  it('gera a mesma sequência para a mesma seed', () => {
    const a = createRandom(42);
    const b = createRandom(42);

    expect(Array.from({ length: 5 }, a.next)).toEqual(Array.from({ length: 5 }, b.next));
  });

  it('gera sequências diferentes para seeds diferentes', () => {
    expect(createRandom(1).next()).not.toBe(createRandom(2).next());
  });

  it('int respeita os limites inclusivos', () => {
    const random = createRandom(7);
    const values = Array.from({ length: 500 }, () => random.int(1, 3));

    expect(new Set(values)).toEqual(new Set([1, 2, 3]));
  });

  it('weighted nunca escolhe itens com peso zero', () => {
    const random = createRandom(3);
    const values = Array.from({ length: 200 }, () =>
      random.weighted([
        ['a', 1],
        ['b', 0],
      ] as const),
    );

    expect(values.every((v) => v === 'a')).toBe(true);
  });

  it('pick lança erro em lista vazia', () => {
    expect(() => createRandom(1).pick([])).toThrow('lista vazia');
  });

  it('hex gera string hexadecimal do tamanho pedido', () => {
    expect(createRandom(9).hex(12)).toMatch(/^[0-9a-f]{12}$/);
  });
});

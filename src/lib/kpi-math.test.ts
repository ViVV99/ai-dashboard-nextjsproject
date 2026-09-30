import { describe, expect, it } from 'vitest';
import { ratio, variation } from './kpi-math';

describe('ratio', () => {
  it('divide normalmente', () => {
    expect(ratio(10, 4)).toBe(2.5);
  });

  it('denominador 0 → null (a UI mostra "—")', () => {
    expect(ratio(10, 0)).toBeNull();
    expect(ratio(0, 0)).toBeNull();
  });
});

describe('variation', () => {
  it('variação relativa ao anterior', () => {
    expect(variation(120, 100)).toBeCloseTo(0.2);
    expect(variation(75, 100)).toBeCloseTo(-0.25);
  });

  it('atual 0 com anterior positivo → −100%', () => {
    expect(variation(0, 50)).toBe(-1);
  });

  it('anterior 0 → null (não ∞)', () => {
    expect(variation(10, 0)).toBeNull();
    expect(variation(0, 0)).toBeNull();
  });

  it('qualquer lado sem valor → null', () => {
    expect(variation(null, 10)).toBeNull();
    expect(variation(10, null)).toBeNull();
  });
});

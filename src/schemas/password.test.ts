import { describe, expect, it } from 'vitest';
import { passwordSchema } from './password';

describe('passwordSchema', () => {
  it.each([
    ['curta', 'abc123'],
    ['sem número', 'somenteletras'],
    ['sem letra', '1234567890'],
  ])('rejeita senha %s', (_, password) => {
    expect(passwordSchema.safeParse(password).success).toBe(false);
  });

  it('aceita senha com 8+ caracteres, letra e número', () => {
    expect(passwordSchema.safeParse('senhaForte1').success).toBe(true);
  });
});

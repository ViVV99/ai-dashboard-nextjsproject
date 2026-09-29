import { describe, expect, it } from 'vitest';
import { loginSchema, normalizeEmail } from './auth';

describe('normalizeEmail', () => {
  it('remove espaços e converte para minúsculas', () => {
    expect(normalizeEmail('  Admin@Exemplo.COM ')).toBe('admin@exemplo.com');
  });
});

describe('loginSchema', () => {
  it('normaliza o e-mail', () => {
    const parsed = loginSchema.parse({ email: ' Admin@Exemplo.com ', password: 'x' });

    expect(parsed.email).toBe('admin@exemplo.com');
  });

  it.each([
    ['e-mail inválido', { email: 'nao-e-email', password: 'senha1234' }],
    ['senha vazia', { email: 'a@b.com', password: '' }],
    ['e-mail com mais de 254 chars', { email: `${'a'.repeat(250)}@b.com`, password: 'x' }],
    ['senha com 129 chars', { email: 'a@b.com', password: 'a'.repeat(129) }],
  ])('rejeita %s', (_, input) => {
    expect(loginSchema.safeParse(input).success).toBe(false);
  });

  it('aceita senha com 128 chars', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'a'.repeat(128) }).success).toBe(
      true,
    );
  });
});

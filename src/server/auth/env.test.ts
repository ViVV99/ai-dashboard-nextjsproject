import { describe, expect, it } from 'vitest';
import { assertAuthEnv, MIN_SECRET_LENGTH } from './env';

const validSecret = 'a'.repeat(MIN_SECRET_LENGTH);

describe('assertAuthEnv', () => {
  it('AUTH_SECRET ausente → erro explicando como gerar', () => {
    expect(() => assertAuthEnv({})).toThrow(/AUTH_SECRET[\s\S]*openssl rand -base64 32/);
  });

  it('AUTH_SECRET vazio ou só espaços → erro', () => {
    expect(() => assertAuthEnv({ AUTH_SECRET: '' })).toThrow(/AUTH_SECRET/);
    expect(() => assertAuthEnv({ AUTH_SECRET: '   ' })).toThrow(/AUTH_SECRET/);
  });

  it('AUTH_SECRET curto demais → erro', () => {
    expect(() => assertAuthEnv({ AUTH_SECRET: validSecret.slice(1) })).toThrow(/AUTH_SECRET/);
  });

  it('AUTH_SECRET com tamanho mínimo → ok', () => {
    expect(() => assertAuthEnv({ AUTH_SECRET: validSecret })).not.toThrow();
  });

  it('a mensagem nunca expõe o valor do segredo', () => {
    const secret = 'segredo-curto';
    expect(() => assertAuthEnv({ AUTH_SECRET: secret })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining(secret) }),
    );
  });
});

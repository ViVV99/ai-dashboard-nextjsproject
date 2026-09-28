import { describe, expect, it } from 'vitest';
import { parseSeedEnv } from './env';

const ADMIN = { SEED_ADMIN_EMAIL: 'admin@loja.com', SEED_ADMIN_PASSWORD: 'senhaForte1' };
// 2026-09-29 02:00 UTC = 2026-09-28 23:00 em São Paulo.
const NOW = new Date('2026-09-29T02:00:00Z');

describe('parseSeedEnv', () => {
  it('aplica os valores padrão', () => {
    expect(parseSeedEnv(ADMIN, NOW)).toEqual({
      databaseUrl: './data/app.db',
      seed: 20260928,
      endDay: '2026-09-28',
      days: 365,
      admin: { name: 'Administrador', email: 'admin@loja.com', password: 'senhaForte1' },
      viewerPassword: undefined,
    });
  });

  it('usa o dia local de São Paulo como data final padrão', () => {
    expect(parseSeedEnv(ADMIN, NOW).endDay).toBe('2026-09-28');
  });

  it('lê os valores informados', () => {
    const env = parseSeedEnv(
      {
        ...ADMIN,
        DATABASE_URL: '/tmp/x.db',
        SEED_RANDOM_SEED: '7',
        SEED_END_DATE: '2026-01-31',
        SEED_DAYS: '30',
        SEED_VIEWER_PASSWORD: 'viewer123',
      },
      NOW,
    );

    expect(env).toMatchObject({
      databaseUrl: '/tmp/x.db',
      seed: 7,
      endDay: '2026-01-31',
      days: 30,
    });
    expect(env.viewerPassword).toBe('viewer123');
  });

  it('trata variáveis vazias (KEY= copiado do .env.example) como ausentes', () => {
    const env = parseSeedEnv(
      {
        ...ADMIN,
        SEED_VIEWER_PASSWORD: '',
        SEED_END_DATE: '',
        SEED_RANDOM_SEED: '',
        SEED_DAYS: '',
      },
      NOW,
    );

    expect(env).toMatchObject({ seed: 20260928, endDay: '2026-09-28', days: 365 });
    expect(env.viewerPassword).toBeUndefined();
  });

  it('falha citando a variável quando o e-mail do admin falta', () => {
    expect(() => parseSeedEnv({ SEED_ADMIN_PASSWORD: 'senhaForte1' }, NOW)).toThrow(
      /SEED_ADMIN_EMAIL/,
    );
  });

  it('falha citando a variável quando a senha do admin é fraca', () => {
    expect(() => parseSeedEnv({ ...ADMIN, SEED_ADMIN_PASSWORD: 'fraca' }, NOW)).toThrow(
      /SEED_ADMIN_PASSWORD/,
    );
  });

  it('nunca inclui a senha na mensagem de erro', () => {
    expect(() => parseSeedEnv({ ...ADMIN, SEED_ADMIN_PASSWORD: 'fraca' }, NOW)).not.toThrow(
      /fraca/,
    );
  });

  it('rejeita data final inválida', () => {
    expect(() => parseSeedEnv({ ...ADMIN, SEED_END_DATE: '28/09/2026' }, NOW)).toThrow(
      /SEED_END_DATE/,
    );
  });
});

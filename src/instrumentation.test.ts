import { afterEach, describe, expect, it, vi } from 'vitest';
import { register } from './instrumentation';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('register', () => {
  it('runtime Node sem AUTH_SECRET → impede a subida do servidor', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('AUTH_SECRET', '');

    await expect(register()).rejects.toThrow(/AUTH_SECRET/);
  });

  it('runtime Node com AUTH_SECRET válido → ok', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('AUTH_SECRET', 'x'.repeat(44));

    await expect(register()).resolves.toBeUndefined();
  });

  it('fora do runtime Node não valida', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    vi.stubEnv('AUTH_SECRET', '');

    await expect(register()).resolves.toBeUndefined();
  });
});

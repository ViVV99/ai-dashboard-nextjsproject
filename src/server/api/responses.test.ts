import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthError } from '../auth/errors';
import { errorResponse, jsonResponse, toErrorResponse } from './responses';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('jsonResponse', () => {
  it('responde JSON 200 sem cache', async () => {
    const response = jsonResponse({ ok: true });

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ ok: true });
  });
});

describe('errorResponse', () => {
  it('usa o formato { error: { code, message } } e acrescenta details quando há', async () => {
    const response = errorResponse(400, 'invalid_request', 'Parâmetros inválidos.', [
      { field: 'to', message: 'x' },
    ]);

    expect(response.status).toBe(400);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      error: {
        code: 'invalid_request',
        message: 'Parâmetros inválidos.',
        details: [{ field: 'to', message: 'x' }],
      },
    });
  });
});

describe('toErrorResponse', () => {
  it.each([
    ['unauthorized', 401],
    ['forbidden', 403],
  ] as const)('AuthError %s → %i', async (code, status) => {
    const response = toErrorResponse(new AuthError(code));

    expect(response.status).toBe(status);
    expect((await response.json()).error.code).toBe(code);
  });

  it('erro inesperado vira 500 genérico, sem a mensagem interna, e vai para o log', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = toErrorResponse(new Error('SQLITE_CORRUPT: /data/app.db'));

    expect(response.status).toBe(500);
    const body = JSON.stringify(await response.json());
    expect(body).toContain('internal_error');
    expect(body).not.toContain('SQLITE');
    expect(log).toHaveBeenCalled();
  });
});

import { redirect } from 'next/navigation';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AuthError } from '../auth/errors';
import { UserRuleError } from '../services/users/errors';
import {
  errorResponse,
  InvalidRequestError,
  jsonResponse,
  toErrorResponse,
  zodDetails,
} from './responses';

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

describe('toErrorResponse — F9', () => {
  it.each([
    ['not_found', 404],
    ['email_taken', 409],
    ['admin_target', 422],
  ] as const)('UserRuleError %s → %i com o código', async (code, status) => {
    const response = toErrorResponse(new UserRuleError(code));

    expect(response.status).toBe(status);
    expect((await response.json()).error.code).toBe(code);
  });

  it('InvalidRequestError → 400 invalid_request com details', async () => {
    const response = toErrorResponse(
      new InvalidRequestError([{ field: 'name', message: 'curto' }]),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: 'invalid_request',
        message: 'Parâmetros inválidos.',
        details: [{ field: 'name', message: 'curto' }],
      },
    });
  });

  it('não engole o controle de fluxo do Next (redirect/notFound)', () => {
    let control: unknown;
    try {
      redirect('/login');
    } catch (error) {
      control = error;
    }

    expect(() => toErrorResponse(control)).toThrow();
  });
});

describe('zodDetails', () => {
  it('usa o caminho completo do campo e _root para erros do objeto', () => {
    const schema = z
      .object({ a: z.object({ b: z.string() }) })
      .refine(() => false, { message: 'raiz' });

    expect(zodDetails(schema.safeParse({ a: { b: 1 } }).error!)).toEqual([
      { field: 'a.b', message: expect.any(String) },
    ]);
    expect(zodDetails(schema.safeParse({ a: { b: 'x' } }).error!)).toEqual([
      { field: '_root', message: 'raiz' },
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import { AuthError, authErrorResponse } from './errors';

describe('authErrorResponse', () => {
  it.each([
    ['unauthorized', 401],
    ['forbidden', 403],
  ] as const)('%s → %i com corpo padronizado', async (code, status) => {
    const response = authErrorResponse(new AuthError(code));

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({
      error: { code, message: expect.any(String) },
    });
  });
});

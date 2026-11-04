import { describe, expect, it } from 'vitest';
import { UserRuleError } from './errors';

describe('UserRuleError', () => {
  it.each([
    ['not_found', 404],
    ['email_taken', 409],
    ['admin_target', 422],
    ['self_action', 422],
    ['wrong_password', 422],
  ] as const)('%s → %i com mensagem em pt-BR', (code, status) => {
    const error = new UserRuleError(code);

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(status);
    expect(error.code).toBe(code);
    expect(error.message).toMatch(/[a-zà-ú]/);
  });
});

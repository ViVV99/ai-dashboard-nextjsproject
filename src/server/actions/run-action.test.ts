import { redirect } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AuthError } from '../auth/errors';
import { UserRuleError } from '../services/users/errors';
import { runAction } from './run-action';

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath }));

const schema = z.object({ name: z.string().min(2) });

beforeEach(() => {
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('runAction', () => {
  it('valida, executa, revalida os caminhos e devolve ok', async () => {
    const task = vi.fn(async () => {});

    await expect(runAction(schema, { name: 'Bia' }, task, ['/a', '/b'])).resolves.toEqual({
      ok: true,
    });
    expect(task).toHaveBeenCalledWith({ name: 'Bia' });
    expect(revalidatePath).toHaveBeenCalledWith('/a');
    expect(revalidatePath).toHaveBeenCalledWith('/b');
  });

  it('entrada inválida não executa nem revalida', async () => {
    const task = vi.fn();

    await expect(runAction(schema, { name: 'B' }, task, ['/a'])).resolves.toEqual({
      ok: false,
      error: 'Revise os campos destacados.',
      fieldErrors: { name: expect.any(String) },
    });
    expect(task).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it.each([
    ['email_taken', 'email'],
    ['wrong_password', 'currentPassword'],
    ['admin_target', undefined],
  ] as const)('UserRuleError %s → mensagem no campo %s', async (code, field) => {
    const result = await runAction(
      schema,
      { name: 'Bia' },
      async () => {
        throw new UserRuleError(code);
      },
      [],
    );

    expect(result).toEqual({
      ok: false,
      error: new UserRuleError(code).message,
      ...(field && { fieldErrors: { [field]: new UserRuleError(code).message } }),
    });
  });

  it('AuthError (viewer chamando action de admin) → mensagem, sem lançar', async () => {
    const result = await runAction(
      schema,
      { name: 'Bia' },
      async () => {
        throw new AuthError('forbidden');
      },
      ['/a'],
    );

    expect(result).toEqual({ ok: false, error: new AuthError('forbidden').message });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('erro inesperado → mensagem genérica e log', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await runAction(
      schema,
      { name: 'Bia' },
      async () => {
        throw new Error('SQLITE_BUSY');
      },
      [],
    );

    expect(result).toEqual({ ok: false, error: 'Não foi possível concluir. Tente novamente.' });
    expect(log).toHaveBeenCalled();
  });

  it('relança o controle de fluxo do Next', async () => {
    await expect(
      runAction(schema, { name: 'Bia' }, async () => redirect('/login'), []),
    ).rejects.toThrow();
  });
});

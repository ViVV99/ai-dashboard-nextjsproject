import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import type { z } from 'zod';
import { AuthError } from '../auth/errors';
import { UserRuleError, type UserRuleCode } from '../services/users/errors';

// Núcleo das Server Actions de usuários e perfil: valida, executa, revalida e converte
// erros em mensagem para o formulário (nunca lança para o client, exceto controle do Next).

export type ActionResult =
  { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Erros de regra que pertencem a um campo do formulário. */
const FIELD_OF: Partial<Record<UserRuleCode, string>> = {
  email_taken: 'email',
  wrong_password: 'currentPassword',
};

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) fields[issue.path.join('.')] ??= issue.message;
  return fields;
}

function toActionError(error: unknown): ActionResult {
  unstable_rethrow(error);
  if (error instanceof UserRuleError) {
    const field = FIELD_OF[error.code];
    return {
      ok: false,
      error: error.message,
      ...(field && { fieldErrors: { [field]: error.message } }),
    };
  }
  if (error instanceof AuthError) return { ok: false, error: error.message };
  console.error('[action] erro inesperado', error);
  return { ok: false, error: 'Não foi possível concluir. Tente novamente.' };
}

export async function runAction<S extends z.ZodType>(
  schema: S,
  input: unknown,
  task: (data: z.output<S>) => Promise<unknown>,
  paths: string[],
): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revise os campos destacados.',
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }
  try {
    await task(parsed.data);
  } catch (error) {
    return toActionError(error);
  }
  for (const path of paths) revalidatePath(path);
  return { ok: true };
}

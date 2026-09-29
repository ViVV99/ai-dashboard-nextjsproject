'use server';

import { CredentialsSignin } from 'next-auth';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import { signIn, signOut } from '@/server/auth/config';
import { safeCallbackUrl } from './callback-url';
import { LOGIN_ERROR_MESSAGE, RATE_LIMIT_MESSAGE } from './messages';

export type LoginActionResult = { error: string } | undefined;

/** Autentica e redireciona para `callbackUrl` (só caminhos internos). */
export async function loginAction(
  input: LoginInput,
  callbackUrl?: string,
): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: LOGIN_ERROR_MESSAGE };

  try {
    await signIn('credentials', { ...parsed.data, redirectTo: safeCallbackUrl(callbackUrl) });
  } catch (error) {
    // Em sucesso, signIn lança o redirect do Next, que precisa ser repassado.
    if (!(error instanceof CredentialsSignin)) throw error;
    return { error: error.code === 'rate_limited' ? RATE_LIMIT_MESSAGE : LOGIN_ERROR_MESSAGE };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/login' });
}

'use server';

import { CredentialsSignin } from 'next-auth';
import { redirect } from 'next/navigation';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import { signIn, signOut } from '@/server/auth/config';
import { safeCallbackUrl } from './callback-url';
import { LOGIN_ERROR_MESSAGE, LOGIN_UNAVAILABLE_MESSAGE, RATE_LIMIT_MESSAGE } from './messages';

export type LoginActionResult = { error: string } | undefined;

// Quando o Auth.js falha por configuração (ex.: AUTH_SECRET ausente), o signIn devolve
// a própria URL interna de /api/auth/* em vez do callbackUrl.
const isAuthApiUrl = (url: string) =>
  new URL(url, 'http://local').pathname.startsWith('/api/auth/');

/** Autentica e redireciona para `callbackUrl` (só caminhos internos). */
export async function loginAction(
  input: LoginInput,
  callbackUrl?: string,
): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: LOGIN_ERROR_MESSAGE };

  const target = safeCallbackUrl(callbackUrl);
  let responseUrl: string;
  try {
    responseUrl = await signIn('credentials', {
      ...parsed.data,
      redirectTo: target,
      redirect: false,
    });
  } catch (error) {
    if (!(error instanceof CredentialsSignin)) throw error;
    return { error: error.code === 'rate_limited' ? RATE_LIMIT_MESSAGE : LOGIN_ERROR_MESSAGE };
  }

  if (isAuthApiUrl(responseUrl)) {
    console.error('[auth] signIn não concluiu; verifique a configuração (AUTH_SECRET).');
    return { error: LOGIN_UNAVAILABLE_MESSAGE };
  }
  redirect(target);
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/login' });
}

import { hash, verify } from '@node-rs/argon2';
import type { ChangePasswordInput, ProfileNameInput } from '@/schemas/users';
import { requireUser } from '../../auth';
import { signIn } from '../../auth/config';
import { createRateLimiter } from '../../auth/rate-limit';
import { getDb } from '../../db';
import { changeOwnPassword, updateOwnName } from './profile';

// Fachada do perfil: exige sessão antes de abrir o banco.

// Tentativas da senha atual por usuário (memória do processo, como o rate limit do login).
const passwordAttempts = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 });

export async function updateProfile(input: ProfileNameInput): Promise<{ name: string }> {
  const user = await requireUser();
  return updateOwnName(getDb(), user, input);
}

/**
 * Troca a própria senha. O `session_version` novo derruba todas as sessões; a atual é
 * renovada com um login usando a senha nova (o usuário acabou de prová-la). Nunca aceitamos
 * `sessionVersion` vinda do cliente: um token revogado poderia se reativar.
 */
export async function changePassword(
  input: ChangePasswordInput,
): Promise<{ renewed: boolean; sessionVersion: number }> {
  const user = await requireUser();
  const { sessionVersion } = await changeOwnPassword(
    getDb(),
    user,
    input,
    verify,
    (password) => hash(password),
    passwordAttempts,
  );
  try {
    await signIn('credentials', {
      email: user.email,
      password: input.newPassword,
      redirect: false,
    });
    return { renewed: true, sessionVersion };
  } catch (error) {
    // Ex.: rate limit do login. A senha já mudou; o usuário só precisa entrar de novo.
    console.warn('[profile] sessão não renovada após troca de senha', error);
    return { renewed: false, sessionVersion };
  }
}

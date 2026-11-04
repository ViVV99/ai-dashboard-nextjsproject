import { hash, verify } from '@node-rs/argon2';
import type { ChangePasswordInput, ProfileNameInput } from '@/schemas/users';
import { requireUser } from '../../auth';
import { signIn } from '../../auth/config';
import { getDb } from '../../db';
import { changeOwnPassword, updateOwnName } from './profile';

// Fachada do perfil: exige sessão antes de abrir o banco.

export async function updateProfile(input: ProfileNameInput): Promise<{ name: string }> {
  const user = await requireUser();
  return updateOwnName(getDb(), user, input);
}

/**
 * Troca a própria senha. O `session_version` novo derruba todas as sessões; a atual é
 * renovada com um login usando a senha nova (o usuário acabou de prová-la). Nunca aceitamos
 * `sessionVersion` vinda do cliente: um token revogado poderia se reativar.
 */
export async function changePassword(input: ChangePasswordInput): Promise<{ renewed: boolean }> {
  const user = await requireUser();
  await changeOwnPassword(getDb(), user, input, verify, (password) => hash(password));
  try {
    await signIn('credentials', {
      email: user.email,
      password: input.newPassword,
      redirect: false,
    });
    return { renewed: true };
  } catch (error) {
    // Ex.: rate limit do login. A senha já mudou; o usuário só precisa entrar de novo.
    console.warn('[profile] sessão não renovada após troca de senha', error);
    return { renewed: false };
  }
}

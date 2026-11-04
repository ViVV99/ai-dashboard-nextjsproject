'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { changePasswordSchema, profileNameSchema } from '@/schemas/users';
import { runAction, type ActionResult } from '@/server/actions/run-action';
import { changePassword, updateProfile } from '@/server/services/profile';

// Server Actions do próprio perfil (fachada exige sessão).

export async function updateNameAction(input: unknown): Promise<ActionResult> {
  return runAction(
    profileNameSchema,
    input,
    async (data) => {
      await updateProfile(data);
      revalidatePath('/', 'layout'); // o nome aparece na barra superior de todas as páginas
    },
    [],
  );
}

/**
 * As outras sessões caem. Sucesso sempre termina em redirect: o cookie renovado só vale no
 * próximo request (re-renderizar na resposta da action usaria o cookie antigo e cairia no
 * login). Sem renovação (ex.: rate limit), o usuário entra de novo.
 */
export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  return runAction(
    changePasswordSchema,
    input,
    async (data) => {
      const { renewed, sessionVersion } = await changePassword(data);
      // `v` muda a cada troca: a página remonta o formulário (limpo, com o aviso).
      redirect(renewed ? `/perfil?senha=alterada&v=${sessionVersion}` : '/login');
    },
    [],
  );
}

'use server';

import { z } from 'zod';
import { createUserSchema, resetPasswordSchema, updateUserSchema } from '@/schemas/users';
import { runAction, type ActionResult } from '@/server/actions/run-action';
import {
  blockUser,
  createUser,
  resetUserPassword,
  unblockUser,
  updateUser,
} from '@/server/services/users';

// Server Actions da gestão de usuários. São endpoints públicos: tudo é validado aqui e a
// fachada exige admin (viewer recebe a mensagem de 403, sem efeito no banco).

const PATHS = ['/admin/usuarios', '/admin/auditoria'];
const withId = { id: z.number().int().positive() };

export async function createUserAction(input: unknown): Promise<ActionResult> {
  return runAction(createUserSchema, input, (data) => createUser(data), PATHS);
}

export async function updateUserAction(input: unknown): Promise<ActionResult> {
  return runAction(
    updateUserSchema.extend(withId),
    input,
    ({ id, name, email }) => updateUser(id, { name, email }),
    PATHS,
  );
}

const statusSchema = z.object({ ...withId, status: z.enum(['active', 'blocked']) });

export async function setUserStatusAction(input: unknown): Promise<ActionResult> {
  return runAction(
    statusSchema,
    input,
    ({ id, status }) => (status === 'blocked' ? blockUser(id) : unblockUser(id)),
    PATHS,
  );
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  return runAction(
    resetPasswordSchema.extend(withId),
    input,
    ({ id, password }) => resetUserPassword(id, password),
    PATHS,
  );
}

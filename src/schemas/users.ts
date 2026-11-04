import { z } from 'zod';
import { USER_STATUSES } from '@/types/domain';
import { passwordSchema } from './password';

// Schemas de usuários e perfil, compartilhados por formulários, actions e API REST.
// Regras em .ai/domains/usuarios-e-perfis.md.

const nameSchema = z
  .string()
  .trim()
  .min(2, 'O nome precisa ter pelo menos 2 caracteres.')
  .max(100, 'O nome pode ter no máximo 100 caracteres.');

// Mesma normalização do login (trim + minúsculas): o e-mail é único já normalizado.
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Informe um e-mail válido.')
  .pipe(z.email('Informe um e-mail válido.'));

export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

/** Admin edita só nome e e-mail do viewer (perfil e status têm ações próprias). */
export const updateUserSchema = z.object({ name: nameSchema, email: emailSchema });
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({ password: passwordSchema });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const profileNameSchema = z.object({ name: nameSchema });
export type ProfileNameInput = z.infer<typeof profileNameSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.').max(128, 'Senha muito longa.'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.confirmPassword === value.newPassword, {
    path: ['confirmPassword'],
    message: 'A confirmação não confere com a nova senha.',
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    path: ['newPassword'],
    message: 'A nova senha precisa ser diferente da atual.',
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const USER_STATUS_FILTERS = ['all', ...USER_STATUSES] as const;

/** Filtros da lista (query da página e da API). */
export const userListQuerySchema = z.object({
  q: z.string().trim().max(100, 'Busca muito longa.').default(''),
  status: z.enum(USER_STATUS_FILTERS).default('all'),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});
export type UserListQuery = z.infer<typeof userListQuerySchema>;

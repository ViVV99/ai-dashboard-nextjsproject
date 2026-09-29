import { z } from 'zod';

/** E-mail é único e normalizado (trim + minúsculas). Ver .ai/domains/usuarios-e-perfis.md. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

// No login não se aplica a regra de força da senha (mensagem sempre genérica);
// o limite de 128 caracteres evita gastar argon2 com entradas gigantes.
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, 'Informe um e-mail válido.')
    .pipe(z.email('Informe um e-mail válido.')),
  password: z.string().min(1, 'Informe a senha.').max(128, 'Senha muito longa.'),
});

export type LoginInput = z.infer<typeof loginSchema>;

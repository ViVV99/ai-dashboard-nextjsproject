import { z } from 'zod';

// Regra de senha compartilhada por client e server (ver .ai/domains/usuarios-e-perfis.md).
export const passwordSchema = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(128, 'A senha pode ter no máximo 128 caracteres.')
  .regex(/[A-Za-z]/, 'A senha precisa ter pelo menos uma letra.')
  .regex(/\d/, 'A senha precisa ter pelo menos um número.');

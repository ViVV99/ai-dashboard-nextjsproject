import { z } from 'zod';

// Regra de senha compartilhada por client e server (ver .ai/domains/usuarios-e-perfis.md).
export const passwordSchema = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .regex(/[A-Za-z]/, 'A senha precisa ter pelo menos uma letra.')
  .regex(/\d/, 'A senha precisa ter pelo menos um número.');

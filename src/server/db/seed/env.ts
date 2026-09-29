import { z } from 'zod';
import { todayInStore } from '../../../lib/dates';
import { passwordSchema } from '../../../schemas/password';
import type { LocalDay } from './calendar';

// Variáveis de ambiente do seed. Documentadas em .env.example.

export type SeedEnv = {
  databaseUrl: string;
  seed: number;
  endDay: LocalDay;
  days: number;
  admin: { name: string; email: string; password: string };
  viewerPassword: string | undefined;
};

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default('./data/app.db'),
  SEED_ADMIN_EMAIL: z.email('informe um e-mail válido'),
  SEED_ADMIN_PASSWORD: passwordSchema,
  SEED_ADMIN_NAME: z.string().min(2).max(100).default('Administrador'),
  SEED_VIEWER_PASSWORD: passwordSchema.optional(),
  SEED_RANDOM_SEED: z.coerce.number().int().default(20260928),
  SEED_END_DATE: z.iso.date('use o formato YYYY-MM-DD').optional(),
  SEED_DAYS: z.coerce.number().int().min(1).max(730).default(365),
});

/** Lê e valida o ambiente. O erro cita as variáveis, nunca os valores (evita vazar senhas). */
export function parseSeedEnv(
  env: Record<string, string | undefined>,
  now: Date = new Date(),
): SeedEnv {
  // `KEY=` (vazio, como no .env.example) conta como ausente e recebe o padrão.
  const defined = Object.fromEntries(Object.entries(env).filter(([, value]) => value !== ''));
  const result = envSchema.safeParse(defined);
  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Variáveis de ambiente inválidas para o seed:\n- ${problems.join('\n- ')}`);
  }

  const data = result.data;
  return {
    databaseUrl: data.DATABASE_URL,
    seed: data.SEED_RANDOM_SEED,
    endDay: data.SEED_END_DATE ?? todayInStore(now),
    days: data.SEED_DAYS,
    admin: {
      name: data.SEED_ADMIN_NAME,
      email: data.SEED_ADMIN_EMAIL,
      password: data.SEED_ADMIN_PASSWORD,
    },
    viewerPassword: data.SEED_VIEWER_PASSWORD,
  };
}

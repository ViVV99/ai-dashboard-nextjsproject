import { createDatabase, migrateDatabase } from '../client';
import { parseSeedEnv } from '../seed/env';
import { seedDatabase } from '../seed/seed';

// Uso: yarn db:seed. APAGA e recria todos os dados do banco em DATABASE_URL.
async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed bloqueado com NODE_ENV=production: ele apaga todos os dados.');
  }

  // Valida o ambiente antes de abrir o banco: env inválida não escreve nada.
  const env = parseSeedEnv(process.env);
  const db = createDatabase(env.databaseUrl);
  try {
    migrateDatabase(db);
    const summary = await seedDatabase(db, env);
    console.log(`Seed concluído em ${env.databaseUrl} (${env.days} dias até ${env.endDay}):`);
    console.table(summary);
  } finally {
    db.$client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

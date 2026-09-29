import { createDatabase, migrateDatabase } from '../client';

// Uso: yarn db:migrate (aplica as migrations de ./drizzle em DATABASE_URL).
const url = process.env.DATABASE_URL ?? './data/app.db';
const db = createDatabase(url);

migrateDatabase(db);
db.$client.close();
console.log(`Migrations aplicadas em ${url}`);

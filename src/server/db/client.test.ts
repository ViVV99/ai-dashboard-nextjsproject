import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createDatabase, migrateDatabase } from './client';

const dirs: string[] = [];
afterEach(() => {
  dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true }));
});

function fileDatabase() {
  const dir = mkdtempSync(path.join(tmpdir(), 'app-db-'));
  dirs.push(dir);
  return createDatabase(path.join(dir, 'app.db'));
}

describe('createDatabase', () => {
  it('liga FKs e WAL em arquivo', () => {
    const db = fileDatabase();

    expect(db.$client.pragma('foreign_keys', { simple: true })).toBe(1);
    expect(db.$client.pragma('journal_mode', { simple: true })).toBe('wal');
  });

  // Regressão de desempenho (F4): com o cache padrão (~2 MB) o SQLite relê as páginas do
  // disco a cada consulta; agregações de 1 ano sobre page_views levavam ~2 s.
  it('usa cache de páginas de 64 MB', () => {
    expect(fileDatabase().$client.pragma('cache_size', { simple: true })).toBe(-65536);
  });
});

describe('índices de page_views', () => {
  // Cobre o filtro por período e a contagem de visitantes únicos sem ler a tabela.
  it('filtra por período com índice de cobertura (created_at, session_id)', () => {
    const db = createDatabase(':memory:');
    migrateDatabase(db);
    const plan = db.$client
      .prepare(
        `explain query plan select count(distinct session_id) from page_views
         where created_at >= ? and created_at < ?`,
      )
      .all('2026-01-01', '2026-02-01') as { detail: string }[];

    expect(plan.map((row) => row.detail).join(' ')).toContain(
      'USING COVERING INDEX page_views_created_at_session_idx',
    );
  });
});

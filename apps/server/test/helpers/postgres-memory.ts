import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { schema } from '@~/db/database-schema';

const testPostgresDbKey = Symbol.for('startername.test.postgres.db');
const testPostgresReadyKey = Symbol.for('startername.test.postgres.ready');

type TestPostgresDatabase = PgliteDatabase<typeof schema> & { $client: PGlite };
type TestPostgresGlobals = typeof globalThis & {
  [testPostgresDbKey]?: TestPostgresDatabase;
  [testPostgresReadyKey]?: Promise<void>;
};

const testGlobals = globalThis as TestPostgresGlobals;

async function applyPostgresMigrations(client: PGlite, migrationsFolder: string) {
  const migrationFiles = (await readdir(migrationsFolder))
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

  for (const migrationFile of migrationFiles) {
    const migrationSql = await readFile(path.join(migrationsFolder, migrationFile), 'utf8');
    const statements = migrationSql
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);

    for (const statement of statements) {
      await client.exec(statement);
    }
  }
}

async function createTestPostgresDb() {
  const client = await PGlite.create('memory://');
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  await applyPostgresMigrations(client, path.resolve(currentDir, '../../src/db/migrations'));
  testGlobals[testPostgresDbKey] = drizzle({ client, schema });
}

export async function initializeTestPostgres() {
  if (testGlobals[testPostgresDbKey]) return;

  testGlobals[testPostgresReadyKey] ??= createTestPostgresDb();
  await testGlobals[testPostgresReadyKey];
}

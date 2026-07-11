import { getTableName, sql } from 'drizzle-orm';
import 'reflect-metadata';
import { afterEach } from 'vitest';

import { PostgresService } from '@~/db/postgres.service';
import { schema } from '@~/db/schema';
import { container } from '@~/di';

import './matchers';
import { initializeTestPostgres } from './postgres-memory';

type SchemaValue = (typeof schema)[keyof typeof schema];
type SchemaTable = Extract<SchemaValue, { getSQL: unknown }>;

const isDrizzleTable = (value: SchemaValue): value is SchemaTable =>
  typeof value === 'object' && value !== null && 'getSQL' in value;

await initializeTestPostgres();

const postgresTableNames = Object.values(schema)
  .filter(isDrizzleTable)
  .map((table) => getTableName(table))
  .map((tableName) => `"${tableName}"`)
  .join(', ');

afterEach(async () => {
  await container
    .resolve(PostgresService)
    .getDb()
    .execute(sql.raw(`TRUNCATE TABLE ${postgresTableNames} RESTART IDENTITY CASCADE`));
});

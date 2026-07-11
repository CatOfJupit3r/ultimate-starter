import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

switch (process.env.NODE_ENV) {
  case 'test':
  case 'production':
    break;
  case undefined:
  case 'development':
    config({ path: '.development.env', quiet: true });
    break;
  default:
    break;
}

export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL ?? 'postgresql://postgres:postgres@localhost:5432/startername',
  },
});

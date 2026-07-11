import { container } from 'tsyringe';

import { PostgresService } from '@~/db/postgres.service';

export default async function databaseLoader() {
  container.resolve(PostgresService).connect();
}

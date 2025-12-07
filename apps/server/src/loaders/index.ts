import { registerServices, resolve } from '@~/di';
import { TOKENS } from '@~/di/tokens';

import achievementsLoader from './achievements.loader';
import authLoader from './auth.loader';
import databaseLoader from './database.loader';
import honoLoader from './hono.loader';

export default async function loaders() {
  console.log('Registering DI services...');
  await registerServices();
  const logger = resolve(TOKENS.LoggerFactory).global();
  logger.info('DI services registered.');

  logger.info('Loading database...');
  const db = await databaseLoader();
  logger.info('Database loaded.');
  logger.info('Loading authentication...');
  const instance = await authLoader(db);
  logger.info('Authentication loaded.');

  logger.info('Loading achievements...');
  await achievementsLoader();
  logger.info('Achievements loaded.');

  logger.info('Loading Hono framework...');
  const { app, appRouter } = await honoLoader();
  logger.info('Hono framework loaded.');

  logger.info('All loaders completed.');
  return { app, auth: instance, appRouter };
}

import achievementsLoader from './achievements.loader';
import authLoader from './auth.loader';
import databaseLoader from './database.loader';
import honoLoader from './hono.loader';

export default async function loaders() {
  console.log('Starting loaders...');

  console.log('Loading database...');
  const db = await databaseLoader();
  console.log('Database loaded.');

  console.log('Loading authentication...');
  const instance = await authLoader(db);
  console.log('Authentication loaded.');

  console.log('Loading achievements...');
  await achievementsLoader();
  console.log('Achievements loaded.');

  console.log('Loading Hono framework...');
  const { app, appRouter } = await honoLoader(instance);
  console.log('Hono framework loaded.');

  console.log('All loaders completed.');

  return { app, auth: instance, appRouter };
}

// sort-imports-ignore
import 'reflect-metadata';
import env from './constants/env';
import loaders from './loaders';

if (process.env.NODE_ENV === 'test') {
  throw new Error('Server should not be started in test environment');
}

const { app } = await loaders();

export default {
  fetch: app.fetch,
  port: env.SERVER_PORT,
  hostname: env.SERVER_HOST,
};

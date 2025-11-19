// sort-imports-ignore
import loaders from '../../src/loaders';

if (process.env.NODE_ENV !== 'test') {
  throw new Error('Tests should be run in test environment');
}

const { app, appRouter, auth } = await loaders();

export { app, appRouter, auth };

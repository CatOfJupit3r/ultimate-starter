import { AsyncLocalStorage } from 'node:async_hooks';

import type { iRequestContext } from './logger.types';

/**
 * AsyncLocalStorage instance for request-scoped context.
 * This enables automatic propagation of userId and other request metadata
 * to all loggers within a request's async execution context.
 * @deprecated Use Hono's context storage instead.
 */
export const requestContextStorage = new AsyncLocalStorage<iRequestContext>();

/**
 * Get the current request context from AsyncLocalStorage.
 * Returns undefined if called outside of a request context.
 * @deprecated Use Hono's context storage instead.
 */
export function getRequestContext(): iRequestContext | undefined {
  return requestContextStorage.getStore();
}

/**
 * Run a function within a request context.
 * All code executed within the callback will have access to the context.
 *
 * @example
 * runWithRequestContext({ userId: 'user123' }, async () => {
 *   // All loggers called here will automatically include userId
 *   logger.info('Processing request');
 * });
 * @deprecated Use Hono's context storage instead.
 */
export function runWithRequestContext<T>(context: iRequestContext, fn: () => T): T {
  return requestContextStorage.run(context, fn);
}

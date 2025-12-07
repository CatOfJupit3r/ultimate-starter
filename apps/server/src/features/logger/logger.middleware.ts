import type { MiddlewareHandler } from 'hono';
import { randomUUID } from 'node:crypto';

import { resolve } from '@~/di';
import { TOKENS } from '@~/di/tokens';

import type { iRequestContext } from './logger.types';

/**
 * Hono middleware that wraps each request in a request context.
 * This enables automatic propagation of userId and requestId to all loggers
 * within the request's async execution flow.
 *
 * Must be placed after authentication middleware to have access to the session.
 *
 * @example
 * app.use(requestContextMiddleware);
 */
export const requestContextMiddleware: MiddlewareHandler<iRequestContext> = async (c, next) => {
  const auth = resolve(TOKENS.AuthService).getInstance();

  // Get the session - this may already be resolved by earlier middleware
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  const context: iRequestContext['Variables'] = {
    userId: session?.user?.id,
    requestId: randomUUID(),
  };

  c.set('requestId', context.requestId);
  c.set('userId', context.userId);
  c.set('session', session);

  return next();
};

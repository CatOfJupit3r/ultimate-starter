import { ORPCError, implement } from '@orpc/server';

import { CONTRACT } from '@startername/server-contract/app.contract';

import { rethrowUnexpectedError } from '@~/lib/orpc-error-wrapper';
import type { Context } from '@~/loaders/hono.loader';

export const base = implement(CONTRACT)
  .$config({
    initialOutputValidationIndex: Number.NaN,
  })
  .$context<Context>();

const unexpectedErrorBoundary = base.middleware(async ({ path, next }) => {
  try {
    return await next();
  } catch (error) {
    return rethrowUnexpectedError(error, { operation: path.join('.') });
  }
});

export const publicProcedure = base.use(unexpectedErrorBoundary);

const requireAuth = base.middleware(async ({ context, next }) => {
  if (!context.session) {
    throw new ORPCError('UNAUTHORIZED', { message: 'User is not authenticated' });
  }
  return next({
    context: {
      ...context,
      session: context.session,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins';
import { onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { ZodToJsonSchemaConverter } from '@orpc/zod';
import type { betterAuth } from 'better-auth';
import { Hono } from 'hono';
import type { Context as HonoContext } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import env from '@~/constants/env';
import { appRouter } from '@~/routers';
import nonContractRouter from '@~/routers/non-contract.router';

interface iCreateContextOptions {
  context: HonoContext;
}

function contextGenerator(auth: ReturnType<typeof betterAuth>) {
  return async function createContext({ context }: iCreateContextOptions) {
    const session = await auth.api.getSession({
      headers: context.req.raw.headers,
    });
    return {
      session,
    };
  };
}

export type Context = Awaited<ReturnType<ReturnType<typeof contextGenerator>>>;

export default async function honoLoader(auth: ReturnType<typeof betterAuth>) {
  const app = new Hono();

  const createContext = contextGenerator(auth);

  app.use(logger());
  app.use(
    '/*',
    cors({
      origin: env.CORS_ORIGIN,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }),
  );

  app.on(['POST', 'GET'], '/auth/*', async (c) => auth.handler(c.req.raw));

  app.route('/', nonContractRouter);

  const apiHandler = new OpenAPIHandler(appRouter, {
    plugins: [
      new OpenAPIReferencePlugin({
        schemaConverters: [new ZodToJsonSchemaConverter()],
      }),
    ],
    interceptors: [
      onError((error) => {
        console.error(error);
      }),
    ],
  });

  const rpcHandler = new RPCHandler(appRouter, {
    interceptors: [
      onError((error) => {
        console.error(error);
      }),
    ],
  });

  app.use('/*', async (c, next) => {
    const context = await createContext({ context: c });

    const apiResult = await apiHandler.handle(c.req.raw, {
      context,
    });

    if (apiResult.matched) {
      return c.newResponse(apiResult.response.body, apiResult.response);
    }

    const rpcResult = await rpcHandler.handle(c.req.raw, {
      prefix: '/rpc',
      context,
    });

    if (rpcResult.matched) {
      return c.newResponse(rpcResult.response.body, rpcResult.response);
    }

    return next();
  });

  app.get('/', (c) => c.text('OK'));

  return { app, appRouter };
}

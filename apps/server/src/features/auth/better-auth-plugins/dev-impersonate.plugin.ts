import type { BetterAuthPlugin } from 'better-auth';
import { createAuthEndpoint, APIError } from 'better-auth/api';
import { z } from 'zod';

/**
 * Auth helper utilities extracted from Better Auth internals
 * for use in custom plugins and endpoints.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get a date object offset by the specified duration
 */
export const getDate = (seconds: number, unit: 'sec' | 'ms' = 'sec') => {
  const multiplier = unit === 'sec' ? 1000 : 1;
  return new Date(Date.now() + seconds * multiplier);
};

/**
 * Delete session cookies from the response
 */
export const deleteSessionCookie = (ctx: any) => {
  ctx.setCookie(ctx.context.authCookies.sessionToken.name, '', {
    ...ctx.context.authCookies.sessionToken.options,
    maxAge: 0,
  });
  ctx.setCookie(ctx.context.authCookies.sessionData.name, '', {
    ...ctx.context.authCookies.sessionData.options,
    maxAge: 0,
  });
  ctx.setCookie(ctx.context.authCookies.dontRememberToken.name, '', {
    ...ctx.context.authCookies.dontRememberToken.options,
    maxAge: 0,
  });
};

/**
 * Set session cookies in the response
 */
export const setSessionCookie = async (
  ctx: any,
  payload: {
    session: any;
    user: any;
  },
  dontRememberMe = false,
) => {
  const { authCookies, secret, sessionConfig } = ctx.context;
  const maxAge = dontRememberMe ? undefined : sessionConfig.expiresIn;

  await ctx.setSignedCookie(authCookies.sessionToken.name, payload.session.token, secret, {
    ...authCookies.sessionToken.options,
    maxAge,
  });

  if (dontRememberMe) {
    await ctx.setSignedCookie(
      authCookies.dontRememberToken.name,
      'true',
      secret,
      authCookies.dontRememberToken.options,
    );
  }

  ctx.context.setNewSession(payload);

  if (ctx.context.options.secondaryStorage && ctx.context.secondaryStorage) {
    const ttl = Math.floor((new Date(payload.session.expiresAt).getTime() - Date.now()) / 1000);
    if (ttl > 0) {
      await ctx.context.secondaryStorage.set(
        payload.session.token,
        JSON.stringify({ session: payload.session, user: payload.user }),
        ttl,
      );
    }
  }
};

/**
 * Dev Impersonation Plugin
 *
 * Provides user impersonation capability for development environments.
 * Similar to admin impersonation but bypasses permission checks when NODE_ENV !== 'production'.
 */
export const devImpersonatePlugin = () =>
  ({
    id: 'dev-impersonate',
    endpoints: {
      /**
       * ### Endpoint
       *
       * POST `/dev/impersonate-user`
       *
       * ### API Methods
       *
       * **server:**
       * `auth.api.devImpersonateUser`
       *
       * **client:**
       * `authClient.dev.impersonateUser`
       */
      devImpersonateUser: createAuthEndpoint(
        '/dev/impersonate-user',
        {
          method: 'POST',
          body: z.object({
            userId: z.string().min(1).describe('The user id to impersonate'),
          }),
          metadata: {
            openapi: {
              operationId: 'devImpersonateUser',
              summary: 'Impersonate a user (dev only)',
              description: 'Create an impersonation session for development purposes',
              responses: {
                200: {
                  description: 'Impersonation session created',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          session: {
                            $ref: '#/components/schemas/Session',
                          },
                          user: {
                            $ref: '#/components/schemas/User',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        async (ctx) => {
          // Only allow in non-production environments
          if (process.env.NODE_ENV === 'production') {
            throw new APIError('FORBIDDEN', {
              message: 'Dev impersonation is not allowed in production',
            });
          }

          const targetUser = await ctx.context.internalAdapter.findUserById(ctx.body.userId);

          if (!targetUser) {
            throw new APIError('NOT_FOUND', {
              message: 'User not found',
            });
          }

          // Create impersonation session (1 hour expiry)
          const session = await ctx.context.internalAdapter.createSession(targetUser.id, false, {
            expiresAt: getDate(60 * 60, 'sec'), // 1 hour
          });

          if (!session) {
            throw new APIError('INTERNAL_SERVER_ERROR', {
              message: 'Failed to create impersonation session',
            });
          }

          const { authCookies } = ctx.context;

          // Clear existing session cookies
          deleteSessionCookie(ctx);

          // Check for existing "don't remember me" cookie
          const dontRememberMeCookie = await ctx.getSignedCookie(
            authCookies.dontRememberToken.name,
            ctx.context.secret,
          );

          // Store original session if one exists
          if (ctx.context.session?.session) {
            const devSessionCookie = ctx.context.createAuthCookie('dev_original_session');
            await ctx.setSignedCookie(
              devSessionCookie.name,
              `${ctx.context.session.session.token}:${dontRememberMeCookie ?? ''}`,
              ctx.context.secret,
              authCookies.sessionToken.options,
            );
          }

          // Set the impersonation session
          await setSessionCookie(
            ctx,
            {
              session,
              user: targetUser,
            },
            true, // Don't remember (session cookie)
          );

          return ctx.json({
            session,
            user: targetUser,
          });
        },
      ),
    },
  }) satisfies BetterAuthPlugin;

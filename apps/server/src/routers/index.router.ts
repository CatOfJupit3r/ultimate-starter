import { container } from '@~/di/container';
import { AUTH_USER_REPOSITORY_TOKEN } from '@~/di/tokens';
import type { iAuthUserRepository } from '@~/features/auth/auth-user.repository';
import { base, publicProcedure } from '@~/lib/orpc';

export const indexRouter = base.index.router({
  healthCheck: publicProcedure.index.healthCheck.handler(async () => ({ status: 'OK' })),

  metrics: publicProcedure.index.metrics.handler(async () => {
    const now = new Date();
    const authUserRepository = container.resolve<iAuthUserRepository>(AUTH_USER_REPOSITORY_TOKEN);

    const [totalUsers, activeSessions] = await Promise.all([
      authUserRepository.countUsers(),
      authUserRepository.countActiveSessions(now),
    ]);

    return {
      totalUsers,
      activeSessions,
    };
  }),
});

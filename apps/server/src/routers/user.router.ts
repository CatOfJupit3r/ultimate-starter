import { protectedProcedure, base, publicProcedure } from '../lib/orpc';
import { GETTERS } from './di-getter';

export const userRouter = base.user.router({
  getUserProfile: protectedProcedure.user.getUserProfile.handler(async ({ context }) => {
    const userId = context.session.user.id;
    return GETTERS.UserService().getUserProfile(userId);
  }),

  updateUserProfile: protectedProcedure.user.updateUserProfile.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    return GETTERS.UserService().updateUserProfile(userId, input.bio);
  }),

  updateUserBadge: protectedProcedure.user.updateUserBadge.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { badgeId } = input;
    return GETTERS.UserService().updateUserBadge(userId, badgeId);
  }),

  regeneratePublicCode: protectedProcedure.user.regeneratePublicCode.handler(async ({ context }) => {
    const userId = context.session.user.id;
    return GETTERS.UserService().regeneratePublicCode(userId);
  }),

  devToolsListAllUsers: publicProcedure.user.devToolsListAllUsers.handler(async () =>
    GETTERS.UserService().listAllUsers(),
  ),
});

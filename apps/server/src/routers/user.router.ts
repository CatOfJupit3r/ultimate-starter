import { errorCodes } from '@startername/shared';

import { BADGES_META } from '@~/constants/badges';
import { generatePublicCode } from '@~/db/helpers';
import { User } from '@~/db/models/auth.model';
import { UserAchievementModel } from '@~/db/models/user-achievements.model';
import {
  ORPCBadRequestError,
  ORPCForbiddenError,
  ORPCInternalServerError,
  ORPCNotFoundError,
} from '@~/lib/orpc-error-wrapper';

import { UserProfileModel } from '../db/models/user-profile.model';
import { protectedProcedure, base, publicProcedure } from '../lib/orpc';

export const userRouter = base.user.router({
  getUserProfile: protectedProcedure.user.getUserProfile.handler(async ({ context }) => {
    const userId = context.session.user.id;
    const userProfile = await UserProfileModel.findOne({ userId });
    if (!userProfile) throw ORPCNotFoundError(errorCodes.USER_PROFILE_NOT_FOUND);
    return userProfile;
  }),

  updateUserProfile: protectedProcedure.user.updateUserProfile.handler(async ({ context, input }) => {
    const userId = context.session.user.id;

    try {
      const updatedProfile = await UserProfileModel.findOneAndUpdate(
        { userId },
        { bio: input.bio },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );

      if (!updatedProfile) {
        throw ORPCInternalServerError();
      }

      return updatedProfile;
    } catch (error) {
      if (error instanceof Error && error.name !== 'ORPCError') {
        throw ORPCInternalServerError();
      }
      throw error;
    }
  }),

  updateUserBadge: protectedProcedure.user.updateUserBadge.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { badgeId } = input;

    const badgeMeta = BADGES_META.find((b) => b.id === badgeId);
    if (!badgeMeta) {
      throw ORPCBadRequestError(errorCodes.BADGE_NOT_FOUND);
    }

    if (badgeMeta.requiresAchievement) {
      const hasAchievement = await UserAchievementModel.findOne({
        userId,
        achievementId: badgeMeta.requiresAchievement,
      });

      if (!hasAchievement) {
        throw ORPCForbiddenError(errorCodes.USER_BADGE_NOT_ALLOWED);
      }
    }

    try {
      const updatedProfile = await UserProfileModel.findOneAndUpdate(
        { userId },
        { selectedBadge: badgeId },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );

      if (!updatedProfile) {
        throw ORPCInternalServerError();
      }

      return updatedProfile;
    } catch (error) {
      if (error instanceof Error && error.name !== 'ORPCError') {
        throw ORPCInternalServerError();
      }
      throw error;
    }
  }),

  regeneratePublicCode: protectedProcedure.user.regeneratePublicCode.handler(async ({ context }) => {
    const userId = context.session.user.id;

    const maxAttempts = 10;

    const tryGenerateCode = async (attemptNumber: number): Promise<typeof UserProfileModel.prototype> => {
      if (attemptNumber >= maxAttempts) {
        throw ORPCInternalServerError(errorCodes.PUBLIC_CODE_GENERATION_FAILED);
      }

      const newPublicCode = generatePublicCode();

      try {
        const updatedProfile = await UserProfileModel.findOneAndUpdate(
          { userId },
          { publicCode: newPublicCode },
          { new: true, upsert: true, setDefaultsOnInsert: true },
        );

        if (!updatedProfile) {
          throw ORPCInternalServerError();
        }

        return updatedProfile;
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
          return tryGenerateCode(attemptNumber + 1);
        }

        if (error instanceof Error && error.name !== 'ORPCError') {
          throw ORPCInternalServerError();
        }

        throw error;
      }
    };

    return tryGenerateCode(0);
  }),

  devToolsListAllUsers: publicProcedure.user.devToolsListAllUsers.handler(async () => {
    const users = await User.find({}, { _id: 1, name: 1 });
    return users.map(({ _id, name }) => ({ _id: _id.toString(), name }));
  }),
});

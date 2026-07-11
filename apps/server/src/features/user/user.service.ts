import { inject, injectable } from 'tsyringe';

import type { BadgeId } from '@startername/shared/constants/badges';
import { errorCodes } from '@startername/shared/enums/errors.enums';

import { generatePublicCode } from '@~/db/helpers';
import {
  AUTH_USER_REPOSITORY_TOKEN,
  USER_ACHIEVEMENT_REPOSITORY_TOKEN,
  USER_PROFILE_REPOSITORY_TOKEN,
} from '@~/di/tokens';
import type { iUserAchievementRepository } from '@~/features/achievements/user-achievement.repository';
import type { iAuthUserRepository } from '@~/features/auth/auth-user.repository';
import { BADGES_META } from '@~/features/badges/badges.constants';
import {
  ORPCBadRequestError,
  ORPCForbiddenError,
  ORPCInternalServerError,
  ORPCNotFoundError,
} from '@~/lib/orpc-error-wrapper';

import type { iUserProfileRepository } from './user-profile.repository';

@injectable()
export class UserService {
  constructor(
    @inject(USER_ACHIEVEMENT_REPOSITORY_TOKEN)
    private readonly userAchievementRepository: iUserAchievementRepository,
    @inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: iAuthUserRepository,
    @inject(USER_PROFILE_REPOSITORY_TOKEN)
    private readonly userProfileRepository: iUserProfileRepository,
  ) {}

  public async getUserProfile(userId: string) {
    const profile = await this.userProfileRepository.findByUserId(userId);
    if (!profile) throw ORPCNotFoundError(errorCodes.USER_PROFILE_NOT_FOUND);
    return profile;
  }

  public async updateUserProfile(userId: string, bio: string) {
    return this.userProfileRepository.upsert(userId, { bio });
  }

  public async updateUserBadge(userId: string, badgeId: BadgeId) {
    const badgeMeta = BADGES_META.find((badge) => badge.id === badgeId);
    if (!badgeMeta) throw ORPCBadRequestError(errorCodes.BADGE_NOT_FOUND);

    if (badgeMeta.requiresAchievement) {
      const hasAchievement = await this.userAchievementRepository.findByAchievement(
        userId,
        badgeMeta.requiresAchievement,
      );
      if (!hasAchievement) throw ORPCForbiddenError(errorCodes.USER_BADGE_NOT_ALLOWED);
    }

    return this.userProfileRepository.upsert(userId, { selectedBadge: badgeId });
  }

  public async regeneratePublicCode(userId: string) {
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        return await this.userProfileRepository.upsert(userId, { publicCode: generatePublicCode() });
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === '23505') {
          continue;
        }
        throw ORPCInternalServerError();
      }
    }

    throw ORPCInternalServerError(errorCodes.PUBLIC_CODE_GENERATION_FAILED);
  }

  public async listAllUsers() {
    return this.authUserRepository.listUsers();
  }
}

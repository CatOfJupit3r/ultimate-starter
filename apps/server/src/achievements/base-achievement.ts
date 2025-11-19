import type { UserAchievementId } from '@startername/shared/constants/achievements';

import type { iEventPayloadMap, EventType } from '@~/enums/events.enums';

export interface iAchievementContext {
  unlock: <T extends UserAchievementId>(
    userId: string,
    achievementId: T,
    data?: Record<string, unknown>,
  ) => Promise<unknown>;
}

export interface iAchievementDefinition<T extends EventType = EventType> {
  id: UserAchievementId;
  listensTo: T[];
  handle: (payload: iEventPayloadMap[T], context: iAchievementContext) => Promise<unknown>;
}

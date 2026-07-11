import { Enumwaii } from '@startername/enumwaii/enumwaii';
import type { InferEnumwaii } from '@startername/enumwaii/enumwaii';

const errorCodesEnumwaii = new Enumwaii('ErrorCode', [
  'USER_NOT_FOUND',
  'USER_PROFILE_NOT_FOUND',
  'USER_BADGE_NOT_ALLOWED',
  'USER_INVALID_PUBLIC_CODE',
  'USER_PUBLIC_CODE_GENERATION_FAILED',
  'BADGE_NOT_FOUND',
  'UNAUTHORIZED',
  'INTERNAL_SERVER_ERROR',
  'VALKEY_CLIENT_NOT_CONNECTED',
  'AUTH_SERVICE_NOT_INITIALIZED',
  'USER_PROFILE_UPSERT_FAILED',
  'USER_BADGE_UPDATE_FAILED',
  'USER_ACHIEVEMENT_UPSERT_FAILED',
  'DEV_IMPERSONATION_NOT_ALLOWED',
  'IMPERSONATION_SESSION_CREATION_FAILED',
]);

export const errorCodes = errorCodesEnumwaii.enum;
export type ErrorCodesType = InferEnumwaii<typeof errorCodesEnumwaii>;

export const errorMessages = errorCodesEnumwaii.derive({
  [errorCodes.USER_NOT_FOUND]: 'User not found',
  [errorCodes.USER_PROFILE_NOT_FOUND]: 'User profile not found',
  [errorCodes.USER_BADGE_NOT_ALLOWED]: 'You do not have the required achievement to use this badge',
  [errorCodes.USER_INVALID_PUBLIC_CODE]: 'Invalid public code',
  [errorCodes.USER_PUBLIC_CODE_GENERATION_FAILED]: 'Failed to generate unique public code',
  [errorCodes.BADGE_NOT_FOUND]: 'Badge not found',
  [errorCodes.UNAUTHORIZED]: 'User is not authenticated',
  [errorCodes.INTERNAL_SERVER_ERROR]: 'An unexpected server error occurred',
  [errorCodes.VALKEY_CLIENT_NOT_CONNECTED]: 'Valkey client is not connected',
  [errorCodes.AUTH_SERVICE_NOT_INITIALIZED]: 'AuthService not initialized. Call connect() first.',
  [errorCodes.USER_PROFILE_UPSERT_FAILED]: 'User profile upsert returned no document',
  [errorCodes.USER_BADGE_UPDATE_FAILED]: 'User badge update returned no document',
  [errorCodes.USER_ACHIEVEMENT_UPSERT_FAILED]: 'User achievement upsert returned no row',
  [errorCodes.DEV_IMPERSONATION_NOT_ALLOWED]: 'Dev impersonation is not allowed in production',
  [errorCodes.IMPERSONATION_SESSION_CREATION_FAILED]: 'Failed to create impersonation session',
});

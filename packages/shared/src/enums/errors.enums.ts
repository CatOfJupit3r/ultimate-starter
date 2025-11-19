const userErrorCodes = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_PROFILE_NOT_FOUND: 'USER_PROFILE_NOT_FOUND',
  USER_BADGE_NOT_ALLOWED: 'USER_BADGE_NOT_ALLOWED',
  BADGE_NOT_FOUND: 'BADGE_NOT_FOUND',
  INVALID_PUBLIC_CODE: 'INVALID_PUBLIC_CODE',
  PUBLIC_CODE_GENERATION_FAILED: 'PUBLIC_CODE_GENERATION_FAILED',
} as const;

const userErrorMessages = {
  [userErrorCodes.USER_NOT_FOUND]: 'User not found',
  [userErrorCodes.USER_PROFILE_NOT_FOUND]: 'User profile not found',
  [userErrorCodes.USER_BADGE_NOT_ALLOWED]: 'You do not have the required achievement to use this badge',
  [userErrorCodes.BADGE_NOT_FOUND]: 'Badge not found',
  [userErrorCodes.INVALID_PUBLIC_CODE]: 'Invalid public code',
  [userErrorCodes.PUBLIC_CODE_GENERATION_FAILED]: 'Failed to generate unique public code',
};

export const errorCodes = {
  ...userErrorCodes,
};

export type ErrorCodesType = (typeof errorCodes)[keyof typeof errorCodes];

export const errorMessages: Record<ErrorCodesType, string> = {
  ...userErrorMessages,
};

const validateErrorCodesWithoutMessages = () => {
  if (Object.keys(errorCodes).length !== Object.keys(errorMessages).length) {
    const errorCodesWithoutMessages = Object.keys(errorCodes).filter((code) => !errorMessages[code as ErrorCodesType]);
    throw new Error(`Error codes without messages found: ${errorCodesWithoutMessages.join(', ')}`);
  }
};

validateErrorCodesWithoutMessages();

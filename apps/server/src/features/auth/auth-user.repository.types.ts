import type { accounts, users } from '@~/db/schema';

type UserRow = typeof users.$inferSelect;
type AccountRow = typeof accounts.$inferSelect;

export type iAuthUserRecordResponse = Omit<UserRow, 'username' | 'displayUsername' | 'image'> & {
  image?: string;
};

type OptionalAuthAccountRecordFields =
  | 'accessToken'
  | 'refreshToken'
  | 'idToken'
  | 'accessTokenExpiresAt'
  | 'refreshTokenExpiresAt'
  | 'scope'
  | 'password';

export type iAuthAccountRecordResponse = Omit<AccountRow, OptionalAuthAccountRecordFields> & {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  scope?: string;
  password?: string;
};

export type iAuthUserListItemResponse = Pick<iAuthUserRecordResponse, 'id' | 'name'>;

export const AUTH_ACCOUNT_PROVIDER_IDS = {
  CREDENTIAL: 'credential',
} as const;

export type AuthAccountProviderId = (typeof AUTH_ACCOUNT_PROVIDER_IDS)[keyof typeof AUTH_ACCOUNT_PROVIDER_IDS];

export interface iAuthUserRecordResponse {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface iAuthAccountRecordResponse {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  scope?: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface iAuthUserListItemResponse {
  id: string;
  name: string;
}

export const AUTH_ACCOUNT_PROVIDER_IDS = {
  CREDENTIAL: 'credential',
} as const;

export type AuthAccountProviderId = (typeof AUTH_ACCOUNT_PROVIDER_IDS)[keyof typeof AUTH_ACCOUNT_PROVIDER_IDS];
export type AuthUserRecordResponse = iAuthUserRecordResponse;
export type AuthAccountRecordResponse = iAuthAccountRecordResponse;
export type AuthUserListItemResponse = iAuthUserListItemResponse;

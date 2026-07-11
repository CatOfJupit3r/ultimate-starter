import type {
  AuthAccountProviderId,
  AuthAccountRecordResponse,
  AuthUserListItemResponse,
  AuthUserRecordResponse,
} from './auth-user.repository.types';

export interface iAuthUserRepository {
  findUserById: (userId: string) => Promise<AuthUserRecordResponse | null>;
  findUserByEmail: (email: string) => Promise<AuthUserRecordResponse | null>;
  listUsers: () => Promise<AuthUserListItemResponse[]>;
  countUsers: () => Promise<number>;
  countActiveSessions: (now: Date) => Promise<number>;
  findAccountByUserIdAndProviderId: (
    userId: string,
    providerId: AuthAccountProviderId,
  ) => Promise<AuthAccountRecordResponse | null>;
  findAccountByAccountIdAndProviderId: (
    accountId: string,
    providerId: AuthAccountProviderId,
  ) => Promise<AuthAccountRecordResponse | null>;
  updateAccountAccountId: (accountRecordId: string, accountId: string) => Promise<AuthAccountRecordResponse | null>;
  deleteUsersByEmail: (email: string) => Promise<number>;
  deleteAccountsByAccountId: (accountId: string) => Promise<number>;
}

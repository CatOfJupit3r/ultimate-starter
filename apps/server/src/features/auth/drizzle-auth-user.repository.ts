import { and, count as countFn, eq, gt } from 'drizzle-orm';
import { singleton } from 'tsyringe';

import { PostgresService } from '@~/db/postgres.service';
import { accounts, sessions, users } from '@~/db/schema';

import type { iAuthUserRepository } from './auth-user.repository';
import type {
  AuthAccountProviderId,
  AuthAccountRecordResponse,
  AuthUserListItemResponse,
  AuthUserRecordResponse,
} from './auth-user.repository.types';

type UserRow = typeof users.$inferSelect;
type AccountRow = typeof accounts.$inferSelect;

function toAuthUserRecordResponse(user: UserRow): AuthUserRecordResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image ?? undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toAuthAccountRecordResponse(account: AccountRow): AuthAccountRecordResponse {
  return {
    id: account.id,
    accountId: account.accountId,
    providerId: account.providerId,
    userId: account.userId,
    accessToken: account.accessToken ?? undefined,
    refreshToken: account.refreshToken ?? undefined,
    idToken: account.idToken ?? undefined,
    accessTokenExpiresAt: account.accessTokenExpiresAt ?? undefined,
    refreshTokenExpiresAt: account.refreshTokenExpiresAt ?? undefined,
    scope: account.scope ?? undefined,
    password: account.password ?? undefined,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

@singleton()
export class DrizzleAuthUserRepository implements iAuthUserRepository {
  constructor(private readonly postgresService: PostgresService) {}

  public async findUserById(userId: string): Promise<AuthUserRecordResponse | null> {
    const [user] = await this.postgresService.getDb().select().from(users).where(eq(users.id, userId)).limit(1);
    return user ? toAuthUserRecordResponse(user) : null;
  }

  public async findUserByEmail(email: string): Promise<AuthUserRecordResponse | null> {
    const [user] = await this.postgresService.getDb().select().from(users).where(eq(users.email, email)).limit(1);
    return user ? toAuthUserRecordResponse(user) : null;
  }

  public async listUsers(): Promise<AuthUserListItemResponse[]> {
    return this.postgresService.getDb().select({ id: users.id, name: users.name }).from(users);
  }

  public async countUsers(): Promise<number> {
    const [result] = await this.postgresService.getDb().select({ count: countFn() }).from(users);
    return Number(result?.count ?? 0);
  }

  public async countActiveSessions(now: Date): Promise<number> {
    const [result] = await this.postgresService
      .getDb()
      .select({ count: countFn() })
      .from(sessions)
      .where(gt(sessions.expiresAt, now));
    return Number(result?.count ?? 0);
  }

  public async findAccountByUserIdAndProviderId(
    userId: string,
    providerId: AuthAccountProviderId,
  ): Promise<AuthAccountRecordResponse | null> {
    const [account] = await this.postgresService
      .getDb()
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.providerId, providerId)))
      .limit(1);
    return account ? toAuthAccountRecordResponse(account) : null;
  }

  public async findAccountByAccountIdAndProviderId(
    accountId: string,
    providerId: AuthAccountProviderId,
  ): Promise<AuthAccountRecordResponse | null> {
    const [account] = await this.postgresService
      .getDb()
      .select()
      .from(accounts)
      .where(and(eq(accounts.accountId, accountId), eq(accounts.providerId, providerId)))
      .limit(1);
    return account ? toAuthAccountRecordResponse(account) : null;
  }

  public async updateAccountAccountId(
    accountRecordId: string,
    accountId: string,
  ): Promise<AuthAccountRecordResponse | null> {
    const [account] = await this.postgresService
      .getDb()
      .update(accounts)
      .set({ accountId, updatedAt: new Date() })
      .where(eq(accounts.id, accountRecordId))
      .returning();
    return account ? toAuthAccountRecordResponse(account) : null;
  }

  public async deleteUsersByEmail(email: string): Promise<number> {
    const rows = await this.postgresService
      .getDb()
      .delete(users)
      .where(eq(users.email, email))
      .returning({ id: users.id });
    return rows.length;
  }

  public async deleteAccountsByAccountId(accountId: string): Promise<number> {
    const rows = await this.postgresService
      .getDb()
      .delete(accounts)
      .where(eq(accounts.accountId, accountId))
      .returning({ id: accounts.id });
    return rows.length;
  }
}

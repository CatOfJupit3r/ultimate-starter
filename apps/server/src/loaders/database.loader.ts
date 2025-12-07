import type mongoose from 'mongoose';

import { resolve } from '@~/di';
import { TOKENS } from '@~/di/tokens';

export default async function databaseLoader(): Promise<mongoose.mongo.Db> {
  const databaseService = resolve(TOKENS.DatabaseService);
  await databaseService.connect();

  return databaseService.getClient();
}

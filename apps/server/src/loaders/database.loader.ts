import type mongoose from 'mongoose';

import databaseService from '@~/services/database.service';

export default async function databaseLoader(): Promise<mongoose.mongo.Db> {
  await databaseService.connect();

  return databaseService.getClient();
}

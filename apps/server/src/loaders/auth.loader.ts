import type { mongoose } from '@typegoose/typegoose';

import authService from '@~/services/auth.service';

export default async function authLoader(db: mongoose.mongo.Db) {
  authService.connect(db);

  return authService.getInstance();
}

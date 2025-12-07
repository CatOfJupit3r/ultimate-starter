import type { mongoose } from '@typegoose/typegoose';

import { resolve } from '@~/di';
import { TOKENS } from '@~/di/tokens';

export default async function authLoader(db: mongoose.mongo.Db) {
  const authService = resolve(TOKENS.AuthService);
  const valkeyService = resolve(TOKENS.ValkeyService);
  const valkey = await valkeyService.connect();

  authService.connect(db, valkey);

  return authService.getInstance();
}

import { container } from 'tsyringe';

import { AuthService } from '@~/features/auth/auth.service';
import { ValkeyService } from '@~/features/valkey/valkey.service';

export default async function authLoader() {
  const authService = container.resolve(AuthService);
  const valkeyService = container.resolve(ValkeyService);
  const valkey = await valkeyService.connect();

  authService.connect(valkey);

  return authService.getInstance();
}

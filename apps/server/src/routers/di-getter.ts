import { resolve } from '@~/di';
import { TOKENS } from '@~/di/tokens';
import type { iTokenRegistry, InjectionTokens } from '@~/di/tokens';

// Auto-generate GETTERS from TOKENS to eliminate manual maintenance
// When a new service is added to TOKENS, it will automatically be available in GETTERS
// This ensures type safety and reduces the risk of forgetting to add a getter
type GettersMap = {
  [K in keyof InjectionTokens]: () => iTokenRegistry[InjectionTokens[K]];
};

// Create GETTERS dynamically from TOKENS using Object.fromEntries
export const GETTERS = Object.fromEntries(
  Object.keys(TOKENS).map((key) => {
    const tokenKey = key as keyof InjectionTokens;
    return [tokenKey, () => resolve(TOKENS[tokenKey])];
  }),
) as GettersMap;

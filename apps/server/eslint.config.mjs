import { createBackendConfig } from '@ultimate-starter/eslint-config';

export default createBackendConfig({
  rootDir: import.meta.url,
  additionalIgnores: ['vitest.config.ts'],
});

import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/helpers/setup.ts'],
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', 'test', '**/*.test.ts', '**/*.config.ts'],
    },
    // Increase timeout for MongoDB tests
    testTimeout: 10000,
    hookTimeout: 10000,
    // Run tests sequentially with a single worker to share MongoDB instance
    // This significantly speeds up test startup by avoiding multiple MongoMemoryServer instances
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    // Isolate each test file to prevent state leakage
    isolate: true,
  },
  resolve: {
    alias: {
      '@~': path.resolve(__dirname, './src'),
    },
  },
  // Use Vite's cacheDir for caching
  cacheDir: 'node_modules/.vitest',
});

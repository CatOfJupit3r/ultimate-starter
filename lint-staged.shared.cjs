/**
 * Shared lint-staged configuration for ultimate-starter monorepo
 * 
 * This configuration runs linting and formatting on staged files before commit.
 * It's optimized for a monorepo structure with TypeScript/JavaScript files.
 */

module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    // Type check only staged files (requires all files to be checked)
    () => 'pnpm run check-types',
  ],
  
  '*.{js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  '*.{json,yaml,yml,md}': [
    'prettier --write',
  ],
};

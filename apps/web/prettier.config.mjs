import baseConfig from '@ultimate-starter/prettier-config';

/** @type {import("prettier").Config} */
const config = {
  ...baseConfig,
  plugins: ['@trivago/prettier-plugin-sort-imports', 'prettier-plugin-classnames', 'prettier-plugin-tailwindcss'],
};

export default config;

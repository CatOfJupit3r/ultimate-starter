import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/**/*.ts',
  outDir: 'dist',
  sourcemap: true,
  dts: true,
});

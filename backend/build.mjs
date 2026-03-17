import { build } from 'esbuild';

await build({
  entryPoints: ['backend/src/functions/api/handler.ts'],
  outfile: 'backend/dist/functions/api/handler.js',
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  sourcesContent: false,
  logLevel: 'info',
});

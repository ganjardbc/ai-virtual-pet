/// <reference types="node" />
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig(({ mode }) => {
  // The API port lives in the repository-root .env (shared with the API), not in apps/web.
  const env = { ...loadEnv(mode, repositoryRoot, ''), ...process.env };
  const apiPort = env.API_PORT ?? '3000';
  // The Debug button mirrors the server's debug API flag; hidden unless ENABLE_DEBUG_API=true.
  const debugApiEnabled = env.ENABLE_DEBUG_API === 'true';

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_ENABLE_DEBUG_API': JSON.stringify(debugApiEnabled ? 'true' : 'false'),
    },
    resolve: {
      alias: {
        // Shared contracts from source: no prior package build needed for dev, tests, or bundling.
        '@ai-virtual-pet/contracts': fileURLToPath(
          new URL('../../packages/contracts/src/index.ts', import.meta.url),
        ),
      },
    },
    server: {
      proxy: {
        '/api': `http://localhost:${apiPort}`,
      },
    },
  };
});

import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// Resolve the domain package from source so tests do not depend on a prior domain build.
export default defineConfig({
  resolve: {
    alias: {
      '@ai-virtual-pet/domain': fileURLToPath(new URL('../domain/src/index.ts', import.meta.url)),
    },
  },
});

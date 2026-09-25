import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const workspaceSource = (name: string) =>
  fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url));

// Resolve workspace packages from source so tests do not depend on prior package builds.
export default defineConfig({
  resolve: {
    alias: {
      '@ai-virtual-pet/contracts': workspaceSource('contracts'),
      '@ai-virtual-pet/domain': workspaceSource('domain'),
      '@ai-virtual-pet/simulation': workspaceSource('simulation'),
    },
  },
  test: {
    // Database-backed suites share one test database.
    fileParallelism: false,
  },
});

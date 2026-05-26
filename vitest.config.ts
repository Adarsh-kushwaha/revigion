import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    // Exclude Deno-specific test files that use https:// imports
    exclude: [
      '**/node_modules/**',
      'supabase/functions/**',
    ],
  },
});

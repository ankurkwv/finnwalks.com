import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    includeSource: ['client/src/**/*.{ts,tsx}', 'server/**/*.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    testTimeout: 10000, // Increase timeout for tests
    hookTimeout: 10000, // Increase timeout for hooks
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@server': path.resolve(__dirname, './server'),
      '@tests': path.resolve(__dirname, './tests'),
      '@assets': path.resolve(__dirname, './client/src/assets'),
    },
  }
});
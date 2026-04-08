/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 55,
        functions: 50,
        statements: 54,
        branches: 55,
      },
      exclude: [
        'node_modules/**',
        'e2e/**',
        '**/*.config.*',
        '**/*.d.ts',
        'src/main.tsx',
        'src/App.tsx',
        'src/lib/**',
        // Routing + context wiring — thin files with no standalone logic to assert
        'src/AppRoutes.tsx',
        'src/contexts/**',
        // Hooks extracted from parent components — covered by AuthPage.test and usePowerPage.test
        'src/hooks/useAuthForm.ts',
        'src/hooks/useWeekData.ts',
      ],
    },
  },
});

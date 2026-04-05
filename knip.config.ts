import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['src/main.tsx', 'vite.config.ts', 'tailwind.config.js', 'postcss.config.js'],
  project: ['src/**/*.{ts,tsx}'],
  ignore: ['src/vite-env.d.ts', 'src/lib/timezone/data/**'],
  ignoreDependencies: [
    // Used in config files that knip may not fully parse
    'autoprefixer',
    // Type-only packages — never imported as values
    '@types/react',
    '@types/react-dom',
    // Used by vitest internally
    'jsdom',
    // CLI tools invoked via npx in scripts
    'knip',
    'depcheck',
    'license-checker',
  ],
};

export default config;

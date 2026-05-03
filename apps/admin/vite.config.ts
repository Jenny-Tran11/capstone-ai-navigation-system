import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import EnvironmentPlugin from 'vite-plugin-environment';

export default defineConfig(({ mode }) => {
  // Ensure .env.production / .env.development are on process.env when plugins read them (not only import.meta.env).
  const envDir = __dirname;
  for (const [k, v] of Object.entries(loadEnv(mode, envDir, 'REACT_APP_'))) {
    process.env[k] = v;
  }

  return {
  plugins: [
    react(),
    tailwindcss(),
    EnvironmentPlugin([
      'REACT_APP_APP_NAME',
      'REACT_APP_AWS_PROFILE',
      'REACT_APP_API_URL',
      'REACT_APP_COGNITO_IDENTITY_POOL_ID',
      'REACT_APP_COGNITO_USER_POOL_ID',
      'REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID',
      'REACT_APP_COGNITO_ENDPOINT',
    ]),
  ],
  envPrefix: 'REACT_APP_',
  resolve: {
    alias: {
      './runtimeConfig': './runtimeConfig.browser',
      '@': path.resolve(__dirname, './src'),
      '@baseline/ui/lib': path.resolve(__dirname, '../../packages/ui/src/lib'),
      '@baseline/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  esbuild: {
    minifyWhitespace: true,
    treeShaking: true,
  },
  build: {
    outDir: '.dist',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          amplify: ['@aws-amplify/ui-react', 'aws-amplify'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5001,
    allowedHosts: true,
  },
};
});

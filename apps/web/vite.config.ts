import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import EnvironmentPlugin from 'vite-plugin-environment';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    EnvironmentPlugin({
      REACT_APP_APP_NAME: 'Baseline Core',
      REACT_APP_AWS_PROFILE: '',
      REACT_APP_API_URL: '',
      REACT_APP_COGNITO_IDENTITY_POOL_ID: '',
      REACT_APP_COGNITO_USER_POOL_ID: '',
      REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID: '',
    }),
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
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
});

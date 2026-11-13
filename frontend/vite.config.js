import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, '..');

export default defineConfig(({ mode }) => {
  // Read the single root .env. Only VITE_* variables reach browser code.
  const env = loadEnv(mode, rootDir, '');
  const backendPort = env.PORT || '5000';

  return {
    envDir: rootDir,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(currentDir, 'src'),
      },
    },
    server: {
      port: 5173,
      // Optional: set VITE_API_BASE_URL=/api to use this proxy and avoid CORS in development.
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});

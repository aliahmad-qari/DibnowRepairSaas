import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProd = mode === 'production';

  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: isProd ? undefined : {
        '/api': {
          target: 'http://localhost:5002',
          changeOrigin: true,
          secure: false,
          bypass: (req, res, options) => {
            const proxyUrl = req.url;
            if (proxyUrl?.includes('.ts') || proxyUrl?.includes('.tsx')) {
              return proxyUrl;
            }
          }
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || env.API_KEY || process.env.API_KEY || ''),
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || env.API_KEY || process.env.API_KEY || ''),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || (isProd ? '' : 'http://localhost:5000'))
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});

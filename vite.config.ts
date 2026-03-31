import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  console.log("Vite config API Keys:", {
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    API_KEY: !!process.env.API_KEY,
    env_GEMINI_API_KEY: !!env.GEMINI_API_KEY
  });
  return {
    define: {
      'process.env': 'globalThis.process.env',
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@config': path.resolve(process.cwd(), 'firebase-applet-config.json')
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react';
              }
              if (id.includes('lucide') || id.includes('motion') || id.includes('recharts')) {
                return 'vendor-ui';
              }
              if (id.includes('xlsx') || id.includes('jspdf') || id.includes('codepage')) {
                return 'vendor-tools';
              }
              // Let Vite handle other node_modules automatically to avoid circularity
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      allowedHosts: true,
    },
  };
});

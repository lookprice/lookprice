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
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      sourcemap: false,
      minify: false,
      cssMinify: false,
      target: 'esnext',
      cssCodeSplit: true,
      reportCompressedSize: false,
      rollupOptions: {
        maxParallelFileOps: 1,
      },
      chunkSizeWarningLimit: 2000,
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      allowedHosts: true,
    },
  };
});

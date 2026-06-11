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
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-core';
              }
              if (id.includes('lucide-react') || id.includes('motion')) {
                return 'vendor-icons-motion';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
              if (id.includes('xlsx') || id.includes('jspdf') || id.includes('codepage') || id.includes('pdfkit')) {
                return 'vendor-documents';
              }
              if (id.includes('quagga') || id.includes('html5-qrcode')) {
                return 'vendor-scanners';
              }
            } else if (id.includes('src/')) {
              // Chunk massive visual engines and settings into isolated page components
              if (id.includes('StoreShowcase.tsx')) {
                return 'page-store-showcase';
              }
              if (id.includes('SuperAdmin.tsx')) {
                return 'page-super-admin';
              }
              if (id.includes('StoreDashboard/FleetTab.tsx')) {
                return 'dashboard-fleet';
              }
              if (id.includes('StoreDashboard/SettingsTab.tsx')) {
                return 'dashboard-settings';
              }
              if (id.includes('StoreDashboard/RealEstateTab.tsx')) {
                return 'dashboard-realestate';
              }
              if (id.includes('StoreDashboard/DashboardModals.tsx')) {
                return 'dashboard-modals';
              }
              if (id.includes('components/SalesInvoices.tsx')) {
                return 'comp-sales-invoices';
              }
              if (id.includes('components/PurchaseInvoices.tsx')) {
                return 'comp-purchase-invoices';
              }
              if (
                id.includes('WebsiteGenerator.tsx') ||
                id.includes('AutomotiveWebsiteGenerator.tsx') ||
                id.includes('RealEstateWebsiteGenerator.tsx') ||
                id.includes('PortfolioWebsiteGenerator.tsx')
              ) {
                return 'dashboard-generators';
              }
            }
          },
        },
      },
      chunkSizeWarningLimit: 1500,
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      allowedHosts: true,
    },
  };
});

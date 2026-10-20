import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => ({
  root: __dirname,
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  plugins: [
    react(),
    tailwindcss(),
    // ===== PWA CONFIGURATION START =====
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192x192.svg', 'pwa-512x512.svg'],
      manifest: {
        name: 'UdharPay - Billing & Reminders',
        short_name: 'UdharPay',
        description: 'AI-powered Udhar Recovery & Billing Application',
        theme_color: '#093C5D',
        background_color: '#f9fafb',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
    // ===== PWA CONFIGURATION END =====
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf')) {
              return 'vendor-jspdf';
            }
            if (id.includes('html2canvas')) {
              return 'vendor-html2canvas';
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('@reduxjs') ||
              id.includes('react-redux')
            ) {
              return 'vendor-react';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));

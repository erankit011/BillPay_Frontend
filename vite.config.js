import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Windows Junction Fix: Sync process.cwd() with realpath so esbuild metafile output keys match Vite's path computations exactly
try {
  const realCwd = fs.realpathSync.native ? fs.realpathSync.native(process.cwd()) : fs.realpathSync(process.cwd());
  if (process.cwd() !== realCwd) {
    process.chdir(realCwd);
  }
} catch {
  // Fallback silently if realpath fails
}

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')
);

export default defineConfig(({ mode }) => ({
  root: __dirname,
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })),
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  optimizeDeps: {
    exclude: ['virtual:pwa-register', 'virtual:pwa-register/react']
  },
  plugins: [
    react(),
    tailwindcss(),
    // ===== PWA CONFIGURATION START =====
    VitePWA({
      registerType: 'prompt',
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
        enabled: true,
        type: 'module'
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

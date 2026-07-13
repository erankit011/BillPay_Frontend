import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'UdharPay',
        short_name: 'UdharPay',
        description: 'AI-powered Udhar Recovery & Billing',
        theme_color: '#ffffff',
        icons: []
      }
    })
  ],
});

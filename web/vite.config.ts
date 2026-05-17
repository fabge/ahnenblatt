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
      // Temporarily ship a self-unregistering SW so old caches clear on next visit.
      // See web/TODO.md before re-enabling the real SW.
      selfDestroying: true,
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Stammbaum',
        short_name: 'Stammbaum',
        description: 'Ahnenblatt-Familienstammbaum',
        lang: 'de',
        theme_color: '#2d6a4f',
        background_color: '#f6f6f8',
        display: 'standalone',
        orientation: 'any',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Photos are in IndexedDB, not in Cache Storage. So no runtime caching needed.
      },
    }),
  ],
});

// Fix vite-plugin-pwa context resolution in tsx / ESM environment
if (typeof (globalThis as any).__dirname !== 'undefined') {
  delete (globalThis as any).__dirname;
}

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

/** Hosting statis Sites hanya melayani `/web/`, jadi `/web` dan `/mobile` dibuat explisit. */
function salinHalamanWeb() {
  return {
    name: 'situs-web-index',
    apply: 'build' as const,
    closeBundle() {
      const out = fileURLToPath(new URL('./dist/', import.meta.url));
      mkdirSync(`${out}web`, { recursive: true });
      writeFileSync(`${out}web/index.html`, readFileSync(`${out}index.html`));
      mkdirSync(`${out}mobile`, { recursive: true });
      writeFileSync(`${out}mobile/index.html`, readFileSync(`${out}index.html`));
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      salinHalamanWeb(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          navigateFallbackDenylist: [/^\/api\//]
        },
        manifest: {
          id: '/mobile',
          name: 'AMS Mobile — HRIS & CRM Lapangan',
          short_name: 'AMS Mobile',
          description: 'Aplikasi Mobile HRIS & CRM Lapangan PT Anugrahmitra Selaras terkoneksi PocketBase AMS.',
          theme_color: '#0d9488',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/mobile',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any'
            }
          ]
        },
        devOptions: {
          // Dev service worker requires an active HMR websocket. Disable when HMR is disabled in AI Studio.
          enabled: process.env.DISABLE_HMR !== 'true',
          type: 'module'
        }
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

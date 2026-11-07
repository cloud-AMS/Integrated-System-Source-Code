import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

/** Hosting statis Sites hanya melayani `/web/`, jadi `/web` tanpa garis miring dibuat explisit. */
function salinHalamanWeb() {
  return {
    name: 'situs-web-index',
    apply: 'build' as const,
    closeBundle() {
      const out = fileURLToPath(new URL('./dist/', import.meta.url));
      mkdirSync(`${out}web`, { recursive: true });
      writeFileSync(`${out}web/index.html`, readFileSync(`${out}index.html`));
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
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
        },
        manifest: {
          id: '/',
          name: 'AMS Integrated System - PT Anugrah Mitra Selaras',
          short_name: 'AMS ERP',
          description: 'Sistem Informasi Manajemen Terintegrasi Perusahaan Alat Kesehatan Indonesia berbasis standar CDAKB, CPAKB, SDAK, dan ISO 13485 Kemenkes RI.',
          theme_color: '#0ea5e9',
          background_color: '#f8fafc',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/icon.svg',
              sizes: '192x192 512x512',
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

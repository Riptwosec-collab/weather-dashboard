import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),

    // PWA with Workbox offline caching
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png', 'og-image.png'],
      manifest: false,
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'open-meteo', expiration: { maxEntries: 30, maxAgeSeconds: 3600 } },
          },
          {
            urlPattern: /^https:\/\/air-quality-api\.open-meteo\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'open-meteo-aqi', expiration: { maxEntries: 10, maxAgeSeconds: 1800 } },
          },
          {
            urlPattern: /^https:\/\/archive-api\.open-meteo\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'open-meteo-historical', expiration: { maxEntries: 20, maxAgeSeconds: 86400 } },
          },
          {
            urlPattern: /^https:\/\/api\.rainviewer\.com\/.*/,
            handler: 'NetworkFirst',
            options: { cacheName: 'rainviewer', expiration: { maxEntries: 5, maxAgeSeconds: 600 } },
          },
          {
            urlPattern: /^https:\/\/geocoding-api\.open-meteo\.com\/.*/,
            handler: 'NetworkFirst',
            options: { cacheName: 'geocoding', expiration: { maxEntries: 50, maxAgeSeconds: 86400 } },
          },
          {
            urlPattern: /^https:\/\/basemaps\.cartocdn\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'map-tiles', expiration: { maxEntries: 500, maxAgeSeconds: 604800 } },
          },
        ],
      },
    }),

    // Bundle visualizer — only in 'analyze' mode (npm run analyze)
    mode === 'analyze' &&
      visualizer({
        filename: 'dist/bundle-report.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }),
  ].filter(Boolean),

  resolve: {
    alias: {
      '@':            path.resolve(__dirname, './src'),
      '@components':  path.resolve(__dirname, './src/components'),
      '@store':       path.resolve(__dirname, './src/store'),
      '@hooks':       path.resolve(__dirname, './src/hooks'),
      '@utils':       path.resolve(__dirname, './src/utils'),
      '@types':       path.resolve(__dirname, './src/types'),
    },
  },

  build: {
    sourcemap: mode === 'analyze',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-map':    ['maplibre-gl', 'react-map-gl'],
          'vendor-charts': ['recharts'],
          'vendor-store':  ['zustand'],
          'vendor-react':  ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
}));

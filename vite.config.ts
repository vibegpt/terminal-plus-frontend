import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { compression } from 'vite-plugin-compression2';
import { visualizer } from 'rollup-plugin-visualizer';
import viteImagemin from '@vheemstra/vite-plugin-imagemin';
import imageminWebp from 'imagemin-webp';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    
    // Gzip & Brotli compression
    compression({
      algorithms: ['gzip'],
      threshold: 10240,
    }),
    compression({
      algorithms: ['brotliCompress'],
      threshold: 10240,
    }),
    
    // Image optimization (commented out due to plugin issues)
    // viteImagemin({
    //   plugins: {
    //     jpg: { quality: 80 },
    //     png: { quality: 90 },
    //   },
    //   makeWebp: {
    //     plugins: {
    //       jpg: imageminWebp({ quality: 80 }),
    //       png: imageminWebp({ quality: 90 }),
    //     },
    //   },
    // }),
    
    // Bundle analyzer (only in build)
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Terminal Plus - Airport Companion',
        short_name: 'Terminal+',
        description: 'Smart airport amenity discovery',
        theme_color: '#667eea',
        background_color: '#0A0E27',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Find Food',
            short_name: 'Food',
            description: 'Discover dining options',
            url: '/vibe/refuel',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Smart7 Collections',
            short_name: 'Smart7',
            description: 'AI-curated recommendations',
            url: '/collection/smart7',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'My Journey',
            short_name: 'Journey',
            description: 'Track your airport experience',
            url: '/journey',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }]
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Server configuration
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@vite/client', '@vite/env'],
  },
  build: {
    // Split chunks intelligently
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI libraries
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            'lucide-react',
          ],
          
          // Heavy libraries - separate chunks
          'animation': ['framer-motion'],
          'maps': ['@react-google-maps/api'],
          'analytics': ['@sentry/react', 'posthog-js'],
          'supabase': ['@supabase/supabase-js'],
          
          // Utils
          'utils': ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
    
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    
    // Better tree shaking (handled by Rollup automatically)
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // Enable source maps for production debugging
    sourcemap: 'hidden',
  },
});
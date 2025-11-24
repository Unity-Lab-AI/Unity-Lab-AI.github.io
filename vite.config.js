import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    // Static copy plugin - apps directory now handled via rollupOptions and copy-assets.js
    // viteStaticCopy({
    //   targets: []
    // })
  ],
  // Base public path - set via environment variable for branch-specific deployments
  // Main branch: '/' (root), Develop branch: '/development/'
  base: process.env.VITE_BASE_PATH || '/',

  // Build configuration
  build: {
    outDir: 'dist',
    emptyOutDir: true,

    // Multi-page app configuration
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about/index.html'),
        contact: resolve(__dirname, 'contact/index.html'),
        services: resolve(__dirname, 'services/index.html'),
        projects: resolve(__dirname, 'projects/index.html'),
        ai: resolve(__dirname, 'ai/index.html'),
        demo: resolve(__dirname, 'ai/demo/index.html'),
        apps: resolve(__dirname, 'apps/index.html'),
      },
      output: {
        // Aggressive content-based cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',

        // Manual chunks for better caching strategy
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          // Shared modules
          if (id.includes('js/')) {
            return 'shared';
          }
        },
      },
    },

    // Asset handling
    assetsInlineLimit: 4096, // 4kb - inline smaller assets
    cssCodeSplit: true,

    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for now
        drop_debugger: true,
        passes: 2,
      },
      format: {
        comments: false,
      },
    },

    // Sourcemaps for debugging (can disable in production)
    sourcemap: false,

    // Generate manifest for tracking asset versions
    manifest: false,
  },

  // Server configuration for development
  server: {
    port: 3000,
    open: true,
    cors: true,
  },

  // Preview server (for testing production build)
  preview: {
    port: 4173,
    open: true,
  },
});

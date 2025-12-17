import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import fs from 'fs';

export default defineConfig({
  plugins: [
    // Static copy plugin - apps directory now handled via rollupOptions and copy-assets.js
    // viteStaticCopy({
    //   targets: []
    // })

    // Custom plugin to handle directory URLs -> index.html
    {
      name: 'rewrite-middleware',
      configureServer(server) {
        // Use pre middleware to run before Vite's default handling
        return () => {
          server.middlewares.use((req, res, next) => {
            // Skip API routes and files with extensions
            if (!req.url || req.url.startsWith('/api/') || req.url.includes('.')) {
              return next();
            }

            // Normalize URL path
            let urlPath = req.url.split('?')[0]; // Remove query string
            if (!urlPath.endsWith('/')) {
              urlPath += '/';
            }

            const filePath = resolve(__dirname, '.' + urlPath + 'index.html');

            if (fs.existsSync(filePath)) {
              // Redirect to URL with trailing slash if needed (keeps relative paths working)
              if (!req.url.endsWith('/') && !req.url.includes('?')) {
                res.writeHead(302, { Location: req.url + '/' });
                res.end();
                return;
              }
              req.url = urlPath + 'index.html';
            }
            next();
          });
        };
      },
    },
  ],
  // Base public path
  base: './',

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
          // Demo-specific modules - keep separate from main site
          if (id.includes('ai/demo/js/')) {
            return 'demo';
          }
          // Main site shared modules (from /js/ directory)
          if (id.includes('/js/') && !id.includes('ai/demo/js/')) {
            return 'main-shared';
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
    proxy: {
      // Proxy API requests to avoid CORS issues in development
      '/api/visitors': {
        target: 'https://users.unityailab.com',
        changeOrigin: true,
        secure: true,
      },
    },
    // Handle multi-page app routing
    fs: {
      strict: false,
    },
  },

  // Resolve configuration for proper page routing
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },

  // App type for proper HTML handling
  appType: 'mpa',

  // Preview server (for testing production build)
  preview: {
    port: 4173,
    open: true,
  },
});

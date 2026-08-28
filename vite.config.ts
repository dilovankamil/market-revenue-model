import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub project page base path.
  base: '/market-revenue-model/',
  build: {
    target: 'es2019',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // Content-hashed entry names force browsers/CDNs to fetch the exact release bundle.
        // scripts/add-legacy-assets.mjs also creates stable compatibility aliases for stale HTML.
        entryFileNames: 'assets/app-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});

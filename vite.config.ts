import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub project page base path.
  base: '/market-revenue-model/',
  build: {
    target: 'es2019',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        index: 'index.html',
        app: 'src/main.tsx',
      },
      output: {
        // Content-hashed entry names force browsers/CDNs to fetch the exact release bundle.
        // scripts/create-stable-assets.mjs also creates stable bootstrap aliases.
        entryFileNames: 'assets/app-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});

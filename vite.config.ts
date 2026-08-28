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
        // Stable filenames prevent cached HTML from pointing at assets removed by a later Pages deployment.
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});

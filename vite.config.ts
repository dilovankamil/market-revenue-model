import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // This repository is deployed as a GitHub project page, so production assets
  // must resolve from the project subpath rather than the domain root.
  base: '/market-revenue-model/',
  build: {
    // Keep the public model usable on a broader range of current mobile and embedded browsers.
    target: 'es2019',
  },
});

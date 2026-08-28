import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative assets let the same build run at a domain root, a subpath, or a static preview.
  base: './',
  build: {
    // Keep the public model usable on a broader range of current mobile and embedded browsers.
    target: 'es2019',
  },
});

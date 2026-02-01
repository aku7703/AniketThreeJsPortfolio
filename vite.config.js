// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
        blog: './blog.html',
      }
    }
  },
  // Copy content folder to dist for blog posts
  publicDir: 'public',
  // Ensure content folder is accessible in dev
  server: {
    fs: {
      allow: ['content', 'public', '.']
    }
  }
});

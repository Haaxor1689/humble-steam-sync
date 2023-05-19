import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { chromeExtension } from 'vite-plugin-chrome-extension';

export default defineConfig({
  plugins: [chromeExtension(), react()],
  build: {
    rollupOptions: {
      input: 'src/manifest.json'
    },
    emptyOutDir: true
  }
});

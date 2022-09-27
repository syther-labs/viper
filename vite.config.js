import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 5173,
  },
  publicDir: 'assets',
  build: {
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});

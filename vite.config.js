import { defineConfig } from 'vite';

// Chemins relatifs à la racine : fonctionne sur Render (site statique) et en local.
export default defineConfig({
  base: '/',
  publicDir: 'public',
  server: {
    host: true,
    port: 5173
  },
  preview: {
    host: true,
    port: 4173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    cssCodeSplit: false,
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 900
  }
});

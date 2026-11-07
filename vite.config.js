import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas: el build funciona en Netlify y en cualquier subcarpeta.
  base: './',
  build: {
    // Phaser es una librería grande; no es un problema para este proyecto.
    chunkSizeWarningLimit: 2000,
  },
});

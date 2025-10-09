// frontapp/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // déjà utile si tu utilises /api
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      // >>>>> ces 3 lignes rendent TES chemins existants fonctionnels sans toucher au code
      '/deals':      { target: 'http://localhost:4001', changeOrigin: true, secure: false },
      '/visits':     { target: 'http://localhost:4001', changeOrigin: true, secure: false },
      '/objectives': { target: 'http://localhost:4001', changeOrigin: true, secure: false },
    },
  },
})

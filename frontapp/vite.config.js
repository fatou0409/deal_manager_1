// frontapp/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Si tu utilises VITE_API_URL="/api" côté front, ces proxys couvrent l'API locale.
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      // Chemins directs encore présents dans ton code historique
      '/deals':      { target: 'http://localhost:4001', changeOrigin: true, secure: false },
      '/visits':     { target: 'http://localhost:4001', changeOrigin: true, secure: false },
      '/objectives': { target: 'http://localhost:4001', changeOrigin: true, secure: false },
    },
  },
})

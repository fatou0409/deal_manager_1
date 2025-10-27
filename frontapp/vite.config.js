// frontapp/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 🔴 CORRIGÉ : Pas de rewrite, on garde /api
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
        // rewrite supprimé ! ✅
      },
      
      // Chemins directs pour compatibilité (sans /api)
      '/deals': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false
      },
      '/visits': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false
      },
      '/objectives': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false
      },
      '/auth': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false
      },
      '/users': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false
      },
      '/pipes': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false
      },
      '/stats': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false
      },
    },
  },
})
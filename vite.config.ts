import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/women-event/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['myblissmi.com'],
  },
  resolve: {
    alias: {
      '@/': path.resolve(__dirname, 'src') + '/',
    },
  },
})
     
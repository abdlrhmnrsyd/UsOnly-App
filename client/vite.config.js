import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://usonlyapp-y5vbp4nl.b4a.run',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://usonlyapp-y5vbp4nl.b4a.run',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://usonlyapp-y5vbp4nl.b4a.run',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": { target: "https://promp-jump-6.onrender.com", changeOrigin: true },
      "/uploads": { target: "https://promp-jump-6.onrender.com", changeOrigin: true },
    },
  },
  preview: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": { target: "http://127.0.0.1:4000", changeOrigin: true },
      "/uploads": { target: "http://127.0.0.1:4000", changeOrigin: true },
    },
  },
})

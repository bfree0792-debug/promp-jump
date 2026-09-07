import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": { target: "https://promp-jump-54.onrender.com", changeOrigin: true },
      "/uploads": { target: "https://promp-jump-54.onrender.com", changeOrigin: true },
    },
  },
  preview: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": { target: "https://promp-jump-54.onrender.com", changeOrigin: true },
      "/uploads": { target: "https://promp-jump-54.onrender.com", changeOrigin: true },
    },
  },
})

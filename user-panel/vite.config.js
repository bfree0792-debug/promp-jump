import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiProxy = {
  "/api": {
    target: "https://promp-jump-54.onrender.com",
    changeOrigin: true,
  },
  "/uploads": {
    target: "https://promp-jump-54.onrender.com",
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    strictPort: false,
    proxy: apiProxy,
  },
  preview: {
    port: 3001,
    strictPort: false,
    proxy: apiProxy,
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base relativa: il bundle funziona su qualunque path (sottocartelle, file server statici).
// In dev le chiamate /api sono proxate al backend Express (npm run server).
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    sourcemap: true,
  },
  server: {
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET || "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});

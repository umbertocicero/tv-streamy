import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base relativa: il bundle funziona su qualunque path (GitHub Pages, sottocartelle, file server statici)
export default defineConfig({
  plugins: [react()],
  base: "./",
});

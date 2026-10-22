import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Sayt: GitHub Pages'da /OPUS-FOOD/ ostida ishlashi uchun nisbiy yo'llar (base: "./")
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    assetsDir: "static",
    emptyOutDir: true,
    // Eski telefon brauzerlari (masalan, Samsung Internet) ham tushunsin
    target: ["es2017", "chrome64", "safari12"],
  },
  server: { port: 5173 },
});

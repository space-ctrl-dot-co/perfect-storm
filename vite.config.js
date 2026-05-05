import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir:       "dist",
    sourcemap:    false,
    chunkSizeWarningLimit: 800,
  },
  server: {
    proxy: {
      "/api": "http://localhost:8888", // netlify dev port
    },
  },
});

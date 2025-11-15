import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "index.html"),
        content: path.resolve(__dirname, "src/content/content.js")
      },
      output: {
        entryFileNames: "[name].js"
      }
    },
    outDir: "dist",
    emptyOutDir: true
  }
});

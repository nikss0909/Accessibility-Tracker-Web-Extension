import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  base: "./",   // ✅ ADD THIS LINE

  plugins: [react()],

  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"],
    exclude: ["accessibility-backend/**", "node_modules/**", "dist/**"]
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        dashboard: resolve(__dirname, "dashboard.html")
      }
    }
  }
});

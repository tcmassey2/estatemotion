import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// EstateMotion app shell — built and served at /app on the deployed Vercel site.
// Output goes to /app/dist; vercel.json rewrites /app/* to that directory.
export default defineConfig({
  plugins: [react()],
  base: "/app/",
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2020"
  },
  server: {
    port: 5173,
    proxy: {
      // Hit the deployed Vercel API routes during local dev.
      "/api": {
        target: "https://estatemotion.vercel.app",
        changeOrigin: true,
        secure: true
      }
    }
  }
});

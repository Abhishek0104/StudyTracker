import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// `base` controls the public asset path. GitHub Pages project sites are served from
// /<repo>/, so the deploy workflow sets VITE_BASE=/<repo>/. Defaults to "/" for local
// dev, Vercel, and user/org (<user>.github.io) sites.
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

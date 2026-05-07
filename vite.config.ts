import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

const pwaThemeColor = "#1e293b";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/ippuc-arcgis": {
        target: "https://geocuritiba.ippuc.org.br",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/ippuc-arcgis/, ""),
      },
      "/overpass-api": {
        target: "https://overpass-api.de",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/overpass-api/, ""),
      },
      "/osrm": {
        target: "https://router.project-osrm.org",
        changeOrigin: true,
        secure: true,
        // Mesma ideia do vercel.json: destino é a raiz do router, sem repetir o prefixo `/osrm`.
        rewrite: (p) => p.replace(/^\/osrm/, ""),
      },
      "/nominatim": {
        target: "https://nominatim.openstreetmap.org",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/nominatim/, ""),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "CicloMap CWB",
        short_name: "CicloMap",
        description:
          "Mapa interativo das ciclovias de Curitiba: explore trechos, bairros e planeje seu percurso.",
        theme_color: pwaThemeColor,
        background_color: "#0f172a",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        lang: "pt-BR",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));

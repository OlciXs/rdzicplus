import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  // Aplikacja używa routingu po stronie klienta (React Router) – każdy nieznany
  // adres ma zwracać index.html, a nie 404 z serwera. Dzięki temu odświeżenie
  // strony na np. /kalkulatory/zasilek-macierzynski działa poprawnie.
  appType: "spa",
  build: {
    // Serwery statyczne (preview, hosting) obsłużą fallback na index.html.
    rollupOptions: {
      input: "index.html",
    },
  },
});

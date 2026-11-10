/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";

// VERSION in the repository root is the only source of the app version.
const appVersion = readFileSync(new URL("./VERSION", import.meta.url), "utf8").trim();

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // The hand-written public/manifest.webmanifest is the manifest;
      // the plugin only generates and registers the service worker.
      manifest: false,
      includeAssets: ["icon.svg", "icon-maskable.svg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,webmanifest}"],
      },
    }),
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

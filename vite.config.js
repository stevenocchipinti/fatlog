import { resolve } from "node:path"
import { defineConfig } from "vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

import { tanstackRouter } from "@tanstack/router-plugin/vite"
import { VitePWA } from "vite-plugin-pwa"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // The beta build is installed alongside prod as a separate PWA, so it gets
  // its own name, icons and manifest to tell the two apart on the home screen.
  const beta = mode === "beta"
  const appName = beta ? "Fatlog Beta" : "Fatlog"

  return {
    publicDir: beta ? "public-beta" : "public",
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: false }),
      viteReact(),
      tailwindcss(),
      // Precaches the built app so it opens without the network. The data has
      // its own cache (see lib/firebase.tsx). Not active under `npm run dev`.
      VitePWA({
        // A new deploy is fetched in the background, then the page reloads
        // onto it (registered in main.tsx).
        registerType: "autoUpdate",
        // public/ and public-beta/ each ship their own manifest.json.
        manifest: false,
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico,json}"],
          navigateFallback: "/index.html",
          // Firebase's sign-in redirect lives under /__/ on this origin and
          // must reach the server.
          navigateFallbackDenylist: [/^\/__\//],
          cleanupOutdatedCaches: true,
        },
      }),
      {
        name: "app-name",
        transformIndexHtml: {
          order: "pre",
          handler: html => html.replaceAll("%APP_NAME%", appName),
        },
      },
    ],
    test: {
      globals: true,
      environment: "jsdom",
    },
    resolve: {
      alias: {
        "@": resolve(import.meta.dirname, "./src"),
      },
    },
  }
})

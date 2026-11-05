import { resolve } from "node:path"
import { defineConfig } from "vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

import { tanstackRouter } from "@tanstack/router-plugin/vite"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // The beta build is installed alongside prod as a separate PWA, so it gets
  // its own name, icons and manifest to tell the two apart on the home screen.
  const beta = mode === "beta"
  const appName = beta ? "Fatlog Beta" : "Fatlog"

  return {
    publicDir: beta ? "public-beta" : "public",
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      viteReact(),
      tailwindcss(),
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

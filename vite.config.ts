import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// import.meta.dirname no existe en Vite/TS; derivamos desde import.meta.url
const projectRoot = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    // Sentry Vite Plugin - solo en producción con auth token
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Upload source maps solo si hay auth token
      disable: !process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: './dist/**',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
      '@shared': resolve(projectRoot, 'src/shared')
    }
  },
  build: {
    sourcemap: true, // Generar source maps para Sentry
  },
});

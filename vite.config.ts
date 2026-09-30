import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  plugins: [
    react(),
    tailwindcss(),
    cloudflare({
      // Let Vite's same-origin API proxy run before the local Worker.
      config: command === 'serve' && !isPreview
        ? (workerConfig) => ({
            assets: {
              ...workerConfig.assets,
              runWorkerFirst: ['/*', '!/api/*'],
            },
          })
        : undefined,
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://yatori-api.hungrym0.com',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
}))

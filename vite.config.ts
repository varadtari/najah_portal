import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The portal always calls the API under /api. In development Vite forwards that to the Go
// service, so the browser sees a single origin and the session cookie needs no CORS; in
// production the reverse proxy (Caddy) does the same.
const apiTarget = process.env.API_TARGET ?? 'http://localhost:8001'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'node',
  },
})

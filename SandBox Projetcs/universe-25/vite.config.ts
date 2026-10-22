import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Serve index.html for all 404s so React Router handles client-side paths
    // (Vite exposes this via the underlying connect middleware option)
  },
})

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Chuyển tiếp /api sang backend Node.js để không phải cấu hình CORS khi phát triển
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})

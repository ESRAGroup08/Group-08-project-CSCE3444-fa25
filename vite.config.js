import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- ADD THIS 'server' SECTION ---
  server: {
    proxy: {
      // Requests to any path starting with /api will be proxied
      '/api': {
        // The target is your backend server
        target: 'http://localhost:3000', 
        // This is necessary for the server to accept the request
        changeOrigin: true, 
      },
      // You can also proxy the socket.io connection if needed
      '/socket.io': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    }
  }
})
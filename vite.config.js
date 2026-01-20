

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills' // Import this

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(), // Add this function call to the plugins array
  ],
  server: {
    port: 5173,       // This forces the port to be 5173
    strictPort: true, // This stops it from switching to 5174/5175 if busy
    host: true  // Optional: Helpful if you want to test on mobile via LAN
  }


})


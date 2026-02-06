import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
   plugins: [
      react(),
      VitePWA({
         registerType: 'autoUpdate',
         includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
         manifest: {
            name: 'File Converter',
            short_name: 'Converter',
            description: 'Convert files to PDF - 100% client-side',
            theme_color: '#6366f1',
            background_color: '#0f0f23',
            display: 'standalone',
            icons: [
               {
                  src: 'pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png'
               },
               {
                  src: 'pwa-512x512.png',
                  sizes: '512x512',
                  type: 'image/png'
               }
            ]
         },
         workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
         }
      })
   ]
})

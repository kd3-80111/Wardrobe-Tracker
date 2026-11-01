import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
export default defineConfig({
    base: '/Wardrobe-Tracker/',
    plugins: [vue(), VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['wardrobe.svg'],
        manifest: { name: 'My Wardrobe', short_name: 'Wardrobe', description: 'Your personal wardrobe, stored on your device.', theme_color: '#121713', background_color: '#121713', display: 'standalone', orientation: 'portrait-primary', icons: [{ src: 'wardrobe-192.png', sizes: '192x192', type: 'image/png' }, { src: 'wardrobe-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }] }, workbox: { navigateFallback: 'index.html' },
        start_url: '/Wardrobe-Tracker/',
        scope: '/Wardrobe-Tracker/'
    })]
})
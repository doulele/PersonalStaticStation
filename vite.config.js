import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  base: '/staticTool/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api-fund': {
        target: 'http://fund.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-fund/, '')
      }
    }
  }
})  
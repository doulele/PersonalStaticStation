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
        target: 'https://fund.eastmoney.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Referer: 'https://fund.eastmoney.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        rewrite: (path) => path.replace(/^\/api-fund/, '')
      },
      '/api-push2': {
        target: 'https://push2delay.eastmoney.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Referer: 'https://quote.eastmoney.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        rewrite: (path) => path.replace(/^\/api-push2/, '')
      },
      '/api-qt': {
        target: 'https://qt.gtimg.cn',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-qt/, '')
      },
      '/api-ifzq': {
        target: 'https://web.ifzq.gtimg.cn',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-ifzq/, '')
      }
    }
  }
})  
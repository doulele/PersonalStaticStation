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
      // 开发环境：将 /staticTool/api/* 转发到云端后端
      '/staticTool/api': {
        target: 'https://wellwin.top',
        changeOrigin: true,
        secure: false
      }
    }
  }
})  
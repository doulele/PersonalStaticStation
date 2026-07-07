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
      // 本地调试：video-parse（含 yt-dlp）转发到线上（线上有 yt-dlp）
      '/staticTool/api/video-parse': {
        target: 'https://wellwin.top',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, '')
      },
      // 其他 API 转发到本地后端
      '/staticTool/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, '')
      }
    }
  }
})  
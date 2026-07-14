import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve } from 'path'

export default defineConfig({
  plugins: [basicSsl(), vue()],
  base: '/staticTool/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',  // 允许局域网内手机访问
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
      // 语音转写请求转发到阿里云（阿里云上有 faster-whisper）
      // 注意：不带 rewrite，保留 /staticTool/api/ 前缀，由 Nginx 转发到 3001 后端
      '/staticTool/api/family-meeting/transcribe': {
        target: 'https://wellwin.top',
        changeOrigin: true,
        secure: false,
        timeout: 300000  // 转写可能需要较长时间（5分钟）
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
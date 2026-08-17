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
      // VIP视频搜索代理 → 走本地后端（防第三方溯源）
      '/staticTool/api/video-parse/proxy-search': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, '')
      },
      // 线路五 (chen-dong) 播放解析 → 走本地后端
      '/staticTool/api/video-parse/cd-play': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, '')
      },
      // HLS 流代理 → 走本地后端（解决 .ts 分片 SSL/CORS）
      '/staticTool/api/video-parse/hls-proxy': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, '')
      },
      '/staticTool/api/video-parse/hls-segment': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, '')
      },
      // 页面标题抓取 → 走本地后端（无需线上，降低延迟）
      '/staticTool/api/video-parse/page-title': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, '')
      },
      // 解析线路健康检测 → 走本地后端
      '/staticTool/api/video-parse/check-apis': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, '')
      },
      // 视频下载 / 转MP3 → 走本地后端（下载需走服务器，避免线上大流量）
      '/staticTool/api/video-parse/ytdlp/download': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, '')
      },
      // B站扫码登录 → 走本地后端
      '/staticTool/api/video-parse/ytdlp/bili-qrcode': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, '')
      },
      // yt-dlp 状态检测 → 走本地后端
      '/staticTool/api/video-parse/ytdlp/status': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, '')
      },
      // Cookie 状态查询 → 走本地后端
      '/staticTool/api/video-parse/ytdlp/cookies': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, '')
      },
      // 本地调试：video-parse（含 yt-dlp）转发到线上（线上有 yt-dlp）
      '/staticTool/api/video-parse': {
        target: 'https://wellwin.top',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, '')
      },
      // 语音转写 & 声纹识别请求转发到线上服务器（线上有 Python + faster-whisper + speechbrain）
      // 注意：不带 rewrite，保留 /staticTool/api/ 前缀，由 Nginx 转发到 3001 后端
      '/staticTool/api/family-meeting/transcribe': {
        target: 'https://wellwin.top',
        changeOrigin: true,
        secure: false,
        timeout: 300000
      },
      // 声纹相关接口
      '/staticTool/api/family-meeting/voiceprints': {
        target: 'https://wellwin.top',
        changeOrigin: true,
        secure: false
      },
      '/staticTool/api/family-meeting/members/(.*)/voiceprint': {
        target: 'https://wellwin.top',
        changeOrigin: true,
        secure: false
      },
      // 白噪音音频文件（服务器独立目录托管）→ 转发到线上后端
      // 不带 rewrite，保留 /staticTool/api/ 前缀，由线上 Nginx 转发到后端
      '/staticTool/api/family/whitenoise': {
        target: 'https://wellwin.top',
        changeOrigin: true,
        secure: false
      },
      // 睡眠内容列表（含白噪音 audioUrl）→ 转发到线上后端（本地无音频目录，用线上数据测试）
      '/staticTool/api/family/sleep-content': {
        target: 'https://wellwin.top',
        changeOrigin: true,
        secure: false
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
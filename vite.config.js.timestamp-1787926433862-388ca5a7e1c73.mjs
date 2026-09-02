// vite.config.js
import { defineConfig } from "file:///F:/personal/%E4%B8%AA%E4%BA%BA%E7%BD%91%E7%AB%99%E9%A1%B9%E7%9B%AE/personToolStation/PersonalStaticStation/node_modules/vite/dist/node/index.js";
import vue from "file:///F:/personal/%E4%B8%AA%E4%BA%BA%E7%BD%91%E7%AB%99%E9%A1%B9%E7%9B%AE/personToolStation/PersonalStaticStation/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import basicSsl from "file:///F:/personal/%E4%B8%AA%E4%BA%BA%E7%BD%91%E7%AB%99%E9%A1%B9%E7%9B%AE/personToolStation/PersonalStaticStation/node_modules/@vitejs/plugin-basic-ssl/dist/index.mjs";
import { resolve } from "path";
var __vite_injected_original_dirname = "F:\\personal\\\u4E2A\u4EBA\u7F51\u7AD9\u9879\u76EE\\personToolStation\\PersonalStaticStation";
var vite_config_default = defineConfig({
  plugins: [basicSsl(), vue()],
  base: "/staticTool/",
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "src")
    }
  },
  server: {
    host: "0.0.0.0",
    // 允许局域网内手机访问
    port: 3e3,
    open: false,
    proxy: {
      // VIP视频搜索代理 → 走本地后端（防第三方溯源）
      "/staticTool/api/video-parse/proxy-search": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, "")
      },
      // 线路五 (chen-dong) 播放解析 → 走本地后端
      "/staticTool/api/video-parse/cd-play": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, "")
      },
      // HLS 流代理 → 走本地后端（解决 .ts 分片 SSL/CORS）
      "/staticTool/api/video-parse/hls-proxy": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, "")
      },
      "/staticTool/api/video-parse/hls-segment": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, "")
      },
      // 页面标题抓取 → 走本地后端（无需线上，降低延迟）
      "/staticTool/api/video-parse/page-title": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, "")
      },
      // 解析线路健康检测 → 走本地后端
      "/staticTool/api/video-parse/check-apis": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, "")
      },
      // 视频下载 / 转MP3 → 走本地后端（下载需走服务器，避免线上大流量）
      "/staticTool/api/video-parse/ytdlp/download": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, "")
      },
      // B站扫码登录 → 走本地后端
      "/staticTool/api/video-parse/ytdlp/bili-qrcode": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, "")
      },
      // yt-dlp 状态检测 → 走本地后端
      "/staticTool/api/video-parse/ytdlp/status": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, "")
      },
      // Cookie 状态查询 → 走本地后端
      "/staticTool/api/video-parse/ytdlp/cookies": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, "")
      },
      // 本地调试：video-parse（含 yt-dlp）转发到线上（线上有 yt-dlp）
      "/staticTool/api/video-parse": {
        target: "https://wellwin.top",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, "")
      },
      // 语音转写 & 声纹识别请求转发到线上服务器（线上有 Python + faster-whisper + speechbrain）
      // 注意：不带 rewrite，保留 /staticTool/api/ 前缀，由 Nginx 转发到 3001 后端
      "/staticTool/api/family-meeting/transcribe": {
        target: "https://wellwin.top",
        changeOrigin: true,
        secure: false,
        timeout: 3e5
      },
      // 声纹相关接口
      "/staticTool/api/family-meeting/voiceprints": {
        target: "https://wellwin.top",
        changeOrigin: true,
        secure: false
      },
      "/staticTool/api/family-meeting/members/(.*)/voiceprint": {
        target: "https://wellwin.top",
        changeOrigin: true,
        secure: false
      },
      // 白噪音音频文件（服务器独立目录托管）→ 转发到线上后端
      // 不带 rewrite，保留 /staticTool/api/ 前缀，由线上 Nginx 转发到后端
      "/staticTool/api/family/whitenoise": {
        target: "https://wellwin.top",
        changeOrigin: true,
        secure: false
      },
      // 睡眠内容列表（含白噪音 audioUrl）→ 转发到线上后端（本地无音频目录，用线上数据测试）
      "/staticTool/api/family/sleep-content": {
        target: "https://wellwin.top",
        changeOrigin: true,
        secure: false
      },
      // 其他 API 转发到本地后端
      "/staticTool/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/staticTool\/api/, "")
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJGOlxcXFxwZXJzb25hbFxcXFxcdTRFMkFcdTRFQkFcdTdGNTFcdTdBRDlcdTk4NzlcdTc2RUVcXFxccGVyc29uVG9vbFN0YXRpb25cXFxcUGVyc29uYWxTdGF0aWNTdGF0aW9uXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJGOlxcXFxwZXJzb25hbFxcXFxcdTRFMkFcdTRFQkFcdTdGNTFcdTdBRDlcdTk4NzlcdTc2RUVcXFxccGVyc29uVG9vbFN0YXRpb25cXFxcUGVyc29uYWxTdGF0aWNTdGF0aW9uXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9GOi9wZXJzb25hbC8lRTQlQjglQUElRTQlQkElQkElRTclQkQlOTElRTclQUIlOTklRTklQTElQjklRTclOUIlQUUvcGVyc29uVG9vbFN0YXRpb24vUGVyc29uYWxTdGF0aWNTdGF0aW9uL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcbmltcG9ydCBiYXNpY1NzbCBmcm9tICdAdml0ZWpzL3BsdWdpbi1iYXNpYy1zc2wnXHJcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbYmFzaWNTc2woKSwgdnVlKCldLFxyXG4gIGJhc2U6ICcvc3RhdGljVG9vbC8nLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgICdAJzogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiAnMC4wLjAuMCcsICAvLyBcdTUxNDFcdThCQjhcdTVDNDBcdTU3REZcdTdGNTFcdTUxODVcdTYyNEJcdTY3M0FcdThCQkZcdTk1RUVcclxuICAgIHBvcnQ6IDMwMDAsXHJcbiAgICBvcGVuOiBmYWxzZSxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgIC8vIFZJUFx1ODlDNlx1OTg5MVx1NjQxQ1x1N0QyMlx1NEVFM1x1NzQwNiBcdTIxOTIgXHU4RDcwXHU2NzJDXHU1NzMwXHU1NDBFXHU3QUVGXHVGRjA4XHU5NjMyXHU3QjJDXHU0RTA5XHU2NUI5XHU2RUFGXHU2RTkwXHVGRjA5XHJcbiAgICAgICcvc3RhdGljVG9vbC9hcGkvdmlkZW8tcGFyc2UvcHJveHktc2VhcmNoJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL3N0YXRpY1Rvb2xcXC9hcGkvLCAnJylcclxuICAgICAgfSxcclxuICAgICAgLy8gXHU3RUJGXHU4REVGXHU0RTk0IChjaGVuLWRvbmcpIFx1NjRBRFx1NjUzRVx1ODlFM1x1Njc5MCBcdTIxOTIgXHU4RDcwXHU2NzJDXHU1NzMwXHU1NDBFXHU3QUVGXHJcbiAgICAgICcvc3RhdGljVG9vbC9hcGkvdmlkZW8tcGFyc2UvY2QtcGxheSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9zdGF0aWNUb29sXFwvYXBpLywgJycpXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIEhMUyBcdTZENDFcdTRFRTNcdTc0MDYgXHUyMTkyIFx1OEQ3MFx1NjcyQ1x1NTczMFx1NTQwRVx1N0FFRlx1RkYwOFx1ODlFM1x1NTFCMyAudHMgXHU1MjA2XHU3MjQ3IFNTTC9DT1JTXHVGRjA5XHJcbiAgICAgICcvc3RhdGljVG9vbC9hcGkvdmlkZW8tcGFyc2UvaGxzLXByb3h5Jzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL3N0YXRpY1Rvb2xcXC9hcGkvLCAnJylcclxuICAgICAgfSxcclxuICAgICAgJy9zdGF0aWNUb29sL2FwaS92aWRlby1wYXJzZS9obHMtc2VnbWVudCc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9zdGF0aWNUb29sXFwvYXBpLywgJycpXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIFx1OTg3NVx1OTc2Mlx1NjgwN1x1OTg5OFx1NjI5M1x1NTNENiBcdTIxOTIgXHU4RDcwXHU2NzJDXHU1NzMwXHU1NDBFXHU3QUVGXHVGRjA4XHU2NUUwXHU5NzAwXHU3RUJGXHU0RTBBXHVGRjBDXHU5NjREXHU0RjRFXHU1RUY2XHU4RkRGXHVGRjA5XHJcbiAgICAgICcvc3RhdGljVG9vbC9hcGkvdmlkZW8tcGFyc2UvcGFnZS10aXRsZSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9zdGF0aWNUb29sXFwvYXBpLywgJycpXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIFx1ODlFM1x1Njc5MFx1N0VCRlx1OERFRlx1NTA2NVx1NUVCN1x1NjhDMFx1NkQ0QiBcdTIxOTIgXHU4RDcwXHU2NzJDXHU1NzMwXHU1NDBFXHU3QUVGXHJcbiAgICAgICcvc3RhdGljVG9vbC9hcGkvdmlkZW8tcGFyc2UvY2hlY2stYXBpcyc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9zdGF0aWNUb29sXFwvYXBpLywgJycpXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIFx1ODlDNlx1OTg5MVx1NEUwQlx1OEY3RCAvIFx1OEY2Q01QMyBcdTIxOTIgXHU4RDcwXHU2NzJDXHU1NzMwXHU1NDBFXHU3QUVGXHVGRjA4XHU0RTBCXHU4RjdEXHU5NzAwXHU4RDcwXHU2NzBEXHU1MkExXHU1NjY4XHVGRjBDXHU5MDdGXHU1MTREXHU3RUJGXHU0RTBBXHU1OTI3XHU2RDQxXHU5MUNGXHVGRjA5XHJcbiAgICAgICcvc3RhdGljVG9vbC9hcGkvdmlkZW8tcGFyc2UveXRkbHAvZG93bmxvYWQnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMDAxJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvc3RhdGljVG9vbFxcL2FwaS8sICcnKVxyXG4gICAgICB9LFxyXG4gICAgICAvLyBCXHU3QUQ5XHU2MjZCXHU3ODAxXHU3NjdCXHU1RjU1IFx1MjE5MiBcdThENzBcdTY3MkNcdTU3MzBcdTU0MEVcdTdBRUZcclxuICAgICAgJy9zdGF0aWNUb29sL2FwaS92aWRlby1wYXJzZS95dGRscC9iaWxpLXFyY29kZSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9zdGF0aWNUb29sXFwvYXBpLywgJycpXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIHl0LWRscCBcdTcyQjZcdTYwMDFcdTY4QzBcdTZENEIgXHUyMTkyIFx1OEQ3MFx1NjcyQ1x1NTczMFx1NTQwRVx1N0FFRlxyXG4gICAgICAnL3N0YXRpY1Rvb2wvYXBpL3ZpZGVvLXBhcnNlL3l0ZGxwL3N0YXR1cyc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9zdGF0aWNUb29sXFwvYXBpLywgJycpXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIENvb2tpZSBcdTcyQjZcdTYwMDFcdTY3RTVcdThCRTIgXHUyMTkyIFx1OEQ3MFx1NjcyQ1x1NTczMFx1NTQwRVx1N0FFRlxyXG4gICAgICAnL3N0YXRpY1Rvb2wvYXBpL3ZpZGVvLXBhcnNlL3l0ZGxwL2Nvb2tpZXMnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMDAxJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvc3RhdGljVG9vbFxcL2FwaS8sICcnKVxyXG4gICAgICB9LFxyXG4gICAgICAvLyBcdTY3MkNcdTU3MzBcdThDMDNcdThCRDVcdUZGMUF2aWRlby1wYXJzZVx1RkYwOFx1NTQyQiB5dC1kbHBcdUZGMDlcdThGNkNcdTUzRDFcdTUyMzBcdTdFQkZcdTRFMEFcdUZGMDhcdTdFQkZcdTRFMEFcdTY3MDkgeXQtZGxwXHVGRjA5XHJcbiAgICAgICcvc3RhdGljVG9vbC9hcGkvdmlkZW8tcGFyc2UnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly93ZWxsd2luLnRvcCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL3N0YXRpY1Rvb2xcXC9hcGkvLCAnJylcclxuICAgICAgfSxcclxuICAgICAgLy8gXHU4QkVEXHU5N0YzXHU4RjZDXHU1MTk5ICYgXHU1OEYwXHU3RUI5XHU4QkM2XHU1MjJCXHU4QkY3XHU2QzQyXHU4RjZDXHU1M0QxXHU1MjMwXHU3RUJGXHU0RTBBXHU2NzBEXHU1MkExXHU1NjY4XHVGRjA4XHU3RUJGXHU0RTBBXHU2NzA5IFB5dGhvbiArIGZhc3Rlci13aGlzcGVyICsgc3BlZWNoYnJhaW5cdUZGMDlcclxuICAgICAgLy8gXHU2Q0U4XHU2MTBGXHVGRjFBXHU0RTBEXHU1RTI2IHJld3JpdGVcdUZGMENcdTRGRERcdTc1NTkgL3N0YXRpY1Rvb2wvYXBpLyBcdTUyNERcdTdGMDBcdUZGMENcdTc1MzEgTmdpbnggXHU4RjZDXHU1M0QxXHU1MjMwIDMwMDEgXHU1NDBFXHU3QUVGXHJcbiAgICAgICcvc3RhdGljVG9vbC9hcGkvZmFtaWx5LW1lZXRpbmcvdHJhbnNjcmliZSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwczovL3dlbGx3aW4udG9wJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgICB0aW1lb3V0OiAzMDAwMDBcclxuICAgICAgfSxcclxuICAgICAgLy8gXHU1OEYwXHU3RUI5XHU3NkY4XHU1MTczXHU2M0E1XHU1M0UzXHJcbiAgICAgICcvc3RhdGljVG9vbC9hcGkvZmFtaWx5LW1lZXRpbmcvdm9pY2VwcmludHMnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly93ZWxsd2luLnRvcCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2VcclxuICAgICAgfSxcclxuICAgICAgJy9zdGF0aWNUb29sL2FwaS9mYW1pbHktbWVldGluZy9tZW1iZXJzLyguKikvdm9pY2VwcmludCc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwczovL3dlbGx3aW4udG9wJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZVxyXG4gICAgICB9LFxyXG4gICAgICAvLyBcdTc2N0RcdTU2NkFcdTk3RjNcdTk3RjNcdTk4OTFcdTY1ODdcdTRFRjZcdUZGMDhcdTY3MERcdTUyQTFcdTU2NjhcdTcyRUNcdTdBQ0JcdTc2RUVcdTVGNTVcdTYyNThcdTdCQTFcdUZGMDlcdTIxOTIgXHU4RjZDXHU1M0QxXHU1MjMwXHU3RUJGXHU0RTBBXHU1NDBFXHU3QUVGXHJcbiAgICAgIC8vIFx1NEUwRFx1NUUyNiByZXdyaXRlXHVGRjBDXHU0RkREXHU3NTU5IC9zdGF0aWNUb29sL2FwaS8gXHU1MjREXHU3RjAwXHVGRjBDXHU3NTMxXHU3RUJGXHU0RTBBIE5naW54IFx1OEY2Q1x1NTNEMVx1NTIzMFx1NTQwRVx1N0FFRlxyXG4gICAgICAnL3N0YXRpY1Rvb2wvYXBpL2ZhbWlseS93aGl0ZW5vaXNlJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHBzOi8vd2VsbHdpbi50b3AnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIFx1Nzc2MVx1NzcyMFx1NTE4NVx1NUJCOVx1NTIxN1x1ODg2OFx1RkYwOFx1NTQyQlx1NzY3RFx1NTY2QVx1OTdGMyBhdWRpb1VybFx1RkYwOVx1MjE5MiBcdThGNkNcdTUzRDFcdTUyMzBcdTdFQkZcdTRFMEFcdTU0MEVcdTdBRUZcdUZGMDhcdTY3MkNcdTU3MzBcdTY1RTBcdTk3RjNcdTk4OTFcdTc2RUVcdTVGNTVcdUZGMENcdTc1MjhcdTdFQkZcdTRFMEFcdTY1NzBcdTYzNkVcdTZENEJcdThCRDVcdUZGMDlcclxuICAgICAgJy9zdGF0aWNUb29sL2FwaS9mYW1pbHkvc2xlZXAtY29udGVudCc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwczovL3dlbGx3aW4udG9wJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZVxyXG4gICAgICB9LFxyXG4gICAgICAvLyBcdTUxNzZcdTRFRDYgQVBJIFx1OEY2Q1x1NTNEMVx1NTIzMFx1NjcyQ1x1NTczMFx1NTQwRVx1N0FFRlxyXG4gICAgICAnL3N0YXRpY1Rvb2wvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL3N0YXRpY1Rvb2xcXC9hcGkvLCAnJylcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufSkgICJdLAogICJtYXBwaW5ncyI6ICI7QUFBMFosU0FBUyxvQkFBb0I7QUFDdmIsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sY0FBYztBQUNyQixTQUFTLGVBQWU7QUFIeEIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7QUFBQSxFQUMzQixNQUFNO0FBQUEsRUFDTixTQUFT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

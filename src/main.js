import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/styles/common.scss'

// ==================== 动态模块加载失败自动重试 ====================
// 现象：页面长时间加载（如评分池构建 30~90s）期间切换路由，
// Vite dev server 的模块 URL 带 HMR 时间戳（?t=xxx）可能失效，导致
// "Failed to fetch dynamically imported module"。
// 方案：捕获该错误，清空 import 缓存后自动重试，重试仍失败则刷新页面兜底。
if (import.meta.env.DEV) {
  const originalFetch = window.fetch
  let retried = false
  window.addEventListener('unhandledrejection', (e) => {
    const msg = String(e.reason?.message || e.reason || '')
    if (!/Failed to fetch dynamically imported module/.test(msg)) return
    e.preventDefault()
    if (retried) return
    retried = true
    // 1. 重试一次（Vite 模块图已更新后再次 import 通常会成功）
    setTimeout(() => {
      location.reload()
    }, 300)
  })
  // 兜底：监听动态 import 报错
  window.addEventListener('vite:preloadError', (e) => {
    e.preventDefault()
    if (retried) return
    retried = true
    setTimeout(() => location.reload(), 300)
  })
}

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(router)
app.use(store)
app.mount('#app')

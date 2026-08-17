<template>
  <router-view />
  <!-- 全局路由跳转 loading -->
  <transition name="loading-fade">
    <div v-if="isLoading" class="global-route-loading">
      <div class="global-route-loading-spinner"></div>
      <span class="global-route-loading-text">加载中...</span>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const store = useStore()
const router = useRouter()
let darkModeTimer = null

const isLoading = computed(() => store.getters.isLoading)

function applyTheme(dark) {
  const htmlEl = document.documentElement
  const isCurrentlyDark = htmlEl.classList.contains('dark-mode')
  if (isCurrentlyDark === dark) return // 无需变更

  if (dark) {
    htmlEl.classList.add('dark-mode')
  } else {
    htmlEl.classList.remove('dark-mode')
  }
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', dark ? 'dark' : 'light')
  store.commit('SET_THEME', dark ? 'dark' : 'light')
}

function checkDarkMode() {
  const mode = store.state.themeMode

  // 手动模式：始终使用用户选择，时间变化不覆盖
  if (mode === 'light') {
    applyTheme(false)
    return
  }
  if (mode === 'dark') {
    applyTheme(true)
    return
  }

  // 自动模式：根据时间判断
  const hour = new Date().getHours()
  const shouldDark = hour >= 20 || hour < 7
  applyTheme(shouldDark)
}

// 监听 token 过期事件
function handleAuthExpired() {
  store.dispatch('auth/logout')
  ElMessage.warning('登录已过期，请重新登录')
  router.push('/login')
}

onMounted(() => {
  // 注入 color-scheme meta 标签
  if (!document.querySelector('meta[name="color-scheme"]')) {
    const meta = document.createElement('meta')
    meta.name = 'color-scheme'
    meta.content = 'light'
    document.head.appendChild(meta)
  }

  // 初始化认证状态
  store.dispatch('auth/initAuth')

  // 监听 token 过期
  window.addEventListener('auth:expired', handleAuthExpired)

  checkDarkMode()
  darkModeTimer = setInterval(checkDarkMode, 60000)
})

onUnmounted(() => {
  if (darkModeTimer) {
    clearInterval(darkModeTimer)
    darkModeTimer = null
  }
  window.removeEventListener('auth:expired', handleAuthExpired)
})
</script>

<style lang="scss">
.app-wrapper {
  min-height: 100vh;
  background: var(--bg-color);
}

// 全局路由跳转 loading 遮罩
.global-route-loading {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(4px);
}

.global-route-loading-spinner {
  width: 42px;
  height: 42px;
  border: 4px solid #e0e7ff;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: global-route-spin 0.8s linear infinite;
}

.global-route-loading-text {
  font-size: 14px;
  color: #6366f1;
  letter-spacing: 1px;
}

@keyframes global-route-spin {
  to { transform: rotate(360deg); }
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.2s ease;
}
.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

// 暗色模式下的 loading 遮罩
html.dark-mode .global-route-loading {
  background: rgba(15, 23, 42, 0.72);
}
html.dark-mode .global-route-loading-spinner {
  border-color: #334155;
  border-top-color: #818cf8;
}
html.dark-mode .global-route-loading-text {
  color: #a5b4fc;
}
</style>

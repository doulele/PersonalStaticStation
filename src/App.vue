<template>
  <router-view />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const store = useStore()
const router = useRouter()
let darkModeTimer = null

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
</style>

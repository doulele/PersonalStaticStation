<template>
  <router-view />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
let darkModeTimer = null

function checkDarkMode() {
  const hour = new Date().getHours()
  const shouldDark = hour >= 20 || hour < 7
  const htmlEl = document.documentElement
  const isCurrentlyDark = htmlEl.classList.contains('dark-mode')

  if (isCurrentlyDark !== shouldDark) {
    if (shouldDark) {
      htmlEl.classList.add('dark-mode')
    } else {
      htmlEl.classList.remove('dark-mode')
    }
    // 同步浏览器原生深色模式（影响滚动条、表单控件等原生 UI）
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', shouldDark ? 'dark' : 'light')
    store.commit('SET_THEME', shouldDark ? 'dark' : 'light')
  }
}

onMounted(() => {
  // 注入 color-scheme meta 标签
  if (!document.querySelector('meta[name="color-scheme"]')) {
    const meta = document.createElement('meta')
    meta.name = 'color-scheme'
    meta.content = 'light'
    document.head.appendChild(meta)
  }
  checkDarkMode()
  darkModeTimer = setInterval(checkDarkMode, 60000)
})

onUnmounted(() => {
  if (darkModeTimer) {
    clearInterval(darkModeTimer)
    darkModeTimer = null
  }
})
</script>

<style lang="scss">
.app-wrapper {
  min-height: 100vh;
  background: var(--bg-color);
}
</style>

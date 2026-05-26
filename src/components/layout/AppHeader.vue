<template>
  <header class="header">
    <div class="header-container">
      <div class="header-left">
        <router-link to="/home" class="logo">
          <svg class="logo-icon" width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#logoGradient)"/>
            <path d="M10 16L14 20L22 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <defs>
              <linearGradient id="logoGradient" x1="0" y1="0" x2="32" y2="32">
                <stop stop-color="#6366f1"/>
                <stop offset="1" stop-color="#a855f7"/>
              </linearGradient>
            </defs>
          </svg>
          <span class="logo-text">ToolHub</span>
        </router-link>
      </div>
      
      <nav class="nav-menu">
        <router-link 
          v-for="item in navList" 
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <el-icon :size="18"><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </router-link>
      </nav>
      
      <div class="header-right">
        <a href="https://github.com" target="_blank" class="github-link">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { 
  HomeFilled, 
  Grid
} from '@element-plus/icons-vue'

const route = useRoute()

const navList = [
  { path: '/home', title: 'Home', icon: 'HomeFilled' },
  { path: '/other', title: 'Other', icon: 'Grid' }
]

const isActive = (path) => {
  if (path === '/home') {
    return route.path === '/home' || route.path.startsWith('/home/')
  }
  return route.path.startsWith(path)
}
</script>

<style lang="scss" scoped>
.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  
  .logo-text {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.02em;
  }
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  text-decoration: none;
  transition: all 0.2s ease;
  
  &:hover {
    color: #0f172a;
    background: #f1f5f9;
  }
  
  &.active {
    color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
  }
}

.header-right {
  display: flex;
  align-items: center;
}

.github-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: #64748b;
  transition: all 0.2s ease;
  
  &:hover {
    color: #0f172a;
    background: #f1f5f9;
  }
}
</style>

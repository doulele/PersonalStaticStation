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
  { path: '/home', title: '首页', icon: 'HomeFilled' },
  { path: '/other', title: '其他', icon: 'Grid' }
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
  margin-left: 18px;
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
  white-space: nowrap;
  
  &:hover {
    color: #0f172a;
    background: #f1f5f9;
  }
  
  &.active {
    color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header-container {
    height: 56px;
    padding: 0 16px;
  }

  .logo .logo-text {
    font-size: 17px;
  }

  .nav-menu {
    margin-left: 12px;
    gap: 2px;
  }

  .nav-item {
    padding: 6px 10px;
    font-size: 13px;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .header-container {
    height: 52px;
    padding: 0 12px;
  }

  .logo {
    gap: 6px;
    .logo-text {
      font-size: 15px;
    }
    .logo-icon {
      width: 26px;
      height: 26px;
    }
  }

  .nav-menu {
    margin-left: 8px;
    gap: 0;
  }

  .nav-item {
    padding: 6px 8px;
    font-size: 12px;
    gap: 3px;
    border-radius: 6px;
  }
}
</style>

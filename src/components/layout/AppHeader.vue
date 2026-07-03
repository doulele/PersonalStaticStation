<template>
  <header class="header">
    <div class="header-container">
      <div class="header-left">
        <router-link to="/home" class="logo">
          <img class="logo-icon" src="/favicon.svg" alt="工具集" />
          <span class="logo-text"><span class="logo-utility">Utility</span><span class="logo-tool">Tool</span></span>
        </router-link>
      </div>
      
      <nav class="nav-menu" ref="navMenuRef">
        <router-link 
          v-for="item in navList" 
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item) }"
        >
          <el-icon :size="18"><component :is="item.icon" /></el-icon>
          <span class="nav-label">{{ item.title }}</span>
        </router-link>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { HomeFilled, DataLine, VideoCamera, Service } from '@element-plus/icons-vue'
import { TOOL_CATEGORIES } from '@/config/toolsRegistry'

const route = useRoute()

const iconMap = { DataLine, VideoCamera, Service }

const navList = [
  { path: '/home', title: '首页', icon: HomeFilled, match: 'home' },
  ...TOOL_CATEGORIES.map(cat => ({
    path: cat.path,
    title: cat.name,
    icon: iconMap[cat.icon] || Service,
    match: cat.id
  }))
]

const isActive = (item) => {
  if (item.match === 'home') {
    return route.path === '/home'
  }
  if (item.match === 'fund') {
    return route.path.startsWith('/home/fund')
  }
  if (item.match === 'media') {
    return route.path.startsWith('/home/audioVideoImagesTools')
  }
  if (item.match === 'life') {
    return route.path.startsWith('/home/lifeServices')
  }
  return false
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
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;

  .logo-icon {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  .logo-text {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 32px;
  }

  .logo-utility {
    color: #64748b;
  }

  .logo-tool {
    color: #0f172a;
  }
}

.nav-menu {
  margin-left: 18px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;  /* Firefox */
  &::-webkit-scrollbar {
    display: none;  /* Chrome/Safari */
  }
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
  flex-shrink: 0;
  
  &:hover {
    color: #0f172a;
    background: #f1f5f9;
  }
  
  &.active {
    color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
  }
}

/* 移动端适配 — 单行布局，菜单均匀铺满 Logo 右侧剩余空间 */
@media (max-width: 768px) {
  .header-container {
    height: 48px;
    padding: 0 12px;
    gap: 0;
  }

  .header-left {
    flex-shrink: 0;
  }

  .logo {
    gap: 0;

    .logo-text {
      display: none;
    }

    .logo-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
    }
  }

  .nav-menu {
    margin-left: 12px;
    flex: 1;
    gap: 0;
    overflow-x: visible;
    mask-image: none;
    -webkit-mask-image: none;
  }

  .nav-item {
    flex: 1;
    justify-content: center;

    .el-icon {
      display: none;
    }

    /* 纯文字 + 下划线激活 */
    padding: 0 4px;
    font-size: 13px;
    font-weight: 500;
    gap: 0;
    border-radius: 0;
    position: relative;
    color: #64748b;
    background: transparent;
    height: 100%;
    align-items: center;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 2.5px;
      background: #6366f1;
      border-radius: 2px;
      transition: width 0.25s ease;
    }

    &:hover {
      color: #0f172a;
      background: transparent;
    }

    &.active {
      color: #6366f1;
      background: transparent;
      font-weight: 600;

      &::after {
        width: 24px;
      }
    }
  }
}

@media (max-width: 480px) {
  .header-container {
    height: 44px;
    padding: 0 10px;
  }

  .logo .logo-icon {
    width: 24px;
    height: 24px;
    border-radius: 5px;
  }

  .logo .logo-text {
    display: none;
  }

  .nav-menu {
    margin-left: 8px;
  }

  .nav-item {
    font-size: 12px;
    padding: 0 2px;

    &.active::after {
      width: 20px;
    }
  }
}
</style>

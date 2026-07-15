<template>
  <header class="header">
    <div class="header-container">
      <!-- 移动端：汉堡菜单按钮 -->
      <button class="hamburger-btn" @click="toggleMobileMenu" :aria-label="mobileMenuOpen ? '关闭菜单' : '打开菜单'">
        <span class="hamburger-line" :class="{ open: mobileMenuOpen }">
          <span class="hamburger-line-inner"></span>
          <span class="hamburger-line-inner"></span>
          <span class="hamburger-line-inner"></span>
        </span>
      </button>

      <div class="header-left">
        <router-link to="/home" class="logo">
          <img class="logo-icon" src="/favicon.svg" alt="工具集" />
          <span class="logo-text"><span class="logo-utility">Utility</span><span class="logo-tool">Tool</span></span>
        </router-link>
      </div>
      
      <!-- 桌面端：横向导航 -->
      <nav class="nav-menu" ref="navMenuRef">
        <router-link 
          v-for="item in navList" 
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item) }"
          @click="closeMobileMenu"
        >
          <el-icon :size="18"><component :is="item.icon" /></el-icon>
          <span class="nav-label">{{ item.title }}</span>
        </router-link>
      </nav>

      <!-- 用户区域 -->
      <div class="header-right">
        <!-- 已登录：用户下拉菜单 -->
        <el-dropdown v-if="isLoggedIn" trigger="click" popper-class="user-dropdown-popper">
          <div class="user-avatar-area">
            <el-avatar :size="32" class="user-avatar">
              {{ userInitial }}
            </el-avatar>
            <span class="user-nickname">{{ currentUser?.nickname || '用户' }}</span>
            <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>
                <div class="dropdown-user-info">
                  <el-avatar :size="40">{{ userInitial }}</el-avatar>
                  <div class="dropdown-user-info-text">
                    <div class="dropdown-nickname">{{ currentUser?.nickname }}</div>
                    <div class="dropdown-email">{{ currentUser?.email }}</div>
                  </div>
                </div>
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleGoProfile">
                <el-icon><Setting /></el-icon>
                个人设置
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 未登录：登录/注册按钮 -->
        <div v-else class="auth-buttons">
          <router-link to="/login" class="btn-login">
            <el-icon><User /></el-icon>
            <span>登录</span>
          </router-link>
          <router-link to="/register" class="btn-register">
            注册
          </router-link>
        </div>

        <!-- 主题切换按钮：单击循环 黑暗→白天→自动 -->
        <button
          class="theme-toggle"
          :class="{ 'auto-mode': !isThemeManual }"
          @click="toggleTheme"
          :title="themeTitle"
        >
          <el-icon :size="18">
            <Sunny v-if="themeMode === 'light'" />
            <Moon v-else-if="themeMode === 'dark'" />
            <el-icon v-else :size="18"><component :is="isDark ? Moon : Sunny" /></el-icon>
          </el-icon>
          <span v-if="!isThemeManual" class="auto-dot">A</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Teleport 到 body，避免被 header 的 backdrop-filter 创建的新包含块限制 -->
  <Teleport to="body">
    <!-- 移动端：遮罩层 -->
    <transition name="overlay-fade">
      <div v-if="mobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu"></div>
    </transition>

    <!-- 移动端：侧滑抽屉菜单 -->
    <transition name="drawer-slide">
      <nav v-if="mobileMenuOpen" class="mobile-drawer">
        <div class="drawer-header">
          <router-link to="/home" class="drawer-logo" @click="closeMobileMenu">
            <img src="/favicon.svg" alt="工具集" />
            <span><span class="logo-utility">Utility</span><span class="logo-tool">Tool</span></span>
          </router-link>
        </div>
        <div class="drawer-body">
          <router-link
            v-for="item in navList"
            :key="item.path"
            :to="item.path"
            class="drawer-item"
            :class="{ active: isActive(item) }"
            @click="closeMobileMenu"
          >
            <el-icon :size="20"><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </router-link>
        </div>
        <!-- 未登录时在抽屉底部显示登录入口 -->
        <div v-if="!isLoggedIn" class="drawer-footer">
          <router-link to="/login" class="drawer-login-btn" @click="closeMobileMenu">
            <el-icon><User /></el-icon>
            <span>登录 / 注册</span>
          </router-link>
        </div>
      </nav>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import {
  HomeFilled, DataLine, VideoCamera, Service, School,
  User, ArrowDown, SwitchButton, Sunny, Moon, Setting
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { TOOL_CATEGORIES } from '@/config/toolsRegistry'

const route = useRoute()
const router = useRouter()
const store = useStore()

const isLoggedIn = computed(() => store.getters['auth/isLoggedIn'])
const currentUser = computed(() => store.getters['auth/currentUser'])
const isDark = computed(() => store.getters.isDark)
const isThemeManual = computed(() => store.getters.isThemeManual)
const themeMode = computed(() => store.state.themeMode)

const themeTitle = computed(() => {
  const mode = themeMode.value
  if (mode === 'dark') return '当前：暗色模式\n点击切换为白天'
  if (mode === 'light') return '当前：亮色模式\n点击切换为自动'
  return '当前：自动模式（跟随时间）\n点击切换为暗色'
})

const userInitial = computed(() => {
  const name = currentUser.value?.nickname || 'U'
  return name.charAt(0).toUpperCase()
})

// 移动端菜单状态
const mobileMenuOpen = ref(false)

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

// 路由切换时自动关闭移动端菜单
watch(() => route.path, () => {
  closeMobileMenu()
})

// 菜单打开时禁止 body 滚动
watch(mobileMenuOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

const iconMap = { DataLine, VideoCamera, Service, School }

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
  if (item.match === 'family') {
    return route.path.startsWith('/home/familyEducation')
  }
  return false
}

function toggleTheme() {
  store.dispatch('toggleTheme')
  const nextDark = store.state.theme === 'dark'
  const htmlEl = document.documentElement
  if (nextDark) {
    htmlEl.classList.add('dark-mode')
  } else {
    htmlEl.classList.remove('dark-mode')
  }
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', nextDark ? 'dark' : 'light')
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    store.dispatch('auth/logout')
    ElMessage.success('已退出登录')
    router.push('/home')
  } catch { /* 用户取消 */ }
}

function handleGoProfile() {
  router.push('/profile')
}
</script>

<style lang="scss" scoped>
// ===================== 变量 =====================
$mobile-breakpoint: 768px;
$drawer-width: 270px;

// ===================== 基础 Header =====================
.header {
  background: var(--header-bg);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--header-border);
  position: sticky;
  top: 0;
  z-index: 1000;
  transition: background 0.4s ease, border-color 0.4s ease;
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

// ===================== Logo =====================
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
    color: var(--logo-utility-color);
    transition: color 0.4s ease;
  }

  .logo-tool {
    color: var(--logo-tool-color);
    transition: color 0.4s ease;
  }
}

// ===================== 汉堡菜单按钮（仅移动端显示） =====================
.hamburger-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  margin-right: 4px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s, transform 0.15s ease;
  z-index: 1010;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: var(--nav-hover-bg);
  }

  .hamburger-line {
    position: relative;
    width: 22px;
    height: 18px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .hamburger-line-inner {
      display: block;
      width: 100%;
      height: 2.5px;
      background: var(--text-color, #333);
      border-radius: 3px;
      transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                  opacity 0.25s ease;
      transform-origin: center;
      will-change: transform, opacity;
    }
  }

  // 按压反馈
  &:active {
    transform: scale(0.92);
    background: var(--nav-hover-bg);
  }

  // 打开状态 → 动画化为 X
  .hamburger-line.open {
    .hamburger-line-inner {
      &:nth-child(1) {
        transform: translateY(8px) rotate(45deg);
      }
      &:nth-child(2) {
        opacity: 0;
        transform: scaleX(0.3);
      }
      &:nth-child(3) {
        transform: translateY(-8px) rotate(-45deg);
      }
    }
  }
}

// ===================== 桌面端导航 =====================
.nav-menu {
  margin-left: 18px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--nav-text);
  text-decoration: none;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    color: var(--nav-text-hover);
    background: var(--nav-hover-bg);
  }

  &.active {
    color: var(--nav-active-color);
    background: var(--nav-active-bg);
  }
}

// ===================== 用户区域 =====================
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
}

.user-avatar-area {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;

  &:hover { background: var(--nav-hover-bg); }
}

.user-avatar {
  background: var(--color-primary, #409eff);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

.user-nickname {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 12px;
  color: var(--text-secondary, #909399);
  transition: transform 0.2s;
}

::deep(.user-dropdown-popper) {
  min-width: 200px;

  .dropdown-user-info {
    display: flex !important;
    align-items: center !important;
    gap: 12px;
    width: 100%;

    .dropdown-user-info-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .dropdown-nickname {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-color, #303133);
    }

    .dropdown-email {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }
  }
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-login,
.btn-register {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-login {
  color: var(--text-color);
  background: transparent;
  &:hover { background: var(--nav-hover-bg); }
}

.btn-register {
  color: #fff;
  background: var(--color-primary, #409eff);
  &:hover { opacity: 0.9; }
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  transition: background 0.2s;
  margin-left: 4px;
  position: relative;

  &:hover { background: var(--nav-hover-bg); }

  // 自动模式指示器（右下角 "A"）
  &.auto-mode {
    border: 1.5px solid var(--color-primary, #409eff);
  }
  .auto-dot {
    position: absolute;
    bottom: 2px;
    right: 2px;
    font-size: 10px;
    font-weight: 700;
    line-height: 1;
    color: var(--color-primary, #409eff);
    pointer-events: none;
  }
}

// ===================== 移动端遮罩层 =====================
.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 998;
  -webkit-tap-highlight-color: transparent;
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}
.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

// ===================== 移动端侧滑抽屉 =====================
.mobile-drawer {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: $drawer-width;
  max-width: 85vw;
  background: var(--header-bg, #fff);
  z-index: 999;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(-100%);
}

.drawer-header {
  padding: 18px 20px;
  border-bottom: 1px solid var(--header-border);
  flex-shrink: 0;
}

.drawer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;

  img {
    width: 30px;
    height: 30px;
    border-radius: 6px;
  }

  span {
    font-size: 18px;
    font-weight: 600;
    .logo-utility { color: var(--logo-utility-color); }
    .logo-tool { color: var(--logo-tool-color); }
  }
}

.drawer-body {
  flex: 1;
  padding: 8px;
}

.drawer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  margin: 2px 0;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  color: var(--nav-text);
  text-decoration: none;
  transition: all 0.2s ease;

  .el-icon {
    flex-shrink: 0;
    opacity: 0.65;
    transition: opacity 0.2s;
  }

  &:hover {
    background: var(--nav-hover-bg);
    color: var(--nav-text-hover);
  }

  &.active {
    color: var(--nav-active-color);
    background: var(--nav-active-bg);
    font-weight: 600;

    .el-icon { opacity: 1; }
  }
}

.drawer-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--header-border);
  flex-shrink: 0;
}

.drawer-login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 11px;
  border-radius: 10px;
  background: var(--color-primary, #409eff);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: opacity 0.2s;

  &:hover { opacity: 0.9; }
}

// ===================== 移动端适配 =====================
@media (max-width: $mobile-breakpoint) {
  .header-container {
    height: 52px;
    padding: 0 12px;
  }

  // 显示汉堡按钮
  .hamburger-btn { display: flex; }

  // 显示遮罩和抽屉
  .mobile-overlay { display: block; }
  .mobile-drawer { display: flex; }

  // 隐藏桌面端横向导航
  .nav-menu { display: none; }

  .logo {
    gap: 0;
    .logo-text { display: none; }
    .logo-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
    }
  }

  .header-right { gap: 4px; }
  .user-nickname { display: none; }
  .dropdown-icon { display: none; }

  .theme-toggle {
    width: 32px;
    height: 32px;
    margin-left: 2px;
  }

  .btn-login span { display: none; }
  .btn-login { padding: 6px 8px; }
  .btn-register {
    font-size: 12px;
    padding: 5px 10px;
  }
}

@media (max-width: 480px) {
  .header-container {
    height: 48px;
    padding: 0 10px;
  }

  .hamburger-btn {
    width: 36px;
    height: 36px;
    margin-right: 2px;
  }

  .logo .logo-icon {
    width: 26px;
    height: 26px;
    border-radius: 5px;
  }

  .header-right { gap: 2px; }
  .btn-register { font-size: 11px; padding: 4px 8px; }
  .btn-login { padding: 4px 6px; }
  .theme-toggle { width: 30px; height: 30px; }
}
</style>

<!-- 全局样式：覆盖 Element Plus dropdown 内部布局 -->
<style lang="scss">
.user-dropdown-popper {
  min-width: 200px;

  .dropdown-user-info {
    display: flex !important;
    align-items: center !important;
    gap: 12px;
    width: 100%;

    .dropdown-user-info-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .dropdown-nickname {
      font-size: 14px;
      font-weight: 500;
    }

    .dropdown-email {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }
  }

  .el-dropdown-menu__item {
    padding: 8px 16px;
  }
}

// 暗色模式
html.dark-mode .user-dropdown-popper {
  background-color: #1e1e2e !important;
  border-color: #2d2d4a !important;

  .dropdown-nickname {
    color: #e2dee9;
  }

  .dropdown-email {
    color: #64748b;
  }

  .el-dropdown-menu__item {
    color: #94a3b8 !important;

    &:hover:not(.is-disabled) {
      background-color: #252540 !important;
      color: #e2dee9 !important;
    }
  }

  .el-popper__arrow::before {
    background: #1e1e2e !important;
    border-color: #2d2d4a !important;
  }
}
</style>

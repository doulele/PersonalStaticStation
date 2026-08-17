<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-bg">
        <div class="hero-gradient"></div>
        <div class="hero-particles"></div>
      </div>
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="title-line">一个网站，搞定日常所需</span>
          <span class="title-line accent">理财 · 出行 · 娱乐 · 生活</span>
        </h1>
        <p class="hero-subtitle">
          精选实用工具，覆盖基金理财、影音娱乐、生活出行、家庭生活，打开即用
        </p>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-value">{{ tools.length }}</span>
            <span class="stat-label">实用工具</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">永久</span>
            <span class="stat-label">免费使用</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">持续</span>
            <span class="stat-label">更新迭代</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Tools Grid -->
    <section class="tools-section">
      <div class="section-header">
        <h2 class="section-title">热门工具</h2>
        <p class="section-desc">精选实用工具集合 · 按热度排序</p>
      </div>
      
      <div class="tools-grid" :class="{ collapsed: showCollapsed }">
        <div
          v-for="tool in visibleTools"
          :key="tool.id"
          class="tool-card"
          @click.prevent="handleToolClick(tool)"
        >
          <div class="tool-card-inner">
            <div class="tool-icon" :class="tool.color">
              <el-icon :size="28"><component :is="getIcon(tool.icon)" /></el-icon>
            </div>
            <div class="tool-info">
              <h3 class="tool-name">
                {{ tool.name }}
                <span v-if="tool.clicks >= 1000" class="tool-clicks">{{ formatClicks(tool.clicks) }}</span>
              </h3>
              <p class="tool-desc">{{ tool.desc }}</p>
            </div>
            <el-icon class="tool-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <!-- 移动端折叠展开 -->
      <div class="tools-toggle" v-if="showToggle">
        <button class="toggle-btn" @click="showCollapsed = !showCollapsed">
          <span>{{ showCollapsed ? `展开全部 (${tools.length}个工具)` : '收起' }}</span>
          <el-icon :class="{ rotated: !showCollapsed }"><ArrowDown /></el-icon>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessageBox } from 'element-plus'
import { ArrowRight, ArrowDown, DataLine, Present, Document, Service, Lock, Connection, Timer, Filter, TrendCharts, Headset, Picture, VideoPlay, MapLocation, Coin, Memo, Sunny, VideoCamera, Moon, School, MagicStick, FolderOpened, Dish, Flag } from '@element-plus/icons-vue'
import { ALL_TOOLS } from '@/config/toolsRegistry'
import { fetchToolRanking, recordToolClick } from '@/api/stats'

const router = useRouter()
const store = useStore()

const showCollapsed = ref(true)
const ranking = ref([])
const loading = ref(true)

// 图标名称到组件的映射
const iconMap = {
  DataLine, Present, Document, Service, Lock, Connection, Timer,
  Filter, TrendCharts, Headset, Picture, VideoPlay, MapLocation,
  Coin, Memo, Sunny, VideoCamera, Moon, School, MagicStick, FolderOpened, Dish, Flag
}

function getIcon(name) {
  return iconMap[name] || DataLine
}

// 合并注册表数据与后端排名数据
const tools = computed(() => {
  const clickMap = {}
  ranking.value.forEach(item => {
    clickMap[item.path] = item.clicks
  })

  return ALL_TOOLS.map(tool => ({
    ...tool,
    clicks: clickMap[tool.path] || 0
  })).sort((a, b) => {
    // 按点击量降序排列
    if (b.clicks !== a.clicks) return b.clicks - a.clicks
    // 点击量相同时保持注册表顺序
    return 0
  })
})

// 移动端：折叠时显示前6个，PC/平板全部显示
const MOBILE_BREAKPOINT = 768
const COLLAPSED_COUNT = 6

const isMobile = ref(false)
const visibleTools = computed(() => {
  if (!isMobile.value || !showCollapsed.value) return tools.value
  return tools.value.slice(0, COLLAPSED_COUNT)
})

const showToggle = computed(() => {
  return isMobile.value && tools.value.length > COLLAPSED_COUNT
})

function formatClicks(num) {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'W'
  return (num / 1000).toFixed(1) + 'K'
}

// 需要登录的工具路径列表
const AUTH_REQUIRED_PATHS = ['/familyEducation/familyMeeting']

async function handleToolClick(tool) {
  recordToolClick(tool.path)

  // 需要登录的工具
  if (AUTH_REQUIRED_PATHS.includes(tool.path)) {
    // 已登录 → 直接跳转
    if (store.getters['auth/isLoggedIn']) {
      router.push(tool.path)
      return
    }
    // 未登录 → 弹出提示框
    try {
      await ElMessageBox.confirm('当前功能需要登录后才能使用', '提示', {
        confirmButtonText: '前往登录',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      })
      router.push({ path: '/login', query: { redirect: tool.path } })
    } catch {
      // 用户取消
    }
    return
  }

  router.push(tool.path)
}

// 检测是否为移动端
function checkMobile() {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT
}

onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)

  try {
    ranking.value = await fetchToolRanking()
  } catch (e) {
    console.warn('获取工具排名失败:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped src="./index.scss"></style>

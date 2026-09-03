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

    <!-- 今日新闻（加载中显示 News 呼吸灯，无数据时不展示） -->
    <section
      v-if="newsLoading || newsItems.length"
      class="news-section"
      @mouseenter="stopNewsTimer"
      @mouseleave="startNewsTimer"
    >
      <div class="news-inner">
        <div v-if="newsLoading" class="news-loading">
          <span class="news-loading-text">News</span>
        </div>
        <template v-else>
          <span class="news-tag" title="查看全部新闻" @click="goNewsList">最近新闻</span>
          <div class="news-window">
            <transition name="news-slide">
              <div
                :key="newsItems[newsIndex].id"
                class="news-item"
                :title="newsItems[newsIndex].verified_fact || newsItems[newsIndex].summary || ''"
                @click="goNewsDetail(newsItems[newsIndex].id)"
              >
                <span class="news-title-line">{{ newsItems[newsIndex].title }}</span>
                <span class="news-sep">·</span>
                <span class="news-brief">{{ newsItems[newsIndex].verified_fact || newsItems[newsIndex].summary || '暂无摘要' }}</span>
              </div>
            </transition>
          </div>
        </template>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessageBox } from 'element-plus'
import { ArrowRight, ArrowDown, DataLine, Present, Document, Service, Lock, Connection, Timer, Filter, TrendCharts, Headset, Picture, VideoPlay, MapLocation, Coin, Memo, Sunny, VideoCamera, Moon, School, MagicStick, FolderOpened, Dish, Flag, Monitor, Reading } from '@element-plus/icons-vue'
import { ALL_TOOLS } from '@/config/toolsRegistry'
import { fetchToolRanking, recordToolClick } from '@/api/stats'
import { getEvents } from '@/api/hotstation'

const router = useRouter()
const store = useStore()

const showCollapsed = ref(true)
const ranking = ref([])
const loading = ref(true)

// ===== 今日新闻（逐条上滑 + 淡入淡出） =====
const newsItems = ref([])
const newsLoading = ref(true)
const newsIndex = ref(0)
let newsTimer = null

function startNewsTimer() {
  stopNewsTimer()
  if (newsItems.value.length <= 1) return
  newsTimer = setInterval(() => {
    newsIndex.value = (newsIndex.value + 1) % newsItems.value.length
  }, 4000)
}

function stopNewsTimer() {
  if (newsTimer) {
    clearInterval(newsTimer)
    newsTimer = null
  }
}

function goNewsDetail(id) {
  router.push(`/hotstation/curation/event/${id}`)
}

function goNewsList() {
  router.push('/hotstation/curation')
}

async function loadNews() {
  // 只取前 8 条，减小响应体与前端处理开销；后端已按 last_updated DESC 排序
  try {
    const res = await getEvents({ page: 1, pageSize: 8 })
    newsItems.value = ((res.data && res.data.list) || [])
      .filter(e => e.status !== 'archived')
      .slice(0, 8)
  } catch (e) {
    console.warn('首页加载今日新闻失败:', e)
  } finally {
    newsLoading.value = false
    newsIndex.value = 0
    startNewsTimer()
  }
}

// 图标名称到组件的映射
const iconMap = {
  DataLine, Present, Document, Service, Lock, Connection, Timer,
  Filter, TrendCharts, Headset, Picture, VideoPlay, MapLocation,
  Coin, Memo, Sunny, VideoCamera, Moon, School, MagicStick, FolderOpened, Dish, Flag,
  Monitor, Reading
}

// News 图标在 @element-plus/icons-vue 中不存在，用 Reading 别名保持注册表中的 'News' 名称可用
const News = Reading

function getIcon(name) {
  return iconMap[name] || DataLine
}

// 合并注册表数据与后端排名数据
const tools = computed(() => {
  const clickMap = {}
  ranking.value.forEach(item => {
    clickMap[item.path] = item.clicks
  })

  const isLoggedIn = store.getters['auth/isLoggedIn']
  return ALL_TOOLS
    .filter(tool => {
      // 技能学习分类仅登录用户可见
      if (tool.category === 'study' && !isLoggedIn) return false
      return true
    })
    .map(tool => ({
      ...tool,
      clicks: clickMap[tool.path] || 0
    }))
    .sort((a, b) => {
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
const AUTH_REQUIRED_PATHS = ['/familyEducation/familyMeeting', '/study/frontend-dev']

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

  loadNews()

  try {
    ranking.value = await fetchToolRanking()
  } catch (e) {
    console.warn('获取工具排名失败:', e)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  stopNewsTimer()
})
</script>

<style lang="scss" scoped src="./index.scss"></style>

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
          <span class="title-line accent">理财 · 出行 · 娱乐 · 创作</span>
        </h1>
        <p class="hero-subtitle">
          精选实用工具，覆盖基金理财、影音娱乐、生活出行，打开即用
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
import { ArrowRight, ArrowDown, DataLine, Present, Document, Service, Lock, Connection, Timer, Filter, TrendCharts, Headset, Picture, VideoPlay, MapLocation, Coin, Memo, Sunny, VideoCamera, Moon, School } from '@element-plus/icons-vue'
import { ALL_TOOLS } from '@/config/toolsRegistry'
import { fetchToolRanking, recordToolClick } from '@/api/stats'

const router = useRouter()

const showCollapsed = ref(true)
const ranking = ref([])
const loading = ref(true)

// 图标名称到组件的映射
const iconMap = {
  DataLine, Present, Document, Service, Lock, Connection, Timer,
  Filter, TrendCharts, Headset, Picture, VideoPlay, MapLocation,
  Coin, Memo, Sunny, VideoCamera, Moon, School
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

async function handleToolClick(tool) {
  // 先上报点击，不等待响应直接导航
  recordToolClick(tool.path)
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

<style lang="scss" scoped>
.home-page {
  width: 100%;
}

// Hero Section
.hero {
  position: relative;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0a0a0f;
}

.hero-bg {
  position: absolute;
  inset: 0;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent),
    radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139, 92, 246, 0.1), transparent),
    radial-gradient(ellipse 50% 30% at 20% 80%, rgba(59, 130, 246, 0.08), transparent);
}

.hero-particles {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(255,255,255,0.03) 1px, transparent 1px),
    radial-gradient(circle at 80% 70%, rgba(255,255,255,0.02) 1px, transparent 1px),
    radial-gradient(circle at 40% 60%, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 60px 60px, 80px 80px, 100px 100px;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 36px 24px;
  max-width: 900px;
  width: 100%;
}

.hero-badge {
  display: inline-block;
  padding: 5px 14px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #818cf8;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

.hero-title {
  font-size: clamp(24px, 4vw, 48px);
  font-weight: 800;
  line-height: 1.25;
  margin-bottom: 14px;
  letter-spacing: -0.02em;
}

.title-line {
  display: block;
  color: #ffffff;
}

.title-line.accent {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 auto 24px;
  line-height: 1.6;
  white-space: nowrap;
}

.hero-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.15);
}

// Tools Section
.tools-section {
  padding: 40px 24px;
  background: #ffffff;
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.section-desc {
  font-size: 16px;
  color: #64748b;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
  max-width: 1400px;
  margin: 0 auto;
}

.tool-card {
  display: block;
  text-decoration: none;
  cursor: pointer;
}

.tool-card-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #6366f1, #a855f7);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 8px 30px rgba(99, 102, 241, 0.1);
    transform: translateY(-2px);

    &::before {
      opacity: 1;
    }

    .tool-arrow {
      transform: translateX(4px);
      color: #6366f1;
    }
  }
}

.tool-icon {
  width: 50px;
  height: 50px;
  min-width: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #ffffff;

  &.blue {
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  }

  &.green {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }

  &.orange {
    background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  }

  &.purple {
    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  }

  &.red {
    background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
  }

  &.yellow {
    background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%);
  }
}

.tool-info {
  flex: 1;
  min-width: 0;
}

.tool-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-clicks {
  font-size: 11px;
  font-weight: 600;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  letter-spacing: 0.03em;
}

.tool-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.4;
}

.tool-arrow {
  color: #94a3b8;
  transition: all 0.3s ease;
  font-size: 20px;
  flex-shrink: 0;
}

// 移动端折叠展开按钮
.tools-toggle {
  text-align: center;
  margin-top: 20px;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #6366f1;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #eef2ff;
    border-color: #6366f1;
  }

  .el-icon {
    transition: transform 0.3s ease;
    &.rotated {
      transform: rotate(180deg);
    }
  }
}



// Responsive
@media (max-width: 768px) {
  .hero {
    min-height: 260px;
  }

  .hero-content {
    padding: 28px 20px;
  }

  .hero-badge {
    font-size: 11px;
    padding: 4px 10px;
    margin-bottom: 12px;
  }

  .hero-title {
    font-size: clamp(20px, 5vw, 32px);
    margin-bottom: 10px;
  }

  .hero-subtitle {
    font-size: 13px;
    margin-bottom: 18px;
    white-space: normal;
  }

  .hero-stats {
    gap: 18px;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-label {
    font-size: 11px;
  }

  .stat-divider {
    height: 26px;
  }

  .section-title {
    font-size: 24px;
  }

  .section-desc {
    font-size: 14px;
  }

  .tools-section {
    padding: 48px 16px;
  }

  .section-header {
    margin-bottom: 32px;
  }

  .tools-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .tool-card-inner {
    padding: 16px;
    gap: 14px;
  }

  .tool-icon {
    width: 44px;
    height: 44px;
    min-width: 44px;
    border-radius: 10px;
  }

  .tool-name {
    font-size: 15px;
  }

  .tool-desc {
    font-size: 12px;
  }


}

@media (max-width: 480px) {
  .hero {
    min-height: 220px;
  }

  .hero-content {
    padding: 24px 16px;
  }

  .hero-badge {
    font-size: 10px;
    padding: 3px 8px;
    margin-bottom: 10px;
  }

  .hero-title {
    font-size: clamp(18px, 5vw, 24px);
    margin-bottom: 8px;
  }

  .hero-subtitle {
    font-size: 12px;
    margin-bottom: 14px;
    line-height: 1.5;
    white-space: normal;
  }

  .hero-stats {
    gap: 12px;
  }

  .stat-value {
    font-size: 18px;
  }

  .stat-label {
    font-size: 10px;
  }

  .stat-divider {
    display: none;
  }

  .tools-section {
    padding: 36px 12px;
  }

  .section-title {
    font-size: 22px;
  }

  .section-desc {
    font-size: 13px;
  }

  .tool-card-inner {
    padding: 14px;
    gap: 12px;
    border-radius: 12px;
  }

  .tool-icon {
    width: 40px;
    height: 40px;
    min-width: 40px;
    border-radius: 8px;
    :deep(.el-icon) {
      font-size: 20px !important;
    }
  }

  .tool-name {
    font-size: 14px;
  }

  .tool-desc {
    font-size: 11px;
  }

  .tool-arrow {
    font-size: 18px;
  }

  .toggle-btn {
    padding: 8px 18px;
    font-size: 13px;
    border-radius: 10px;
  }


}
</style>

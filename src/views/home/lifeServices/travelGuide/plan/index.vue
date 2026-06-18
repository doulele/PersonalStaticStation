<template>
  <div class="plan-page">
    <!-- 顶部导航 -->
    <div class="plan-topbar">
      <el-button :icon="ArrowLeft" text @click="$router.back()">返回</el-button>
      <div v-if="currentAttraction" class="attraction-title">
        <MapLocation class="title-icon" />
        <span>{{ currentAttraction.name }}</span>
        <el-tag size="small" type="info">行程规划</el-tag>
      </div>
      <div class="topbar-spacer"></div>
      <el-button
        class="ai-btn"
        type="warning"
        :loading="aiLoading"
        :disabled="aiLoading || !hasData"
        @click="handleAiRecommend"
      >
        <el-icon class="el-icon--left"><MagicStick /></el-icon>
        AI 智能推荐
      </el-button>
    </div>

    <!-- AI 推荐建议横幅 -->
    <transition name="el-fade-in">
      <div v-if="showAiAdvice" class="ai-advice-banner">
        <div class="ai-advice-header">
          <span class="ai-advice-icon">🤖</span>
          <span class="ai-advice-title">AI 智能推荐</span>
          <el-button
            class="ai-advice-close"
            :icon="Close"
            text
            size="small"
            @click="showAiAdvice = false"
          />
        </div>
        <div class="ai-advice-body">
          <p class="ai-advice-text">{{ aiAdvice }}</p>
          <p v-if="aiTimePlan" class="ai-time-plan">
            <el-icon :size="14"><Clock /></el-icon>
            {{ aiTimePlan }}
          </p>
        </div>
      </div>
    </transition>

    <!-- 纵向滚动内容区 -->
    <div v-loading="loading" class="plan-scroll">
      <!-- 第一行：地图 -->
      <section class="plan-section map-section">
        <MapView
          :center="mapCenter"
          :markers="allMarkers"
        />
      </section>

      <!-- 第二行：路线节点 -->
      <section class="plan-section">
        <RoutePanel />
      </section>

      <!-- 第三行：特色美食 -->
      <section class="plan-section">
        <FoodPanel />
      </section>

      <!-- 第四行：住宿安排 -->
      <section class="plan-section">
        <HotelPanel />
      </section>

      <!-- 底部留白给悬浮栏 -->
      <div class="scroll-spacer"></div>
    </div>

    <!-- 底部悬浮栏 -->
    <div class="floating-bar">
      <div class="floating-stats">
        <div class="stat-item">
          <span class="stat-dot spot"></span>
          <span>路线 {{ counts.spots }} 个</span>
        </div>
        <div class="stat-item">
          <span class="stat-dot food"></span>
          <span>美食 {{ counts.foods }} 个</span>
        </div>
        <div class="stat-item">
          <span class="stat-dot hotel"></span>
          <span>住宿 {{ counts.hotel > 0 ? '已选' : '未选' }}</span>
        </div>
      </div>
      <el-button
        type="primary"
        size="large"
        :disabled="!canGenerate"
        :loading="generating"
        @click="handleGenerate"
      >
        生成完整攻略
        <el-icon class="el-icon--right"><Document /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import MapView from './components/MapView.vue'
import RoutePanel from './components/RoutePanel.vue'
import FoodPanel from './components/FoodPanel.vue'
import HotelPanel from './components/HotelPanel.vue'

const route = useRoute()
const router = useRouter()
const store = useStore()

const generating = ref(false)
const showAiAdvice = ref(false)

const currentAttraction = computed(() => store.state.plan.currentAttraction)
const loading = computed(() => store.state.plan.loading)
const counts = computed(() => store.getters['plan/selectedCounts'])

// AI 推荐相关
const aiLoading = computed(() => store.state.plan.aiRecommended ? false : loading.value)
const aiAdvice = computed(() => store.state.plan.aiAdvice)
const aiTimePlan = computed(() => store.state.plan.aiTimePlan)
const aiRecommended = computed(() => store.state.plan.aiRecommended)
const hasData = computed(() => {
  const s = store.state.plan
  return s.allSpots.length > 0 || s.allFoods.length > 0 || s.allHotels.length > 0
})

// 监听 AI 推荐状态变化，自动显示横幅
watch(aiRecommended, (val) => {
  if (val) showAiAdvice.value = true
})

async function handleAiRecommend() {
  try {
    await store.dispatch('plan/aiRecommend')
    showAiAdvice.value = true
    ElMessage.success('AI 已为你智能规划好路线、美食和住宿！可拖拽微调')
  } catch (err) {
    ElMessage.warning(err.message || 'AI 推荐暂不可用，请手动选择')
  }
}

const canGenerate = computed(() => {
  const c = counts.value
  return c.spots > 0 || c.foods > 0 || c.hotel > 0
})

const mapCenter = computed(() => {
  const a = currentAttraction.value
  return a ? [a.lng, a.lat] : [116.397155, 39.916345]
})

const allMarkers = computed(() => {
  const markers = []
  const selectedSpots = store.getters['plan/selectedSpots']
  const selectedFoods = store.getters['plan/selectedFoods']
  const selectedHotel = store.getters['plan/selectedHotel']
  const allHotels = store.state.plan.allHotels
  const selectedHotelId = store.state.plan.selectedHotelId

  selectedSpots.forEach(s => {
    markers.push({ ...s, type: 'spot' })
  })

  selectedFoods.forEach(f => {
    markers.push({ ...f, type: 'food' })
  })

  if (selectedHotelId === 'custom' || (selectedHotelId && selectedHotel)) {
    const hotel = selectedHotel || allHotels.find(h => h.id === selectedHotelId)
    if (hotel) {
      markers.push({ ...hotel, type: 'hotel' })
    }
  }

  return markers
})

onMounted(async () => {
  store.commit('plan/CLEAR_MULTI_ATTRACTIONS')

  const id = route.params.id
  if (!id) {
    ElMessage.warning('未指定景点')
    router.back()
    return
  }

  const numId = Number(id)
  if (numId === 1 || numId === 2) {
    try {
      await store.dispatch('plan/fetchPlan', id)
    } catch {
      ElMessage.error('获取规划数据失败')
      router.back()
    }
    return
  }

  const { name, lat, lng } = route.query
  if (!lat || !lng) {
    ElMessage.warning('该目的地暂不支持规划')
    router.back()
    return
  }
  try {
    await store.dispatch('plan/fetchDynamicPlan', {
      name: name || '未知景点',
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    })
  } catch {
    ElMessage.error('动态规划数据加载失败，请稍后重试')
    router.back()
  }
})

onUnmounted(() => {
  // 离开页面不重置，保留数据给结果页
})

async function handleGenerate() {
  generating.value = true
  try {
    await store.dispatch('plan/generatePlan')
    router.push('/home/lifeServices/travelGuide/result')
  } catch {
    ElMessage.error('生成攻略失败，请重试')
  } finally {
    generating.value = false
  }
}
</script>

<style lang="scss" scoped>
.plan-page {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f8fafc;
}

// 顶栏
.plan-topbar {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  z-index: 10;
}

.attraction-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin-left: 16px;

  .title-icon {
    color: #6366f1;
  }
}

.topbar-spacer {
  flex: 1;
}

// AI 按钮
.ai-btn {
  font-weight: 600;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  border: none;
  color: #fff;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

// AI 推荐横幅
.ai-advice-banner {
  margin: 0 24px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border: 1px solid #fcd34d;
  border-radius: 12px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -20px;
    right: -20px;
    width: 80px;
    height: 80px;
    background: rgba(251, 191, 36, 0.1);
    border-radius: 50%;
    pointer-events: none;
  }
}

.ai-advice-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.ai-advice-icon {
  font-size: 20px;
}

.ai-advice-title {
  font-size: 14px;
  font-weight: 700;
  color: #92400e;
  flex: 1;
}

.ai-advice-close {
  flex-shrink: 0;
  color: #d97706;
}

.ai-advice-body {
  position: relative;
  z-index: 1;
}

.ai-advice-text {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #78350f;
  line-height: 1.6;
}

.ai-time-plan {
  margin: 0;
  font-size: 13px;
  color: #b45309;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px dashed #fcd34d;
}

// 滚动内容区
.plan-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 24px;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

// 统一区块样式
.plan-section {
  margin-bottom: 20px;

  &:first-of-type {
    margin-top: 16px;
  }
}

// 地图区块
.map-section {
  height: 380px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

// 滚动底部留白
.scroll-spacer {
  height: 80px;
}

// 底部悬浮栏
.floating-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  z-index: 100;
}

.floating-stats {
  display: flex;
  gap: 28px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #475569;
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.spot { background: #ef4444; }
  &.food { background: #10b981; }
  &.hotel { background: #3b82f6; }
}

// 响应式
@media (max-width: 768px) {
  .plan-scroll {
    padding: 0 12px;
  }

  .map-section {
    height: 260px;
  }

  .plan-topbar {
    padding: 10px 16px;
  }

  .floating-bar {
    padding: 0 16px;
  }

  .floating-stats {
    gap: 12px;
    font-size: 12px;
  }
}
</style>

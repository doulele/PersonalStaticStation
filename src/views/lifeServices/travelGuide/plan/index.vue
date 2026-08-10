<template>
  <div class="plan-page">
    <!-- 顶部导航 -->
    <div class="plan-topbar">
      <div class="topbar-left">
        <el-button class="back-btn" :icon="ArrowLeft" text @click="$router.back()">返回</el-button>
        <div class="topbar-divider"></div>
        <div v-if="currentAttraction" class="attraction-title">
          <span class="title-icon-wrapper">
            <el-icon :size="22"><MapLocation /></el-icon>
          </span>
          <div class="title-content">
            <span class="title-name">{{ currentAttraction.name }}</span>
            <span class="title-subtitle">行程规划</span>
          </div>
        </div>
      </div>
      <div class="topbar-right">
        <!-- 交通方式切换 -->
        <div class="transport-toggle">
          <button
            class="toggle-option"
            :class="{ active: transportMode === 'drive' }"
            @click="handleTransportMode('drive')"
          >
            <span class="toggle-icon">🚗</span>
            <span class="toggle-label">自驾</span>
          </button>
          <button
            class="toggle-option"
            :class="{ active: transportMode === 'transit' }"
            @click="handleTransportMode('transit')"
          >
            <span class="toggle-icon">🚌</span>
            <span class="toggle-label">公交</span>
          </button>
        </div>
        <!-- 基础/AI 推荐切换 -->
        <div class="recommend-toggle">
          <button
            class="toggle-option"
            :class="{ active: recommendMode === 'basic' }"
            :disabled="loading"
            @click="handleBasicRecommend"
          >
            <el-icon :size="16"><Select /></el-icon>
            <span class="toggle-label">基础</span>
          </button>
          <button
            class="toggle-option ai"
            :class="{ active: recommendMode === 'ai' }"
            :disabled="aiLoading || !hasData"
            @click="handleAiRecommend"
          >
            <el-icon :size="16"><MagicStick /></el-icon>
            <span class="toggle-label">AI</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 主内容区：PC端左右分栏，移动端上下堆叠 -->
    <div v-loading="loading" class="plan-body">
      <!-- 左侧：地图 -->
      <section class="map-section">
        <MapView
          :center="mapCenter"
          :markers="allMarkers"
        />
      </section>

      <!-- 右侧：面板列表 -->
      <div class="panels-area" ref="panelsRef">
        <!-- 行程总览（统一时间线 · 可拖拽排序） -->
        <div class="panel-wrapper">
          <TimelinePanel />
        </div>

        <!-- 路线节点 -->
        <div class="panel-wrapper">
          <RoutePanel />
        </div>

        <!-- 特色美食 -->
        <div class="panel-wrapper">
          <FoodPanel />
        </div>

        <!-- 住宿安排 -->
        <div class="panel-wrapper">
          <HotelPanel />
        </div>

        <!-- 底部留白给悬浮栏 -->
        <div class="scroll-spacer"></div>
      </div>
    </div>

    <!-- 底部悬浮栏 -->
    <div class="floating-bar">
      <div class="floating-stats">
        <div class="stat-item">
          <span class="stat-icon">📍</span>
          <span class="stat-label">路线 <strong>{{ counts.spots }}</strong></span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-icon">🍽️</span>
          <span class="stat-label">美食 <strong>{{ counts.foods }}</strong></span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-icon">🏨</span>
          <span class="stat-label">住宿 <strong>{{ counts.hotel > 0 ? '已选' : '未选' }}</strong></span>
        </div>
        <div class="stat-divider"></div>
        <!-- Phase 2: 天数选择器 -->
        <div class="stat-item">
          <span class="stat-icon">📅</span>
          <el-input-number
            :model-value="planDays"
            :min="1"
            :max="7"
            size="small"
            controls-position="right"
            style="width: 90px"
            @change="onDaysChange"
          />
          <span class="stat-label">天</span>
        </div>
      </div>
      <el-button
        type="primary"
        size="large"
        :disabled="!canGenerate"
        :loading="generating"
        @click="handleGenerate"
        class="generate-btn"
      >
        生成完整攻略
        <el-icon class="el-icon--right"><Document /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { Select, MagicStick, ArrowLeft, MapLocation, Document } from '@element-plus/icons-vue'
import MapView from './components/MapView.vue'
import RoutePanel from './components/RoutePanel.vue'
import FoodPanel from './components/FoodPanel.vue'
import HotelPanel from './components/HotelPanel.vue'
import TimelinePanel from './components/TimelinePanel.vue'

const route = useRoute()
const router = useRouter()
const store = useStore()

const generating = ref(false)

const currentAttraction = computed(() => store.state.plan.currentAttraction)
const loading = computed(() => store.state.plan.loading)
const counts = computed(() => store.getters['plan/selectedCounts'])
const planDays = computed(() => store.state.plan.planDays)

// 推荐模式
const recommendMode = computed(() => store.state.plan.recommendMode)
// 交通方式
const transportMode = computed(() => store.state.plan.transportMode)
const hasData = computed(() => {
  const s = store.state.plan
  return s.allSpots.length > 0 || s.allFoods.length > 0 || s.allHotels.length > 0
})
const aiLoading = computed(() => {
  const s = store.state.plan
  return s.recommendMode === 'ai' && !s.recommendActive && loading.value
})

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

  const { name, lat, lng, address, city } = route.query
  if (!lat || !lng) {
    ElMessage.warning('该目的地暂不支持规划')
    router.back()
    return
  }
  try {
    await store.dispatch('plan/fetchDynamicPlan', {
      name: name || '未知景点',
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address: address || '',
      city: city || ''
    })
  } catch {
    ElMessage.error('动态规划数据加载失败，请稍后重试')
    router.back()
  }
})

onUnmounted(() => {
  // 离开页面不重置，保留数据给结果页
})

function onDaysChange(days) {
  store.commit('plan/SET_PLAN_DAYS', days)
}

function handleTransportMode(mode) {
  store.commit('plan/SET_TRANSPORT_MODE', mode)
}

async function handleGenerate() {
  generating.value = true
  try {
    await store.dispatch('plan/generatePlan')
    router.push('/lifeServices/travelGuide/result')
  } catch {
    ElMessage.error('生成攻略失败，请重试')
  } finally {
    generating.value = false
  }
}

// 基础推荐
async function handleBasicRecommend() {
  try {
    store.commit('plan/SET_RECOMMEND_MODE', 'basic')
    await store.dispatch('plan/basicRecommend')
    ElMessage.success('已为你推荐最佳路线、美食和住宿！可拖拽微调')
  } catch (err) {
    ElMessage.warning(err.message || '基础推荐暂不可用，请手动选择')
  }
}

// AI 推荐
async function handleAiRecommend() {
  try {
    store.commit('plan/SET_RECOMMEND_MODE', 'ai')
    await store.dispatch('plan/aiRecommend')
    ElMessage.success('AI 已为你智能规划好路线、美食和住宿！可拖拽微调')
  } catch (err) {
    ElMessage.warning(err.message || 'AI 推荐暂不可用，请手动选择')
  }
}
</script>

<style lang="scss" scoped src="./index.scss"></style>

<style lang="scss">
// ==================== 夜间模式（独立非 scoped 块） ====================
html.dark-mode .plan-page {
  background: #0f0f1a;
}

html.dark-mode {
  // 顶栏
  .plan-topbar {
    background: linear-gradient(135deg, #1a1a2e 0%, #14142e 100%);
    border-bottom-color: rgba(45, 45, 74, 0.8);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }
  .back-btn {
    color: #94a3b8;
    &:hover { color: #a78bfa; background: #1e1e3c; }
  }
  .topbar-divider { background: #2d2d4a; }
  .attraction-title {
    .title-name { color: #e2dee9; }
    .title-subtitle { color: #64748b; }
  }
  .info-pill { background: #1e1e3c; color: #94a3b8; }

  // 交通切换
  .transport-toggle {
    background: #1e1e3c; border-color: #2d2d4a;
    .toggle-option {
      color: #94a3b8;
      &:hover { color: #e2dee9; background: rgba(255,255,255,0.06); }
      &.active { background: #252540; color: #4ade80; }
    }
  }

  // 推荐切换
  .recommend-toggle {
    background: #1e1e3c; border-color: #2d2d4a;
    .toggle-option {
      color: #94a3b8;
      &:hover:not(:disabled) { color: #e2dee9; background: rgba(255,255,255,0.06); }
      &.active { background: #252540; color: #a78bfa; }
      &.ai.active { color: #fbbf24; }
      &:disabled { opacity: 0.3; }
    }
  }

  // 地图
  .map-section { background: #0f0f1a; box-shadow: 0 4px 16px rgba(0,0,0,0.2); }

  // 滚动条
  .panels-area {
    &::-webkit-scrollbar-thumb { background: #3d3d5c; }
  }

  // 底部悬浮栏
  .floating-bar {
    background: rgba(19, 19, 42, 0.97);
    border-top-color: rgba(45, 45, 74, 0.7);
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.2);
  }
  .stat-item { color: #94a3b8; }
  .stat-label strong { color: #e2dee9; }
  .stat-divider { background: #2d2d4a; }
}
</style>

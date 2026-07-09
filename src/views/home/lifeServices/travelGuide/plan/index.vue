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
    router.push('/home/lifeServices/travelGuide/result')
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

<style lang="scss" scoped>
.plan-page {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f1f5f9;
}

// ==================== 顶栏 ====================
.plan-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
  z-index: 10;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.back-btn {
  flex-shrink: 0;
  color: #64748b;
  font-weight: 500;
  border-radius: 8px;
  padding: 6px 12px;
  transition: all 0.2s;

  &:hover {
    color: #6366f1;
    background: #eef2ff;
  }
}

.topbar-divider {
  width: 1px;
  height: 24px;
  background: #e2e8f0;
  flex-shrink: 0;
  border-radius: 1px;
}

.attraction-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-shrink: 1;

  .title-icon-wrapper {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
  }

  .title-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 2px;
  }

  .title-name {
    font-size: 17px;
    font-weight: 700;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 320px;
    line-height: 1.3;
  }

  .title-subtitle {
    font-size: 11px;
    color: #94a3b8;
    letter-spacing: 0.5px;
    font-weight: 500;
  }
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

// ==================== 交通方式切换按钮 ====================
.transport-toggle {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 3px;
  flex-shrink: 0;

  .toggle-option {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border: none;
    background: transparent;
    color: #64748b;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s;
    border-radius: 9px;
    white-space: nowrap;

    &:hover {
      color: #334155;
      background: rgba(255, 255, 255, 0.6);
    }

    &.active {
      background: #fff;
      color: #10b981;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      font-weight: 600;
    }

    .toggle-icon { font-size: 16px; line-height: 1; }
    .toggle-label { font-size: 13px; font-weight: inherit; }
  }
}

// ==================== 推荐模式切换按钮 ====================
.recommend-toggle {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 3px;
  flex-shrink: 0;

  .toggle-option {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border: none;
    background: transparent;
    color: #64748b;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s;
    border-radius: 9px;
    white-space: nowrap;

    &:hover:not(:disabled) {
      color: #334155;
      background: rgba(255, 255, 255, 0.6);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.active {
      background: #fff;
      color: #6366f1;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      font-weight: 600;
    }

    &.ai.active {
      color: #f59e0b;
    }

    .toggle-label {
      font-size: 13px;
      font-weight: inherit;
    }
  }
}

.topbar-info-pills {
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 500;
  white-space: nowrap;
}

.pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;

  &.spot { background: #ef4444; }
  &.food { background: #10b981; }
  &.hotel { background: #3b82f6; }
}

// ==================== 主内容区 ====================
.plan-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 8px 4px 0;
  gap: 8px;
}

// 地图区块
.map-section {
  flex: 0 0 52%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  background: #f1f5f9;
}

// 右侧面板滚动区
.panels-area {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 8px 0 2px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  touch-action: pan-y; /* 移动端：确保垂直滚动不被 vuedraggable/touch-action:none 阻止 */
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */

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

.panel-wrapper {
  flex-shrink: 0;
  border-radius: 16px;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-1px);
  }
}

// 滚动底部留白
.scroll-spacer {
  height: 80px;
  flex-shrink: 0;
}

// ==================== 底部悬浮栏 ====================
.floating-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  z-index: 100;
}

.generate-btn {
  border-radius: 12px !important;
  font-weight: 600 !important;
  padding: 12px 28px !important;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  transition: all 0.25s;

  &:hover {
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
    transform: translateY(-1px);
  }
}

.floating-stats {
  display: flex;
  align-items: center;
  gap: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
}

.stat-icon {
  font-size: 16px;
  line-height: 1;
}

.stat-label {
  strong {
    color: #0f172a;
    font-weight: 700;
  }
}

.stat-divider {
  width: 1px;
  height: 22px;
  background: #e2e8f0;
  margin: 0 18px;
}

// ==================== 响应式：平板 ====================
@media (max-width: 1024px) {
  .plan-body {
    flex-direction: column;
    gap: 6px;
    padding: 4px 4px 0;
  }

  .map-section {
    flex: 0 0 320px;
    width: 100%;
    min-height: 260px;
    border-radius: 14px;
  }

  .panels-area {
    flex: 1;
    gap: 10px;
    padding-right: 0;
    padding: 0 2px;
  }

  .plan-topbar {
    padding: 10px 16px;
  }

  .topbar-info-pills {
    display: none;
  }

  .attraction-title .title-name {
    max-width: 200px;
    font-size: 15px;
  }

  .floating-bar {
    padding: 0 18px;
  }
}

// ==================== 响应式：手机端 ====================
@media (max-width: 768px) {
  .plan-page {
    height: 100vh;
    height: 100dvh;
  }

  // ---- 顶栏：双行布局 ----
  .plan-topbar {
    flex-wrap: wrap;
    padding: 6px 10px;
    gap: 4px 8px;
  }

  .topbar-left {
    gap: 6px;
    flex: 1 1 auto;
    max-width: 55%; // 给右侧留空间
  }

  .topbar-divider {
    display: none;
  }

  .back-btn {
    padding: 4px 6px;
    min-width: auto;
    // 移动端只显示图标
    :deep(span + span) {
      display: none;
    }
  }

  .attraction-title {
    gap: 5px;

    .title-icon-wrapper {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      :deep(.el-icon) { font-size: 16px !important; }
    }

    .title-name {
      font-size: 13px;
      max-width: 110px;
    }

    .title-subtitle {
      display: none;
    }
  }

  // ---- 切换按钮组：独占第二行，两端对齐 ----
  .topbar-right {
    flex: 1 1 100%;
    justify-content: space-between;
    gap: 6px;
    order: 3;
  }

  .topbar-info-pills {
    display: none;
  }

  // 交通 & 推荐切换按钮：等分宽度
  .transport-toggle,
  .recommend-toggle {
    flex: 1;
    justify-content: center;

    .toggle-option {
      flex: 1;
      justify-content: center;
      padding: 5px 4px;
      font-size: 12px;
      gap: 3px;
      .toggle-icon { font-size: 14px; }
      .toggle-label { font-size: 11px; display: inline; }
    }
  }

  .plan-body {
    flex-direction: column;
    gap: 4px;
    padding: 2px 2px 0;
  }

  .map-section {
    flex: 0 0 260px;
    width: 100%;
    min-height: 200px;
    border-radius: 10px;
  }

  .panels-area {
    flex: 1;
    gap: 8px;
    padding-right: 0;
    padding: 0 2px;
  }

  .scroll-spacer {
    height: 72px;
  }

  .floating-bar {
    height: 56px;
    padding: 0 12px;
  }

  .generate-btn {
    padding: 10px 18px !important;
    font-size: 13px !important;
  }

  .floating-stats {
    gap: 0;
  }

  .stat-item {
    font-size: 12px;
    gap: 5px;
  }

  .stat-icon {
    font-size: 14px;
  }

  .stat-label {
    font-size: 0;
    strong {
      font-size: 12px;
    }
  }

  .stat-divider {
    margin: 0 8px;
    height: 16px;
  }
}

// ==================== 超小屏（< 375px） ====================
@media (max-width: 400px) {
  .attraction-title .title-name {
    max-width: 100px;
    font-size: 13px;
  }

  .map-section {
    flex: 0 0 220px;
    min-height: 180px;
  }
}

</style>

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

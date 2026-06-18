<template>
  <div class="multi-plan-page">
    <!-- 顶部导航 -->
    <div class="plan-topbar">
      <el-button :icon="ArrowLeft" text @click="$router.back()">返回</el-button>
      <div class="attraction-title">
        <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span>多景点串联规划</span>
        <el-tag size="small" type="warning">{{ spots.length }} 个景点</el-tag>
      </div>
      <div class="topbar-spacer"></div>
      <button class="topbar-btn secondary" @click="handleAutoSort">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
        地理位置排序
      </button>
    </div>

    <!-- 主布局 -->
    <div class="multi-layout">
      <!-- 左：地图 -->
      <div class="map-area">
        <MapView
          :center="mapCenter"
          :markers="spotMarkers"
          :polyline-path="polylinePath"
        />
      </div>

      <!-- 右：景点列表 -->
      <div class="spots-area">
        <div class="spots-header">
          <h3>行程节点</h3>
          <span class="spots-hint">拖拽排序 · 从上到下为行程顺序</span>
        </div>
        <div class="spots-list">
          <div
            v-for="(spot, idx) in spots"
            :key="spot.id"
            class="spot-card"
            :class="{ active: activeSpotIdx === idx }"
            :style="{ '--card-color': spot.color || '#6366f1' }"
            @click="activeSpotIdx = idx"
          >
            <!-- 序号 + 拖拽手柄 -->
            <div class="spot-order">
              <span class="drag-handle-spot">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/>
                </svg>
              </span>
              <span class="spot-step">第{{ idx + 1 }}站</span>
            </div>

            <!-- 景点信息 -->
            <div class="spot-body">
              <span class="spot-emoji">{{ spot.emoji || '📍' }}</span>
              <div class="spot-info">
                <h4 class="spot-name">{{ spot.name }}</h4>
                <div class="spot-meta">
                  <span v-if="spot.region" class="spot-region" :style="{ background: spot.color }">
                    {{ spot.region }}
                  </span>
                  <span v-if="spot.city" class="spot-city">{{ spot.province }}{{ spot.city ? ' · ' + spot.city : '' }}</span>
                  <span v-if="spot.rating" class="spot-rating">⭐ {{ spot.rating }}</span>
                  <span v-if="spot.level" class="spot-level">{{ spot.level }}景区</span>
                </div>
                <p v-if="spot.desc" class="spot-desc">{{ spot.desc }}</p>
              </div>
            </div>

            <!-- 操作 -->
            <div class="spot-actions">
              <button class="spot-btn move-up" :disabled="idx === 0" @click.stop="moveSpot(idx, -1)" title="上移">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
              </button>
              <button class="spot-btn move-down" :disabled="idx === spots.length - 1" @click.stop="moveSpot(idx, 1)" title="下移">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <button class="spot-btn remove" @click.stop="removeSpot(idx)" title="移除">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </button>
            </div>
          </div>

          <div v-if="!spots.length" class="spots-empty">
            <span class="empty-icon">🗺️</span>
            <span>暂无景点，请返回选择</span>
            <el-button type="primary" size="small" @click="$router.back()">返回选择</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部悬浮栏 -->
    <div class="floating-bar">
      <div class="floating-info">
        <span class="route-preview">
          <template v-for="(spot, idx) in spots" :key="spot.id">
            <span v-if="idx > 0" class="route-arrow">→</span>
            <span class="route-stop">{{ spot.name }}</span>
          </template>
        </span>
      </div>
      <el-button
        type="primary"
        size="large"
        :disabled="spots.length < 2"
        :loading="generating"
        @click="handleGenerate"
      >
        生成串联攻略
        <el-icon class="el-icon--right"><Document /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Document } from '@element-plus/icons-vue'
import MapView from '../plan/components/MapView.vue'

const store = useStore()
const router = useRouter()

const generating = ref(false)
const activeSpotIdx = ref(0)

const spots = computed(() => store.state.plan.multiPlanAttractions)

const spotMarkers = computed(() => {
  return spots.value.map((s, i) => ({
    id: s.id,
    name: s.name,
    lng: parseFloat(s.lng) || 0,
    lat: parseFloat(s.lat) || 0,
    type: 'spot',
    label: `${i + 1}`
  }))
})

const polylinePath = computed(() => {
  return spots.value
    .filter(s => s.lng && s.lat)
    .map(s => [parseFloat(s.lng), parseFloat(s.lat)])
})

const mapCenter = computed(() => {
  if (spots.value.length === 0) return [116.397155, 39.916345]
  const valid = spots.value.filter(s => s.lng && s.lat)
  if (valid.length === 0) return [116.397155, 39.916345]
  const avgLng = valid.reduce((s, v) => s + parseFloat(v.lng), 0) / valid.length
  const avgLat = valid.reduce((s, v) => s + parseFloat(v.lat), 0) / valid.length
  return [avgLng, avgLat]
})

onMounted(() => {
  if (spots.value.length < 2) {
    ElMessage.warning('请至少选择 2 个景点进行串联规划')
    router.back()
  }
})

function moveSpot(idx, delta) {
  const newIdx = idx + delta
  if (newIdx < 0 || newIdx >= spots.value.length) return
  const list = [...spots.value]
  ;[list[idx], list[newIdx]] = [list[newIdx], list[idx]]
  store.commit('plan/REORDER_MULTI_ATTRACTIONS', list)
  activeSpotIdx.value = newIdx
}

function removeSpot(idx) {
  const item = spots.value[idx]
  if (item) {
    store.commit('plan/REMOVE_MULTI_ATTRACTION', item.id)
    if (spots.value.length < 2) {
      ElMessage.info('至少需要 2 个景点才能串联规划')
      router.back()
    } else if (activeSpotIdx.value >= spots.value.length) {
      activeSpotIdx.value = spots.value.length - 1
    }
  }
}

function handleAutoSort() {
  const list = [...spots.value]
  list.sort((a, b) => {
    const latA = parseFloat(a.lat) || 0, latB = parseFloat(b.lat) || 0
    if (Math.abs(latA - latB) > 0.01) return latB - latA
    const lngA = parseFloat(a.lng) || 0, lngB = parseFloat(b.lng) || 0
    return lngA - lngB
  })
  store.commit('plan/REORDER_MULTI_ATTRACTIONS', list)
  activeSpotIdx.value = 0
}

async function handleGenerate() {
  if (spots.value.length < 2) return
  generating.value = true
  try {
    // 尝试调用后端多景点规划接口
    const res = await fetch(`${API_BASE}/plan-multi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spots: spots.value })
    })
    const json = await res.json()
    if (json.success && json.data) {
      store.commit('plan/SET_PLAN_RESULT', json.data)
    } else {
      // 后端不可用时，构建本地组合结果
      store.commit('plan/SET_PLAN_RESULT', buildLocalResult())
    }
    router.push('/home/lifeServices/travelGuide/result')
  } catch {
    // 网络错误时，使用本地组合结果
    store.commit('plan/SET_PLAN_RESULT', buildLocalResult())
    router.push('/home/lifeServices/travelGuide/result')
  } finally {
    generating.value = false
  }
}

function buildLocalResult() {
  const sp = spots.value
  const totalBudget = sp.reduce((sum, s) => {
    const costNum = parseInt(String(s.cost || '0').replace(/[^0-9]/g, '')) || 60
    return sum + costNum
  }, 0)

  const timeline = []
  sp.forEach((s, i) => {
    const timeStr = `${String(8 + i * 2).padStart(2, '0')}:00`
    timeline.push({ type: 'section', title: `第${i + 1}站：${s.name}` })
    timeline.push({
      type: 'spot',
      time: timeStr,
      title: s.name,
      description: s.desc || s.address || s.name,
      tips: `建议游玩 2-3 小时${s.level ? `，${s.level}级景区` : ''}${s.rating ? `，评分 ${s.rating}` : ''}`,
      cost: parseInt(String(s.cost || '0').replace(/[^0-9]/g, '')) || 60,
      location: [s.city, s.province, s.region].filter(Boolean).join(' · ')
    })
  })

  return {
    attractionName: sp.map(s => s.name).join(' → '),
    summary: {
      spotsCount: sp.length,
      foodsCount: 0,
      hotelName: '沿途推荐',
      totalBudget
    },
    timeline,
    spots: sp
  }
}

const API_BASE = '/staticTool/api/travel'
</script>

<style lang="scss" scoped>
.multi-plan-page {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 顶栏
.plan-topbar {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  flex-shrink: 0;
  gap: 8px;
}
.attraction-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin-left: 12px;
  .title-icon {
    width: 22px;
    height: 22px;
    color: #ef4444;
    fill: rgba(239, 68, 68, 0.1);
  }
}
.topbar-spacer { flex: 1; }
.topbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: rgba(255, 255, 255, 0.8);
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  svg { width: 16px; height: 16px; }
  &:hover {
    border-color: #6366f1;
    color: #6366f1;
    background: rgba(99, 102, 241, 0.06);
  }
}

// 主布局
.multi-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.map-area {
  flex: 0 0 55%;
  height: 100%;
  padding: 8px 0 8px 8px;
}
.spots-area {
  flex: 1;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 8px 8px 8px 0;
}
.spots-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  flex-shrink: 0;
  h3 { margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; }
}
.spots-hint {
  font-size: 11px;
  color: #94a3b8;
}
.spots-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px 80px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
}

// 景点卡片
.spot-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1.5px solid rgba(226, 232, 240, 0.7);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    border-color: var(--card-color);
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1);
  }
  &.active {
    border-color: var(--card-color);
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.15);
  }
}

.spot-order {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  min-width: 40px;
}
.drag-handle-spot {
  color: #cbd5e1;
  cursor: grab;
  display: flex;
  svg { width: 16px; height: 16px; }
  &:active { cursor: grabbing; }
}
.spot-step {
  font-size: 11px;
  font-weight: 700;
  color: #6366f1;
  white-space: nowrap;
}

.spot-body {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.spot-emoji { font-size: 28px; flex-shrink: 0; line-height: 1.2; }
.spot-info { min-width: 0; }
.spot-name {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.spot-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  margin-bottom: 4px;
}
.spot-region {
  padding: 2px 7px;
  border-radius: 4px;
  color: #fff;
  font-weight: 600;
  font-size: 10px;
}
.spot-city { color: #94a3b8; }
.spot-rating { color: #f59e0b; font-weight: 600; }
.spot-level {
  color: #f59e0b;
  background: #fffbeb;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 600;
  font-size: 10px;
}
.spot-desc {
  margin: 0;
  font-size: 12px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.spot-actions {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex-shrink: 0;
}
.spot-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: none;
  background: rgba(241, 245, 249, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  svg { width: 14px; height: 14px; color: #64748b; }
  &:hover:not(:disabled) { background: rgba(99, 102, 241, 0.1); svg { color: #6366f1; } }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
  &.remove:hover:not(:disabled) { background: #fef2f2; svg { color: #ef4444; } }
}

.spots-empty {
  padding: 48px 20px;
  text-align: center;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  .empty-icon { font-size: 40px; }
}

// 底部悬浮栏
.floating-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(226, 232, 240, 0.6);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 100;
}
.floating-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.route-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
  overflow: hidden;
  white-space: nowrap;
}
.route-arrow {
  color: #6366f1;
  font-weight: 700;
  flex-shrink: 0;
}
.route-stop {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

// 响应式
@media (max-width: 1024px) {
  .multi-layout { flex-direction: column; }
  .map-area { flex: 0 0 280px; padding: 8px 8px 0 8px; }
  .spots-area { flex: 1; padding: 8px; overflow: auto; }
  .spots-list { padding-bottom: 80px; }
  .route-preview { font-size: 12px; }
  .floating-info { display: none; }
}
@media (max-width: 480px) {
  .plan-topbar { padding: 10px 12px; }
  .attraction-title { font-size: 15px; gap: 6px; margin-left: 6px; }
  .topbar-btn { padding: 6px 10px; font-size: 12px; }
  .map-area { flex: 0 0 220px; }
  .spot-name { font-size: 14px; }
  .spot-emoji { font-size: 24px; }
  .spot-desc { display: none; }
}
</style>

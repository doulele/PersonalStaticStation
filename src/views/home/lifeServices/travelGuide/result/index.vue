<template>
  <div class="result-page">
    <!-- 固定顶栏 -->
    <div class="result-topbar">
      <el-button :icon="ArrowLeft" text @click="$router.back()">返回规划</el-button>
      <div class="topbar-title">
        <span class="topbar-title-text">{{ safeSummary.attractionName || planResult?.summary?.attractionName || '行程攻略' }}</span>
        <el-tag type="success" size="small" class="topbar-title-tag">已生成</el-tag>
      </div>
      <div class="topbar-center">
        <!-- 天数切换 -->
        <div v-if="totalDays > 1" class="day-switcher">
          <el-button-group size="small">
            <el-button
              v-for="d in totalDays" :key="d"
              :type="currentDay === d ? 'primary' : 'default'"
              @click="switchDay(d)"
            >第{{ d }}天</el-button>
          </el-button-group>
        </div>
      </div>
      <div class="topbar-spacer"></div>
    </div>

    <!-- 主内容区：左右分栏 -->
    <div v-if="planResult || timelineNodes.length > 0" class="result-body">
      <!-- 左侧：路线地图 -->
      <section class="result-map-section">
        <ResultMapView
          :center="mapCenter"
          :markers="dayMarkers"
          :polyline-path="dayPolylinePath"
          :day-nodes="dayNodes"
          @marker-click="onMarkerClick"
        />
      </section>

      <!-- 右侧：时间线 -->
      <div class="result-timeline-area">

        <!-- 天气预报（公共组件） -->
        <WeatherPanel
          :weather-data="weatherData"
          :loading="weatherLoading"
          :location-name="coastalLocationName"
        />

        <!-- 潮汐预报（公共组件，海滨景点专用） -->
        <TidePanel
          v-if="isCoastal"
          :location-name="coastalLocationName"
        />

        <!-- 预算概览 (Phase 2) -->
        <BudgetOverview :traveler-count="travelerCount" @update:traveler-count="onTravelerCountChange" />

        <!-- 概览卡片 -->
        <div class="overview-card">
          <div class="overview-grid">
            <div class="overview-item">
              <div class="overview-icon spot-bg"><el-icon :size="20"><Flag /></el-icon></div>
              <div class="overview-label">游览景点</div>
              <div class="overview-value">{{ safeSummary.spotsCount }} 个</div>
            </div>
            <div class="overview-item">
              <div class="overview-icon food-bg"><el-icon :size="20"><KnifeFork /></el-icon></div>
              <div class="overview-label">美食推荐</div>
              <div class="overview-value">{{ safeSummary.foodsCount }} 个</div>
            </div>
            <div class="overview-item">
              <div class="overview-icon hotel-bg"><el-icon :size="20"><HomeFilled /></el-icon></div>
              <div class="overview-label">住宿安排</div>
              <div class="overview-value truncate-text">{{ safeSummary.hotelName }}</div>
            </div>
            <div class="overview-item total">
              <div class="overview-icon total-bg"><el-icon :size="20"><Coin /></el-icon></div>
              <div class="overview-label">预估总预算</div>
              <div class="overview-value price">¥{{ safeSummary.totalBudget }}</div>
            </div>
          </div>
        </div>
        
        <!-- 详细行程 -->
        <div class="timeline-section">
          <div class="section-title-row">
            <h2 class="section-title">
              📋 {{ totalDays > 1 ? `第${currentDay}天` : '' }} 详细行程
            </h2>
            <el-button
              class="memo-redirect-btn"
              size="small"
              round
              @click="$router.push('/home/lifeServices/travelMemo')"
            >
              <span class="memo-redirect-btn-icon">📝</span>
              <span class="memo-redirect-btn-text">出行备忘</span>
            </el-button>
          </div>

              <!-- 天标题（不可拖拽） -->
          <div
            v-for="header in dayHeaders"
            :key="header.id"
            class="timeline-section-header"
          >
            <div class="section-dot"></div>
            <h3>{{ header.title }}</h3>
          </div>

          <draggable
                v-model="localNodes"
                item-key="id"
                handle=".timeline-drag-handle"
                ghost-class="timeline-ghost"
                :animation="250"
                @change="onTimelineReorder"
                class="timeline"
              >
                <template #item="{ element }">
                  <div>
                    <!-- 交通过渡 -->
                    <div
                      v-if="element.transportFromPrev && showTransport(element)"
                      class="timeline-transport"
                    >
                      <div class="transport-line"></div>
                      <div class="transport-info">
                        <span>{{ transportIcon(element.transportFromPrev.mode) }}</span>
                        <span>{{ transportLabel(element.transportFromPrev) }}</span>
                      </div>
                    </div>

                    <!-- 酒店/景点/美食节点卡片 -->
                    <div
                      class="timeline-item"
                      :class="itemClass(element)"
                      :id="`timeline-node-${element.id}`"
                    >
                      <div class="timeline-drag-handle" title="拖拽排序">
                        <el-icon :size="16"><Rank /></el-icon>
                      </div>

                      <div class="timeline-time">
                        <span class="time-badge" :class="`${element.type}-badge`">
                          {{ element.startTime || '' }}
                        </span>
                        <span
                          v-if="element.endTime && element.endTime !== element.startTime"
                          class="time-end"
                        >{{ element.endTime }}</span>
                      </div>

                      <div class="timeline-card">
                        <div class="card-left-line" :class="`${element.type}-line`"></div>
                        <div class="card-body">
                          <div class="card-header">
                            <span class="card-type-badge" :class="`${element.type}-type`">
                              {{ nodeTypeLabel(element) }}
                            </span>
                            <span class="card-name" :class="{ 'text-line-through': element.state === 'ignored' }">
                              {{ element.data?.name || '' }}
                            </span>
                            <!-- 用餐时间标记 -->
                            <span v-if="element.type === 'food' && element.mealTag === 'late'" class="meal-warning">
                              🕐 该吃饭啦
                            </span>
                            <span v-else-if="element.type === 'food' && element.mealTag === 'early'" class="meal-info">
                              🕐 稍早了点
                            </span>
                            <!-- 状态标签 -->
                            <el-tag v-if="element.state === 'checked'" size="small" type="success">已打卡</el-tag>
                            <el-tag v-else-if="element.state === 'ignored'" size="small" type="info">已忽略</el-tag>
                          </div>

                          <!-- 描述 -->
                          <p class="card-desc" v-if="element.data?.desc">
                            {{ element.data.desc }}
                          </p>
                          <p class="card-desc" v-else-if="element.type === 'food' && element.data?.recommend_dish">
                            🍽️ 推荐：{{ element.data.recommend_dish }}
                          </p>
                          <p class="card-desc" v-else-if="element.type === 'hotel'">
                            {{ element.role === 'start' ? '🏨 出发！开启一天的旅程' : '🏨 结束一天的旅程，好好休息吧！' }}
                          </p>

                          <!-- 元数据 + 操作 -->
                          <div class="card-actions">
                            <div class="card-meta">
                              <span v-if="element.stayDuration">
                                <el-icon :size="12"><Clock /></el-icon>
                                {{ formatDuration(element.stayDuration) }}
                              </span>
                              <span v-if="element.data?.stay_duration && !element.stayDuration">
                                <el-icon :size="12"><Clock /></el-icon>
                                建议 {{ element.data.stay_duration }} 分钟
                              </span>
                              <span v-if="element.data?.ticket_price !== undefined && element.data?.ticket_price !== null"> · 门票 {{ element.data.ticket_price > 0 ? '¥' + element.data.ticket_price : '免费' }}</span>
                              <span v-if="element.type === 'food' && element.data?.price_per_person" class="price-tag">
                                人均 ¥{{ element.data.price_per_person }}
                              </span>
                            </div>
                            <div class="state-btns">
                              <el-button
                                size="small"
                                :type="element.state === 'checked' ? 'success' : 'default'"
                                :icon="CircleCheckFilled"
                                round
                                @click="toggleNodeState(element, 'checked')"
                              >{{ element.type === 'hotel' ? '入住' : '打卡' }}</el-button>
                              <el-button
                                size="small"
                                :type="element.state === 'ignored' ? 'info' : 'default'"
                                :icon="RemoveFilled"
                                round
                                @click="toggleNodeState(element, 'ignored')"
                              >忽略</el-button>
                              <el-button
                                size="small"
                                :icon="Edit"
                                round
                                :type="nodeNotes[element.id] ? 'warning' : 'default'"
                                @click="toggleNoteEdit(element.id)"
                              >备注</el-button>
                            </div>
                          </div>
                          <!-- 备注编辑区 (Phase 2) -->
                          <div v-if="editingNoteId === element.id" class="note-editor">
                            <el-input
                              v-model="noteDraft"
                              type="textarea"
                              :rows="2"
                              placeholder="添加备注..."
                              size="small"
                              @blur="saveNote(element.id)"
                              @keydown.enter.ctrl="saveNote(element.id)"
                            />
                          </div>
                          <div v-else-if="nodeNotes[element.id]" class="note-display">
                            📝 {{ nodeNotes[element.id] }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </draggable>
            </div>

        <!-- 底部操作 -->
        <div class="result-actions">
          <el-button type="primary" :icon="FolderAdd" size="large" @click="handleSavePlan">保存行程</el-button>
          <el-button :icon="Share" size="large" @click="showExport = true">导出分享</el-button>
          <el-button :icon="RefreshRight" size="large" @click="handleReplan">重新规划</el-button>
          <el-button size="large" @click="$router.push('/home/lifeServices/travelGuide')">回到首页</el-button>
        </div>
      </div>
    </div>

    <!-- 导出弹窗 (Phase 3) -->
    <ExportDialog v-model="showExport" />



    <!-- 调整弹窗 (Phase 3) -->
    <AdjustDialog
      v-model="showAdjust"
      :warnings="adjustWarnings"
      @adjusted="onAdjusted"
    />

    <!-- 无数据 -->
    <div v-if="!planResult && timelineNodes.length === 0" class="empty-result">
      <el-empty description="暂无攻略数据，请先规划行程">
        <el-button type="primary" @click="$router.push('/home/lifeServices/travelGuide')">去规划</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Flag, KnifeFork, HomeFilled, Coin, Clock,
  CircleCheckFilled, RemoveFilled, RefreshRight, Rank,
  Share, FolderAdd, Edit
} from '@element-plus/icons-vue'
import ResultMapView from './components/ResultMapView.vue'
import BudgetOverview from './components/BudgetOverview.vue'
import ExportDialog from './components/ExportDialog.vue'
import AdjustDialog from './components/AdjustDialog.vue'
import WeatherPanel from '../components/WeatherPanel.vue'
import TidePanel from '../components/TidePanel.vue'

const router = useRouter()
const store = useStore()

const planResult = computed(() => store.state.plan.planResult)
const timelineNodes = computed(() => store.state.plan.timelineNodes)
const totalDays = computed(() => store.getters['plan/totalDays'])
const currentDay = computed(() => store.state.plan.currentDay)
const nodeNotes = computed(() => store.state.plan.nodeNotes)
const adjustWarnings = computed(() => store.state.plan.adjustWarnings)
const travelerCount = computed(() => store.state.plan.travelerCount)

// ===== 海滨判断（用于显示潮汐表） =====
const isCoastal = computed(() => {
  // 辅助：判断单个对象是否海滨
  const checkCoastal = (obj) => {
    if (!obj) return false
    const category = (obj.category || '').toLowerCase()
    const features = obj.features || []
    const name = (obj.name || '').toLowerCase()
    return (
      category === '海岛' ||
      category === '海滨' ||
      category === '海岸' ||
      features.some(f => f === '海滨风光' || f === '海岛' || f === '沿海' || f === '海岸') ||
      name.includes('岛') || name.includes('海') || name.includes('滨')
    )
  }

  // 1) 主景点
  if (checkCoastal(store.state.plan.currentAttraction)) return true

  // 2) planResult.summary
  if (checkCoastal(store.state.plan.planResult?.summary)) return true

  // 3) 多景点串联列表
  if (store.state.plan.multiPlanAttractions?.some(a => checkCoastal(a))) return true

  // 4) timelineNodes 中有海滨景点
  const coastalKeywords = ['岛', '海', '滨', '沙滩', '浴场', '潮', '浪']
  if (store.state.plan.timelineNodes?.some(n => {
    if (n.type !== 'spot') return false
    const spotName = (n.data?.name || '').toLowerCase()
    return coastalKeywords.some(kw => spotName.includes(kw))
  })) return true

  return false
})

// 海滨地点名称
const coastalLocationName = computed(() => {
  const name = store.state.plan.currentAttraction?.name
    || store.state.plan.planResult?.summary?.attractionName
    || store.state.plan.multiPlanAttractions?.[0]?.name
    || ''
  return name
})

const showExport = ref(false)
const showAdjust = ref(false)
const editingNoteId = ref(null)
const noteDraft = ref('')

const weatherData = computed(() => store.state.plan.weatherData)
const weatherLoading = computed(() => store.state.plan.weatherLoading)

// ===== 兜底：planResult 不存在时从 timelineNodes 动态计算概览数据 =====
const safeSummary = computed(() => {
  const summary = planResult.value?.summary
  const nodes = timelineNodes.value
  const travCount = Math.max(1, store.state.plan.travelerCount)

  if (summary) {
    // 后端返回的是人均费用，概览卡片展示总额需乘以人数
    return {
      ...summary,
      totalBudget: (summary.totalBudget || 0) * travCount,
      spotBudget: (summary.spotBudget || 0) * travCount,
      foodBudget: (summary.foodBudget || 0) * travCount
    }
  }
  // 降级：从 timelineNodes 计算（均为每人单价）
  const spots = nodes.filter(n => n.type === 'spot')
  const foods = nodes.filter(n => n.type === 'food')
  const hotel = nodes.find(n => n.type === 'hotel' && n.role === 'end')
  const parseCost = (c) => {
    if (!c || c === '免费') return 0
    const m = String(c).match(/(\d+)/)
    return m ? Number(m[1]) : 0
  }
  const mainTicket = parseCost(store.state.plan.currentAttraction?.cost || '')
  const spotBudget = (spots.reduce((s, n) => s + (Number(n.data?.ticket_price) || 0), 0) + mainTicket) * travCount
  const foodBudget = foods.reduce((s, n) => s + (Number(n.data?.price_per_person) || Number(n.data?.avgPrice) || 0), 0) * travCount
  return {
    attractionName: '',
    spotsCount: spots.length,
    foodsCount: foods.length,
    hotelName: hotel?.data?.name || '未选择',
    totalBudget: spotBudget + foodBudget,
    totalDays: totalDays.value
  }
})



// ===== 人数修改 =====
function onTravelerCountChange(count) {
  store.commit('plan/SET_TRAVELER_COUNT', count)
}

// ===== localStorage 持久化 =====
const storageKey = computed(() => {
  const name = planResult.value?.summary?.attractionName || ''
  return `travel_plan_states_v2_${name}`
})

function loadStates() {
  if (!storageKey.value) return
  try {
    const saved = localStorage.getItem(storageKey.value)
    if (saved) {
      const states = JSON.parse(saved)
      // ⚠️ 通过索引访问避免直接修改 Vuex state 破坏响应式
      const nodes = store.state.plan.timelineNodes
      const updated = nodes.map(node => {
        if (states[node.id] && node.state !== states[node.id]) {
          return { ...node, state: states[node.id] }
        }
        return node
      })
      // 只有实际变更时才提交 mutation
      if (updated.some((n, i) => n.state !== nodes[i].state)) {
        store.commit('plan/SET_TIMELINE_NODES', updated)
      }
    }
  } catch { /* ignore */ }
}

function saveStates() {
  if (!storageKey.value) return
  try {
    const states = {}
    store.state.plan.timelineNodes.forEach(node => {
      if (node.state && node.state !== 'pending') {
        states[node.id] = node.state
      }
    })
    localStorage.setItem(storageKey.value, JSON.stringify(states))
  } catch { /* ignore */ }
}

onMounted(async () => {
  // 兜底：旧格式 planResult.timeline → 新格式 timelineNodes
  if (timelineNodes.value.length === 0 && planResult.value?.timeline) {
    const converted = convertOldTimeline(planResult.value.timeline)
    store.commit('plan/SET_TIMELINE_NODES', converted)
  }
  loadStates()

  // Phase 2: 加载离线缓存（无网络时恢复数据）
  if (timelineNodes.value.length === 0 && !planResult.value) {
    const cached = await store.dispatch('plan/loadOfflineCache')
    if (cached) {
      ElMessage.info('📡 已加载离线缓存数据')
    } else {
      // 无缓存且无数据 → 重定向回首页
      ElMessage.warning('未找到行程数据，请重新规划')
      router.replace('/home/lifeServices/travelGuide')
      return
    }
  }

  // Phase 2: 加载天气（仅在数据就绪时）
  tryFetchWeather()

  // Phase 2: 加载潮汐（海滨景点专用）
  if (isCoastal.value) {
    tryFetchTide()
  }
})

// 监听：数据延迟就绪时也触发天气查询
let weatherFetched = false
function tryFetchWeather() {
  // 已有天气数据但没有逐小时 → 需要重新获取
  const needsRefresh = store.state.plan.weatherData && !store.state.plan.weatherData.hourly?.length
  if (!needsRefresh && (weatherFetched || store.state.plan.weatherData)) return
  const hasCoords = timelineNodes.value.some(n => n.data?.lat && n.data?.lng)
    || planResult.value?.summary?.lat
    || store.state.plan.currentAttraction?.lat
  if (!hasCoords) return
  weatherFetched = true
  store.dispatch('plan/fetchWeather').catch(() => {})
}

// 潮汐数据加载
let tideFetched = false
function tryFetchTide() {
  // 已有潮汐数据但缺高潮/低潮数据 → 需要重新获取
  const needsRefresh = store.state.plan.tideData && !store.state.plan.tideData.highTides?.length
  if (!needsRefresh && (tideFetched || store.state.plan.tideData)) return
  const lat = planResult.value?.summary?.lat || store.state.plan.currentAttraction?.lat
  const lng = planResult.value?.summary?.lng || store.state.plan.currentAttraction?.lng
  if (!lat || !lng) return
  tideFetched = true
  store.dispatch('plan/fetchTide', { lat, lng }).catch(() => {})
}

watch([timelineNodes, planResult], () => {
  tryFetchWeather()
  if (isCoastal.value) tryFetchTide()
})
// 监听海滨标记变化，确保潮汐数据及时加载
watch(isCoastal, (val) => {
  if (val) tryFetchTide()
})

/**
 * 将旧格式 result.timeline 转换为统一时间线节点
 */
function convertOldTimeline(timeline) {
  const nodes = []
  let order = 0
  let lastSectionName = ''
  let prevNode = null // 上一节点，用于计算交通过渡
  let currentDay = 1

  for (const item of timeline) {
    if (item.type === 'section') {
      lastSectionName = item.title
      // 检测多天分隔（如"第二天"）
      const dayMatch = item.title?.match(/第(\d+)天/)
      if (dayMatch) {
        currentDay = parseInt(dayMatch[1])
      }
      continue
    }

    const baseNode = {
      day: currentDay,
      order: ++order,
      state: 'pending'
    }

    // 计算交通过渡（如果有上一节点且两者都有坐标）
    let transportFromPrev = null
    if (prevNode && prevNode.data?.lat && prevNode.data?.lng && item.data?.lat && item.data?.lng) {
      transportFromPrev = estimateTransportBetween(prevNode.data, item.data)
    }

    if (item.type === 'spot') {
      const stayDuration = item.data?.stay_duration || 30
      nodes.push({
        ...baseNode,
        id: `spot_${item.data?.name || 'unknown'}_${order}`,
        type: 'spot',
        data: item.data || {},
        startTime: item.time || '',
        endTime: '',
        stayDuration,
        transportFromPrev
      })
    } else if (item.type === 'food') {
      const isLunch = lastSectionName?.includes('午餐')
      const lunchStart = 11 * 60; const lunchEnd = 13 * 60 + 30
      let mealTag = 'on_time'
      if (item.time) {
        const [h, m] = item.time.split(':').map(Number)
        const mins = h * 60 + m
        if (isLunch && mins > lunchEnd) mealTag = 'late'
        else if (isLunch && mins < lunchStart) mealTag = 'early'
        else if (!isLunch && mins > 19 * 60 + 30) mealTag = 'late'
        else if (!isLunch && mins < 17 * 60) mealTag = 'early'
      }
      nodes.push({
        ...baseNode,
        id: `food_${item.data?.name || 'unknown'}_${order}`,
        type: 'food',
        data: item.data || {},
        mealType: isLunch ? 'lunch' : 'dinner',
        mealTag,
        startTime: item.time || '',
        endTime: '',
        transportFromPrev
      })
    } else if (item.type === 'hotel') {
      nodes.push({
        ...baseNode,
        id: `hotel_end_${order}`,
        type: 'hotel',
        role: 'end',
        data: item.data || {},
        startTime: item.time || '21:00',
        endTime: item.time || '21:00',
        transportFromPrev
      })
    }

    // 记录最后一个有坐标的非 section 节点
    if (nodes.length > 0) {
      prevNode = nodes[nodes.length - 1]
    }
  }
  return nodes
}

/**
 * 基于两个节点坐标估算交通方式和时间（Haversine）
 */
function estimateTransportBetween(from, to) {
  const R = 6371000
  const dLat = (to.lat - from.lat) * Math.PI / 180
  const dLng = (to.lng - from.lng) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))

  const transportMode = store.state.plan.transportMode || 'drive'

  let mode, duration
  if (transportMode === 'transit') {
    if (dist < 1500) {
      mode = 'walk'; duration = Math.max(3, Math.round(dist / 80) + 3)
    } else {
      mode = 'transit'; duration = Math.max(15, Math.round(dist / 300) + 15)
    }
  } else {
    // 自驾模式：<1.5km 步行，其余全部驾车
    if (dist < 1500) {
      mode = 'walk'; duration = Math.max(2, Math.round(dist / 80) + 2)
    } else {
      // 自驾 ~48km/h，含红绿灯、找车位等缓冲
      mode = 'drive'; duration = Math.max(5, Math.round(dist / 800) + 5)
    }
  }
  return { mode, distance: dist, duration }
}

// ===== 天数切换 =====
function switchDay(day) {
  store.commit('plan/SET_CURRENT_DAY', day)
}

// ===== 当天节点 =====
const dayNodes = computed(() => {
  return timelineNodes.value.filter(n => (n.day || 1) === currentDay.value)
})

const dayHeaders = computed(() => {
  return timelineNodes.value.filter(n => n.type === 'day_header' && (n.day || 1) === currentDay.value)
})

const localNodes = ref([])
watch(dayNodes, (val) => {
  // 排除 day_header，只保留可排序节点
  localNodes.value = val.filter(n => n.type !== 'day_header')
}, { immediate: true, deep: true })

// ===== 地图数据 =====
const mapCenter = computed(() => {
  const spots = dayNodes.value.filter(n => n.type === 'spot' && n.data?.lat && n.data?.lng)
  if (spots.length > 0) {
    return [spots[0].data.lng, spots[0].data.lat]
  }
  const attr = store.state.plan.currentAttraction
  return attr ? [attr.lng, attr.lat] : [116.397155, 39.916345]
})

const dayMarkers = computed(() => {
  return dayNodes.value
    .filter(n => n.data?.lat && n.data?.lng)
    .map(n => ({
      ...n.data,
      type: n.type,
      id: n.id,
      order: n.order,
      state: n.state || 'pending',
      role: n.role,
      startTime: n.startTime,
      endTime: n.endTime
    }))
})

const dayPolylinePath = computed(() => {
  const ordered = dayNodes.value
    .filter(n => n.data?.lat && n.data?.lng)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
  return ordered.map(n => [n.data.lng, n.data.lat])
})

function onMarkerClick(nodeId) {
  // 滚动到对应的时间线卡片
  const el = document.getElementById(`timeline-node-${nodeId}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight-flash')
    setTimeout(() => el.classList.remove('highlight-flash'), 1500)
  }
}

// ===== 节点状态切换 =====
function toggleNodeState(node, action) {
  const nextState = node.state === action ? 'pending' : action
  store.commit('plan/UPDATE_TIMELINE_NODE_STATE', { nodeId: node.id, status: nextState })
  saveStates()
  // Phase 2: 缓存到 localStorage
  store.dispatch('plan/cachePlanOffline').catch(() => {})
  if (nextState === 'checked') {
    ElMessage.success(action === 'checked' ? '已打卡！' : '已入住！')
    // Phase 3: 检查是否需要调整
    checkAdjustNeed(node)
  }
}

// ===== Phase 3: 检查打卡偏差 =====
function checkAdjustNeed(checkedNode) {
  if (!checkedNode.startTime) return
  const now = new Date()
  const planned = parseTimeToMinutes(checkedNode.startTime) + (checkedNode.stayDuration || 30)
  const actual = now.getHours() * 60 + now.getMinutes()
  const offset = actual - planned // 正=迟到，负=提前

  if (Math.abs(offset) > 30) {
    showAdjust.value = true
    store.commit('plan/SET_NEED_ADJUST', true)
    store.commit('plan/SET_ADJUST_WARNINGS', [
      `实际时间偏差${Math.abs(offset)}分钟(${offset > 0 ? '迟到' : '提前'})`,
      '建议调整后续行程时间安排'
    ])
  }
}

function parseTimeToMinutes(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function onAdjusted() {
  saveStates()
  store.dispatch('plan/cachePlanOffline').catch(() => {})
}

// ===== 备注功能 (Phase 2) =====
function toggleNoteEdit(nodeId) {
  if (editingNoteId.value === nodeId) {
    editingNoteId.value = null
    return
  }
  editingNoteId.value = nodeId
  noteDraft.value = nodeNotes.value[nodeId] || ''
}

function saveNote(nodeId) {
  const note = noteDraft.value.trim()
  if (note) {
    store.commit('plan/SET_NODE_NOTE', { nodeId, note })
  } else {
    store.commit('plan/DELETE_NODE_NOTE', nodeId)
  }
  editingNoteId.value = null
  // Phase 2: 缓存
  store.dispatch('plan/cachePlanOffline').catch(() => {})
}

// ===== 保存行程 (Phase 3) =====
async function handleSavePlan() {
  try {
    await store.dispatch('plan/savePlan', planResult.value?.summary?.attractionName || '未命名行程')
    ElMessage.success(`行程已保存`)
  } catch {
    ElMessage.warning('保存失败，请稍后重试')
  }
}

// ===== 拖拽排序 =====
function onTimelineReorder() {
  // 为重新排序后的节点分配新 order
  const updatedNodes = [...localNodes.value].map((node, index) => ({
    ...node,
    order: index + 1
  }))
  // 保留其他天的节点和 day_headers，只替换当前天的可排序节点
  const otherNodes = timelineNodes.value.filter(n =>
    n.type === 'day_header' || (n.day || 1) !== currentDay.value
  )
  store.commit('plan/SET_TIMELINE_NODES', [...otherNodes, ...updatedNodes])
  ElMessage.success('行程顺序已更新，可点击"重新规划"刷新时间')
}

// ===== 工具函数 =====
function nodeTypeLabel(node) {
  if (node.type === 'hotel') return node.role === 'start' ? '出发' : '住宿'
  if (node.type === 'food') return node.mealType === 'lunch' ? '午餐' : '晚餐'
  return '景点'
}

function itemClass(node) {
  return {
    'state-checked': node.state === 'checked',
    'state-ignored': node.state === 'ignored',
    'node-hotel': node.type === 'hotel',
    'node-spot': node.type === 'spot',
    'node-food': node.type === 'food'
  }
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return ''
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
}

function showTransport(node) {
  // 只有距离有效（数字且 > 0）才显示交通信息
  const d = node.transportFromPrev?.distance
  return typeof d === 'number' && d > 0 && d < 500000 // 500km 上限，过滤异常值
}

function transportIcon(mode) {
  const icons = { walk: '🚶', transit: '🚌', drive: '🚗' }
  return icons[mode] || '🚶'
}

function transportLabel(transport) {
  if (!transport) return ''
  const rawDist = transport.distance || 0
  const rawDur = transport.duration || 0
  const dist = rawDist >= 1000
    ? `${(rawDist / 1000).toFixed(1)}km`
    : `${Math.round(rawDist)}m`
  // 超过120分钟转为小时显示; 对duration取整防止浮点数
  const dur = Math.round(rawDur)
  const time = dur > 0
    ? (dur >= 120 ? `约${(dur / 60).toFixed(1)}小时` : `约${dur}分钟`)
    : ''
  return `${dist} · ${time}`
}

function handleReplan() {
  const id = store.state.plan.currentAttraction?.id
  if (id) {
    router.push(`/home/lifeServices/travelGuide/plan/${id}`)
  } else {
    router.push('/home/lifeServices/travelGuide')
  }
}
</script>

<style lang="scss" scoped>
.result-page {
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f1f5f9;
}

// ========== 顶栏 ==========
.result-topbar {
  display: flex;
  align-items: center;
  padding: 10px 24px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  z-index: 10;
  flex-shrink: 0;
}
.topbar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 600;
  color: #0f172a;
  margin-left: 14px;
}
.topbar-center { flex: 1; display: flex; justify-content: center; }
.topbar-spacer { flex: 1; }

.day-switcher {
  .el-button-group { box-shadow: 0 1px 4px rgba(0,0,0,0.06); border-radius: 8px; overflow: hidden; }
}

// ========== 主内容区 ==========
.result-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: 0;
}

// 左侧地图
.result-map-section {
  flex: 0 0 45%;
  height: 100%;
  border-right: 1px solid #e2e8f0;
  background: #f1f5f9;
}

// 右侧时间线
.result-timeline-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 80px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
}

// ========== 概览卡片 ==========
.overview-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.03);
}
.overview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.overview-item {
  text-align: center;
  &.total { border-left: 1px solid #e2e8f0; padding-left: 12px; }
}
.overview-icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 6px;
  &.spot-bg { background: #fef2f2; color: #ef4444; }
  &.food-bg { background: #f0fdf4; color: #10b981; }
  &.hotel-bg { background: #eff6ff; color: #3b82f6; }
  &.total-bg { background: #eef2ff; color: #6366f1; }
}
.overview-label { font-size: 11px; color: #94a3b8; margin-bottom: 2px; }
.overview-value { font-size: 15px; font-weight: 600; color: #0f172a;
  &.price { color: #6366f1; }
}
.truncate-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100px; margin: 0 auto; }

// ========== 时间线 ==========
.timeline-section { margin-bottom: 20px; }

// 标题行：标题 + 备忘按钮同行
.section-title-row {
  display: flex; align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}
.section-title { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 0; }

// 出行备忘跳转按钮
.memo-redirect-btn {
  flex-shrink: 0;
  height: 34px;
  padding: 6px 18px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1.5px solid #f59e0b;
  color: #92400e;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.5px;
  border-radius: 20px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(245, 158, 11, 0.15);

  &:hover {
    background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
    border-color: #d97706;
    color: #78350f;
    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(245, 158, 11, 0.2);
  }
}
.memo-redirect-btn-icon {
  margin-right: 4px;
  font-size: 15px;
  line-height: 1;
}
.memo-redirect-btn-text {
  font-size: 13px;
}

.timeline-section-header {
  display: flex; align-items: center; gap: 10px;
  margin: 20px 0 12px; padding-left: 4px;
  &:first-child { margin-top: 0; }
  h3 { font-size: 15px; font-weight: 600; color: #6366f1; margin: 0; }
}
.section-dot { width: 8px; height: 8px; border-radius: 50%; background: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }

.timeline-ghost { opacity: 0.4; border: 2px dashed #6366f1 !important; border-radius: 12px; }

// 交通过渡
.timeline-transport {
  display: flex; align-items: center; gap: 8px; padding: 6px 0 6px 52px;
}
.transport-line { width: 2px; height: 18px; background: #cbd5e1; border-radius: 1px; }
.transport-info {
  font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 4px;
}

// 时间线条目
.timeline-item {
  display: flex; align-items: flex-start; gap: 10px;
  margin-bottom: 10px; transition: all 0.3s; position: relative;
  &:hover .timeline-drag-handle { opacity: 1; }

  &.state-checked .timeline-card { background: #f0fdf4; border-color: #86efac; }
  &.state-ignored .timeline-card { opacity: 0.5; }
}

.timeline-drag-handle {
  opacity: 0; cursor: grab; padding: 6px 2px; color: #94a3b8;
  flex-shrink: 0; border-radius: 4px; transition: all 0.15s;
  align-self: center;
  &:hover { color: #6366f1; background: #eef2ff; }
  &:active { cursor: grabbing; }
}

.timeline-time {
  width: 52px; flex-shrink: 0; display: flex; flex-direction: column;
  align-items: flex-end; gap: 2px; padding-top: 4px;
}
.time-badge {
  font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 5px;
  &.spot-badge { background: #fef2f2; color: #ef4444; }
  &.food-badge { background: #f0fdf4; color: #10b981; }
  &.hotel-badge { background: #eff6ff; color: #3b82f6; }
}
.time-end { font-size: 10px; color: #94a3b8; }

.timeline-card {
  flex: 1; display: flex; background: #fff;
  border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;
  transition: all 0.2s;
}
.card-left-line { width: 3px; flex-shrink: 0;
  &.spot-line { background: #ef4444; }
  &.food-line { background: #10b981; }
  &.hotel-line { background: #3b82f6; }
}
.card-body { flex: 1; padding: 12px 14px; min-width: 0; }

.card-header {
  display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap;
}
.card-type-badge {
  font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px;
  &.spot-type { background: #fef2f2; color: #dc2626; }
  &.food-type { background: #f0fdf4; color: #059669; }
  &.hotel-type { background: #eff6ff; color: #2563eb; }
}
.card-name { font-size: 14px; font-weight: 600; color: #0f172a; }
.text-line-through { text-decoration: line-through; color: #94a3b8; }

.meal-warning { font-size: 10px; color: #dc2626; font-weight: 500; background: #fee2e2; padding: 1px 6px; border-radius: 8px; }
.meal-info { font-size: 10px; color: #92400e; font-weight: 500; background: #fef3c7; padding: 1px 6px; border-radius: 8px; }

.card-desc { font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 8px; }

.card-actions {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 6px;
}
.card-meta { font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 3px;
  .price-tag { color: #10b981; font-weight: 600; }
}
.state-btns { display: flex; gap: 4px; }

// 高亮闪烁
.highlight-flash {
  animation: highlightPulse 1.5s ease-out;
}

// 备注编辑
.note-editor { margin-top: 8px; }
.note-display {
  margin-top: 8px; padding: 6px 10px; background: #fffbeb; border: 1px solid #fde68a;
  border-radius: 6px; font-size: 12px; color: #92400e; line-height: 1.5;
}

// ========== 底部操作 ==========
.result-actions {
  display: flex; justify-content: center; align-items: center;
  gap: 10px;
  padding: 20px 24px 16px;
  margin-top: 20px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;

  .el-button {
    border-radius: 10px;
    font-weight: 500;
    letter-spacing: 0.3px;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    &:active {
      transform: translateY(0);
    }
  }

  // 主要按钮（保存）更突出
  .el-button--primary {
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
    padding: 0 24px;

    &:hover {
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
    }
  }
}
@keyframes highlightPulse {
  0%, 100% { box-shadow: none; }
  50% { box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.3); background: #eef2ff; }
}
.empty-result { padding: 80px 20px; }

// ========== 响应式 ==========
@media (max-width: 1024px) {
  .result-body { flex-direction: column; }
  .result-map-section {
    flex: 0 0 280px; border-right: none; border-bottom: 1px solid #e2e8f0;
    position: relative;
  }
  .result-timeline-area { padding: 16px; }
}

@media (max-width: 768px) {
  // ---- 页面容器 ----
  .result-page {
    height: 100vh; height: 100dvh;
    background: #f8fafc;
  }

  // ---- 顶栏：紧凑双行 ----
  .result-topbar {
    flex-wrap: wrap; gap: 4px;
    padding: 6px 8px 4px;
    position: sticky; top: 0; z-index: 20;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .topbar-title {
    font-size: 13px; margin-left: 0; order: 1;
    flex: 1; min-width: 0; gap: 4px;
    .topbar-title-text {
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .topbar-title-tag {
      flex-shrink: 0;
      font-size: 10px !important;
      padding: 0 5px !important;
      height: 18px !important;
      line-height: 18px !important;
    }
  }
  .topbar-center {
    order: 3; flex: 1 1 100%; justify-content: center;
    padding-top: 4px;
  }
  .topbar-spacer { display: none; }
  // 返回按钮只显示图标
  .result-topbar > .el-button--text {
    order: 0; padding: 4px 2px; min-width: auto;
    font-size: 14px;
    // 隐藏文字，只显示图标
    :deep(span + span) { display: none; }
  }
  .day-switcher .el-button { font-size: 11px; padding: 3px 8px; }

  // ---- 主体 ----
  .result-body { flex-direction: column; }

  // ---- 地图：可折叠 ----
  .result-map-section {
    flex: 0 0 200px; min-height: 160px; max-height: 200px;
    border-right: none; border-bottom: 2px solid #e2e8f0;
    transition: max-height 0.3s ease;
    overflow: hidden;
    &.map-expanded { max-height: 60vh; }
    &:active { max-height: 60vh; } // 长按展开（简化实现）
  }

  // ---- 右侧区域 ----
  .result-timeline-area {
    padding: 12px 12px 100px; // 底部留空间给固定操作栏
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar { width: 0; } // 隐藏滚动条省空间
  }

  // ---- 预算组件 ----
  .budget-overview {
    margin-bottom: 10px;
  }

  // ---- 概览卡片 ----
  .overview-card {
    padding: 14px 12px; margin-bottom: 14px; border-radius: 12px;
  }
  .overview-grid {
    grid-template-columns: repeat(4, 1fr); gap: 6px;
  }
  .overview-item {
    &.total { border-left: 1px solid #e2e8f0; padding-left: 6px; }
  }
  .overview-icon {
    width: 34px; height: 34px; border-radius: 8px; margin-bottom: 4px;
    .el-icon { font-size: 16px !important; }
  }
  .overview-label { font-size: 10px; }
  .overview-value { font-size: 13px; }
  .truncate-text { max-width: 60px; }

  // ---- 时间线标题 ----
  .section-title-row {
    flex-wrap: wrap; gap: 8px; margin-bottom: 12px;
  }
  .section-title {
    font-size: 15px; margin-bottom: 0; padding: 0 2px;
  }
  .memo-redirect-btn {
    font-size: 11px; padding: 5px 12px; height: 30px;
    .memo-redirect-btn-icon { font-size: 13px; }
    .memo-redirect-btn-text { font-size: 11px; }
  }
  .timeline-section { margin-bottom: 12px; }

  // ---- 时间线条目 ----
  .timeline-item {
    gap: 6px; margin-bottom: 8px;
  }
  .timeline-drag-handle {
    opacity: 0.45; // 移动端始终半可见
    padding: 8px 2px; // 增大触摸区域
    &:active { opacity: 1; color: #6366f1; }
  }
  .timeline-time {
    width: 40px; gap: 1px;
  }
  .time-badge {
    font-size: 10px; padding: 1px 5px; border-radius: 4px;
  }
  .time-end { font-size: 9px; }
  .timeline-card { border-radius: 8px; }
  .card-left-line { width: 3px; }
  .card-body { padding: 10px 11px; }

  .card-header { gap: 4px; margin-bottom: 4px; }
  .card-type-badge { font-size: 9px; padding: 1px 5px; }
  .card-name { font-size: 13px; }
  .card-desc {
    font-size: 11px; line-height: 1.4; margin-bottom: 6px;
  }

  .card-actions {
    flex-direction: column; align-items: flex-start; gap: 6px;
  }
  .card-meta { font-size: 10px; }
  .state-btns {
    width: 100%; gap: 6px;
    .el-button {
      flex: 1; font-size: 11px; padding: 6px 8px;
      min-height: 32px; // 触摸友好
    }
  }

  // ---- 交通过渡 ----
  .timeline-transport {
    padding: 4px 0 4px 44px;
  }
  .transport-info { font-size: 10px; }
  .transport-line { height: 14px; }

  // ---- 天标题 ----
  .timeline-section-header {
    margin: 14px 0 8px; gap: 6px;
    h3 { font-size: 13px; }
  }
  .section-dot { width: 6px; height: 6px; }

  // ---- 底部操作：固定 ----
  .result-actions {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 15;
    background: rgba(255,255,255,0.94); backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid #e2e8f0;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.05);
    padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
    margin-top: 0; gap: 6px;
    flex-wrap: nowrap;

    .el-button {
      font-size: 12px; padding: 10px 4px;
      flex: 1; min-width: 0; white-space: nowrap;
      border-radius: 8px; font-weight: 500;
    }

    // 主按钮保留阴影
    .el-button--primary {
      box-shadow: 0 1px 4px rgba(99, 102, 241, 0.2);
    }
  }

  // ---- 打卡高亮适配 ----
  .highlight-flash {
    animation: highlightPulseMobile 1.5s ease-out;
  }
  @keyframes highlightPulseMobile {
    0%, 100% { box-shadow: none; }
    50% { box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.15); background: #eef2ff; }
  }

  // ---- 备注 ----
  .note-display { font-size: 11px; padding: 5px 8px; }
  .note-editor :deep(.el-textarea__inner) { font-size: 12px; }

  // ---- 空状态 ----
  .empty-result { padding: 60px 16px; }
}

// ---- 超小屏 (< 375px) 额外收紧 ----
@media (max-width: 374px) {
  .overview-grid { gap: 4px; }
  .overview-icon { width: 28px; height: 28px; border-radius: 7px; }
  .overview-label { font-size: 9px; }
  .overview-value { font-size: 11px; }
  .timeline-time { width: 34px; }
  .time-badge { font-size: 9px; padding: 1px 4px; }
  .card-name { font-size: 12px; }
  .state-btns .el-button { font-size: 10px; padding: 5px 6px; min-height: 28px; }
}

// ==================== 夜间模式 ====================
:global(html.dark-mode .result-page) {
  background: #0f0f1a;
}

:global(html.dark-mode) {
  // 顶栏
  .result-topbar { background: #1a1a2e; border-bottom-color: #2d2d4a; }
  .topbar-title { color: #e2dee9; }

  // 地图
  .result-map-section { border-right-color: #2d2d4a; background: #0f0f1a; }
  .result-timeline-area {
    &::-webkit-scrollbar-thumb { background: #3d3d5c; }
  }

  // 概览卡片
  .overview-card { background: #1a1a2e; border-color: #2d2d4a; box-shadow: 0 1px 8px rgba(0,0,0,0.15); }
  .overview-item.total { border-left-color: #2d2d4a; }
  .overview-icon {
    &.spot-bg { background: #2a1515; color: #f87171; }
    &.food-bg { background: #0a2a1a; color: #4ade80; }
    &.hotel-bg { background: #0a1a3a; color: #60a5fa; }
    &.total-bg { background: #1a1a3e; color: #a78bfa; }
  }
  .overview-label { color: #64748b; }
  .overview-value { color: #e2dee9; &.price { color: #a78bfa; } }

  // 时间线
  .section-title { color: #e2dee9; }
  .timeline-section-header h3 { color: #a78bfa; }
  .section-dot { box-shadow: 0 0 0 3px rgba(167,139,250,0.2); }

  // 备忘录按钮
  .memo-redirect-btn {
    background: linear-gradient(135deg, #2e1f0a 0%, #3d2a1a 100%);
    border-color: #5c3d1a; color: #fbbf24;
    &:hover { background: linear-gradient(135deg, #3d2a1a 0%, #4a3018 100%); border-color: #7c4d1a; color: #f59e0b; }
  }

  // 交通过渡
  .transport-line { background: #4a4a6a; }
  .transport-info { color: #64748b; }

  // 时间线条目
  .timeline-item {
    &.state-checked .timeline-card { background: #0a2a1a; border-color: #1a5c3a; }
    &.state-ignored .timeline-card { opacity: 0.4; }
  }
  .timeline-drag-handle { color: #4a4a6a; &:hover { color: #a78bfa; background: #1e1e3c; } }
  .time-badge {
    &.spot-badge { background: #2a1515; color: #f87171; }
    &.food-badge { background: #0a2a1a; color: #4ade80; }
    &.hotel-badge { background: #0a1a3a; color: #60a5fa; }
  }
  .time-end { color: #64748b; }
  .timeline-card { background: #1a1a2e; border-color: #2d2d4a; }
  .card-body { padding: 12px 14px; }
  .card-type-badge {
    &.spot-type { background: #2a1515; color: #fca5a5; }
    &.food-type { background: #0a2a1a; color: #6ee7b7; }
    &.hotel-type { background: #0a1a3a; color: #93c5fd; }
  }
  .card-name { color: #e2dee9; }
  .text-line-through { color: #64748b; }
  .meal-warning { background: #3b1010; color: #fca5a5; }
  .meal-info { background: #2e1f0a; color: #fbbf24; }
  .card-desc { color: #94a3b8; }
  .card-meta { color: #64748b; .price-tag { color: #4ade80; } }

  // 备注
  .note-display { background: #2e1f0a; border-color: #5c3d1a; color: #fbbf24; }

  // 底部操作
  .result-actions {
    border-top-color: #2d2d4a; background: #14142e;
  }

  // 高亮
  .highlight-flash {
    animation: highlightPulseDark 1.5s ease-out;
  }
  @keyframes highlightPulseDark {
    0%, 100% { box-shadow: none; }
    50% { box-shadow: 0 0 0 4px rgba(167,139,250,0.3); background: #1e1e3c; }
  }

  // 移动端底部操作栏
  @media (max-width: 768px) {
    .result-actions {
      background: rgba(19,19,42,0.94);
      border-top-color: #2d2d4a;
    }
  }

  // 空状态
  .empty-result { background: #0f0f1a; }
}
</style>

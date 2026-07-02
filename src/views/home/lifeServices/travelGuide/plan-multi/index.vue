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
          @click="handleBasicRecommend"
        >
          <el-icon :size="16"><Select /></el-icon>
          <span class="toggle-label">基础</span>
        </button>
        <button
          class="toggle-option ai"
          :class="{ active: recommendMode === 'ai' }"
          @click="handleAiRecommend"
        >
          <el-icon :size="16"><MagicStick /></el-icon>
          <span class="toggle-label">AI</span>
        </button>
      </div>
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

      <!-- 右：面板 -->
      <div class="spots-area">
        <!-- 子标签切换 -->
        <div class="sub-tabs">
          <button
            class="sub-tab"
            :class="{ active: activeSubTab === 'spots' }"
            @click="activeSubTab = 'spots'"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            行程节点
          </button>
          <button
            class="sub-tab"
            :class="{ active: activeSubTab === 'foodHotel' }"
            @click="activeSubTab = 'foodHotel'"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
            美食住宿
          </button>
        </div>

        <!-- 行程节点面板 -->
        <template v-if="activeSubTab === 'spots'">
          <div class="spots-header">
            <h3>行程节点</h3>
            <span class="spots-hint">点击大景点展开子景点 · 从上到下为行程顺序</span>
          </div>
          <div class="spots-list">
            <template v-for="(spot, idx) in spots" :key="spot.id">
              <div
                class="spot-card"
                :class="{ active: activeSpotIdx === idx }"
                :style="{ '--card-color': spot.color || '#6366f1' }"
                @click="openSpotSubPanel(idx)"
              >
                <div class="spot-order">
                  <span class="drag-handle-spot">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/>
                    </svg>
                  </span>
                  <span class="spot-step">第{{ idx + 1 }}站</span>
                </div>
                <div class="spot-body">
                  <span class="spot-emoji">{{ spot.emoji || '📍' }}</span>
                  <div class="spot-info">
                    <h4 class="spot-name">{{ spot.name }}</h4>
                    <div class="spot-meta">
                      <span v-if="spot.region" class="spot-region" :style="{ background: spot.color }">{{ spot.region }}</span>
                      <span v-if="spot.city" class="spot-city">{{ spot.province }}{{ spot.city ? ' · ' + spot.city : '' }}</span>
                      <span v-if="spot.rating" class="spot-rating">⭐ {{ spot.rating }}</span>
                      <span v-if="spot.level" class="spot-level">{{ spot.level }}景区</span>
                    </div>
                    <p v-if="spot.desc" class="spot-desc">{{ spot.desc }}</p>
                  </div>
                </div>
                <div class="spot-actions">
                  <span v-if="getSubSpotCount(spot.id) > 0" class="sub-count-badge">{{ getSubSpotCount(spot.id) }}个子景点</span>
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

              <!-- 子景点展开面板 -->
              <div v-if="activeSpotIdx === idx" class="sub-spot-panel">
                <!-- 搜索添加子景点 -->
                <div class="sub-spot-search">
                  <el-input
                    v-model="subSearchKeyword"
                    :placeholder="'搜索「' + spot.name + '」的子景点...'"
                    size="small"
                    clearable
                    :prefix-icon="Search"
                    @keyup.enter.prevent="addSubSpotByName"
                  >
                    <template #append>
                      <el-button :icon="Plus" :disabled="!subSearchKeyword.trim()" @click="addSubSpotByName" />
                    </template>
                  </el-input>
                  <div v-if="subSuggestions.length > 0" class="sub-spot-suggestions">
                    <div
                      v-for="item in subSuggestions"
                      :key="item.value"
                      class="sub-suggest-item"
                      @click="addSubSpotFromSuggestion(item)"
                    >
                      <span class="sug-name">{{ item.value }}</span>
                      <span class="sug-type">{{ item.typeStr }}</span>
                      <span v-if="item.distance" class="sug-dist">{{ item.distance }}</span>
                    </div>
                  </div>
                </div>

                <!-- 推荐子景点 -->
                <div v-if="subRecommendations.length > 0" class="sub-recommend-section">
                  <div class="sub-section-title">推荐子景点 · 点选添加</div>
                  <div class="sub-recommend-list">
                    <div
                      v-for="rec in subRecommendations"
                      :key="rec.id"
                      class="sub-recommend-card"
                      :class="{ added: isSubSpotAdded(rec) }"
                      @click="!isSubSpotAdded(rec) && addSubSpotFromRecommend(rec)"
                    >
                      <div class="sub-rec-info">
                        <span class="sub-rec-name">{{ rec.name }}</span>
                        <span v-if="rec.typeStr" class="sub-rec-type">{{ rec.typeStr }}</span>
                      </div>
                      <span v-if="isSubSpotAdded(rec)" class="sub-rec-added">已添加</span>
                      <span v-else class="sub-rec-click-hint">+ 点击添加</span>
                    </div>
                  </div>
                </div>

                <!-- 已选子景点列表 -->
                <div v-if="getCurrentSubSpots().length > 0" class="sub-selected-section">
                  <div class="sub-section-title">
                    已选子景点
                    <span class="sub-selected-count">{{ getCurrentSubSpots().length }} 个</span>
                  </div>
                  <div class="sub-selected-list">
                    <div
                      v-for="(sub, si) in getCurrentSubSpots()"
                      :key="sub.id"
                      class="sub-selected-card"
                    >
                      <span class="sub-index">{{ si + 1 }}</span>
                      <div class="sub-info">
                        <span class="sub-name">{{ sub.name }}</span>
                        <span v-if="sub.highlight" class="sub-highlight">{{ sub.highlight }}</span>
                      </div>
                      <button class="sub-btn edit" @click.stop="openSubEditDialog(sub)" title="编辑">
                        <el-icon :size="13"><Edit /></el-icon>
                      </button>
                      <button class="sub-btn remove" @click.stop="removeSubSpot(sub.id)" title="删除">
                        <el-icon :size="13"><Close /></el-icon>
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else class="sub-empty-hint">
                  上方搜索或点选推荐节点，为「{{ spot.name }}」添加子景点
                </div>

                <!-- 收起按钮 -->
                <div class="sub-collapse-btn" @click="activeSpotIdx = null">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
                  <span>收起</span>
                </div>
              </div>
            </template>

            <div v-if="!spots.length" class="spots-empty">
              <span class="empty-icon">🗺️</span>
              <span>暂无景点，请返回选择</span>
              <el-button type="primary" size="small" @click="$router.back()">返回选择</el-button>
            </div>
          </div>
        </template>

        <!-- 美食住宿面板 -->
        <template v-if="activeSubTab === 'foodHotel'">
          <div class="fh-scroll">
            <!-- ===== 美食推荐 ===== -->
            <div class="fh-section">
              <div class="fh-section-header">
                <span class="fh-icon food-icon">
                  <el-icon :size="18"><KnifeFork /></el-icon>
                </span>
                <h4 class="fh-title">特色美食</h4>
                <span class="fh-badge">{{ selectedFoods.length }} 个已选</span>
              </div>

              <!-- 搜索添加 -->
              <div class="fh-search">
                <el-input
                  v-model="foodSearchKeyword"
                  placeholder="搜索美食..."
                  size="small"
                  clearable
                  :prefix-icon="Search"
                  @keyup.enter.prevent="addFoodByName"
                >
                  <template #append>
                    <el-button :icon="Plus" :disabled="!foodSearchKeyword.trim()" @click="addFoodByName" />
                  </template>
                </el-input>
                <div v-if="foodSuggestions.length > 0" class="fh-suggestions">
                  <div
                    v-for="item in foodSuggestions"
                    :key="item.value"
                    class="fh-suggest-item"
                    @click="addFoodFromSuggestion(item)"
                  >
                    <span class="sug-name">{{ item.value }}</span>
                    <span class="sug-type">{{ item.typeStr }}</span>
                    <span v-if="item.distance" class="sug-dist">{{ item.distance }}</span>
                  </div>
                </div>
              </div>

              <!-- 推荐美食列表 -->
              <div v-if="availableFoods.length > 0" class="fh-recommend-section">
                <div class="fh-recommend-header">
                  <span class="fh-recommend-label">推荐美食</span>
                  <span class="fh-recommend-count">{{ availableFoods.length }} 个可选</span>
                </div>
                <div class="fh-recommend-list">
                  <div
                    v-for="food in availableFoods"
                    :key="food.id"
                    class="fh-recommend-card"
                    @click="addFoodFromRecommend(food)"
                  >
                    <div class="fh-rec-info">
                      <div class="fh-rec-name">
                        <span class="fh-rec-name-text">{{ food.name }}</span>
                        <span v-if="food.price_per_person" class="fh-rec-price">¥{{ food.price_per_person }}/人</span>
                      </div>
                      <div v-if="food.highlight || food.recommend_dish" class="fh-rec-desc">{{ food.highlight || '推荐：' + food.recommend_dish }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else-if="allFoodsLoaded" class="fh-empty">该区域暂无美食推荐，请尝试搜索</div>

              <!-- 已选美食 -->
              <div v-if="selectedFoods.length > 0" class="fh-selected">
                <div v-for="(food, idx) in selectedFoods" :key="food.id" class="fh-selected-card food">
                  <span class="fh-index">{{ idx + 1 }}</span>
                  <span class="fh-name">{{ food.name }}</span>
                  <span v-if="food.price_per_person" class="fh-price">¥{{ food.price_per_person }}/人</span>
                  <button class="fh-remove-btn" @click="removeFood(food.id)">
                    <el-icon :size="14"><Close /></el-icon>
                  </button>
                </div>
              </div>
              <div v-else class="fh-empty">搜索上方或点选推荐美食添加</div>
            </div>

            <!-- ===== 住宿推荐 ===== -->
            <div class="fh-section">
              <div class="fh-section-header">
                <span class="fh-icon hotel-icon">
                  <el-icon :size="18"><HomeFilled /></el-icon>
                </span>
                <h4 class="fh-title">住宿安排</h4>
                <span class="fh-badge" :class="{ selected: selectedHotel }">{{ selectedHotel ? '已选' : '未选' }}</span>
              </div>

              <!-- 搜索添加 -->
              <div class="fh-search">
                <el-input
                  v-model="hotelSearchKeyword"
                  placeholder="搜索酒店..."
                  size="small"
                  clearable
                  :prefix-icon="Search"
                  @keyup.enter.prevent="addHotelByName"
                >
                  <template #append>
                    <el-button :icon="Plus" :disabled="!hotelSearchKeyword.trim()" @click="addHotelByName" />
                  </template>
                </el-input>
                <div v-if="hotelSuggestions.length > 0" class="fh-suggestions">
                  <div
                    v-for="item in hotelSuggestions"
                    :key="item.value"
                    class="fh-suggest-item"
                    @click="addHotelFromSuggestion(item)"
                  >
                    <span class="sug-name">{{ item.value }}</span>
                    <span class="sug-type">{{ item.typeStr }}</span>
                    <span v-if="item.distance" class="sug-dist">{{ item.distance }}</span>
                  </div>
                </div>
              </div>

              <!-- 推荐酒店列表 -->
              <div v-if="availableHotels.length > 0" class="fh-recommend-section">
                <div class="fh-recommend-header">
                  <span class="fh-recommend-label">推荐住宿</span>
                  <span class="fh-recommend-count">{{ availableHotels.length }} 个可选</span>
                </div>
                <div class="fh-recommend-list">
                  <div
                    v-for="hotel in availableHotels"
                    :key="hotel.id"
                    class="fh-recommend-card"
                    @click="addHotelFromRecommend(hotel)"
                  >
                    <div class="fh-rec-info">
                      <div class="fh-rec-name">
                        <span class="fh-rec-name-text">{{ hotel.name }}</span>
                        <span v-if="hotel.rating" class="fh-rec-rating">⭐ {{ hotel.rating }}</span>
                      </div>
                      <div v-if="hotel.highlight || hotel.desc" class="fh-rec-desc">{{ hotel.highlight || hotel.desc }}</div>
                      <div class="fh-rec-meta">
                        <span v-if="hotel.price_range" class="fh-rec-price-range">{{ hotel.price_range }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else-if="allHotelsLoaded" class="fh-empty">该区域暂无酒店推荐，请尝试搜索</div>

              <!-- 已选酒店 -->
              <div v-if="selectedHotel" class="fh-selected">
                <div class="fh-selected-card hotel">
                  <span class="fh-check-mark">✔</span>
                  <span class="fh-name">{{ selectedHotel.name }}</span>
                  <span v-if="selectedHotel.price_range" class="fh-price-range">{{ selectedHotel.price_range }}</span>
                  <button class="fh-remove-btn" @click="selectedHotel = null">
                    <el-icon :size="14"><Close /></el-icon>
                  </button>
                </div>
              </div>
              <div v-else class="fh-empty">搜索上方或点选推荐酒店选择</div>
            </div>

            <!-- 底部留白 -->
            <div class="fh-spacer"></div>
          </div>
        </template>
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

    <!-- 编辑子景点对话框 -->
    <el-dialog v-model="subEditVisible" title="编辑子景点" width="400px" :close-on-click-modal="false" destroy-on-close>
      <el-form :model="subEditForm" label-position="top" size="small">
        <el-form-item label="名称">
          <el-input v-model="subEditForm.name" placeholder="子景点名称" />
        </el-form-item>
        <el-form-item label="简介 / 亮点">
          <el-input v-model="subEditForm.highlight" type="textarea" :rows="2" placeholder="简介或亮点（选填）" />
        </el-form-item>
        <el-form-item label="票价 (¥)">
          <el-input-number v-model="subEditForm.ticket_price" :min="0" :step="1" :precision="0" controls-position="right" style="width:100%" placeholder="票价（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subEditVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSubEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Document, Search, Plus, KnifeFork, HomeFilled, Close, Edit, Select, MagicStick } from '@element-plus/icons-vue'
import MapView from '../plan/components/MapView.vue'

const store = useStore()
const router = useRouter()

const generating = ref(false)
const activeSpotIdx = ref(null)
const activeSubTab = ref('spots')

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

// 推荐模式
const recommendMode = computed(() => store.state.plan.recommendMode)
// 交通方式
const transportMode = computed(() => store.state.plan.transportMode)

// 获取当前参考景点（用于美食/酒店搜索的定位参考）
const referenceSpot = computed(() => {
  if (spots.value.length === 0) return null
  return spots.value[activeSpotIdx.value] || spots.value[0]
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

function handleTransportMode(mode) {
  store.commit('plan/SET_TRANSPORT_MODE', mode)
}

function handleBasicRecommend() {
  store.commit('plan/SET_RECOMMEND_MODE', 'basic')
  ElMessage.success('已切换为基础推荐模式')
}

function handleAiRecommend() {
  store.commit('plan/SET_RECOMMEND_MODE', 'ai')
  ElMessage.info('AI 推荐将在生成攻略时通过 DeepSeek 智能规划')
}

// ==================== 子景点管理 ====================
// { [parentSpotId]: { selected: [...], recommendations: [] } }
const subSpotData = reactive({})

const subSearchKeyword = ref('')
const subSuggestions = ref([])
const subRecommendations = ref([])
let subSearchTimer = null

// 获取某个父景点的子景点数据
function ensureSubData(parentId) {
  if (!subSpotData[parentId]) {
    subSpotData[parentId] = { selected: [] }
  }
  return subSpotData[parentId]
}

function getSubSpotCount(parentId) {
  const d = subSpotData[parentId]
  return d ? d.selected.length : 0
}

function getCurrentSubSpots() {
  if (activeSpotIdx.value === null) return []
  const parentId = spots.value[activeSpotIdx.value]?.id
  if (!parentId) return []
  const d = subSpotData[parentId]
  return d ? d.selected : []
}

function isSubSpotAdded(rec) {
  return getCurrentSubSpots().some(s => s.name === rec.name)
}

function openSpotSubPanel(idx) {
  if (activeSpotIdx.value === idx) {
    activeSpotIdx.value = null
    return
  }
  activeSpotIdx.value = idx
  subSearchKeyword.value = ''
  subSuggestions.value = []

  const parentId = spots.value[idx]?.id
  if (!parentId) return

  // 获取该父景点的推荐
  fetchSubRecommendations(parentId)
}

// 搜索子景点建议（防抖 350ms）
watch(subSearchKeyword, (val) => {
  clearTimeout(subSearchTimer)
  if (!val || !val.trim()) {
    subSuggestions.value = []
    return
  }
  subSearchTimer = setTimeout(() => fetchSubSpotSuggestions(val.trim()), 350)
})

async function fetchSubSpotSuggestions(keyword) {
  if (activeSpotIdx.value === null) return
  const spot = spots.value[activeSpotIdx.value]
  if (!spot) return
  try {
    const res = await fetch(`${API_BASE}/spot-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword,
        city: spot.city || '',
        lng: parseFloat(spot.lng) || undefined,
        lat: parseFloat(spot.lat) || undefined
      })
    })
    const json = await res.json()
    if (json.success && json.data?.length) {
      subSuggestions.value = json.data.map(p => ({
        value: p.name,
        address: p.address || '',
        typeStr: p.type?.split(';').pop() || '',
        distance: p.distance >= 1000 ? `${(p.distance / 1000).toFixed(1)}km` : `${p.distance}m`,
        lat: p.lat,
        lng: p.lng
      }))
    } else {
      subSuggestions.value = [{ value: keyword, typeStr: '按回车直接添加', noResult: true }]
    }
  } catch {
    subSuggestions.value = []
  }
}

// 获取当前父景点的推荐子景点（以父景点名+景区类型搜索）
async function fetchSubRecommendations(parentId) {
  const spot = spots.value.find(s => s.id === parentId)
  if (!spot) return
  try {
    const res = await fetch(`${API_BASE}/spot-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword: spot.name,
        city: spot.city || '',
        lng: parseFloat(spot.lng) || undefined,
        lat: parseFloat(spot.lat) || undefined
      })
    })
    const json = await res.json()
    if (json.success && json.data?.length) {
      subRecommendations.value = json.data.slice(0, 8).map(p => ({
        id: `rec_${parentId}_${p.name.replace(/\s/g, '_')}`,
        name: p.name,
        address: p.address || '',
        typeStr: p.type?.split(';').pop() || '',
        distance: p.distance >= 1000 ? `${(p.distance / 1000).toFixed(1)}km` : `${p.distance}m`,
        lat: p.lat,
        lng: p.lng
      }))
    } else {
      subRecommendations.value = []
    }
  } catch {
    subRecommendations.value = []
  }
}

function addSubSpotFromSuggestion(item) {
  if (item.noResult) { addSubSpotByName(); return }
  if (activeSpotIdx.value === null) return
  const parentId = spots.value[activeSpotIdx.value]?.id
  if (!parentId) return
  const d = ensureSubData(parentId)
  if (d.selected.find(s => s.name === item.value)) {
    ElMessage.info('该子景点已添加')
    return
  }
  d.selected.push({
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: item.value,
    lat: item.lat || 0,
    lng: item.lng || 0,
    stay_duration: 30,
    ticket_price: 0,
    highlight: item.address || ''
  })
  subSearchKeyword.value = ''
  subSuggestions.value = []
}

function addSubSpotByName() {
  const name = subSearchKeyword.value.trim()
  if (!name || activeSpotIdx.value === null) return
  const parentId = spots.value[activeSpotIdx.value]?.id
  if (!parentId) return
  const d = ensureSubData(parentId)
  if (d.selected.find(s => s.name === name)) {
    ElMessage.info('该子景点已添加')
    return
  }
  d.selected.push({
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    lat: 0,
    lng: 0,
    stay_duration: 30,
    ticket_price: 0,
    highlight: ''
  })
  subSearchKeyword.value = ''
  subSuggestions.value = []
}

function addSubSpotFromRecommend(rec) {
  if (activeSpotIdx.value === null) return
  const parentId = spots.value[activeSpotIdx.value]?.id
  if (!parentId) return
  const d = ensureSubData(parentId)
  if (d.selected.find(s => s.name === rec.name)) {
    ElMessage.info('该子景点已添加')
    return
  }
  d.selected.push({
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: rec.name,
    lat: rec.lat || 0,
    lng: rec.lng || 0,
    stay_duration: 30,
    ticket_price: 0,
    highlight: rec.address || ''
  })
}

function removeSubSpot(subId) {
  if (activeSpotIdx.value === null) return
  const parentId = spots.value[activeSpotIdx.value]?.id
  if (!parentId) return
  const d = subSpotData[parentId]
  if (d) {
    d.selected = d.selected.filter(s => s.id !== subId)
  }
}

// 编辑子景点对话框
const subEditVisible = ref(false)
const subEditForm = reactive({ name: '', highlight: '', ticket_price: 0 })
let editingSubId = null

function openSubEditDialog(sub) {
  editingSubId = sub.id
  subEditForm.name = sub.name
  subEditForm.highlight = sub.highlight || ''
  subEditForm.ticket_price = sub.ticket_price || 0
  subEditVisible.value = true
}

function saveSubEdit() {
  if (!subEditForm.name.trim()) {
    ElMessage.warning('名称不能为空')
    return
  }
  if (activeSpotIdx.value === null) return
  const parentId = spots.value[activeSpotIdx.value]?.id
  if (!parentId) return
  const d = subSpotData[parentId]
  if (!d) return
  const sub = d.selected.find(s => s.id === editingSubId)
  if (sub) {
    sub.name = subEditForm.name.trim()
    sub.highlight = subEditForm.highlight.trim()
    sub.ticket_price = subEditForm.ticket_price
  }
  subEditVisible.value = false
}

// ==================== 美食/住宿管理 ====================
const foodSearchKeyword = ref('')
const hotelSearchKeyword = ref('')
const foodSuggestions = ref([])
const hotelSuggestions = ref([])
const selectedFoods = ref([])
const selectedHotel = ref(null)
const allFoods = ref([])
const allHotels = ref([])
const allFoodsLoaded = ref(false)
const allHotelsLoaded = ref(false)
let foodSearchTimer = null
let hotelSearchTimer = null

// 可选推荐（排除已选的）
const availableFoods = computed(() => {
  const selectedNames = new Set(selectedFoods.value.map(f => f.name))
  return allFoods.value.filter(f => !selectedNames.has(f.name))
})
const availableHotels = computed(() => {
  if (!selectedHotel.value) return allHotels.value
  return allHotels.value.filter(h => h.name !== selectedHotel.value.name)
})

// 监听切换到美食住宿 Tab 时加载推荐
watch(activeSubTab, (val) => {
  if (val === 'foodHotel' && referenceSpot.value) {
    if (!allFoodsLoaded.value) fetchFoodRecommendations()
    if (!allHotelsLoaded.value) fetchHotelRecommendations()
  }
})

// 获取美食推荐列表
async function fetchFoodRecommendations() {
  const ref = referenceSpot.value
  if (!ref) return
  try {
    const res = await fetch(`${API_BASE}/food-recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: ref.city || '',
        lng: parseFloat(ref.lng) || undefined,
        lat: parseFloat(ref.lat) || undefined
      })
    })
    const json = await res.json()
    if (json.success && json.data?.length) {
      allFoods.value = json.data.map((p, i) => ({
        id: `multi_rec_food_${i}_${Date.now()}`,
        name: p.name,
        lat: p.lat || 0,
        lng: p.lng || 0,
        price_per_person: p.price_per_person || 0,
        recommend_dish: p.recommend_dish || '',
        highlight: p.highlight || p.address || '',
        rating: p.rating || ''
      }))
    }
  } catch {
    // 静默失败
  } finally {
    allFoodsLoaded.value = true
  }
}

// 获取酒店推荐列表
async function fetchHotelRecommendations() {
  const ref = referenceSpot.value
  if (!ref) return
  try {
    const res = await fetch(`${API_BASE}/hotel-recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: ref.city || '',
        lng: parseFloat(ref.lng) || undefined,
        lat: parseFloat(ref.lat) || undefined
      })
    })
    const json = await res.json()
    if (json.success && json.data?.length) {
      allHotels.value = json.data.map((p, i) => ({
        id: `multi_rec_hotel_${i}_${Date.now()}`,
        name: p.name,
        lat: p.lat || 0,
        lng: p.lng || 0,
        price_range: p.price_range || '',
        highlight: p.highlight || p.address || '',
        rating: p.rating || '',
        desc: p.desc || ''
      }))
    }
  } catch {
    // 静默失败
  } finally {
    allHotelsLoaded.value = true
  }
}

// 从推荐列表添加美食
function addFoodFromRecommend(food) {
  const alreadyExists = selectedFoods.value.find(f => f.name === food.name)
  if (alreadyExists) { ElMessage.info('该美食已添加'); return }
  selectedFoods.value.push({
    id: `multi_food_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: food.name,
    lat: food.lat || 0,
    lng: food.lng || 0,
    price_per_person: food.price_per_person || 0,
    highlight: food.highlight || '',
    recommend_dish: food.recommend_dish || ''
  })
  ElMessage.success(`已添加"${food.name}"`)
}

// 从推荐列表选择酒店
function addHotelFromRecommend(hotel) {
  selectedHotel.value = {
    id: `multi_hotel_${Date.now()}`,
    name: hotel.name,
    lat: hotel.lat || 0,
    lng: hotel.lng || 0,
    price_range: hotel.price_range || '',
    highlight: hotel.highlight || '',
    rating: hotel.rating || ''
  }
  ElMessage.success(`已选择"${hotel.name}"`)
}

// 美食搜索建议（防抖 350ms）
watch(foodSearchKeyword, (val) => {
  clearTimeout(foodSearchTimer)
  if (!val || !val.trim()) {
    foodSuggestions.value = []
    return
  }
  foodSearchTimer = setTimeout(() => fetchFoodSuggestions(val.trim()), 350)
})

// 酒店搜索建议（防抖 350ms）
watch(hotelSearchKeyword, (val) => {
  clearTimeout(hotelSearchTimer)
  if (!val || !val.trim()) {
    hotelSuggestions.value = []
    return
  }
  hotelSearchTimer = setTimeout(() => fetchHotelSuggestions(val.trim()), 350)
})

async function fetchFoodSuggestions(keyword) {
  const ref = referenceSpot.value
  const city = ref?.city || ''
  const lng = ref?.lng
  const lat = ref?.lat
  try {
    const res = await fetch(`${API_BASE}/food-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, city, lng, lat })
    })
    const json = await res.json()
    if (json.success && json.data?.length) {
      foodSuggestions.value = json.data.map(p => ({
        value: p.name,
        typeStr: p.type?.split(';').pop() || '',
        distance: p.distance >= 1000 ? `${(p.distance / 1000).toFixed(1)}km` : `${p.distance}m`,
        lat: p.lat,
        lng: p.lng,
        address: p.address || ''
      }))
    } else {
      foodSuggestions.value = [{ value: keyword, typeStr: '直接添加', noResult: true }]
    }
  } catch {
    foodSuggestions.value = []
  }
}

async function fetchHotelSuggestions(keyword) {
  const ref = referenceSpot.value
  const city = ref?.city || ''
  const lng = ref?.lng
  const lat = ref?.lat
  try {
    const res = await fetch(`${API_BASE}/hotel-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, city, lng, lat })
    })
    const json = await res.json()
    if (json.success && json.data?.length) {
      hotelSuggestions.value = json.data.map(p => ({
        value: p.name,
        typeStr: p.type?.split(';').pop() || '',
        distance: p.distance >= 1000 ? `${(p.distance / 1000).toFixed(1)}km` : `${p.distance}m`,
        lat: p.lat,
        lng: p.lng,
        address: p.address || ''
      }))
    } else {
      hotelSuggestions.value = [{ value: keyword, typeStr: '直接添加', noResult: true }]
    }
  } catch {
    hotelSuggestions.value = []
  }
}

function addFoodFromSuggestion(item) {
  if (item.noResult) { addFoodByName(); return }
  const alreadyExists = selectedFoods.value.find(f => f.name === item.value)
  if (alreadyExists) { ElMessage.info('该美食已添加'); return }
  selectedFoods.value.push({
    id: `multi_food_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: item.value,
    lat: item.lat || 0,
    lng: item.lng || 0,
    price_per_person: 0,
    highlight: item.address || ''
  })
  foodSearchKeyword.value = ''
  foodSuggestions.value = []
}

function addFoodByName() {
  const name = foodSearchKeyword.value.trim()
  if (!name) return
  const alreadyExists = selectedFoods.value.find(f => f.name === name)
  if (alreadyExists) { ElMessage.info('该美食已添加'); return }
  selectedFoods.value.push({
    id: `multi_food_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    lat: 0,
    lng: 0,
    price_per_person: 0,
    highlight: ''
  })
  foodSearchKeyword.value = ''
  foodSuggestions.value = []
}

function removeFood(id) {
  selectedFoods.value = selectedFoods.value.filter(f => f.id !== id)
}

function addHotelFromSuggestion(item) {
  if (item.noResult) { addHotelByName(); return }
  selectedHotel.value = {
    id: `multi_hotel_${Date.now()}`,
    name: item.value,
    lat: item.lat || 0,
    lng: item.lng || 0,
    price_range: '',
    highlight: item.address || ''
  }
  hotelSearchKeyword.value = ''
  hotelSuggestions.value = []
}

function addHotelByName() {
  const name = hotelSearchKeyword.value.trim()
  if (!name) return
  selectedHotel.value = {
    id: `multi_hotel_${Date.now()}`,
    name,
    lat: 0,
    lng: 0,
    price_range: '',
    highlight: ''
  }
  hotelSearchKeyword.value = ''
  hotelSuggestions.value = []
}

// ==================== 生成攻略 ====================
async function handleGenerate() {
  if (spots.value.length < 2) return
  generating.value = true
  try {
    // 收集所有子景点数据
    const spotsWithSubs = spots.value.map(s => ({
      ...s,
      subSpots: subSpotData[s.id]?.selected || []
    }))
    const payload = {
      spots: spotsWithSubs,
      foods: selectedFoods.value,
      hotel: selectedHotel.value,
      transportMode: transportMode.value || 'drive'
    }
    const res = await fetch(`${API_BASE}/plan-multi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    // 🔑 设置 currentAttraction（用于结果页判断是否海滨、潮汐等）
    if (spots.value.length > 0) {
      store.commit('plan/SET_CURRENT_ATTRACTION', spots.value[0])
    }
    if (json.success && json.data) {
      store.commit('plan/SET_PLAN_RESULT', json.data)
      store.commit('plan/SET_TIMELINE_NODES', json.data.timelineNodes || [])
      store.commit('plan/SET_CURRENT_DAY', 1)
    } else {
      const localResult = buildLocalResult()
      store.commit('plan/SET_PLAN_RESULT', localResult)
      store.commit('plan/SET_TIMELINE_NODES', convertToTimelineNodes(localResult))
      store.commit('plan/SET_CURRENT_DAY', 1)
    }
    router.push('/home/lifeServices/travelGuide/result')
  } catch {
    // 🔑 设置 currentAttraction
    if (spots.value.length > 0) {
      store.commit('plan/SET_CURRENT_ATTRACTION', spots.value[0])
    }
    const localResult = buildLocalResult()
    store.commit('plan/SET_PLAN_RESULT', localResult)
    store.commit('plan/SET_TIMELINE_NODES', convertToTimelineNodes(localResult))
    store.commit('plan/SET_CURRENT_DAY', 1)
    router.push('/home/lifeServices/travelGuide/result')
  } finally {
    generating.value = false
  }
}

/**
 * 将旧格式 buildLocalResult 输出转换为统一时间线节点
 */
function convertToTimelineNodes(result) {
  const nodes = []
  let order = 0
  const timeline = result.timeline || []
  let lastSectionName = ''

  for (const item of timeline) {
    if (item.type === 'section') {
      lastSectionName = item.title
      continue
    }
    if (item.type === 'spot') {
      nodes.push({
        id: `spot_${item.data?.name || 'unknown'}_${order}`,
        type: 'spot',
        day: 1,
        order: ++order,
        data: item.data || {},
        startTime: item.time || '',
        endTime: '',
        stayDuration: item.data?.stay_duration || 30,
        state: 'pending'
      })
    } else if (item.type === 'food') {
      nodes.push({
        id: `food_${item.data?.name || 'unknown'}_${order}`,
        type: 'food',
        day: 1,
        order: ++order,
        data: item.data || {},
        mealType: lastSectionName.includes('午餐') ? 'lunch' : 'dinner',
        startTime: item.time || '',
        endTime: '',
        state: 'pending'
      })
    } else if (item.type === 'hotel') {
      nodes.push({
        id: `hotel_${order}`,
        type: 'hotel',
        day: 1,
        role: 'end',
        order: ++order,
        data: item.data || {},
        startTime: item.time || '21:00',
        endTime: item.time || '21:00',
        state: 'pending'
      })
    }
  }
  return nodes
}

function buildLocalResult() {
  const sp = spots.value
  const foods = selectedFoods.value
  const hotel = selectedHotel.value

  const spotsCost = sp.reduce((sum, s) => {
    const costNum = parseInt(String(s.cost || '0').replace(/[^0-9]/g, '')) || 60
    return sum + costNum
  }, 0)
  const foodCost = foods.reduce((sum, f) => sum + (f.price_per_person || 50), 0)
  const totalBudget = spotsCost + foodCost

  const timeline = []
  let t = 480 // 8:00 开始
  const formatTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

  sp.forEach((s, i) => {
    timeline.push({ type: 'section', title: `第${i + 1}站：${s.name}` })

    // 该父景点下的子景点
    const subs = subSpotData[s.id]?.selected || []
    if (subs.length > 0) {
      subs.forEach((sub, si) => {
        timeline.push({
          type: 'spot',
          time: formatTime(t),
          data: {
            name: sub.name,
            desc: sub.highlight || `${s.name}·子景点${si + 1}`,
            stay_duration: 30,
            ticket_price: sub.ticket_price || 0,
            highlight: sub.highlight || '',
            highlight_desc: `「${s.name}」子景点`
          }
        })
        t += 60
      })
    } else {
      // 没有子景点则展示父景点本身
      timeline.push({
        type: 'spot',
        time: formatTime(t),
        data: {
          name: s.name,
          desc: s.desc || s.address || s.name,
          stay_duration: 120,
          ticket_price: parseInt(String(s.cost || '0').replace(/[^0-9]/g, '')) || 60,
          highlight: s.highlight || '',
          highlight_desc: `${s.level ? `${s.level}级景区` : ''}${s.rating ? ` · 评分 ${s.rating}` : ''}`
        }
      })
      t += 150
    }
  })

  // 穿插美食推荐
  if (foods.length > 0) {
    timeline.push({ type: 'section', title: '🍽️ 沿途美食推荐' })
    foods.forEach(f => {
      timeline.push({
        type: 'food',
        time: '',
        data: {
          name: f.name,
          recommend_dish: f.highlight || '品尝当地特色',
          price_per_person: f.price_per_person || 50,
          highlight: f.highlight || ''
        }
      })
    })
  }

  // 住宿
  if (hotel) {
    timeline.push({ type: 'section', title: '🏨 住宿安排' })
    timeline.push({
      type: 'hotel',
      time: '',
      data: {
        name: hotel.name,
        price_range: hotel.price_range || '',
        highlight: hotel.highlight || ''
      }
    })
  }

  const attractionName = sp.map(s => s.name).join(' → ')
  const firstSpot = sp.find(s => s.lat && s.lng)
  return {
    attractionName,
    summary: {
      attractionName,
      spotsCount: sp.length,
      foodsCount: foods.length,
      hotelName: hotel ? hotel.name : '沿途推荐',
      totalBudget,
      lat: firstSpot?.lat || (hotel?.lat),
      lng: firstSpot?.lng || (hotel?.lng)
    },
    timeline,
    spots: sp,
    foods,
    hotel
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

// ===== 交通方式切换按钮 =====
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
    padding: 5px 11px;
    border: none;
    background: transparent;
    color: #64748b;
    font-size: 12px;
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

    .toggle-icon { font-size: 15px; line-height: 1; }
    .toggle-label { font-size: 12px; font-weight: inherit; }
  }
}

// ===== 推荐模式切换按钮 =====
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
    gap: 5px;
    padding: 5px 12px;
    border: none;
    background: transparent;
    color: #64748b;
    font-size: 12px;
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
      color: #6366f1;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      font-weight: 600;
    }

    &.ai.active {
      color: #f59e0b;
    }

    .toggle-label { font-size: 12px; font-weight: inherit; }
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
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
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

.sub-count-badge {
  font-size: 10px;
  font-weight: 600;
  color: #6366f1;
  background: #eef2ff;
  padding: 2px 6px;
  border-radius: 8px;
  white-space: nowrap;
  margin-bottom: 4px;
  text-align: center;
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

// ===== 子景点展开面板 =====
.sub-spot-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 14px 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: -10px;
  margin-bottom: 2px;
}

.sub-spot-search {
  position: relative;
}

.sub-spot-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 60;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  max-height: 180px;
  overflow-y: auto;
}

.sub-suggest-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #f1f5f9; }
  .sug-name { font-size: 13px; font-weight: 600; color: #0f172a; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sug-type { font-size: 10px; color: #6366f1; background: #eef2ff; padding: 1px 5px; border-radius: 3px; flex-shrink: 0; }
  .sug-dist { font-size: 10px; color: #94a3b8; flex-shrink: 0; }
}

.sub-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-selected-count {
  font-size: 11px;
  font-weight: 500;
  color: #6366f1;
  background: #eef2ff;
  padding: 1px 7px;
  border-radius: 10px;
}

.sub-recommend-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.sub-recommend-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  &:hover:not(.added) {
    border-color: #6366f1;
    background: #eef2ff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.12);
  }
  &.added {
    opacity: 0.6;
    cursor: default;
    border-color: #86efac;
    background: #f0fdf4;
  }
}

.sub-rec-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sub-rec-name {
  font-weight: 600;
  color: #0f172a;
}

.sub-rec-type {
  font-size: 10px;
  color: #6366f1;
  background: #eef2ff;
  padding: 1px 5px;
  border-radius: 3px;
}

.sub-rec-added {
  font-size: 10px;
  color: #10b981;
  font-weight: 600;
}

.sub-rec-click-hint {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 500;
}

.sub-selected-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sub-selected-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.2s;
  &:hover { border-color: #c7d2fe; }
}

.sub-index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sub-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sub-name {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub-highlight {
  font-size: 11px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  &.edit {
    background: #eef2ff;
    color: #6366f1;
    &:hover { background: #6366f1; color: #fff; }
  }
  &.remove {
    background: #fef2f2;
    color: #ef4444;
    &:hover { background: #ef4444; color: #fff; }
  }
}

.sub-empty-hint {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  padding: 8px 0;
}

.sub-collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px;
  cursor: pointer;
  color: #94a3b8;
  font-size: 12px;
  border-top: 1px solid #f1f5f9;
  padding-top: 10px;
  transition: color 0.2s;
  svg { width: 14px; height: 14px; }
  &:hover { color: #6366f1; }
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

// ===== 子标签切换 =====
.sub-tabs {
  display: flex;
  gap: 4px;
  padding: 6px 10px 0;
  flex-shrink: 0;
}
.sub-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 10px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  svg { width: 16px; height: 16px; }
  &:hover { color: #64748b; background: rgba(99, 102, 241, 0.04); }
  &.active {
    color: #6366f1;
    background: rgba(99, 102, 241, 0.08);
    font-weight: 600;
  }
}

// ===== 美食住宿区域 =====
.fh-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px 80px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
}
.fh-spacer { height: 20px; flex-shrink: 0; }

.fh-section {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(226, 232, 240, 0.7);
  border-radius: 14px;
  padding: 16px;
}
.fh-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.fh-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  &.food-icon { background: #ecfdf5; color: #10b981; }
  &.hotel-icon { background: #eff6ff; color: #3b82f6; }
}
.fh-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  flex: 1;
}
.fh-badge {
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 10px;
  &.selected { color: #10b981; background: #ecfdf5; }
}

// 搜索
.fh-search {
  position: relative;
  margin-bottom: 10px;
}
.fh-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  max-height: 180px;
  overflow-y: auto;
}
.fh-suggest-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #f8fafc; }
  .sug-name { font-size: 13px; font-weight: 600; color: #0f172a; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sug-type { font-size: 10px; color: #10b981; background: #ecfdf5; padding: 1px 5px; border-radius: 3px; flex-shrink: 0; }
  .sug-dist { font-size: 10px; color: #94a3b8; flex-shrink: 0; }
}

// 已选列表
.fh-selected {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fh-selected-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  transition: all 0.2s;
  &.food { background: #f0fdf4; border-color: #86efac; }
  &.hotel { background: #eff6ff; border-color: #93c5fd; }
}
.fh-index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #10b981;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.fh-check-mark {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.fh-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fh-price {
  font-size: 12px;
  font-weight: 700;
  color: #10b981;
  flex-shrink: 0;
}
.fh-price-range {
  font-size: 11px;
  color: #3b82f6;
  background: #eff6ff;
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}
.fh-remove-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
  &:hover { background: #ef4444; color: #fff; }
}

.fh-empty {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  padding: 12px 0;
}

// ===== 推荐区域 =====
.fh-recommend-section {
  padding-top: 12px;
  margin-top: 10px;
  border-top: 1px solid #f1f5f9;
}
.fh-recommend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.fh-recommend-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.fh-recommend-count {
  font-size: 11px;
  color: #94a3b8;
  background: #f8fafc;
  padding: 1px 8px;
  border-radius: 8px;
}
.fh-recommend-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 2px;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
}
.fh-recommend-card {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f0fdf4;
    border-color: #86efac;
    box-shadow: 0 1px 6px rgba(16, 185, 129, 0.08);
    transform: translateY(-1px);
  }

  &:active { transform: scale(0.98); }
}
.fh-rec-info { flex: 1; min-width: 0; }
.fh-rec-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.fh-rec-name-text {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.fh-rec-price {
  font-size: 11px;
  font-weight: 700;
  color: #10b981;
  flex-shrink: 0;
}
.fh-rec-rating {
  font-size: 10px;
  color: #f59e0b;
  font-weight: 600;
  flex-shrink: 0;
}
.fh-rec-desc {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fh-rec-meta {
  font-size: 10px;
  color: #64748b;
  margin-top: 1px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.fh-rec-price-range {
  font-size: 10px;
  color: #3b82f6;
  font-weight: 500;
  background: #eff6ff;
  padding: 1px 6px;
  border-radius: 4px;
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
  .plan-topbar { padding: 10px 12px; flex-wrap: wrap; }
  .attraction-title { font-size: 15px; gap: 6px; margin-left: 6px; }
  .topbar-btn { padding: 6px 10px; font-size: 12px; }
  .transport-toggle, .recommend-toggle {
    .toggle-label { display: none; }
    .toggle-option { padding: 5px 9px; font-size: 12px; }
  }
  .map-area { flex: 0 0 220px; }
  .spot-name { font-size: 14px; }
  .spot-emoji { font-size: 24px; }
  .spot-desc { display: none; }
}
</style>

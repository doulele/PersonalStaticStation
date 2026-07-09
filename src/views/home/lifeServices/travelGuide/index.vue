<template>
  <div class="search-page">
    <!-- 拖拽幽灵元素 -->
    <div
      class="drag-ghost"
      :style="ghostStyle"
      :class="{ visible: isDragging }"
    >
      <span class="ghost-emoji">{{ ghostContent.emoji }}</span>
      <span class="ghost-name">{{ ghostContent.name }}</span>
    </div>

    <!-- Hero 区域 -->
    <div class="hero-section">
      <div class="hero-bg">
        <div class="hero-mesh"></div>
        <div class="hero-gradient-orb orb-1"></div>
        <div class="hero-gradient-orb orb-2"></div>
        <div class="hero-gradient-orb orb-3"></div>
        <div class="hero-particles">
          <span v-for="n in 12" :key="n" class="particle" :style="{
            '--x': (Math.random() * 100).toFixed(1) + '%',
            '--y': (Math.random() * 100).toFixed(1) + '%',
            '--delay': (Math.random() * 3).toFixed(1) + 's',
            '--size': (Math.random() * 4 + 2).toFixed(0) + 'px',
            '--duration': (Math.random() * 4 + 4).toFixed(0) + 's'
          }"></span>
        </div>
      </div>
      <div class="hero-content">
        <h1 class="hero-title">
          探索你的
          <span class="title-highlight">
            完美旅行
            <svg class="title-underline" viewBox="0 0 160 12" preserveAspectRatio="none">
              <path d="M 0 6 Q 20 0 40 6 Q 60 12 80 6 Q 100 0 120 6 Q 140 12 160 6" fill="none" stroke="url(#titleLineGrad)" stroke-width="3" stroke-linecap="round"/>
              <defs><linearGradient id="titleLineGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#6366f1" stop-opacity="0"/><stop offset="25%" stop-color="#8b5cf6" stop-opacity="0.8"/><stop offset="50%" stop-color="#a855f7" stop-opacity="1"/><stop offset="75%" stop-color="#ec4899" stop-opacity="0.8"/><stop offset="100%" stop-color="#f43f5e" stop-opacity="0"/></linearGradient></defs>
            </svg>
          </span>
        </h1>
        <p class="hero-desc">发现热门目的地，一键智能规划行程路线，让每一次出发都值得期待</p>
        <p class="hero-subtitle">AI 智能规划 · 高德实时数据</p>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-num">500+</span>
            <span class="stat-label">热门景点</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">34省</span>
            <span class="stat-label">全域覆盖</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">AI</span>
            <span class="stat-label">智能规划</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索 Tab -->
    <div class="search-tabs-wrapper">
      <div class="search-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          <span class="tab-icon-wrap">
            <el-icon><component :is="tab.icon" /></el-icon>
          </span>
          <span class="tab-label">{{ tab.label }}</span>
          <span v-if="activeTab === tab.key" class="tab-active-indicator"></span>
        </button>
      </div>
    </div>

    <!-- Tab 1: 搜索目的地 -->
    <div v-if="activeTab === 'search'" class="tab-panel">
      <div class="search-box" :class="{ 'has-dropdown': showDropdown }">
        <el-icon class="search-icon" :size="20"><Search /></el-icon>
        <input
          ref="searchInputRef"
          v-model="keyword"
          class="search-input"
          placeholder="搜索目的地，如「故宫」「迪士尼」..."
          @input="handleSearchDebounced"
          @keydown.enter="handleSearchEnter"
          @focus="handleSearchFocus"
          autocomplete="off"
        />
        <el-icon v-if="keyword" class="clear-icon" :size="18" @click.stop="clearSearch">
          <CircleClose />
        </el-icon>
        <button
          class="search-btn"
          :disabled="!keyword.trim()"
          @click="handleSearchEnter"
        >
          搜索
        </button>
      </div>
      <transition name="dropdown-fade">
        <div v-if="showDropdown" class="search-dropdown" @click.stop>
          <template v-if="searchResults.length">
            <div class="dropdown-loading" v-if="searchLoading">
              <el-icon class="is-loading" :size="20"><Loading /></el-icon>
              <span>搜索中...</span>
            </div>
            <div v-for="item in searchResults" :key="item.id" class="dropdown-item" @click="goPlan(item)">
              <div class="item-thumb">
                <img v-if="item.photos?.[0]" :src="item.photos[0]" alt="" draggable="false" />
                <el-icon v-else :size="22"><MapLocation /></el-icon>
              </div>
              <div class="item-info">
                <div class="item-name-row">
                  <span class="item-name">{{ item.name }}</span>
                  <span v-if="item.level" class="item-level-mini">{{ item.level }}</span>
                </div>
                <span class="item-desc" v-if="item.address">{{ item.address }}</span>
                <span class="item-desc" v-else>{{ item.desc || '' }}</span>
              </div>
              <el-tag v-if="item.rating" size="small" type="warning" class="item-rating">⭐ {{ item.rating }}</el-tag>
              <el-icon class="item-arrow" :size="14"><ArrowRight /></el-icon>
            </div>
            <div class="dropdown-footer" v-if="DATA_SOURCE === 'mock' || DATA_SOURCE === 'mock-fallback'">
              <span class="mock-tip">📋 高德搜索无结果，使用本地 Mock 数据</span>
            </div>
            <div class="dropdown-footer" v-else>
              <span class="real-tip">🔍 来自高德地图实时搜索</span>
              <span class="real-tip-sub">点击即可查看景点详情并规划行程</span>
            </div>
          </template>
          <div v-else-if="!searchLoading && keyword.trim()" class="dropdown-empty">
            <span>未找到「{{ keyword }}」相关目的地</span>
            <span class="mock-tip">请尝试其他关键词</span>
          </div>
        </div>
      </transition>

      <!-- 快捷搜索标签 -->
      <div class="quick-tags" v-if="!showDropdown">
        <span class="quick-tags-label">热门搜索：</span>
        <button
          v-for="tag in quickTags"
          :key="tag"
          class="quick-tag-btn"
          @click="quickSearch(tag)"
        >{{ tag }}</button>
      </div>

      <!-- 热门目的地 -->
      <div class="popular-section" v-if="!showDropdown">
        <!-- 区域地图：PC端→右下角悬浮 / 移动端→内联 -->
        <RegionMap
          :active-region="activeRegion"
          :active-province="activeProvince"
          @select-region="switchRegion"
          @select-province="switchProvince"
        />

        <div class="section-header">
          <div class="section-header-left">
            <h2 class="section-title">🔥 热门目的地</h2>
            <span class="section-count">Top {{ popularList.length }}</span>
          </div>
          <div class="region-filters">
            <button
              v-for="r in regionTabs"
              :key="r"
              class="region-filter-btn"
              :class="{ active: activeRegion === r && !activeProvince }"
              :disabled="regionLoading"
              @click="switchRegion(r)"
            >
              <el-icon v-if="regionLoading && activeRegion === r" class="is-loading" :size="12"><Loading /></el-icon>
              {{ r }}
            </button>
          </div>
        </div>

        <!-- 省份筛选提示条 -->
        <div v-if="activeProvince" class="province-filter-bar">
          <span class="province-filter-label">📍 当前筛选：</span>
          <span class="province-filter-chip">
            {{ activeProvince }}
            <button class="province-filter-clear" @click="switchRegion(activeRegion)" title="清除省份筛选">✕</button>
          </span>
          <span class="province-filter-hint">（点击地图上的省份可切换，点击区域按钮查看整个区域）</span>
        </div>

        <!-- 地区加载骨架屏 -->
        <div v-if="regionLoading" class="popular-grid">
          <div v-for="n in 8" :key="'skel-'+n" class="popular-card skeleton-card">
            <div class="card-cover skeleton-bg"></div>
            <div class="card-body">
              <div class="skeleton-line skeleton-name"></div>
              <div class="skeleton-line skeleton-desc"></div>
              <div class="skeleton-line skeleton-desc short"></div>
            </div>
            <div class="card-footer">
              <span class="skeleton-line skeleton-cost"></span>
            </div>
          </div>
        </div>

        <div v-else class="popular-grid">
          <div
            v-for="(item, idx) in filteredPopularList"
            :key="item.id"
            class="popular-card"
            :class="{ 'dragging-source': isDragging && currentDragAttraction?.id === item.id }"
            :style="{ '--card-color': (regionColors[item.region] || {}).tag || '#6366f1' }"
            @click="onCardClick(item)"
            @dragstart.prevent
            @pointerdown="dragPointerDown($event, item)"
            @pointermove="dragPointerMove"
            @pointerup="dragPointerUp"
            @pointercancel="dragPointerCancel"
          >
            <!-- 排名角标（左上） -->
            <div class="card-rank" v-if="idx < 3 && activeRegion === '全部'">
              <span v-if="idx === 0">🥇</span>
              <span v-else-if="idx === 1">🥈</span>
              <span v-else>🥉</span>
            </div>
            <div class="card-rank card-rank-num" v-else-if="activeRegion !== '全部'">
              {{ idx + 1 }}
            </div>

            <!-- 景区等级角标（右上） -->
            <span v-if="item.level" class="card-level-badge" :class="'level-' + item.level.replace('A','')">{{ item.level }}景区</span>

            <!-- 封面 -->
            <div class="card-cover" :style="{ background: (regionColors[item.region] || {}).bg || 'linear-gradient(135deg, #6366f1, #818cf8)' }">
              <div class="cover-emoji">{{ item.emoji }}</div>
            </div>

            <!-- 信息区 -->
            <div class="card-body">
              <!-- 名称 + 评分 -->
              <div class="card-header-row">
                <h3 class="card-name">{{ item.name }}</h3>
                <span v-if="item.rating" class="card-rating">⭐ {{ item.rating }}</span>
              </div>

              <!-- 特色标签 -->
              <div class="card-features" v-if="item.features?.length">
                <span v-for="f in item.features" :key="f" class="feature-tag">{{ f }}</span>
              </div>

              <!-- 地区信息 -->
              <div class="card-location">
                <span class="card-region-tag" :style="{ background: (regionColors[item.region] || {}).tag || '#6366f1' }">{{ item.region }}</span>
                <span class="card-city-text">{{ item.province }}{{ item.city ? ' · ' + item.city : '' }}</span>
              </div>

              <!-- 描述 -->
              <p class="card-desc">{{ item.desc || item.address || '' }}</p>
            </div>

            <!-- 底部操作 -->
            <div class="card-footer">
              <span class="card-cost">{{ item.cost ? '💰 ' + item.cost : '未知费用' }}</span>
              <span class="card-action">查看攻略 <el-icon :size="12"><ArrowRight /></el-icon></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: 附近推荐 -->
    <div v-if="activeTab === 'nearby'" class="tab-panel">
      <!-- 精确定位搜索框（已定位且非加载态时显示） -->
      <div v-if="nearbyAddress && !nearbyLoading" class="refine-search-box">
        <el-icon class="refine-search-icon" :size="18"><Search /></el-icon>
        <input
          v-model="nearbyRefineInput"
          class="refine-search-input"
          placeholder="位置不准？输入精确地址修正，如「上海浦东新区上丰路1399」"
          @keydown.enter="refineNearbyLocation"
        />
        <button
          class="refine-search-btn"
          :disabled="!nearbyRefineInput.trim() || nearbyRefineLoading"
          @click="refineNearbyLocation"
        >
          精确定位
        </button>
      </div>

      <!-- 定位信息（浅灰轻提示） -->
      <div class="locate-hint-row">
        <template v-if="nearbyLoading">
          <el-icon class="is-loading" :size="14"><Loading /></el-icon>
          <span>正在获取位置...</span>
        </template>
        <template v-else-if="nearbyAddress">
          <el-icon :size="14"><LocationFilled /></el-icon>
          <span>{{ nearbyAddress }}</span>
          <button class="locate-hint-relocate" @click="loadNearby">重新定位</button>
        </template>
        <template v-else>
          <el-icon :size="14"><Aim /></el-icon>
          <span>获取位置后，为你推荐周边景点</span>
          <button class="locate-hint-relocate" @click="loadNearby">获取位置</button>
        </template>
      </div>
      <p v-if="nearbyError" class="locate-error">{{ nearbyError }}</p>

      <!-- 筛选控制栏 -->
      <div v-if="nearbyPois.length" class="nearby-controls">
        <div class="controls-row">
          <div class="controls-section">
            <span class="controls-label">🔍 搜索距离</span>
            <div class="radius-pills">
              <button
                v-for="opt in radiusOptions"
                :key="opt.value"
                class="radius-pill"
                :class="{ active: nearbyRadius === opt.value }"
                :disabled="nearbyLoading"
                @click="changeNearbyRadius(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <div class="controls-divider"></div>
          <div class="controls-section">
            <span class="sort-count">共 {{ nearbyPois.length }} 个景点</span>
            <div class="sort-pills">
              <button
                class="sort-pill"
                :class="{ active: nearbySortBy === 'distance' }"
                @click="nearbySortBy = 'distance'; resortNearbyPois()"
              >
                <span>📍 按距离</span>
              </button>
              <button
                class="sort-pill"
                :class="{ active: nearbySortBy === 'rating' }"
                @click="nearbySortBy = 'rating'; resortNearbyPois()"
              >
                <span>⭐ 按评分</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="nearbyPois.length" class="nearby-grid">
        <div
          v-for="poi in nearbyPois"
          :key="poi.id"
          class="nearby-card"
          @click="onCardClick(poi)"
          @dragstart.prevent
          @pointerdown="dragPointerDown($event, poi)"
          @pointermove="dragPointerMove"
          @pointerup="dragPointerUp"
          @pointercancel="dragPointerCancel"
        >
          <div class="nb-cover">
            <img v-if="poi.photos?.[0]" :src="poi.photos[0]" alt="" draggable="false" />
            <img v-else class="nb-default-img" :src="defaultCoverSrc" alt="" draggable="false" />
          </div>
          <div class="nb-body">
            <h3 class="nb-name">{{ poi.name }}</h3>
            <p class="nb-addr">
              <el-icon :size="12"><LocationFilled /></el-icon>
              {{ poi.address || '暂无地址' }}
            </p>
            <div class="nb-meta">
              <el-tag v-if="poi.distance" size="small" type="info">{{ formatDistance(poi.distance) }}</el-tag>
              <el-tag v-if="poi.rating" size="small" type="warning">⭐ {{ poi.rating }}</el-tag>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-if="!nearbyLoading && nearbyLoaded && !nearbyPois.length" description="附近暂无景点" />
    </div>

    <!-- Tab 3: 地址搜索 -->
    <div v-if="activeTab === 'address'" class="tab-panel">
      <div class="search-box">
        <el-icon class="search-icon" :size="20"><LocationFilled /></el-icon>
        <input
          v-model="addressInput"
          class="search-input"
          placeholder="输入城市或地址，如「北京市东城区」「上海浦东」..."
          @keydown.enter="searchByAddress"
        />
        <button
          class="search-btn"
          :disabled="!addressInput.trim() || addressLoading"
          @click="searchByAddress"
        >
          {{ addressLoading ? '搜索中...' : '搜索' }}
        </button>
      </div>

      <!-- 排序切换 -->
      <div v-if="addressPois.length" class="sort-bar">
        <span class="sort-count">共 {{ addressPois.length }} 个景点</span>
        <div class="sort-pills">
          <button
            class="sort-pill"
            :class="{ active: addressSortBy === 'rating' }"
            @click="addressSortBy = 'rating'; resortAddressPois()"
          >
            <span class="pill-icon">⭐</span>
            <span>按评分</span>
          </button>
          <button
            class="sort-pill"
            :class="{ active: addressSortBy === 'distance' }"
            @click="addressSortBy = 'distance'; resortAddressPois()"
          >
            <span class="pill-icon">📍</span>
            <span>按距离</span>
          </button>
        </div>
      </div>

      <div v-if="addressPois.length" class="nearby-grid">
        <div
          v-for="poi in addressPois"
          :key="poi.id"
          class="nearby-card"
          @click="onCardClick(poi)"
          @dragstart.prevent
          @pointerdown="dragPointerDown($event, poi)"
          @pointermove="dragPointerMove"
          @pointerup="dragPointerUp"
          @pointercancel="dragPointerCancel"
        >
          <div class="nb-cover">
            <img v-if="poi.photos?.[0]" :src="poi.photos[0]" alt="" draggable="false" />
            <img v-else class="nb-default-img" :src="defaultCoverSrc" alt="" draggable="false" />
          </div>
          <div class="nb-body">
            <h3 class="nb-name">{{ poi.name }}</h3>
            <p class="nb-addr">
              <el-icon :size="12"><LocationFilled /></el-icon>
              {{ poi.address || '暂无地址' }}
            </p>
            <div class="nb-meta">
              <el-tag v-if="poi.distance" size="small" type="info">{{ formatDistance(poi.distance) }}</el-tag>
              <el-tag v-if="poi.rating" size="small" type="warning">⭐ {{ poi.rating }}</el-tag>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-if="addressSearched && !addressPois.length && !addressLoading" description="未找到相关景点" />
    </div>

    <!-- 多选悬浮收集按钮 -->
    <CollectionFloatingBtn
      :count="multiCount"
      :is-drag-over="isDragOverBtn"
      :visible="floatBtnVisible"
      @click="openDialog"
    />

    <!-- 多选弹框 -->
    <SelectionDialog
      :visible="dialogVisible"
      :attractions="multiAttractions"
      @close="closeDialog"
      @confirm="handleDialogConfirm"
      @remove="handleDialogRemove"
      @clear="handleDialogClear"
      @auto-sort="handleDialogAutoSort"
      @reorder="handleDialogReorder"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { attractions, regionColors, quickSearchTags } from './mock/data.js'
import { ElMessage } from 'element-plus'
import RegionMap from './components/RegionMap.vue'
import CollectionFloatingBtn from './components/CollectionFloatingBtn.vue'
import SelectionDialog from './components/SelectionDialog.vue'
import { useCardDrag } from './composables/useCardDrag.js'

const router = useRouter()
const store = useStore()
const API_BASE = '/staticTool/api/travel'
const searchInputRef = ref(null)

// --- Tab ---
const tabs = [
  { key: 'search', label: '搜索目的地', icon: 'Search' },
  { key: 'address', label: '地址搜索', icon: 'LocationFilled' },
  { key: 'nearby', label: '附近推荐', icon: 'Aim' }
]
const activeTab = ref('search')

function switchTab(key) {
  activeTab.value = key
  if (key === 'nearby' && !nearbyLoaded.value) {
    loadNearby()
  }
}

// --- 搜索 ---
const keyword = ref('')
const searchResults = ref([])
const showDropdown = ref(false)
const popularList = ref([])
const activeRegion = ref('全部')
const activeProvince = ref('')
const regionLoading = ref(false)
const quickTags = quickSearchTags

// 省份→区域映射（与 RegionMap 保持一致）
const provinceRegionMap = {
  '黑龙江': '东北','吉林': '东北','辽宁': '东北',
  '内蒙古': '华北','河北': '华北','北京': '华北','天津': '华北','山西': '华北',
  '新疆': '西北','甘肃': '西北','青海': '西北','宁夏': '西北','陕西': '西北',
  '西藏': '西南','四川': '西南','重庆': '西南','云南': '西南','贵州': '西南',
  '山东': '华东','江苏': '华东','上海': '华东','安徽': '华东',
  '浙江': '华东','江西': '华东','福建': '华东','台湾': '华东',
  '河南': '华中','湖北': '华中','湖南': '华中',
  '广东': '华南','广西': '华南','海南': '华南',
  '香港': '华南','澳门': '华南'
}

// 获取所有唯一地区
const regionTabs = computed(() => {
  const regions = attractions.map(a => a.region)
  return ['全部', ...new Set(regions)]
})

// 显示列表（全部=Mock 20，地区=后端返回的 Top 20）
const filteredPopularList = computed(() => popularList.value)

// 切换地区：点击图例区域按钮 → 按区域筛选景点
async function switchRegion(region) {
  activeRegion.value = region
  activeProvince.value = ''  // 清除省份筛选
  regionLoading.value = true
  try {
    if (region === '全部') {
      const res = await fetch(`${API_BASE}/region-hot?region=全部`)
      const json = await res.json()
      if (json.success && json.data?.length) {
        const backendNames = new Set(json.data.map(p => p.name.replace(/[（(].+[)）]/g, '').trim()))
        const missingMocks = attractions.filter(a => !backendNames.has(a.name))
        popularList.value = [...json.data, ...missingMocks]
      } else {
        popularList.value = attractions
      }
    } else {
      const res = await fetch(`${API_BASE}/region-hot?region=${encodeURIComponent(region)}`)
      const json = await res.json()
      const mockForRegion = attractions.filter(a => a.region === region)
      if (json.success && json.data?.length) {
        const backendNames = new Set(json.data.map(p => p.name.replace(/[（(].+[)）]/g, '').trim()))
        const missingMocks = mockForRegion.filter(a => !backendNames.has(a.name))
        popularList.value = [...json.data, ...missingMocks]
      } else {
        popularList.value = mockForRegion
      }
    }
  } catch {
    popularList.value = region === '全部' ? attractions : attractions.filter(a => a.region === region)
  } finally {
    regionLoading.value = false
  }
}

// 切换省份：点击地图省份 → 按省份精确搜索景点
async function switchProvince({ province, region }) {
  activeProvince.value = province
  activeRegion.value = region
  regionLoading.value = true
  try {
    // 优先后端 API（传 province 参数做省份级精确搜索）
    const url = `${API_BASE}/region-hot?region=${encodeURIComponent(region)}&province=${encodeURIComponent(province)}`
    const res = await fetch(url)
    const json = await res.json()
    if (json.success && json.data?.length) {
      popularList.value = json.data
    } else {
      // 后端无结果时回退 mock
      popularList.value = attractions.filter(a => a.region === region && a.province === province)
    }
  } catch {
    popularList.value = attractions.filter(a => a.region === region && a.province === province)
  } finally {
    regionLoading.value = false
  }
}

const searchLoading = ref(false)
const DATA_SOURCE = ref('') // 'amap' | 'mock'

// --- 搜索防抖 + 请求取消 ---
let searchAbortController = null
let searchDebounceTimer = null
const DEBOUNCE_MS = 350

function cancelPendingSearch() {
  if (searchAbortController) {
    searchAbortController.abort()
    searchAbortController = null
  }
}

const handleSearch = async () => {
  const kw = keyword.value.trim()
  if (!kw) { searchResults.value = []; showDropdown.value = false; return }

  // 取消上一次未完成的请求
  cancelPendingSearch()

  searchLoading.value = true
  searchAbortController = new AbortController()
  try {
    const url = `${API_BASE}/search?keyword=${encodeURIComponent(kw)}`
    const res = await fetch(url, { signal: searchAbortController.signal })
    const json = await res.json()
    // 确保仍是当前关键词（防止竞态）
    if (keyword.value.trim() !== kw) return
    if (json.success && json.data) {
      searchResults.value = json.data
      DATA_SOURCE.value = json.source || 'amap'
    } else {
      searchResults.value = []
      DATA_SOURCE.value = ''
    }
  } catch (e) {
    if (e.name === 'AbortError') return // 被取消，静默
    ElMessage.error('搜索失败，请检查网络后重试')
    searchResults.value = []
  } finally {
    searchLoading.value = false
    showDropdown.value = true
  }
}

/** 防抖版搜索：停止输入 DEBOUNCE_MS 后才发起请求 */
const handleSearchDebounced = () => {
  const kw = keyword.value.trim()
  if (!kw) { searchResults.value = []; showDropdown.value = false; cancelPendingSearch(); return }
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => handleSearch(), DEBOUNCE_MS)
}

/** focus 时如果已有内容则立即搜索（不防抖，用户可能点击输入框想查看之前的下拉） */
const handleSearchFocus = () => {
  if (keyword.value.trim() && searchResults.value.length === 0) {
    handleSearch()
  } else if (searchResults.value.length > 0) {
    showDropdown.value = true
  }
}

/** 立即刷新当前搜索（回车/快捷标签等手动触发，不防抖） */
async function flushAndSearch() {
  clearTimeout(searchDebounceTimer)
  cancelPendingSearch()
  await handleSearch()
}

const handleSearchEnter = async () => {
  if (!keyword.value.trim()) return
  await flushAndSearch()
  if (searchResults.value.length === 1) {
    goPlan(searchResults.value[0])
  }
}

const clearSearch = () => {
  keyword.value = ''
  searchResults.value = []
  showDropdown.value = false
  DATA_SOURCE.value = ''
  cancelPendingSearch()
  clearTimeout(searchDebounceTimer)
  searchInputRef.value?.focus()
}

// 快捷搜索标签点击（立即搜索，不防抖）
function quickSearch(tag) {
  keyword.value = tag
  flushAndSearch()
  searchInputRef.value?.focus()
}

const goPlan = (item) => {
  showDropdown.value = false
  // 统一走动态规划路径，传 name/lat/lng/address/city
  router.push({
    path: `/home/lifeServices/travelGuide/plan/${item.id}`,
    query: {
      name: item.name,
      lat: item.lat,
      lng: item.lng,
      address: item.address || item.desc || '',
      city: item.city || item.province || ''
    }
  })
}

// ===== 多景点串联选择 =====
const multiAttractions = computed(() => store.state.plan.multiPlanAttractions)
const multiCount = computed(() => store.getters['plan/multiPlanCount'])
const dialogVisible = ref(false)

// 统一化景点数据（不同来源的卡片数据结构不同）
function normalizeAttraction(item) {
  return {
    id: item.id,
    name: item.name || '',
    emoji: item.emoji || '📍',
    region: item.region || '',
    province: item.province || '',
    city: item.city || '',
    level: item.level || '',
    rating: item.rating || '',
    cost: item.cost || '',
    desc: item.desc || item.address || '',
    address: item.address || '',
    lat: item.lat,
    lng: item.lng,
    mockId: item.mockId || null,
    photos: item.photos || null,
    color: (regionColors[item.region] || {}).tag || '#6366f1'
  }
}

// 收集回调：拖入到悬浮按钮时触发
function onCollectAttraction(attraction) {
  const normalized = normalizeAttraction(attraction)
  const exists = store.state.plan.multiPlanAttractions.find(a => a.id === normalized.id)
  if (!exists) {
    store.commit('plan/TOGGLE_MULTI_ATTRACTION', normalized)
  }
}

// 弹框操作
function openDialog() { dialogVisible.value = true }
function closeDialog() { dialogVisible.value = false }

function handleDialogConfirm(attractions) {
  store.commit('plan/SET_MULTI_ATTRACTIONS', attractions)
  dialogVisible.value = false
  if (attractions.length === 1) {
    goPlan(attractions[0])
  } else {
    router.push('/home/lifeServices/travelGuide/plan-multi')
  }
}

function handleDialogRemove(idx) {
  const item = store.state.plan.multiPlanAttractions[idx]
  if (item) store.commit('plan/REMOVE_MULTI_ATTRACTION', item.id)
}

function handleDialogClear() {
  store.commit('plan/CLEAR_MULTI_ATTRACTIONS')
}

function handleDialogAutoSort() {
  const list = [...store.state.plan.multiPlanAttractions]
  list.sort((a, b) => {
    const latA = parseFloat(a.lat) || 0, latB = parseFloat(b.lat) || 0
    if (Math.abs(latA - latB) > 0.01) return latB - latA
    const lngA = parseFloat(a.lng) || 0, lngB = parseFloat(b.lng) || 0
    return lngA - lngB
  })
  store.commit('plan/REORDER_MULTI_ATTRACTIONS', list)
}

function handleDialogReorder(newOrder) {
  store.commit('plan/REORDER_MULTI_ATTRACTIONS', newOrder)
}

// 拖拽 composable
const { isDragging, isDragOverBtn, justDragged, ghostStyle, ghostContent,
  onPointerDown: dragPointerDown, onPointerMove: dragPointerMove,
  onPointerUp: dragPointerUp, onPointerCancel: dragPointerCancel
} = useCardDrag({ onCollect: onCollectAttraction })

// 卡片点击处理：拖拽刚结束时阻止 click
function onCardClick(item) {
  if (justDragged.value) return
  goPlan(item)
}

const floatBtnVisible = computed(() => isDragging.value || multiCount.value > 0)

// 点击外部关闭下拉
function handleClickOutside(e) {
  const dropdown = document.querySelector('.search-dropdown')
  const searchBox = document.querySelector('.search-box')
  if (dropdown && !dropdown.contains(e.target) && searchBox && !searchBox.contains(e.target)) {
    showDropdown.value = false
  }
}
onMounted(() => {
  // 先用缓存或默认数据渲染，后台静默获取后端最新热度排序
  popularList.value = attractions
  document.addEventListener('click', handleClickOutside)
  // 后台静默获取真实热度排序（switchRegion 内部会更新 popularList）
  switchRegion('全部')
})
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

// --- 默认封面图（无图片时的占位图，CSS 渐变模拟自然风景） ---
const defaultCoverSrc = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7dd3fc"/>
      <stop offset="50%" stop-color="#bae6fd"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </linearGradient>
    <linearGradient id="mtn1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4ade80"/>
      <stop offset="100%" stop-color="#22c55e"/>
    </linearGradient>
    <linearGradient id="mtn2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#86efac"/>
      <stop offset="100%" stop-color="#4ade80"/>
    </linearGradient>
    <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>
  <rect width="400" height="200" fill="url(#sky)"/>
  <circle cx="300" cy="54" r="28" fill="url(#sun)" opacity="0.9"/>
  <ellipse cx="160" cy="35" rx="50" ry="10" fill="white" opacity="0.75"/>
  <ellipse cx="176" cy="28" rx="34" ry="7" fill="white" opacity="0.65"/>
  <ellipse cx="300" cy="48" rx="40" ry="8" fill="white" opacity="0.45"/>
  <polygon points="0,200 50,90 100,130 180,60 240,110 300,80 340,120 400,70 400,200" fill="url(#mtn2)" opacity="0.6"/>
  <polygon points="-40,200 30,106 80,140 180,80 260,130 320,100 370,130 440,90 440,200" fill="url(#mtn1)"/>
  <rect x="0" y="175" width="400" height="25" fill="#bbf7d0"/>
</svg>`)}`

// --- 附近推荐 ---
const nearbyLoading = ref(false)
const nearbyLoaded = ref(false)
const nearbyError = ref('')
const nearbyAddress = ref('')
const nearbyPois = ref([])
const nearbySortBy = ref('distance')
const nearbyRadius = ref(30000) // 默认 30km
const radiusOptions = [
  { label: '5km', value: 5000 },
  { label: '10km', value: 10000 },
  { label: '30km', value: 30000 },
  { label: '50km', value: 50000 }
]

function resortNearbyPois() {
  const list = [...nearbyPois.value]
  if (nearbySortBy.value === 'distance') {
    list.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
  } else {
    list.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
  }
  nearbyPois.value = list
}

// 过滤评分 < 3 的景点（未评分保留）
function filterLowRated(pois) {
  return pois.filter(p => !p.rating || parseFloat(p.rating) >= 3)
}

// 纯搜索：用已知坐标 + 当前半径搜索附近景点
async function searchNearbyPois(lng, lat) {
  nearbyLoading.value = true
  nearbyError.value = ''
  try {
    const res = await fetch(`${API_BASE}/nearby`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lng, lat, radius: nearbyRadius.value })
    })
    const json = await res.json()
    if (json.success && json.data) {
      nearbyAddress.value = json.data.address || ''
      nearbyPois.value = filterLowRated(json.data.pois || [])
      resortNearbyPois()
    } else {
      nearbyError.value = '获取附近景点失败'
    }
  } catch {
    nearbyError.value = '搜索附近景点失败'
  } finally {
    nearbyLoading.value = false
    nearbyLoaded.value = true
  }
}

// 切换搜索距离
function changeNearbyRadius(radius) {
  if (nearbyRadius.value === radius) return
  nearbyRadius.value = radius
  if (nearbyCurrentLng && nearbyCurrentLat) {
    searchNearbyPois(nearbyCurrentLng, nearbyCurrentLat)
  }
}

// 手动精确定位
const nearbyRefineInput = ref('')
const nearbyRefineLoading = ref(false)
// 当前使用的经纬度（用于 re-search）
let nearbyCurrentLng = 0
let nearbyCurrentLat = 0

async function refineNearbyLocation() {
  const addr = nearbyRefineInput.value.trim()
  if (!addr) return
  nearbyRefineLoading.value = true
  try {
    const geoRes = await fetch(`${API_BASE}/geocode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: addr })
    })
    const geoJson = await geoRes.json()
    if (!geoJson.success || !geoJson.data) {
      ElMessage.warning('未找到该地址，请尝试更详细的地址（如「上海浦东新区上丰路」）')
      return
    }
    const { lng, lat } = geoJson.data
    nearbyCurrentLng = lng
    nearbyCurrentLat = lat
    nearbyAddress.value = geoJson.data.formatted_address || addr
    nearbyError.value = ''
    nearbyRefineInput.value = ''
    // 用精确坐标 + 当前半径重新搜索附近
    await searchNearbyPois(lng, lat)
    ElMessage.success('已定位到：' + (geoJson.data.formatted_address || addr))
  } catch {
    ElMessage.error('定位失败，请重试')
  } finally {
    nearbyRefineLoading.value = false
  }
}

/**
 * 定位策略（从快到慢，从精到粗）：
 *   1. 浏览器原生 GPS         → 精确，但需 HTTPS + 用户授权（HTTP 环境直接跳过）
 *   2. 前端直连公共 IP 服务     → 浏览器亲自请求，对方看到用户真实 IP，不受后端代理/NAT 影响
 *   3. 后端高德 IP 定位        → 生产环境 nginx 代理下可用，开发环境本地 IP 会失败
 *   4. 默认位置（北京）         → 最后的兜底
 */
/**
 * 前端直连 IP 定位（浏览器亲自请求公共 IP 服务，拿到用户真实公网 IP） */
async function frontendIpLocate() {
  const controllers = []
  const services = [
    // ip-api.com — 免费 45次/分钟，支持 CORS，返回 lat/lon/city
    fetch('http://ip-api.com/json/?fields=status,lat,lon,city,country', {
      signal: (controllers[0] = new AbortController()).signal
    }).then(async r => {
      const d = await r.json()
      if (d.status === 'success' && d.lat && d.lon) {
        return { lng: d.lon, lat: d.lat, address: [d.city, d.country].filter(Boolean).join('，') }
      }
      return null
    }).catch(() => null),
    // ipapi.co — 免费 1000次/天，HTTPS，备用
    fetch('https://ipapi.co/json/', {
      signal: (controllers[1] = new AbortController()).signal
    }).then(async r => {
      const d = await r.json()
      if (d.latitude && d.longitude) {
        return { lng: d.longitude, lat: d.latitude, address: [d.city, d.region, d.country_name].filter(Boolean).join('，') }
      }
      return null
    }).catch(() => null)
  ]

  // 3 秒超时 — 取最先成功的那个
  const timer = new Promise((_, reject) => setTimeout(() => {
    controllers.forEach(c => c.abort())
    reject(new Error('frontend ip locate timeout'))
  }, 3000))

  try {
    const result = await Promise.race([...services, timer])
    controllers.forEach(c => c.abort()) // 取消未完成的
    return result
  } catch {
    return null
  }
}

// --- 附近位置会话缓存：同一页面生命周期内避免重复定位 ---
let cachedNearbyLocation = null // { lng, lat }

async function locateUser() {
  // 如果已有缓存，直接复用
  if (cachedNearbyLocation) return cachedNearbyLocation

  let lng, lat
  let located = false

  // 第一步：浏览器 GPS（在 HTTPS 下可用，HTTP 下直接失败 → 很快）
  try {
    const pos = await getCurrentPosition(3000)
    lng = pos.lng
    lat = pos.lat
    located = true
  } catch (_) { /* 意料之中，继续 */ }

  // 第二步：前端直连公共 IP 服务（浏览器亲自请求 → 对方看到用户真实 IP）
  if (!located) {
    console.log('[Nearby] 尝试前端直连 IP 定位...')
    try {
      const ipPos = await frontendIpLocate()
      if (ipPos) {
        lng = ipPos.lng
        lat = ipPos.lat
        located = true
        nearbyError.value = '已通过 IP 获取大致位置'
        console.log('[Nearby] 前端 IP 定位成功:', ipPos.address)
      }
    } catch (_) { /* 继续 */ }
  }

  // 第三步：后端高德 IP 定位（生产环境 nginx 代理下可用）
  if (!located) {
    console.log('[Nearby] 尝试后端 IP 定位...')
    try {
      const ipRes = await fetch(`${API_BASE}/ip-locate`)
      const ipJson = await ipRes.json()
      if (ipJson.success && ipJson.data && ipJson.data.source !== 'default') {
        lng = ipJson.data.lng
        lat = ipJson.data.lat
        located = true
        nearbyError.value = '已通过 IP 获取大致位置'
        console.log('[Nearby] 后端 IP 定位成功:', ipJson.data.address)
      }
    } catch (_) { /* 继续 */ }
  }

  // 第四步：默认位置
  if (!located) {
    console.warn('[Nearby] 所有定位方式均失败，使用默认位置')
    lng = 116.397
    lat = 39.908
    nearbyError.value = '定位失败，已使用默认位置展示附近推荐'
  }

  // 缓存定位结果，页面生命周期内复用
  cachedNearbyLocation = { lng, lat }
  return cachedNearbyLocation
}

async function loadNearby() {
  nearbyLoading.value = true
  nearbyError.value = ''

  try {
    const { lng, lat } = await locateUser()
    nearbyCurrentLng = lng
    nearbyCurrentLat = lat
    await searchNearbyPois(lng, lat)
  } catch (e) {
    nearbyError.value = e.message === '用户拒绝了位置请求'
      ? '请在浏览器设置中允许位置访问'
      : '获取位置失败'
  } finally {
    nearbyLoading.value = false
    nearbyLoaded.value = true
  }
}

function getCurrentPosition(timeout = 3000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('浏览器不支持定位')); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lng: pos.coords.longitude, lat: pos.coords.latitude }),
      (err) => {
        const msg = err.code === 1
          ? '用户拒绝了位置请求（非 HTTPS 环境也可能触发此错误）'
          : (err.message || '浏览器定位不可用')
        reject(new Error(msg))
      },
      { timeout, enableHighAccuracy: false }
    )
  })
}

function formatDistance(m) {
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
}

// --- 地址搜索 ---
const addressInput = ref('')

const addressLoading = ref(false)
const addressSearched = ref(false)
const addressPois = ref([])
const addressSortBy = ref('rating')

function resortAddressPois() {
  const list = [...addressPois.value]
  if (addressSortBy.value === 'distance') {
    list.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
  } else {
    list.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
  }
  addressPois.value = list
}

async function searchByAddress() {
  const addr = addressInput.value.trim()
  if (!addr) return
  addressLoading.value = true
  addressSearched.value = true
  try {
    // 直接按城市搜索全市景点（高德文本搜索，覆盖整个行政区划，按评分排序）
    const res = await fetch(`${API_BASE}/searchByCity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: addr })
    })
    const json = await res.json()
    if (!json.success) {
      ElMessage.warning(json.message || '未找到该地址')
      addressPois.value = []
      return
    }
    nearbyAddress.value = json.data?.address || addr
    addressPois.value = json.data?.pois || []
    if (!addressPois.value.length) {
      ElMessage.info('该城市暂未搜索到景点')
    }
  } catch {
    ElMessage.error('搜索失败，请重试')
  } finally {
    addressLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.search-page {
  max-width: 960px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
  position: relative;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

// 拖拽幽灵元素
.drag-ghost {
  position: fixed;
  z-index: 998;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(99, 102, 241, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 14px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.4);
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.2s, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  &.visible {
    opacity: 1;
    transform: scale(1);
  }
  .ghost-emoji { font-size: 20px; line-height: 1; }
  .ghost-name { white-space: nowrap; max-width: 160px; overflow: hidden; text-overflow: ellipsis; }
}

// 正在被拖拽的源卡片
.popular-card.dragging-source,
.nearby-card.dragging-source {
  opacity: 0.4;
  transform: scale(0.95);
  transition: all 0.2s;
}

// ===== Hero =====
.hero-section {
  position: relative;
  padding: 32px 24px 32px;
  text-align: center;
  overflow: hidden;
  isolation: isolate;
  width: 100vw;
  margin-left: calc((100vw - 100%) / -2);
}
.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(170deg, #faf5ff 0%, #fdf2f8 25%, #fff1f2 50%, #f0f4ff 75%, #f5f3ff 100%);
  // 网格纹理
  .hero-mesh {
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle at 20% 30%, rgba(99,102,241,0.06) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(236,72,153,0.05) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(168,85,247,0.04) 0%, transparent 60%);
  }
  // 流动光球
  .hero-gradient-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    animation: orbFloat 8s ease-in-out infinite alternate;
    &.orb-1 {
      width: 300px; height: 300px;
      background: rgba(99,102,241,0.12);
      top: -80px; right: -60px;
    }
    &.orb-2 {
      width: 200px; height: 200px;
      background: rgba(236,72,153,0.1);
      bottom: -40px; left: -30px;
      animation-delay: -3s;
      animation-duration: 6s;
    }
    &.orb-3 {
      width: 160px; height: 160px;
      background: rgba(168,85,247,0.08);
      top: 40%; left: 50%;
      animation-delay: -5s;
      animation-duration: 10s;
    }
  }
  // 浮动粒子
  .hero-particles {
    position: absolute;
    inset: 0;
    .particle {
      position: absolute;
      left: var(--x);
      top: var(--y);
      width: var(--size);
      height: var(--size);
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      opacity: 0;
      animation: particleFloat var(--duration) ease-in-out var(--delay) infinite;
    }
  }
}
@keyframes orbFloat {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -20px) scale(1.1); }
  100% { transform: translate(-15px, 15px) scale(0.95); }
}
@keyframes particleFloat {
  0%, 100% { opacity: 0; transform: translateY(0) scale(0); }
  10% { opacity: 0.6; }
  30% { opacity: 0; transform: translateY(-30px) scale(1); }
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 580px;
  margin: 0 auto;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 18px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(99,102,241,0.15);
  border-radius: 24px;
  font-size: 13px;
  color: #6366f1;
  font-weight: 600;
  margin-bottom: 24px;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 12px rgba(99,102,241,0.06);
  .badge-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px rgba(16,185,129,0.4);
    animation: dotPulse 2s ease-in-out infinite;
  }
}
@keyframes dotPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.8); }
}

.hero-title {
  font-size: 36px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
  line-height: 1.2;
}
.title-highlight {
  position: relative;
  display: inline-block;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  .title-underline {
    position: absolute;
    left: 0;
    bottom: -4px;
    width: 100%;
    height: 12px;
  }
}
.hero-desc {
  font-size: 15px;
  color: #64748b;
  margin: 0 auto;
  line-height: 1.6;
  font-weight: 400;
  white-space: nowrap;
}
.hero-subtitle {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
  letter-spacing: 0.5px;
}

// 数据统计条
.hero-stats {
  display: inline-flex;
  align-items: center;
  gap: 0;
  margin-top: 20px;
  padding: 10px 24px;
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(226,232,240,0.8);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(99,102,241,0.05);
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0 16px;
  .stat-num {
    font-size: 20px;
    font-weight: 800;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .stat-label {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 500;
  }
}
.stat-divider {
  width: 1px;
  height: 26px;
  background: linear-gradient(to bottom, transparent, #e2e8f0, transparent);
}

// ===== Tabs Wrapper =====
.search-tabs-wrapper {
  position: relative;
  z-index: 2;
  margin-top: -24px;
  margin-bottom: 40px;
  display: flex;
  justify-content: center;
  padding: 0 24px;
}
.search-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 5px;
  background: rgba(255,255,255,.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06);
  border: 1px solid rgba(255,255,255,.8);
}
.tab-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 24px;
  border: none;
  background: transparent;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all .3s cubic-bezier(.4,0,.2,1);
  white-space: nowrap;
  .tab-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: transform .3s cubic-bezier(.34,1.56,.64,1);
    color: inherit;
  }
  .tab-label {
    transition: color .3s;
    letter-spacing: .3px;
  }
  .tab-active-indicator {
    display: none;
  }
  &.active {
    color: #fff;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    box-shadow: 0 2px 8px rgba(99,102,241,.3), 0 4px 16px rgba(139,92,246,.15);
    font-weight: 600;
    .tab-icon-wrap {
      transform: scale(1.1);
    }
  }
  &:hover:not(.active) {
    color: #6366f1;
    background: rgba(99,102,241,.06);
  }
}

// ===== Tab Panel =====
.tab-panel { padding: 0 24px 40px; }

// ===== Search Box =====
.search-box {
  display: flex;
  align-items: stretch; // 关键：stretch 让按钮自然填满整个高度
  background: rgba(255,255,255,.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1.5px solid rgba(226,232,240,.8);
  border-radius: 16px;
  padding: 0;
  height: 52px;
  transition: all 0.3s cubic-bezier(.4,0,.2,1);
  box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(99,102,241,.04);
  overflow: hidden;
  &:focus-within {
    border-color: #6366f1;
    box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 6px 24px rgba(99,102,241,.12);
  }
  &.has-dropdown {
    border-color: #6366f1;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 4px 20px rgba(99,102,241,0.12);
  }
}
.search-icon { color: #94a3b8; margin-left: 16px; margin-right: 10px; flex-shrink: 0; align-self: center; }
.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  color: #0f172a;
  background: transparent;
  &::placeholder { color: #94a3b8; }
}
.clear-icon { color:#94a3b8; cursor:pointer; flex-shrink:0; margin-right: 8px; align-self: center; &:hover{color:#64748b;} }
.search-btn {
  flex-shrink: 0;
  padding: 0 24px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
  border: none;
  border-radius: 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: .3px;
  transition: all 0.25s;
  &:hover:not(:disabled) { background: linear-gradient(135deg, #4f46e5, #6366f1); opacity: 0.95; }
  &:active:not(:disabled) { transform: scale(0.97); }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
}

.search-dropdown {
  margin-top: 0;
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1.5px solid #6366f1;
  border-top: 1px solid rgba(226,232,240,.6);
  border-radius: 0 0 16px 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,.1);
  overflow: hidden;
  position: relative;
  z-index: 10;
}
.dropdown-loading {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 24px 16px; color: #6366f1; font-size: 14px;
}
.dropdown-item {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px;
  cursor: pointer; transition: all 0.2s ease;
  &:hover { background: rgba(99,102,241,.06); }
  &:not(:last-child) { border-bottom: 1px solid rgba(241,245,249,.8); }
}
.item-thumb {
  width: 48px; height: 48px; border-radius: 10px; overflow: hidden;
  background: linear-gradient(135deg, #eef2ff, #f5f3ff);
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  color: #6366f1;
  img { width: 100%; height: 100%; object-fit: cover; }
}
.item-info { flex: 1; min-width: 0; }
.item-name-row { display: flex; align-items: center; gap: 6px; }
.item-name { font-size: 15px; font-weight: 600; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-level-mini {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  color: #f59e0b;
  background: #fffbeb;
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid #fde68a;
}
.item-desc { display: block; font-size: 12px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 3px; }
.item-rating { flex-shrink: 0; }
.item-arrow { color: #cbd5e1; flex-shrink: 0; }
.dropdown-footer {
  padding: 10px 16px;
  background: rgba(238,242,255,.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-top: 1px solid rgba(199,210,254,.5);
  text-align: center;
  display: flex; flex-direction: column; gap: 2px;
}
.mock-tip { font-size: 12px; color: #b45309; }
.real-tip { font-size: 12px; color: #6366f1; font-weight: 500; }
.real-tip-sub { font-size: 11px; color: #94a3b8; }
.dropdown-empty {
  padding: 32px 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  .mock-tip { font-size: 12px; margin-top: 2px; }
}

// 下拉动画
.dropdown-fade-enter-active { animation: dropdownIn 0.2s ease-out; }
.dropdown-fade-leave-active { animation: dropdownIn 0.15s ease-in reverse; }
@keyframes dropdownIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

// ===== Quick Tags =====
.quick-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 20px;
  padding: 0 2px;
}
.quick-tags-label {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
  margin-right: 4px;
  white-space: nowrap;
}
.quick-tag-btn {
  padding: 6px 16px;
  border: 1px solid rgba(226,232,240,.8);
  background: rgba(255,255,255,.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 20px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.25s cubic-bezier(.4,0,.2,1);
  &:hover {
    border-color: #6366f1;
    color: #6366f1;
    background: rgba(99,102,241,.08);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(99,102,241,.1);
  }
}

// ===== Popular =====
.popular-section { margin-top: 32px; }
.section-header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin-bottom: 20px;
  gap: 10px;
}
.section-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.section-count {
  font-size: 12px;
  font-weight: 600;
  color: #6366f1;
  background: #eef2ff;
  padding: 2px 10px;
  border-radius: 10px;
}

// Region filters
.region-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.region-filter-btn {
  padding: 7px 16px;
  border: 1px solid rgba(226,232,240,.8);
  background: rgba(255,255,255,.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 10px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(.4,0,.2,1);
  font-weight: 500;
  letter-spacing: .3px;
  white-space: nowrap;
  &:hover {
    border-color: #6366f1;
    color: #6366f1;
    background: rgba(99,102,241,.06);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(99,102,241,.08);
  }
  &.active {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 2px 8px rgba(99,102,241,.3);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}

// Province filter bar
.province-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 10px 16px;
  background: rgba(239,246,255,.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(191,219,254,.6);
  border-radius: 12px;
  font-size: 13px;
  flex-wrap: wrap;
}
.province-filter-label {
  color: #3b82f6;
  font-weight: 600;
  white-space: nowrap;
}
.province-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #3b82f6;
  color: #fff;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  white-space: nowrap;
}
.province-filter-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.3);
  color: #fff;
  font-size: 10px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: background 0.15s;
  &:hover { background: rgba(255,255,255,0.5); }
}
.province-filter-hint {
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}

.popular-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}
.popular-card {
  --card-color: #6366f1;
  position: relative;
  background: rgba(255,255,255,.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(226,232,240,.7);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0,0,0,.03);
  &:hover {
    border-color: var(--card-color);
    box-shadow: 0 12px 40px rgba(99,102,241,0.13), 0 1px 3px rgba(0,0,0,.03);
    transform: translateY(-4px);
    .card-action { color: var(--card-color); }
    .cover-emoji { transform: scale(1.08) translateY(-3px); }
    .card-level-badge { transform: scale(1.05); }
  }
}

// Rank badge
.card-rank {
  position: absolute;
  top: 10px;
  left: 12px;
  font-size: 20px;
  z-index: 3;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.12));
  &.card-rank-num {
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    background: rgba(0,0,0,0.45);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

// Level badge (top-right)
.card-level-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  box-shadow: 0 2px 8px rgba(245,158,11,0.35);
  transition: transform 0.3s;
  &.level-4 { background: linear-gradient(135deg, #3b82f6, #6366f1); box-shadow: 0 2px 8px rgba(59,130,246,0.35); }
  &.level-3 { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 2px 8px rgba(16,185,129,0.3); }
}

// Cover
.card-cover {
  height: 140px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
  overflow: hidden;
}
.cover-emoji {
  font-size: 60px;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,0.12));
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

// Body
.card-body {
  padding: 14px 16px 6px;
  flex: 1;
}
.card-header-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.card-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.card-rating {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: #f59e0b;
  background: #fffbeb;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

// Feature tags
.card-features {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
}
.feature-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f0f0ff;
  color: #6366f1;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid #e0e7ff;
}

// Location
.card-location {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.card-region-tag {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}
.card-city-text {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Description
.card-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

// Footer
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px 14px;
  border-top: 1px solid #f1f5f9;
  margin-top: auto;
}
.card-cost {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}
.card-action {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 3px;
  transition: color 0.3s;
  margin-left: auto;
}

// ===== 定位提示行（浅灰轻提示）=====
.locate-hint-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 16px;
  .el-icon { flex-shrink: 0; color: #94a3b8; }
}
.locate-hint-relocate {
  border: none;
  background: none;
  font-size: 12px;
  color: #94a3b8;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  padding: 0;
  &:hover { color: #6366f1; }
}

// 错误提示
.locate-error {
  margin: 0 0 12px;
  font-size: 13px;
  color: #ef4444;
}

// ===== 精确定位搜索框（对齐 search-box 风格）=====
.refine-search-box {
  display: flex;
  align-items: stretch;
  background: rgba(255,255,255,.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1.5px solid rgba(226,232,240,.8);
  border-radius: 16px;
  padding: 0;
  height: 52px;
  transition: all .3s cubic-bezier(.4,0,.2,1);
  box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(99,102,241,.04);
  margin-bottom: 24px;
  overflow: hidden;
  &:focus-within {
    border-color: #6366f1;
    box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 6px 24px rgba(99,102,241,.12);
  }
}
.refine-search-icon {
  color: #94a3b8;
  margin-left: 16px;
  margin-right: 10px;
  flex-shrink: 0;
  align-self: center;
}
.refine-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  color: #0f172a;
  background: transparent;
  &::placeholder { color: #94a3b8; }
}
.refine-search-btn {
  flex-shrink: 0;
  padding: 0 24px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
  border: none;
  border-radius: 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: .3px;
  transition: all .25s;
  white-space: nowrap;
  &:hover:not(:disabled) { background: linear-gradient(135deg, #4f46e5, #6366f1); opacity: 0.95; }
  &:active:not(:disabled) { transform: scale(0.97); }
  &:disabled { opacity: .35; cursor: not-allowed; }
}

.sort-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  flex-wrap: wrap;
  gap: 12px;
  background: rgba(255,255,255,.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(226,232,240,.6);
  border-radius: 14px;
  margin-top: 22px;
}
.sort-count {
  font-size: 14px;
  color: #475569;
  font-weight: 600;
  padding: 4px 0;
}
.sort-pills {
  display: inline-flex;
  gap: 3px;
  padding: 4px;
  background: rgba(241,245,249,.7);
  border-radius: 11px;
  border: 1px solid rgba(226,232,240,.4);
}
.sort-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: none;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  background: transparent;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  .pill-icon {
    font-size: 14px;
    line-height: 1;
  }
  &:hover:not(.active) {
    color: #6366f1;
    background: rgba(99,102,241,0.08);
    transform: translateY(-1px);
  }
  &.active {
    color: #fff;
    background: linear-gradient(135deg, #6366f1, #818cf8);
    box-shadow: 0 3px 12px rgba(99,102,241,0.35);
    .pill-icon {
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));
    }
  }
}

// ===== Nearby Controls Panel =====
.nearby-controls {
  margin-bottom: 20px;
  padding: 14px 20px;
  background: rgba(255,255,255,.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(226,232,240,.7);
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,.03), 0 4px 16px rgba(0,0,0,.04);
}
.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.controls-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.controls-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
}
.controls-divider {
  width: 1px;
  height: 24px;
  background: #e2e8f0;
  flex-shrink: 0;
}
.radius-pills {
  display: inline-flex;
  gap: 3px;
  padding: 4px;
  background: rgba(241,245,249,.7);
  border: 1px solid rgba(226,232,240,.4);
  border-radius: 10px;
}
.radius-pill {
  padding: 5px 13px;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  letter-spacing: 0.3px;
  &:hover:not(.active):not(:disabled) {
    color: #6366f1;
    background: rgba(99,102,241,0.07);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &.active {
    color: #fff;
    background: linear-gradient(135deg, #6366f1, #818cf8);
    box-shadow: 0 2px 8px rgba(99,102,241,0.3);
  }
}

.nearby-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 14px;
}
.nearby-card {
  background: rgba(255,255,255,.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(226,232,240,.7);
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(.4,0,.2,1);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,.03);
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  &:hover {
    border-color: #6366f1;
    box-shadow: 0 8px 28px rgba(99,102,241,0.12), 0 1px 3px rgba(0,0,0,.03);
    transform: translateY(-3px);
  }
}
.nb-cover {
  height: 120px; background: #f1f5f9; overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; }
}
.nb-default-img {
  opacity: 0.85;
}
.nb-body { padding: 14px; }
.nb-name { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 6px; }
.nb-addr {
  font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 4px;
  margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.nb-meta { display: flex; gap: 6px; }

// ===== Skeleton =====
.skeleton-card {
  pointer-events: none;
  .skeleton-bg { animation: shimmer 1.5s infinite; }
}
.skeleton-bg {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 8px;
  &.skeleton-name { width: 65%; height: 16px; }
  &.skeleton-desc { width: 85%; }
  &.short { width: 45%; }
  &.skeleton-cost { width: 30%; height: 12px; display: inline-block; margin-bottom: 0; }
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 768px) {
  .hero-section { padding: 28px 16px 26px; }
  .hero-title { font-size: 26px; }
  .hero-desc { font-size: 13px; white-space: normal; }
  .hero-subtitle { font-size: 11px; }
  .hero-gradient-orb {
    &.orb-1 { width: 200px; height: 200px; top: -40px; right: -40px; }
    &.orb-2 { width: 140px; height: 140px; }
    &.orb-3 { width: 100px; height: 100px; }
  }
  .hero-stats { padding: 10px 18px; margin-top: 16px; border-radius: 14px; }
  .stat-item { padding: 0 12px; .stat-num { font-size: 17px; } .stat-label { font-size: 10px; } }
  .stat-divider { height: 22px; }
  .title-underline { bottom: -2px; }
  .search-tabs-wrapper { margin-top: -16px; margin-bottom: 28px; }
  .tab-btn { padding: 9px 20px; gap: 6px;
    .tab-icon-wrap { display: none; }
    .tab-label { font-size: 14px; }
  }
  .popular-section { margin-top: 14px; }
  .section-header { gap: 6px; margin-bottom: 10px; }
  .popular-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
  .section-header-left { justify-content: space-between; }
  .region-filters {
    gap: 6px;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }
  .region-filter-btn {
    flex-shrink: 0;
    padding: 8px 16px;
    font-size: 13px;
    border-radius: 20px;
    white-space: nowrap;
  }
  .quick-tags-label { display: none; }
  .quick-tag-btn { font-size: 11px; padding: 4px 10px; }
  .card-cover { height: 110px; }
  .cover-emoji { font-size: 44px; }
  .card-body { padding: 10px 12px 4px; }
  .card-name { font-size: 14px; }
  .card-desc { font-size: 12px; }
  .card-features { gap: 3px; }
  .feature-tag { font-size: 10px; padding: 1px 6px; }
  .search-box { height: 46px; border-radius: 14px; }
  .search-icon { margin-left: 12px; }
  .search-btn { padding: 0 18px; font-size: 13px; }
  .sort-bar { margin-top: 18px; padding: 10px 14px; border-radius: 12px; }
  .sort-count { font-size: 13px; }
  .sort-pill { padding: 6px 12px; font-size: 13px; }
  .card-footer { padding: 6px 12px 12px; }
  .nearby-controls { padding: 12px 14px; margin-bottom: 16px; }
  .controls-row { flex-direction: column; align-items: stretch; gap: 10px; }
  .controls-section { justify-content: space-between; }
  .controls-divider { display: none; }
  .radius-pill { padding: 4px 10px; font-size: 11px; }
  // 定位提示移动端
  .locate-hint-row { font-size: 12px; }
  .refine-search-box { height: 46px; margin-bottom: 18px; border-radius: 14px; }
  .refine-search-icon { margin-left: 12px; }
  .refine-search-input { font-size: 14px; &::placeholder { font-size: 12px; } }
  .refine-search-btn { padding: 0 18px; font-size: 13px; }
  // 移动端 hero-desc 换行
  .hero-desc { white-space: normal; }
}

@media (max-width: 480px) {
  .hero-section { padding: 24px 14px 22px; }
  .hero-title { font-size: 22px; }
  .hero-desc { font-size: 12px; white-space: normal; }
  .hero-stats { padding: 8px 14px; margin-top: 14px; border-radius: 12px; gap: 0; }
  .stat-item { padding: 0 8px; .stat-num { font-size: 15px; } .stat-label { font-size: 10px; } }
  .stat-divider { height: 18px; }
  .search-tabs-wrapper { padding: 0 12px; margin-top: -14px; margin-bottom: 22px; }
  .tab-btn { padding: 8px 14px; gap: 5px;
    .tab-icon-wrap { display: none; }
    .tab-label { font-size: 12px; }
  }
  .search-tabs { padding: 4px; border-radius: 12px; }
  .popular-section { margin-top: 10px; }
  .section-header { gap: 4px; margin-bottom: 8px; }
  .popular-grid { grid-template-columns: 1fr; }
  .sort-bar { margin-top: 18px; padding: 10px 12px; border-radius: 12px; }
  .sort-count { font-size: 13px; }
  .sort-pill { padding: 6px 12px; font-size: 12px; }
  .nearby-grid { grid-template-columns: 1fr; }
  .region-filters { gap: 5px; }
  .region-filter-btn { padding: 6px 13px; font-size: 12px; flex-shrink: 0; white-space: nowrap; border-radius: 18px; }
  .nearby-controls { padding: 10px 12px; border-radius: 12px; margin-bottom: 12px; }
  .controls-section { gap: 6px; width: 100%; }
  .controls-label { display: none; }
  .radius-pill { padding: 4px 8px; font-size: 11px; }
  .sort-pill { padding: 6px 10px; font-size: 12px; }
  // 定位提示小屏
  .locate-hint-row { font-size: 11px; }
  .refine-search-box { height: 42px; margin-bottom: 14px; border-radius: 12px; }
  .refine-search-icon { margin-left: 10px; }
  .refine-search-input { font-size: 13px; &::placeholder { font-size: 11px; } }
  .refine-search-btn { padding: 0 14px; font-size: 12px; }
  .search-box { height: 42px; border-radius: 12px; }
  .search-btn { padding: 0 14px; font-size: 12px; }
  .quick-tag-btn { padding: 4px 10px; font-size: 11px; border-radius: 16px; }
  .card-cover { height: 90px; }
  .cover-emoji { font-size: 36px; }
}

// ==================== 夜间模式全覆盖 ====================
:global(html.dark-mode .search-page) {
  // ===== Hero 区域 =====
  .hero-section .hero-bg {
    background: linear-gradient(170deg, #0f0f2a 0%, #10102e 25%, #12122a 50%, #0e0e2e 75%, #0f0f2e 100%) !important;
    .hero-mesh { background-image: none !important; }
    .hero-gradient-orb {
      &.orb-1 { background: rgba(99,102,241,0.08) !important; }
      &.orb-2 { background: rgba(236,72,153,0.06) !important; }
      &.orb-3 { background: rgba(168,85,247,0.05) !important; }
    }
    .hero-particles .particle {
      background: linear-gradient(135deg, #6366f1, #a855f7) !important;
    }
  }
  .hero-badge {
    background: rgba(26,26,46,0.7) !important;
    border-color: rgba(99,102,241,0.2) !important;
    color: #a78bfa !important;
    box-shadow: 0 2px 12px rgba(99,102,241,0.1) !important;
    .badge-dot { background: #34d399 !important; box-shadow: 0 0 8px rgba(52,211,153,0.4) !important; }
  }
  .hero-title { color: #e2dee9 !important; }
  .title-highlight {
    background: linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #f472b6 100%) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
  }
  .hero-desc { color: #94a3b8 !important; }
  .hero-subtitle { color: #6b7280 !important; }
  .hero-stats {
    background: rgba(19,19,42,0.8) !important;
    border-color: rgba(45,45,74,0.6) !important;
    box-shadow: 0 4px 24px rgba(0,0,0,0.3) !important;
    .stat-num {
      background: linear-gradient(135deg, #818cf8, #a78bfa) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      background-clip: text !important;
    }
    .stat-label { color: #6b7280 !important; }
  }
  .stat-divider { background: linear-gradient(to bottom, transparent, #2d2d4a, transparent) !important; }

  // ===== Tabs 切换 =====
  .search-tabs {
    background: rgba(26,26,46,0.85) !important;
    border-color: rgba(45,45,74,0.6) !important;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
  }
  .tab-btn {
    color: #94a3b8 !important;
    &.active {
      color: #fff !important;
      background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
    }
    &:hover:not(.active) { color: #a78bfa !important; background: rgba(124,58,237,0.08) !important; }
  }

  // ===== 搜索框 =====
  .search-box {
    background: rgba(26,26,46,0.85) !important;
    border-color: rgba(45,45,74,0.7) !important;
    box-shadow: 0 4px 16px rgba(99,102,241,0.08) !important;
    &:focus-within, &.has-dropdown {
      border-color: #6366f1 !important;
      box-shadow: 0 6px 24px rgba(99,102,241,0.15) !important;
    }
    &.has-dropdown { border-radius: 16px 16px 0 0 !important; }
  }
  .search-icon { color: #64748b !important; }
  .search-input {
    color: #e2dee9 !important;
    &::placeholder { color: #64748b !important; }
  }
  .clear-icon { color: #64748b !important; &:hover { color: #94a3b8 !important; } }

  // ===== 搜索下拉 =====
  .search-dropdown {
    background: rgba(26,26,46,0.95) !important;
    border-color: #6366f1 !important;
    border-top-color: rgba(45,45,74,0.5) !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
  }
  .dropdown-loading { color: #a78bfa !important; }
  .dropdown-item {
    &:hover { background: rgba(124,58,237,0.08) !important; }
    &:not(:last-child) { border-bottom-color: #252540 !important; }
  }
  .item-thumb { background: linear-gradient(135deg, #1a1a2e, #1e1e3c) !important; color: #a78bfa !important; }
  .item-name { color: #e2dee9 !important; }
  .item-level-mini { color: #f59e0b !important; background: #2e1f0a !important; border-color: #5c3d1a !important; }
  .item-desc { color: #64748b !important; }
  .item-arrow { color: #4a4a6a !important; }
  .dropdown-footer {
    background: rgba(19,19,42,0.8) !important;
    border-top-color: rgba(45,45,74,0.5) !important;
  }
  .mock-tip { color: #fbbf24 !important; }
  .real-tip { color: #93c5fd !important; }
  .real-tip-sub { color: #64748b !important; }
  .dropdown-empty { color: #94a3b8 !important; .mock-tip { color: #64748b !important; } }

  // ===== Quick Tags =====
  .quick-tags-label { color: #64748b !important; }
  .quick-tag-btn {
    background: rgba(26,26,46,0.7) !important;
    border-color: rgba(45,45,74,0.6) !important;
    color: #94a3b8 !important;
    &:hover { border-color: #a78bfa !important; color: #a78bfa !important; background: rgba(124,58,237,0.1) !important; }
  }

  // ===== 热门推荐标题 & 区域筛选 =====
  .section-title { color: #e2dee9 !important; }
  .section-count { background: #1e1e3c !important; color: #a78bfa !important; }
  .region-filter-btn {
    background: rgba(26,26,46,0.7) !important;
    border-color: rgba(45,45,74,0.6) !important;
    color: #94a3b8 !important;
    &:hover:not(.active) {
      border-color: #a78bfa !important;
      color: #a78bfa !important;
      background: rgba(124,58,237,0.08) !important;
    }
    &.active {
      background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
      color: #fff !important;
      border-color: transparent !important;
    }
  }
  .province-filter-bar {
    background: rgba(26,26,46,0.7) !important;
    border-color: rgba(45,45,74,0.6) !important;
  }
  .province-filter-label { color: #93c5fd !important; }
  .province-filter-chip { background: #6366f1 !important; color: #fff !important; }
  .province-filter-clear { background: rgba(255,255,255,0.25) !important; color: #fff !important; }
  .province-filter-hint { color: #64748b !important; }

  // ===== 热门卡片 =====
  .popular-card {
    background: rgba(26,26,46,0.8) !important;
    border-color: rgba(45,45,74,0.7) !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
    &:hover {
      border-color: var(--card-color, #6366f1) !important;
      box-shadow: 0 12px 40px rgba(99,102,241,0.18), 0 1px 3px rgba(0,0,0,0.2) !important;
    }
    &.dragging-source { opacity: 0.4 !important; }
  }
  .card-name { color: #e2dee9 !important; }
  .card-desc { color: #94a3b8 !important; }
  .card-city-text { color: #64748b !important; }
  .card-rating { background: #2e1f0a !important; color: #fbbf24 !important; }
  .feature-tag { background: #1e1e3c !important; color: #a78bfa !important; border-color: #2d2d4a !important; }
  .card-region-tag { color: #fff !important; }
  .card-footer { border-top-color: #252540 !important; }
  .card-cost { color: #94a3b8 !important; }
  .card-action { color: #64748b !important; }
  .card-rank.card-rank-num { background: rgba(0,0,0,0.65) !important; }

  // ===== 拖拽幽灵 =====
  .drag-ghost-card {
    background: rgba(99,102,241,0.2) !important;
    border-color: #a78bfa !important;
    .ghost-name { color: #a78bfa !important; }
  }

  // ===== Skeleton =====
  .skeleton-bg, .skeleton-line {
    background: linear-gradient(90deg, #252540 25%, #2d2d4a 50%, #252540 75%) !important;
  }

  // ===== 排序栏 =====
  .sort-bar {
    background: rgba(26,26,46,0.7) !important;
    border-color: rgba(45,45,74,0.6) !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
  }
  .sort-count { color: #94a3b8 !important; }
  .sort-pills { background: rgba(19,19,42,0.5) !important; border-color: rgba(45,45,74,0.4) !important; }
  .sort-pill {
    color: #94a3b8 !important;
    &:hover:not(.active) { color: #a78bfa !important; background: rgba(124,58,237,0.08) !important; }
    &.active {
      color: #fff !important;
      background: linear-gradient(135deg, #6366f1, #818cf8) !important;
    }
  }

  // ===== 附近搜索控制面板 =====
  .nearby-controls {
    background: rgba(26,26,46,0.75) !important;
    border-color: rgba(45,45,74,0.7) !important;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2) !important;
  }
  .controls-label { color: #94a3b8 !important; }
  .controls-divider { background: #2d2d4a !important; }
  .radius-pills { background: rgba(19,19,42,0.5) !important; border-color: rgba(45,45,74,0.4) !important; }
  .radius-pill {
    color: #94a3b8 !important;
    &:hover:not(.active):not(:disabled) { color: #a78bfa !important; background: rgba(124,58,237,0.08) !important; }
    &.active {
      color: #fff !important;
      background: linear-gradient(135deg, #6366f1, #818cf8) !important;
    }
  }

  // ===== 附近景点卡片 =====
  .nearby-card {
    background: rgba(26,26,46,0.8) !important;
    border-color: rgba(45,45,74,0.7) !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
    &:hover {
      border-color: #6366f1 !important;
      box-shadow: 0 8px 28px rgba(99,102,241,0.15), 0 1px 3px rgba(0,0,0,0.2) !important;
    }
    &.dragging-source { opacity: 0.4 !important; }
  }
  .nb-cover { background: #1a1a2e !important; }
  .nb-name { color: #e2dee9 !important; }
  .nb-addr { color: #64748b !important; }

  // ===== 精确定位搜索框 =====
  .refine-search-box {
    background: rgba(26,26,46,0.85) !important;
    border-color: rgba(45,45,74,0.7) !important;
    box-shadow: 0 4px 16px rgba(99,102,241,0.08) !important;
    &:focus-within {
      border-color: #6366f1 !important;
      box-shadow: 0 6px 24px rgba(99,102,241,0.15) !important;
    }
  }
  .refine-search-icon { color: #64748b !important; }
  .refine-search-input {
    color: #e2dee9 !important;
    &::placeholder { color: #64748b !important; }
  }

  // ===== 定位提示 =====
  .locate-hint-row { color: #64748b !important; .el-icon { color: #64748b !important; } }
  .locate-hint-relocate { color: #64748b !important; &:hover { color: #a78bfa !important; } }
  .locate-error { color: #f87171 !important; }

  // ===== 幽灵元素 =====
  .drag-ghost { background: rgba(124,58,237,0.92) !important; }
}
</style>

<template>
  <div class="search-video-panel">
    <!-- 不支持名称搜索的平台提示 -->
    <div v-if="isUnsupportedPlatform && !searching" class="platform-search-hint">
      <el-icon :size="16"><WarningFilled /></el-icon>
      <span>{{ platformLabelMap[searchPlatform] }}链接播放功能开发中，敬请期待</span>
    </div>

    <!-- 名称搜索框 -->
    <div class="search-box">
      <div class="search-row">
        <!-- <el-icon class="input-icon" :size="20"><Search /></el-icon> -->
        <input
          v-model="searchQuery"
          class="search-video-input"
          placeholder="输入名称搜索"
          :disabled="searching"
          @keydown.enter="handleSearch"
        />
        <el-icon v-if="searchQuery && !searching" class="clear-icon" :size="18" @click="searchQuery = ''">
          <CircleClose />
        </el-icon>
        <span class="platform-divider"></span>
        <div class="platform-select-wrap" @click.stop="platformDropdownOpen = !platformDropdownOpen">
          <span class="platform-select-text">{{ platformLabelMap[searchPlatform] || 'B站' }}</span>
          <el-icon :size="14" class="platform-arrow" :class="{ open: platformDropdownOpen }"><ArrowDown /></el-icon>
          <!-- 自定义下拉面板（作为 platform-select-wrap 的定位参照，水平居中） -->
          <div v-if="platformDropdownOpen" class="platform-dropdown" @click.stop>
            <div
              v-for="opt in platformOptions"
              :key="opt.value"
              class="platform-dropdown-item"
              :class="{ active: searchPlatform === opt.value }"
              @click="selectPlatform(opt.value)"
            >{{ opt.label }}</div>
          </div>
        </div>
        <button class="search-btn" :disabled="!searchQuery.trim() || searching" @click="handleSearch">
          <el-icon v-if="!searching" :size="18"><Search /></el-icon>
          <el-icon v-else class="is-loading" :size="18"><Loading /></el-icon>
        </button>
      </div>
    </div>

    <!-- 搜索加载遮罩层 -->
    <div v-if="searching" class="search-loading-overlay">
      <div class="search-loading-card">
        <div class="search-loading-icon">
          <el-icon class="is-loading" :size="48"><Loading /></el-icon>
        </div>
        <h3 class="search-loading-title">正在搜索中...</h3>
        <p class="search-loading-query">"{{ searchQuery }}"</p>
        <p class="search-loading-platform">
          搜索范围：{{ { auto: 'B站', bilibili: 'B站', douyin: '抖音', kuaishou: '快手', haokan: '好看视频' }[searchPlatform] || 'B站' }}
        </p>
        <div class="search-loading-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: Math.min(searchElapsed / 60 * 100, 95) + '%' }"></div>
          </div>
          <span class="progress-text">已等待 {{ searchElapsed }} 秒{{ searchElapsed > 30 ? '，yt-dlp 搜索较慢请耐心等待' : '' }}{{ searchElapsed > 55 ? '，即将完成...' : '' }}</span>
        </div>
        <p class="search-loading-hint">搜索过程中请勿刷新页面或切换模式</p>
      </div>
    </div>

    <!-- 搜索历史 -->
    <div v-if="searchHistory.length" class="history-line">
      <span class="history-label">历史：</span>
      <span
        v-for="(kw, idx) in searchHistory"
        :key="idx"
        class="history-item"
        @click="quickSearch(kw)"
      >{{ kw }}</span>
      <button class="history-line-clear" @click="clearSearchHistory">清空</button>
    </div>

    <!-- 视频播放区（由父组件 slot 注入，放在搜索框、搜索历史下方） -->
    <slot name="player"></slot>

    <!-- 搜索结果（放在播放器下方） -->
    <div v-if="(searchGroups.length > 0 || searchUngrouped.length > 0)" class="search-results-section">
      <div class="search-results-header">
        <h3>
          🔍 搜索结果
          <span class="result-count">
            ({{ searchGroups.length }} 部剧目{{ searchGroups.length > 0 ? '，共 ' + totalEpisodes + ' 集' : '' }}{{ searchUngrouped.length > 0 ? ' + ' + searchUngrouped.length + ' 个独立视频' : '' }})
          </span>
        </h3>
        <span class="search-platform-badge">{{ {
          auto: '自动', bilibili: 'B站', douyin: '抖音', kuaishou: '快手', haokan: '好看视频'
        }[searchPlatform] || '自动' }}</span>
      </div>

      <!-- 剧集分组卡片 -->
      <div v-if="searchGroups.length > 0" class="show-groups-list">
        <div
          v-for="(group, gi) in searchGroups"
          :key="'g-' + gi"
          class="show-group-card"
          :class="{ expanded: expandedGroups.has(gi) }"
        >
          <!-- 剧目头部 -->
          <div class="show-group-header" @click="toggleGroup(gi)">
            <div class="show-group-thumb">
              <img
                v-if="group.thumbnail"
                :src="group.thumbnail"
                referrerpolicy="no-referrer"
                loading="lazy"
                class="show-group-thumb-img"
                alt=""
              />
              <span v-else class="show-group-thumb-placeholder">📺</span>
            </div>
            <div class="show-group-info">
              <p class="show-group-name">{{ group.showName }}</p>
              <p class="show-group-meta">
                <span class="show-ep-count">{{ group.episodeCount }} 集</span>
                <span v-if="group.uploader" class="show-uploader">· {{ group.uploader }}</span>
                <span v-if="groupPlaylists[gi]" class="show-full-tag">· 已加载全部 {{ groupPlaylists[gi].length }} 集</span>
              </p>
            </div>
            <div class="show-group-actions">
              <button
                v-if="group.uploaderUrl"
                class="fetch-playlist-btn"
                :class="{ loading: loadingPlaylists.has(gi) }"
                :disabled="loadingPlaylists.has(gi)"
                @click.stop="fetchFullPlaylist(gi, group)"
                :title="'获取该UP主全部' + group.showName + '剧集'"
              >
                <el-icon v-if="loadingPlaylists.has(gi)" class="is-loading" :size="14"><Loading /></el-icon>
                <span v-else>获取全部剧集</span>
              </button>
              <el-icon class="expand-icon" :class="{ rotated: expandedGroups.has(gi) }" :size="20">
                <ArrowDown />
              </el-icon>
            </div>
          </div>

          <!-- 剧集列表（展开后显示） -->
          <transition name="episode-expand">
            <div v-if="expandedGroups.has(gi)" class="show-episodes-panel">
              <div class="episodes-grid">
                <div
                  v-for="ep in (groupPlaylists[gi] || group.episodes)"
                  :key="ep.id"
                  class="episode-card"
                  :class="{ playing: playingEpisodeId === ep.id }"
                  @click="playEpisode(ep)"
                >
                  <div class="ep-thumb">
                    <img
                      v-if="ep.thumbnail"
                      :src="ep.thumbnail"
                      referrerpolicy="no-referrer"
                      loading="lazy"
                      class="ep-thumb-img"
                      alt=""
                    />
                    <span v-else class="ep-thumb-placeholder">🎬</span>
                    <span v-if="ep.durationString" class="ep-duration">{{ ep.durationString }}</span>
                    <div v-if="playingEpisodeId === ep.id" class="ep-playing-overlay">
                      <el-icon :size="28"><VideoPlay /></el-icon>
                      <span>播放中</span>
                    </div>
                  </div>
                  <div class="ep-info">
                    <p class="ep-title" :title="ep.title">{{ ep.title }}</p>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- 独立视频（非剧集） -->
      <div v-if="searchUngrouped.length > 0" class="ungrouped-section">
        <h4 class="ungrouped-title">🎬 独立视频</h4>
        <div class="search-results-grid">
          <div
            v-for="item in searchUngrouped"
            :key="item.id"
            class="search-result-card"
            @click="playEpisode(item)"
          >
            <div class="card-thumb">
              <img
                v-if="item.thumbnail"
                :src="item.thumbnail"
                referrerpolicy="no-referrer"
                loading="lazy"
                class="card-thumb-img"
                alt=""
              />
              <span v-else class="card-thumb-placeholder">🎬</span>
              <span v-if="item.durationString" class="card-duration">{{ item.durationString }}</span>
            </div>
            <div class="card-info">
              <p class="card-title" :title="item.title">{{ item.title }}</p>
              <p class="card-uploader" v-if="item.uploader">{{ item.uploader }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无搜索结果 -->
    <div v-if="searchNoResult" class="search-no-result">
      <p>未找到相关视频，请换个关键词试试</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Search, CircleClose, Loading, WarningFilled, ArrowDown, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['switchMode', 'playEpisode', 'closePlayer'])

// ==================== 搜索状态 ====================
const searchQuery = ref('')
const searchPlatform = ref('bilibili')
const searching = ref(false)
const searchElapsed = ref(0)
const platformDropdownOpen = ref(false)
const platformOptions = [
  { value: 'bilibili', label: 'B站' },
  { value: 'douyin', label: '抖音' },
  { value: 'kuaishou', label: '快手' },
  { value: 'haokan', label: '好看视频' }
]
const platformLabelMap = {
  bilibili: 'B站',
  douyin: '抖音',
  kuaishou: '快手',
  haokan: '好看视频'
}
function selectPlatform(val) {
  searchPlatform.value = val
  platformDropdownOpen.value = false
}
let searchTimer = null
const searchGroups = ref([])
const searchUngrouped = ref([])
const searchNoResult = ref(false)
const searchHistory = ref(loadSearchHistory())

// 剧集分组相关状态
const expandedGroups = ref(new Set())
const groupPlaylists = ref({})
const loadingPlaylists = ref(new Set())
const playingEpisodeId = ref('')

// 不支持名称搜索的平台（yt-dlp 无对应名称搜索协议）
const unsupportedPlatforms = new Set(['douyin', 'kuaishou', 'haokan'])
const isUnsupportedPlatform = computed(() => unsupportedPlatforms.has(searchPlatform.value))

const totalEpisodes = computed(() => {
  return searchGroups.value.reduce((sum, g) => sum + g.episodeCount, 0)
})

function toggleGroup(gi) {
  const newSet = new Set(expandedGroups.value)
  if (newSet.has(gi)) {
    newSet.delete(gi)
  } else {
    newSet.add(gi)
  }
  expandedGroups.value = newSet
}

async function fetchFullPlaylist(gi, group) {
  if (!group.uploaderUrl) return
  if (loadingPlaylists.value.has(gi)) return

  const loadingSet = new Set(loadingPlaylists.value)
  loadingSet.add(gi)
  loadingPlaylists.value = loadingSet

  try {
    const res = await fetch('/staticTool/api/video-parse/ytdlp/playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: group.uploaderUrl, limit: 100 })
    })
    const data = await res.json()
    if (data?.code === 0 && data.data?.videos?.length > 0) {
      const keyword = group.showName.replace(/\s+/g, '')
      const filtered = data.data.videos.filter(v =>
        v.title && (
          v.title.includes(group.showName) ||
          v.title.includes(keyword) ||
          v.playlistIndex > 0
        )
      )
      const newPlaylists = { ...groupPlaylists.value }
      newPlaylists[gi] = filtered.length > 0 ? filtered : data.data.videos
      groupPlaylists.value = newPlaylists

      if (filtered.length > 0) {
        const newSet = new Set(expandedGroups.value)
        newSet.add(gi)
        expandedGroups.value = newSet
      }
      ElMessage.success(`已获取 ${filtered.length || data.data.videos.length} 集`)
    } else {
      ElMessage.warning('未能获取到更多剧集')
    }
  } catch (err) {
    console.error('获取剧集列表失败:', err)
    ElMessage.error('获取剧集列表失败')
  } finally {
    const loadingSet = new Set(loadingPlaylists.value)
    loadingSet.delete(gi)
    loadingPlaylists.value = loadingSet
  }
}

function playEpisode(ep) {
  playingEpisodeId.value = ep.id
  emit('playEpisode', ep)
}

function loadSearchHistory() {
  try {
    return JSON.parse(localStorage.getItem('vip_video_search_history') || '[]')
  } catch { return [] }
}

function saveSearchHistory(kw) {
  const list = [kw, ...searchHistory.value.filter(k => k !== kw)].slice(0, 20)
  searchHistory.value = list
  try {
    localStorage.setItem('vip_video_search_history', JSON.stringify(list))
  } catch { /* ignore */ }
}

function clearSearchHistory() {
  searchHistory.value = []
  try { localStorage.removeItem('vip_video_search_history') } catch { /* ignore */ }
  ElMessage.success('搜索记录已清空')
}

function quickSearch(kw) {
  searchQuery.value = kw
  handleSearch()
}

// 根据 URL 自动识别所属平台
const platformUrlPatterns = [
  { platform: 'douyin', hosts: ['douyin.com', 'iesdouyin.com'] },
  { platform: 'kuaishou', hosts: ['kuaishou.com', 'gifshow.com'] },
  { platform: 'bilibili', hosts: ['bilibili.com', 'b23.tv', 'bilibili.tv'] },
  { platform: 'haokan', hosts: ['haokan.baidu.com'] }
]
function detectPlatformFromUrl(str) {
  // 直接检查是否包含已知平台域名，不强制要求 http(s):// 前缀
  // 用户经常粘贴不带协议的链接（如 douyin.com/video/xxx）
  const match = platformUrlPatterns.find(p => p.hosts.some(h => str.includes(h)))
  return match ? match.platform : null
}

// 输入变化时，如果识别到链接则自动切换平台下拉
watch(searchQuery, (val) => {
  const url = (val || '').trim()
  const detected = detectPlatformFromUrl(url)
  if (detected) {
    // 识别到链接 → 自动切换对应平台
    searchPlatform.value = detected
  } else if (!url) {
    // 清空输入框 → 回到默认B站
    if (searchPlatform.value !== 'bilibili') {
      searchPlatform.value = 'bilibili'
    }
  } else {
    // 非链接文本（名称搜索）→ 只有B站支持，自动切到B站
    searchPlatform.value = 'bilibili'
  }
})

async function handleSearch() {
  const q = searchQuery.value.trim()
  if (!q) {
    ElMessage.warning('请输入视频名称')
    return
  }

  // 每次搜索前：清理旧搜索结果、关闭播放器（换平台/换关键词都重新开始）
  searchGroups.value = []
  searchUngrouped.value = []
  searchNoResult.value = false
  expandedGroups.value = new Set()
  groupPlaylists.value = {}
  loadingPlaylists.value = new Set()
  playingEpisodeId.value = ''
  emit('closePlayer')

  // 抖音/快手/好看链接播放功能开发中
  if (['douyin', 'kuaishou', 'haokan'].includes(searchPlatform.value)) {
    ElMessage.warning(`${platformLabelMap[searchPlatform.value]}链接播放功能开发中，敬请期待`)
    return
  }

  searching.value = true
  searchElapsed.value = 0
  searchTimer = setInterval(() => {
    searchElapsed.value++
  }, 1000)

  try {
    const res = await fetch('/staticTool/api/video-parse/ytdlp/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: q,
        platform: searchPlatform.value,
        limit: 10
      })
    })
    const data = await res.json()
    if (data?.code === 0 && data.data) {
      searchGroups.value = data.data.groups || []
      searchUngrouped.value = data.data.ungrouped || []

      if (searchGroups.value.length === 0 && searchUngrouped.value.length === 0) {
        searchNoResult.value = true
      } else {
        saveSearchHistory(q)
      }
    } else {
      searchNoResult.value = true
    }
  } catch (err) {
    console.error('搜索失败:', err)
    ElMessage.error('搜索失败，请检查网络或稍后重试')
  } finally {
    clearInterval(searchTimer)
    searchTimer = null
    searching.value = false
  }
}

// 平台变化时关闭箭头状态
watch(searchPlatform, () => {
  platformDropdownOpen.value = false
})

// 点击外部关闭下拉
function handlePlatformClickOutside(e) {
  if (!e.target.closest('.platform-select-wrap') && !e.target.closest('.platform-dropdown')) {
    platformDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handlePlatformClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handlePlatformClickOutside)
})

// 暴露给父组件的方法
defineExpose({
  clearResults() {
    searchGroups.value = []
    searchUngrouped.value = []
    searchNoResult.value = false
    expandedGroups.value = new Set()
    groupPlaylists.value = {}
    playingEpisodeId.value = ''
  }
})
</script>

<style lang="scss" scoped src="./SearchVideo.scss"></style>

<style lang="scss">
/* 暗黑模式（不 scoped，与 UrlParse.vue 保持一致） */
html.dark-mode .search-video-panel {
  .history-line { color: #94a3b8; }
  .history-label { color: #64748b; }
  .history-item {
    color: #94a3b8;
    &::after { color: #64748b; }
    &:hover { color: #a78bfa; }
  }
  .history-line-clear {
    color: #64748b;
    &:hover { color: #f87171; }
  }
}
</style>


<template>
  <div class="search-video-panel">
    <!-- 不支持名称搜索的平台提示 -->
    <div v-if="isUnsupportedPlatform && !searching" class="platform-search-hint">
      <el-icon :size="16"><WarningFilled /></el-icon>
      <span>{{ { tencent: '腾讯视频', youku: '优酷', iqiyi: '爱奇艺', mgtv: '芒果TV' }[searchPlatform] }}暂不支持名称搜索，将在B站中搜索相关视频</span>
      <span class="hint-action" @click="$emit('switchMode', 'url')">如需观看该平台独播剧集，请切换到「链接解析」模式</span>
    </div>

    <!-- 名称搜索框 -->
    <div class="search-box">
      <div class="search-row">
        <!-- <el-icon class="input-icon" :size="20"><Search /></el-icon> -->
        <input
          v-model="searchQuery"
          class="url-input"
          placeholder="输入视频名称搜索（如：周杰伦 稻香 MV）"
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
          搜索范围：{{ { auto: 'B站 + YouTube', bilibili: 'B站', youtube: 'YouTube', tencent: 'B站 + YouTube', youku: 'B站 + YouTube', iqiyi: 'B站 + YouTube', mgtv: 'B站 + YouTube' }[searchPlatform] || 'B站 + YouTube' }}
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

    <!-- 搜索结果 -->
    <div v-if="(searchGroups.length > 0 || searchUngrouped.length > 0)" class="search-results-section">
      <div class="search-results-header">
        <h3>
          🔍 搜索结果
          <span class="result-count">
            ({{ searchGroups.length }} 部剧目{{ searchGroups.length > 0 ? '，共 ' + totalEpisodes + ' 集' : '' }}{{ searchUngrouped.length > 0 ? ' + ' + searchUngrouped.length + ' 个独立视频' : '' }})
          </span>
        </h3>
        <span class="search-platform-badge">{{ {
          auto: '自动', bilibili: 'B站', youtube: 'YouTube',
          tencent: '腾讯视频', youku: '优酷', iqiyi: '爱奇艺', mgtv: '芒果TV'
        }[searchPlatform] || '自动' }}</span>
      </div>

      <!-- 剧集分组卡片 -->
      <div class="show-groups-list">
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

    <!-- 使用指南 -->
    <div class="search-guide">
      <div class="guide-header">使用指南</div>
      <div class="guide-list">
        <div class="guide-item">
          <span class="guide-step">1、</span>
          <div class="guide-body">
            <span class="guide-title">搜索片源</span>
            <span class="guide-desc">输入关键词即可搜索全网视频，支持中文、英文和拼音</span>
          </div>
        </div>
        <div class="guide-item">
          <span class="guide-step">2、</span>
          <div class="guide-body">
            <span class="guide-title">平台筛选</span>
            <span class="guide-desc">支持 B站、腾讯视频、优酷、爱奇艺、芒果TV、YouTube 等平台，可通过下拉菜单指定</span>
          </div>
        </div>
        <div class="guide-item">
          <span class="guide-step">3、</span>
          <div class="guide-body">
            <span class="guide-title">播放视频</span>
            <span class="guide-desc">点击搜索结果卡片即可直接播放，无需手动输入链接</span>
          </div>
        </div>
        <div class="guide-item">
          <span class="guide-step">4、</span>
          <div class="guide-body">
            <span class="guide-title">备用方案</span>
            <span class="guide-desc">如短视频无法播放，可切换至链接解析或VIP视频标签页尝试其他方式观看</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Search, CircleClose, Loading, WarningFilled, ArrowDown, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['switchMode', 'playEpisode'])

// ==================== 搜索状态 ====================
const searchQuery = ref('')
const searchPlatform = ref('bilibili')
const searching = ref(false)
const searchElapsed = ref(0)
const platformDropdownOpen = ref(false)
const platformOptions = [
  { value: 'bilibili', label: 'B站' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'bilibili_youtube', label: 'B站 + YouTube' },
  { value: 'tencent', label: '腾讯视频' },
  { value: 'youku', label: '优酷' },
  { value: 'iqiyi', label: '爱奇艺' },
  { value: 'mgtv', label: '芒果TV' }
]
const platformLabelMap = {
  bilibili: 'B站',
  youtube: 'YouTube',
  bilibili_youtube: 'B站 + YouTube',
  tencent: '腾讯视频',
  youku: '优酷',
  iqiyi: '爱奇艺',
  mgtv: '芒果TV'
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

// 不支持名称搜索的平台
const unsupportedPlatforms = new Set(['tencent', 'youku', 'iqiyi', 'mgtv'])
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

async function handleSearch() {
  const q = searchQuery.value.trim()
  if (!q) {
    ElMessage.warning('请输入视频名称')
    return
  }

  // 不支持名称搜索的平台提示
  if (isUnsupportedPlatform.value) {
    const platformNames = {
      tencent: '腾讯视频', youku: '优酷', iqiyi: '爱奇艺', mgtv: '芒果TV'
    }
    ElMessage.warning(`${platformNames[searchPlatform.value]}暂不支持名称搜索，将在B站中搜索相关视频`)
  }

  searching.value = true
  searchElapsed.value = 0
  searchTimer = setInterval(() => {
    searchElapsed.value++
  }, 1000)
  searchGroups.value = []
  searchUngrouped.value = []
  searchNoResult.value = false
  expandedGroups.value = new Set()
  groupPlaylists.value = {}
  loadingPlaylists.value = new Set()
  playingEpisodeId.value = ''

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

<style lang="scss" scoped>
// 搜索框
.search-box { position: relative; margin-bottom: 0; }
.search-row {
  display: flex;
  align-items: stretch;
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  transition: all 0.25s ease;
}
.input-icon { color: #94a3b8; margin: 0 12px 0 16px; flex-shrink: 0; align-self: center; }
.url-input {
  flex: 1; border: none; outline: none; font-size: 16px; color: #0f172a; background: transparent; min-width: 0; padding: 14px 16px;
  &::placeholder { color: #94a3b8; }
}
.clear-icon { color: #94a3b8; cursor: pointer; flex-shrink: 0; align-self: center; margin-right: 12px; &:hover { color: #64748b; } }

// 平台选择（与 VIP 的线路样式一致：无边框、文字加粗、hover 背景）
.platform-divider {
  width: 1px;
  background: #e2e8f0;
  margin: 10px 0;
  flex-shrink: 0;
}
.platform-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  transition: background 0.2s;
  &:hover { background: #f8fafc; }
  &:hover .platform-select-text { color: #6366f1; }
  &:hover .platform-arrow { color: #6366f1; }
}
.platform-select-text {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
  transition: color 0.2s;
}
.platform-arrow {
  color: #94a3b8;
  flex-shrink: 0;
  transition: transform 0.2s, color 0.2s;
  &.open { transform: rotate(180deg); }
}

// 自定义下拉面板（相对于 .search-box 定位，在 search-row 下方）
.platform-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 150px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 6px;
  z-index: 30;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  animation: platformFadeIn 0.15s ease;
}
@keyframes platformFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.platform-dropdown-item {
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  &:hover { background: #eef2ff; color: #6366f1; }
  &.active { background: #eef2ff; color: #6366f1; font-weight: 600; }
}
.search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border: none;
  border-radius: 0 12px 12px 0;
  cursor: pointer;
  transition: all 0.25s ease;
  &:hover:not(:disabled) { background: linear-gradient(135deg, #4f46e5, #7c3aed); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

// 平台搜索提示
.platform-search-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 14px;
  margin-bottom: 10px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  font-size: 13px;
  color: #92400e;
  .hint-action {
    color: #6366f1;
    font-weight: 500;
    cursor: pointer;
    &:hover { text-decoration: underline; }
  }
}

// 搜索加载遮罩
.search-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.search-loading-card {
  background: #fff;
  border-radius: 20px;
  padding: 44px 48px;
  max-width: 440px;
  width: 90%;
  text-align: center;
  box-shadow: 0 24px 80px rgba(0,0,0,0.25);
  animation: scaleIn 0.3s ease-out;
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
.search-loading-icon { margin-bottom: 16px; color: #6366f1; }
.search-loading-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
.search-loading-query { font-size: 15px; color: #6366f1; font-weight: 600; margin: 0 0 4px; word-break: break-all; }
.search-loading-platform { font-size: 13px; color: #94a3b8; margin: 0 0 24px; }
.search-loading-progress {
  margin-bottom: 16px;
  .progress-bar {
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 10px;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border-radius: 3px;
    transition: width 0.5s ease;
    min-width: 2%;
  }
  .progress-text { font-size: 12px; color: #94a3b8; }
}
.search-loading-hint { font-size: 12px; color: #cbd5e1; margin: 0; }

// 搜索结果
.search-results-section { margin-bottom: 44px; }
.search-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  h3 { font-size: 18px; font-weight: 600; color: #0f172a; margin: 0; }
  .result-count { font-size: 13px; color: #94a3b8; font-weight: 400; }
}
.search-platform-badge {
  padding: 3px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  background: #f0f0ff;
  color: #6366f1;
}

// 剧集分组卡片
.show-groups-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}
.show-group-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  &:hover { border-color: #6366f1; box-shadow: 0 4px 20px rgba(99,102,241,0.1); }
  &.expanded { border-color: #6366f1; box-shadow: 0 6px 28px rgba(99,102,241,0.12); }
}
.show-group-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #fafbfd; }
}
.show-group-thumb {
  width: 120px;
  height: 68px;
  border-radius: 10px;
  overflow: hidden;
  background: #1e293b;
  flex-shrink: 0;
  position: relative;
}
.show-group-thumb-img { width: 100%; height: 100%; object-fit: cover; }
.show-group-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%; height: 100%;
  font-size: 28px;
  opacity: 0.5;
}
.show-group-info { flex: 1; min-width: 0; }
.show-group-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.show-group-meta {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.show-ep-count { color: #6366f1; font-weight: 600; }
.show-uploader { color: #94a3b8; }
.show-full-tag { color: #22c55e; font-weight: 500; }
.show-group-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.fetch-playlist-btn {
  padding: 6px 14px;
  border: 1px solid #6366f1;
  background: transparent;
  color: #6366f1;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  &:hover:not(:disabled) { background: #6366f1; color: #fff; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &.loading { background: #6366f1; color: #fff; opacity: 0.7; }
}
.expand-icon {
  color: #94a3b8;
  transition: transform 0.3s ease;
  &.rotated { transform: rotate(180deg); }
}

// 剧集展开面板
.show-episodes-panel { border-top: 1px solid #f1f5f9; background: #fafbfd; padding: 16px 20px; }
.episodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}
.episode-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
  &:hover { border-color: #6366f1; transform: translateY(-2px); box-shadow: 0 6px 18px rgba(99,102,241,0.15); }
  &.playing { border-color: #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,0.3); }
}
.ep-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #1e293b;
  position: relative;
  overflow: hidden;
}
.ep-thumb-img { width: 100%; height: 100%; object-fit: cover; }
.ep-thumb-placeholder { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 24px; opacity: 0.4; }
.ep-duration {
  position: absolute;
  bottom: 6px; right: 6px;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(0,0,0,0.75);
  color: #fff;
  font-size: 10px;
  font-weight: 500;
}
.ep-playing-overlay {
  position: absolute;
  inset: 0;
  background: rgba(34,197,94,0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}
.ep-info { padding: 8px 10px; }
.ep-title {
  font-size: 12px;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

// 展开动画
.episode-expand-enter-active,
.episode-expand-leave-active { transition: all 0.3s ease; overflow: hidden; }
.episode-expand-enter-from,
.episode-expand-leave-to { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }
.episode-expand-enter-to,
.episode-expand-leave-from { max-height: 2000px; }

// 独立视频
.ungrouped-section { margin-top: 24px; }
.ungrouped-title { font-size: 15px; font-weight: 600; color: #64748b; margin: 0 0 12px; }
.search-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.search-result-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  &:hover { border-color: #6366f1; transform: translateY(-4px); box-shadow: 0 12px 32px rgba(99,102,241,0.15); }
}
.card-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.card-thumb-img { width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; }
.card-thumb-placeholder { font-size: 40px; opacity: 0.4; }
.card-duration {
  position: absolute;
  bottom: 8px; right: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(0,0,0,0.8);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
}
.card-info { padding: 12px 14px; }
.card-title {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}
.card-uploader { font-size: 11px; color: #94a3b8; margin: 5px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.search-no-result { text-align: center; padding: 48px 20px; p { font-size: 14px; color: #94a3b8; } }

// 搜索历史（与 VIP 视频历史样式一致）
.history-line {
  margin-top: 8px;
  padding-left: 4px;
  font-size: 12px;
  color: #333;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  animation: fadeIn 0.2s ease;
}
.history-label {
  color: #999;
  flex-shrink: 0;
}
.history-item {
  cursor: pointer;
  transition: color 0.15s;
  &::after { content: '、'; color: #ccc; }
  &:last-of-type::after { content: ''; }
  &:hover { color: #6366f1; }
}
.history-line-clear {
  flex-shrink: 0;
  margin-left: 8px;
  padding: 0;
  border: none;
  background: none;
  font-size: 11px;
  color: #bbb;
  cursor: pointer;
  &:hover { color: #ef4444; }
}

// 使用指南（与 VIP 视频保持一致）
.search-guide {
  margin-top: 20px;
  margin-bottom: 28px;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #e8ecf4;
  border-radius: 12px;
  animation: fadeIn 0.3s ease;
}
.guide-header {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 14px;
}
.guide-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.guide-item {
  display: flex;
  align-items: flex-start;
  gap: 2px;
}
.guide-step {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 700;
  color: #475569;
}
.guide-body {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
  flex-wrap: wrap;
}
.guide-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  flex-shrink: 0;
}
.guide-desc {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.4;
}

// 响应式 - 平板
@media (max-width: 768px) {
  .search-row { border-radius: 12px; }
  .url-input { font-size: 15px; padding: 12px 14px; }
  .platform-select-wrap { padding: 0 12px; }
  .platform-select-text { font-size: 13px; }
  .platform-dropdown { min-width: 140px; }
  .search-btn { width: 44px; }
  .show-group-header { padding: 12px 14px; gap: 12px; }
  .show-group-thumb { width: 100px; height: 56px; }
  .show-group-name { font-size: 14px; }
  .show-group-meta { font-size: 12px; }
  .fetch-playlist-btn { padding: 4px 10px; font-size: 11px; }
  .show-episodes-panel { padding: 12px 14px; }
  .episodes-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
  .search-results-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
  .card-title { font-size: 12px; }
  .history-section { padding: 14px; margin-top: 20px; margin-bottom: 20px; }
  .history-header h3 { font-size: 14px; }
  .history-item { padding: 8px 10px; }
  .history-title { font-size: 13px; }
  .search-guide { padding: 14px; }
  .guide-header { font-size: 14px; }
  .guide-step { font-size: 13px; }
  .guide-title { font-size: 13px; }
  .guide-desc { font-size: 12px; }
}

// 响应式 - 手机
@media (max-width: 480px) {
  .search-row { border-radius: 12px; }
  .url-input { font-size: 14px; padding: 10px 12px; }
  .platform-select-wrap { padding: 0 10px; }
  .platform-select-text { font-size: 12px; }
  .platform-dropdown { min-width: 130px; }
  .search-btn { width: 40px; }
  .search-loading-card { padding: 28px 24px; }
  .search-loading-title { font-size: 18px; }
  .show-group-header { padding: 10px 12px; gap: 10px; flex-wrap: wrap; }
  .show-group-thumb { width: 80px; height: 45px; border-radius: 8px; }
  .show-group-name { font-size: 13px; }
  .show-group-meta { font-size: 11px; }
  .show-group-actions { gap: 6px; }
  .fetch-playlist-btn { padding: 3px 8px; font-size: 10px; }
  .show-episodes-panel { padding: 10px 12px; }
  .episodes-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; }
  .ep-title { font-size: 11px; }
  .search-results-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .card-info { padding: 8px 10px; }
  .card-title { font-size: 11px; }
  .card-duration { font-size: 10px; bottom: 4px; right: 4px; }
  .history-section { margin-top: 16px; margin-bottom: 16px; padding: 12px; }
  .history-index { width: 22px; height: 22px; font-size: 11px; }
  .search-guide { padding: 12px; margin-top: 14px; margin-bottom: 20px; }
  .guide-header { font-size: 14px; margin-bottom: 12px; }
  .guide-list { gap: 8px; }
  .guide-step { font-size: 13px; }
  .guide-title { font-size: 13px; }
  .guide-desc { font-size: 11px; }
}

// 深色模式
:global(html.dark-mode .search-video-panel) {
  .search-row {
    background: #1a1a2e;
    border-color: #2d2d4a;
  }
  .input-icon { color: #6b7280; }
  .url-input {
    color: #e2dee9;
    &::placeholder { color: #6b7280; }
    // 覆盖浏览器自动填充的浅色背景
    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus {
      -webkit-text-fill-color: #e2dee9;
      -webkit-box-shadow: 0 0 0 1000px #1a1a2e inset;
      caret-color: #e2dee9;
      transition: background-color 5000s ease-in-out 0s;
    }
  }
  .clear-icon { color: #6b7280; &:hover { color: #cbd5e1; } }
  .platform-divider { background: #2d2d4a; }
  .platform-select-wrap { background: #252540; &:hover { background: #2d2d50; } }
  .platform-select-text { color: #e2dee9; }
  .platform-arrow { color: #94a3b8; }
  .platform-dropdown {
    background: #1a1a2e;
    border-color: #2d2d4a;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  }
  .platform-dropdown-item {
    color: #94a3b8;
    &:hover { background: #2d2d50; color: #a78bfa; }
    &.active { background: #2d2d50; color: #a78bfa; }
  }
  .search-btn { background: linear-gradient(135deg, #7c3aed, #a78bfa);
    &:hover:not(:disabled) { background: linear-gradient(135deg, #6d28d9, #8b5cf6); }
  }
  .platform-search-hint {
    background: rgba(251,191,36,0.08); border-color: rgba(251,191,36,0.2); color: #fbbf24;
    .hint-action { color: #a78bfa; }
  }
  .search-loading-overlay { background: rgba(0,0,0,0.8); }
  .search-loading-card { background: #1a1a2e; box-shadow: 0 24px 80px rgba(0,0,0,0.5); }
  .search-loading-title { color: #e2dee9; }
  .search-loading-query { color: #a78bfa; }
  .search-loading-platform { color: #6b7280; }
  .search-loading-progress {
    .progress-bar { background: #2d2d4a; }
    .progress-text { color: #6b7280; }
  }
  .search-loading-hint { color: #4b5563; }
  .search-results-header h3 { color: #e2dee9; }
  .search-results-header .result-count { color: #6b7280; }
  .search-platform-badge { background: #252040; color: #a78bfa; }
  .show-group-card {
    background: #1a1a2e; border-color: #2d2d4a; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    &:hover { border-color: #7c3aed; box-shadow: 0 4px 20px rgba(124,58,237,0.15); }
    &.expanded { border-color: #7c3aed; box-shadow: 0 6px 28px rgba(124,58,237,0.15); }
  }
  .show-group-header { &:hover { background: #252540; } }
  .show-group-name { color: #e2dee9; }
  .show-group-meta { color: #6b7280; }
  .show-ep-count { color: #a78bfa; }
  .show-uploader { color: #6b7280; }
  .show-full-tag { color: #4ade80; }
  .fetch-playlist-btn {
    border-color: #7c3aed; color: #a78bfa;
    &:hover:not(:disabled) { background: #7c3aed; color: #fff; }
    &.loading { background: #7c3aed; color: #fff; }
  }
  .expand-icon { color: #6b7280; }
  .show-episodes-panel { border-top-color: #2d2d4a; background: #141425; }
  .episode-card {
    background: #1a1a2e; border-color: #2d2d4a;
    &:hover { border-color: #7c3aed; box-shadow: 0 6px 18px rgba(124,58,237,0.2); }
    &.playing { border-color: #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,0.3); }
  }
  .ep-title { color: #e2dee9; }
  .ungrouped-title { color: #94a3b8; }
  .search-result-card {
    background: #1a1a2e; border-color: #2d2d4a; box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    &:hover { border-color: #7c3aed; box-shadow: 0 12px 32px rgba(124,58,237,0.2); }
  }
  .card-title { color: #e2dee9; }
  .card-uploader { color: #6b7280; }
  .search-no-result p { color: #6b7280; }
  .history-line { color: #94a3b8; }
  .history-label { color: #64748b; }
  .history-item {
    &:hover { color: #a78bfa; }
  }
  .history-line-clear {
    color: #64748b;
    &:hover { color: #f87171; }
  }
  .search-guide {
    background: #1a1a2e; border-color: #2d2d4a;
  }
  .guide-header { color: #e2dee9; }
  .guide-item { background: transparent; }
  .guide-step { color: #94a3b8; }
  .guide-title { color: #e2dee9; }
  .guide-desc { color: #6b7280; }
}
</style>

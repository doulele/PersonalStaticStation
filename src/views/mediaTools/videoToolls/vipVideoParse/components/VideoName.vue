<template>
  <div class="video-name-panel">
    <!-- 融合搜索框 -->
    <div class="search-section" ref="searchSectionRef">
      <div class="search-fused">
        <input
          v-model="keyword"
          class="fused-input"
          placeholder="输入视频名称搜索..."
          @keydown.enter="search"
          @input="onKeywordChange"
          @focus="onInputFocus"
        />
        <span class="fused-divider"></span>
        <div class="fused-line" ref="fusedLineRef" @click.stop="toggleLineDropdown">
          <span class="fused-line-text">{{ selectedLineName }}</span>
          <el-icon :size="14" class="fused-line-arrow" :class="{ open: showLineDropdown }"><ArrowDown /></el-icon>
          <!-- 线路下拉（作为 fused-line 的定位参照，水平居中） -->
          <div v-if="showLineDropdown" class="line-dropdown" @click.stop>
            <div
              v-for="line in lines"
              :key="line.id"
              class="line-dropdown-item"
              :class="{ active: selectedLine === line.id }"
              @click="selectLine(line)"
            >{{ line.name }}</div>
          </div>
        </div>
        <button class="fused-btn" @click="search" :disabled="!keyword.trim()" title="搜索">
          <el-icon :size="18"><Search /></el-icon>
        </button>
      </div>

      <!-- 搜索历史 -->
      <div v-if="showHistory && history.length > 0" class="history-line">
        <span class="history-label">历史：</span>
        <span
          v-for="(item, idx) in history"
          :key="idx"
          class="history-item"
          @click="fillKeyword(item)"
        >{{ item }}</span>
        <button class="history-line-clear" @click="clearHistory">清空</button>
      </div>
    </div>

    <!-- 视频播放器 -->
    <div v-if="currentPlayItem" class="player-section">
      <div class="player-header">
        <div class="player-title-wrap">
          <el-icon :size="18"><VideoPlay /></el-icon>
          <span class="player-title">{{ currentPlayItem.title }}</span>
          <span v-if="currentPlayItem.type" class="player-type-tag">{{ currentPlayItem.type }}</span>
        </div>
        <button class="player-close" @click="closePlayer" title="关闭播放器">
          <el-icon :size="18"><Close /></el-icon>
        </button>
      </div>

      <!-- 剧集选择器 -->
      <div v-if="currentEpisodes.length > 1" class="episode-bar">
        <div class="episode-bar-top">
          <span class="episode-label">剧集（{{ currentEpisodes.length }}集）：</span>
          <div class="episode-bar-actions">
            <button
              class="toggle-btn"
              @click="episodeSortOrder = episodeSortOrder === 'desc' ? 'asc' : 'desc'"
              :title="episodeSortOrder === 'desc' ? '切换为正序（旧→新）' : '切换为倒序（新→旧）'"
            >{{ episodeSortOrder === 'desc' ? '倒序' : '正序' }}</button>
            <button
              class="toggle-btn"
              @click="episodeExpanded = !episodeExpanded"
              :title="episodeExpanded ? '收起剧集列表' : '展开剧集列表'"
            >
              <el-icon :size="12"><ArrowUp v-if="episodeExpanded" /><ArrowDown v-else /></el-icon>
              {{ episodeExpanded ? '收起' : '展开' }}
            </button>
          </div>
        </div>
        <div v-show="episodeExpanded" class="episode-list">
          <button
            v-for="(ep, ei) in sortedEpisodes"
            :key="ei"
            class="episode-btn"
            :class="{ active: currentEpisodeIndex === originalEpisodeIndex(ei) }"
            @click="switchEpisode(originalEpisodeIndex(ei))"
          >{{ ep.name }}</button>
        </div>
      </div>

      <div class="video-wrapper">
        <!-- 加载中 -->
        <div v-if="playerLoading" class="player-loading">
          <el-icon class="is-loading" :size="36"><Loading /></el-icon>
          <span>正在加载视频...</span>
        </div>

        <!-- 加载失败（非iframe模式） -->
        <div v-else-if="playerError && !showIframePlayer" class="player-error">
          <el-icon :size="28"><WarningFilled /></el-icon>
          <span>{{ playerError }}</span>
          <button class="retry-btn" @click="retryPlay">重试</button>
          <button class="external-btn" @click="openExternal">在外部打开</button>
        </div>

        <!-- iframe 兜底播放器 -->
        <div v-if="showIframePlayer && iframeBlobUrl" class="iframe-fallback">
          <div class="iframe-fallback-bar">
            <span class="iframe-fallback-tip">
              {{ isProxiedPage ? '正在通过代理加载页面...' : '内置播放器加载失败，已自动切换到 iframe 模式' }}
            </span>
            <button v-if="!isProxiedPage" class="retry-btn" @click="switchBackToHls">切回内置</button>
            <button class="external-btn" @click="openExternal">在外部打开</button>
          </div>
          <iframe
            :src="iframeBlobUrl"
            class="video-player-iframe"
            frameborder="0"
            allowfullscreen
            allow="autoplay; encrypted-media"
            sandbox="allow-same-origin allow-scripts"
          ></iframe>
        </div>

        <!-- 内置视频播放 -->
        <video
          v-show="!playerLoading && !playerError && !showIframePlayer"
          ref="videoPlayerRef"
          class="video-player-native"
          controls
          playsinline
          webkit-playsinline
          x5-playsinline
          x5-video-player-type="h5"
          x5-video-player-fullscreen="false"
          preload="auto"
        ></video>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searchLoading || searchError || searchResults.length > 0" class="results-section">
      <!-- 加载中 -->
      <div v-if="searchLoading" class="results-loading">
        <el-icon class="is-loading" :size="28"><Loading /></el-icon>
        <span>正在搜索「{{ lastKeyword }}」...</span>
      </div>

      <!-- 搜索错误 -->
      <div v-if="searchError" class="results-error">
        <el-icon :size="20"><WarningFilled /></el-icon>
        <span>{{ searchError }}</span>
      </div>

      <!-- 结果列表 -->
      <div v-if="!searchLoading && searchResults.length > 0" class="results-grid-wrap">
        <div class="results-info">
          搜索「{{ lastKeyword }}」找到 <strong>{{ searchResults.length }}</strong> 个结果（{{ currentLineName }}）
        </div>
        <div class="results-grid">
          <div v-for="(item, idx) in searchResults" :key="idx" class="result-card" @click="openResult(item)">
            <div class="result-poster">
              <img
                :src="item.pic || defaultPoster"
                :alt="item.title"
                referrerpolicy="no-referrer"
                loading="lazy"
                @error="onPosterError($event, idx)"
              />
              <span v-if="item.type" class="result-type-tag">{{ item.type }}</span>
            </div>
            <div class="result-body">
              <div class="result-title">{{ item.title }}</div>
              <div class="result-desc" v-if="item.desc">{{ item.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用指南（无搜索结果时展示） -->
    <div v-if="!searchLoading && !searchError && searchResults.length === 0" class="search-guide">
      <div class="guide-header">使用指南</div>
      <div class="guide-list">
        <div class="guide-item">
          <span class="guide-step">1、</span>
          <div class="guide-body">
            <span class="guide-title">输入片名搜索</span>
            <span class="guide-desc">输入电影/电视剧名称，回车或点击搜索按钮即可</span>
          </div>
        </div>
        <div class="guide-item">
          <span class="guide-step">2、</span>
          <div class="guide-body">
            <span class="guide-title">选择合适线路</span>
            <span class="guide-desc">六条线路覆盖不同片源库，某线路无结果时切换其他线路再试</span>
          </div>
        </div>
        <div class="guide-item">
          <span class="guide-step">3、</span>
          <div class="guide-body">
            <span class="guide-title">播放与操作</span>
            <span class="guide-desc">点击结果卡片即可播放，支持全屏及倍速播放</span>
          </div>
        </div>
        <div class="guide-item">
          <span class="guide-step">4、</span>
          <div class="guide-body">
            <span class="guide-title">备用方案</span>
            <span class="guide-desc">如遇所有线路无法播放，可点击下方友情链接跳转其他网站进行观看</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 友情链接 -->
    <div class="links-section">
      <div class="links-header">友情链接</div>
      <div class="link-cards">
        <a :href="link.url" target="_blank" rel="noopener" class="link-card" v-for="link in friendLinks" :key="link.name">
          {{ link.name }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Search, ArrowDown, ArrowUp, Loading, VideoPlay, WarningFilled, Close } from '@element-plus/icons-vue'
import Hls from 'hls.js'
import { computeNnppSign } from '@/utils/nnppSign'

// ==================== 搜索关键词 ====================
const keyword = ref('')
const showHistory = ref(false)
const history = ref(loadHistory())
const HISTORY_KEY = 'vip_video_name_search_history'
const MAX_HISTORY = 12

function loadHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY)
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value.slice(0, MAX_HISTORY)))
  } catch { /* ignore */ }
}

function addHistory(kw) {
  const k = kw.trim()
  if (!k) return
  history.value = [k, ...history.value.filter(h => h !== k)].slice(0, MAX_HISTORY)
  saveHistory()
}

function clearHistory() {
  history.value = []
  saveHistory()
  showHistory.value = false
}

function fillKeyword(item) {
  keyword.value = item
  showHistory.value = false
  search()
}

function onKeywordChange() {
  showHistory.value = keyword.value.trim() === ''
}

// ==================== 搜索线路 ====================
const lines = [
  {
    id: 1,
    name: '线路一',
    domain: 'cloud.nnpp.vip',
    desc: '高速线路，视频资源丰富',
    buildUrl: (kw) => {
      const { z, s1ig } = computeNnppSign()
      return `https://m1-a1.cloud.nnpp.vip:2223/api/v/?z=${z}&jx=${encodeURIComponent(kw)}&s1ig=${s1ig}&g=vv.jisu`
    }
  },
  {
    id: 5,
    name: '线路二',
    domain: 'tv.chen-dong.com',
    desc: '晨东影视，m3u8直链',
    buildUrl: (kw) => {
      // 线路二通过后端代理搜索 + 播放解析
      const ts = Date.now()
      return `https://tv.chen-dong.com/api.php?out=jsonp&wd=${encodeURIComponent(kw)}&cb=cd_${ts}&_=${ts}`
    }
  },
  {
    id: 2,
    name: '线路三',
    domain: 'ylu.cc',
    desc: '优质解析，覆盖全面',
    buildUrl: (kw) => {
      const ts = Date.now()
      return `https://ylu.cc/api.php?out=jsonp&wd=${encodeURIComponent(kw)}&cb=jQuery${Math.random().toString(36).slice(2, 10)}_${ts}&_=${ts}`
    }
  },
  {
    id: 3,
    name: '线路四',
    domain: 'iys.cc',
    desc: '智能搜索，精准匹配',
    buildUrl: (kw) => `https://iys.cc/#/searchresult?keyword=${encodeURIComponent(kw)}`
  },
  {
    id: 4,
    name: '线路五',
    domain: '59v.net',
    desc: '永乐视频，资源海量',
    buildUrl: (kw) => `https://www.59v.net/vodsearch/-------------/?wd=${encodeURIComponent(kw)}`
  },
  {
    id: 6,
    name: '线路六',
    domain: '4kcz.com',
    desc: '厂长资源，更新及时',
    buildUrl: (kw) => {
      return `/staticTool/api/video-parse/proxy-search/line6?keyword=${encodeURIComponent(kw)}`
    }
  }
];

// ==================== 当前选中线路 ====================
const selectedLine = ref(1)
const showLineDropdown = ref(false)
const searchSectionRef = ref(null)
const fusedLineRef = ref(null)

const selectedLineName = computed(() => {
  const line = lines.find(l => l.id === selectedLine.value)
  return line ? line.name : '线路一'
})

const currentLineName = computed(() => {
  const line = lines.find(l => l.id === selectedLine.value)
  return line ? line.name : ''
})

function toggleLineDropdown() {
  showLineDropdown.value = !showLineDropdown.value
}

function selectLine(line) {
  selectedLine.value = line.id
  showLineDropdown.value = false
}

function onInputFocus() {
  showLineDropdown.value = false
}

function handleClickOutside(e) {
  if (searchSectionRef.value && !searchSectionRef.value.contains(e.target)) {
    showLineDropdown.value = false
  }
}

// ==================== 友情链接 ====================
const friendLinks = [
  { name: '永乐视频', url: 'https://www.59v.net' },
  { name: '泥视频', url: 'https://www.nivod.vip' },
  { name: '厂长资源', url: 'https://www.4kcz.com/' },
  { name: '118885', url: 'https://118885.com' },
  { name: '影猫の仓库', url: 'https://www.ymck.pro' },
  { name: '布布追剧', url: 'https://bubuzhuiju.com' }
];

// ==================== 搜索状态 ====================
const searchLoading = ref(false)
const searchResults = ref([])
const searchError = ref('')
const lastKeyword = ref('')

// ==================== 操作 ====================
async function search() {
  const kw = keyword.value.trim()
  if (!kw) return
  closePlayer()
  addHistory(kw)
  showHistory.value = false

  const line = lines.find(l => l.id === selectedLine.value)
  if (!line) return

  // 线路 四、五：跳转外站
  if (line.id === 3 || line.id === 4) {
    window.open(line.buildUrl(kw), '_blank', 'noopener')
    return
  }

  // 线路 一、二、三：通过后端代理请求（防第三方溯源）
  searchLoading.value = true
  searchResults.value = []
  searchError.value = ''
  lastKeyword.value = kw

  try {
    const API_PREFIX = '/staticTool/api'
    const apiUrl = `${API_PREFIX}/video-parse/proxy-search/line${line.id}?keyword=${encodeURIComponent(kw)}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(apiUrl, { signal: controller.signal })
    clearTimeout(timeoutId)

    const json = await res.json()
    if (json.code !== 0) {
      throw new Error(json.message || '搜索失败')
    }
    searchResults.value = json.data || []
    if (searchResults.value.length === 0) {
      searchError.value = '未找到相关视频，请尝试其他关键词或线路'
    }
  } catch (err) {
    console.error('搜索失败:', err)
    if (err.name === 'AbortError') {
      searchError.value = '搜索超时，请重试'
    } else {
      searchError.value = err.message || '搜索请求失败，请检查网络或稍后重试'
    }
  } finally {
    searchLoading.value = false
  }
}

// ==================== 搜索结果图片 ====================
// 无封面或加载失败时的默认封面图（内联 SVG data URL，避免外部文件 404）
const defaultPoster = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f1f5f9"/><stop offset="100%" stop-color="#e2e8f0"/></linearGradient></defs><rect fill="url(#bg)" width="320" height="180" rx="4"/><circle cx="160" cy="78" r="24" fill="none" stroke="#cbd5e1" stroke-width="1.5"/><polygon points="153,68 153,88 172,78" fill="#cbd5e1"/><text fill="#94a3b8" x="160" y="130" text-anchor="middle" font-size="11" font-family="sans-serif">暂无封面</text></svg>`)

function onPosterError(e, idx) {
  // 图片加载失败，替换为默认封面图（避免死循环：已是默认图则不再替换）
  const el = e.target
  if (!el) return
  if (el.src?.endsWith(defaultPoster)) return
  el.onerror = null
  el.src = defaultPoster
}

// ==================== 视频播放器 ====================
const currentPlayItem = ref(null)
const currentEpisodes = ref([])
const currentEpisodeIndex = ref(0)
const episodeSortOrder = ref('desc') // 默认倒序（新→旧）
const episodeExpanded = ref(true) // 剧集列表展开/收起
const videoPlayerRef = ref(null)
const playerLoading = ref(false)
const playerError = ref('')
const showIframePlayer = ref(false)
const iframeBlobUrl = ref('')
const isProxiedPage = ref(false)  // 区分代理页面模式和 HLS 回退模式
let hlsInstance = null
let lastPlayedUrl = ''

// 按排序后的剧集列表
const sortedEpisodes = computed(() => {
  const eps = [...currentEpisodes.value]
  return episodeSortOrder.value === 'desc' ? eps.reverse() : eps
})

// 排序后的索引 → 原始索引
function originalEpisodeIndex(sortedIdx) {
  if (episodeSortOrder.value === 'asc' || currentEpisodes.value.length === 0) return sortedIdx
  return currentEpisodes.value.length - 1 - sortedIdx
}

function openResult(item) {
  // 优先使用剧集列表，默认播放最新一集
  if (item.episodes && item.episodes.length > 0) {
    currentPlayItem.value = item
    currentEpisodes.value = item.episodes
    const lastIdx = item.episodes.length - 1
    currentEpisodeIndex.value = lastIdx
    playUrl(item.episodes[lastIdx].url)
  } else if (item.url) {
    // ylu.cc 等外部详情页：直接 iframe 嵌入（源站无 X-Frame-Options 限制，直接嵌入即可避免 CORS）
    const isHtmlPage = item.url.includes('ylu.cc') || /\.html?/i.test(item.url)
    if (isHtmlPage) {
      currentPlayItem.value = item
      currentEpisodes.value = []
      currentEpisodeIndex.value = 0
      playDirectIframe(item.url)
      return
    }
    currentPlayItem.value = item
    currentEpisodes.value = []
    currentEpisodeIndex.value = 0
    playUrl(item.url)
  } else if (item._sourceId && item._sourceFlag !== undefined) {
    // 线路二 (chen-dong)：需通过后端解析播放地址后再播放
    resolveChenDongPlay(item)
  } else {
    // 没有播放地址，搜索外站
    window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(item.title + ' 在线观看')}`, '_blank', 'noopener')
  }
}

/** 线路二 (chen-dong)：通过后端解析播放地址后再播放 m3u8 */
async function resolveChenDongPlay(item) {
  closeHls()
  playerLoading.value = true
  playerError.value = ''

  try {
    const API_PREFIX = '/staticTool/api'
    const apiUrl = `${API_PREFIX}/video-parse/cd-play?id=${item._sourceId}&flag=${item._sourceFlag}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(apiUrl, { signal: controller.signal })
    clearTimeout(timeoutId)

    const json = await res.json()
    if (json.code !== 0) {
      throw new Error(json.message || '获取播放地址失败')
    }

    const { url, episodes } = json.data

    currentPlayItem.value = item
    if (episodes && episodes.length > 0) {
      currentEpisodes.value = episodes
      const lastIdx = episodes.length - 1
      currentEpisodeIndex.value = lastIdx
      playUrl(episodes[lastIdx].url)
    } else if (url) {
      currentEpisodes.value = []
      currentEpisodeIndex.value = 0
      playUrl(url)
    } else {
      throw new Error('未获取到可播放的链接')
    }
  } catch (err) {
    console.error('线路二播放失败:', err)
    playerLoading.value = false
    if (err.name === 'AbortError') {
      playerError.value = '线路二播放解析超时，请重试'
    } else {
      playerError.value = err.message || '获取播放地址失败'
    }
  }
}

/** 直接 iframe 嵌入外部页面（不走代理） */
function playDirectIframe(pageUrl) {
  closeHls()
  playerLoading.value = true
  playerError.value = ''
  isProxiedPage.value = false

  if (iframeBlobUrl.value) {
    URL.revokeObjectURL(iframeBlobUrl.value)
    iframeBlobUrl.value = ''
  }

  // 构造 iframe 页面，直接嵌入目标 URL
  const safeUrl = pageUrl.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;display:flex;align-items:center;justify-content:center;width:100vw;height:100vh;overflow:hidden}iframe{width:100%;height:100%;border:none}#err{display:none;color:#aaa;text-align:center;font-family:sans-serif;padding:20px;max-width:360px}#err p{margin:8px 0;line-height:1.6}#err button{display:inline-block;margin:8px 6px;padding:8px 20px;background:#6366f1;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px}#err button.ext{background:#475569}</style></head>
<body>
<iframe id="frame" src="${safeUrl}" allowfullscreen allow="autoplay; encrypted-media"></iframe>
<div id="err"><p>⚠️ 该页面可能不允许被内嵌播放</p><p>请尝试在外部窗口中打开：</p><button onclick="parent.openExternalPage()">在新窗口打开</button></div>
<script>
var frame=document.getElementById('frame');
frame.onerror=function(){ frame.style.display='none'; document.getElementById('err').style.display='block'; };
frame.onload=function(){
  setTimeout(function(){
    try {
      var d=frame.contentDocument||frame.contentWindow.document;
      if(!d||!d.body||(d.body&&d.body.innerHTML.trim()==='')){
        document.getElementById('frame').style.display='none';
        document.getElementById('err').style.display='block';
      }
    } catch(e) {
      // 跨域无法访问
    }
  }, 8000);
};
<\/script></body></html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  iframeBlobUrl.value = URL.createObjectURL(blob)
  showIframePlayer.value = true
  playerLoading.value = false
}

/** 在外部打开当前播放项（从 iframe 内部回调） */
function openExternalPage() {
  const item = currentPlayItem.value
  if (item?.url) {
    window.open(item.url, '_blank', 'noopener')
  }
}

// 挂载到 window 供 iframe 内部回调
if (typeof window !== 'undefined') {
  window.openExternalPage = openExternalPage
}

/**
 * 浏览器端直接获取 m3u8，将所有资源 URL（.ts 分片 / 子播放列表）重写为走后端代理。
 * 这样 m3u8 本身由浏览器请求（绕过源站反爬），.ts 分片和后端子列表走代理（解决 CORS/非标准端口问题）。
 * 成功返回 blob URL，失败抛错由调用方回退到后端代理。
 */
async function fetchAndRewriteM3u8(rawUrl) {
  const response = await fetch(rawUrl, {
    headers: {
      'Accept': '*/*',
      'Referer': new URL(rawUrl).origin + '/'
    }
  })

  if (!response.ok) {
    throw new Error(`源站返回 ${response.status}`)
  }

  const text = await response.text()
  const trimmedText = text.trim()

  // 检测 HTML 拦截页
  if (trimmedText.startsWith('<!') || trimmedText.startsWith('<html')) {
    throw new Error('源站返回HTML拦截页，非m3u8内容')
  }

  // 检测有效 m3u8
  if (!trimmedText.startsWith('#EXTM3U')) {
    console.warn('[m3u8重写] 内容可能非标准 m3u8，前100字符:', trimmedText.substring(0, 100))
  }

  const baseUrl = new URL(rawUrl)

  // 使用绝对路径：blob m3u8 中的相对路径会被 hls.js 错误解析（产生 blob:https:/xxx 畸形 URL）
  // 直接用页面 origin 构造绝对 URL，hls.js 无需再解析
  const origin = window.location.origin
  const segmentProxyBase = `${origin}/staticTool/api/video-parse/hls-segment?url=`
  const playlistProxyBase = `${origin}/staticTool/api/video-parse/hls-proxy?url=`

  /**
   * 使用标准 URL 构造函数将 uri 转为源站绝对地址
   */
  function resolveUrl(uri) {
    try {
      return new URL(uri, baseUrl).href
    } catch {
      return uri
    }
  }

  const lines = text.split('\n')
  const rewritten = lines.map(line => {
    const trimmed = line.trim()

    // 重写 EXT-X-KEY URI（支持 URI="..." 和 URI=... 两种格式）
    if (trimmed.startsWith('#EXT-X-KEY') && trimmed.includes('URI=')) {
      return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
        return `URI="${segmentProxyBase}${encodeURIComponent(resolveUrl(uri))}"`
      }).replace(/URI=(?!")/g, (match) => {
        const rest = trimmed.substring(trimmed.indexOf('URI=') + 4)
        const uri = rest.split(',')[0].trim()
        if (!uri || uri.startsWith('"')) return match
        return `URI="${segmentProxyBase}${encodeURIComponent(resolveUrl(uri))}"`
      })
    }

    // 重写 EXT-X-MAP URI（fmp4 初始化段）
    if (trimmed.startsWith('#EXT-X-MAP') && trimmed.includes('URI=')) {
      return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
        return `URI="${segmentProxyBase}${encodeURIComponent(resolveUrl(uri))}"`
      })
    }

    if (!trimmed || trimmed.startsWith('#')) return line

    const absoluteUrl = resolveUrl(trimmed)

    // 子播放列表 (.m3u8) → 走后端 hls-proxy；.ts 分片 → 走 hls-segment
    const isPlaylist = /\.m3u8(\?|$)/i.test(absoluteUrl)
    const proxyBase = isPlaylist ? playlistProxyBase : segmentProxyBase
    return `${proxyBase}${encodeURIComponent(absoluteUrl)}`
  })

  const blob = new Blob([rewritten.join('\n')], { type: 'application/vnd.apple.mpegurl' })
  return URL.createObjectURL(blob)
}

function playUrl(url) {
  closeHls()
  playerLoading.value = true
  playerError.value = ''

  const isM3u8 = url.includes('.m3u8') || /m3u8/i.test(url)

  if (isM3u8) {
    console.log('[播放器] HLS:', url.substring(0, 100))
  }

  nextTick(() => {
    const video = videoPlayerRef.value
    if (!video) {
      playerLoading.value = false
      playerError.value = '播放器初始化失败'
      return
    }

    if (isM3u8 && Hls.isSupported()) {
      initHlsPlayer(video, url)
    } else if (isM3u8 && video.canPlayType('application/vnd.apple.mpegurl')) {
      initNativeHls(video, url)
    } else if (!isM3u8) {
      // 直链 mp4 等
      video.src = url
      video.addEventListener('loadedmetadata', () => {
        playerLoading.value = false
        video.play().catch(() => {})
      }, { once: true })
      video.addEventListener('error', () => {
        playerLoading.value = false
        playerError.value = '视频加载失败，可能链接已失效'
      }, { once: true })
    } else {
      // 当前浏览器不支持 MSE/hls.js 且不支持原生 HLS（如部分安卓/微信浏览器）
      // 先尝试直接用原生 video 播放 m3u8（部分浏览器可播），失败则切到 iframe 兜底
      video.src = url
      video.addEventListener('loadedmetadata', () => {
        playerLoading.value = false
        video.play().catch(() => {})
      }, { once: true })
      video.addEventListener('error', () => {
        playerLoading.value = false
        console.log('[播放器] 原生播放失败，切换到 iframe 模式')
        switchToIframePlayer(url)
      }, { once: true })
    }
  })
}

async function initHlsPlayer(video, url) {
  // 统一走后端代理，避免浏览器端 CORS 跨域导致 m3u8 获取失败、
  // 以及 blob URL 重写后 hls.js 层级解析时相对路径歧义
  const finalUrl = `/staticTool/api/video-parse/hls-proxy?url=${encodeURIComponent(url)}`
  const sourceType = 'backend-proxy'

  console.log(`[播放器] 使用 ${sourceType} 模式`)

  hlsInstance = new Hls({
    // 分片经后端代理转发存在额外延迟，调大缓冲避免缓冲耗尽导致的规律性卡顿
    maxBufferLength: 60,
    maxMaxBufferLength: 120,
    maxBufferSize: 120 * 1024 * 1024,
    backBufferLength: 30,
    // 分片/播放列表加载超时与重试
    fragLoadingTimeOut: 30000,
    fragLoadingMaxRetry: 6,
    fragLoadingRetryDelay: 1000,
    levelLoadingTimeOut: 15000,
    levelLoadingMaxRetry: 6,
    levelLoadingRetryDelay: 1000,
    manifestLoadingTimeOut: 15000,
    manifestLoadingMaxRetry: 4,
    // 提高默认带宽估算并降低 ABR 灵敏度，避免开局选低码率后又频繁升降级（升降级切换会造成卡顿）
    abrEwmaDefaultEstimate: 5_000_000,
    abrBandWidthFactor: 0.85,
    abrBandWidthUpFactor: 0.9,
    abrEwmaFastLive: 4,
    abrEwmaSlowLive: 12
  })
  hlsInstance.loadSource(finalUrl)
  hlsInstance.attachMedia(video)
  hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
    playerLoading.value = false
    video.play().catch(() => { playerError.value = '自动播放被浏览器阻止，请手动点击播放' })
  })
  hlsInstance.on(Hls.Events.ERROR, (event, data) => {
    if (data.fatal) {
      console.error('[hls.js fatal]', data.type, data.details, data)
      playerLoading.value = false
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          if (data.details === 'manifestLoadError') {
            // 内置播放器加载 m3u8 失败，自动切换到 iframe 模式兜底
            console.log('[播放器] 内置 hls.js 失败，切换到 iframe 模式')
            switchToIframePlayer(url)
          } else {
            playerError.value = '网络错误，视频加载失败，请重试或切换外部播放'
          }
          break
        case Hls.ErrorTypes.MEDIA_ERROR:
          hlsInstance.recoverMediaError()
          playerError.value = '媒体解码错误，正在尝试恢复...'
          break
        default:
          closeHls()
          playerError.value = '视频加载失败，请重试或切换外部播放'
          break
      }
    }
  })
}

async function initNativeHls(video, url) {
  // 统一走后端代理，避免浏览器端 CORS 跨域及 blob URL 相对路径歧义
  video.src = `/staticTool/api/video-parse/hls-proxy?url=${encodeURIComponent(url)}`
  video.addEventListener('loadedmetadata', () => {
    playerLoading.value = false
    video.play().catch(() => {})
  }, { once: true })
  video.addEventListener('error', () => {
    playerLoading.value = false
    // 原生 HLS 加载失败（常见于安卓浏览器伪支持 HLS 或源站不可达），切到 iframe 兜底
    console.log('[播放器] 原生 HLS 加载失败，切换到 iframe 模式')
    switchToIframePlayer(url)
  }, { once: true })
}

// ==================== iframe 兜底播放器 ====================
function createIframePlayerHtml(proxyUrl, rawUrl, origin) {
  // proxyUrl: 后端 /hls-proxy 代理地址（有 CORS 头，推荐）
  // rawUrl: 原始 m3u8 地址（兜底，仅 Safari 原生或源站允许 CORS 时可用）
  // origin: 当前页面源，用于在 iframe 内构造绝对 URL
  const safeProxy = proxyUrl.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
  const safeRaw = rawUrl.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
  const safeOrigin = origin.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;display:flex;align-items:center;justify-content:center;width:100vw;height:100vh;overflow:hidden}video{width:100%;height:100%;max-height:100vh;outline:none}#err{display:none;color:#aaa;text-align:center;font-family:sans-serif;padding:20px;max-width:320px}#err p{margin:8px 0}#err button{display:inline-block;margin:8px 6px;padding:8px 20px;background:#409eff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px}#err button.alt{background:#475569}</style></head>
<body>
<video id="v" controls autoplay playsinline></video>
<div id="err"><p>⚠️ 视频加载失败</p><button onclick="tryProxy()">通过代理重试</button><button class="alt" onclick="tryDirect()">直接加载</button><button class="alt" onclick="location.reload()">刷新</button></div>
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"><\\/script>
<script>
var proxyUrl=\`${safeProxy}\`;
var rawUrl=\`${safeRaw}\`;
var origin=\`${safeOrigin}\`;
var h=null;

function e(msg){
  document.getElementById('v').style.display='none';
  var d=document.getElementById('err');
  d.style.display='block';
  if(msg)d.querySelector('p').textContent='⚠️ '+msg;
}

function tryLoad(url,onFail){
  cleanup();
  if(!window.Hls||!Hls.isSupported()){
    // 尝试原生 HLS (Safari)
    document.getElementById('v').src=url;
    document.getElementById('v').play().catch(function(){});
    document.getElementById('v').onerror=function(){cleanup();if(onFail)onFail()};
    return;
  }
  h=new Hls({debug:false,maxBufferLength:60,maxMaxBufferLength:120,maxBufferSize:125829120,backBufferLength:30,fragLoadingTimeOut:30000,fragLoadingMaxRetry:6,fragLoadingRetryDelay:1000,levelLoadingTimeOut:15000,levelLoadingMaxRetry:6,manifestLoadingTimeOut:15000,abrEwmaDefaultEstimate:5000000,abrBandWidthFactor:0.85,abrBandWidthUpFactor:0.9});
  h.loadSource(url);
  h.attachMedia(document.getElementById('v'));
  h.on(Hls.Events.MANIFEST_PARSED,function(){
    document.getElementById('v').play().catch(function(){});
    document.getElementById('v').style.display='';
    document.getElementById('err').style.display='none';
    // 加载成功后自动保存有效的 URL 策略
    window._okUrl=url;
  });
  h.on(Hls.Events.ERROR,function(ev,d){
    if(d.fatal){
      cleanup();
      if(onFail)onFail();
    }
  });
}

function cleanup(){
  if(h){try{h.destroy()}catch(ignore){}h=null}
  document.getElementById('v').onerror=null;
  document.getElementById('v').src='';
}

function tryProxy(){
  e('正在通过代理加载...');
  tryLoad(proxyUrl,function(){
    e('代理加载失败');
  });
}

function tryDirect(){
  e('正在直连加载...');
  tryLoad(rawUrl,function(){
    e('直连加载失败');
  });
}

// 优先走代理（解决 CORS），失败再尝试直连
tryLoad(proxyUrl,function(){
  tryLoad(rawUrl,function(){
    e('视频加载失败——源站可能开启了反爬保护或链接已失效');
  });
});
<\\/script></body></html>`
}

function switchToIframePlayer(url) {
  closeHls()
  playerLoading.value = false
  playerError.value = ''
  isProxiedPage.value = false
  showIframePlayer.value = true

  // 释放旧的 blob URL
  if (iframeBlobUrl.value) {
    URL.revokeObjectURL(iframeBlobUrl.value)
  }

  const origin = window.location.origin
  const proxyUrl = `${origin}/staticTool/api/video-parse/hls-proxy?url=${encodeURIComponent(url)}`
  lastPlayedUrl = url
  const html = createIframePlayerHtml(proxyUrl, url, origin)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  iframeBlobUrl.value = URL.createObjectURL(blob)
}

function switchBackToHls() {
  if (iframeBlobUrl.value) {
    URL.revokeObjectURL(iframeBlobUrl.value)
    iframeBlobUrl.value = ''
  }
  showIframePlayer.value = false
  retryPlay()
}

function switchEpisode(index) {
  if (!currentEpisodes.value[index]) return
  currentEpisodeIndex.value = index
  playUrl(currentEpisodes.value[index].url)
}

function retryPlay() {
  const item = currentPlayItem.value
  if (!item) return
  if (currentEpisodes.value.length > 0) {
    playUrl(currentEpisodes.value[currentEpisodeIndex.value].url)
  } else if (item.url) {
    playUrl(item.url)
  }
}

function openExternal() {
  const item = currentPlayItem.value
  if (!item) return
  let url = ''
  if (currentEpisodes.value.length > 0) {
    url = currentEpisodes.value[currentEpisodeIndex.value]?.url || ''
  }
  if (!url) url = item.url || ''
  if (url) {
    window.open(url, '_blank', 'noopener')
  } else {
    window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(item.title + ' 在线观看')}`, '_blank', 'noopener')
  }
}

function closePlayer() {
  closeHls()
  if (iframeBlobUrl.value) {
    URL.revokeObjectURL(iframeBlobUrl.value)
    iframeBlobUrl.value = ''
  }
  showIframePlayer.value = false
  isProxiedPage.value = false
  lastPlayedUrl = ''
  currentPlayItem.value = null
  currentEpisodes.value = []
  currentEpisodeIndex.value = 0
  playerLoading.value = false
  playerError.value = ''
}

function closeHls() {
  if (hlsInstance) {
    hlsInstance.destroy()
    hlsInstance = null
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  showHistory.value = true
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  closeHls()
  if (iframeBlobUrl.value) {
    URL.revokeObjectURL(iframeBlobUrl.value)
    iframeBlobUrl.value = ''
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped src="./VideoName.scss"></style>

<style lang="scss">
// ==================== 深色模式 ====================
html.dark-mode .video-name-panel {
  .search-fused {
    background: #1a1a2e;
    border-color: #2d2d4a;
  }

  .fused-input {
    color: #e2dee9;
  }

  .fused-divider { background: #2d2d4a; }

  .fused-line {
    &:hover { background: #252540; }
  }
  .fused-line-text { color: #94a3b8; }
  .fused-line-arrow { color: #6b7280; }

  .fused-btn {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    &:hover:not(:disabled) { background: linear-gradient(135deg, #6d28d9, #8b5cf6); }
  }

  .line-dropdown {
    background: #1a1a2e;
    border-color: #2d2d4a;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  }
  .line-dropdown-item {
    color: #94a3b8;
    &:hover { background: #2d2d50; color: #a78bfa; }
    &.active { background: #2d2d50; color: #a78bfa; }
  }

  .history-line { color: #94a3b8; }
  .history-label { color: #64748b; }
  .history-item {
    &:hover { color: #a78bfa; }
  }
  .history-line-clear {
    color: #64748b;
    &:hover { color: #f87171; }
  }

  .section-title { color: #94a3b8; }

  .links-section {
    background: #1a1a2e;
    border-color: #2d2d4a;
  }

  .search-guide {
    background: #1a1a2e;
    border-color: #2d2d4a;
  }
  .guide-header { color: #e2dee9; }
  .guide-item { background: transparent; }
  .guide-step { color: #94a3b8; }
  .guide-title { color: #e2dee9; }
  .guide-desc { color: #6b7280; }
  .links-header { color: #e2dee9; }
  .link-card {
    color: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    &:nth-child(1) {
      background: linear-gradient(135deg, #7c3aed, #a78bfa);
      &:hover { box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4); }
    }
    &:nth-child(2) {
      background: linear-gradient(135deg, #f97316, #ef4444);
      &:hover { box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4); }
    }
  }

  .results-loading { background: #1a1a2e; color: #a78bfa; }
  .results-error { background: #2d1a1a; border-color: #4a2d2d; color: #f87171; }
  .results-info { color: #6b7280; strong { color: #a78bfa; } }
  .result-card { background: #1a1a2e; border-color: #2d2d4a;
    &:hover { border-color: #7c3aed; box-shadow: 0 6px 20px rgba(124, 58, 237, 0.2); }
  }
  .result-poster { background: #252540; }
  .result-type-tag { background: rgba(124, 58, 237, 0.85); }
  .result-title { color: #e2dee9; }
  .result-desc { color: #6b7280; }

  // 播放器深色模式
  .player-section { background: #1a1a2e; border-color: #2d2d4a; }
  .player-header { background: linear-gradient(135deg, #1e1e3a, #2d2d50); border-bottom-color: #2d2d4a; color: #a78bfa; }
  .player-title { color: #e2dee9; }
  .player-type-tag { background: rgba(167, 139, 250, 0.15); color: #a78bfa; }
  .player-close:hover { background: #3d1a1a; color: #f87171; }
  .episode-bar { border-bottom-color: #2d2d4a; }
  .episode-label { color: #6b7280; }
  .toggle-btn { background: #252540; border-color: #2d2d4a; color: #6b7280;
    &:hover { border-color: #7c3aed; color: #a78bfa; background: #2d2d50; }
  }
  .episode-btn { background: #252540; border-color: #2d2d4a; color: #94a3b8;
    &:hover { border-color: #7c3aed; color: #a78bfa; background: #2d2d50; }
    &.active { border-color: #7c3aed; background: linear-gradient(135deg, #7c3aed, #a78bfa); color: #fff; }
  }
  .video-wrapper { background: #000; }
  .player-loading {
    background: rgba(15, 15, 26, 0.95); color: #94a3b8;
    .is-loading { color: #a78bfa; }
  }
  .player-error {
    background: rgba(30, 18, 18, 0.95); color: #f87171;
    .retry-btn { border-color: #7c3aed; color: #a78bfa;
      &:hover { background: #7c3aed; color: #fff; }
    }
    .external-btn { border-color: #6b7280; color: #94a3b8;
      &:hover { background: #475569; border-color: #475569; color: #fff; }
    }
  }
  .iframe-fallback-bar { background: #12121f; border-bottom-color: #2d2d4a; }
  .iframe-fallback-tip { color: #6b7280; }
}
</style>

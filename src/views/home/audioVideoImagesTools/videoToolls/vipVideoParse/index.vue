<template>
  <div class="vip-video-parse-page">
    <!-- 顶部返回栏 -->
    <div class="top-bar">
      <el-button :icon="ArrowLeft" text class="back-btn" @click="$router.back()">返回</el-button>
    </div>
    <div class="page-header">
      <div class="header-center">
        <h1 class="page-title">追剧观影</h1>
        <p class="page-desc">多线路搜索，输入片名或粘贴链接即可免费在线观看</p>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="input-section">
      <!-- Tab 切换 + B站登录 -->
      <div class="input-toolbar">
        <div class="input-mode-switch">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="input-mode-btn"
            :class="{ active: activeTab === tab.key }"
            :disabled="searching"
            @click="switchTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>
        <button
          v-show="activeTab === 'search'"
          class="bili-login-btn"
          :class="{ 'bili-expired': biliLogged && biliCookieValid === false }"
          @click="openBiliLogin"
          :title="biliButtonTitle"
        >
          <el-icon :size="14"><component :is="biliButtonIcon" /></el-icon>
          <span>{{ biliButtonText }}</span>
        </button>
      </div>

      <!-- 视频名称 Tab -->
      <VideoName v-show="activeTab === 'name'" />

      <!-- 链接解析 Tab -->
      <UrlParse
        v-show="activeTab === 'url'"
        ref="urlParseRef"
        :user-lines="userLines"
        :api-health-map="apiHealthMap"
        :health-checking="healthChecking"
        :parsing="parsing"
        :selected-line-index="selectedLineIndex"
        @update:selected-line-index="selectedLineIndex = $event"
        @parse="onUrlParse"
        @check-api-health="checkApiHealth"
        @show-line-manage="showLineManage = true"
      />

      <!-- 短视频搜索 Tab -->
      <SearchVideo
        v-show="activeTab === 'search'"
        ref="searchVideoRef"
        @switch-mode="switchTab"
        @play-episode="onSearchPlayEpisode"
      />

      <!-- 视频播放区（独立于 tab，短视频/链接解析均可播放） -->
      <div v-if="showPlayer" class="player-section">
        <div class="player-container">
          <div class="player-header">
            <div class="player-header-top">
              <div class="player-title-wrap">
                <el-icon :size="18"><VideoPlay /></el-icon>
                <span class="player-title">{{ parsedTitle || '正在播放' }}</span>
              </div>
              <button class="player-close" @click="closePlayer" title="关闭播放器">
                <el-icon :size="18"><Close /></el-icon>
              </button>
            </div>
            <div class="player-header-bottom">
              <!-- 自动线路尝试状态 -->
              <span v-if="parsingStatusText" class="parsing-status" :class="{ 'parsing-error': !parsing && parsingStatusText.includes('无法') }">
                <span v-if="parsing" class="parsing-spinner"></span>
                {{ parsingStatusText }}
                <button v-if="parsing && autoTryingLine >= 0" class="stop-auto-btn" @click="stopAutoTry()">停止</button>
              </span>
              <!-- yt-dlp 提取信息 -->
              <span v-if="ytDlpVideoInfo" class="ytdlp-info">
                <span class="ytdlp-badge">yt-dlp</span>
                <span v-if="ytDlpVideoInfo.durationString" class="ytdlp-duration">{{ ytDlpVideoInfo.durationString }}</span>
              </span>
              <!-- 下载 / 转MP3 -->
              <span v-if="useYtDlp && videoUrl && ytDlpStreamUrl" class="download-actions">
                <button class="dl-btn" @click="downloadVideo(false)" :disabled="downloading">下载视频</button>
                <button class="dl-btn dl-btn-nw" v-if="needNoWatermark" @click="downloadNoWatermark()" :disabled="downloadingNoWM">{{ downloadingNoWM ? '处理中...' : '无水印下载' }}</button>
                <button class="dl-btn" @click="downloadVideo(true)" :disabled="downloading">转MP3</button>
              </span>
              <!-- 第三方解析线路切换 -->
              <div class="line-switcher" v-if="!useYtDlp && userLines.length > 1">
                <span class="line-label">播放线路：</span>
                <button
                  v-for="(line, idx) in userLines"
                  :key="idx"
                  class="line-btn"
                  :class="{ active: currentLine === idx }"
                  @click="currentLine = idx"
                >{{ line.name }}</button>
              </div>
            </div>
          </div>

          <!-- yt-dlp 直链播放器 -->
          <div v-if="useYtDlp && ytDlpStreamUrl" class="video-wrapper">
            <video
              ref="videoPlayer"
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

          <!-- yt-dlp 提取中 -->
          <div v-else-if="useYtDlp && ytDlpExtracting" class="video-wrapper">
            <div class="video-placeholder extracting">
              <el-icon class="is-loading" :size="48"><Loading /></el-icon>
              <p>yt-dlp 正在提取视频流...</p>
              <span class="extract-hint">{{ ytDlpExtractHint }}</span>
            </div>
          </div>

          <!-- yt-dlp 提取失败 -->
          <div v-else-if="useYtDlp && ytDlpError" class="video-wrapper">
            <div class="video-placeholder error">
              <el-icon :size="48"><WarningFilled /></el-icon>
              <p>提取失败</p>
              <span class="error-detail">{{ ytDlpError }}</span>
              <button class="fallback-btn" @click="switchToThirdParty">切换到第三方解析</button>
            </div>
          </div>

          <!-- 第三方解析 iframe 播放 -->
          <div v-else-if="!useYtDlp" class="video-wrapper">
            <iframe
              v-if="currentPlayUrl"
              :key="parseSessionId"
              :src="currentPlayUrl"
              class="video-iframe"
              frameborder="0"
              allowfullscreen
              allow="autoplay; encrypted-media"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              @load="onIframeLoad"
            ></iframe>
            <div v-else class="video-placeholder">
              <el-icon :size="64"><VideoCamera /></el-icon>
              <p>输入视频链接开始播放</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用指南 -->
    <div v-show="activeTab === 'search'" class="search-guide">
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
            <span class="guide-desc">B站支持名称搜索；抖音、快手、好看视频、微视可粘贴链接直接播放</span>
          </div>
        </div>
        <div class="guide-item">
          <span class="guide-step">3、</span>
          <div class="guide-body">
            <span class="guide-title">粘贴链接播放</span>
            <span class="guide-desc">直接粘贴抖音、快手、B站、好看视频、微视等视频链接即可播放</span>
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

    <!-- 快捷跳转 -->
    <div v-show="activeTab === 'search'" class="quick-jump-section">
      <div class="quick-jump-header">快捷跳转</div>
      <div class="quick-jump-grid">
        <a
          v-for="site in quickJumpSites"
          :key="site.name"
          :href="site.url"
          target="_blank"
          rel="noopener"
          class="quick-jump-card"
        >
          <span class="quick-jump-icon">{{ site.icon }}</span>
          <span class="quick-jump-name">{{ site.name }}</span>
        </a>
      </div>
    </div>

    <!-- B站扫码登录弹窗 -->
    <el-dialog
      v-model="showBiliLogin"
      title="B站扫码登录"
      width="360px"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      destroy-on-close
      class="bili-login-dialog"
    >
      <div class="bili-login-body">
        <!-- 登录成功 -->
        <div v-if="biliLoginStatus === 'success'" class="bili-login-success">
          <el-icon :size="56" :color="biliCookieValid ? '#22c55e' : '#f59e0b'"><SuccessFilled /></el-icon>
          <p>{{ biliLoginMessage }}</p>
          <p class="bili-login-sub">{{ biliCookieValid ? '现在可以观看需要登录的 B站视频了' : '部分视频可能仍需登录才能观看' }}</p>
        </div>
        <!-- 加载二维码 -->
        <div v-else-if="biliQrLoading" class="bili-login-loading">
          <el-icon class="is-loading" :size="40"><Loading /></el-icon>
          <p>正在获取二维码...</p>
        </div>
        <!-- 二维码展示 -->
        <div v-else-if="biliQrUrl" class="bili-login-qr">
          <img :src="biliQrImg" class="bili-qr-img" alt="B站登录二维码" />
          <p class="bili-qr-status">
            <el-icon class="is-loading" :size="16"><Loading /></el-icon>
            {{ biliQrStatusText }}
          </p>
          <p class="bili-login-tip">使用 B站 手机客户端或手机浏览器扫码登录</p>
          <button class="bili-refresh-btn" @click="refreshBiliQr">刷新二维码</button>
        </div>
        <!-- 二维码过期/失败 -->
        <div v-else class="bili-login-error">
          <el-icon :size="48" color="#ef4444"><WarningFilled /></el-icon>
          <p>二维码加载失败</p>
          <button class="bili-refresh-btn" @click="refreshBiliQr">重新获取</button>
        </div>
      </div>
    </el-dialog>

    <!-- 解析路径管理弹窗 -->
    <el-dialog
      v-model="showLineManage"
      title="管理解析路径"
      width="580px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="line-manage-panel">
        <div class="line-manage-add">
          <div class="add-inputs">
            <input
              v-model="newLineName"
              class="add-input"
              placeholder="线路名称（如：线路四）"
              @keydown.enter="addNewLine"
            />
            <input
              v-model="newLineApi"
              class="add-input add-input-api"
              placeholder="解析接口地址（如：https://jx.xxx.com/?url=）"
              @keydown.enter="addNewLine"
            />
          </div>
          <button class="add-btn" :disabled="!newLineName.trim() || !newLineApi.trim()" @click="addNewLine">添加</button>
        </div>
        <div class="line-manage-list" v-if="userLines.length > 0">
          <div class="line-manage-header">
            <span class="lmh-name">线路名称</span>
            <span class="lmh-api">解析接口地址</span>
            <span class="lmh-actions">操作</span>
          </div>
          <div v-for="(line, idx) in userLines" :key="idx" class="line-manage-item">
            <template v-if="editingLineIndex === idx">
              <input v-model="editLineName" class="edit-input" placeholder="线路名称" />
              <input v-model="editLineApi" class="edit-input edit-input-api" placeholder="解析接口地址" />
              <div class="edit-actions">
                <el-button size="small" type="success" @click="saveEditLine">保存</el-button>
                <el-button size="small" @click="cancelEditLine">取消</el-button>
              </div>
            </template>
            <template v-else>
              <div class="lm-item-main">
                <div class="lm-item-name">
                  <span class="status-dot" :class="getLineHealthStatus(line.name)"></span>
                  <span class="lm-item-name-text">{{ line.name }}</span>
                  <span class="lm-item-api">{{ line.api }}</span>
                </div>
                <div class="lm-item-actions">
                  <el-button text size="small" type="primary" @click="startEditLine(idx)">编辑</el-button>
                  <el-button text size="small" type="danger" @click="deleteLine(idx)" :disabled="userLines.length <= 1">删除</el-button>
                </div>
              </div>
            </template>
          </div>
        </div>
        <div v-else class="line-manage-empty"><p>暂无自定义解析路径，请添加</p></div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="checkApiHealth" :disabled="healthChecking">
            {{ healthChecking ? '检测中...' : '健康检测' }}
          </el-button>
          <div>
            <el-button @click="showLineManage = false">关闭</el-button>
            <el-button type="warning" @click="resetLines" v-if="hasCustomLines">恢复默认</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  ArrowLeft, VideoPlay, Loading, VideoCamera, WarningFilled, Search, Link, Plus, Edit, Close, SuccessFilled, Connection
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Hls from 'hls.js'
import QRCode from 'qrcode'
import SearchVideo from './components/SearchVideo.vue'
import UrlParse from './components/UrlParse.vue'
import VideoName from './components/VideoName.vue'

// ==================== Tab 切换 ====================
const tabs = [
  { key: 'name', label: 'VIP视频', icon: Edit },
  { key: 'url', label: '链接解析', icon: Link },
  { key: 'search', label: '短视频', icon: Search }
]
const activeTab = ref('name')
const searchVideoRef = ref(null)

function switchTab(key) {
  activeTab.value = key
  // 切换时清理搜索组件的旧结果
  if (searchVideoRef.value) {
    searchVideoRef.value.clearResults()
  }
  // 切到短视频 tab 时检查 B站登录状态
  if (key === 'search') {
    checkBiliLoginStatus()
  }
}

// ==================== 公共播放状态 ====================
const showPlayer = ref(false)
const parsedTitle = ref('')
const currentLine = ref(0)
const videoUrl = ref('')
const downloading = ref(false)
const downloadingNoWM = ref(false)

// 是否需要无水印下载（抖音/快手等短视频平台）
const needNoWatermark = computed(() => {
  const url = videoUrl.value || ''
  return url.includes('douyin.com') || url.includes('iesdouyin.com')
    || url.includes('kuaishou.com') || url.includes('gifshow.com')
})

// ==================== B站扫码登录 ====================
const showBiliLogin = ref(false)
const biliLogged = ref(false)
const biliCookieValid = ref(null)  // true=有效 false=失效 null=未知/检查中
const biliNickname = ref('')

const biliButtonText = computed(() => {
  if (!biliLogged.value) return 'B站登录'
  if (biliCookieValid.value === null) return '检查中...'
  if (biliCookieValid.value === false) return 'B站登录失效'
  if (biliCookieValid.value === true && biliNickname.value) return biliNickname.value
  return 'B站已登录'
})
const biliButtonIcon = computed(() => {
  if (biliCookieValid.value === null) return Loading
  if (biliCookieValid.value === false) return WarningFilled
  if (biliLogged.value) return SuccessFilled
  return Connection
})
const biliButtonIconName = computed(() => {
  if (biliCookieValid.value === null) return 'Loading'
  if (biliCookieValid.value === false) return 'WarningFilled'
  if (biliLogged.value) return 'SuccessFilled'
  return 'Connection'
})
const biliButtonTitle = computed(() => {
  if (biliCookieValid.value === null) return 'B站登录状态检查中...'
  if (biliCookieValid.value === false) return 'B站登录已失效，点击重新扫码'
  if (biliLogged.value) return 'B站已登录，点击重新扫码'
  return 'B站扫码登录，解锁更多视频'
})
const biliQrLoading = ref(false)
const biliQrUrl = ref('')
const biliQrImg = ref('')
const biliQrStatusText = ref('')
const biliLoginStatus = ref('') // '' | 'pending' | 'scanned' | 'success' | 'expired'
const biliLoginMessage = ref('')
const biliQrTimer = ref(null)
const biliQrKey = ref('')

// 自动线路尝试
const autoTryingLine = ref(-1)
const autoTryTimer = ref(null)
const parsingStatusText = ref('')
// 解析会话ID：每次新解析 +1，强制销毁重建 iframe，确保旧视频停止播放
const parseSessionId = ref(0)

// ==================== 解析路径 ====================
const defaultLines = [
  { name: '线路一', api: 'https://jx.m3u8.tv/jiexi/?url=' },
  { name: '线路二', api: 'https://jx.xmflv.com/?url=' },
  { name: '线路三', api: 'https://www.8090g.cn/?url=' }
]

const userLines = ref(loadUserLines())
const selectedLineIndex = ref(0)

// ==================== 后端健康检测 ====================
const apiHealthMap = ref({})
const healthChecking = ref(false)

async function checkApiHealth() {
  healthChecking.value = true
  let timeoutId = null
  try {
    const controller = new AbortController()
    timeoutId = setTimeout(() => controller.abort(), 20000)
    const res = await fetch('/staticTool/api/video-parse/check-apis', {
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    const data = await res.json()
    if (data?.code === 0 && data.data) {
      const map = {}
      data.data.results.forEach(r => {
        map[r.name] = { online: r.online, responseTime: r.responseTime }
      })
      apiHealthMap.value = map
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.debug('健康检测超时，已取消')
    } else {
      console.warn('健康检测失败（后端未启动）:', err.message)
    }
    const map = {}
    userLines.value.forEach(l => { map[l.name] = { online: null, responseTime: null } })
    apiHealthMap.value = map
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    healthChecking.value = false
  }
}

function getLineHealthStatus(lineName) {
  const h = apiHealthMap.value[lineName]
  if (!h || h.online === null) return 'unknown'
  return h.online ? 'online' : 'offline'
}

function lineHealthText(lineName) {
  const status = getLineHealthStatus(lineName)
  return status === 'online' ? '可用' : status === 'offline' ? '不可用' : '待检测'
}

// ==================== yt-dlp 模式 ====================
const ytDlpAvailable = ref(false)
const ytDlpVersion = ref('')
const useYtDlp = ref(false)
const ytDlpExtracting = ref(false)
const ytDlpStreamUrl = ref('')
const ytDlpStreamType = ref('')
const ytDlpVideoInfo = ref(null)
const ytDlpError = ref('')
const ytDlpExtractHint = ref('')
const videoPlayer = ref(null)
const parsing = ref(false)

// 快捷跳转
const quickJumpSites = [
  { name: '哔哩哔哩', url: 'https://www.bilibili.com', icon: '📺' },
  { name: '抖音', url: 'https://www.douyin.com', icon: '🎵' },
  { name: '快手', url: 'https://www.kuaishou.com', icon: '🎬' },
  { name: '好看视频', url: 'https://haokan.baidu.com', icon: '🎞️' },
  { name: '微视', url: 'https://weishi.qq.com', icon: '📱' }
]

async function checkYtDlpStatus() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const res = await fetch('/staticTool/api/video-parse/ytdlp/status', {
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    if (!res.ok) {
      // 线上可能未部署 yt-dlp 路由，静默降级
      console.log('[yt-dlp] 状态检测返回', res.status, '— 将禁用 yt-dlp 模式')
      ytDlpAvailable.value = false
      useYtDlp.value = false
      return
    }
    const data = await res.json()
    if (data?.code === 0 && data.data?.available) {
      ytDlpAvailable.value = true
      ytDlpVersion.value = data.data.version || ''
      useYtDlp.value = true
    }
  } catch {
    ytDlpAvailable.value = false
    useYtDlp.value = false
  }
}

async function handleYtDlpExtract(url) {
  ytDlpExtracting.value = true
  ytDlpError.value = ''
  ytDlpStreamUrl.value = ''
  ytDlpStreamType.value = ''
  ytDlpVideoInfo.value = null

  ytDlpExtractHint.value = '正在获取视频信息...'
  try {
    const infoRes = await fetch('/staticTool/api/video-parse/ytdlp/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    const infoData = await infoRes.json()
    if (infoData?.code !== 0) {
      ytDlpError.value = infoData?.message || '提取失败'
      ytDlpExtracting.value = false
      return
    }
    ytDlpVideoInfo.value = infoData.data
    parsedTitle.value = infoData.data.title || '视频'
  } catch (err) {
    ytDlpError.value = '服务器连接失败，请检查后端是否启动'
    ytDlpExtracting.value = false
    return
  }

  ytDlpExtractHint.value = '正在提取视频流地址...'
  try {
    const streamRes = await fetch('/staticTool/api/video-parse/ytdlp/stream-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    const streamData = await streamRes.json()
    if (streamData?.code !== 0) {
      ytDlpError.value = streamData?.message || '获取流地址失败'
      ytDlpExtracting.value = false
      return
    }
    ytDlpStreamUrl.value = streamData.data.url
    ytDlpStreamType.value = streamData.data.type || ''
    ytDlpExtracting.value = false
    ElMessage.success('提取成功！开始播放')
  } catch (err) {
    ytDlpError.value = '获取流地址失败'
    ytDlpExtracting.value = false
  }
}

function switchToThirdParty() {
  useYtDlp.value = false
  ytDlpError.value = ''
  ytDlpStreamUrl.value = ''
  ytDlpVideoInfo.value = null
  ytDlpExtracting.value = false
  handleThirdPartyParse(videoUrl.value.trim())
}

// 自动逐线路尝试，单线路超时 6 秒
const LINE_FALLBACK_TIMEOUT = 15000

function stopAutoTry() {
  if (autoTryTimer.value) {
    clearTimeout(autoTryTimer.value)
    autoTryTimer.value = null
  }
  const wasTrying = autoTryingLine.value >= 0
  autoTryingLine.value = -1
  parsingStatusText.value = ''
  if (wasTrying) {
    parsing.value = false
    ElMessage.success(`已停止自动切换，保持在 ${userLines.value[currentLine.value]?.name || '当前线路'}`)
  }
}

// iframe 加载完成，当前线路解析成功，停止自动尝试
function onIframeLoad() {
  if (autoTryingLine.value >= 0) {
    clearTimeout(autoTryTimer.value)
    autoTryTimer.value = null
    autoTryingLine.value = -1
    parsingStatusText.value = ''
    parsing.value = false
    ElMessage.success(`解析成功！当前线路：${userLines.value[currentLine.value]?.name || '线路'}`)
  }
}

// 关闭播放器
function closePlayer() {
  stopAutoTry()
  showPlayer.value = false
  parsedTitle.value = ''
  videoUrl.value = ''
}

function tryLine(url, index) {
  const lines = userLines.value
  if (index >= lines.length) {
    // 所有线路均失败
    stopAutoTry()
    parsing.value = false
    parsingStatusText.value = '所有线路均无法解析，请尝试切换线路后手动重试，或点击下方友情链接'
    ElMessage.error('所有线路均无法解析，请尝试切换线路或使用友情链接')
    return
  }

  autoTryingLine.value = index
  currentLine.value = index
  parsingStatusText.value = `正在尝试 ${lines[index].name}（${index + 1}/${lines.length}）...`

  autoTryTimer.value = setTimeout(() => {
    // 本线路超时，尝试下一条
    tryLine(url, index + 1)
  }, LINE_FALLBACK_TIMEOUT)
}

function handleThirdPartyParse(url, title) {
  stopAutoTry()
  // 递增会话ID，强制 Vue 销毁旧 iframe 并重建，确保旧视频立即停止
  parseSessionId.value++
  parsing.value = true
  showPlayer.value = true
  parsedTitle.value = title || '视频'

  const lines = userLines.value
  if (lines.length === 0) {
    parsing.value = false
    ElMessage.warning('请先添加解析线路')
    return
  }

  // 从用户选中的线路开始尝试
  tryLine(url, selectedLineIndex.value)
}

// 用户手动切换线路时停止自动尝试
watch(currentLine, (newVal) => {
  if (autoTryingLine.value >= 0 && newVal !== autoTryingLine.value) {
    // 用户手动切换了线路，停止自动尝试
    stopAutoTry()
    parsing.value = false
    ElMessage.info('已切换到 ' + userLines.value[newVal]?.name)
  }
})

// ==================== 搜索视频回调 ====================
function onSearchPlayEpisode(ep) {
  videoUrl.value = ep.webpageUrl || `https://www.bilibili.com/video/${ep.id}`
  showPlayer.value = true
  parsedTitle.value = ep.title || '视频'
  useYtDlp.value = true
  handleYtDlpExtract(videoUrl.value.trim())
}

// ==================== 下载 / 转MP3 ====================
// 通过后端 yt-dlp 下载视频（或转音频 MP3）
async function downloadVideo(audioOnly = false) {
  const url = videoUrl.value?.trim()
  if (!url) {
    ElMessage.warning('请先加载视频')
    return
  }
  if (downloading.value) return
  downloading.value = true
  try {
    const res = await fetch('/staticTool/api/video-parse/ytdlp/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        audioOnly,
        title: parsedTitle.value || 'video'
      })
    })

    if (!res.ok) {
      let msg = '下载失败'
      try {
        const data = await res.json()
        msg = data.message || data.detail || msg
      } catch { /* ignore */ }
      ElMessage.error(msg)
      return
    }

    // 触发浏览器下载
    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') || ''
    const fileName = decodeURIComponent((disposition.match(/filename\*=UTF-8''(.+)/) || [])[1] || (audioOnly ? 'audio.mp3' : 'video.mp4'))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
    ElMessage.success(audioOnly ? 'MP3 转换完成，已开始下载' : '视频下载完成')
  } catch (err) {
    console.error('[download]', err)
    ElMessage.error('下载失败，请检查后端连接')
  } finally {
    downloading.value = false
  }
}

// 无水印下载（抖音/快手等短视频平台）
async function downloadNoWatermark() {
  const url = videoUrl.value?.trim()
  if (!url) {
    ElMessage.warning('请先加载视频')
    return
  }
  if (downloadingNoWM.value) return
  downloadingNoWM.value = true
  try {
    const res = await fetch('/staticTool/api/video-parse/ytdlp/no-watermark-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        title: parsedTitle.value || 'video'
      })
    })

    if (!res.ok) {
      let msg = '无水印下载失败'
      try {
        const data = await res.json()
        msg = data.message || data.detail || msg
      } catch { /* ignore */ }
      ElMessage.error(msg)
      return
    }

    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') || ''
    const fileName = decodeURIComponent((disposition.match(/filename\*=UTF-8''(.+)/) || [])[1] || 'video_无水印.mp4')

    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
    ElMessage.success('无水印视频下载完成')
  } catch (err) {
    console.error('[no-watermark download]', err)
    ElMessage.error('无水印下载失败，请检查后端连接')
  } finally {
    downloadingNoWM.value = false
  }
}

// ==================== B站扫码登录 ====================
function openBiliLogin() {
  showBiliLogin.value = true
  biliLoginStatus.value = ''
  refreshBiliQr()
}

function closeBiliLogin() {
  showBiliLogin.value = false
  if (biliQrTimer.value) {
    clearInterval(biliQrTimer.value)
    biliQrTimer.value = null
  }
}

async function refreshBiliQr() {
  biliQrLoading.value = true
  biliLoginStatus.value = ''
  biliQrUrl.value = ''
  biliQrImg.value = ''
  try {
    const res = await fetch('/staticTool/api/video-parse/ytdlp/bili-qrcode', { method: 'POST' })
    const data = await res.json()
    if (data.code !== 0 || !data.data?.url) {
      ElMessage.error(data.message || '获取二维码失败')
      return
    }
    biliQrUrl.value = data.data.url
    biliQrKey.value = data.data.qrcodeKey
    // 本地生成二维码图片（Canvas → DataURL）
    biliQrImg.value = await QRCode.toDataURL(data.data.url, { width: 240, margin: 1, color: { dark: '#000', light: '#fff' } })
    biliQrStatusText.value = '等待扫码'
    startBiliPolling()
  } catch (err) {
    console.error('[bili-login]', err)
    ElMessage.error('获取二维码失败，请检查后端连接')
  } finally {
    biliQrLoading.value = false
  }
}

function startBiliPolling() {
  if (biliQrTimer.value) clearInterval(biliQrTimer.value)
  // 每 3 秒轮询一次
  biliQrTimer.value = setInterval(async () => {
    if (!biliQrKey.value || !showBiliLogin.value) return
    try {
      const res = await fetch(`/staticTool/api/video-parse/ytdlp/bili-qrcode/status?qrcodeKey=${biliQrKey.value}`)
      const data = await res.json()
      const status = data.data?.status
      if (status === 'success') {
        clearInterval(biliQrTimer.value)
        biliQrTimer.value = null
        biliLoginStatus.value = 'success'
        // 使用后端验证结果设置状态
        const isValid = data.data?.valid !== false // 后端验证通过或未验证都视为有效
        const hasNickname = !!data.data?.nickname
        biliLogged.value = true
        biliCookieValid.value = isValid
        biliNickname.value = data.data?.nickname || 'B站用户'
        biliLoginMessage.value = data.data?.message || `登录成功，欢迎 ${biliNickname.value}`
        // 只有验证通过且有真实昵称（完全成功）才自动关闭弹窗
        // 有错误时让用户看到提示，手动关闭
        if (isValid && hasNickname) {
          setTimeout(() => {
            if (showBiliLogin.value) {
              showBiliLogin.value = false
            }
          }, 2000)
        }
      } else if (status === 'scanned') {
        biliQrStatusText.value = '已扫码，请在手机上确认'
      } else if (status === 'pending') {
        biliQrStatusText.value = '等待扫码'
      } else if (status === 'expired') {
        clearInterval(biliQrTimer.value)
        biliQrTimer.value = null
        biliQrStatusText.value = '二维码已过期，请刷新'
      }
    } catch (err) {
      console.error('[bili-login poll]', err)
    }
  }, 3000)
}

async function checkBiliLoginStatus() {
  const wasLoggedIn = biliLogged.value
  try {
    const res = await fetch('/staticTool/api/video-parse/ytdlp/cookies/bilibili')
    const data = await res.json()
    const configured = !!data.data?.configured
    const valid = data.data?.valid ?? null

    if (!wasLoggedIn) {
      // 刷新后首次检查：后端返回 configured=true 但 valid=false（cookie 过期）
      // 此时不该显示"登录失效"（用户本就没登录过），统一显示"B站登录"
      if (configured && valid === false) {
        biliLogged.value = false
        biliCookieValid.value = null
      } else {
        biliLogged.value = configured
        biliCookieValid.value = valid
      }
      biliNickname.value = data.data?.nickname || ''
    } else {
      // 已登录：只接受正向更新，不把有效降级为失效
      // 扫码成功是最优验证，后端 cookie 检查可能因存储延迟等原因不一致
      if (valid === true) {
        biliCookieValid.value = true
        biliNickname.value = data.data?.nickname || biliNickname.value
      }
      if (configured === false) {
        // cookie 文件丢了才降级
        biliLogged.value = false
        biliCookieValid.value = false
      }
    }
  } catch (err) {
    console.error('[bili-login status]', err)
    if (!wasLoggedIn) {
      biliLogged.value = false
      biliCookieValid.value = false
    }
  }
}

// ==================== 链接解析回调 ====================
function onUrlParse({ url, useYtDlp: isYtDlp, title }) {
  videoUrl.value = url
  showPlayer.value = true
  parsedTitle.value = title || '视频'

  if (isYtDlp && ytDlpAvailable.value) {
    if (ytDlpExtracting.value) return
    handleYtDlpExtract(url)
  } else {
    if (userLines.value.length === 0) {
      ElMessage.warning('请先添加解析路径')
      return
    }
    useYtDlp.value = false
    handleThirdPartyParse(url, title)
  }

  // 异步从后端获取视频真实标题（当前标题为自动生成时才覆盖）
  const autoTitle = titleFromUrl(url)
  if (!title || title === autoTitle) {
    fetchPageTitle(url, url)
  }

  // 历史记录由 index.vue 统一管理
  saveHistory({
    url,
    title: '解析中...',
    time: new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })
}

// 从完整标题中提取剧名（去掉集数后缀），用于去重
function extractShowName(title) {
  if (!title || title === '解析中...') return title
  // 去掉常见集数模式：第X话/集/回、EP.X、S01E01 等
  return title.replace(/\s*[（(]?(第\d+[话集回]|EP\.?\s*\d+|S\d{2}\s*E\d+)[）)]?\s*$/i, '').trim() || title
}

// 按剧名去重：同一个剧只保留最近一次记录
function dedupHistoryByShow() {
  try {
    const history = JSON.parse(localStorage.getItem('vip_video_history') || '[]')
    const seen = new Set()
    const result = []
    for (const item of history) {
      const key = extractShowName(item.title)
      // "解析中..." 用 URL 作为去重 key，避免不同剧的"解析中..."被误合并；没有 URL 或 key 无效则保留
      if (!key || key === '解析中...') {
        const fallbackKey = item.url || key
        if (fallbackKey && !seen.has(fallbackKey)) {
          seen.add(fallbackKey)
          result.push(item)
        }
        continue
      }
      if (!seen.has(key)) {
        seen.add(key)
        result.push(item)
      }
      // else: 同名剧已在前面出现过（更近的），跳过当前这条旧的
    }
    localStorage.setItem('vip_video_history', JSON.stringify(result))
  } catch { /* ignore */ }
}

// 保存解析历史到 localStorage 并通知 UrlParse 组件刷新
function saveHistory(item) {
  try {
    const history = JSON.parse(localStorage.getItem('vip_video_history') || '[]')
    // 先去掉同 URL 的旧记录
    const filtered = history.filter(h => h.url !== item.url)
    const list = [item, ...filtered].slice(0, 30)
    localStorage.setItem('vip_video_history', JSON.stringify(list))
    // 写入后立即去重，清理同名旧记录
    dedupHistoryByShow()
    // 通知 UrlParse.vue 刷新历史列表
    window.dispatchEvent(new Event('history-updated'))
  } catch { /* ignore */ }
}

// 更新历史记录中的某条标题
function updateHistoryTitle(url, newTitle) {
  try {
    const history = JSON.parse(localStorage.getItem('vip_video_history') || '[]')
    const idx = history.findIndex(h => h.url === url)
    if (idx >= 0) {
      // 只要找到对应的条目就更新标题（无论之前是什么），然后去重
      history[idx].title = newTitle
      localStorage.setItem('vip_video_history', JSON.stringify(history))
      // 标题更新后按剧名去重，防止同一部剧出现多条
      dedupHistoryByShow()
      window.dispatchEvent(new Event('history-updated'))
    }
  } catch { /* ignore */ }
}

// 从后端获取页面真实标题
async function fetchPageTitle(url, originalUrl) {
  try {
    const res = await fetch(`/staticTool/api/video-parse/page-title?url=${encodeURIComponent(url)}`)
    const json = await res.json()
    if (json.code === 0 && json.data && json.data.title) {
      const fetchedTitle = json.data.title
      const autoTitle = titleFromUrl(originalUrl || url)
      // 只在当前标题仍是自动生成的情况下覆盖（防止覆盖用户手动输入的名称）
      if (parsedTitle.value === '视频' || parsedTitle.value === autoTitle || parsedTitle.value === (originalUrl || url).substring(0, 30)) {
        parsedTitle.value = fetchedTitle
        updateHistoryTitle(originalUrl || url, fetchedTitle)
      }
    }
  } catch {
    // 静默失败
  }
}

// URL 提取标题的辅助（用于判断是否需要更新历史记录）
function titleFromUrl(url) {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length > 0) {
      const last = parts[parts.length - 1].replace(/\.(html?|php|aspx?|jsp)$/, '')
      return last.length > 2 ? last : host
    }
    return host
  } catch {
    return url.substring(0, 30)
  }
}

// ==================== 计算属性 ====================
const currentPlayUrl = computed(() => {
  if (!showPlayer.value || useYtDlp.value) return ''
  const url = videoUrl.value.trim()
  if (!url || userLines.value.length === 0) return ''
  const idx = Math.min(currentLine.value, userLines.value.length - 1)
  return userLines.value[idx].api + encodeURIComponent(url)
})

// ==================== 解析路径管理 ====================
const showLineManage = ref(false)
const newLineName = ref('')
const newLineApi = ref('')
const editingLineIndex = ref(-1)
const editLineName = ref('')
const editLineApi = ref('')

const PARSE_LINES_VERSION = 7 // 升级版本号，旧版默认线路自动替换为新版

function loadUserLines() {
  try {
    const saved = localStorage.getItem('vip_video_parse_lines')
    const savedVersion = localStorage.getItem('vip_video_parse_lines_version')
    if (saved && Number(savedVersion) >= PARSE_LINES_VERSION) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
    // 版本不匹配或旧版数据，使用新版默认线路
  } catch { /* ignore */ }
  return [...defaultLines]
}

function saveUserLines() {
  try {
    localStorage.setItem('vip_video_parse_lines', JSON.stringify(userLines.value))
    localStorage.setItem('vip_video_parse_lines_version', String(PARSE_LINES_VERSION))
  } catch { /* ignore */ }
}

const hasCustomLines = computed(() => {
  try {
    const saved = localStorage.getItem('vip_video_parse_lines')
    return !!saved
  } catch { return false }
})

function addNewLine() {
  const name = newLineName.value.trim()
  const api = newLineApi.value.trim()
  if (!name) { ElMessage.warning('请输入线路名称'); return }
  if (!api) { ElMessage.warning('请输入解析接口地址'); return }
  if (!api.startsWith('http')) { ElMessage.warning('解析接口地址必须以 http:// 或 https:// 开头'); return }
  if (!api.includes('?url=') && !api.includes('?v=')) {
    ElMessage.warning('解析接口地址应包含 ?url= 参数占位符（如 ?url=）');
    return
  }
  userLines.value.push({ name, api })
  saveUserLines()
  newLineName.value = ''
  newLineApi.value = ''
  ElMessage.success('解析路径添加成功！')
}

function startEditLine(idx) {
  editingLineIndex.value = idx
  editLineName.value = userLines.value[idx].name
  editLineApi.value = userLines.value[idx].api
}

function saveEditLine() {
  const idx = editingLineIndex.value
  if (idx < 0 || idx >= userLines.value.length) return
  const name = editLineName.value.trim()
  const api = editLineApi.value.trim()
  if (!name) { ElMessage.warning('请输入线路名称'); return }
  if (!api) { ElMessage.warning('请输入解析接口地址'); return }
  userLines.value[idx] = { name, api }
  saveUserLines()
  editingLineIndex.value = -1
  ElMessage.success('修改成功！')
}

function cancelEditLine() {
  editingLineIndex.value = -1
}

function deleteLine(idx) {
  if (userLines.value.length <= 1) {
    ElMessage.warning('至少保留一条解析路径')
    return
  }
  ElMessageBox.confirm(`确定删除"${userLines.value[idx].name}"吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userLines.value.splice(idx, 1)
    saveUserLines()
    if (selectedLineIndex.value >= userLines.value.length) {
      selectedLineIndex.value = userLines.value.length - 1
    }
    ElMessage.success('删除成功！')
  }).catch(() => {})
}

function resetLines() {
  ElMessageBox.confirm('确定恢复默认解析路径吗？当前自定义路径将被覆盖。', '恢复默认', {
    confirmButtonText: '确定恢复',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userLines.value = [...defaultLines]
    selectedLineIndex.value = 0
    currentLine.value = 0
    saveUserLines()
    ElMessage.success('已恢复默认解析路径')
  }).catch(() => {})
}

// ==================== hls.js 播放器 ====================
let hls = null

watch(ytDlpStreamUrl, async (url) => {
  if (!url) return

  if (hls) {
    hls.destroy()
    hls = null
  }

  await nextTick()
  const video = videoPlayer.value
  if (!video) return

  const isM3u8 = ytDlpStreamType.value === 'm3u8' ||
    url.includes('.m3u8') || url.includes('/m3u8') || /m3u8/i.test(url)

  const isProxyUrl = url.includes('/proxy-stream/')

  if (isM3u8 && Hls.isSupported()) {
    hls = new Hls({
      xhrSetup: (xhr) => {
        if (!isProxyUrl) {
          xhr.setRequestHeader('Referer', 'https://www.bilibili.com/')
        }
      }
    })
    hls.loadSource(url)
    hls.attachMedia(video)
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {})
    })
    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.error('[hls.js fatal]', data.type, data.details)
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            ElMessage.error('网络错误，视频加载失败')
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError()
            break
          default:
            hls.destroy()
            break
        }
      }
    })
  } else if (isM3u8 && video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url
    video.addEventListener('loadedmetadata', () => {
      video.play().catch(() => {})
    }, { once: true })
  } else {
    video.src = url
    video.addEventListener('loadedmetadata', () => {
      video.play().catch(() => {})
    }, { once: true })
  }
})

// ==================== 生命周期 ====================
onMounted(() => {
  checkApiHealth()
  checkYtDlpStatus()
})
onBeforeUnmount(() => {
  if (hls) {
    hls.destroy()
    hls = null
  }
  if (biliQrTimer.value) {
    clearInterval(biliQrTimer.value)
    biliQrTimer.value = null
  }
})
</script>

<style lang="scss" scoped>
.vip-video-parse-page {
  padding: 0 24px 40px;
  max-width: 820px;
  width: 100%;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
  min-height: 100vh;
}

// 顶部返回栏
.top-bar {
  position: sticky;
  top: 0;
  z-index: 50;
  padding: 12px 0;
  margin: 0 -24px;
  // background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid #f1f5f9;
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.page-header {
  text-align: center;
  margin-bottom: 36px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f1f5f9;
}
.input-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 12px;
}
.back-btn { 
  flex-shrink: 0;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
}
.bili-login-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #6366f1;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  max-width: 180px;
  transition: all 0.2s;
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &:hover { background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); transform: translateY(-1px); box-shadow: 0 2px 8px rgba(99,102,241,0.15); }
  &:active { transform: translateY(0); }
  &.bili-expired {
    color: #dc2626;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    &:hover { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); box-shadow: 0 2px 8px rgba(220,38,38,0.12); }
  }
}
.header-center { text-align: center; }

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.page-desc { font-size: 15px; color: #64748b; }

// Input section
.input-section { margin-bottom: 36px; }

// Tab 切换
.input-mode-switch {
  display: inline-flex;
  gap: 0;
  margin-bottom: 14px;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
}
.input-mode-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 9px 20px;
  border: none;
  border-radius: 9px;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.25s ease;
  &:hover { color: #6366f1; }
  &.active {
    background: #fff;
    color: #6366f1;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
}

// Player
.player-section { margin-top: 12px; margin-bottom: 44px; }

.player-container {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

.player-header {
  display: flex;
  flex-direction: column;
  padding: 14px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #f1f5f9;
  gap: 8px;
}
.player-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.player-header-bottom {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}
.player-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}
.player-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 8px;
  flex-shrink: 0;
  transition: all 0.2s;
  &:hover { background: #fee2e2; color: #ef4444; }
}

.parsing-status {
  font-size: 12px;
  color: #6366f1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &.parsing-error {
    color: #ef4444;
  }
}
.parsing-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #e0e0ff;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.stop-auto-btn {
  margin-left: 4px;
  padding: 2px 10px;
  font-size: 12px;
  color: #fff;
  background: #ef4444;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
  &:hover {
    background: #dc2626;
  }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.ytdlp-info { display: flex; align-items: center; gap: 8px; }
.ytdlp-badge {
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: #fef3c7;
  color: #d97706;
}
.ytdlp-duration { font-size: 12px; color: #94a3b8; }
.download-actions { display: flex; align-items: center; gap: 6px; margin-left: auto; }
.dl-btn {
  padding: 4px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  &:hover:not(:disabled) {
    border-color: #6366f1;
    color: #6366f1;
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
.dl-btn-nw {
  border-color: #f97316;
  color: #f97316;
  background: #fff7ed;
  &:hover:not(:disabled) {
    border-color: #ea580c;
    color: #ea580c;
    background: #ffedd5;
  }
}
.line-switcher { display: flex; align-items: center; gap: 6px; }
.line-label { font-size: 12px; color: #94a3b8; }
.line-btn {
  padding: 4px 12px;
  border: 1px solid #e8ecf1;
  background: #fff;
  border-radius: 6px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: #6366f1; color: #6366f1; }
  &.active { background: #6366f1; color: #fff; border-color: #6366f1; }
}

.video-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #0f172a;
}

.video-iframe { width: 100%; height: 100%; border: none; }

.video-player-native {
  width: 100%; height: 100%; outline: none;
}

.video-placeholder.extracting, .video-placeholder.error {
  .extract-hint { font-size: 13px; color: #94a3b8; }
  .error-detail { font-size: 13px; color: #ef4444; max-width: 80%; text-align: center; word-break: break-all; }
}
.fallback-btn {
  margin-top: 12px;
  padding: 8px 20px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #475569;
  gap: 12px;
  p { font-size: 14px; color: #94a3b8; }
}

// 解析路径管理弹窗
.line-manage-panel {
  overflow: hidden;
  min-width: 0;
  .line-manage-add {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    padding: 16px;
    background: #f8fafc;
    border: 1px solid #e8ecf1;
    border-radius: 12px;
  }
  .add-inputs { flex: 1; display: flex; flex-direction: row; gap: 8px; }
  .add-input {
    flex: 0 0 130px;
    width: 130px;
    padding: 8px 12px;
    border: 1px solid #e8ecf1;
    border-radius: 8px;
    font-size: 13px;
    color: #0f172a;
    outline: none;
    background: #fff;
    transition: border-color 0.2s;
    &:focus { border-color: #6366f1; }
    &::placeholder { color: #94a3b8; font-size: 12px; }
  }
  .add-input-api { flex: 1; width: auto; font-size: 12px; }
  .add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
    &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  .line-manage-list { border: 1px solid #e8ecf1; border-radius: 12px; overflow: hidden; }
  .line-manage-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e8ecf1;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
  }
  .lmh-name { flex: 0 0 100px; }
  .lmh-api { flex: 1; }
  .lmh-actions { flex: 0 0 100px; text-align: center; }

  .line-manage-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
    min-width: 0;
    &:last-child { border-bottom: none; }
    .lm-item-name { font-size: 14px; font-weight: 500; color: #0f172a; display: flex; align-items: center; gap: 6px; }
    .lm-item-api {
      flex: 1;
      font-size: 12px;
      color: #64748b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .lm-item-actions { display: flex; gap: 4px; }
    .edit-input {
      padding: 6px 10px;
      border: 1px solid #e8ecf1;
      border-radius: 6px;
      font-size: 13px;
      color: #0f172a;
      outline: none;
      &:focus { border-color: #6366f1; }
      &.edit-input-api { flex: 1; font-size: 12px; }
    }
    .edit-input:first-of-type { flex: 0 0 100px; }
    .edit-actions { flex: 0 0 auto; display: flex; gap: 6px; }
  }

  .line-manage-empty { text-align: center; padding: 40px 20px; p { font-size: 14px; color: #94a3b8; } }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
}

// 健康状态指示点
.status-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  background: #cbd5e1;
  transition: all 0.3s;
  &.online { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.4); }
  &.offline { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.4); }
  &.unknown { background: #cbd5e1; }
}

// 响应式 - 平板
@media (max-width: 768px) {
  .vip-video-parse-page { padding: 0 16px 20px; }
  .top-bar { display: none; }
  .page-header { margin-bottom: 20px; padding-top: 16px; padding-bottom: 16px; }
  .page-title { font-size: 24px; }
  .page-desc { font-size: 14px; }
  .input-section { margin-bottom: 20px; }

  .player-container { border-radius: 13px; }
  .player-header { flex-direction: column; align-items: flex-start; padding: 12px 14px; gap: 8px; }
  .player-title { font-size: 14px; }
  .line-switcher { flex-wrap: wrap; gap: 4px; }
  .line-btn { padding: 4px 10px; font-size: 11px; }
  .input-mode-switch { border-radius: 10px; }
  .input-mode-btn { padding: 6px 14px; font-size: 12px; }
  .input-toolbar { gap: 8px; }
  .bili-login-btn { padding: 6px 10px; font-size: 12px; max-width: 140px; }
  .video-wrapper { aspect-ratio: 16 / 9.5; }
  .line-manage-panel {
    box-sizing: border-box;
    max-width: 100%;
    overflow: hidden;
    .line-manage-add { flex-direction: column; padding: 12px; gap: 8px; }
    .add-inputs { flex-direction: column; width: 100%; }
    .add-input { flex: 1 1 auto; width: auto; }
    .add-input-api { flex: 1 1 auto; width: auto; }
    .add-btn { margin-top: 0; align-self: flex-end; }
    .line-manage-header { display: none; }
    .line-manage-item { flex-wrap: wrap; gap: 6px; padding: 10px 12px; min-width: 0; }
    .lm-item-name, .lm-item-api { flex: 1 1 auto; min-width: 80px; word-break: break-all; }
    .lm-item-api { font-size: 11px; white-space: normal; }
    .lm-item-actions { flex: 0 0 auto; }
    .edit-input { font-size: 12px; padding: 4px 8px; min-width: 0; }
  }
}

// 响应式 - 手机
@media (max-width: 480px) {
  .vip-video-parse-page { padding: 16px 12px; }
  .page-header { margin-bottom: 16px; padding-bottom: 12px; }
  .page-title { font-size: 22px; }
  .page-desc { font-size: 13px; }
  .input-section { margin-bottom: 20px; }

  .player-section { margin-bottom: 24px; }
  .video-wrapper { aspect-ratio: 4 / 3; }
  .player-header { padding: 10px 12px; }
  .player-container { border-radius: 12px; }
  .line-btn { padding: 3px 8px; font-size: 11px; }
  .input-mode-switch { border-radius: 8px; }
  .input-mode-btn { padding: 5px 12px; font-size: 11px; border-radius: 6px; }
  .input-toolbar { gap: 6px; }
  .bili-login-btn { padding: 5px 8px; font-size: 11px; gap: 3px; max-width: 110px; }
  .fallback-btn { padding: 8px 16px; font-size: 13px; }
  .line-manage-panel {
    overflow: hidden;
    .line-manage-add { padding: 10px; gap: 6px; }
    .add-inputs { width: 100%; }
    .add-input { flex: 1 1 auto !important; width: 100%; font-size: 12px; padding: 8px 10px; box-sizing: border-box; }
    .add-input-api { flex: 1 1 auto !important; width: 100%; box-sizing: border-box; }
    .add-btn { width: 100%; justify-content: center; padding: 8px 0; font-size: 12px; }
    .line-manage-list {
      border: none;
      background: transparent;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .line-manage-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;
      padding: 14px 12px;
      background: #fff;
      border: 1px solid #e8ecf1;
      border-left: 3px solid #e2e8f0;
      border-radius: 8px;
      min-width: 0;
      &:has(.status-dot.online) {
        border-left-color: #22c55e;
        background: #f8fdfb;
      }
      &:has(.status-dot.offline) {
        border-left-color: #ef4444;
        background: #fffafa;
      }
    }
    .lm-item-main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .lm-item-name {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      column-gap: 24px;
      row-gap: 4px;
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
      line-height: 1.2;
    }
    .lm-item-name-text {
      white-space: nowrap;
      min-width: 0;
      flex-shrink: 0;
    }
    .lm-item-api {
      flex: 1 1 100%;
      font-size: 11px;
      font-weight: 400;
      color: #cbd5e1;
      line-height: 1.3;
      word-break: break-all;
      white-space: normal;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      flex-shrink: 0;
      align-self: center;
      &.online {
        background: #22c55e;
        box-shadow: 0 0 0 2px rgba(34,197,94,0.2);
        animation: statusPulse 1.6s ease-in-out infinite;
      }
      &.offline { background: #ef4444; box-shadow: 0 0 0 2px rgba(239,68,68,0.15); }
      &.unknown { background: #94a3b8; }
    }
    .lm-item-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0;
      flex-shrink: 0;
      .el-button {
        padding: 2px 8px;
        height: auto;
        min-height: auto;
        font-size: 12px;
        margin: 0;
      }
    }
    .edit-input { font-size: 11px; max-width: 100%; min-width: 0; box-sizing: border-box; }
  }
}

@keyframes statusPulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(34,197,94,0.2); }
  50% { box-shadow: 0 0 0 5px rgba(34,197,94,0); }
}
</style>

<style lang="scss">


// 深色模式
html.dark-mode .vip-video-parse-page {
  background: #0f0f1a;

  .top-bar {
    background: rgba(15, 15, 26, 0.85);
    border-bottom-color: #2d2d4a;
  }

  .page-header { border-bottom-color: #2d2d4a; }
  .page-desc { color: #94a3b8; }
  .bili-login-btn {
    color: #a78bfa;
    background: linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(167,139,250,0.12) 100%);
    &:hover { background: linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(167,139,250,0.2) 100%); box-shadow: 0 2px 8px rgba(167,139,250,0.12); }
    &.bili-expired {
      color: #f87171;
      background: linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(239,68,68,0.08) 100%);
      &:hover { background: linear-gradient(135deg, rgba(220,38,38,0.16) 0%, rgba(239,68,68,0.14) 100%); box-shadow: 0 2px 8px rgba(239,68,68,0.1); }
    }
  }

  .input-mode-switch { background: #1a1a2e; }
  .input-mode-btn {
    color: #6b7280;
    &:hover { color: #a78bfa; }
    &.active { background: #252540; color: #e2dee9; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
  }

  .player-container { background: #1a1a2e; border-color: #2d2d4a; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
  .player-header { background: #1e1e2e; border-bottom-color: #2d2d4a; }
  .player-title { color: #e2dee9; }
  .ytdlp-badge { background: rgba(251, 191, 36, 0.12); color: #fbbf24; }
  .ytdlp-duration { color: #6b7280; }
  .line-label { color: #6b7280; }
  .line-btn {
    background: #252540; border-color: #2d2d4a; color: #94a3b8;
    &:hover { border-color: #7c3aed; color: #a78bfa; }
    &.active { background: #7c3aed; color: #fff; border-color: #7c3aed; }
  }
  .video-placeholder { color: #94a3b8; p { color: #6b7280; } }
  .video-placeholder.extracting, .video-placeholder.error {
    .extract-hint { color: #6b7280; }
    .error-detail { color: #f87171; }
  }
  .fallback-btn {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    &:hover { opacity: 0.85; }
  }

  .line-manage-panel {
    .line-manage-add { background: #252540; border-color: #2d2d4a; }
    .add-input { background: #1a1a2e; border-color: #2d2d4a; color: #e2dee9;
      &:focus { border-color: #7c3aed; }
      &::placeholder { color: #4b5563; }
    }
    .line-manage-list { border-color: #2d2d4a; }
    .line-manage-header { background: #252540; border-bottom-color: #2d2d4a; color: #94a3b8; }
    .line-manage-item {
      border-bottom-color: #2d2d4a;
      .lm-item-name { color: #e2dee9; }
      .lm-item-api { color: #6b7280; }
      .edit-input { background: #1a1a2e; border-color: #2d2d4a; color: #e2dee9;
        &:focus { border-color: #7c3aed; }
      }
    }
    .line-manage-empty p { color: #6b7280; }
  }
}

// 深色模式 - 移动端卡片适配
@media (max-width: 480px) {
  html.dark-mode .vip-video-parse-page .line-manage-panel {
    .line-manage-list { background: transparent; }
    .line-manage-item {
      background: #1a1a2e;
      border-color: #2d2d4a;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      &:has(.status-dot.online) {
        border-left-color: #22c55e;
        background: rgba(34,197,94,0.06);
      }
      &:has(.status-dot.offline) {
        border-left-color: #ef4444;
        background: rgba(239,68,68,0.05);
      }
    }
    .lm-item-name { color: #e2dee9; }
    .lm-item-api { color: #6b7280; }
  }
}

// 深色模式 - 移动端卡片地址颜色更浅
@media (max-width: 480px) {
  html.dark-mode .vip-video-parse-page .line-manage-panel {
    .lm-item-api { color: #4b5260; }
  }
}

// 管理解析路径弹窗 - 响应式宽度（el-dialog 被 teleport 到 body，必须用全局样式）
@media (max-width: 768px) {
  .el-overlay-dialog .el-dialog {
    width: calc(100vw - 32px) !important;
    max-width: 580px;
    min-width: 0 !important;
    box-sizing: border-box;
    margin-left: auto !important;
    margin-right: auto !important;
  }
  .el-overlay-dialog .el-dialog__body {
    padding: 16px;
    overflow: hidden;
    box-sizing: border-box;
    word-break: break-all;
  }
  .el-overlay-dialog .el-dialog__header {
    padding: 16px 16px 0;
    box-sizing: border-box;
  }
  .el-overlay-dialog .el-dialog__footer {
    padding: 0 16px 16px;
    box-sizing: border-box;
  }
}

@media (max-width: 480px) {
  .el-overlay-dialog .el-dialog {
    width: calc(100vw - 16px) !important;
    max-width: 100vw;
    min-width: 0 !important;
    box-sizing: border-box;
    margin-left: auto !important;
    margin-right: auto !important;
  }
  .el-overlay-dialog .el-dialog__body {
    padding: 12px;
    overflow: hidden;
    box-sizing: border-box;
    word-break: break-all;
  }
  .el-overlay-dialog .el-dialog__header {
    padding: 12px 12px 0;
    box-sizing: border-box;
  }
  .el-overlay-dialog .el-dialog__footer {
    padding: 0 12px 12px;
    box-sizing: border-box;
  }
}

// ==================== B站扫码登录弹窗 ====================
.bili-login-dialog .el-dialog__body {
  padding: 20px;
}
.bili-login-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-height: 300px;
  justify-content: center;
}
.bili-login-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #64748b;
  font-size: 14px;
}
.bili-login-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.bili-qr-img {
  width: 200px;
  height: 200px;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  padding: 8px;
  background: #fff;
}
.bili-qr-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6366f1;
  margin: 0;
}
.bili-login-tip {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}
.bili-refresh-btn {
  margin-top: 4px;
  padding: 5px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 12px;
  color: #4b5563;
  background: #fff;
  cursor: pointer;
  &:hover { border-color: #6366f1; color: #6366f1; }
}
.bili-login-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  p { margin: 0; font-size: 15px; font-weight: 600; color: #0f172a; }
  .bili-login-sub { font-size: 13px; font-weight: 400; color: #94a3b8; }
}
.bili-login-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #ef4444;
  font-size: 14px;
  p { margin: 0; }
}

// 统一深色模式下所有 tab 的 input placeholder 颜色
// 注意：input::placeholder 必须用 input 元素作为后代选择器（不能用 .search-video-panel 直接套），否则 scoped 后无法匹配
// 统一深色模式下所有 input placeholder 颜色（高优先级选择器覆盖 scoped 编译）
html.dark-mode .vip-video-parse-page .url-input::placeholder,
html.dark-mode .vip-video-parse-page .fused-input::placeholder,
html.dark-mode .vip-video-parse-page input::placeholder {
  color: #4a4d56 !important;
  opacity: 1 !important;
}

// 暗黑模式下 B站登录成功弹窗文字颜色
html.dark-mode .bili-login-success {
  p { color: #e2dee9 !important; }
  .bili-login-sub { color: #9ca3af !important; }
}

// ==================== 使用指南（短视频搜索 Tab） ====================
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

// 统一深色模式下所有 tab 的使用指南描述颜色
// 必须用多重选择器确保优先级高于各组件 scoped 编译后的 [data-v-xxx] 选择器
html.dark-mode .vip-video-parse-page .search-guide .guide-desc,
html.dark-mode .vip-video-parse-page .guide-desc {
  color: #6b7280 !important;
}

// 使用指南——暗黑模式
html.dark-mode .vip-video-parse-page {
  .search-guide {
    background: #1a1a2e; border-color: #2d2d4a;
  }
  .guide-header { color: #e2dee9; }
  .guide-step { color: #94a3b8; }
  .guide-title { color: #e2dee9; }
}

// 使用指南——响应式平板
@media (max-width: 768px) {
  .search-guide { padding: 14px; }
  .guide-header { font-size: 14px; }
  .guide-step { font-size: 13px; }
  .guide-title { font-size: 13px; }
  .guide-desc { font-size: 12px; }
}

// 使用指南——响应式手机
@media (max-width: 480px) {
  .search-guide { margin-top: 14px; padding: 14px; }
  .guide-header { font-size: 14px; margin-bottom: 12px; }
  .guide-list { gap: 8px; }
  .guide-step { font-size: 13px; }
  .guide-title { font-size: 13px; }
  .guide-desc { font-size: 11px; }
  .guide-body {
    flex-direction: column;
    gap: 2px;
  }
  .guide-title { white-space: normal; }
}

// ==================== 快捷跳转 ====================
.quick-jump-section {
  margin-top: 12px;
  margin-bottom: 20px;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #e8ecf4;
  border-radius: 12px;
}
.quick-jump-header {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 14px;
}
.quick-jump-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}
.quick-jump-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  text-decoration: none;
  transition: all 0.25s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  &:nth-child(1) { background: linear-gradient(135deg, #fb7299, #fc8bab); }
  &:nth-child(2) { background: linear-gradient(135deg, #1e293b, #04d9ff); }
  &:nth-child(3) { background: linear-gradient(135deg, #ff6b00, #ff8c36); }
  &:nth-child(4) { background: linear-gradient(135deg, #3b82f6, #6366f1); }
  &:nth-child(5) { background: linear-gradient(135deg, #22c55e, #4ade80); }
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}
.quick-jump-icon { font-size: 16px; flex-shrink: 0; }
.quick-jump-name { white-space: nowrap; }

// 快捷跳转——暗黑模式
html.dark-mode .vip-video-parse-page {
  .quick-jump-section { background: #1a1a2e; border-color: #2d2d4a; }
  .quick-jump-header { color: #e2dee9; }
  .quick-jump-card {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    &:nth-child(2) {
      box-shadow: 0 0 10px rgba(4, 217, 255, 0.25), 0 2px 6px rgba(0, 0, 0, 0.3);
    }
  }
}

// 快捷跳转——响应式平板
@media (max-width: 768px) {
  .quick-jump-section { padding: 14px; }
  .quick-jump-header { font-size: 14px; }
  .quick-jump-card { padding: 8px 10px; font-size: 12px; }
}

// 快捷跳转——响应式手机
@media (max-width: 480px) {
  .quick-jump-section { margin-top: 10px; padding: 12px; }
  .quick-jump-header { font-size: 14px; margin-bottom: 10px; }
  .quick-jump-grid { grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .quick-jump-card { padding: 8px 6px; font-size: 11px; gap: 4px; }
  .quick-jump-icon { font-size: 13px; }
}
</style>

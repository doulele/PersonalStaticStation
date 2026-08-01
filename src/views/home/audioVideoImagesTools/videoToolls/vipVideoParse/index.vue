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
      <!-- Tab 切换 -->
      <div class="input-mode-switch">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="input-mode-btn"
          :class="{ active: activeTab === tab.key }"
          :disabled="searching"
          @click="switchTab(tab.key)"
        >
          <!-- <el-icon :size="14"><component :is="tab.icon" /></el-icon> -->
          {{ tab.label }}
        </button>
      </div>

      <!-- 视频名称 Tab -->
      <VideoName v-show="activeTab === 'name'" />

      <!-- 搜索视频 Tab -->
      <SearchVideo
        v-show="activeTab === 'search'"
        ref="searchVideoRef"
        @switch-mode="switchTab"
        @play-episode="onSearchPlayEpisode"
      />

      <!-- 链接解析 Tab -->
      <UrlParse
        v-show="activeTab === 'url'"
        ref="urlParseRef"
        :user-lines="userLines"
        :api-health-map="apiHealthMap"
        :health-checking="healthChecking"
        :yt-dlp-available="ytDlpAvailable"
        :use-yt-dlp="useYtDlp"
        :parsing="parsing"
        :yt-dlp-extracting="ytDlpExtracting"
        :selected-line-index="selectedLineIndex"
        @update:use-yt-dlp="useYtDlp = $event"
        @update:selected-line-index="selectedLineIndex = $event"
        @parse="onUrlParse"
        @check-api-health="checkApiHealth"
        @show-line-manage="showLineManage = true"
      />


    </div>

    <!-- 视频播放区 -->
    <div v-if="showPlayer" class="player-section">
      <div class="player-container">
        <div class="player-header">
          <span class="player-title">{{ parsedTitle || '正在播放' }}</span>
          <!-- yt-dlp 提取信息 -->
          <span v-if="ytDlpVideoInfo" class="ytdlp-info">
            <span class="ytdlp-badge">yt-dlp</span>
            <span v-if="ytDlpVideoInfo.durationString" class="ytdlp-duration">{{ ytDlpVideoInfo.durationString }}</span>
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
            :src="currentPlayUrl"
            class="video-iframe"
            frameborder="0"
            allowfullscreen
            allow="autoplay; encrypted-media"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          ></iframe>
          <div v-else class="video-placeholder">
            <el-icon :size="64"><VideoCamera /></el-icon>
            <p>输入视频链接开始播放</p>
          </div>
        </div>
      </div>
    </div>

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
          <button class="add-btn" :disabled="!newLineName.trim() || !newLineApi.trim()" @click="addNewLine">
            <el-icon :size="16"><Plus /></el-icon>
            <span>添加</span>
          </button>
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
              <span class="lm-item-name">
                <span class="status-dot" :class="getLineHealthStatus(line.name)"></span>
                {{ line.name }}
              </span>
              <span class="lm-item-api">{{ line.api }}</span>
              <div class="lm-item-actions">
                <el-button text size="small" type="primary" @click="startEditLine(idx)">编辑</el-button>
                <el-button text size="small" type="danger" @click="deleteLine(idx)" :disabled="userLines.length <= 1">删除</el-button>
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
  ArrowLeft, VideoPlay, Loading, VideoCamera, WarningFilled, Search, Link, Plus, Edit
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Hls from 'hls.js'
import SearchVideo from './components/SearchVideo.vue'
import UrlParse from './components/UrlParse.vue'
import VideoName from './components/VideoName.vue'

// ==================== Tab 切换 ====================
const tabs = [
  { key: 'name', label: 'VIP视频', icon: Edit },
  { key: 'search', label: '搜索视频', icon: Search },
  { key: 'url', label: '链接解析', icon: Link }
]
const activeTab = ref('name')
const searchVideoRef = ref(null)

function switchTab(key) {
  activeTab.value = key
  // 切换时清理搜索组件的旧结果
  if (searchVideoRef.value) {
    searchVideoRef.value.clearResults()
  }
}

// ==================== 公共播放状态 ====================
const showPlayer = ref(false)
const parsedTitle = ref('')
const currentLine = ref(0)
const videoUrl = ref('')

// ==================== 解析路径 ====================
const defaultLines = [
  { name: '线路一', api: 'https://jx.m3u8.tv/jiexi/?url=' },
  { name: '线路二', api: 'https://vip.bljiex.com/?v=' },
  { name: '线路三', api: 'https://jx.618g.com/?url=' },
  { name: '线路四', api: 'https://z1.m1907.top/?jx=' },
  { name: '线路五', api: 'https://jx.playerjx.com/?url=' },
  { name: '线路六', api: 'https://jx.nnxv.cn/tv.php?url=' },
  { name: '线路七', api: 'https://www.8090g.cn/jiexi/?url=' },
  { name: '线路八', api: 'https://www.playm3u8.cn/jiexi.php?url=' }
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

function handleThirdPartyParse(url) {
  parsing.value = true
  currentLine.value = selectedLineIndex.value
  showPlayer.value = true

  setTimeout(() => {
    parsedTitle.value = '视频'
    parsing.value = false
    ElMessage.success('解析成功！开始播放')
  }, 800)
}

// ==================== 搜索视频回调 ====================
function onSearchPlayEpisode(ep) {
  videoUrl.value = ep.webpageUrl || `https://www.bilibili.com/video/${ep.id}`
  showPlayer.value = true
  parsedTitle.value = ep.title || '视频'
  useYtDlp.value = true
  handleYtDlpExtract(videoUrl.value.trim())
}

// ==================== 链接解析回调 ====================
function onUrlParse({ url, useYtDlp: isYtDlp }) {
  videoUrl.value = url
  showPlayer.value = true

  if (isYtDlp && ytDlpAvailable.value) {
    if (ytDlpExtracting.value) return
    handleYtDlpExtract(url)
  } else {
    if (userLines.value.length === 0) {
      ElMessage.warning('请先添加解析路径')
      return
    }
    useYtDlp.value = false
    handleThirdPartyParse(url)
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

function loadUserLines() {
  try {
    const saved = localStorage.getItem('vip_video_parse_lines')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* ignore */ }
  return [...defaultLines]
}

function saveUserLines() {
  try {
    localStorage.setItem('vip_video_parse_lines', JSON.stringify(userLines.value))
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
    localStorage.removeItem('vip_video_parse_lines')
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
  // padding-top: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f1f5f9;
}
.back-btn { 
  flex-shrink: 0;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
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
.player-section { margin-bottom: 44px; }

.player-container {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

.player-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 12px;
}
.player-title { font-size: 15px; font-weight: 600; color: #0f172a; }
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
  .line-manage-add {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 20px;
    padding: 16px;
    background: #f8fafc;
    border: 1px solid #e8ecf1;
    border-radius: 12px;
  }
  .add-inputs { flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .add-input {
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
  .add-input-api { font-size: 12px; }
  .add-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 9px 18px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    margin-top: 4px;
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
    &:last-child { border-bottom: none; }
    .lm-item-name { flex: 0 0 120px; font-size: 14px; font-weight: 500; color: #0f172a; display: flex; align-items: center; gap: 6px; }
    .lm-item-api {
      flex: 1;
      font-size: 12px;
      color: #64748b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .lm-item-actions { flex: 0 0 100px; display: flex; gap: 4px; justify-content: center; }
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
  .video-wrapper { aspect-ratio: 16 / 9.5; }
  .line-manage-panel {
    .line-manage-add { flex-direction: column; padding: 12px; gap: 8px; }
    .add-btn { margin-top: 0; align-self: flex-end; }
    .line-manage-header { display: none; }
    .line-manage-item { flex-wrap: wrap; gap: 6px; padding: 10px 12px; }
    .lm-item-name, .lm-item-api { flex: 1 1 auto; min-width: 120px; }
    .lm-item-api { font-size: 11px; }
    .lm-item-actions { flex: 0 0 auto; }
    .edit-input { font-size: 12px; padding: 4px 8px; }
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
  .fallback-btn { padding: 8px 16px; font-size: 13px; }
  .line-manage-panel {
    .add-btn { padding: 8px 14px; font-size: 12px; }
    .line-manage-item { padding: 8px 10px; }
    .lm-item-name { font-size: 13px; }
    .edit-input { font-size: 11px; }
  }
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
</style>

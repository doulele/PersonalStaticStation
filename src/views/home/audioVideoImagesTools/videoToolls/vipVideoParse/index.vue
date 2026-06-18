<template>
  <div class="vip-video-parse-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text class="back-btn" @click="$router.back()">返回</el-button>
      <div class="header-center">
        <h1 class="page-title">📺 VIP视频解析</h1>
        <p class="page-desc">粘贴视频链接，免费在线观看VIP视频</p>
      </div>
      <div class="header-spacer"></div>
    </div>

    <!-- 输入区 -->
    <div class="input-section">
      <div class="input-box">
        <el-icon class="input-icon" :size="20"><Link /></el-icon>
        <input
          v-model="videoUrl"
          class="url-input"
          placeholder="粘贴VIP视频播放链接（支持腾讯、爱奇艺、优酷、芒果等）"
          @keydown.enter="handleParse"
        />
        <el-icon v-if="videoUrl" class="clear-icon" :size="18" @click="clearUrl">
          <CircleClose />
        </el-icon>
      </div>

      <div class="input-actions">
        <button class="parse-btn" :disabled="!videoUrl.trim()" :class="{ loading: parsing }" @click="handleParse">
          <el-icon v-if="!parsing" :size="18"><VideoPlay /></el-icon>
          <el-icon v-else class="is-loading" :size="18"><Loading /></el-icon>
          <span>{{ parsing ? '解析中...' : '立即解析' }}</span>
        </button>
      </div>

      <!-- 支持的平台 -->
      <div class="platform-tags">
        <span class="platform-label">支持平台：</span>
        <span v-for="p in platforms" :key="p.name" class="platform-chip" :style="{ '--pf-color': p.color }">
          {{ p.name }}
        </span>
      </div>
    </div>

    <!-- 视频播放区 -->
    <div v-if="showPlayer" class="player-section">
      <div class="player-container">
        <div class="player-header">
          <span class="player-title">{{ parsedTitle || '正在播放' }}</span>
          <div class="line-switcher" v-if="lines.length > 1">
            <span class="line-label">播放线路：</span>
            <button
              v-for="(line, idx) in lines"
              :key="idx"
              class="line-btn"
              :class="{ active: currentLine === idx }"
              @click="currentLine = idx"
            >{{ line.name }}</button>
          </div>
        </div>

        <!-- iframe 播放 -->
        <div class="video-wrapper">
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

    <!-- 历史记录 -->
    <div v-if="history.length" class="history-section">
      <div class="history-header">
        <h3>📋 播放记录</h3>
        <el-button text size="small" type="danger" @click="clearHistory">清空记录</el-button>
      </div>
      <div class="history-list">
        <div
          v-for="(item, idx) in history"
          :key="idx"
          class="history-item"
          @click="replayFromHistory(item)"
        >
          <span class="history-index">{{ idx + 1 }}</span>
          <span class="history-title">{{ item.title || '未命名视频' }}</span>
          <span class="history-time">{{ item.time }}</span>
          <el-icon class="history-play" :size="14"><VideoPlay /></el-icon>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="tips-section">
      <h3>💡 使用说明</h3>
      <ul class="tips-list">
        <li>支持腾讯视频、爱奇艺、优酷、芒果TV、B站等主流视频平台的VIP视频解析</li>
        <li>复制目标视频的网页链接，粘贴到输入框中，点击"立即解析"即可观看</li>
        <li>如遇到无法播放的情况，请尝试切换播放线路</li>
        <li>解析接口由第三方提供，仅供学习交流使用，请勿用于商业用途</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  ArrowLeft, Link, CircleClose, VideoPlay, Loading, VideoCamera
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const videoUrl = ref('')
const parsing = ref(false)
const showPlayer = ref(false)
const parsedTitle = ref('')
const currentLine = ref(0)

// 模拟解析线路
const lines = [
  { name: '线路一', api: 'https://jx.a.scds.art/?url=' },
  { name: '线路二', api: 'https://jx.m3u8.tv/jiexi/?url=' },
  { name: '线路三', api: 'https://jx.jsonplayer.com/player/?url=' }
]

const platforms = [
  { name: '腾讯视频', color: '#0052d9' },
  { name: '爱奇艺', color: '#00be06' },
  { name: '优酷', color: '#00a0e9' },
  { name: '芒果TV', color: '#ff6600' },
  { name: 'B站', color: '#fb7299' },
  { name: '其他', color: '#6b7280' }
]

// 播放历史
const history = ref(loadHistory())

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem('vip_video_history') || '[]')
  } catch { return [] }
}

function saveHistory(item) {
  const list = [item, ...history.value.filter(h => h.url !== item.url)].slice(0, 20)
  history.value = list
  try {
    localStorage.setItem('vip_video_history', JSON.stringify(list))
  } catch { /* ignore */ }
}

function clearHistory() {
  history.value = []
  try { localStorage.removeItem('vip_video_history') } catch { /* ignore */ }
}

function clearUrl() {
  videoUrl.value = ''
}

function isValidUrl(url) {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch { return false }
}

function handleParse() {
  const url = videoUrl.value.trim()
  if (!url) {
    ElMessage.warning('请先粘贴视频链接')
    return
  }

  if (!isValidUrl(url)) {
    ElMessage.warning('请输入有效的视频链接（以 http:// 或 https:// 开头）')
    return
  }

  parsing.value = true
  currentLine.value = 0

  // 模拟解析过程
  setTimeout(() => {
    // 尝试从 URL 提取标题
    const titleMatch = url.match(/title=([^&]+)/)
    parsedTitle.value = titleMatch ? decodeURIComponent(titleMatch[1]) : 'VIP视频'

    showPlayer.value = true
    parsing.value = false

    // 保存历史
    saveHistory({
      url,
      title: parsedTitle.value,
      time: new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    })

    ElMessage.success('解析成功！开始播放')
  }, 800)
}

function replayFromHistory(item) {
  videoUrl.value = item.url
  handleParse()
}

// 切换线路
const currentPlayUrl = computed(() => {
  if (!showPlayer.value) return ''
  const url = videoUrl.value.trim()
  if (!url) return ''
  return lines[currentLine.value].api + encodeURIComponent(url)
})
</script>

<style lang="scss" scoped>
.vip-video-parse-page {
  padding: 40px 24px;
  max-width: 1000px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
}
.back-btn { flex-shrink: 0; }
.header-center { flex: 1; text-align: center; }
.header-spacer { flex-shrink: 0; width: 60px; }

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
  letter-spacing: -0.02em;
}
.page-desc { font-size: 16px; color: #64748b; }

// Input section
.input-section { margin-bottom: 32px; }

.input-box {
  display: flex;
  align-items: center;
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 0 16px;
  height: 56px;
  transition: all 0.3s;
  &:focus-within { border-color: #6366f1; box-shadow: 0 4px 20px rgba(99,102,241,0.12); }
}
.input-icon { color: #94a3b8; margin-right: 12px; flex-shrink: 0; }
.url-input {
  flex: 1; border: none; outline: none; font-size: 15px; color: #0f172a; background: transparent;
  &::placeholder { color: #94a3b8; font-size: 14px; }
}
.clear-icon { color: #94a3b8; cursor: pointer; flex-shrink: 0; &:hover { color: #64748b; } }

.input-actions { margin-top: 16px; text-align: center; }

.parse-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 40px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.4); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.platform-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
  justify-content: center;
}
.platform-label { font-size: 13px; color: #94a3b8; font-weight: 500; }
.platform-chip {
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--pf-color);
  background: color-mix(in srgb, var(--pf-color) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--pf-color) 30%, transparent);
}

// Player
.player-section { margin-bottom: 40px; }

.player-container {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

.player-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 12px;
}
.player-title { font-size: 15px; font-weight: 600; color: #0f172a; }
.line-switcher { display: flex; align-items: center; gap: 6px; }
.line-label { font-size: 12px; color: #94a3b8; }
.line-btn {
  padding: 3px 12px;
  border: 1px solid #e2e8f0;
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
  background: #000;
}

.video-iframe {
  width: 100%;
  height: 100%;
  border: none;
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

// History
.history-section { margin-bottom: 40px; }
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  h3 { font-size: 18px; font-weight: 600; color: #0f172a; margin: 0; }
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 240px;
  overflow-y: auto;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: #f0f0ff; }
}
.history-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  flex-shrink: 0;
}
.history-title {
  flex: 1;
  font-size: 14px;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-time { font-size: 12px; color: #94a3b8; flex-shrink: 0; }
.history-play { color: #6366f1; flex-shrink: 0; }

// Tips
.tips-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px;
  h3 { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 14px; }
}
.tips-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  li { font-size: 14px; color: #64748b; line-height: 1.6; }
}

// Responsive
@media (max-width: 768px) {
  .vip-video-parse-page { padding: 24px 16px; }
  .page-title { font-size: 28px; }
  .input-box { height: 48px; }
  .parse-btn { padding: 12px 32px; font-size: 15px; }
  .player-header { flex-direction: column; align-items: flex-start; }
}

@media (max-width: 480px) {
  .parse-btn { width: 100%; justify-content: center; }
  .video-wrapper { aspect-ratio: 4 / 3; }
}
</style>

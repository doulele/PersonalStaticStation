<template>
  <div class="novel-online-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text class="back-btn" @click="$router.back()">返回</el-button>
      <div class="header-center">
        <h1 class="page-title">🎧 音频在线</h1>
        <p class="page-desc">书籍小说等在线搜索收听</p>
      </div>
      <div class="header-spacer"></div>
    </div>

    <!-- 搜索框 -->
    <div class="search-section">
      <div class="search-box">
        <el-icon class="search-icon" :size="20"><Search /></el-icon>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索书名、作者或主播..."
          @keydown.enter="handleSearch"
        />
        <el-icon v-if="keyword" class="clear-icon" :size="18" @click="clearSearch">
          <CircleClose />
        </el-icon>
        <button class="search-btn" :disabled="!keyword.trim()" @click="handleSearch">搜索</button>
      </div>

      <!-- 快捷分类 -->
      <div class="category-tags">
        <span class="tags-label">热门分类：</span>
        <button
          v-for="cat in categories"
          :key="cat"
          class="tag-btn"
          :class="{ active: activeCategory === cat }"
          @click="searchByCategory(cat)"
        >{{ cat }}</button>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-if="loading" class="loading-area">
      <el-icon class="is-loading" :size="28"><Loading /></el-icon>
      <span>搜索中...</span>
    </div>

    <div v-else-if="audioList.length" class="audio-list">
      <div class="list-header">
        <span class="result-count">共找到 {{ audioList.length }} 个结果</span>
      </div>

      <div
        v-for="(item, index) in audioList"
        :key="index"
        class="audio-card"
        :class="{ playing: currentPlaying === index }"
      >
        <div class="card-cover" @click="playAudio(index)">
          <div class="cover-placeholder">
            <span class="cover-emoji">{{ item.emoji || '📖' }}</span>
          </div>
          <div v-if="currentPlaying === index && isPlaying" class="playing-overlay">
            <span class="playing-wave">
              <i></i><i></i><i></i><i></i>
            </span>
          </div>
          <div v-else class="play-btn">
            <el-icon :size="28"><VideoPlay /></el-icon>
          </div>
        </div>

        <div class="card-info">
          <h3 class="card-title">{{ item.title }}</h3>
          <p class="card-author">
            <el-icon :size="12"><User /></el-icon>
            {{ item.author }}
          </p>
          <p class="card-narrator" v-if="item.narrator">
            <el-icon :size="12"><Microphone /></el-icon>
            {{ item.narrator }}
          </p>
          <div class="card-meta">
            <el-tag size="small" type="info">{{ item.category }}</el-tag>
            <span class="meta-chapters">{{ item.chapters || 0 }}集</span>
            <span v-if="item.rating" class="meta-rating">⭐ {{ item.rating }}</span>
          </div>
        </div>

        <div class="card-actions">
          <el-button
            :type="currentPlaying === index && isPlaying ? 'warning' : 'primary'"
            :icon="currentPlaying === index && isPlaying ? VideoPause : VideoPlay"
            circle
            @click="playAudio(index)"
          />
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="searched" class="empty-area">
      <el-empty description="未找到相关音频资源">
        <span class="empty-tip">请尝试其他关键词</span>
      </el-empty>
    </div>

    <!-- 初始推荐 -->
    <div v-else class="recommend-section">
      <h2 class="section-title">🔥 热门推荐</h2>
      <div class="audio-list">
        <div
          v-for="(item, index) in hotAudios"
          :key="index"
          class="audio-card"
        >
          <div class="card-cover" @click="playHotAudio(index)">
            <div class="cover-placeholder">
              <span class="cover-emoji">{{ item.emoji || '📖' }}</span>
            </div>
            <div v-if="currentPlaying === index && isPlaying" class="playing-overlay">
              <span class="playing-wave">
                <i></i><i></i><i></i><i></i>
              </span>
            </div>
            <div v-else class="play-btn">
              <el-icon :size="28"><VideoPlay /></el-icon>
            </div>
          </div>

          <div class="card-info">
            <h3 class="card-title">{{ item.title }}</h3>
            <p class="card-author">
              <el-icon :size="12"><User /></el-icon>
              {{ item.author }}
            </p>
            <p class="card-narrator" v-if="item.narrator">
              <el-icon :size="12"><Microphone /></el-icon>
              {{ item.narrator }}
            </p>
            <div class="card-meta">
              <el-tag size="small" type="info">{{ item.category }}</el-tag>
              <span class="meta-chapters">{{ item.chapters || 0 }}集</span>
              <span v-if="item.rating" class="meta-rating">⭐ {{ item.rating }}</span>
            </div>
          </div>

          <div class="card-actions">
            <el-button
              :type="currentPlaying === index && isPlaying ? 'warning' : 'primary'"
              :icon="currentPlaying === index && isPlaying ? VideoPause : VideoPlay"
              circle
              @click="playHotAudio(index)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 底部播放器面板 -->
    <transition name="player-panel-slide">
      <div v-if="currentPlaying !== null && currentAudio" class="player-panel">
        <!-- 拖拽手柄 -->
        <div class="panel-handle">
          <span class="handle-bar"></span>
        </div>

        <!-- 播放信息区 -->
        <div class="player-main">
          <!-- 大封面 -->
          <div class="player-artwork" :class="{ spinning: isPlaying }">
            <div class="artwork-bg" :style="{ background: currentArtworkBg }">
              <span class="artwork-emoji">{{ currentAudio.emoji || '📖' }}</span>
            </div>
            <div v-if="isPlaying" class="artwork-ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
                <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" :stroke-dasharray="289" :stroke-dashoffset="289 - (289 * progress / 100)"
                  transform="rotate(-90 50 50)" style="color: #fff; transition: stroke-dashoffset 0.5s ease;"/>
              </svg>
            </div>
          </div>

          <!-- 曲目信息 -->
          <div class="player-track-info">
            <h3 class="track-title">{{ currentAudio.title }}</h3>
            <p class="track-meta">
              <span>{{ currentAudio.author }}</span>
              <span v-if="currentAudio.narrator" class="meta-sep">·</span>
              <span v-if="currentAudio.narrator">{{ currentAudio.narrator }}</span>
            </p>
            <el-tag size="small" round effect="plain" class="track-tag">{{ currentAudio.category }}</el-tag>
          </div>

          <!-- 播放控制 -->
          <div class="player-actions">
            <button class="action-btn sm" :class="{ active: shuffleMode }" title="随机播放" @click="toggleShuffle">
              <el-icon :size="18"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg></el-icon>
            </button>

            <button class="action-btn" title="上一首" @click="playPrev">
              <el-icon :size="22"><VideoPlay style="transform: scaleX(-1)" /></el-icon>
            </button>

            <button class="play-btn-main" :class="{ playing: isPlaying }" @click="togglePlay">
              <el-icon :size="28">
                <VideoPause v-if="isPlaying" />
                <VideoPlay v-else />
              </el-icon>
            </button>

            <button class="action-btn" title="下一首" @click="playNext">
              <el-icon :size="22"><VideoPlay /></el-icon>
            </button>

            <button class="action-btn sm" :class="{ active: loopMode !== 'none' }" title="播放模式" @click="toggleLoopMode">
              <span v-if="loopMode === 'list'" class="loop-icon">🔁</span>
              <span v-else-if="loopMode === 'single'" class="loop-icon">🔂</span>
              <span v-else class="loop-icon off">🔁</span>
            </button>
          </div>

          <!-- 进度条 -->
          <div class="player-progress">
            <span class="time-label">{{ formatTime(currentTime) }}</span>
            <div class="progress-track" @click="seekAudio">
              <div class="progress-buffered" :style="{ width: bufferPercent + '%' }"></div>
              <div class="progress-active" :style="{ width: progress + '%' }">
                <span class="progress-thumb"></span>
              </div>
            </div>
            <span class="time-label">{{ formatTime(duration) }}</span>
          </div>
        </div>

        <!-- 播放列表 -->
        <div class="playlist-section">
          <div class="playlist-header">
            <span class="playlist-title">
              <span class="playlist-indicator" v-if="loopMode === 'list'">🔁</span>
              <span class="playlist-indicator" v-else-if="loopMode === 'single'">🔂</span>
              <span class="playlist-indicator" v-else>▶</span>
              播放列表 · {{ playlistData.length }} 首
            </span>
            <span class="playlist-mode">{{ loopModeLabel }}</span>
          </div>

          <div class="playlist-scroll">
            <div
              v-for="(item, idx) in playlistData"
              :key="idx"
              class="playlist-item"
              :class="{ active: idx === currentPlaying, playing: idx === currentPlaying && isPlaying }"
              @click="playFromList(idx)"
            >
              <div class="pl-item-num">
                <span v-if="idx === currentPlaying && isPlaying" class="pl-equalizer">
                  <i></i><i></i><i></i>
                </span>
                <span v-else class="pl-num">{{ idx + 1 }}</span>
              </div>
              <div class="pl-cover-mini">
                <span>{{ item.emoji || '📖' }}</span>
              </div>
              <div class="pl-item-info">
                <span class="pl-item-title">{{ item.title }}</span>
                <span class="pl-item-author">{{ item.author }}</span>
              </div>
              <span class="pl-item-chapters">{{ item.chapters || 0 }}集</span>
              <span class="pl-item-duration">{{ formatTime(30) }}</span>
            </div>
          </div>
        </div>

        <!-- 关闭按钮 -->
        <button class="panel-close" @click="stopAudio">
          <el-icon :size="20"><Close /></el-icon>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  ArrowLeft, Search, CircleClose, Loading,
  VideoPlay, VideoPause, User, Microphone, Close
} from '@element-plus/icons-vue'

const keyword = ref('')
const searched = ref(false)
const loading = ref(false)
const activeCategory = ref('')
const audioList = ref([])
const currentPlaying = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const bufferPercent = ref(0)
const loopMode = ref('list') // 'none' | 'single' | 'list'
const shuffleMode = ref(false)
let progressTimer = null
let bufferTimer = null

const categories = ['玄幻', '都市', '言情', '悬疑', '武侠', '科幻', '历史', '儿童']

// 封面渐变色预设
const artworkGradients = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #8b5cf6, #ec4899)',
  'linear-gradient(135deg, #f97316, #eab308)',
  'linear-gradient(135deg, #6366f1, #06b6d4)',
  'linear-gradient(135deg, #14b8a6, #6366f1)',
  'linear-gradient(135deg, #ef4444, #f97316)',
]

// 热门推荐数据
const hotAudios = [
  { title: '三体（全集）', author: '刘慈欣', narrator: '青雪', category: '科幻', chapters: 365, rating: '9.7', emoji: '👽' },
  { title: '盗墓笔记', author: '南派三叔', narrator: '周建龙', category: '悬疑', chapters: 268, rating: '9.5', emoji: '🏺' },
  { title: '斗破苍穹', author: '天蚕土豆', narrator: '大灰狼', category: '玄幻', chapters: 1650, rating: '9.2', emoji: '⚔️' },
  { title: '平凡的世界', author: '路遥', narrator: '李野墨', category: '都市', chapters: 152, rating: '9.8', emoji: '🌾' },
  { title: '鬼吹灯', author: '天下霸唱', narrator: '艾宝良', category: '悬疑', chapters: 452, rating: '9.6', emoji: '🕯️' },
  { title: '明朝那些事儿', author: '当年明月', narrator: '孙一', category: '历史', chapters: 268, rating: '9.7', emoji: '🏯' },
  { title: '哈利·波特全集', author: 'J.K.罗琳', narrator: '曹雷', category: '儿童', chapters: 205, rating: '9.6', emoji: '🧙' },
  { title: '诛仙', author: '萧鼎', narrator: '清灵', category: '武侠', chapters: 256, rating: '9.3', emoji: '🗡️' }
]

// Mock 搜索数据
const mockData = [
  ...hotAudios,
  { title: '庆余年', author: '猫腻', narrator: '李满超', category: '玄幻', chapters: 796, rating: '9.5', emoji: '🏰' },
  { title: '雪中悍刀行', author: '烽火戏诸侯', narrator: '大斌', category: '武侠', chapters: 1008, rating: '9.4', emoji: '❄️' },
  { title: '全职高手', author: '蝴蝶蓝', narrator: '刺儿', category: '都市', chapters: 1728, rating: '9.3', emoji: '🎮' },
  { title: '活着', author: '余华', narrator: '齐克建', category: '都市', chapters: 44, rating: '9.8', emoji: '📚' },
  { title: '天龙八部', author: '金庸', narrator: '张震', category: '武侠', chapters: 120, rating: '9.6', emoji: '🏔️' }
]

const currentAudio = computed(() => {
  if (currentPlaying.value === null) return null
  return playlistData.value[currentPlaying.value] || null
})

// 播放列表数据（统一来源）
const playlistData = computed(() => {
  if (searched.value && audioList.value.length) return audioList.value
  return hotAudios
})

// 当前封面渐变色
const currentArtworkBg = computed(() => {
  if (currentPlaying.value === null) return artworkGradients[0]
  return artworkGradients[currentPlaying.value % artworkGradients.length]
})

// 循环模式标签
const loopModeLabel = computed(() => {
  const map = { none: '顺序播放', single: '单曲循环', list: '列表循环' }
  return map[loopMode.value] || '列表循环'
})

// 播放列表总长度
const playlistLength = computed(() => playlistData.value.length)

function handleSearch() {
  const kw = keyword.value.trim()
  if (!kw) return

  loading.value = true
  searched.value = true
  currentPlaying.value = null
  isPlaying.value = false

  setTimeout(() => {
    audioList.value = mockData.filter(item =>
      item.title.includes(kw) ||
      item.author.includes(kw) ||
      item.narrator?.includes(kw) ||
      item.category.includes(kw)
    )
    loading.value = false
  }, 500)
}

function searchByCategory(cat) {
  activeCategory.value = cat
  keyword.value = cat
  loading.value = true
  searched.value = true
  currentPlaying.value = null
  isPlaying.value = false

  setTimeout(() => {
    audioList.value = mockData.filter(item => item.category === cat)
    loading.value = false
  }, 300)
}

function clearSearch() {
  keyword.value = ''
  audioList.value = []
  searched.value = false
  activeCategory.value = ''
  stopAudio()
}

function playAudio(index) {
  if (currentPlaying.value === index) {
    togglePlay()
    return
  }
  stopProgress()
  currentPlaying.value = index
  startPlay()
}

function playHotAudio(index) {
  searched.value = true
  audioList.value = [...hotAudios]
  playAudio(index)
}

function playFromList(index) {
  playAudio(index)
}

function startPlay() {
  isPlaying.value = true
  duration.value = 30 // mock 30秒，方便演示列表循环
  currentTime.value = 0
  progress.value = 0
  bufferPercent.value = 0
  startProgress()
  startBufferSim()
}

function togglePlay() {
  if (currentPlaying.value === null) return
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    startProgress()
    startBufferSim()
  } else {
    stopProgress()
    stopBufferSim()
  }
}

function stopAudio() {
  isPlaying.value = false
  currentPlaying.value = null
  currentTime.value = 0
  progress.value = 0
  duration.value = 0
  bufferPercent.value = 0
  stopProgress()
  stopBufferSim()
}

function playPrev() {
  if (currentPlaying.value === null) return
  const len = playlistLength.value
  if (shuffleMode.value) {
    let next
    do { next = Math.floor(Math.random() * len) } while (next === currentPlaying.value && len > 1)
    playAudio(next)
  } else {
    const prev = (currentPlaying.value - 1 + len) % len
    playAudio(prev)
  }
}

function playNext() {
  if (currentPlaying.value === null) return
  const len = playlistLength.value
  if (shuffleMode.value) {
    let next
    do { next = Math.floor(Math.random() * len) } while (next === currentPlaying.value && len > 1)
    playAudio(next)
  } else {
    const next = (currentPlaying.value + 1) % len
    playAudio(next)
  }
}

function toggleLoopMode() {
  const modes = ['list', 'single', 'none']
  const idx = modes.indexOf(loopMode.value)
  loopMode.value = modes[(idx + 1) % modes.length]
}

function toggleShuffle() {
  shuffleMode.value = !shuffleMode.value
}

// 播放结束后根据循环模式处理
function onTrackEnd() {
  if (loopMode.value === 'single') {
    // 单曲循环：重新播放当前曲目
    currentTime.value = 0
    progress.value = 0
    bufferPercent.value = 0
    startBufferSim()
  } else if (loopMode.value === 'list') {
    // 列表循环：下一首
    playNext()
  } else {
    // 顺序播放：如果是最后一首则停止
    if (currentPlaying.value >= playlistLength.value - 1) {
      stopAudio()
    } else {
      playNext()
    }
  }
}

function startProgress() {
  stopProgress()
  progressTimer = setInterval(() => {
    if (currentTime.value >= duration.value) {
      onTrackEnd()
      return
    }
    currentTime.value += 1
    progress.value = (currentTime.value / duration.value) * 100
  }, 1000)
}

function stopProgress() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

function startBufferSim() {
  stopBufferSim()
  bufferPercent.value = 0
  bufferTimer = setInterval(() => {
    if (bufferPercent.value < 100) {
      bufferPercent.value = Math.min(100, bufferPercent.value + Math.random() * 5)
    } else {
      stopBufferSim()
    }
  }, 800)
}

function stopBufferSim() {
  if (bufferTimer) {
    clearInterval(bufferTimer)
    bufferTimer = null
  }
}

function seekAudio(e) {
  const bar = e.currentTarget
  const rect = bar.getBoundingClientRect()
  const ratio = (e.clientX - rect.left) / rect.width
  currentTime.value = Math.floor(ratio * duration.value)
  progress.value = ratio * 100
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
.novel-online-page {
  padding: 40px 24px;
  max-width: 1000px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
  padding-bottom: 100px;

  // 当播放器面板出现时增加底部间距
  &:has(.player-panel) {
    padding-bottom: 540px;
  }
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

// ==================== PAGE HEADER ====================
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

// ==================== SEARCH ====================
.search-section { margin-bottom: 32px; }

.search-box {
  display: flex;
  align-items: center;
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 0 16px;
  height: 52px;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  &:focus-within { border-color: #6366f1; box-shadow: 0 4px 20px rgba(99,102,241,0.12); }
}

.search-icon { color: #94a3b8; margin-right: 10px; flex-shrink: 0; }

.search-input {
  flex: 1; border: none; outline: none; font-size: 15px; color: #0f172a; background: transparent;
  &::placeholder { color: #94a3b8; }
}
.clear-icon { color: #94a3b8; cursor: pointer; flex-shrink: 0; margin-right: 8px; &:hover { color: #64748b; } }

.search-btn {
  flex-shrink: 0;
  padding: 8px 20px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.category-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.tags-label { font-size: 13px; color: #94a3b8; font-weight: 500; white-space: nowrap; }
.tag-btn {
  padding: 5px 14px;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 20px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: #6366f1; color: #6366f1; background: #f0f0ff; }
  &.active { background: #6366f1; color: #fff; border-color: #6366f1; }
}

// ==================== LOADING / EMPTY ====================
.loading-area {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 60px 0; color: #6366f1; font-size: 15px;
}
.empty-area { padding: 60px 0; text-align: center;
  .empty-tip { font-size: 13px; color: #94a3b8; margin-top: 8px; display: block; }
}

// ==================== AUDIO CARD LIST ====================
.list-header { margin-bottom: 16px; }
.result-count { font-size: 14px; color: #64748b; font-weight: 500; }

.audio-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.audio-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  transition: all 0.25s;
  &:hover { border-color: #6366f1; box-shadow: 0 4px 16px rgba(99,102,241,0.08); transform: translateY(-1px); }
  &.playing { border-color: #6366f1; background: #f0f0ff; }
}

.card-cover {
  width: 80px;
  height: 80px;
  min-width: 80px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}
.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover-emoji { font-size: 36px; }

.play-btn {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.3);
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}
.card-cover:hover .play-btn { opacity: 1; }

.playing-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.3);
}

.playing-wave {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 24px;
  i {
    width: 3px;
    background: #fff;
    border-radius: 2px;
    animation: wave 1s ease-in-out infinite;
    &:nth-child(1) { height: 10px; }
    &:nth-child(2) { height: 20px; animation-delay: 0.1s; }
    &:nth-child(3) { height: 14px; animation-delay: 0.2s; }
    &:nth-child(4) { height: 24px; animation-delay: 0.3s; }
  }
}
@keyframes wave {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.4); }
}

.card-info {
  flex: 1;
  min-width: 0;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-author, .card-narrator {
  font-size: 13px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}
.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.meta-chapters { font-size: 12px; color: #64748b; }
.meta-rating { font-size: 12px; color: #f59e0b; font-weight: 600; }

.card-actions { flex-shrink: 0; }

// Recommend section
.recommend-section { margin-top: 8px; }
.section-title { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 20px; }

// ==================== PLAYER PANEL ====================
.player-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #0f172a;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -8px 40px rgba(0,0,0,0.25);
  display: flex;
  flex-direction: column;
  max-height: 520px;
  overflow: hidden;
  user-select: none;
}

// 拖拽手柄
.panel-handle {
  display: flex;
  justify-content: center;
  padding: 10px 0 6px;
  flex-shrink: 0;
}
.handle-bar {
  width: 36px;
  height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
}

// 播放主区域
.player-main {
  padding: 0 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

// 封面艺术
.player-artwork {
  width: 140px;
  height: 140px;
  margin-bottom: 18px;
  position: relative;

  &.spinning .artwork-bg {
    animation: artworkSpin 8s linear infinite;
  }
}

.artwork-bg {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  overflow: hidden;
}
.artwork-emoji {
  font-size: 56px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}
@keyframes artworkSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 进度环
.artwork-ring {
  position: absolute;
  inset: -6px;
  svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 0 4px rgba(255,255,255,0.3));
  }
}

// 曲目信息
.player-track-info {
  text-align: center;
  margin-bottom: 20px;
  width: 100%;
}
.track-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 8px;
}
.track-meta {
  font-size: 13px;
  color: rgba(255,255,255,0.55);
  margin-bottom: 8px;
  .meta-sep { margin: 0 2px; }
}
.track-tag {
  --el-tag-bg-color: rgba(255,255,255,0.1);
  --el-tag-border-color: rgba(255,255,255,0.15);
  --el-tag-text-color: rgba(255,255,255,0.65);
}

// 播放控制按钮
.player-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 18px;
}

.action-btn {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.55);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  &:hover { color: #fff; background: rgba(255,255,255,0.08); }
  &.active { color: #818cf8; }
  &.sm { padding: 6px; }
}

.action-btn .loop-icon {
  font-size: 16px;
  &.off { opacity: 0.35; }
}

.play-btn-main {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: #fff;
  color: #0f172a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(255,255,255,0.2);

  &:hover {
    transform: scale(1.06);
    box-shadow: 0 6px 30px rgba(255,255,255,0.3);
  }
  &:active { transform: scale(0.96); }

  &.playing {
    background: #818cf8;
    color: #fff;
    box-shadow: 0 4px 20px rgba(129,140,248,0.4);
    &:hover { box-shadow: 0 6px 30px rgba(129,140,248,0.5); }
  }
}

// 进度条
.player-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 400px;
}
.time-label {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  text-align: center;
  flex-shrink: 0;
}

.progress-track {
  flex: 1;
  height: 4px;
  background: rgba(255,255,255,0.12);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: height 0.2s;

  &:hover {
    height: 6px;
    .progress-thumb { opacity: 1; transform: scale(1); }
  }
}
.progress-buffered {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  transition: width 0.5s ease;
}
.progress-active {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  background: linear-gradient(90deg, #818cf8, #c084fc);
  border-radius: 4px;
  transition: width 0.3s linear;
}
.progress-thumb {
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%) scale(0);
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  opacity: 0;
  transition: all 0.2s;
}

// ==================== PLAYLIST SECTION ====================
.playlist-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.playlist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px 10px;
  flex-shrink: 0;
}
.playlist-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,0.75);
  display: flex;
  align-items: center;
  gap: 6px;
}
.playlist-indicator {
  font-size: 14px;
}
.playlist-mode {
  font-size: 11px;
  color: rgba(255,255,255,0.35);
  background: rgba(255,255,255,0.06);
  padding: 3px 10px;
  border-radius: 10px;
}

.playlist-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 12px;
  max-height: 220px;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255,255,255,0.05);
  }

  &.active {
    background: rgba(129,140,248,0.12);
    .pl-item-title, .pl-item-author { color: #c4b5fd; }
  }

  &.active.playing {
    background: rgba(129,140,248,0.18);
  }
}

.pl-item-num {
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}
.pl-num {
  font-size: 12px;
  color: rgba(255,255,255,0.3);
}
.pl-equalizer {
  display: flex;
  align-items: flex-end;
  gap: 1px;
  height: 14px;
  justify-content: center;
  i {
    width: 2px;
    background: #818cf8;
    border-radius: 1px;
    animation: eq 0.8s ease-in-out infinite;
    &:nth-child(1) { height: 8px; }
    &:nth-child(2) { height: 14px; animation-delay: 0.15s; }
    &:nth-child(3) { height: 10px; animation-delay: 0.3s; }
  }
}
@keyframes eq {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.3); }
}

.pl-cover-mini {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
}

.pl-item-info {
  flex: 1;
  min-width: 0;
}
.pl-item-title {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255,255,255,0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pl-item-author {
  display: block;
  font-size: 11px;
  color: rgba(255,255,255,0.35);
  margin-top: 1px;
}

.pl-item-chapters {
  font-size: 11px;
  color: rgba(255,255,255,0.3);
  flex-shrink: 0;
}

.pl-item-duration {
  font-size: 11px;
  color: rgba(255,255,255,0.3);
  flex-shrink: 0;
  min-width: 44px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

// 关闭按钮
.panel-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: rgba(255,255,255,0.06);
  border: none;
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
  &:hover {
    color: #fff;
    background: rgba(255,255,255,0.12);
  }
}

// 面板出入场动画
.player-panel-slide-enter-active {
  animation: panelSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.player-panel-slide-leave-active {
  animation: panelSlideIn 0.35s cubic-bezier(0.5, 0, 0.75, 0) reverse;
}
@keyframes panelSlideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

// ====== 深色模式 ======
:global(html.dark-mode .novel-online-page) {
    background: var(--bg-color, #0f0f1a);
    transition: background 0.4s ease;

    // ======== 页头 ========
    .page-header {
      .back-btn {
        color: var(--text-secondary, #94a3b8);
        &:hover { color: var(--text-primary, #e2dee9); }
      }
    }
    .page-title { color: var(--heading-color, #e2dee9); }
    .page-desc { color: var(--muted-color-light, #64748b); }

    // ======== 搜索框 ========
    .search-box {
      background: var(--surface-hover-bg, #252540);
      border-color: var(--border-color, #2d2d4a);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      &:focus-within {
        border-color: var(--primary-color, #a78bfa);
        box-shadow: 0 4px 20px rgba(124, 58, 237, 0.15);
      }
    }
    .search-icon { color: var(--text-secondary, #6b7280); }
    .search-input {
      color: var(--text-primary, #e2dee9);
      &::placeholder { color: #4b5563; }
    }
    .clear-icon {
      color: var(--text-secondary, #6b7280);
      &:hover { color: var(--text-regular, #cbd5e1); }
    }
    .search-btn {
      background: linear-gradient(135deg, #7c3aed, #a78bfa);
      &:hover:not(:disabled) {
        box-shadow: 0 4px 16px rgba(124, 58, 237, 0.35);
      }
      &:disabled { opacity: 0.3; }
    }

    // ======== 分类标签 ========
    .tags-label { color: var(--text-secondary, #6b7280); }
    .tag-btn {
      background: var(--bg-white, #1a1a2e);
      border-color: var(--border-color, #2d2d4a);
      color: var(--text-regular, #94a3b8);
      &:hover {
        border-color: var(--primary-color, #a78bfa);
        color: var(--primary-color, #a78bfa);
        background: rgba(124, 58, 237, 0.1);
      }
      &.active {
        background: var(--primary-color, #7c3aed);
        color: #fff;
        border-color: var(--primary-color, #7c3aed);
      }
    }

    // ======== 加载区域 ========
    .loading-area {
      color: var(--primary-color, #a78bfa);
    }

    // ======== 空状态 ========
    .empty-area {
      .empty-tip { color: var(--text-secondary, #6b7280); }
    }

    // ======== 结果计数 ========
    .list-header .result-count { color: var(--text-regular, #94a3b8); }

    // ======== 音频卡片 ========
    .audio-card {
      background: var(--bg-white, #1a1a2e);
      border-color: var(--border-color, #2d2d4a);
      box-shadow: none;
      transition: all 0.25s ease, background 0.4s ease, border-color 0.4s ease;
      &:hover {
        border-color: var(--primary-color, #a78bfa);
        box-shadow: 0 4px 20px rgba(124, 58, 237, 0.15);
        transform: translateY(-1px);
      }
      &.playing {
        border-color: var(--primary-color, #a78bfa);
        background: rgba(124, 58, 237, 0.08);
        box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.1);
      }
    }
    .card-cover {
      .cover-placeholder { background: linear-gradient(135deg, #2d2d4a, #3a3a5a); }
    }
    .play-btn {
      background: rgba(0, 0, 0, 0.45);
    }
    .card-title { color: var(--heading-color, #e2dee9); }
    .card-author, .card-narrator { color: var(--text-secondary, #6b7280); }
    .meta-chapters { color: var(--text-regular, #94a3b8); }
    .meta-rating { color: #fbbf24; }

    // ======== 推荐区域 ========
    .recommend-section .section-title { color: var(--heading-color, #e2dee9); }

    // ======== 播放器面板 ========
    .player-panel {
      background: #0a0a14;
      box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.5);
    }
    .panel-handle .handle-bar {
      background: rgba(255, 255, 255, 0.12);
    }
    .player-main {
      // 封面
      .artwork-bg { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5); }
      .artwork-ring svg { filter: drop-shadow(0 0 6px rgba(167, 139, 250, 0.2)); }
      // 曲目信息
      .track-title { color: rgba(255, 255, 255, 0.92); }
      .track-meta { color: rgba(255, 255, 255, 0.4); }
      .track-tag {
        --el-tag-bg-color: rgba(255, 255, 255, 0.06);
        --el-tag-border-color: rgba(255, 255, 255, 0.08);
        --el-tag-text-color: rgba(255, 255, 255, 0.5);
      }
    }
    // 播放控制按钮
    .action-btn {
      color: rgba(255, 255, 255, 0.4);
      &:hover { color: rgba(255, 255, 255, 0.85); background: rgba(255, 255, 255, 0.06); }
      &.active { color: var(--primary-color, #a78bfa); }
      .loop-icon.off { opacity: 0.25; }
    }
    .play-btn-main {
      background: rgba(255, 255, 255, 0.92);
      color: #0a0a14;
      box-shadow: 0 4px 20px rgba(167, 139, 250, 0.15);
      &:hover {
        box-shadow: 0 6px 30px rgba(167, 139, 250, 0.25);
      }
      &.playing {
        background: var(--primary-color, #a78bfa);
        color: #fff;
        box-shadow: 0 4px 24px rgba(167, 139, 250, 0.35);
        &:hover { box-shadow: 0 6px 32px rgba(167, 139, 250, 0.45); }
      }
    }
    // 进度条
    .progress-track { background: rgba(255, 255, 255, 0.06); }
    .progress-buffered { background: rgba(255, 255, 255, 0.06); }
    .progress-active { background: linear-gradient(90deg, var(--primary-color, #a78bfa), #c084fc); }
    .progress-thumb {
      background: #e2dee9;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }
    .time-label { color: rgba(255, 255, 255, 0.3); }

    // 播放列表区域
    .playlist-section { border-top-color: rgba(255, 255, 255, 0.04); }
    .playlist-title { color: rgba(255, 255, 255, 0.6); }
    .playlist-mode {
      color: rgba(255, 255, 255, 0.25);
      background: rgba(255, 255, 255, 0.04);
    }
    .playlist-scroll {
      &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.06); }
    }
    .playlist-item {
      &:hover { background: rgba(255, 255, 255, 0.03); }
      &.active {
        background: rgba(167, 139, 250, 0.1);
        .pl-item-title { color: #c4b5fd; }
        .pl-item-author { color: rgba(196, 181, 253, 0.6); }
      }
      &.active.playing { background: rgba(167, 139, 250, 0.15); }
    }
    .pl-num { color: rgba(255, 255, 255, 0.2); }
    .pl-equalizer i { background: var(--primary-color, #a78bfa); }
    .pl-cover-mini {
      background: rgba(255, 255, 255, 0.04);
    }
    .pl-item-title { color: rgba(255, 255, 255, 0.7); }
    .pl-item-author { color: rgba(255, 255, 255, 0.25); }
    .pl-item-chapters, .pl-item-duration { color: rgba(255, 255, 255, 0.22); }

    // 播放器关闭按钮
    .panel-close {
      background: rgba(255, 255, 255, 0.04);
      color: rgba(255, 255, 255, 0.3);
      &:hover {
        color: rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.08);
      }
    }
}

// ==================== RESPONSIVE ====================
@media (max-width: 768px) {
  .novel-online-page {
    padding: 24px 16px;
    &:has(.player-panel) { padding-bottom: 500px; }
  }
  .page-title { font-size: 28px; }
  .audio-card { padding: 12px; gap: 12px; }
  .card-cover { width: 64px; height: 64px; min-width: 64px; }

  .player-main { padding: 0 16px 16px; }
  .player-artwork { width: 120px; height: 120px; margin-bottom: 14px; }
  .artwork-emoji { font-size: 44px; }
  .play-btn-main { width: 48px; height: 48px; }
  .player-actions { gap: 14px; }

  .playlist-header { padding: 12px 16px 8px; }
  .playlist-scroll { padding: 0 8px 10px; max-height: 180px; }
}

@media (max-width: 480px) {
  .player-panel {
    border-radius: 20px 20px 0 0;
    max-height: 460px;
  }
  .player-progress { max-width: 100%; }
  .player-artwork { width: 100px; height: 100px; margin-bottom: 12px; }
  .artwork-emoji { font-size: 36px; }
  .artwork-ring { inset: -4px; }
  .track-title { font-size: 16px; }
  .player-actions { gap: 10px; }
  .playlist-scroll { max-height: 150px; }
}
</style>

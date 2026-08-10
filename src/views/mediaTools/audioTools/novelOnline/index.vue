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

<style lang="scss" scoped src="./index.scss"></style>

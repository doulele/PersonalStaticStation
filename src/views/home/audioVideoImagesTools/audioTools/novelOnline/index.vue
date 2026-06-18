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

    <!-- 底部播放器 -->
    <transition name="player-slide">
      <div v-if="currentPlaying !== null && currentAudio" class="player-bar">
        <div class="player-info">
          <div class="player-cover">
            <span class="mini-emoji">{{ currentAudio.emoji || '📖' }}</span>
          </div>
          <div class="player-text">
            <span class="player-title">{{ currentAudio.title }}</span>
            <span class="player-author">{{ currentAudio.author }}</span>
          </div>
        </div>
        <div class="player-controls">
          <el-button :icon="VideoPlay" circle text @click="togglePlay" />
          <div class="progress-bar" @click="seekAudio">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <span class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
          <el-button :icon="Close" circle text @click="stopAudio" />
        </div>
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
let progressTimer = null

const categories = ['玄幻', '都市', '言情', '悬疑', '武侠', '科幻', '历史', '儿童']

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
  if (searched.value && audioList.value.length) {
    return audioList.value[currentPlaying.value] || null
  }
  return hotAudios[currentPlaying.value] || null
})

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
  stopAudio()
  currentPlaying.value = index
  startPlay()
}

function playHotAudio(index) {
  searched.value = true
  audioList.value = [...hotAudios]
  playAudio(index)
}

function startPlay() {
  isPlaying.value = true
  duration.value = 3600 // mock 1小时
  currentTime.value = 0
  progress.value = 0
  startProgress()
}

function togglePlay() {
  if (currentPlaying.value === null) return
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    startProgress()
  } else {
    stopProgress()
  }
}

function stopAudio() {
  isPlaying.value = false
  currentPlaying.value = null
  currentTime.value = 0
  progress.value = 0
  duration.value = 0
  stopProgress()
}

function startProgress() {
  stopProgress()
  progressTimer = setInterval(() => {
    if (currentTime.value >= duration.value) {
      stopAudio()
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

// Search
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

// Loading
.loading-area {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 60px 0; color: #6366f1; font-size: 15px;
}

// Audio list
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

// Empty
.empty-area { padding: 60px 0; text-align: center;
  .empty-tip { font-size: 13px; color: #94a3b8; margin-top: 8px; display: block; }
}

// Recommend section
.recommend-section { margin-top: 8px; }
.section-title { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 20px; }

// Player bar
.player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 100;
}
.player-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.player-cover {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  .mini-emoji { font-size: 22px; }
}
.player-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.player-title { font-size: 14px; font-weight: 600; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.player-author { font-size: 12px; color: #94a3b8; }

.player-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 500px;
  margin-left: 40px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
  &:hover { height: 6px; }
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #a855f7);
  border-radius: 2px;
  transition: width 0.3s linear;
}
.time-display { font-size: 12px; color: #94a3b8; font-variant-numeric: tabular-nums; white-space: nowrap; }

.player-slide-enter-active { animation: slideUp 0.3s ease-out; }
.player-slide-leave-active { animation: slideUp 0.3s ease-in reverse; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

// Responsive
@media (max-width: 768px) {
  .novel-online-page { padding: 24px 16px; padding-bottom: 100px; }
  .page-title { font-size: 28px; }
  .audio-card { padding: 12px; gap: 12px; }
  .card-cover { width: 64px; height: 64px; min-width: 64px; }
  .player-bar { padding: 0 16px; }
  .player-controls { margin-left: 16px; gap: 8px; }
}

@media (max-width: 480px) {
  .player-bar { flex-direction: column; height: auto; padding: 12px 16px; gap: 8px; }
  .player-controls { margin-left: 0; max-width: 100%; }
  .player-info { width: 100%; }
  .player-text { flex: 1; }
}
</style>

<template>
  <el-dialog
    :model-value="visible" @update:model-value="(val) => emit('update:visible', val)"
    title="发布树洞"
    width="480px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="mood-post">
      <!-- 输入框区域 -->
      <div class="input-wrapper">
        <el-input
          v-model="content"
          type="textarea"
          :rows="5"
          placeholder="此刻，你想说什么？..."
          maxlength="500"
          show-word-limit
          resize="none"
        />
        <!-- 打字粒子 -->
        <span
          v-for="p in typeParticles"
          :key="p.id"
          class="type-particle"
          :style="p.style"
        >{{ p.char }}</span>
      </div>

      <!-- 字数进度条 -->
      <div class="char-progress-bar">
        <div class="char-progress-fill" :style="{ width: charPercent + '%' }" :class="charProgressClass"></div>
      </div>

      <div class="mood-options">
        <!-- 心情天气 -->
        <div class="option-row">
          <span class="option-label">心情天气</span>
          <div class="weather-options">
            <span
              v-for="w in weathers"
              :key="w.value"
              class="weather-item"
              :class="{ active: weather === w.value, bounce: bouncingWeather === w.value }"
              @click="selectWeather(w.value)"
              :title="w.label"
            >
              {{ w.emoji }}
              <!-- 选中粒子 -->
              <span v-if="weather === w.value" class="weather-sparkle">
                <span v-for="s in 4" :key="s" class="sparkle-dot" :style="{ '--sd': s }"></span>
              </span>
            </span>
          </div>
        </div>

        <!-- 关联愿望 -->
        <div class="option-row">
          <span class="option-label">关联愿望（可选）</span>
          <el-select v-model="selectedWish" filterable placeholder="选择愿望" size="small" clearable style="width: 200px;">
            <el-option
              v-for="w in activeWishes"
              :key="w.id"
              :label="w.title"
              :value="w.id"
            />
          </el-select>
        </div>

        <!-- 匿名切换 -->
        <div class="option-row">
          <div class="anonymous-switch-wrap" @click="toggleAnonymous">
            <div class="anonymous-track" :class="{ on: anonymous }">
              <div class="anonymous-thumb" :class="{ on: anonymous }">
                <span class="thumb-icon" :class="{ spin: thumbSpinning }">{{ anonymous ? '🦊' : '👤' }}</span>
              </div>
            </div>
            <span class="anonymous-label" :class="{ active: anonymous }">{{ anonymous ? '匿名发布' : '实名发布' }}</span>
            <span v-if="anonymous" class="mask-animals">
              <span class="animal-float" v-for="(a, i) in animals" :key="i" :style="{ animationDelay: i * 0.3 + 's' }">{{ a }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button
        type="success"
        :loading="posting"
        @click="handlePost"
        :disabled="!content.trim()"
        class="post-btn"
        ref="postBtnRef"
      >
        <span class="post-btn-text">发布树洞</span>
        <!-- 涟漪 -->
        <span v-for="r in ripples" :key="r.id" class="ripple-ring" :style="r.style"></span>
      </el-button>
    </template>

    <!-- 发布成功庆祝效果 -->
    <Teleport to="body">
      <div v-if="celebrating" class="celebrate-overlay">
        <span
          v-for="c in celebrateItems"
          :key="c.id"
          class="celebrate-item"
          :style="c.style"
        >{{ c.emoji }}</span>
      </div>
    </Teleport>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['update:visible', 'posted'])
const store = useStore()

const content = ref('')
const anonymous = ref(true)
const weather = ref('')
const selectedWish = ref(null)
const posting = ref(false)
const postBtnRef = ref(null)

// ==================== 互动状态 ====================
const ripples = ref([])
const bouncingWeather = ref('')
const thumbSpinning = ref(false)
const celebrating = ref(false)
const celebrateItems = ref([])
const typeParticles = ref([])
let typeParticleId = 0

const activeWishes = computed(() => store.getters['wishTreeHole/activeWishes'])

const weathers = [
  { emoji: '☀️', label: '晴天/积极', value: '☀️ 积极' },
  { emoji: '☁️', label: '多云/平静', value: '☁️ 平静' },
  { emoji: '🌧️', label: '雨天/沮丧', value: '🌧️ 沮丧' },
  { emoji: '⛈️', label: '雷电/焦虑', value: '⛈️ 焦虑' }
]

const animals = ['🦊', '🐱', '🐰', '🐻', '🐼']

// 字数百分比
const charPercent = computed(() => {
  const len = content.value.length
  return Math.min((len / 500) * 100, 100)
})

// 进度条样式类
const charProgressClass = computed(() => {
  const p = charPercent.value
  if (p >= 90) return 'near-limit'
  if (p >= 70) return 'warning'
  return ''
})

// ==================== 心情天气选择 ====================
function selectWeather(value) {
  if (weather.value === value) {
    weather.value = ''
    return
  }
  weather.value = value
  bouncingWeather.value = value
  setTimeout(() => { bouncingWeather.value = '' }, 600)
}

// ==================== 匿名切换 ====================
function toggleAnonymous() {
  anonymous.value = !anonymous.value
  thumbSpinning.value = true
  setTimeout(() => { thumbSpinning.value = false }, 500)
}

// ==================== 打字粒子效果 ====================
const particleChars = ['✨', '💫', '⭐', '🌟', '💖', '🌸', '🍃', '🕊️']
let particleTimer = null

watch(content, (newVal, oldVal) => {
  if (newVal.length > oldVal.length && newVal.length % 3 === 0) {
    const id = ++typeParticleId
    const char = particleChars[Math.floor(Math.random() * particleChars.length)]
    const x = 50 + (Math.random() - 0.5) * 60
    const y = 20 + Math.random() * 30
    typeParticles.value.push({
      id,
      char,
      style: {
        left: x + '%',
        top: y + '%',
        '--tx': ((Math.random() - 0.5) * 40) + 'px',
        '--ty': (-30 - Math.random() * 30) + 'px',
        '--rot': ((Math.random() - 0.5) * 360) + 'deg'
      }
    })
    setTimeout(() => {
      typeParticles.value = typeParticles.value.filter(p => p.id !== id)
    }, 800)
  }
})

// ==================== 发布按钮涟漪 ====================
function addRipple(e) {
  if (!postBtnRef.value) return
  const btn = postBtnRef.value.$el || postBtnRef.value
  const rect = btn.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = e.clientX - rect.left - size / 2
  const y = e.clientY - rect.top - size / 2
  const id = Date.now()
  ripples.value.push({
    id,
    style: {
      width: size + 'px',
      height: size + 'px',
      left: x + 'px',
      top: y + 'px'
    }
  })
  setTimeout(() => {
    ripples.value = ripples.value.filter(r => r.id !== id)
  }, 800)
}

// ==================== 庆祝效果 ====================
function triggerCelebrate() {
  celebrating.value = true
  const emojis = ['🎉', '✨', '🌟', '💫', '🎊', '🎈', '🥳', '💖', '🌈', '🦊', '🐱', '🎀']
  const items = []
  for (let i = 0; i < 30; i++) {
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
    const startX = 50 + (Math.random() - 0.5) * 20
    items.push({
      id: i,
      emoji,
      style: {
        left: startX + '%',
        '--cx': ((Math.random() - 0.5) * 80) + 'vw',
        '--cy': (-30 - Math.random() * 50) + 'vh',
        '--rot': ((Math.random() - 0.5) * 720) + 'deg',
        '--delay': (Math.random() * 0.3) + 's',
        '--dur': (1.5 + Math.random() * 1.5) + 's',
        fontSize: (16 + Math.random() * 20) + 'px'
      }
    })
  }
  celebrateItems.value = items
  setTimeout(() => {
    celebrating.value = false
    celebrateItems.value = []
  }, 3000)
}

// ==================== 发布处理 ====================
async function handlePost(e) {
  if (!content.value.trim()) return
  addRipple(e)
  posting.value = true
  try {
    const res = await store.dispatch('wishTreeHole/postMood', {
      content: content.value.trim(),
      isAnonymous: anonymous.value,
      wishId: selectedWish.value || null,
      moodWeather: weather.value
    })
    if (res.success) {
      triggerCelebrate()
      ElMessage.success('树洞已发布')
      content.value = ''
      weather.value = ''
      selectedWish.value = null
      emit('posted')
    } else {
      ElMessage.error(res.error || '发布失败')
    }
  } catch (e) {
    ElMessage.error('发布失败')
  } finally {
    posting.value = false
  }
}

watch(() => props.visible, (v) => {
  if (!v) { content.value = ''; weather.value = ''; selectedWish.value = null }
})
</script>

<style lang="scss" scoped>
// ==================== 发布按钮 ====================
.post-btn {
  position: relative;
  overflow: hidden;
}

.post-btn-text {
  position: relative;
  z-index: 1;
}

// 涟漪
.ripple-ring {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  animation: rippleExpand 0.8s ease-out forwards;
  pointer-events: none;
}

@keyframes rippleExpand {
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(4); opacity: 0; }
}

// ==================== 输入框区域 ====================
.input-wrapper {
  position: relative;
}

// 打字粒子
.type-particle {
  position: absolute;
  pointer-events: none;
  z-index: 10;
  font-size: 16px;
  animation: typeParticleFloat 0.8s ease-out forwards;
}

@keyframes typeParticleFloat {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(0.5) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translate(var(--tx), var(--ty)) scale(1.2) rotate(var(--rot));
  }
}

// ==================== 字数进度条 ====================
.char-progress-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.char-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 2px;
  transition: width 0.3s ease, background 0.3s ease;

  &.warning {
    background: linear-gradient(90deg, #f59e0b, #f97316);
  }
  &.near-limit {
    background: linear-gradient(90deg, #ef4444, #dc2626);
    animation: progressPulse 0.8s ease-in-out infinite;
  }
}

@keyframes progressPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

// ==================== 主容器 ====================
.mood-post {
  display: flex;
  flex-direction: column;
  gap: 16px;

  :deep(.el-textarea__inner) {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    color: #0f172a;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      border-color: #6366f1;
    }

    &:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    &::placeholder {
      color: #94a3b8;
    }
  }
}

.mood-options {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-label {
  font-size: 13px;
  color: #64748b;
  min-width: 110px;
}

// ==================== 心情天气 ====================
.weather-options {
  display: flex;
  gap: 8px;
}

.weather-item {
  font-size: 24px;
  cursor: pointer;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
    transform: translateY(-2px);
  }

  &.active {
    border-color: #6366f1;
    background: #eef2ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.12);
  }

  &.bounce {
    animation: weatherBounce 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  }
}

@keyframes weatherBounce {
  0% { transform: scale(1); }
  30% { transform: scale(1.35); }
  50% { transform: scale(0.9); }
  70% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

// 选中粒子
.weather-sparkle {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sparkle-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #6366f1;
  animation: sparkleBurst 1.2s ease-out infinite;
  animation-delay: calc(var(--sd) * 0.25s);
}

@keyframes sparkleBurst {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(-50% + (var(--sd) - 2.5) * 14px),
      calc(-50% + (var(--sd) - 2.5) * 14px)
    ) scale(1);
    opacity: 0;
  }
}

// ==================== 匿名切换 ====================
.anonymous-switch-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.anonymous-track {
  width: 52px;
  height: 28px;
  border-radius: 14px;
  background: #e2e8f0;
  transition: background 0.4s ease;
  position: relative;
  flex-shrink: 0;

  &.on {
    background: #6366f1;
  }
}

.anonymous-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55), background 0.4s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);

  &.on {
    left: 27px;
  }
}

.thumb-icon {
  font-size: 12px;
  transition: transform 0.3s ease;

  &.spin {
    animation: thumbSpin 0.5s ease-in-out;
  }
}

@keyframes thumbSpin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.4); }
  100% { transform: rotate(360deg) scale(1); }
}

.anonymous-label {
  font-size: 13px;
  color: #94a3b8;
  transition: color 0.3s ease;

  &.active {
    color: #6366f1;
    font-weight: 600;
  }
}

// 匿名时动物漂浮
.mask-animals {
  display: flex;
  gap: 2px;
}

.animal-float {
  font-size: 12px;
  animation: animalFloat 2.4s ease-in-out infinite;
  opacity: 0.5;
}

@keyframes animalFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-4px) rotate(5deg); }
  75% { transform: translateY(2px) rotate(-5deg); }
}

.mask-preview {
  font-size: 12px;
  color: #94a3b8;
}

// ==================== 庆祝效果 ====================
.celebrate-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  pointer-events: none;
}

.celebrate-item {
  position: absolute;
  top: 50%;
  pointer-events: none;
  animation: celebratePop var(--dur) ease-out forwards;
  animation-delay: var(--delay);
}

@keyframes celebratePop {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translate(calc(var(--cx) - 50%), calc(var(--cy) - 50%)) scale(1.2) rotate(var(--rot));
    opacity: 0;
  }
}

// ==================== 移动端 ====================
@media (max-width: 768px) {
  .option-row {
    flex-wrap: wrap;
    gap: 8px;
  }
  .option-label { min-width: auto; font-size: 12px; }
  .weather-item { font-size: 20px; padding: 6px 10px; }
  .anonymous-switch-wrap { gap: 6px; }
  .anonymous-label { font-size: 12px; }
  .celebrate-item { font-size: 14px !important; }
}
</style>

<style lang="scss">
html.dark-mode {
  .mood-post {
    :deep(.el-textarea__inner) {
      background: #1e1e2e;
      border-color: #2d2d4a;
      color: #e2dee9;

      &:hover, &:focus {
        border-color: #a78bfa;
      }

      &::placeholder {
        color: #64748b;
      }
    }
  }

  .char-progress-bar {
    background: #2d2d4a;
  }

  .weather-item {
    background: #1e1e2e;
    border-color: #2d2d4a;
    &:hover { border-color: #a78bfa; background: #252540; box-shadow: 0 4px 16px rgba(167, 139, 250, 0.08); transform: translateY(-2px); }
    &.active { border-color: #a78bfa; background: #252540; }
  }

  .sparkle-dot {
    background: #a78bfa;
  }

  .anonymous-track {
    background: #2d2d4a;
    &.on { background: #a78bfa; }
  }

  .anonymous-thumb {
    background: #e2dee9;
  }

  .mask-preview { color: #64748b; }
  .el-switch__label { color: #94a3b8; }
}
</style>

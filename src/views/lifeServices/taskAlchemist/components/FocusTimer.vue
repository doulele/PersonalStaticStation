<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="炼金专注"
    :width="isMobile ? '92vw' : '480px'"
    :close-on-click-modal="false"
    :show-close="false"
    class="focus-dialog"
  >
    <div v-if="session" class="focus-container">
      <!-- 任务信息 -->
      <div class="focus-task-info">
        <span class="focus-task-energy" :class="session.energy">
          {{ session.energy === 'high' ? '⚡' : '🍃' }}
        </span>
        <div>
          <h3 class="focus-task-title">{{ session.taskTitle }}</h3>
          <p class="focus-task-meta">
            预估 {{ session.duration }} 分钟
            <span class="focus-audio-label">🎵 {{ audioLabel }}</span>
          </p>
        </div>
      </div>

      <!-- 倒计时圆环 -->
      <div class="focus-timer-ring">
        <svg class="timer-svg" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#e2e8f0" stroke-width="6" />
          <circle
            cx="100" cy="100" r="90"
            fill="none"
            :stroke="timerColor"
            stroke-width="6"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 100 100)"
            class="timer-progress"
          />
        </svg>
        <div class="timer-center">
          <span class="timer-display">{{ formatTime(timeLeft) }}</span>
          <span class="timer-label">{{ isRunning ? '专注中...' : isPaused ? '已暂停' : '准备开始' }}</span>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="focus-controls">
        <el-button v-if="!isRunning && !isPaused" type="primary" size="large" @click="startTimer" class="start-btn">
          开始炼化
        </el-button>
        <template v-else>
          <el-button v-if="!isPaused" size="large" @click="pauseTimer" class="control-btn">
            <el-icon><VideoPause /></el-icon> 暂停
          </el-button>
          <el-button v-else size="large" type="primary" @click="resumeTimer" class="control-btn">
            <el-icon><VideoPlay /></el-icon> 继续
          </el-button>
          <el-button size="large" type="success" @click="completeEarly" class="control-btn">
            <el-icon><Check /></el-icon> 提前完成
          </el-button>
        </template>
        <el-button size="large" @click="handleCancel" class="cancel-btn">放弃</el-button>
      </div>

      <!-- 白噪音选择 -->
      <div class="audio-selector">
        <span class="audio-label-text">背景音：</span>
        <div class="audio-options">
          <div
            v-for="audio in audioOptions"
            :key="audio.key"
            class="audio-chip"
            :class="{ active: selectedAudio === audio.key }"
            @click="selectedAudio = audio.key"
          >
            {{ audio.icon }} {{ audio.name }}
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPause, VideoPlay, Check } from '@element-plus/icons-vue'

const isMobile = ref(window.innerWidth < 768)
function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const props = defineProps({
  visible: { type: Boolean, default: false },
  session: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'complete', 'cancel'])

// 计时器
const totalSeconds = ref(0)
const timeLeft = ref(0)
const isRunning = ref(false)
const isPaused = ref(false)
const startTime = ref(null)
let timerInterval = null

const circumference = 2 * Math.PI * 90
const dashOffset = computed(() => {
  if (totalSeconds.value === 0) return 0
  const progress = timeLeft.value / totalSeconds.value
  return circumference * (1 - progress)
})

const timerColor = computed(() => {
  if (isPaused.value) return '#94a3b8'
  if (props.session?.energy === 'high') return '#ef4444'
  return '#16a34a'
})

// 白噪音 - 使用 Web Audio API 生成真实音频
const selectedAudio = ref('none')
let audioContext = null
let noiseNode = null
let noiseGain = null

const audioOptions = computed(() => {
  // 高能耗 → 暴雨声 / 图书馆白噪音
  // 低能耗 → 咖啡馆喧闹声 / 森林鸟鸣
  return [
    { key: 'none', name: '无', icon: '🔇' },
    { key: 'rain', name: '暴雨声', icon: '🌧️' },
    { key: 'library', name: '图书馆', icon: '📚' },
    { key: 'cafe', name: '咖啡馆', icon: '☕' },
    { key: 'forest', name: '森林鸟鸣', icon: '🌲' }
  ]
})

const audioLabel = computed(() => {
  const found = audioOptions.value.find(a => a.key === selectedAudio.value)
  return found ? found.name : '无'
})

function startNoise(type) {
  stopNoise()
  if (type === 'none') return
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const bufferSize = 2 * audioContext.sampleRate
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    switch (type) {
      case 'rain':
        // 棕色噪音（模拟暴雨声）
        let lastOut = 0
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1
          data[i] = (lastOut + 0.02 * white) / 1.02
          lastOut = data[i]
          data[i] *= 3.5
        }
        break
      case 'library':
        // 图书馆白噪音（轻柔均匀）
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.12
        }
        break
      case 'cafe':
        // 咖啡馆喧闹声（随机人声片段 + 背景噪音）
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.18
          // 每隔0.3秒模拟远处人声
          if (i % Math.floor(audioContext.sampleRate * 0.3) === 0) {
            data[i] += (Math.random() * 2 - 1) * 0.12
          }
        }
        break
      case 'forest':
        // 森林鸟鸣（低频自然噪音 + 随机高频鸟叫）
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.08
          // 每隔0.8~1.5秒模拟一声鸟叫
          if (i % Math.floor(audioContext.sampleRate * (0.8 + Math.random() * 0.7)) < audioContext.sampleRate * 0.05) {
            const freq = 2000 + Math.random() * 3000
            const t = (i % Math.floor(audioContext.sampleRate * 0.05)) / audioContext.sampleRate
            data[i] += Math.sin(2 * Math.PI * freq * t) * 0.25 * Math.exp(-t * 20)
          }
        }
        break
      default:
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.1
    }

    noiseNode = audioContext.createBufferSource()
    noiseNode.buffer = buffer
    noiseNode.loop = true
    noiseGain = audioContext.createGain()
    noiseGain.gain.value = 0.3
    noiseNode.connect(noiseGain)
    noiseGain.connect(audioContext.destination)
    noiseNode.start()
  } catch (e) {
    console.warn('白噪音初始化失败:', e.message)
  }
}

function stopNoise() {
  try {
    if (noiseNode) { noiseNode.stop(); noiseNode.disconnect(); noiseNode = null }
    if (noiseGain) { noiseGain.disconnect(); noiseGain = null }
    if (audioContext) { audioContext.close(); audioContext = null }
  } catch { }
}

// 切换白噪音时实时生效
watch(selectedAudio, (val) => {
  if (isRunning.value && !isPaused.value) {
    startNoise(val)
  }
})

watch(() => props.visible, (v) => {
  if (v && props.session) {
    totalSeconds.value = (props.session.duration || 25) * 60
    timeLeft.value = totalSeconds.value
    isRunning.value = false
    isPaused.value = false
    selectedAudio.value = props.session.energy === 'high' ? 'rain' : 'forest'
  }
  if (!v) {
    clearInterval(timerInterval)
    timerInterval = null
    stopNoise()
  }
})

function startTimer() {
  isRunning.value = true
  startTime.value = Date.now()
  startNoise(selectedAudio.value)
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    }
    if (timeLeft.value <= 0) {
      handleComplete()
    }
  }, 1000)
}

function pauseTimer() {
  isPaused.value = true
  clearInterval(timerInterval)
  timerInterval = null
  stopNoise()
}

function resumeTimer() {
  isPaused.value = false
  startNoise(selectedAudio.value)
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    }
    if (timeLeft.value <= 0) {
      handleComplete()
    }
  }, 1000)
}

function handleComplete() {
  clearInterval(timerInterval)
  timerInterval = null
  isRunning.value = false
  stopNoise()
  const elapsed = Math.round((totalSeconds.value - timeLeft.value) / 60)
  const actualMinutes = elapsed || 1
  emit('complete', actualMinutes)
}

async function completeEarly() {
  clearInterval(timerInterval)
  timerInterval = null
  stopNoise()
  try {
    await ElMessageBox.confirm('确定提前完成专注吗？', '确认', {
      confirmButtonText: '是的，已完成',
      cancelButtonText: '继续专注',
      type: 'info'
    })
    const elapsed = Math.round((totalSeconds.value - timeLeft.value) / 60)
    const actualMinutes = elapsed || 1
    emit('complete', actualMinutes)
  } catch { /* 继续 */ }
}

async function handleCancel() {
  if (isRunning.value && timeLeft.value < totalSeconds.value) {
    try {
      await ElMessageBox.confirm('放弃当前专注进度？', '确认', {
        confirmButtonText: '放弃',
        cancelButtonText: '继续',
        type: 'warning'
      })
    } catch { return }
  }
  clearInterval(timerInterval)
  timerInterval = null
  emit('cancel')
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

onUnmounted(() => {
  clearInterval(timerInterval)
  stopNoise()
})
</script>

<style lang="scss" scoped src="./FocusTimer.scss"></style>

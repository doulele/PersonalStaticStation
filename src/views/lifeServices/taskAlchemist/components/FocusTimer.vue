<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="炼金专注"
    :width="isMobile ? '92vw' : '480px'"
    :close-on-click-modal="false"
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
      <div class="focus-timer-ring" :class="{ 'timer-ring-finished': timerFinished }">
        <svg class="timer-svg" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#e2e8f0" stroke-width="6" class="timer-bg-circle" />
          <circle
            cx="100" cy="100" r="90"
            fill="none"
            :stroke="timerFinished ? '#16a34a' : timerColor"
            stroke-width="6"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 100 100)"
            class="timer-progress"
          />
        </svg>
        <div class="timer-center">
          <span class="timer-display" :class="{ 'timer-done': timerFinished }">
            {{ timerFinished ? '完成' : formatTime(timeLeft) }}
          </span>
          <span class="timer-label">
            {{ timerFinished ? '专注结束，干得漂亮' : isRunning ? '专注中...' : isPaused ? '已暂停' : '准备开始' }}
          </span>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="focus-controls">
        <el-button v-if="!isRunning && !isPaused" type="primary" size="large" @click="startTimer" class="start-btn">
          开始
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
        <!-- <span class="audio-label-text">背景音：</span> -->
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

// ============ 时间戳计时器（解决锁屏/后台停止问题） ============
// 核心思路：不依赖 setInterval 递减计数，而是每次 tick 都根据 Date.now() 计算真实剩余时间
const totalSeconds = ref(0)
const timeLeft = ref(0)
const isRunning = ref(false)
const isPaused = ref(false)
const timerFinished = ref(false)  // 计时完成状态（显示完成动画）
let animationId = null
let tickStartTime = 0  // 本轮开始时间戳
let elapsedBeforePause = 0  // 暂停时已消耗秒数
let completeTimer = null  // 完成后的延迟关闭定时器

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

// ============ 白噪音（真实音频，复用后端白噪音文件） ============
const selectedAudio = ref('none')
let bgAudio = null  // 背景音 <audio> 元素
let completionSoundCtx = null  // 提示音专用 AudioContext

// 后端白噪音音频基础路径
const WHITENOISE_FILE_BASE = '/staticTool/api/family/whitenoise/file'

// 专注页背景音 → 服务器白噪音文件名映射
const NOISE_FILE_MAP = {
  rain: '雷暴.mp3',       // 暴雨声
  library: '树叶沙沙.mp3', // 图书馆（安静环境音）
  cafe: '咖啡馆.mp3',      // 咖啡馆
  forest: '森林鸟鸣.mp3'   // 森林鸟鸣
}

const audioOptions = computed(() => {
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

// 播放令牌：防止快速切换时旧的 play() 请求与新的 pause() 竞争
let noiseToken = 0

function startNoise(type) {
  stopNoise()
  if (type === "none") return
  const filename = NOISE_FILE_MAP[type]
  if (!filename) return

  const token = ++noiseToken
  const audio = new Audio(WHITENOISE_FILE_BASE + "/" + encodeURIComponent(filename))
  audio.loop = true
  audio.volume = 0.5
  bgAudio = audio

  audio.play().then(() => {
    // 播放成功后，若期间已切换到其他音频则立即停掉当前这个
    if (token !== noiseToken) {
      try { audio.pause(); audio.src = "" } catch { }
    }
  }).catch(e => {
    // AbortError：因快速切换被 pause 打断，属正常现象，忽略
    if (e.name === 'AbortError') return
    console.warn("背景音播放失败:", filename, e.message)
    if (token === noiseToken) bgAudio = null
  })
}

function stopNoise() {
  noiseToken++
  try {
    if (bgAudio) { bgAudio.pause(); bgAudio.src = ""; bgAudio = null }
  } catch { }
}

// ============ 完成提示音（Web Audio API 生成优雅和弦） ============
function playCompletionSound() {
  try {
    // 检查用户是否已授权音频播放（某些浏览器需要用户交互后才允许）
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    completionSoundCtx = new AudioCtx()
    // 确保 AudioContext 处于运行状态
    if (completionSoundCtx.state === 'suspended') {
      completionSoundCtx.resume()
    }
    const now = completionSoundCtx.currentTime

    // 上行和弦：C5 → E5 → G5 → C6（明亮悦耳）
    const notes = [523.25, 659.25, 783.99, 1046.50]
    notes.forEach((freq, i) => {
      const osc = completionSoundCtx.createOscillator()
      const gain = completionSoundCtx.createGain()
      osc.connect(gain)
      gain.connect(completionSoundCtx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = now + i * 0.18
      gain.gain.setValueAtTime(0.28, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7)
      osc.start(t)
      osc.stop(t + 0.7)
    })

    // 追加低音根音 C4 增加厚重感
    const bassOsc = completionSoundCtx.createOscillator()
    const bassGain = completionSoundCtx.createGain()
    bassOsc.connect(bassGain)
    bassGain.connect(completionSoundCtx.destination)
    bassOsc.type = 'triangle'
    bassOsc.frequency.value = 261.63
    bassGain.gain.setValueAtTime(0.2, now)
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2)
    bassOsc.start(now)
    bassOsc.stop(now + 1.2)

    // 手机振动反馈
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 400])
    }
  } catch (e) {
    console.warn('提示音播放失败:', e.message)
  }
}

// 清理提示音 AudioContext
function cleanupCompletionSound() {
  try {
    if (completionSoundCtx) {
      completionSoundCtx.close()
      completionSoundCtx = null
    }
  } catch { }
}

// ============ 核心：时间戳驱动的 tick 循环 ============
function tick() {
  if (!isRunning.value || isPaused.value) return

  const now = Date.now()
  const elapsed = Math.floor((now - tickStartTime) / 1000)
  const remaining = Math.max(0, totalSeconds.value - elapsed)
  timeLeft.value = remaining

  if (remaining <= 0) {
    handleComplete()
    return
  }
  animationId = requestAnimationFrame(tick)
}

// 页面可见性变化处理（从后台恢复时自动修正计时）
function onVisibilityChange() {
  if (document.visibilityState === 'visible' && isRunning.value && !isPaused.value) {
    // 页面恢复可见时，tick 会自动根据 Date.now() 修正剩余时间
    // 如果之前的 animationFrame 已停止，重新启动 tick
    if (!animationId) {
      tick()
    }
  }
}

// ============ 初始化和清理 ============
onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  animationId = null
  if (completeTimer) clearTimeout(completeTimer)
  completeTimer = null
  stopNoise()
  cleanupCompletionSound()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

watch(() => props.visible, (v) => {
  if (v && props.session) {
    totalSeconds.value = (props.session.duration || 25) * 60
    timeLeft.value = totalSeconds.value
    isRunning.value = false
    isPaused.value = false
    timerFinished.value = false
    elapsedBeforePause = 0
    if (animationId) cancelAnimationFrame(animationId)
    animationId = null
    if (completeTimer) clearTimeout(completeTimer)
    completeTimer = null
    selectedAudio.value = 'none'
  }
  if (!v) {
    if (animationId) cancelAnimationFrame(animationId)
    animationId = null
    if (completeTimer) clearTimeout(completeTimer)
    completeTimer = null
    isRunning.value = false
    isPaused.value = false
    timerFinished.value = false
    stopNoise()
    cleanupCompletionSound()
  }
})

// 切换白噪音时实时生效
watch(selectedAudio, (val) => {
  if (isRunning.value && !isPaused.value) {
    startNoise(val)
  }
})

function startTimer() {
  isRunning.value = true
  isPaused.value = false
  tickStartTime = Date.now()
  startNoise(selectedAudio.value)
  totalSeconds.value = timeLeft.value  // 记录本轮总秒数
  elapsedBeforePause = 0
  tick()
}

function pauseTimer() {
  isPaused.value = true
  if (animationId) cancelAnimationFrame(animationId)
  animationId = null
  elapsedBeforePause = totalSeconds.value - timeLeft.value  // 记录已消耗秒数
  stopNoise()
}

function resumeTimer() {
  isPaused.value = false
  // 调整：totalSeconds 设为剩余秒数，tickStartTime 重置为当前时间
  totalSeconds.value = timeLeft.value
  tickStartTime = Date.now()
  startNoise(selectedAudio.value)
  tick()
}

function handleComplete() {
  if (animationId) cancelAnimationFrame(animationId)
  animationId = null
  isRunning.value = false
  isPaused.value = false
  timeLeft.value = 0
  stopNoise()

  // 显示完成动画
  timerFinished.value = true

  // 播放完成提示音
  playCompletionSound()

  // 计算实际专注时长（分钟），基于真实已消耗时间
  const now = Date.now()
  let actualMinutes
  if (elapsedBeforePause > 0) {
    actualMinutes = Math.round(elapsedBeforePause / 60) || 1
  } else if (tickStartTime > 0) {
    actualMinutes = Math.round((now - tickStartTime) / 60000) || 1
  } else {
    actualMinutes = (props.session?.duration || 25)
  }

  // 延迟关闭，让用户看到完成动画并听完提示音
  if (completeTimer) clearTimeout(completeTimer)
  completeTimer = setTimeout(() => {
    emit('complete', actualMinutes)
  }, 2000)
}

async function completeEarly() {
  if (animationId) cancelAnimationFrame(animationId)
  animationId = null
  stopNoise()
  try {
    await ElMessageBox.confirm('确定提前完成专注吗？', '确认', {
      confirmButtonText: '是的，已完成',
      cancelButtonText: '继续专注',
      type: 'info'
    })
    // 显示完成动画
    timerFinished.value = true
    timeLeft.value = 0
    playCompletionSound()
    // 计算实际已经过的分钟数
    const now = Date.now()
    let actualMinutes
    if (elapsedBeforePause > 0) {
      actualMinutes = Math.round(elapsedBeforePause / 60) || 1
    } else if (tickStartTime > 0) {
      actualMinutes = Math.round((now - tickStartTime) / 60000) || 1
    } else {
      actualMinutes = 1
    }
    if (completeTimer) clearTimeout(completeTimer)
    completeTimer = setTimeout(() => {
      emit('complete', actualMinutes)
    }, 1500)
  } catch {
    // 用户取消 → 恢复计时器
    if (elapsedBeforePause > 0) {
      isPaused.value = true
    } else {
      totalSeconds.value = timeLeft.value
      tickStartTime = Date.now()
      isRunning.value = true
      isPaused.value = false
      startNoise(selectedAudio.value)
      tick()
    }
  }
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
  if (animationId) cancelAnimationFrame(animationId)
  animationId = null
  if (completeTimer) clearTimeout(completeTimer)
  completeTimer = null
  stopNoise()
  emit('cancel')
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
</script>

<style lang="scss" scoped src="./FocusTimer.scss"></style>

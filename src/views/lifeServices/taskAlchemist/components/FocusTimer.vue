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

// ============ 白噪音 ============
const selectedAudio = ref('none')
let audioContext = null
let noiseNode = null
let noiseGain = null
let completionSoundCtx = null  // 提示音专用 AudioContext

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

function startNoise(type) {
  stopNoise()
  if (type === 'none') return
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const sr = audioContext.sampleRate
    const dur = 4 // 4秒循环
    const len = dur * sr

    // 使用两个声道增强立体感
    const buffer = audioContext.createBuffer(2, len, sr)
    const L = buffer.getChannelData(0)
    const R = buffer.getChannelData(1)

    // 辅助函数：粉红噪音（比白噪音更自然）
    function pinkNoise(length, seed = 1) {
      const out = new Float32Array(length)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < length; i++) {
        const white = (Math.random() * 2 - 1) * seed
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        out[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
        out[i] *= 0.11
        b6 = white * 0.115926
      }
      return out
    }

    // 辅助函数：棕色噪音（低频丰富，模拟远雷/低沉环境）
    function brownNoise(length, strength = 1) {
      const out = new Float32Array(length)
      let last = 0
      for (let i = 0; i < length; i++) {
        const white = (Math.random() * 2 - 1) * strength
        last = (last + 0.02 * white) / 1.02
        out[i] = last * 2.5
      }
      return out
    }

    // 辅助函数：生成水滴/鸟叫包络
    function envelope(length, attack, decay, sr) {
      const env = new Float32Array(length)
      const attackLen = Math.floor(attack * sr)
      for (let i = 0; i < length; i++) {
        if (i < attackLen) {
          env[i] = i / attackLen
        } else {
          env[i] = Math.exp(-(i - attackLen) / (decay * sr))
        }
      }
      return env
    }

    switch (type) {
      case 'rain': {
        // ===== 暴雨声：棕色噪音底层 + 高频水滴声 =====
        const brownL = brownNoise(len, 0.7)
        const brownR = brownNoise(len, 0.65)

        // 添加随机水滴撞击声（高频短脉冲）
        const dropInterval = Math.floor(sr * 0.08) // 每0.08秒一个水滴
        for (let i = 0; i < len; i += dropInterval) {
          const jitter = Math.floor(Math.random() * dropInterval * 0.6)
          const pos = i + jitter
          if (pos >= len) continue
          const dropLen = Math.floor(sr * 0.04) // 水滴持续40ms
          const dropEnv = envelope(Math.min(dropLen, len - pos), 0.002, 0.015, sr)
          const freq = 6000 + Math.random() * 8000 // 高频水滴
          for (let d = 0; d < dropEnv.length && pos + d < len; d++) {
            const sample = Math.sin(2 * Math.PI * freq * d / sr) * dropEnv[d] * 0.3 * (Math.random() * 0.5 + 0.5)
            L[pos + d] += sample
            R[pos + d] += sample * (0.7 + Math.random() * 0.6)
          }
        }

        // 低频雷鸣（偶尔出现）
        const thunderInterval = Math.floor(sr * 3)
        for (let i = thunderInterval; i < len; i += thunderInterval + Math.floor(Math.random() * sr * 2)) {
          const tLen = Math.floor(sr * 0.8)
          const tEnv = envelope(Math.min(tLen, len - i), 0.05, 0.6, sr)
          for (let t = 0; t < tEnv.length && i + t < len; t++) {
            const rumble = Math.sin(2 * Math.PI * (40 + Math.sin(t / sr * 3) * 20) * t / sr) * tEnv[t] * 0.15
            L[i + t] += rumble
            R[i + t] += rumble * 0.9
          }
        }

        for (let i = 0; i < len; i++) {
          L[i] = brownL[i] * 0.7 + L[i]
          R[i] = brownR[i] * 0.7 + R[i]
        }
        break
      }

      case 'forest': {
        // ===== 森林：粉红噪音底层 + 多层次鸟叫 =====
        const pinkL = pinkNoise(len, 0.4)
        const pinkR = pinkNoise(len, 0.35)

        // 多层次鸟叫（不同频率、不同节奏）
        const birdCount = 12
        for (let b = 0; b < birdCount; b++) {
          const startPos = Math.floor(Math.random() * len * 0.9)
          const chirpLen = Math.floor(sr * (0.08 + Math.random() * 0.25))
          const baseFreq = 1800 + Math.random() * 3500
          const chirpEnv = envelope(Math.min(chirpLen, len - startPos), 0.005, 0.04 + Math.random() * 0.08, sr)

          for (let c = 0; c < chirpEnv.length && startPos + c < len; c++) {
            // 频率滑音（鸟叫特征）
            const freqMod = baseFreq + Math.sin(c / sr * 15 + b) * 400
            const chirp = Math.sin(2 * Math.PI * freqMod * c / sr) * chirpEnv[c] * (0.08 + Math.random() * 0.12)
            const pan = 0.3 + Math.random() * 0.7
            L[startPos + c] += chirp * pan
            R[startPos + c] += chirp * (1 - pan)
          }
        }

        // 远处的风声（低频调制）
        for (let i = 0; i < len; i++) {
          const windMod = 0.3 + Math.sin(i / sr * 0.5) * 0.2 + Math.sin(i / sr * 1.3) * 0.1
          L[i] = pinkL[i] * windMod + L[i]
          R[i] = pinkR[i] * windMod + R[i]
        }
        break
      }

      case 'cafe': {
        // ===== 咖啡馆：多层人声 murmur + 杯碟声 =====
        const pinkL = pinkNoise(len, 0.25)
        const pinkR = pinkNoise(len, 0.22)

        // 模拟远处人声（低频调制噪音，听起来像人群交谈）
        for (let i = 0; i < len; i++) {
          // 人声频段集中在 200-800Hz，用低频调制模拟
          const voiceMod = Math.sin(i / sr * 2.7) * 0.5 + Math.sin(i / sr * 3.8) * 0.3 + Math.sin(i / sr * 5.1) * 0.2
          L[i] += voiceMod * 0.06
          R[i] += voiceMod * 0.055
        }

        // 随机杯碟碰撞声
        const clinkInterval = Math.floor(sr * 2)
        for (let i = clinkInterval; i < len; i += clinkInterval + Math.floor(Math.random() * sr * 4)) {
          const clinkLen = Math.floor(sr * 0.15)
          const clinkEnv = envelope(Math.min(clinkLen, len - i), 0.001, 0.06, sr)
          const clinkFreq = 2500 + Math.random() * 4000
          for (let c = 0; c < clinkEnv.length && i + c < len; c++) {
            const clink = Math.sin(2 * Math.PI * clinkFreq * c / sr) * clinkEnv[c] * 0.15
            // 杯碟声偏高频，快速衰减
            const clink2 = Math.sin(2 * Math.PI * (clinkFreq * 1.6) * c / sr) * clinkEnv[c] * 0.08
            L[i + c] += clink + clink2
            R[i + c] += clink * 0.7 + clink2 * 0.9
          }
        }

        // 偶尔的笑声/较大声交谈
        for (let i = 0; i < len; i += Math.floor(sr * 6 + Math.random() * sr * 5)) {
          const burstLen = Math.floor(sr * 0.4)
          const burstEnv = envelope(Math.min(burstLen, len - i), 0.02, 0.2, sr)
          for (let b = 0; b < burstEnv.length && i + b < len; b++) {
            const burst = (Math.random() * 2 - 1) * burstEnv[b] * 0.08
            L[i + b] += burst
            R[i + b] += burst * (0.7 + Math.random() * 0.3)
          }
        }

        for (let i = 0; i < len; i++) {
          L[i] = pinkL[i] * 0.5 + L[i]
          R[i] = pinkR[i] * 0.5 + R[i]
        }
        break
      }

      case 'library': {
        // ===== 图书馆：极轻柔粉红噪音 + 翻书声 + 键盘打字 =====
        const pinkL = pinkNoise(len, 0.15)
        const pinkR = pinkNoise(len, 0.13)

        // 翻书声（轻柔的沙沙声）
        const pageInterval = Math.floor(sr * 8)
        for (let i = pageInterval; i < len; i += pageInterval + Math.floor(Math.random() * sr * 10)) {
          const pageLen = Math.floor(sr * 0.3)
          const pageEnv = envelope(Math.min(pageLen, len - i), 0.01, 0.15, sr)
          for (let p = 0; p < pageEnv.length && i + p < len; p++) {
            // 翻书声是低频+中频混合
            const rustle = (Math.random() * 2 - 1) * pageEnv[p] * 0.04
            L[i + p] += rustle
            R[i + p] += rustle * (0.6 + Math.random() * 0.4)
          }
        }

        // 键盘打字声
        const typeInterval = Math.floor(sr * 0.6)
        for (let i = typeInterval; i < len; i += typeInterval + Math.floor(Math.random() * sr * 0.4)) {
          const typeLen = Math.floor(sr * 0.03)
          const typeEnv = envelope(Math.min(typeLen, len - i), 0.001, 0.01, sr)
          const freq = 800 + Math.random() * 1200
          for (let t = 0; t < typeEnv.length && i + t < len; t++) {
            const tap = Math.sin(2 * Math.PI * freq * t / sr) * typeEnv[t] * 0.06
            L[i + t] += tap
            R[i + t] += tap * 0.8
          }
        }

        for (let i = 0; i < len; i++) {
          L[i] = pinkL[i] * 0.35 + L[i]
          R[i] = pinkR[i] * 0.35 + R[i]
        }
        break
      }

      default:
        for (let i = 0; i < len; i++) {
          L[i] = (Math.random() * 2 - 1) * 0.05
          R[i] = (Math.random() * 2 - 1) * 0.05
        }
    }

    noiseNode = audioContext.createBufferSource()
    noiseNode.buffer = buffer
    noiseNode.loop = true
    noiseGain = audioContext.createGain()
    noiseGain.gain.value = 0.4
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

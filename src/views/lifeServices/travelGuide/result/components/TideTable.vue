<template>
  <div v-if="tideData" class="tide-card" :class="{ 'dialog-mode': dialogMode }">
    <!-- ===== 头部：标题 + 地点 + 日期 + 月相 ===== -->
    <div class="tide-header">
      <div class="tide-title-row">
        <span class="tide-icon">🌊</span>
        <span class="tide-title">潮汐预报</span>
        <span v-if="locationName" class="tide-location-tag">{{ locationName }}</span>
      </div>
      <div class="tide-meta">
        <span class="tide-date">{{ tideData.date }}</span>
        <span class="tide-sep">·</span>
        <span class="tide-moon">{{ moonEmoji }} {{ tideData.moonPhase }}</span>
      </div>
    </div>

    <!-- ===== 当前潮位状态指示 ===== -->
    <div v-if="currentStatus" class="tide-now" :class="currentStatus.type">
      <div class="now-indicator">
        <span class="now-dot"></span>
        <span class="now-label">现在</span>
      </div>
      <div class="now-info">
        <span class="now-status">{{ currentStatus.label }}</span>
        <span class="now-detail">{{ currentStatus.detail }}</span>
      </div>
    </div>

    <!-- ===== 24小时潮位曲线图 ===== -->
    <div class="tide-chart-section">
      <div class="chart-title">📈 24小时潮位变化</div>
      <div class="tide-chart">
        <!-- Y轴标尺 -->
        <div class="chart-y-axis">
          <span v-for="l in yLabels" :key="l" class="y-label">{{ l }}m</span>
        </div>
        <!-- 曲线区域 -->
        <div class="chart-area">
          <svg
            class="chart-svg"
            :viewBox="`0 0 240 ${chartHeight}`"
            preserveAspectRatio="none"
          >
            <!-- 背景网格 -->
            <line
              v-for="h in 4" :key="'grid-' + h"
              :x1="0" :y1="(chartHeight / 4) * h"
              :x2="240" :y2="(chartHeight / 4) * h"
              stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="4,4"
            />
            <!-- 安全水位线 -->
            <line
              :x1="0" :y1="safeLineY" :x2="240" :y2="safeLineY"
              stroke="#f59e0b" stroke-width="1" stroke-dasharray="6,3"
              opacity="0.6"
            />
            <!-- 填充区域 -->
            <path
              :d="areaPath"
              fill="url(#tideGradient)"
              opacity="0.35"
            />
            <!-- 曲线 -->
            <path
              :d="curvePath"
              fill="none"
              stroke="#3b82f6"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <!-- 高潮点 -->
            <circle
              v-for="(p, i) in highPoints"
              :key="'h-' + i"
              :cx="p.x" :cy="p.y" r="5"
              fill="#ef4444" stroke="#fff" stroke-width="2"
            />
            <!-- 低潮点 -->
            <circle
              v-for="(p, i) in lowPoints"
              :key="'l-' + i"
              :cx="p.x" :cy="p.y" r="5"
              fill="#3b82f6" stroke="#fff" stroke-width="2"
            />
            <!-- 当前时间竖线 -->
            <line
              v-if="nowX !== null"
              :x1="nowX" :y1="0" :x2="nowX" :y2="chartHeight"
              stroke="#6366f1" stroke-width="1.5" stroke-dasharray="3,3"
              opacity="0.8"
            />
            <!-- 潮高标注 -->
            <text
              v-for="(p, i) in curveLabels"
              :key="'lb-' + i"
              :x="p.x" :y="p.y - 10"
              text-anchor="middle"
              :fill="p.isHigh ? '#ef4444' : '#2563eb'"
              font-size="10"
              font-weight="600"
            >{{ p.time }}</text>
          </svg>
          <!-- 渐变定义 -->
          <svg width="0" height="0">
            <defs>
              <linearGradient id="tideGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.5" />
                <stop offset="100%" stop-color="#60a5fa" stop-opacity="0.03" />
              </linearGradient>
            </defs>
          </svg>
          <!-- X轴时间标签 -->
          <div class="chart-x-axis">
            <span v-for="h in [0, 3, 6, 9, 12, 15, 18, 21, 24]" :key="'x' + h">
              {{ String(h).padStart(2, '0') }}:00
            </span>
          </div>
          <!-- 图例 -->
          <div class="chart-legend">
            <span class="legend-item">
              <span class="legend-dot high"></span>高潮
            </span>
            <span class="legend-item">
              <span class="legend-dot low"></span>低潮
            </span>
            <span class="legend-item">
              <span class="legend-dash"></span>安全线
            </span>
            <span v-if="nowX !== null" class="legend-item">
              <span class="legend-dash now"></span>现在
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 游玩建议卡片 ===== -->
    <div class="tide-advice">
      <div class="advice-icon">💡</div>
      <div class="advice-content">
        <div class="advice-title">游玩建议</div>
        <div class="advice-text">{{ playAdvice }}</div>
      </div>
    </div>

    <!-- ===== 高低潮详情卡片 ===== -->
    <div class="tide-cards">
      <div class="tide-card-item high">
        <div class="card-label">🔴 高潮时间（水深 / 注意安全）</div>
        <div v-for="t in tideData.highTides" :key="'h-' + t.time" class="card-row">
          <span class="card-time">{{ t.time }}</span>
          <span class="card-value">{{ t.height }}m</span>
        </div>
        <div v-if="!tideData.highTides?.length" class="card-empty">暂无数据</div>
      </div>
      <div class="tide-card-item low">
        <div class="card-label">🔵 低潮时间（水浅 / 适合赶海）</div>
        <div v-for="t in tideData.lowTides" :key="'l-' + t.time" class="card-row">
          <span class="card-time">{{ t.time }}</span>
          <span class="card-value">{{ t.height }}m</span>
        </div>
        <div v-if="!tideData.lowTides?.length" class="card-empty">暂无数据</div>
      </div>
    </div>

    <!-- ===== 底部注释 ===== -->
    <div class="tide-footer">
      <span class="footer-icon">ℹ️</span>
      <span>{{ tideData.note || '以上数据基于天文潮汐模型预测，实际潮位可能受天气、风力等影响。' }}</span>
    </div>
  </div>

  <!-- 加载中 -->
  <div v-else-if="loading" class="tide-card loading" :class="{ 'dialog-mode': dialogMode }">
    <span class="loading-text">🌊 正在获取潮汐数据...</span>
  </div>

  <!-- 无数据（兜底） -->
  <div v-else class="tide-card empty" :class="{ 'dialog-mode': dialogMode }">
    <div class="empty-state">
      <span class="empty-icon">🌊</span>
      <span class="empty-text">暂无潮汐数据，正在获取中...</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

defineProps({
  dialogMode: {
    type: Boolean,
    default: false
  },
  locationName: {
    type: String,
    default: ''
  }
})

const store = useStore()
const tideData = computed(() => store.state.plan.tideData)
const loading = computed(() => store.state.plan.tideLoading)

const chartHeight = 120

// ===== 月相 emoji =====
const moonEmoji = computed(() => {
  const phase = tideData.value?.moonPhase || ''
  if (phase.includes('满')) return '🌕'
  if (phase.includes('新') || phase.includes('朔')) return '🌑'
  if (phase.includes('上弦')) return '🌓'
  if (phase.includes('下弦')) return '🌗'
  if (phase.includes('亏') || phase.includes('残')) return '🌘'
  if (phase.includes('盈') || phase.includes('蛾眉')) return '🌒'
  return '🌔'
})

// ===== 合并所有潮汐点（含插值生成平滑曲线） =====
const maxTideHeight = computed(() => {
  const all = [...(tideData.value?.highTides || []), ...(tideData.value?.lowTides || [])]
  if (!all.length) return 5
  const maxH = Math.max(...all.map(t => parseFloat(t.height) || 0))
  return Math.ceil(maxH + 1) // 留一点顶部空间
})

const yLabels = computed(() => {
  const max = maxTideHeight.value
  return [max, Math.round(max * 0.75 * 10) / 10, Math.round(max * 0.5 * 10) / 10, Math.round(max * 0.25 * 10) / 10, 0]
})

const safeLineY = computed(() => {
  // 安全线：最大潮高的50%（中水位）
  return chartHeight * 0.5
})

// 所有原始潮汐点（含插值极值点）
const curvePoints = computed(() => {
  const data = tideData.value
  if (!data) return []
  const points = []
  data.highTides?.forEach(t => {
    const [h, m] = t.time.split(':').map(Number)
    points.push({ time: t.time, height: parseFloat(t.height), minutes: h * 60 + m, isHigh: true })
  })
  data.lowTides?.forEach(t => {
    const [h, m] = t.time.split(':').map(Number)
    points.push({ time: t.time, height: parseFloat(t.height), minutes: h * 60 + m, isHigh: false })
  })
  // 按时间排序
  points.sort((a, b) => a.minutes - b.minutes)
  
  // 在开始和结束添加镜像点使曲线闭合
  if (points.length >= 2) {
    const first = { ...points[0], minutes: points[0].minutes - 12.42 * 60 }
    const last = { ...points[points.length - 1], minutes: points[points.length - 1].minutes + 12.42 * 60 }
    return [first, ...points, last]
  }
  return points
})

// 将分钟转为 X 坐标
function toX(minutes) {
  // 映射 0~1440 分钟到 0~240 宽度，考虑首尾镜像偏移
  const rawMins = curvePoints.value
  if (rawMins.length < 2) return 0
  const firstMin = rawMins[0].minutes
  const lastMin = rawMins[rawMins.length - 1].minutes
  const range = lastMin - firstMin
  if (range <= 0) return 0
  return ((minutes - firstMin) / range) * 240
}

// 将潮高转为 Y 坐标
function toY(height) {
  const max = maxTideHeight.value
  if (max <= 0) return chartHeight
  return chartHeight - (height / max) * chartHeight
}

const highPoints = computed(() => {
  return (tideData.value?.highTides || []).map(t => {
    const [h, m] = t.time.split(':').map(Number)
    return { x: toX(h * 60 + m), y: toY(parseFloat(t.height)), time: t.time, height: t.height }
  })
})

const lowPoints = computed(() => {
  return (tideData.value?.lowTides || []).map(t => {
    const [h, m] = t.time.split(':').map(Number)
    return { x: toX(h * 60 + m), y: toY(parseFloat(t.height)), time: t.time, height: t.height }
  })
})

// 曲线标签（避免与点重叠，只标注高潮低潮点）
const curveLabels = computed(() => {
  return [...highPoints.value.map(p => ({ ...p, isHigh: true })), ...lowPoints.value.map(p => ({ ...p, isHigh: false }))]
})

// 当前时间
const nowX = computed(() => {
  const now = new Date()
  // 判断是否当天
  const dateStr = tideData.value?.date
  if (!dateStr) return null
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (dateStr !== today) return null
  const minutes = now.getHours() * 60 + now.getMinutes()
  return toX(minutes)
})

// ===== 当前潮位状态 =====
const currentStatus = computed(() => {
  const points = curvePoints.value
  if (points.length < 2 || nowX.value === null) return null
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  // 找到当前时间左右两个潮汐点
  for (let i = 0; i < points.length - 1; i++) {
    if (points[i].minutes <= nowMins && points[i + 1].minutes >= nowMins) {
      const isRising = points[i + 1].height > points[i].height
      const isRisingFast = Math.abs(points[i + 1].height - points[i].height) > 1.5
      const nextPoint = points[i + 1]
      const minsUntil = nextPoint.minutes - nowMins
      
      if (isRising) {
        return {
          type: 'rising',
          label: isRisingFast ? '🌊 正在快速涨潮' : '📈 正在涨潮',
          detail: minsUntil > 60
            ? `约${Math.round(minsUntil / 60)}小时${minsUntil % 60}分后到达高潮 ${nextPoint.time}`
            : `${minsUntil}分钟后到达高潮 ${nextPoint.time}`
        }
      } else {
        return {
          type: 'falling',
          label: isRisingFast ? '🏖️ 正在快速退潮' : '📉 正在退潮',
          detail: minsUntil > 60
            ? `约${Math.round(minsUntil / 60)}小时${minsUntil % 60}分后到达低潮 ${nextPoint.time}`
            : `${minsUntil}分钟后到达低潮 ${nextPoint.time}`
        }
      }
    }
  }
  return null
})

// ===== SVG 曲线路径（贝塞尔平滑） =====
const curvePath = computed(() => {
  const pts = curvePoints.value
  if (pts.length < 2) return ''
  let d = `M ${toX(pts[0].minutes)} ${toY(pts[0].height)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const x1 = toX(pts[i].minutes)
    const y1 = toY(pts[i].height)
    const x2 = toX(pts[i + 1].minutes)
    const y2 = toY(pts[i + 1].height)
    const cx = (x1 + x2) / 2
    d += ` Q ${cx} ${y1} ${cx} ${(y1 + y2) / 2}`
    d += ` Q ${cx} ${y2} ${x2} ${y2}`
  }
  return d
})

// 填充区域路径
const areaPath = computed(() => {
  const path = curvePath.value
  if (!path) return ''
  const pts = curvePoints.value
  if (pts.length < 2) return ''
  return `${path} L ${toX(pts[pts.length - 1].minutes)} ${chartHeight} L ${toX(pts[0].minutes)} ${chartHeight} Z`
})

// ===== 游玩建议 =====
const playAdvice = computed(() => {
  const data = tideData.value
  if (!data) return ''
  const highs = data.highTides || []
  const lows = data.lowTides || []
  if (lows.length === 0) return '暂无潮汐数据，无法生成游玩建议。'
  
  // 找最低潮时段
  const minLow = lows.reduce((min, t) => parseFloat(t.height) < parseFloat(min.height) ? t : min, lows[0])
  // 找到最低潮前后的时间段
  const [lh, lm] = minLow.time.split(':').map(Number)
  const lowMins = lh * 60 + lm
  const startMins = Math.max(0, lowMins - 150) // 退潮前2.5小时
  const endMins = Math.min(1440, lowMins + 150) // 涨潮前2.5小时
  
  const formatMins = (m) => {
    const hh = Math.floor(m / 60)
    const mm = m % 60
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
  }
  
  const parts = [
    `🕐 最佳沙滩游玩时间：${formatMins(startMins)} - ${formatMins(endMins)}`,
    `（最低潮 ${minLow.time}，潮高仅${minLow.height}m，沙滩最开阔）`
  ]
  
  // 如果有高潮警告
  const maxHigh = highs.reduce((max, t) => parseFloat(t.height) > parseFloat(max.height) ? t : max, highs[0])
  if (parseFloat(maxHigh.height) > 2.5) {
    parts.push(`\n⚠️ ${maxHigh.time} 前后潮位较高（${maxHigh.height}m），请远离深水区，注意安全。`)
  }
  
  return parts.join('\n')
})
</script>

<style lang="scss" scoped src="./TideTable.scss"></style>

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

<style lang="scss" scoped>
.tide-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);

  // 弹窗模式：去掉外层边框和圆角，用弹窗自带的结构
  &.dialog-mode {
    border: none;
    border-radius: 0;
    box-shadow: none;
    padding: 20px 28px 28px;
    margin-bottom: 0;
  }
  
  &.loading {
    opacity: 0.7;
    text-align: center;
    padding: 24px;
  }
}
.loading-text { font-size: 13px; color: #94a3b8; }

// ========== 空状态 ==========
.tide-card.empty {
  text-align: center;
  padding: 32px 24px;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.empty-icon { font-size: 36px; opacity: 0.5; }
.empty-text { font-size: 14px; color: #94a3b8; }

// ========== 头部 ==========
.tide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 6px;
}
.tide-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tide-icon { font-size: 20px; }
.tide-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}
.tide-location-tag {
  font-size: 11px;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 2px 8px;
  white-space: nowrap;
}
.tide-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}
.tide-sep { color: #cbd5e1; }
.tide-moon { color: #6366f1; font-weight: 500; }

// ========== 当前状态 ==========
.tide-now {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 16px;
  
  &.rising {
    background: linear-gradient(135deg, #fef2f2, #fff7ed);
    border: 1px solid #fecaca;
  }
  &.falling {
    background: linear-gradient(135deg, #ecfeff, #f0fdf4);
    border: 1px solid #99f6e4;
  }
}
.now-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.now-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #6366f1;
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
  50% { box-shadow: 0 0 0 6px rgba(99,102,241,0); }
}
.now-label {
  font-size: 12px;
  font-weight: 600;
  color: #6366f1;
}
.now-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.now-status {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}
.now-detail {
  font-size: 11px;
  color: #64748b;
}

// ========== 图表区域 ==========
.tide-chart-section {
  margin-bottom: 14px;
}
.chart-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}
.tide-chart {
  display: flex;
  gap: 4px;
}
.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 4px 20px 0;
  flex-shrink: 0;
}
.y-label {
  font-size: 9px;
  color: #94a3b8;
  line-height: 1;
}
.chart-area {
  flex: 1;
  position: relative;
  min-height: 0;
}
.chart-svg {
  width: 100%;
  height: auto;
  aspect-ratio: 240 / 120;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.chart-x-axis {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px 0;
  span {
    font-size: 9px;
    color: #94a3b8;
  }
}
.chart-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 6px;
  flex-wrap: wrap;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #64748b;
}
.legend-dot {
  width: 8px; height: 8px; border-radius: 50%;
  border: 1.5px solid #fff;
  &.high { background: #ef4444; }
  &.low { background: #3b82f6; }
}
.legend-dash {
  width: 14px; height: 0;
  border-top: 1.5px dashed;
  &.now { border-color: #6366f1; }
  &:not(.now) { border-color: #f59e0b; }
}

// ========== 游玩建议 ==========
.tide-advice {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #fffbeb, #fefce8);
  border: 1px solid #fde68a;
  border-radius: 10px;
  margin-bottom: 14px;
}
.advice-icon { font-size: 20px; flex-shrink: 0; }
.advice-content { min-width: 0; }
.advice-title {
  font-size: 13px;
  font-weight: 700;
  color: #92400e;
  margin-bottom: 4px;
}
.advice-text {
  font-size: 12px;
  color: #78350f;
  line-height: 1.6;
  white-space: pre-line;
}

// ========== 高低潮卡片 ==========
.tide-cards {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.tide-card-item {
  flex: 1;
  border-radius: 10px;
  padding: 10px 12px;
  
  &.high {
    background: #fef2f2;
    border: 1px solid #fecaca;
  }
  &.low {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
  }
}
.card-label {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 6px;
  
  .high & { color: #dc2626; }
  .low & { color: #2563eb; }
}
.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px dashed rgba(0,0,0,0.08);
  &:last-child { border-bottom: none; }
}
.card-time {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}
.card-value {
  font-size: 13px;
  font-weight: 600;
  .high & { color: #ef4444; }
  .low & { color: #3b82f6; }
}
.card-empty {
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
  padding: 6px 0;
}

// ========== 底部注释 ==========
.tide-footer {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.5;
}
.footer-icon { flex-shrink: 0; }

// ========== 响应式 ==========
@media (max-width: 768px) {
  .tide-card {
    padding: 14px 12px;
    border-radius: 12px;
    margin-bottom: 12px;

    &.dialog-mode {
      padding: 12px 14px 20px;
    }
  }
  .tide-title { font-size: 14px; }
  .tide-meta { font-size: 11px; }
  .tide-now { padding: 8px 10px; gap: 8px; }
  .now-status { font-size: 12px; }
  .tide-cards { flex-direction: column; gap: 8px; }
  .chart-svg { aspect-ratio: 240 / 100; }
}
</style>

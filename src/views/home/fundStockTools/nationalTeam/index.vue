<template>
  <div class="nt-page">
    <!-- ==================== 顶部信号总览卡片 ==================== -->
    <section class="nt-hero">
      <div class="nt-hero-left">
        <h1 class="nt-title">🏛️ 跟党走 · 国家队动向监测</h1>
        <p class="nt-subtitle">基于宽基ETF份额变化，倒推国家队进出场时机 | 中长线仓位管理辅助</p>
      </div>
      <div class="nt-hero-right">
        <span class="nt-source-badge" :class="statusData.healthy ? 'ok' : 'err'">
          数据源: {{ statusData.current === 'sina' ? '新浪 ✅' : '东方财富 ✅' }}
        </span>
        <span v-if="statusData.lastUpdate" class="nt-update-time">更新于 {{ statusData.lastUpdate }}</span>
        <el-button type="primary" :loading="triggering" :disabled="triggering" @click="handleTrigger" round>
          <el-icon><Refresh /></el-icon> {{ triggering ? triggerStatus : '立即刷新数据' }}
        </el-button>
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择历史日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :clearable="false"
          @change="onDateChange"
          style="width: 160px"
        />
      </div>
    </section>

    <!-- ==================== 信号总览卡片 ==================== -->
    <section class="nt-signal-card" v-if="signalData">
      <div class="nt-signal-main">
        <div class="nt-score-ring" :class="signalLevelClass">
          <span class="nt-score-num">{{ signalData.overall_score }}</span>
          <span class="nt-score-label">综合评分</span>
        </div>
        <div class="nt-signal-info">
          <div class="nt-signal-level" :style="{ color: signalLevelColor }">
            <span class="nt-signal-dot" :style="{ background: signalLevelColor }"></span>
            {{ signalData.signal_label }}
          </div>
          <div class="nt-signal-suggestion">{{ signalData.suggestion }}</div>
          <div class="nt-signal-position">
            建议权益仓位: <strong>{{ signalData.suggested_position }}%</strong>
          </div>
        </div>
      </div>
      <div class="nt-signal-factors">
        <div class="nt-factor-item">
          <span class="nt-factor-name">量能因子 (50%)</span>
          <el-progress :percentage="signalData.volume_factor" :color="factorColor(signalData.volume_factor)" :stroke-width="6" />
        </div>
        <div class="nt-factor-item">
          <span class="nt-factor-name">份额因子 (30%)</span>
          <el-progress :percentage="signalData.share_factor" :color="factorColor(signalData.share_factor)" :stroke-width="6" />
        </div>
        <div class="nt-factor-item">
          <span class="nt-factor-name">方向因子 (20%)</span>
          <el-progress :percentage="signalData.direction_factor" :color="factorColor(signalData.direction_factor)" :stroke-width="6" />
        </div>
        <div v-if="signalData.consecutive_days > 1 && (signalData.signal_level === 'extreme_low' || signalData.signal_level === 'low')" class="nt-consecutive-warn">
          ⚠️ 连续 {{ signalData.consecutive_days }} 日买入信号（需连续3日确认{{ signalData.consecutive_days >= 3 ? ' ✅' : '' }}）
        </div>
      </div>
    </section>
    <section class="nt-empty-signal" v-else-if="!signalLoading">
      <p>📡 暂无今日信号数据，请点击"立即刷新数据"触发采集</p>
    </section>

    <!-- ==================== 统计数据摘要 ==================== -->
    <section class="nt-stats-row" v-if="statsData">
      <div class="nt-stat-card">
        <span class="nt-stat-val">{{ statsData.monitoringDays }}</span>
        <span class="nt-stat-lbl">监测天数</span>
      </div>
      <div class="nt-stat-card">
        <span class="nt-stat-val">{{ statsData.buySignals }}</span>
        <span class="nt-stat-lbl">买入信号次数</span>
      </div>
      <div class="nt-stat-card">
        <span class="nt-stat-val">{{ statsData.sellSignals }}</span>
        <span class="nt-stat-lbl">卖出信号次数</span>
      </div>
      <div class="nt-stat-card">
        <span class="nt-stat-val">{{ statsData.lastBuyDays }}天前</span>
        <span class="nt-stat-lbl">距上次买入</span>
      </div>
      <div class="nt-stat-card">
        <span class="nt-stat-val">{{ formatMoney(statsData.todayNetFlow) }}</span>
        <span class="nt-stat-lbl">今日估算净流入</span>
      </div>
      <div class="nt-stat-card">
        <span class="nt-stat-val">{{ formatMoney(statsData.todayAmount) }}</span>
        <span class="nt-stat-lbl">今日总成交额</span>
      </div>
    </section>

    <!-- ==================== 机构Tab切换 ==================== -->
    <section class="nt-tabs-section">
      <div class="nt-tabs">
        <button
          v-for="ag in AGENCIES"
          :key="ag.key"
          class="nt-tab-btn"
          :class="{ active: currentAgency === ag.key }"
          @click="switchAgency(ag.key)"
        >
          <span class="nt-tab-icon">{{ ag.icon }}</span>
          <span class="nt-tab-label">{{ ag.label }}</span>
          <span v-if="agencySignals[ag.key]" class="nt-tab-dot" :style="{ background: getLevelColor(agencySignals[ag.key].signal_level) }"></span>
        </button>
      </div>
      <div class="nt-agency-note">
        <el-icon><InfoFilled /></el-icon>
        视角信号：基于{{ currentAgencyLabel }}历史偏好ETF池重新计算的信号，非真实持仓数据
      </div>
    </section>

    <!-- ==================== ETF监测图 2x3 ==================== -->
    <section class="nt-charts-section">
      <h3 class="nt-section-title">📊 六大核心ETF监测</h3>
      <div class="nt-etf-grid">
        <div
          v-for="etf in ETFS"
          :key="etf.code"
          class="nt-etf-chart-item"
          :class="{ highlighted: isETFFocused(etf.code) }"
        >
          <div class="nt-etf-chart-header">
            <span class="nt-etf-code">{{ etf.code }}</span>
            <span class="nt-etf-name">{{ etf.name }}</span>
          </div>
          <div :ref="el => setChartRef(etf.code, el)" class="nt-etf-chart"></div>
        </div>
      </div>
    </section>

    <!-- ==================== 下方图表区: 对比图 + 热力图 ==================== -->
    <section class="nt-bottom-charts">
      <div class="nt-bottom-chart-panel">
        <h3 class="nt-section-title">📈 多机构信号对比（近90天）</h3>
        <div ref="comparisonChartRef" class="nt-big-chart"></div>
      </div>
      <div class="nt-bottom-chart-panel">
        <h3 class="nt-section-title">📅 历史信号日历热力图</h3>
        <div ref="heatmapChartRef" class="nt-big-chart"></div>
      </div>
    </section>

    <!-- ==================== 下方图表区: 异动 + 累计份额 ==================== -->
    <section class="nt-bottom-charts">
      <div class="nt-bottom-chart-panel">
        <h3 class="nt-section-title">📋 近7日异动列表</h3>
        <el-table :data="anomalyData" style="width: 100%" size="small" max-height="350" stripe>
          <el-table-column prop="date" label="日期" width="110" />
          <el-table-column prop="etfCode" label="ETF" width="120">
            <template #default="{ row }">
              <strong>{{ row.etfCode }}</strong> {{ row.etfName }}
            </template>
          </el-table-column>
          <el-table-column prop="typeLabel" label="异动类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'share_surge' ? 'warning' : 'danger'" size="small">{{ row.typeLabel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="异动描述" min-width="200" />
          <el-table-column prop="signal" label="信号提示" width="100">
            <template #default="{ row }">
              <span :style="{ color: row.signal.includes('买入') ? '#ff4757' : '#1e90ff' }">{{ row.signal }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="relatedAgency" label="关联机构" width="160" />
        </el-table>
      </div>
      <div class="nt-bottom-chart-panel">
        <h3 class="nt-section-title">📈 ETF份额累计变化趋势</h3>
        <div ref="cumulativeChartRef" class="nt-big-chart"></div>
      </div>
    </section>

    <!-- ==================== 回测面板 ==================== -->
    <section class="nt-backtest" v-if="backtestData">
      <h3 class="nt-section-title">🧪 信号回测（基于510300沪深300ETF）</h3>
      <div class="nt-backtest-row">
        <div class="nt-backtest-item" v-for="bt in backtestData" :key="bt.days">
          <span class="nt-backtest-days">{{ bt.days }}天前跟随</span>
          <span class="nt-backtest-return" :class="bt.returnVal >= 0 ? 'up' : 'down'">
            {{ bt.returnVal >= 0 ? '+' : '' }}{{ bt.returnVal }}%
          </span>
          <span class="nt-backtest-action">{{ bt.action }}</span>
        </div>
      </div>
      <p class="nt-backtest-note">⚠️ 回测基于历史数据，历史表现不保证未来收益</p>
    </section>

    <!-- ==================== 页脚声明 ==================== -->
    <footer class="nt-footer">
      <p>
        ⚠️ 数据来源：新浪财经、东方财富公开API | 信号计算仅供参考，不构成投资建议 |
        机构视角信号基于历史偏好ETF池重新计算，非真实持仓数据 |
        本工具定位为中长线仓位管理辅助，信号频率约每月2～4次
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, InfoFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  getTodaySignal, getETFData, getSignalHistory, getAnomalies,
  getStatus, triggerCollection
} from '@/api/nationalTeam'

// ==================== 常量 ====================

const ETFS = [
  { code: '510300', name: '沪深300ETF' },
  { code: '510050', name: '上证50ETF' },
  { code: '510500', name: '中证500ETF' },
  { code: '512100', name: '中证1000ETF' },
  { code: '588000', name: '科创50ETF' },
  { code: '563000', name: '中证A500ETF' }
]

const AGENCIES = [
  { key: 'overview', label: '总览', icon: '🏛️', etfs: ['510300','510050','510500','512100','588000','563000'] },
  { key: 'zghj',     label: '中央汇金',icon: '🏦', etfs: ['510300','510050'] },
  { key: 'zjgs',     label: '证金公司',icon: '📊', etfs: ['510300','510500','510050'] },
  { key: 'sbjj',     label: '社保基金',icon: '🛡️', etfs: ['510300','510050','510500','512100','588000','563000'] },
  { key: 'wgj',      label: '外管局',  icon: '🌐', etfs: ['510050','510300'] },
  { key: 'djj',      label: '国家大基金',icon: '💻', etfs: ['588000','512100'] }
]

const SIGNAL_LEVEL_CONFIG = {
  extreme_low:  { label: '极度低估', color: '#ff4757', css: 'extreme-low' },
  low:          { label: '低估区间', color: '#ff6b81', css: 'low' },
  normal:       { label: '正常区间', color: '#ffa502', css: 'normal' },
  high:         { label: '高估区间', color: '#1e90ff', css: 'high' },
  extreme_high: { label: '泡沫区间', color: '#ff4757', css: 'extreme-high' }
}

// ==================== 状态 ====================

const today = new Date().toISOString().slice(0, 10)
const selectedDate = ref(today)
const currentAgency = ref('overview')
const triggering = ref(false)
const triggerStatus = ref('')
const signalLoading = ref(true)

const signalData = ref(null)
const statusData = ref({ current: '--', lastUpdate: null, healthy: true })
const anomalyData = ref([])
const agencySignals = reactive({})
const statsData = ref(null)
const backtestData = ref(null)

const allETFData = ref([])
const allHistoryData = ref([])
const etfChartInstances = {}
const chartRefs = {}

const comparisonChartRef = ref(null)
const heatmapChartRef = ref(null)
const cumulativeChartRef = ref(null)
let comparisonChart = null
let heatmapChart = null
let cumulativeChart = null

// ==================== 计算属性 ====================

const currentAgencyLabel = computed(() => {
  return AGENCIES.find(a => a.key === currentAgency.value)?.label || '总览'
})

const currentAgencyETFs = computed(() => {
  return AGENCIES.find(a => a.key === currentAgency.value)?.etfs || []
})

const signalLevelConfig = computed(() => {
  return signalData.value ? (SIGNAL_LEVEL_CONFIG[signalData.value.signal_level] || SIGNAL_LEVEL_CONFIG.normal) : {}
})

const signalLevelColor = computed(() => signalLevelConfig.value.color || '#999')
const signalLevelClass = computed(() => signalLevelConfig.value.css || 'normal')

// ==================== 辅助函数 ====================

function isETFFocused(code) {
  return currentAgencyETFs.value.includes(code)
}

function getLevelColor(level) {
  return SIGNAL_LEVEL_CONFIG[level]?.color || '#999'
}

function factorColor(score) {
  if (score >= 70) return '#ff4757'
  if (score >= 50) return '#ffa502'
  if (score >= 30) return '#3742fa'
  return '#2ed573'
}

function formatMoney(val) {
  if (val == null) return '--'
  const abs = Math.abs(val)
  const sign = val > 0 ? '+' : val < 0 ? '-' : ''
  if (abs >= 1e8) return sign + (abs / 1e8).toFixed(1) + '亿'
  if (abs >= 1e4) return sign + (abs / 1e4).toFixed(1) + '万'
  return sign + abs.toFixed(0)
}

function setChartRef(code, el) {
  if (el) chartRefs[code] = el
}

// ==================== 数据获取 ====================

async function fetchAllData(date) {
  signalLoading.value = true
  const d = date || today

  try {
    // 并行获取所有数据
    const [signalRes, etfRes, historyRes, allHistoryRes, anomalyRes, statusRes] = await Promise.all([
      getTodaySignal(d, currentAgency.value),
      getETFData({ days: 90 }),
      getSignalHistory(90, currentAgency.value),
      getSignalHistory(90),  // all agencies
      getAnomalies(7),
      getStatus()
    ])

    if (signalRes?.code === 0 && signalRes?.data) signalData.value = signalRes.data
    else signalData.value = null

    if (etfRes?.code === 0 && etfRes?.data) allETFData.value = etfRes.data
    if (historyRes?.code === 0 && historyRes?.data) allHistoryData.value = historyRes.data
    if (anomalyRes?.code === 0 && anomalyRes?.data) anomalyData.value = anomalyRes.data

    if (statusRes?.code === 0 && statusRes?.data) {
      statusData.value = {
        current: statusRes.data.current || '--',
        lastUpdate: statusRes.data.lastUpdate || null,
        healthy: statusRes.data.healthy !== false
      }
    }

    // 获取所有机构今日信号（用于Tab圆点）
    const agencyPromises = AGENCIES.map(a =>
      getTodaySignal(d, a.key).then(r => ({ key: a.key, data: r?.code === 0 ? r?.data : null }))
    )
    const agencyResults = await Promise.all(agencyPromises)
    for (const r of agencyResults) {
      if (r.data) agencySignals[r.key] = r.data
    }

    // 计算统计数据
    calcStats(allHistoryRes?.data || [])

    // 计算回测
    calcBacktest(etfRes?.data || [])

  } catch (err) {
    console.error('数据获取失败:', err)
  } finally {
    signalLoading.value = false
    await nextTick()
    renderAllCharts()
  }
}

function calcStats(historySignals) {
  if (!historySignals || historySignals.length === 0) {
    statsData.value = null
    return
  }
  const overviewSignals = historySignals.filter(s => s.agency === 'overview')
  const buyCount = overviewSignals.filter(s => ['extreme_low', 'low'].includes(s.signal_level)).length
  const sellCount = overviewSignals.filter(s => ['high', 'extreme_high'].includes(s.signal_level)).length
  const lastBuy = overviewSignals.filter(s => ['extreme_low', 'low'].includes(s.signal_level)).pop()
  const daysSince = lastBuy ? Math.floor((new Date(today) - new Date(lastBuy.date)) / 86400000) : 0

  // 今日资金流向
  const todayRows = allETFData.value.filter(d => d.date === today)
  const netFlow = todayRows.reduce((sum, d) => sum + ((d.share_change || 0) * (d.close_price || 0)), 0)
  const totalAmount = todayRows.reduce((sum, d) => sum + (d.amount || 0), 0)

  statsData.value = {
    monitoringDays: overviewSignals.length,
    buySignals: buyCount,
    sellSignals: sellCount,
    lastBuyDays: lastBuy ? daysSince : '--',
    todayNetFlow: netFlow || null,
    todayAmount: totalAmount || null
  }
}

function calcBacktest(etfData) {
  const hs300Data = etfData.filter(d => d.code === '510300').sort((a, b) => a.date.localeCompare(b.date))
  if (hs300Data.length < 2) { backtestData.value = null; return }

  const latest = hs300Data[hs300Data.length - 1]
  const todayPrice = latest.close_price
  if (!todayPrice) { backtestData.value = null; return }

  const intervals = [7, 30, 90]
  const results = []
  for (const days of intervals) {
    const idx = hs300Data.length - 1 - days
    if (idx < 0) continue
    const past = hs300Data[Math.max(0, idx)]
    if (!past.close_price) continue
    const ret = ((todayPrice - past.close_price) / past.close_price * 100).toFixed(1)
    results.push({
      days,
      returnVal: parseFloat(ret),
      action: past.close_price < todayPrice ? '上涨 📈' : '下跌 📉'
    })
  }
  backtestData.value = results.length > 0 ? results : null
}

// ==================== 图标渲染 ====================

function renderAllCharts() {
  renderETFCharts()
  renderComparisonChart()
  renderHeatmapChart()
  renderCumulativeChart()
}

function makeChartOption(xData, barData, lineData, costLine, etfName, barName = '份额变化') {
  return {
    backgroundColor: 'transparent',
    grid: { left: 45, right: 15, top: 15, bottom: 30 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: xData, axisLabel: { fontSize: 10, color: '#888' }, axisLine: { lineStyle: { color: '#333' } } },
    yAxis: [
      {
        type: 'value',
        name: '份额变化(亿)',
        nameTextStyle: { fontSize: 10, color: '#888' },
        axisLabel: { fontSize: 10, color: '#888', formatter: v => (v / 1e8).toFixed(1) },
        splitLine: { lineStyle: { color: '#222' } }
      },
      {
        type: 'value',
        name: '价格',
        nameTextStyle: { fontSize: 10, color: '#888' },
        axisLabel: { fontSize: 10, color: '#888', formatter: v => v?.toFixed(2) },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: barName,
        type: 'bar',
        data: barData,
        itemStyle: {
          color: params => params.value >= 0 ? '#ef4444' : '#22c55e'
        },
        yAxisIndex: 0
      },
      {
        name: '收盘价',
        type: 'line',
        data: lineData,
        smooth: true,
        lineStyle: { color: '#3b82f6', width: 1.5 },
        symbol: 'none',
        yAxisIndex: 1
      },
      ...(costLine != null ? [{
        name: '成本线',
        type: 'line',
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#f59e0b', type: 'dashed', width: 1 },
          data: [{ yAxis: costLine, label: { formatter: `成本 ${costLine.toFixed(2)}`, fontSize: 10, color: '#f59e0b' } }]
        },
        data: []
      }] : [])
    ]
  }
}

function renderETFCharts() {
  const data = allETFData.value
  if (!data || data.length === 0) return

  for (const etf of ETFS) {
    const el = chartRefs[etf.code]
    if (!el) continue

    const etfRows = data.filter(d => d.code === etf.code).sort((a, b) => a.date.localeCompare(b.date))
    const xData = etfRows.map(d => d.date.slice(5)) // MM-DD
    const barData = etfRows.map(d => d.share_change || 0)
    const lineData = etfRows.map(d => d.close_price)

    // 成本线（从当前信号的 cost_line 字段获取）
    let costLine = null
    if (signalData.value?.cost_line != null) {
      costLine = signalData.value.cost_line
    }

    let instance = etfChartInstances[etf.code]
    if (!instance) {
      instance = echarts.init(el)
      etfChartInstances[etf.code] = instance
    }
    instance.setOption(makeChartOption(xData, barData, lineData, costLine, etf.name), true)
  }
}

function renderComparisonChart() {
  const el = comparisonChartRef.value
  if (!el) return

  if (!comparisonChart) comparisonChart = echarts.init(el)

  // 按机构分组
  const agencyColors = {
    overview: '#f59e0b', zghj: '#ff4757', zjgs: '#3b82f6',
    sbjj: '#22c55e', wgj: '#8b5cf6', djj: '#f97316'
  }

  const allSignals = allHistoryData.value
  if (!allSignals || allSignals.length === 0) {
    comparisonChart.setOption({
      backgroundColor: 'transparent',
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#666', fontSize: 14 } }
    })
    return
  }

  const dates = [...new Set(allSignals.map(s => s.date))].sort()
  const series = AGENCIES.map(ag => {
    const map = {}
    allSignals.filter(s => s.agency === ag.key).forEach(s => { map[s.date] = s.overall_score })
    return {
      name: ag.label,
      type: 'line',
      data: dates.map(d => map[d] ?? null),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: agencyColors[ag.key] || '#999', width: 1.5 },
      connectNulls: false
    }
  })

  comparisonChart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { color: '#aaa', fontSize: 10 }, data: AGENCIES.map(a => a.label) },
    xAxis: { type: 'category', data: dates.map(d => d.slice(5)), axisLabel: { fontSize: 10, color: '#888' } },
    yAxis: {
      type: 'value', min: 0, max: 100,
      splitLine: { lineStyle: { color: '#222' } },
      axisLabel: { fontSize: 10, color: '#888' }
    },
    series
  }, true)
}

function renderHeatmapChart() {
  const el = heatmapChartRef.value
  if (!el) return

  if (!heatmapChart) heatmapChart = echarts.init(el)

  const signals = (allHistoryData.value || [])
    .filter(s => s.agency === 'overview')

  if (signals.length === 0) {
    heatmapChart.setOption({
      backgroundColor: 'transparent',
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#666', fontSize: 14 } }
    })
    return
  }

  // 按周分组构建热力图
  const data = []
  const weekMap = {}
  signals.forEach(s => {
    const d = new Date(s.date)
    const week = getWeekNumber(d)
    const day = d.getDay() || 7
    if (!weekMap[week]) weekMap[week] = new Array(8).fill(null)
    weekMap[week][day] = s.overall_score
  })

  const weeks = Object.keys(weekMap).sort((a, b) => Number(a) - Number(b)).slice(-26)
  const days = ['', '一', '二', '三', '四', '五', '六', '日']

  weeks.forEach((week, wi) => {
    for (let di = 1; di <= 7; di++) {
      const val = weekMap[week][di]
      if (val != null) {
        data.push([wi, di - 1, val])
      }
    }
  })

  heatmapChart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 70, right: 20, top: 10, bottom: 20 },
    tooltip: {
      formatter: p => {
        if (!p.data) return ''
        return `评分: ${p.data[2]} 分<br/>${getScoreLabel(p.data[2])}`
      }
    },
    xAxis: { type: 'category', data: weeks.map((w, i) => `W${w.slice(-2)}`), axisLabel: { fontSize: 9, color: '#888' }, position: 'top' },
    yAxis: { type: 'category', data: days, axisLabel: { fontSize: 10, color: '#888' } },
    visualMap: {
      min: 0, max: 100, calculable: true,
      orient: 'horizontal', left: 'center', bottom: 0,
      inRange: { color: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#dc2626'] },
      textStyle: { color: '#888', fontSize: 9 }
    },
    series: [{
      type: 'heatmap',
      data,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } }
    }]
  }, true)
}

function getWeekNumber(d) {
  const start = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7)
}

function getScoreLabel(score) {
  if (score <= 30) return '极度低估'
  if (score <= 40) return '低估'
  if (score <= 50) return '正常'
  if (score <= 70) return '高估'
  return '泡沫'
}

function renderCumulativeChart() {
  const el = cumulativeChartRef.value
  if (!el) return

  if (!cumulativeChart) cumulativeChart = echarts.init(el)

  const data = allETFData.value
  if (!data || data.length === 0) {
    cumulativeChart.setOption({
      backgroundColor: 'transparent',
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#666', fontSize: 14 } }
    })
    return
  }

  const dates = [...new Set(data.map(d => d.date))].sort()
  const series = ETFS.map(etf => {
    const etfData = data.filter(d => d.code === etf.code)
    const dateMap = {}
    etfData.forEach(d => { dateMap[d.date] = d.share_change || 0 })
    let cum = 0
    const cumData = dates.map(d => {
      cum += (dateMap[d] || 0)
      return cum
    })
    return { name: etf.name, type: 'line', data: cumData, smooth: true, symbol: 'none',
      lineStyle: { width: 1.5 }, areaStyle: { opacity: 0.1 } }
  })

  cumulativeChart.setOption({
    backgroundColor: 'transparent',
    color: ['#3b82f6','#ef4444','#22c55e','#f59e0b','#8b5cf6','#06b6d4'],
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { color: '#aaa', fontSize: 10 } },
    xAxis: { type: 'category', data: dates.map(d => d.slice(5)), axisLabel: { fontSize: 10, color: '#888' } },
    yAxis: {
      type: 'value',
      name: '累计(亿份)',
      nameTextStyle: { fontSize: 10, color: '#888' },
      axisLabel: { fontSize: 10, color: '#888', formatter: v => (v / 1e8).toFixed(1) },
      splitLine: { lineStyle: { color: '#222' } }
    },
    series
  }, true)
}

// ==================== 交互 ====================

function switchAgency(key) {
  currentAgency.value = key
  fetchAllData(selectedDate.value)
}

function onDateChange(date) {
  fetchAllData(date)
}

async function handleTrigger() {
  triggering.value = true
  triggerStatus.value = '🔄 正在连接数据源...'
  try {
    const res = await triggerCollection(selectedDate.value)
    triggerStatus.value = '📊 数据采集完成，正在计算信号...'
    if (res?.code === 0) {
      ElMessage.success('✅ 数据刷新已触发，正在后台计算...')

      // 轮询等待后台任务完成（通过状态接口检测）
      let retries = 0
      while (retries < 10) {
        await new Promise(r => setTimeout(r, 2000))
        const statusRes = await getStatus()
        if (statusRes?.code === 0 && statusRes?.data?.latestLog?.status === 'success') {
          ElMessage.success('📊 信号计算完成')
          break
        }
        if (statusRes?.code === 0 && statusRes?.data?.latestLog?.status === 'failed') {
          ElMessage.warning('⚠️ 任务执行失败：' + (statusRes.data.latestLog.error_msg || '未知错误'))
          break
        }
        retries++
      }
      if (retries >= 10) {
        ElMessage.warning('⏳ 任务可能仍在执行，请稍后刷新页面查看')
      }
      await fetchAllData(selectedDate.value)
    } else {
      ElMessage.error('❌ 数据刷新失败：' + (res?.message || '未知错误'))
    }
  } catch (err) {
    ElMessage.error('❌ 请求失败：' + err.message)
  } finally {
    triggering.value = false
    triggerStatus.value = ''
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchAllData(today)
})

onUnmounted(() => {
  Object.values(etfChartInstances).forEach(c => c?.dispose())
  comparisonChart?.dispose()
  heatmapChart?.dispose()
  cumulativeChart?.dispose()
})
</script>

<style lang="scss" scoped>
.nt-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 24px;
  color: #e0e0e0;
  overflow-x: hidden;
}

// Hero
.nt-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
.nt-title { font-size: 22px; font-weight: 700; color: #f0f0f0; }
.nt-subtitle { font-size: 12px; color: #999; margin-top: 4px; }
.nt-hero-right {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.nt-source-badge {
  padding: 4px 12px; border-radius: 12px; font-size: 12px;
  background: #1a2a1a; color: #4ade80; border: 1px solid #4ade8040;
  &.err { background: #2a1a1a; color: #f87171; border-color: #f8717140; }
}
.nt-update-time { font-size: 12px; color: #666; }

// Signal Card
.nt-signal-card {
  display: flex; gap: 24px; padding: 24px;
  background: linear-gradient(135deg, #1a1d2e 0%, #1e2135 100%);
  border: 1px solid #2a2d3e; border-radius: 16px; margin-bottom: 20px;
  align-items: center; flex-wrap: wrap;
}
.nt-signal-main { display: flex; align-items: center; gap: 20px; }
.nt-score-ring {
  width: 90px; height: 90px; border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  border: 3px solid #333;
  flex-shrink: 0;
  &.extreme-low { border-color: #ff4757; box-shadow: 0 0 20px #ff475730; }
  &.low { border-color: #ff6b81; }
  &.normal { border-color: #ffa502; }
  &.high { border-color: #1e90ff; }
  &.extreme-high { border-color: #ff4757; box-shadow: 0 0 20px #ff475730; }
}
.nt-score-num { font-size: 28px; font-weight: 800; color: #f0f0f0; }
.nt-score-label { font-size: 10px; color: #888; margin-top: 1px; }
.nt-signal-level { font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.nt-signal-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.nt-signal-suggestion { font-size: 14px; color: #bbb; margin-top: 8px; line-height: 1.5; max-width: 400px; }
.nt-signal-position { font-size: 14px; color: #999; margin-top: 6px; strong { color: #f59e0b; } }
.nt-signal-factors { flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: 14px; }
.nt-factor-name { font-size: 12px; color: #999; margin-bottom: 4px; display: block; }
.nt-consecutive-warn { font-size: 13px; color: #f59e0b; margin-top: 4px; }

// Empty signal
.nt-empty-signal {
  text-align: center; padding: 40px; color: #666; font-size: 15px;
  background: #1a1d2e; border: 1px dashed #333; border-radius: 12px; margin-bottom: 24px;
}

// Stats Row
.nt-stats-row {
  display: grid; grid-template-columns: repeat(6, 1fr);
  gap: 10px; margin-bottom: 20px;
  @media (max-width: 900px) { grid-template-columns: repeat(3, 1fr); }
}
.nt-stat-card {
  background: #1a1d2e; border: 1px solid #2a2d3e; border-radius: 10px;
  padding: 12px 8px; text-align: center;
}
.nt-stat-val { display: block; font-size: 18px; font-weight: 700; color: #f0f0f0; }
.nt-stat-lbl { font-size: 11px; color: #888; margin-top: 2px; display: block; }

// Tabs
.nt-tabs-section { margin-bottom: 20px; }
.nt-tabs { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px; }
.nt-tab-btn {
  padding: 6px 14px; border: 1px solid #2a2d3e; border-radius: 8px;
  background: #1a1d2e; color: #999; font-size: 12px; cursor: pointer;
  display: flex; align-items: center; gap: 5px; transition: all 0.2s;
  &:hover { border-color: #444; color: #ddd; }
  &.active { background: #2a2d4e; border-color: #3b82f6; color: #3b82f6; font-weight: 600; }
}
.nt-tab-icon { font-size: 14px; }
.nt-tab-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.nt-agency-note {
  font-size: 12px; color: #666; display: flex; align-items: center; gap: 6px;
}

// Section title
.nt-section-title { font-size: 15px; font-weight: 600; color: #ddd; margin-bottom: 12px; }

// ETF Charts Grid
.nt-charts-section { margin-bottom: 20px; }
.nt-etf-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
  @media (max-width: 1000px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 650px) { grid-template-columns: 1fr; }
}
.nt-etf-chart-item {
  background: #1a1d2e; border: 1px solid #2a2d3e; border-radius: 10px;
  padding: 10px; transition: border-color 0.3s;
  &.highlighted { border-color: #f59e0b50; box-shadow: 0 0 12px #f59e0b10; }
}
.nt-etf-chart-header { display: flex; gap: 6px; align-items: baseline; margin-bottom: 4px; }
.nt-etf-code { font-size: 14px; font-weight: 700; color: #f0f0f0; }
.nt-etf-name { font-size: 11px; color: #888; }
.nt-etf-chart { width: 100%; height: 170px; }

// Bottom Charts
.nt-bottom-charts {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;
  @media (max-width: 800px) { grid-template-columns: 1fr; }
}
.nt-bottom-chart-panel {
  background: #1a1d2e; border: 1px solid #2a2d3e; border-radius: 10px;
  padding: 14px;
  min-width: 0;
}
.nt-big-chart { width: 100%; height: 300px; }

// Backtest
.nt-backtest {
  background: #1a1d2e; border: 1px solid #2a2d3e; border-radius: 10px;
  padding: 16px 20px; margin-bottom: 20px;
}
.nt-backtest-row { display: flex; gap: 20px; flex-wrap: wrap; }
.nt-backtest-item { text-align: center; padding: 12px 20px; background: #1e2135; border-radius: 10px; }
.nt-backtest-days { font-size: 12px; color: #888; display: block; }
.nt-backtest-return { font-size: 22px; font-weight: 700; &.up { color: #22c55e; } &.down { color: #ef4444; } }
.nt-backtest-action { font-size: 12px; color: #666; display: block; margin-top: 4px; }
.nt-backtest-note { font-size: 11px; color: #555; margin-top: 14px; }

// Footer
.nt-footer {
  text-align: center; padding: 16px; font-size: 11px; color: #555; line-height: 1.8;
  border-top: 1px solid #222; margin-top: 24px;
}
</style>

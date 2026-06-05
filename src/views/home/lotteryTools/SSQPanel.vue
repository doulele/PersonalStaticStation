<template>
  <div class="ssq-panel">
    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-row">
        <div class="form-item">
          <label>数据起始日期</label>
          <el-date-picker
            v-model="startDate"
            type="date"
            placeholder="选择起始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            size="default"
          />
        </div>
        <div class="form-item">
          <label>结束日期</label>
          <el-date-picker
            v-model="endDate"
            type="date"
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            size="default"
          />
        </div>
        <div class="form-item">
          <label>算法模式</label>
          <el-select v-model="algoMode" size="default" style="width: 180px">
            <el-option label="基础概率 (频率)" value="prob" />
            <el-option label="加权概率 (时间衰减)" value="weighted" />
          </el-select>
        </div>
        <div class="form-item">
          <label>每组方案数量</label>
          <el-input-number v-model="recCount" :min="1" :max="20" size="default" />
        </div>
        <div class="form-item decay-item" v-if="algoMode === 'weighted'">
          <label>衰减因子 λ: {{ decayLambda }}</label>
          <el-slider class="decay-lambda" v-model="decayLambda" :min="0.03" :max="0.15" :step="0.01" :show-tooltip="true" />
        </div>
        <div class="form-item form-actions">
          <el-button type="danger" @click="refreshAll" :icon="RefreshRight">
            开始分析/刷新
          </el-button>
          <el-button type="primary" @click="fetchFromMultipleAPI" :icon="Upload">
            尝试API更新数据
          </el-button>
        </div>
      </div>
      <div class="status-row">
        <el-tag type="info" size="default">
          <el-icon><DataLine /></el-icon> 数据状态: {{ dataStatus }}
        </el-tag>
        <el-tag size="default">
          <el-icon><Calendar /></el-icon> 有效期数: {{ periodCount }} 期
        </el-tag>
        <el-button class="export-btn" @click="exportData" :icon="Download">导出统计JSON</el-button>
        <label class="import-label">
          <el-icon><FolderOpened /></el-icon> 导入用户数据(JSON)
          <input type="file" accept=".json" style="display:none" @change="handleImportData" />
        </label>
      </div>
    </div>

    <!-- 走势图区域 -->
    <div class="card chart-card">
      <div class="chart-tabs">
        <el-button
          v-for="tab in chartTabs"
          :key="tab.key"
          :type="currentChart === tab.key ? 'danger' : 'default'"
          size="default"
          @click="switchChart(tab.key)"
        >
          {{ tab.label }}
        </el-button>
      </div>
      <div ref="chartRef" class="chart-box"></div>
    </div>

    <!-- 概率统计 -->
    <div class="prob-grid">
      <div class="card">
        <h3 class="card-header">
          <span class="header-dot red"></span> 红球出现概率 (1-33)
        </h3>
        <div class="prob-table red-table">
          <div
            v-for="n in 33"
            :key="'r'+n"
            class="prob-item"
            :class="{ highlight: redProb[n] > 6 }"
          >
            <strong>{{ n }}</strong>
            <span>{{ (redProb[n] || 0).toFixed(2) }}%</span>
          </div>
        </div>
      </div>
      <div class="card">
        <h3 class="card-header">
          <span class="header-dot blue"></span> 蓝球出现概率 (1-16)
        </h3>
        <div class="prob-table blue-table">
          <div
            v-for="n in 16"
            :key="'b'+n"
            class="prob-item blue-item"
            :class="{ highlight: blueProb[n] > 10 }"
          >
            <strong>{{ n }}</strong>
            <span>{{ (blueProb[n] || 0).toFixed(2) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 位置概率矩阵 -->
    <div class="card">
      <h3 class="card-header">
        <span class="header-dot purple"></span> 位置概率矩阵 (第1位~第6位红球)
      </h3>
      <div class="matrix-grid">
        <div class="matrix-card" v-for="p in 6" :key="'pos'+p">
          <div class="matrix-card-header">
            <span class="matrix-pos-label">第{{ p }}位</span>
          </div>
          <div class="matrix-card-numbers">
            <span
              v-for="n in 33"
              :key="'c'+p+'-'+n"
              class="matrix-num"
              :class="getMatrixCellClass(posProb[`pos${p}`]?.[n] || 0)"
            >
              <em>{{ n }}</em>
              <small>{{ (posProb[`pos${p}`]?.[n] || 0).toFixed(1) }}%</small>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 三组方案 -->
    <div class="card">
      <h3 class="card-header">
        <span class="header-dot gold"></span> 分析方案 (每组{{ recCount }}注)
      </h3>

      <div class="rec-section rec-comp">
        <div class="rec-section-header">
          <span class="rec-section-icon">✨</span>
          <div>
            <h4 class="rec-label">综合方案</h4>
            <p class="rec-desc">{{ algoMode === 'weighted' ? '加权概率' : '基础概率' }}模式 · 智能生成</p>
          </div>
        </div>
        <div class="rec-group">
          <div
            v-for="(combo, i) in compRecs"
            :key="'c'+i"
            class="rec-card"
            :class="{ 'rec-selected': selectedCombos.has('comp-'+i) }"
            @click="toggleCombo('comp-'+i, combo)"
          >
            <div class="rec-numbers">
              <span v-for="r in combo.reds" :key="r" class="rec-num red-num">{{ r }}</span>
              <span class="rec-num blue-num">{{ combo.blue }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="rec-section rec-global">
        <div class="rec-section-header">
          <span class="rec-section-icon">📊</span>
          <div>
            <h4 class="rec-label">整体概率方案</h4>
            <p class="rec-desc">基于数字出现频率 · 全局统计</p>
          </div>
        </div>
        <div class="rec-group">
          <div
            v-for="(combo, i) in globalRecs"
            :key="'g'+i"
            class="rec-card"
            :class="{ 'rec-selected': selectedCombos.has('global-'+i) }"
            @click="toggleCombo('global-'+i, combo)"
          >
            <div class="rec-numbers">
              <span v-for="r in combo.reds" :key="r" class="rec-num red-num">{{ r }}</span>
              <span class="rec-num blue-num">{{ combo.blue }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="rec-section rec-position">
        <div class="rec-section-header">
          <span class="rec-section-icon">🎯</span>
          <div>
            <h4 class="rec-label">位置概率方案</h4>
            <p class="rec-desc">基于每个位置的历史概率 · 精准定位</p>
          </div>
        </div>
        <div class="rec-group">
          <div
            v-for="(combo, i) in posRecs"
            :key="'p'+i"
            class="rec-card"
            :class="{ 'rec-selected': selectedCombos.has('pos-'+i) }"
            @click="toggleCombo('pos-'+i, combo)"
          >
            <div class="rec-numbers">
              <span v-for="r in combo.reds" :key="r" class="rec-num red-num">{{ r }}</span>
              <span class="rec-num blue-num">{{ combo.blue }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户评测 -->
    <div class="card">
      <h3 class="card-header">
        <span class="header-dot green"></span> 自定义数字评测系统
      </h3>
      <div class="control-row">
        <div class="form-item" style="flex:1">
          <label>红球 (6个, 1-33, 逗号分隔)</label>
          <el-input v-model="userReds" placeholder="例: 5,12,18,23,29,31" />
        </div>
        <div class="form-item" style="max-width:120px">
          <label>蓝球 (1-16)</label>
          <el-input-number v-model="userBlue" :min="1" :max="16" />
        </div>
        <div class="form-item form-actions">
          <el-button type="warning" @click="evalSingle" :icon="TrendCharts">评测单注</el-button>
          <el-button type="primary" @click="triggerBatchImport" :icon="FolderOpened">批量评测CSV</el-button>
          <input type="file" accept=".csv" ref="batchCsvRef" style="display:none" @change="handleBatchCsv" />
        </div>
      </div>
      <div v-if="evalResult" class="eval-result">{{ evalResult }}</div>
    </div>

    <!-- 历史回测 -->
    <div class="card">
      <h3 class="card-header">
        <span class="header-dot orange"></span> 历史回测 (基于当前数据集)
      </h3>
      <div class="control-row">
        <div class="form-item" style="flex:1">
          <label>固定数字组合 (可选, 留空则用综合方案第一注)</label>
          <el-input v-model="backtestReds" placeholder="红球, 如 1,2,3,4,5,6" />
        </div>
        <div class="form-item" style="max-width:120px">
          <label>蓝球</label>
          <el-input-number v-model="backtestBlue" :min="1" :max="16" />
        </div>
        <div class="form-item form-actions">
          <el-button type="success" @click="runBacktest" :icon="Timer">开始回测命中率</el-button>
        </div>
      </div>
      <div v-if="backtestResult" class="eval-result">{{ backtestResult }}</div>
    </div>
    <!-- 悬浮生成按钮 -->
    <transition name="fab-fade">
      <div v-if="selectedCombos.size > 0" class="fab-generate" @click="showTicketDialog = true">
        <span class="fab-badge">{{ selectedCombos.size }}</span>
        <span class="fab-text">生成球组</span>
      </div>
    </transition>

    <!-- 彩票票面弹框 -->
    <TicketDialog
      type="ssq"
      :visible="showTicketDialog"
      :combos="ticketCombos"
      :time="ticketTime"
      :serial="ticketSerial"
      :issue="ticketIssue"
      :station="ticketStation"
      :flow="ticketFlow"
      :verify-code="verifyCode"
      @close="showTicketDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  RefreshRight, Upload, DataLine, Calendar, Download,
  FolderOpened, TrendCharts, Timer
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  weightedSampleWithoutReplace,
  weightedSampleOne,
  buildBuiltInDataset,
  computeStatistics,
} from './utils.js'
import TicketDialog from '@/components/lottery/TicketDialog.vue'

// ==================== 双色球配置 ====================
const RED_MAX = 33
const BLUE_MAX = 16
const RED_PICK = 6
const RED_LABEL = '红球'
const BLUE_LABEL = '蓝球'

// ==================== 数据状态 ====================
const rawHistory = ref([])
const startDate = ref('2020-01-01')
const endDate = ref('')
const algoMode = ref('weighted')
const decayLambda = ref(0.07)
const recCount = ref(10)

const redProb = ref(new Array(RED_MAX + 1).fill(0))
const blueProb = ref(new Array(BLUE_MAX + 1).fill(0))
const posProb = ref({})
const periodCount = ref(0)
const dataStatus = ref('加载内置数据中...')

const globalRecs = ref([])
const posRecs = ref([])
const compRecs = ref([])

// ==================== 球组选中 ====================
const selectedCombos = ref(new Set())
const showTicketDialog = ref(false)
const ticketTime = ref('')
const ticketSerial = ref('')
const ticketIssue = ref('')
const ticketStation = ref('')
const ticketFlow = ref('')

// 验票码（每次弹框打开时生成）
const verifyCode = ref('')

const ticketCombos = computed(() => {
  const result = []
  const allCombos = [
    ...compRecs.value.map((c, i) => ({ id: 'comp-' + i, ...c })),
    ...globalRecs.value.map((c, i) => ({ id: 'global-' + i, ...c })),
    ...posRecs.value.map((c, i) => ({ id: 'pos-' + i, ...c })),
  ]
  for (const c of allCombos) {
    if (selectedCombos.value.has(c.id)) {
      result.push(c)
    }
  }
  return result
})

function toggleCombo(id, combo) {
  const s = new Set(selectedCombos.value)
  if (s.has(id)) {
    s.delete(id)
  } else {
    s.add(id)
  }
  selectedCombos.value = s
}

// 生成随机序列号
function genSerial() {
  const chars = '0123456789ABCDEF'
  let s = ''
  for (let i = 0; i < 20; i++) s += chars[Math.floor(Math.random() * 16)]
  return s
}

// 生成随机流水号
function genFlowNo() {
  return String(Math.floor(Math.random() * 90000000) + 10000000)
}

// 生成随机站点号
function genStationNo() {
  const area = String(Math.floor(Math.random() * 900000) + 100000)
  const shop = String(Math.floor(Math.random() * 9000) + 1000)
  return area + shop
}

// 生成模拟期号
function genIssue() {
  const now = new Date()
  const year = now.getFullYear()
  // 大致估算：每周开3期(二四日)，一年约156期
  const weekNum = Math.ceil(
    (new Date(year, now.getMonth(), now.getDate()) - new Date(year, 0, 1)) / (7 * 86400000)
  )
  return `${year}${String(weekNum * 3).padStart(3, '0')}`
}

// 生成验票码
function genVerifyCode() {
  const chars = '0123456789ABCDEF'
  let s = ''
  for (let i = 0; i < 32; i++) s += chars[Math.floor(Math.random() * 16)]
  return s
}

// 弹框打开时更新时间、生成验票码
watch(showTicketDialog, (val) => {
  if (val) {
    ticketTime.value = new Date().toLocaleString('zh-CN')
    ticketSerial.value = genSerial()
    ticketIssue.value = genIssue()
    ticketStation.value = genStationNo()
    ticketFlow.value = genFlowNo()
    verifyCode.value = genVerifyCode()
  }
})

// ==================== 图表 ====================
const chartRef = ref(null)
let chartInstance = null
const currentChart = ref('hotCold')
const chartTabs = [
  { key: 'hotCold', label: '🔥 冷热条形图' },
  { key: 'redDist', label: '📊 红球频次分布' },
  { key: 'blueDist', label: '🔵 蓝球频次分布' },
]

// ==================== 用户评测 ====================
const userReds = ref('')
const userBlue = ref(1)
const evalResult = ref('')
const batchCsvRef = ref(null)

// ==================== 回测 ====================
const backtestReds = ref('')
const backtestBlue = ref(1)
const backtestResult = ref('')

// ==================== API 获取 ====================
async function fetchFromMultipleAPI() {
  const apiList = [
    'https://f.apiplus.net/ssq.json',
    'https://www.lottery.gov.cn/api/ssq.json',
  ]
  for (const api of apiList) {
    try {
      const res = await fetch(api, { mode: 'cors', cache: 'no-cache' })
      if (res.ok) {
        alert('API数据获取成功(演示模式)，由于跨域限制实际未能合并，已保留内置数据。')
        return false
      }
    } catch (e) {
      console.log('API fail:', api)
    }
  }
  alert('API访问受限，当前使用内置数据集。您可导入JSON文件。')
  return false
}

// ==================== 核心统计 ====================
function doComputeStatistics() {
  const sd = startDate.value
  const ed = endDate.value || new Date().toISOString().slice(0, 10)
  let filtered = rawHistory.value.filter(item => item.date >= sd && item.date <= ed)
  if (filtered.length === 0) filtered = rawHistory.value.slice()

  const stats = computeStatistics(filtered, {
    mode: algoMode.value,
    lambda: decayLambda.value,
    redMax: RED_MAX,
    blueMax: BLUE_MAX,
    redPickCount: RED_PICK,
  })
  redProb.value = stats.redProb
  blueProb.value = stats.blueProb
  posProb.value = stats.posProb
  periodCount.value = stats.periodCount
  dataStatus.value = `内置 ${rawHistory.value.length} 期`
}

// ==================== 方案生成 ====================
function generateGlobalProbRecs(num) {
  const redWeights = redProb.value.slice(1, RED_MAX + 1)
  const blueWeights = blueProb.value.slice(1, BLUE_MAX + 1)
  const recs = []
  for (let i = 0; i < num; i++) {
    const reds = weightedSampleWithoutReplace(redWeights, RED_MAX, RED_PICK)
    reds.sort((a, b) => a - b)
    const blueIdx = weightedSampleOne(blueWeights, BLUE_MAX)
    recs.push({ reds, blue: blueIdx + 1 })
  }
  return recs
}

function generatePositionProbRecs(num) {
  const recs = []
  const maxAttempts = 30
  for (let i = 0; i < num; i++) {
    let success = false
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const selected = new Array(RED_PICK)
      const used = new Set()
      let valid = true
      for (let pos = 1; pos <= RED_PICK; pos++) {
        const posWeight = posProb.value[`pos${pos}`].slice(1, RED_MAX + 1)
        const idx = weightedSampleOne(posWeight, RED_MAX)
        const numVal = idx + 1
        if (used.has(numVal)) {
          valid = false
          break
        }
        selected[pos - 1] = numVal
        used.add(numVal)
      }
      if (valid) {
        selected.sort((a, b) => a - b)
        const blueWeights = blueProb.value.slice(1, BLUE_MAX + 1)
        const blueIdx = weightedSampleOne(blueWeights, BLUE_MAX)
        recs.push({ reds: selected, blue: blueIdx + 1 })
        success = true
        break
      }
    }
    if (!success) recs.push(generateGlobalProbRecs(1)[0])
  }
  return recs
}

function generateComprehensiveRecs(num) {
  return generateGlobalProbRecs(num)
}

function renderAllRecommendations() {
  const num = recCount.value
  globalRecs.value = generateGlobalProbRecs(num)
  posRecs.value = generatePositionProbRecs(num)
  compRecs.value = generateComprehensiveRecs(num)
}

// ==================== 图表渲染 ====================
function renderChart() {
  if (!chartRef.value || !chartInstance) return
  const freqRed = redProb.value.slice(1, RED_MAX + 1)
  const hotColdData = freqRed.map((v, i) => ({ value: v, name: i + 1 })).sort((a, b) => b.value - a.value)
  let option = {}

  if (currentChart.value === 'hotCold') {
    const top10 = hotColdData.slice(0, 10)
    const bottom10 = hotColdData.slice(-10)
    option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      title: { text: `${RED_LABEL}冷热排行 TOP10 + 尾10`, textStyle: { fontSize: 14, color: '#0f172a' } },
      grid: { left: 50, right: 30, top: 50, bottom: 30 },
      xAxis: { type: 'value' },
      yAxis: {
        type: 'category',
        data: [...top10.map(d => d.name), ...bottom10.map(d => d.name)],
        inverse: true,
      },
      series: [{
        type: 'bar',
        data: [
          ...top10.map(d => ({ value: d.value, itemStyle: { color: '#e53e3e' } })),
          ...bottom10.map(d => ({ value: d.value, itemStyle: { color: '#6366f1' } })),
        ],
      }],
    }
  } else if (currentChart.value === 'redDist') {
    option = {
      tooltip: { trigger: 'axis' },
      title: { text: `${RED_LABEL}出现频率分布`, textStyle: { fontSize: 14, color: '#0f172a' } },
      grid: { left: 40, right: 20, top: 50, bottom: 30 },
      xAxis: {
        type: 'category',
        data: Array.from({ length: RED_MAX }, (_, i) => i + 1),
        axisLabel: { fontSize: 10 },
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: freqRed.map(v => ({ value: v, itemStyle: { color: '#e53e3e' } })),
      }],
    }
  } else if (currentChart.value === 'blueDist') {
    const blueFreq = blueProb.value.slice(1, BLUE_MAX + 1)
    option = {
      tooltip: { trigger: 'axis' },
      title: { text: `${BLUE_LABEL}频率分布`, textStyle: { fontSize: 14, color: '#0f172a' } },
      grid: { left: 40, right: 20, top: 50, bottom: 30 },
      xAxis: { type: 'category', data: Array.from({ length: BLUE_MAX }, (_, i) => i + 1) },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: blueFreq.map(v => ({ value: v, itemStyle: { color: '#3b82f6' } })),
      }],
    }
  }
  chartInstance.setOption(option, true)
}

function switchChart(key) {
  currentChart.value = key
  renderChart()
}

function initChart() {
  if (chartRef.value && !chartInstance) {
    chartInstance = echarts.init(chartRef.value)
    window.addEventListener('resize', () => chartInstance?.resize())
  }
  renderChart()
}

// ==================== 矩阵样式辅助 ====================
function getMatrixCellClass(val) {
  if (val > 5) return 'cell-hot'
  if (val > 2) return 'cell-warm'
  return 'cell-cold'
}

// ==================== 用户评测 ====================
function evaluateUserNumber(redsArr, blue) {
  if (redsArr.length !== RED_PICK || blue < 1 || blue > BLUE_MAX) return { score: 0, detail: '格式错误' }
  if (new Set(redsArr).size !== RED_PICK) return { score: 0, detail: `${RED_LABEL}重复` }

  const freqMap = redProb.value
  const hot = [], cold = []
  for (let i = 1; i <= RED_MAX; i++) {
    if (freqMap[i] > 8) hot.push(i)
    if (freqMap[i] < 3) cold.push(i)
  }

  const hotCount = redsArr.filter(v => hot.includes(v)).length
  const coldCount = redsArr.filter(v => cold.includes(v)).length
  const scoreHot = hotCount === 2 ? 15 : hotCount === 3 ? 12 : hotCount === 1 ? 8 : Math.max(0, 15 - Math.abs(hotCount - 2) * 5)

  const avgMiss = redsArr.reduce((sum, r) => sum + (100 / (freqMap[r] + 0.1)), 0) / RED_PICK
  const missScore = Math.min(15, 15 * (1 - Math.min(1, avgMiss / 50)))

  const sumVal = redsArr.reduce((a, b) => a + b, 0)
  const sumScore = (sumVal >= 80 && sumVal <= 130) ? 10 : 10 - Math.min(10, Math.abs(sumVal - 105) / 25)

  const span = redsArr[RED_PICK - 1] - redsArr[0]
  const spanScore = (span >= 20 && span <= 28) ? 10 : 10 - Math.min(10, Math.abs(span - 24) / 8)

  const oddCount = redsArr.filter(v => v % 2 === 1).length
  const oddScore = oddCount === 3 ? 10 : (oddCount === 2 || oddCount === 4) ? 8 : 5

  const seg = [0, 0, 0]
  redsArr.forEach(v => {
    if (v <= 11) seg[0]++
    else if (v <= 22) seg[1]++
    else seg[2]++
  })
  const intervalScore = Math.max(0, 10 - Math.abs(seg[0] - 2) * 2 - Math.abs(seg[1] - 2) * 2)

  let serial = 0
  for (let i = 0; i < RED_PICK - 1; i++) {
    if (redsArr[i + 1] - redsArr[i] === 1) serial += 5
  }
  serial = Math.min(serial, 15)
  const patternScore = 15 - (serial === 0 ? 0 : Math.min(8, Math.abs(serial - 5)))

  const total = scoreHot + missScore + sumScore + spanScore + oddScore + intervalScore + patternScore
  return {
    score: Math.round(total),
    detail: `冷热${scoreHot} 遗漏${missScore.toFixed(1)} 和值${sumScore.toFixed(1)} 跨度${spanScore.toFixed(1)} 奇偶${oddScore} 区间${intervalScore} 连号模式${patternScore} 总分${Math.round(total)}/100`,
  }
}

function evalSingle() {
  const redsStr = userReds.value
  const blue = userBlue.value
  const redsArr = redsStr.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
  const res = evaluateUserNumber(redsArr, blue)
  evalResult.value = `${res.detail} — 得分: ${res.score}/100`
}

function triggerBatchImport() {
  batchCsvRef.value?.click()
}

function handleBatchCsv(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    const lines = ev.target.result.split('\n')
    const results = []
    for (const line of lines) {
      const parts = line.trim().split(',')
      if (parts.length >= RED_PICK + 1) {
        const reds = parts.slice(0, RED_PICK).map(v => parseInt(v))
        const blue = parseInt(parts[RED_PICK])
        const evalRes = evaluateUserNumber(reds, blue)
        results.push(`${RED_LABEL}${reds.join()} ${BLUE_LABEL}${blue}: ${evalRes.score}分`)
      }
    }
    evalResult.value = results.length ? results.join('\n') : '无有效数据'
  }
  reader.readAsText(file)
}

// ==================== 回测 ====================
function runBacktest() {
  let targetReds, targetBlue
  const redsStr = backtestReds.value
  if (redsStr) {
    targetReds = redsStr.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
    targetBlue = backtestBlue.value
  } else {
    const comp = generateComprehensiveRecs(1)
    targetReds = comp[0]?.reds || []
    targetBlue = comp[0]?.blue || 0
  }
  if (targetReds.length !== RED_PICK) {
    alert(`请输入${RED_PICK}个${RED_LABEL}数字`)
    return
  }
  let hit4 = 0, hitBlue = 0
  for (const item of rawHistory.value) {
    const matchReds = targetReds.filter(r => item.reds.includes(r)).length
    if (matchReds >= 4) hit4++
    if (item.blue === targetBlue) hitBlue++
  }
  const total = rawHistory.value.length
  backtestResult.value = `${RED_LABEL}命中4个及以上: ${hit4}/${total} (${(hit4 / total * 100).toFixed(2)}%) | ${BLUE_LABEL}命中: ${hitBlue}/${total} (${(hitBlue / total * 100).toFixed(2)}%)`
}

// ==================== 导入导出 ====================
function exportData() {
  const dataStr = JSON.stringify(rawHistory.value)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ssq_history.json'
  a.click()
  URL.revokeObjectURL(url)
}

function handleImportData(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    try {
      const imported = JSON.parse(ev.target.result)
      if (Array.isArray(imported)) {
        rawHistory.value = imported
        refreshAll()
      }
    } catch (err) {
      alert('JSON格式错误')
    }
  }
  reader.readAsText(file)
}

// ==================== 全局刷新 ====================
function refreshAll() {
  doComputeStatistics()
  renderAllRecommendations()
  renderChart()
}

// ==================== 监听 & 生命周期 ====================
watch(decayLambda, () => {
  if (algoMode.value === 'weighted') refreshAll()
})

watch([algoMode, recCount], () => {
  refreshAll()
})

onMounted(() => {
  rawHistory.value = buildBuiltInDataset({ redCount: RED_MAX, blueCount: BLUE_MAX })
  refreshAll()
  nextTick(() => initChart())
})

onUnmounted(() => {
  chartInstance?.dispose()
  chartInstance = null
  window.removeEventListener('resize', () => chartInstance?.resize())
})
</script>

<style lang="scss" scoped>
.ssq-panel {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

// 卡片
.card {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 20px;
  transition: all 0.25s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);

  &:hover {
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    border-color: #cbd5e0;
  }
}

.card-header {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
  &.red { background: #ef4444; }
  &.blue { background: #3b82f6; }
  &.purple { background: #8b5cf6; }
  &.gold { background: #f59e0b; }
  &.green { background: #10b981; }
  &.orange { background: #f97316; }
}

// 控制面板
.control-panel {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  label {
    font-size: 13px;
    font-weight: 500;
    color: #475569;
  }
}

.form-actions {
  flex-direction: row;
  align-items: flex-end;
  gap: 8px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.import-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: #6366f1;
    color: #6366f1;
  }
}

// 图表
.chart-card {
  .chart-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .chart-box {
    height: 360px;
    width: 100%;
  }
}

// 概率表格
.prob-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.prob-table {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(58px, 1fr));
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 2px; }
}

.prob-item {
  background: #fafafa;
  text-align: center;
  padding: 8px 4px;
  border-radius: 8px;
  font-size: 12px;
  border: 1.5px solid #f1f5f9;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  strong { display: block; font-size: 16px; font-weight: 800; margin-bottom: 2px; color: #334155; }
  span { color: #94a3b8; font-size: 11px; font-weight: 600; }
  &.highlight {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border-color: #fca5a5;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
    strong { color: #dc2626; }
    span { color: #ef4444; }
  }
  &.blue-item {
    background: #f8fafc;
    border-color: #e2e8f0;
    &.highlight {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-color: #93c5fd;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
      strong { color: #2563eb; }
      span { color: #3b82f6; }
    }
  }
}

// 位置概率矩阵（卡片式）
.matrix-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}
.matrix-card {
  background: #fafbfc;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  transition: all 0.25s ease;
  &:hover {
    border-color: #c4b5fd;
    box-shadow: 0 4px 16px rgba(139, 92, 246, 0.08);
  }
}
.matrix-card-header {
  margin-bottom: 12px;
}
.matrix-pos-label {
  display: inline-block;
  font-size: 14px;
  font-weight: 700;
  color: #6d28d9;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  padding: 4px 14px;
  border-radius: 8px;
}
.matrix-card-numbers {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.matrix-num {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  font-size: 11px;
  color: #94a3b8;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  transition: all 0.2s;
  em {
    font-style: normal;
    font-weight: 700;
    font-size: 13px;
    line-height: 1.15;
  }
  small {
    font-size: 9px;
    line-height: 1.1;
    font-weight: 600;
  }
  &.cell-hot {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border-color: #fca5a5;
    color: #991b1b;
    box-shadow: 0 2px 6px rgba(239,68,68,0.12);
    em { color: #dc2626; }
    small { color: #ef4444; }
  }
  &.cell-warm {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    border-color: #fcd34d;
    color: #92400e;
    em { color: #d97706; }
    small { color: #f59e0b; }
  }
  &.cell-cold {
    background: #fafafa;
    border-color: #f1f5f9;
    color: #94a3b8;
    em { color: #94a3b8; }
    small { color: #cbd5e0; }
  }
}

// 方案区域
.rec-section {
  margin-bottom: 24px;
  padding: 28px;
  border-radius: 20px;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  &:last-child { margin-bottom: 0; }
}
// 三种方案模式整体区域区分
.rec-comp {
  background: linear-gradient(135deg, #fefce8 0%, #fffbeb 100%);
}
.rec-global {
  background: linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%);
}
.rec-position {
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
}
// 区域头部
.rec-section-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.04);
}
.rec-section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  font-size: 22px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.rec-comp .rec-section-icon { background: rgba(253, 230, 138, 0.35); }
.rec-global .rec-section-icon { background: rgba(199, 210, 254, 0.4); }
.rec-position .rec-section-icon { background: rgba(167, 243, 208, 0.4); }
.rec-label {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 2px 0;
  color: #1e293b;
}
.rec-desc {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
  font-weight: 500;
}
// 各模式文字颜色微调
.rec-comp .rec-label { color: #92400e; }
.rec-global .rec-label { color: #3730a3; }
.rec-position .rec-label { color: #065f46; }
.rec-comp .rec-desc { color: #a16207; }
.rec-global .rec-desc { color: #6366f1; }
.rec-position .rec-desc { color: #10b981; }
// 方案卡片网格
.rec-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.rec-card {
  border-radius: 12px;
  padding: 14px 18px;
  // background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(4px);
  // border: 1px solid rgba(255, 255, 255, 0.8);
  // box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;
  cursor: pointer;
  user-select: none;
  &:hover {
    transform: translateY(-2px);
    // box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    // background: rgba(255, 255, 255, 0.9);
  }
  &:active {
    transform: scale(0.98);
  }
}
.rec-numbers {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  flex-wrap: nowrap;
  position: relative;
  z-index: 1;
}
.rec-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-weight: 800;
  font-size: 13px;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.25);
  position: relative;
  transition: transform 0.2s;
  flex-shrink: 0;
  &:hover { transform: scale(1.15); }
  &.red-num {
    background: radial-gradient(circle at 35% 35%, #fca5a5, #ef4444 50%, #b91c1c 100%);
  }
  &.blue-num {
    background: radial-gradient(circle at 35% 35%, #93c5fd, #3b82f6 50%, #1d4ed8 100%);
  }
}

// 球组选中状态 — 按模式区分背景色
.rec-card.rec-selected {
  border-color: transparent !important;
  box-shadow: none !important;
  transform: none !important;
}
.rec-comp .rec-card.rec-selected {
  background: rgba(146, 64, 14, 0.12) !important;
  border-left: 3px solid #92400e !important;
}
.rec-global .rec-card.rec-selected {
  background: rgba(55, 48, 163, 0.1) !important;
  border-left: 3px solid #3730a3 !important;
}
.rec-position .rec-card.rec-selected {
  background: rgba(6, 95, 70, 0.1) !important;
  border-left: 3px solid #065f46 !important;
}

// 悬浮生成按钮
.fab-generate {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  border-radius: 50px;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
  cursor: pointer;
  font-weight: 700;
  font-size: 15px;
  transition: all 0.25s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(37, 99, 235, 0.5);
  }
  &:active {
    transform: scale(0.96);
  }
  .fab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.25);
    font-size: 13px;
    font-weight: 800;
  }
  .fab-text {
    letter-spacing: 0.5px;
  }
}
.fab-fade-enter-active,
.fab-fade-leave-active {
  transition: all 0.3s ease;
}
.fab-fade-enter-from,
.fab-fade-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.9);
}

// 评测结果
.eval-result {
  margin-top: 16px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px 20px;
  font-size: 14px;
  color: #334155;
  line-height: 1.8;
  white-space: pre-wrap;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

// 响应式
@media (max-width: 768px) {
  ::v-deep .el-input{
    width: 100%;
  }
  .el-select{
    width: 100%!important;
  }
  .el-input-number{
    width: 100%!important;
  }
  .control-panel { padding: 16px; }
  .control-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    align-items: flex-end;
  }
  .form-item { min-width: 0; }
  // 衰减因子在移动端独占一行（放最后）
  .decay-item {
    grid-column: 1 / -1;
  }
  .form-item.form-actions {
    grid-column: 1 / -1;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 8px;
    .el-button {
      flex: 1;
      min-width: 0;
      white-space: nowrap;
      padding-left: 6px;
      padding-right: 6px;
      margin-left: 0;
    }
  }
  .status-row {
    width: 100%;
    gap: 8px 10px;
    margin-top: 12px;
    justify-content: space-between;
    // 四个子元素：两个 el-tag + 导出按钮 + 导入 label，两两一行靠两边
    > span,
    .el-tag,
    .el-button,
    .import-label {
      width: calc(50% - 5px);
      justify-content: center;
    }
    .el-tag {
      margin: 0;
    }
  }
  // 导出按钮边框
  .export-btn {
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    padding: 5px 12px;
    font-size: 13px;
    &:hover {
      border-color: #6366f1;
      color: #6366f1;
    }
  }
  .prob-grid { grid-template-columns: 1fr; }
  .prob-table {
    grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
    gap: 6px;
    max-height: none;
    overflow-y: visible;
  }
  .prob-item {
    padding: 5px 3px;
    border-radius: 6px;
    font-size: 11px;
    strong { font-size: 14px; font-weight: 800; }
    span { font-size: 10px; }
  }
  .chart-box { height: 280px; }
  // 图表按钮：SSQ是3个一行
  .chart-tabs {
    display: flex;
    flex-wrap: nowrap!important;
    gap: 6px;
    .el-button { flex: 1 1 auto; min-width: 0px !important;margin-left: 0px; font-size: 11px; padding: 6px 4px; }
  }
  .rec-group { grid-template-columns: 1fr; }
  .rec-card { padding: 12px 16px; border-radius: 10px; }
  .rec-num { width: 34px; height: 34px; font-size: 14px; border-radius: 50%; }
  .rec-numbers { gap: 6px; }
  .card { padding: 12px; border-radius: 14px; }
  .card-header { font-size: 15px; }
  .rec-section { margin-bottom: 14px; padding: 14px 12px; border-radius: 16px; }
  .rec-section-header { gap: 10px; margin-bottom: 14px; padding-bottom: 12px; }
  .rec-section-icon { font-size: 24px; width: 38px; height: 38px; border-radius: 10px; }
  .rec-label { font-size: 15px; }
  .rec-desc { font-size: 11px; }
  // 矩阵卡片移动端适配
  .matrix-grid { grid-template-columns: 1fr; gap: 10px; }
  .matrix-card { padding: 12px; border-radius: 14px; }
  .matrix-num {
    width: 34px; height: 34px;
    border-radius: 5px;
    gap: 5px;
    em { font-size: 12px; font-weight: 700; }
    small { font-size: 8px; font-weight: 600; }
  }
  .matrix-card-numbers { gap: 5px; }
}

@media (max-width: 480px) {
  .control-row {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .decay-item {
    grid-column: 1 / -1;
  }
  .rec-group { grid-template-columns: 1fr; }
  .rec-num { width: 32px; height: 32px; font-size: 13px; border-radius: 50%; }
  .rec-numbers { gap: 5px; }
  .rec-card { padding: 10px 12px; border-radius: 10px; }
  .card { padding: 10px; }
  .rec-section { margin-bottom: 12px; padding: 12px; border-radius: 14px; }
  .rec-section-header { gap: 8px; margin-bottom: 12px; padding-bottom: 10px; }
  .rec-section-icon { font-size: 20px; width: 34px; height: 34px; border-radius: 8px; }
  .rec-label { font-size: 14px; }
  .chart-box { height: 240px; }
  .chart-tabs {
    gap: 4px;
    .el-button { min-width: calc(33.33% - 4px); font-size: 10px; padding: 5px 2px; }
  }
  .matrix-num { width: 30px; height: 30px; border-radius: 4px; em { font-size: 11px; } small { font-size: 7px; } }
  .matrix-card-numbers { gap: 4px; }
  .rec-desc { font-size: 10px; }
  .prob-table {
    grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
    gap: 5px;
  }
  .prob-item {
    padding: 4px 2px;
    strong { font-size: 13px; }
    span { font-size: 9px; }
  }
}
</style>

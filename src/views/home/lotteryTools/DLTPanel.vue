<template>
  <div class="dlt-panel">
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
          <el-select v-model="algoMode" size="default" style="width: 200px">
            <el-option label="基础概率 (频率)" value="prob" />
            <el-option label="加权概率 (时间衰减)" value="weighted" />
          </el-select>
        </div>
        <div class="form-item">
          <label>每组推荐注数</label>
          <el-input-number v-model="recCount" :min="1" :max="20" size="default" />
        </div>
        <div class="form-item decay-item" v-if="algoMode === 'weighted'">
          <label>衰减因子 λ: {{ decayLambda }}</label>
          <el-slider v-model="decayLambda" :min="0.03" :max="0.15" :step="0.01" :show-tooltip="true" style="width: 160px" />
        </div>
        <div class="form-item form-actions">
          <el-button type="warning" @click="refreshAll" :icon="RefreshRight">
            开始预测/刷新
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
          :type="currentChart === tab.key ? 'warning' : 'default'"
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
          <span class="header-dot gold"></span> 前区号码出现概率 (1-35)
        </h3>
        <div class="prob-table front-table">
          <div
            v-for="n in RED_MAX"
            :key="'f'+n"
            class="prob-item front-item"
            :class="{ highlight: frontProb[n] > 6 }"
          >
            <strong>{{ n }}</strong>
            <span>{{ (frontProb[n] || 0).toFixed(2) }}%</span>
          </div>
        </div>
      </div>
      <div class="card">
        <h3 class="card-header">
          <span class="header-dot blue"></span> 后区号码出现概率 (1-12)
        </h3>
        <div class="prob-table back-table">
          <div
            v-for="n in BLUE_MAX"
            :key="'b'+n"
            class="prob-item back-item"
            :class="{ highlight: backProb[n] > 12 }"
          >
            <strong>{{ n }}</strong>
            <span>{{ (backProb[n] || 0).toFixed(2) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 位置概率矩阵 -->
    <div class="card">
      <h3 class="card-header">
        <span class="header-dot purple"></span> 前区位置概率矩阵 (第1位~第5位)
      </h3>
      <div class="matrix-grid">
        <div class="matrix-card" v-for="p in RED_PICK" :key="'pos'+p">
          <div class="matrix-card-header">
            <span class="matrix-pos-label">第{{ p }}位</span>
          </div>
          <div class="matrix-card-numbers">
            <span
              v-for="n in RED_MAX"
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

    <!-- 三组推荐 -->
    <div class="card">
      <h3 class="card-header">
        <span class="header-dot orange"></span> 专业推荐 (每组{{ recCount }}注)
      </h3>

      <div class="rec-section rec-comp">
        <div class="rec-section-header">
          <span class="rec-section-icon">✨</span>
          <div>
            <h4 class="rec-label">综合推荐</h4>
            <p class="rec-desc">{{ algoMode === 'weighted' ? '加权概率' : '基础概率' }}模式 · 智能生成</p>
          </div>
        </div>
        <div class="rec-group">
          <div v-for="(combo, i) in compRecs" :key="'c'+i" class="rec-card">
            <div class="rec-numbers">
              <span v-for="r in combo.fronts" :key="r" class="rec-num front-num">{{ r }}</span>
              <span v-for="b in combo.backs" :key="'b'+b" class="rec-num back-num">{{ b }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="rec-section rec-global">
        <div class="rec-section-header">
          <span class="rec-section-icon">📊</span>
          <div>
            <h4 class="rec-label">整体概率推荐</h4>
            <p class="rec-desc">基于数字出现频率 · 全局统计</p>
          </div>
        </div>
        <div class="rec-group">
          <div v-for="(combo, i) in globalRecs" :key="'g'+i" class="rec-card">
            <div class="rec-numbers">
              <span v-for="r in combo.fronts" :key="r" class="rec-num front-num">{{ r }}</span>
              <span v-for="b in combo.backs" :key="'b'+b" class="rec-num back-num">{{ b }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="rec-section rec-position">
        <div class="rec-section-header">
          <span class="rec-section-icon">🎯</span>
          <div>
            <h4 class="rec-label">位置概率推荐</h4>
            <p class="rec-desc">基于每个位置的历史概率 · 精准定位</p>
          </div>
        </div>
        <div class="rec-group">
          <div v-for="(combo, i) in posRecs" :key="'p'+i" class="rec-card">
            <div class="rec-numbers">
              <span v-for="r in combo.fronts" :key="r" class="rec-num front-num">{{ r }}</span>
              <span v-for="b in combo.backs" :key="'b'+b" class="rec-num back-num">{{ b }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户评测 -->
    <div class="card">
      <h3 class="card-header">
        <span class="header-dot green"></span> 用户号码评测系统 (多维度评分)
      </h3>
      <div class="control-row">
        <div class="form-item" style="flex:1">
          <label>前区 (5个, 1-35, 逗号分隔)</label>
          <el-input v-model="userFronts" placeholder="例: 5,12,18,23,29" />
        </div>
        <div class="form-item" style="flex:1">
          <label>后区 (2个, 1-12, 逗号分隔)</label>
          <el-input v-model="userBacks" placeholder="例: 3,8" />
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
        <span class="header-dot red"></span> 历史回测 (基于当前数据集)
      </h3>
      <div class="control-row">
        <div class="form-item" style="flex:1">
          <label>固定用户号码 (可选, 留空则用综合推荐第一注)</label>
          <el-input v-model="backtestFronts" placeholder="前区, 如 1,2,3,4,5" />
        </div>
        <div class="form-item" style="flex:1">
          <label>后区</label>
          <el-input v-model="backtestBacks" placeholder="后区, 如 1,2" />
        </div>
        <div class="form-item form-actions">
          <el-button type="success" @click="runBacktest" :icon="Timer">开始回测命中率</el-button>
        </div>
      </div>
      <div v-if="backtestResult" class="eval-result">{{ backtestResult }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  RefreshRight, Upload, DataLine, Calendar, Download,
  FolderOpened, TrendCharts, Timer
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  weightedSampleWithoutReplace,
  weightedSampleOne,
  computeStatistics,
  buildDLTDataset,
} from './utils.js'

// ==================== 大乐透配置 ====================
const RED_MAX = 35
const BLUE_MAX = 12
const RED_PICK = 5
const BLUE_PICK = 2
const FRONT_LABEL = '前区'
const BACK_LABEL = '后区'

// ==================== 数据状态 ====================
const rawHistory = ref([])
const startDate = ref('2020-01-01')
const endDate = ref('')
const algoMode = ref('weighted')
const decayLambda = ref(0.07)
const recCount = ref(10)

const frontProb = ref(new Array(RED_MAX + 1).fill(0))
const backProb = ref(new Array(BLUE_MAX + 1).fill(0))
const posProb = ref({})
const periodCount = ref(0)
const dataStatus = ref('加载内置数据中...')

const globalRecs = ref([])
const posRecs = ref([])
const compRecs = ref([])

// ==================== 图表 ====================
const chartRef = ref(null)
let chartInstance = null
const currentChart = ref('hotCold')
const chartTabs = [
  { key: 'hotCold', label: '🔥 前区冷热排行' },
  { key: 'frontDist', label: '📊 前区频次分布' },
  { key: 'backDist', label: '🔵 后区频次分布' },
  { key: 'sumTrend', label: '📈 前区和值趋势' },
]

// ==================== 用户评测 ====================
const userFronts = ref('')
const userBacks = ref('')
const evalResult = ref('')
const batchCsvRef = ref(null)

// ==================== 回测 ====================
const backtestFronts = ref('')
const backtestBacks = ref('')
const backtestResult = ref('')

// ==================== API 获取 ====================
async function fetchFromMultipleAPI() {
  alert('大乐透公开API受限，当前使用内置数据集。您可导入JSON文件。')
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
    bluePickCount: BLUE_PICK,
  })
  frontProb.value = stats.redProb
  backProb.value = stats.blueProb
  posProb.value = stats.posProb
  periodCount.value = stats.periodCount
  dataStatus.value = `内置 ${rawHistory.value.length} 期`
}

// ==================== 推荐生成 ====================
function generateGlobalProbRecs(num) {
  const frontWeights = frontProb.value.slice(1, RED_MAX + 1)
  const backWeights = backProb.value.slice(1, BLUE_MAX + 1)
  const recs = []
  for (let i = 0; i < num; i++) {
    const fronts = weightedSampleWithoutReplace(frontWeights, RED_MAX, RED_PICK)
    fronts.sort((a, b) => a - b)
    const backs = weightedSampleWithoutReplace(backWeights, BLUE_MAX, BLUE_PICK)
    backs.sort((a, b) => a - b)
    recs.push({ fronts, backs })
  }
  return recs
}

function generatePositionProbRecs(num) {
  const recs = []
  const maxAttempts = 40
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
        const backWeights = backProb.value.slice(1, BLUE_MAX + 1)
        const backs = weightedSampleWithoutReplace(backWeights, BLUE_MAX, BLUE_PICK)
        backs.sort((a, b) => a - b)
        recs.push({ fronts: selected, backs })
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
function computeAndValueHistory() {
  // 计算历史每期的前区和值
  const history = rawHistory.value
  const sd = startDate.value
  const ed = endDate.value || new Date().toISOString().slice(0, 10)
  const filtered = history.filter(item => item.date >= sd && item.date <= ed)
  return filtered.map(item => item.reds.reduce((a, b) => a + b, 0))
}

function renderChart() {
  if (!chartRef.value || !chartInstance) return
  const freqFront = frontProb.value.slice(1, RED_MAX + 1)
  let option = {}

  if (currentChart.value === 'hotCold') {
    const hotColdData = freqFront.map((v, i) => ({ value: v, name: i + 1 })).sort((a, b) => b.value - a.value)
    const top10 = hotColdData.slice(0, 10)
    const bottom10 = hotColdData.slice(-10)
    option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      title: { text: '前区冷热排行 TOP10 + 尾10', textStyle: { fontSize: 14, color: '#0f172a' } },
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
          ...top10.map(d => ({ value: d.value, itemStyle: { color: '#f59e0b' } })),
          ...bottom10.map(d => ({ value: d.value, itemStyle: { color: '#6366f1' } })),
        ],
      }],
    }
  } else if (currentChart.value === 'frontDist') {
    option = {
      tooltip: { trigger: 'axis' },
      title: { text: '前区号码出现频率分布', textStyle: { fontSize: 14, color: '#0f172a' } },
      grid: { left: 40, right: 20, top: 50, bottom: 30 },
      xAxis: {
        type: 'category',
        data: Array.from({ length: RED_MAX }, (_, i) => i + 1),
        axisLabel: { fontSize: 10 },
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: freqFront.map(v => ({ value: v, itemStyle: { color: '#f59e0b' } })),
      }],
    }
  } else if (currentChart.value === 'backDist') {
    const freqBack = backProb.value.slice(1, BLUE_MAX + 1)
    option = {
      tooltip: { trigger: 'axis' },
      title: { text: '后区号码频率分布', textStyle: { fontSize: 14, color: '#0f172a' } },
      grid: { left: 40, right: 20, top: 50, bottom: 30 },
      xAxis: { type: 'category', data: Array.from({ length: BLUE_MAX }, (_, i) => i + 1) },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: freqBack.map(v => ({ value: v, itemStyle: { color: '#3b82f6' } })),
      }],
    }
  } else if (currentChart.value === 'sumTrend') {
    const sumHistory = computeAndValueHistory()
    const labels = sumHistory.map((_, i) => i + 1)
    option = {
      tooltip: { trigger: 'axis' },
      title: { text: '前区和值趋势 (最近期数)', textStyle: { fontSize: 14, color: '#0f172a' } },
      grid: { left: 50, right: 30, top: 50, bottom: 30 },
      xAxis: { type: 'category', data: labels, name: '期数' },
      yAxis: { type: 'value', name: '和值' },
      series: [{
        type: 'line',
        data: sumHistory,
        smooth: true,
        lineStyle: { color: '#f59e0b', width: 2 },
        areaStyle: { color: 'rgba(245, 158, 11, 0.1)' },
        itemStyle: { color: '#f59e0b' },
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
  if (val > 6) return 'cell-hot'
  if (val > 3) return 'cell-warm'
  return 'cell-cold'
}

// ==================== 用户评测 ====================
function evaluateUserNumber(frontsArr, backsArr) {
  if (frontsArr.length !== RED_PICK || backsArr.length !== BLUE_PICK) {
    return { score: 0, detail: `号码格式错误，需要${RED_PICK}个前区+${BLUE_PICK}个后区` }
  }
  if (new Set(frontsArr).size !== RED_PICK) return { score: 0, detail: '前区有重复号码' }
  if (new Set(backsArr).size !== BLUE_PICK) return { score: 0, detail: '后区有重复号码' }

  const freqMap = frontProb.value

  // 1. 冷热评分
  const hot = [], cold = []
  for (let i = 1; i <= RED_MAX; i++) {
    if (freqMap[i] > 8) hot.push(i)
    if (freqMap[i] < 3) cold.push(i)
  }
  const hotCount = frontsArr.filter(v => hot.includes(v)).length
  const scoreHot = hotCount === 2 ? 15 : hotCount === 3 ? 12 : hotCount === 1 ? 8 : Math.max(0, 15 - Math.abs(hotCount - 2) * 4)

  // 2. 和值合理性 (前区5码和值80~130)
  const sumVal = frontsArr.reduce((a, b) => a + b, 0)
  const sumScore = (sumVal >= 80 && sumVal <= 130) ? 15 : 15 - Math.min(12, Math.abs(sumVal - 105) / 10)

  // 3. 跨度
  const span = frontsArr[RED_PICK - 1] - frontsArr[0]
  const spanScore = (span >= 20 && span <= 30) ? 10 : 10 - Math.min(8, Math.abs(span - 25) / 5)

  // 4. 奇偶比
  const oddCount = frontsArr.filter(v => v % 2 === 1).length
  const oddScore = (oddCount === 2 || oddCount === 3) ? 10 : 6

  // 5. 区间分布 (1-12, 13-24, 25-35)
  const seg = [0, 0, 0]
  frontsArr.forEach(v => {
    if (v <= 12) seg[0]++
    else if (v <= 24) seg[1]++
    else seg[2]++
  })
  const ideal = [2, 2, 1]
  const intervalScore = Math.max(0, 10 - Math.abs(seg[0] - ideal[0]) * 2 - Math.abs(seg[1] - ideal[1]) * 2 - Math.abs(seg[2] - ideal[2]) * 2)

  // 6. 连号评分
  let serial = 0
  for (let i = 0; i < RED_PICK - 1; i++) {
    if (frontsArr[i + 1] - frontsArr[i] === 1) serial += 1
  }
  const serialScore = serial === 1 ? 10 : serial === 0 ? 8 : 5

  // 7. 后区搭配 (冷热, 跨度)
  const backFreq = backProb.value
  const backHot = backsArr.filter(b => backFreq[b] > 7).length
  const backScore = backHot === 1 ? 10 : backHot === 2 ? 12 : 6
  const backSpan = Math.abs(backsArr[1] - backsArr[0])
  const backSpanScore = (backSpan >= 3 && backSpan <= 8) ? 10 : 6

  const total = scoreHot + sumScore + spanScore + oddScore + intervalScore + serialScore + backScore + backSpanScore
  return {
    score: Math.round(total),
    detail: `冷热${scoreHot} 和值${sumScore.toFixed(0)} 跨度${spanScore} 奇偶${oddScore} 区间${intervalScore} 连号${serialScore} 后区热度${backScore} 后区跨${backSpanScore} 总分${Math.round(total)}/100`,
  }
}

function evalSingle() {
  const frontsStr = userFronts.value
  const backsStr = userBacks.value
  const frontsArr = frontsStr.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
  const backsArr = backsStr.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
  const res = evaluateUserNumber(frontsArr, backsArr)
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
      if (parts.length >= RED_PICK + BLUE_PICK) {
        const fronts = parts.slice(0, RED_PICK).map(v => parseInt(v))
        const backs = parts.slice(RED_PICK, RED_PICK + BLUE_PICK).map(v => parseInt(v))
        const evalRes = evaluateUserNumber(fronts, backs)
        results.push(`前${fronts.join()} 后${backs.join()}: ${evalRes.score}分`)
      }
    }
    evalResult.value = results.length ? results.join('\n') : '无有效数据'
  }
  reader.readAsText(file)
}

// ==================== 回测 ====================
function runBacktest() {
  let targetFronts, targetBacks
  const frontsStr = backtestFronts.value
  const backsStr = backtestBacks.value
  if (frontsStr && backsStr) {
    targetFronts = frontsStr.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
    targetBacks = backsStr.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
  } else {
    const comp = generateComprehensiveRecs(1)
    targetFronts = comp[0]?.fronts || []
    targetBacks = comp[0]?.backs || []
  }
  if (targetFronts.length !== RED_PICK || targetBacks.length !== BLUE_PICK) {
    alert(`请输入${RED_PICK}个前区号码和${BLUE_PICK}个后区号码`)
    return
  }
  let hit3 = 0, hitBack = 0
  for (const item of rawHistory.value) {
    const matchFronts = targetFronts.filter(f => item.reds.includes(f)).length
    if (matchFronts >= 3) hit3++
    const matchBacks = targetBacks.filter(b => item.blues.includes(b)).length
    if (matchBacks >= 1) hitBack++
  }
  const total = rawHistory.value.length
  backtestResult.value = `前区命中3个及以上: ${hit3}/${total} (${(hit3 / total * 100).toFixed(2)}%) | 后区至少命中1个: ${hitBack}/${total} (${(hitBack / total * 100).toFixed(2)}%)`
}

// ==================== 导入导出 ====================
function exportData() {
  const dataStr = JSON.stringify(rawHistory.value)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'dlt_history.json'
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
  rawHistory.value = buildDLTDataset()
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
.dlt-panel {
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
  &.red { background: #e53e3e; }
  &.blue { background: #3b82f6; }
  &.purple { background: #8b5cf6; }
  &.gold { background: #f59e0b; }
  &.orange { background: #f97316; }
  &.green { background: #10b981; }
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
  &.front-item {
    &.highlight {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border-color: #fcd34d;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.12);
      strong { color: #d97706; }
      span { color: #f59e0b; }
    }
  }
  &.back-item {
    border-color: #e2e8f0;
    &.highlight {
      background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
      border-color: #c4b5fd;
      box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
      strong { color: #6d28d9; }
      span { color: #7c3aed; }
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
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    border-color: #fcd34d;
    color: #92400e;
    box-shadow: 0 2px 6px rgba(245,158,11,0.12);
    em { color: #d97706; }
    small { color: #f59e0b; }
  }
  &.cell-warm {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border-color: #fca5a5;
    color: #991b1b;
    em { color: #dc2626; }
    small { color: #ef4444; }
  }
  &.cell-cold {
    background: #fafafa;
    border-color: #f1f5f9;
    color: #94a3b8;
    em { color: #94a3b8; }
    small { color: #cbd5e0; }
  }
}

// 推荐区域
.rec-section {
  margin-bottom: 24px;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  &:last-child { margin-bottom: 0; }
}
// 三种推荐模式整体区域区分
.rec-comp {
  background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%);
  border-color: #c7d2fe;
}
.rec-global {
  background: linear-gradient(135deg, #fffbeb 0%, #fefce8 100%);
  border-color: #fde68a;
}
.rec-position {
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
  border-color: #a7f3d0;
}
// 区域头部
.rec-section-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 20px;
}
.rec-section-icon {
  font-size: 28px;
  line-height: 1;
  flex-shrink: 0;
}
.rec-label {
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: #1e293b;
}
.rec-desc {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
  font-weight: 500;
}
// 各模式文字颜色微调
.rec-comp .rec-label { color: #3730a3; }
.rec-global .rec-label { color: #92400e; }
.rec-position .rec-label { color: #065f46; }
.rec-comp .rec-desc { color: #6366f1; }
.rec-global .rec-desc { color: #a16207; }
.rec-position .rec-desc { color: #10b981; }
// 推荐卡片网格
.rec-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}
.rec-card {
  border-radius: 10px;
  padding: 16px 18px;
  transition: all 0.25s ease;
  cursor: default;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(4px);
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    background: rgba(255, 255, 255, 0.95);
  }
}
.rec-numbers {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}
.rec-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 14px;
  color: #ffffff;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.2);
  position: relative;
  transition: transform 0.2s;
  &:hover { transform: scale(1.1); }
  &.front-num {
    background: linear-gradient(145deg, #fbbf24 0%, #f59e0b 40%, #d97706 100%);
  }
  &.back-num {
    background: linear-gradient(145deg, #a78bfa 0%, #7c3aed 40%, #6d28d9 100%);
  }
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
    flex-wrap: wrap;
  }
  .status-row {
    gap: 8px;
    margin-top: 12px;
  }
  // 导出按钮边框
  .export-btn {
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    padding: 5px 12px;
    font-size: 13px;
    &:hover {
      border-color: #f59e0b;
      color: #f59e0b;
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
  // 图表按钮：DLT是4个，两行展示
  .chart-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    .el-button { flex: 1 1 auto; min-width: calc(50% - 6px); font-size: 11px; padding: 6px 4px; }
  }
  .rec-group { grid-template-columns: 1fr; }
  .rec-card { padding: 12px 14px; border-radius: 8px; }
  .rec-num { width: 32px; height: 32px; font-size: 13px; border-radius: 7px; }
  .card { padding: 16px; border-radius: 14px; }
  .card-header { font-size: 15px; }
  .rec-section { margin-bottom: 16px; padding: 16px; border-radius: 14px; }
  .rec-section-header { gap: 10px; margin-bottom: 14px; }
  .rec-section-icon { font-size: 24px; }
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
  .rec-num { width: 28px; height: 28px; font-size: 12px; border-radius: 6px; }
  .rec-numbers { gap: 5px; }
  .rec-card { padding: 10px 12px; border-radius: 8px; }
  .card { padding: 14px; }
  .chart-box { height: 240px; }
  .chart-tabs {
    gap: 4px;
    .el-button { min-width: calc(50% - 4px); font-size: 10px; padding: 5px 2px; }
  }
  .matrix-num { width: 30px; height: 30px; border-radius: 4px; em { font-size: 11px; } small { font-size: 7px; } }
  .matrix-card-numbers { gap: 4px; }
  .rec-section { margin-bottom: 12px; padding: 12px; border-radius: 12px; }
  .rec-section-header { gap: 8px; margin-bottom: 12px; }
  .rec-section-icon { font-size: 22px; }
  .rec-label { font-size: 14px; }
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

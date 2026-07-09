<template>
  <div class="ssq-panel panel-enter">
    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-row">
        <div class="form-item">
          <label>起始日期</label>
          <el-date-picker v-model="startDate" type="date" placeholder="起始" format="YYYY-MM-DD" value-format="YYYY-MM-DD" size="default" style="width:130px" />
        </div>
        <div class="form-item">
          <label>结束日期</label>
          <el-date-picker v-model="endDate" type="date" placeholder="结束" format="YYYY-MM-DD" value-format="YYYY-MM-DD" size="default" style="width:130px" />
        </div>
        <div class="form-item">
          <label>算法</label>
          <el-select v-model="algoMode" size="default" style="width:150px">
            <el-option label="加权概率 (推荐)" value="weighted" />
            <el-option label="基础频率" value="prob" />
          </el-select>
        </div>
        <div class="form-item">
          <label>方案生成组数</label>
          <el-input-number v-model="recCount" :min="1" :max="15" size="default" style="width:100px" />
        </div>
        <div class="form-item form-actions">
          <el-button type="danger" @click="refreshAll" :icon="RefreshRight" :loading="loading">刷新分析</el-button>
          <el-button type="primary" @click="syncFromServer" :icon="Upload" :loading="syncing">同步数据</el-button>
        </div>
      </div>
      <div class="status-row">
        <el-tag type="info" size="small">{{ dataStatus }}</el-tag>
        <el-tag size="small">共 {{ periodCount }} 期</el-tag>
        <button class="advanced-toggle" @click="advOpen = !advOpen">
          <span>高级筛选</span>
          <span class="toggle-arrow" :class="{ open: advOpen }">▼</span>
        </button>
      </div>

      <!-- 高级筛选面板 -->
      <div class="advanced-panel" :style="{ maxHeight: advOpen ? '500px' : '0', opacity: advOpen ? 1 : 0, padding: advOpen ? '' : '0 18px' }">
        <div class="adv-grid">
          <!-- 衰减因子 -->
          <div class="adv-item">
            <label>衰减因子 λ <span class="adv-hint">越小越看重近期</span></label>
            <div class="adv-slider-wrap">
              <el-slider class="adv-slider" v-model="decayLambda" :min="0.01" :max="0.30" :step="0.01" :show-tooltip="true" size="small" />
              <span class="adv-slider-val">{{ decayLambda.toFixed(2) }}</span>
            </div>
          </div>
          <!-- 红球奇偶比 -->
          <div class="adv-item">
            <label>红球奇数个数范围</label>
            <div class="adv-range">
              <el-input-number v-model="minOdd" :min="0" :max="6" size="small" style="width:68px" controls-position="right" />
              <span>~</span>
              <el-input-number v-model="maxOdd" :min="0" :max="6" size="small" style="width:68px" controls-position="right" />
            </div>
          </div>
          <!-- 红球和值范围 -->
          <div class="adv-item">
            <label>红球和值范围 <span class="adv-hint">理论21~183</span></label>
            <div class="adv-range">
              <el-input-number v-model="minSum" :min="21" :max="183" size="small" style="width:76px" controls-position="right" />
              <span>~</span>
              <el-input-number v-model="maxSum" :min="21" :max="183" size="small" style="width:76px" controls-position="right" />
            </div>
          </div>
          <!-- 热号比例 -->
          <div class="adv-item">
            <label>热号个数 <span class="adv-hint">至少选N个热门号</span></label>
            <div class="adv-slider-wrap">
              <el-slider class="adv-slider" v-model="minHot" :min="0" :max="6" :step="1" size="small" />
              <span class="adv-slider-val">{{ minHot }}个</span>
            </div>
          </div>
          <!-- 连号 & 重号开关 -->
          <div class="adv-item">
            <label>组合约束</label>
            <div class="adv-toggle-row">
              <el-switch v-model="allowConsecutive" size="small" active-text="允许连号" />
              <el-switch v-model="allowRepeat" size="small" active-text="允许与上期重号" />
            </div>
          </div>
          <!-- 热号阈值 -->
          <div class="adv-item" v-if="minHot > 0">
            <label>热号阈值倍数 <span class="adv-hint">高于均值N倍的算热号</span></label>
            <div class="adv-slider-wrap">
              <el-slider class="adv-slider" v-model="hotThreshold" :min="0.8" :max="2.0" :step="0.1" :show-tooltip="true" size="small" />
              <span class="adv-slider-val">{{ hotThreshold.toFixed(1) }}x</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载骨架 -->
    <template v-if="loading && periodCount === 0">
      <div class="card"><div class="skeleton" style="height:340px"></div></div>
      <div class="card"><div class="skeleton" style="height:180px"></div></div>
      <div class="card"><div class="skeleton" style="height:200px"></div></div>
    </template>

    <!-- 图表区域 (可折叠) -->
    <div class="card chart-card" v-if="periodCount > 0">
      <div class="card-header" @click="chartOpen = !chartOpen">
        <span class="card-title"><span class="header-dot" style="background:#ef4444"></span>走势分析</span>
        <span class="collapse-icon" :class="{ flipped: !chartOpen }">▼</span>
      </div>
      <div class="card-body" :style="{ maxHeight: chartOpen ? '440px' : '0', opacity: chartOpen ? 1 : 0 }">
        <div class="chart-tabs">
          <el-button v-for="tab in chartTabs" :key="tab.key" :type="currentChart === tab.key ? 'danger' : ''" size="small" @click="switchChart(tab.key)">{{ tab.label }}</el-button>
        </div>
        <div ref="chartRef" class="chart-box"></div>
      </div>
    </div>

    <!-- 冷热数字 (可折叠) -->
    <div class="card" v-if="periodCount > 0">
      <div class="card-header" @click="hotColdOpen = !hotColdOpen">
        <span class="card-title"><span class="header-dot" style="background:#ef4444"></span>红球冷热分布 (1-33)</span>
        <span class="collapse-icon" :class="{ flipped: !hotColdOpen }">▼</span>
      </div>
      <div class="card-body" :style="{ maxHeight: hotColdOpen ? '800px' : '0', opacity: hotColdOpen ? 1 : 0 }">
        <div class="prob-grid">
          <div v-for="n in 33" :key="n" class="prob-cell" :class="getHeatClass(redProb[n])">
            <strong>{{ n }}</strong>
            <small>{{ (redProb[n] || 0).toFixed(1) }}%</small>
          </div>
        </div>
        <div style="margin-top:14px">
          <span class="card-title" style="font-size:14px"><span class="header-dot" style="background:#3b82f6"></span>蓝球冷热 (1-16)</span>
        </div>
        <div class="prob-grid" style="margin-top:8px">
          <div v-for="n in 16" :key="'b'+n" class="prob-cell" :class="getBlueHeatClass(blueProb[n])">
            <strong>{{ n }}</strong>
            <small>{{ (blueProb[n] || 0).toFixed(1) }}%</small>
          </div>
        </div>
      </div>
    </div>

    <!-- 位置概率 (简化版，可折叠) -->
    <div class="card" v-if="periodCount > 0">
      <div class="card-header" @click="posOpen = !posOpen">
        <span class="card-title"><span class="header-dot" style="background:#8b5cf6"></span>各位置 TOP5 数字</span>
        <span class="collapse-icon" :class="{ flipped: !posOpen }">▼</span>
      </div>
      <div class="card-body" :style="{ maxHeight: posOpen ? '600px' : '0', opacity: posOpen ? 1 : 0 }">
        <div class="pos-top-grid">
          <div v-for="p in 6" :key="'pos'+p" class="pos-col">
            <div class="pos-col-title">第{{ p }}位</div>
            <div v-for="item in getTopNByPos(p, 5)" :key="item.num" class="pos-row">
              <span class="pos-num">{{ item.num }}</span>
              <span class="pos-pct">{{ item.pct.toFixed(1) }}%</span>
              <div class="pos-bar"><span :style="{ width: item.pct + '%' }"></span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 推荐方案 -->
    <div class="card" v-if="periodCount > 0">
      <div class="card-header">
        <span class="card-title"><span class="header-dot" style="background:#f59e0b"></span>AI 推荐方案 (每组{{ recCount }}注)</span>
        <el-button size="small" @click="refreshActiveTab" :icon="RefreshRight" :loading="recLoading">换一批</el-button>
      </div>

      <div class="rec-tabs">
        <button v-for="tab in recTabs" :key="tab.key" class="rec-tab" :class="{ active: activeRecTab === tab.key }" @click="switchRecTab(tab.key)">
          <span class="rec-tab-icon">{{ tab.icon }}</span><span>{{ tab.label }}</span>
        </button>
      </div>

      <div class="rec-section" :style="{ background: curRecInfo.bg }">
        <div class="rec-section-header">
          <span class="rec-section-icon" :style="{ background: curRecInfo.iconBg }">{{ curRecInfo.icon }}</span>
          <div style="flex:1">
            <h4 class="rec-label" :style="{ color: curRecInfo.color }">{{ curRecInfo.label }}</h4>
            <p class="rec-desc" :style="{ color: curRecInfo.descColor }">{{ curRecInfo.desc }}</p>
          </div>
        </div>
        <div class="rec-group">
          <div v-for="(combo, i) in (recData[activeRecTab] || [])" :key="i" class="rec-card" :class="{ 'rec-selected': selectedCombos.has(activeRecTab+'-'+i) }" @click="toggleCombo(activeRecTab+'-'+i)" :style="{ borderColor: curRecInfo.border, background: 'rgba(255,255,255,0.5)' }">
            <div class="rec-numbers">
              <span v-for="r in combo.reds" :key="r" class="ball" style="background:radial-gradient(circle at 35% 35%,#fca5a5,#ef4444 50%,#b91c1c)">{{ r }}</span>
              <span class="ball" style="background:radial-gradient(circle at 35% 35%,#93c5fd,#3b82f6 50%,#1d4ed8)">{{ combo.blue }}</span>
            </div>
          </div>
        </div>
        <div v-if="!recData[activeRecTab] || recData[activeRecTab].length === 0" class="empty-state"><span class="empty-icon">📭</span>点击右上方"换一批"生成方案</div>
      </div>
    </div>

    <!-- FAB 悬浮按钮 -->
    <transition name="fab-fade">
      <div v-if="selectedCombos.size > 0" class="fab-generate" @click="showTicketDialog = true" style="background:linear-gradient(135deg,#3b82f6,#2563eb)">
        <span class="fab-badge">{{ selectedCombos.size }}</span>
        <span>生成球组</span>
      </div>
    </transition>

    <!-- 票面弹窗 -->
    <TicketDialog type="ssq" :visible="showTicketDialog" :combos="ticketCombos" :time="ticketTime" :serial="ticketSerial" :issue="ticketIssue" :station="ticketStation" :flow="ticketFlow" :verify-code="verifyCode" @close="showTicketDialog = false" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { RefreshRight, Upload } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  weightedSampleWithoutReplace, weightedSampleOne, computeStatistics,
  genSerial, genFlowNo, genStationNo, genIssue,
  checkOddEven, checkSum, hasConsecutive, checkRepeat, getHotNumbers, checkHotRatio,
  road012Sample, analyzeHeadAndTail, headTailSample,
  analyzeSpanAndSum, spanSumSample, calcMissingWeights,
} from './utils.js'
import TicketDialog from '@/components/lottery/TicketDialog.vue'
import { useLotteryData } from '@/composables/useLotteryData'
import { ElMessage } from 'element-plus'

const RED_MAX = 33; const BLUE_MAX = 16; const RED_PICK = 6

// ==================== 数据状态 ====================
const rawHistory = ref([])
const startDate = ref('2020-01-01')
const endDate = ref(new Date().toISOString().slice(0, 10))
const algoMode = ref('weighted')
const decayLambda = ref(0.07)
const recCount = ref(10)
const loading = ref(false)

const redProb = ref(new Array(RED_MAX + 1).fill(0))
const blueProb = ref(new Array(BLUE_MAX + 1).fill(0))
const posProb = ref({})
const periodCount = ref(0)
const dataStatus = ref('加载中...')

// --- 推荐方案 Tab ---
const recTabs = [
  { key: 'global',    icon: '📊', label: '整体概率' },
  { key: 'positional',icon: '🎯', label: '位置概率' },
  { key: 'road012',   icon: '🔢', label: '012路' },
  { key: 'headTail',  icon: '🐉', label: '龙头凤尾' },
  { key: 'spanSum',   icon: '📏', label: '跨度+和值' },
  { key: 'chaseCold', icon: '❄️', label: '追冷' },
]
const activeRecTab = ref('global')
const recLoading = ref(false)
const recData = reactive({})
const headTailCache = ref(null)
const spanSumCache = ref(null)

const tabMeta = {
  global:     { bg: 'linear-gradient(135deg,#f5f3ff,#eef2ff)', iconBg: 'rgba(199,210,254,0.4)', icon: '📊', label: '整体概率方案', desc: '基于数字全局出现频率 · 加权随机生成',   color: '#3730a3', descColor: '#6366f1', border: 'rgba(99,102,241,0.15)' },
  positional: { bg: 'linear-gradient(135deg,#ecfdf5,#f0fdf4)', iconBg: 'rgba(167,243,208,0.4)', icon: '🎯', label: '位置概率方案', desc: '每个位置独立概率建模 · 精准定位选号',   color: '#065f46', descColor: '#10b981', border: 'rgba(16,185,129,0.2)' },
  road012:    { bg: 'linear-gradient(135deg,#fff7ed,#fff1f2)', iconBg: 'rgba(253,186,116,0.3)', icon: '🔢', label: '012路分布方案', desc: '按模3分组采样 · 匹配历史012路比',     color: '#9a3412', descColor: '#f97316', border: 'rgba(249,115,22,0.15)' },
  headTail:   { bg: 'linear-gradient(135deg,#fdf2f8,#fce7f3)', iconBg: 'rgba(240,171,252,0.3)', icon: '🐉', label: '龙头凤尾方案', desc: '先锁定头尾数字 · 中间加权填充',       color: '#831843', descColor: '#ec4899', border: 'rgba(236,72,153,0.15)' },
  spanSum:    { bg: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', iconBg: 'rgba(125,211,252,0.3)', icon: '📏', label: '跨度+和值方案', desc: '约束在历史80%跨度/和值区间内生成',   color: '#0c4a6e', descColor: '#0ea5e9', border: 'rgba(14,165,233,0.15)' },
  chaseCold:  { bg: 'linear-gradient(135deg,#f5f5f4,#e7e5e4)', iconBg: 'rgba(168,162,158,0.3)', icon: '❄️', label: '遗漏追冷方案', desc: '权重偏向长期未出的冷号 · 博冷门反弹',   color: '#44403c', descColor: '#78716c', border: 'rgba(120,113,108,0.15)' },
}
const curRecInfo = computed(() => tabMeta[activeRecTab.value] || tabMeta.global)

// ==================== 高级筛选 ====================
const advOpen = ref(false)
const minOdd = ref(0)
const maxOdd = ref(6)
const minSum = ref(21)
const maxSum = ref(183)
const minHot = ref(0)
const hotThreshold = ref(1.2)
const allowConsecutive = ref(true)
const allowRepeat = ref(true)

// ==================== 折叠状态 ====================
const chartOpen = ref(true)
const hotColdOpen = ref(true)
const posOpen = ref(false)

// ==================== 球组选中 ====================
const selectedCombos = ref(new Set())
const showTicketDialog = ref(false)
const ticketTime = ref(''); const ticketSerial = ref(''); const ticketIssue = ref('')
const ticketStation = ref(''); const ticketFlow = ref(''); const verifyCode = ref('')

const ticketCombos = computed(() => {
  const result = []
  for (const tab of recTabs) {
    const data = recData[tab.key]
    if (!data) continue
    data.forEach((c, i) => {
      if (selectedCombos.value.has(tab.key + '-' + i)) {
        result.push({ id: tab.key + '-' + i, reds: c.reds, blue: c.blue })
      }
    })
  }
  return result
})

function toggleCombo(id) {
  const s = new Set(selectedCombos.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedCombos.value = s
}

watch(showTicketDialog, (val) => {
  if (val) {
    ticketTime.value = new Date().toLocaleString('zh-CN')
    ticketSerial.value = genSerial()
    ticketIssue.value = genIssue()
    ticketStation.value = genStationNo()
    ticketFlow.value = genFlowNo()
    verifyCode.value = genSerial() + genSerial().slice(0, 12)
  }
})

// ==================== 图表 ====================
const chartRef = ref(null)
let chartInstance = null
const currentChart = ref('hotCold')
const chartTabs = [
  { key: 'hotCold', label: '冷热排行' },
  { key: 'redDist', label: '红球频次' },
  { key: 'blueDist', label: '蓝球频次' },
  { key: 'sumTrend', label: '和值趋势' },
]

// ==================== API 同步 ====================
const { ssqData, syncData: syncLotteryData } = useLotteryData()
const syncing = ref(false)

async function syncFromServer() {
  syncing.value = true
  try {
    const result = await syncLotteryData('ssq', 200)
    result.success ? ElMessage.success(result.msg) : ElMessage.warning(result.msg)
  } catch (e) {
    ElMessage.error('同步失败: ' + e.message)
  } finally { syncing.value = false }
}

watch(ssqData, (newData) => {
  if (newData && newData.length > 0) {
    rawHistory.value = newData
    startDate.value = newData[0]?.date || startDate.value
    refreshAll()
  }
})

// ==================== 统计 & 方案 ====================
function doComputeStatistics() {
  const sd = startDate.value; const ed = endDate.value || new Date().toISOString().slice(0, 10)
  let filtered = rawHistory.value.filter(item => item.date >= sd && item.date <= ed)
  if (filtered.length === 0) filtered = rawHistory.value.slice()

  const stats = computeStatistics(filtered, { mode: algoMode.value, lambda: decayLambda.value, redMax: RED_MAX, blueMax: BLUE_MAX, redPickCount: RED_PICK })
  redProb.value = stats.redProb; blueProb.value = stats.blueProb; posProb.value = stats.posProb
  periodCount.value = stats.periodCount
  dataStatus.value = rawHistory.value.length ? `真实数据 ${rawHistory.value.length} 期` : '无数据'

  // 缓存辅助数据
  if (filtered.length > 0) {
    lastRedsCache = filtered[filtered.length - 1].reds || []
    headTailCache.value = analyzeHeadAndTail(filtered, RED_MAX)
    spanSumCache.value = analyzeSpanAndSum(filtered)
  }
}
let lastRedsCache = []

/** 检查组合是否满足所有高级筛选条件 */
function passesFilters(reds) {
  if (minOdd.value > 0 || maxOdd.value < RED_PICK) {
    if (!checkOddEven(reds, minOdd.value, maxOdd.value)) return false
  }
  if (minSum.value > 21 || maxSum.value < 183) {
    if (!checkSum(reds, minSum.value, maxSum.value)) return false
  }
  if (!allowConsecutive.value && hasConsecutive(reds)) return false
  if (!allowRepeat.value && !checkRepeat(reds, lastRedsCache, 0)) return false
  if (minHot.value > 0) {
    const hotSet = getHotNumbers(redProb.value, hotThreshold.value)
    if (!checkHotRatio(reds, hotSet, minHot.value, RED_PICK)) return false
  }
  return true
}

/** 带筛选的加权不放回抽样 */
function filteredSample(weights, maxNum, k, maxAttempts = 50) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const reds = weightedSampleWithoutReplace([...weights], maxNum, k)
    reds.sort((a, b) => a - b)
    if (passesFilters(reds)) return reds
  }
  if (minHot.value > 0) {
    const hotSet = getHotNumbers(redProb.value, hotThreshold.value)
    for (let attempt = 0; attempt < 20; attempt++) {
      const reds = weightedSampleWithoutReplace([...weights], maxNum, k)
      reds.sort((a, b) => a - b)
      if (checkHotRatio(reds, hotSet, minHot.value, RED_PICK)) return reds
    }
  }
  const fallback = weightedSampleWithoutReplace([...weights], maxNum, k)
  fallback.sort((a, b) => a - b)
  return fallback
}

/** 切换 Tab */
function switchRecTab(key) {
  activeRecTab.value = key
  if (!recData[key] || recData[key].length === 0) doGenerate(key)
}

/** 刷新当前 Tab */
function refreshActiveTab() {
  doGenerate(activeRecTab.value)
}

/** 按 Tab key 分发生成 */
function doGenerate(key) {
  recLoading.value = true
  const num = recCount.value
  const rw = redProb.value.slice(1, RED_MAX + 1)
  const bw = blueProb.value.slice(1, BLUE_MAX + 1)
  const result = []

  for (let i = 0; i < num; i++) {
    let reds
    switch (key) {
      case 'global':
        reds = filteredSample(rw, RED_MAX, RED_PICK)
        break
      case 'positional': {
        let ok = false
        for (let a = 0; a < 50; a++) {
          const sel = new Array(RED_PICK); const used = new Set(); let valid = true
          for (let pos = 1; pos <= RED_PICK; pos++) {
            const pw = posProb.value[`pos${pos}`]?.slice(1, RED_MAX + 1) || rw
            if (pw.every(v => v === 0)) { valid = false; break }
            const idx = weightedSampleOne(pw, RED_MAX)
            if (used.has(idx + 1)) { valid = false; break }
            sel[pos - 1] = idx + 1; used.add(idx + 1)
          }
          if (valid) { sel.sort((a, b) => a - b); if (passesFilters(sel)) { reds = sel; ok = true; break } }
        }
        if (!ok) reds = filteredSample(rw, RED_MAX, RED_PICK)
        break
      }
      case 'road012': {
        let ok = false
        for (let a = 0; a < 30; a++) {
          const cand = road012Sample(rw, RED_MAX, RED_PICK)
          if (passesFilters(cand)) { reds = cand; ok = true; break }
        }
        if (!ok) reds = filteredSample(rw, RED_MAX, RED_PICK)
        break
      }
      case 'headTail': {
        if (headTailCache.value) {
          let ok = false
          for (let a = 0; a < 30; a++) {
            const cand = headTailSample(rw, RED_MAX, RED_PICK, headTailCache.value.headProb, headTailCache.value.tailProb)
            if (passesFilters(cand)) { reds = cand; ok = true; break }
          }
          if (!ok) reds = filteredSample(rw, RED_MAX, RED_PICK)
        } else {
          reds = filteredSample(rw, RED_MAX, RED_PICK)
        }
        break
      }
      case 'spanSum': {
        if (spanSumCache.value) {
          const { minSpan, maxSpan, minSum, maxSum } = spanSumCache.value
          let ok = false
          for (let a = 0; a < 40; a++) {
            const cand = spanSumSample(rw, RED_MAX, RED_PICK, minSpan, maxSpan, minSum, maxSum)
            if (passesFilters(cand)) { reds = cand; ok = true; break }
          }
          if (!ok) reds = filteredSample(rw, RED_MAX, RED_PICK)
        } else {
          reds = filteredSample(rw, RED_MAX, RED_PICK)
        }
        break
      }
      case 'chaseCold': {
        const missing = calcMissingWeights(rawHistory.value.filter(item => {
          const sd = startDate.value; const ed = endDate.value || new Date().toISOString().slice(0, 10)
          return item.date >= sd && item.date <= ed
        }), RED_MAX)
        let ok = false
        for (let a = 0; a < 40; a++) {
          const cand = weightedSampleWithoutReplace([...missing], RED_MAX, RED_PICK)
          cand.sort((a, b) => a - b)
          if (passesFilters(cand)) { reds = cand; ok = true; break }
        }
        if (!ok) reds = filteredSample(rw, RED_MAX, RED_PICK)
        break
      }
      default:
        reds = filteredSample(rw, RED_MAX, RED_PICK)
    }
    result.push({ reds: reds || filteredSample(rw, RED_MAX, RED_PICK), blue: weightedSampleOne(bw, BLUE_MAX) + 1 })
  }
  recData[key] = result
  recLoading.value = false
}

/** 统计变化时清空所有缓存方案并刷新当前 tab */
function renderAllRecommendations() {
  for (const t of recTabs) delete recData[t.key]
  doGenerate(activeRecTab.value)
}

function refreshAll() {
  loading.value = true
  doComputeStatistics()
  // 清空方案缓存，回到整体概率 tab
  for (const t of recTabs) delete recData[t.key]
  activeRecTab.value = 'global'
  doGenerate('global')
  nextTick(() => { initChart(); renderChart(); })
  loading.value = false
}

// ==================== 图表 ====================
function computeAndValueHistory() {
  const sd = startDate.value; const ed = endDate.value || new Date().toISOString().slice(0, 10)
  return rawHistory.value.filter(item => item.date >= sd && item.date <= ed).map(item => item.reds.reduce((a, b) => a + b, 0))
}

function renderChart() {
  if (!chartRef.value || !chartInstance) return
  let option = {}
  const fr = redProb.value.slice(1, RED_MAX + 1)

  if (currentChart.value === 'hotCold') {
    const hc = fr.map((v, i) => ({ value: v, name: i + 1 })).sort((a, b) => b.value - a.value)
    option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 46, right: 20, top: 40, bottom: 24 },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: [...hc.slice(0, 10).map(d => d.name), ...hc.slice(-10).map(d => d.name)], inverse: true },
      series: [{
        type: 'bar',
        data: [...hc.slice(0, 10).map(d => ({ value: d.value, itemStyle: { color: '#ef4444' } })),
               ...hc.slice(-10).map(d => ({ value: d.value, itemStyle: { color: '#6366f1' } }))]
      }]
    }
  } else if (currentChart.value === 'redDist') {
    option = {
      tooltip: { trigger: 'axis' },
      grid: { left: 36, right: 16, top: 40, bottom: 24 },
      xAxis: { type: 'category', data: Array.from({ length: RED_MAX }, (_, i) => i + 1), axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: fr.map(v => ({ value: v, itemStyle: { color: '#ef4444' } })) }]
    }
  } else if (currentChart.value === 'blueDist') {
    const fb = blueProb.value.slice(1, BLUE_MAX + 1)
    option = {
      tooltip: { trigger: 'axis' },
      grid: { left: 36, right: 16, top: 40, bottom: 24 },
      xAxis: { type: 'category', data: Array.from({ length: BLUE_MAX }, (_, i) => i + 1) },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: fb.map(v => ({ value: v, itemStyle: { color: '#3b82f6' } })) }]
    }
  } else if (currentChart.value === 'sumTrend') {
    const sums = computeAndValueHistory()
    option = {
      tooltip: { trigger: 'axis' },
      grid: { left: 46, right: 24, top: 40, bottom: 24 },
      xAxis: { type: 'category', data: sums.map((_, i) => i + 1) },
      yAxis: { type: 'value', name: '和值' },
      series: [{
        type: 'line', data: sums, smooth: true,
        lineStyle: { color: '#ef4444', width: 2 },
        areaStyle: { color: 'rgba(239,68,68,0.08)' },
        itemStyle: { color: '#ef4444' }
      }]
    }
  }
  chartInstance.setOption(option, true)
}

function switchChart(key) { currentChart.value = key; renderChart() }

function initChart() {
  if (chartRef.value && !chartInstance) {
    chartInstance = echarts.init(chartRef.value)
    window.addEventListener('resize', () => chartInstance?.resize())
  }
}

// ==================== 辅助 ====================
function getHeatClass(val) {
  if (val > 5.5) return 'hot'
  if (val > 3.5) return 'warm'
  return ''
}
function getBlueHeatClass(val) {
  if (val > 8) return 'hot'
  if (val > 5.5) return 'warm'
  return ''
}
function getTopNByPos(pos, n = 5) {
  const arr = posProb.value[`pos${pos}`]
  if (!arr) return []
  return arr.slice(1).map((v, i) => ({ num: i + 1, pct: v })).sort((a, b) => b.pct - a.pct).slice(0, n)
}

// ==================== 生命周期 ====================
watch(decayLambda, () => { if (algoMode.value === 'weighted') refreshAll() })
watch([algoMode, recCount], () => refreshAll())
// 高级筛选变化时局部刷新推荐（不重算统计）
watch([minOdd, maxOdd, minSum, maxSum, minHot, hotThreshold, allowConsecutive, allowRepeat], () => {
  if (periodCount.value > 0) renderAllRecommendations()
})

// 关键修复：监听 periodCount 变化，DOM 出现后再初始化图表
watch(periodCount, (val) => {
  if (val > 0) nextTick(() => { initChart(); renderChart(); })
})

onMounted(() => {
  if (ssqData.value && ssqData.value.length > 0) {
    rawHistory.value = ssqData.value
    startDate.value = ssqData.value[0]?.date || startDate.value
  }
  refreshAll()
})

onUnmounted(() => {
  chartInstance?.dispose(); chartInstance = null
  window.removeEventListener('resize', () => chartInstance?.resize())
})
</script>

<style lang="scss" scoped>
@use './panelCommon.scss';

.ssq-panel { position: relative; }

// 位置概率简化版
.pos-top-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.pos-col {
  background: #fafbfc;
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid #f1f5f9;
}
.pos-col-title {
  font-size: 12px;
  font-weight: 700;
  color: #6d28d9;
  margin-bottom: 8px;
  text-align: center;
}
.pos-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 11px;
}
.pos-num {
  width: 22px;
  text-align: center;
  font-weight: 800;
  color: #334155;
}
.pos-pct {
  width: 36px;
  text-align: right;
  color: #94a3b8;
  font-size: 10px;
}
.pos-bar {
  flex: 1;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
  span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #a78bfa, #8b5cf6);
    border-radius: 3px;
    transition: width 0.3s;
  }
}

// 选中态
.rec-card.rec-selected {
  border-left-color: #6366f1 !important;
  background: rgba(99, 102, 241, 0.08) !important;
}

// ========== 深色模式 ==========
:global(html.dark-mode .ssq-panel) {
  .pos-col {
    background: #1e1e2e !important;
    border-color: #2d2d4a !important;
  }
  .pos-col-title { color: #a78bfa !important; }
  .pos-num { color: #94a3b8 !important; }
  .pos-pct { color: #64748b !important; }
  .pos-bar {
    background: #252540 !important;
    span { background: linear-gradient(90deg, #a78bfa, #c084fc); }
  }
  .rec-card.rec-selected {
    background: rgba(99, 102, 241, 0.1) !important;
  }
}

// 移动端额外适配
@media (max-width: 768px) {
  .pos-top-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .pos-col { padding: 8px; }
  .pos-row { gap: 3px; margin-bottom: 2px; }
  .pos-num { width: 18px; font-size: 11px; }
  .pos-pct { width: 30px; font-size: 9px; }
}

@media (max-width: 480px) {
  .pos-top-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; }
  .pos-col-title { font-size: 11px; }
}
</style>

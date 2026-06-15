<template>
  <div class="stock-filter-page fade-in">
    <!-- 个股妖性测评快捷入口 -->
    <div class="quick-eval-bar">
      <div class="quick-eval-inner">
        <div class="quick-eval-left">
          <el-icon :size="22"><DataAnalysis /></el-icon>
          <span class="quick-eval-title">个股妖性测评</span>
          <span class="quick-eval-desc">输入代码，一键评估</span>
        </div>
        <div class="quick-eval-right">
          <el-input
            v-model="evalCode"
            placeholder="输入股票代码，如 000001"
            size="default"
            clearable
            @keyup.enter="goEval"
            class="eval-input"
          />
          <el-button type="primary" @click="goEval" :disabled="!evalCode.trim()">
            <el-icon><TrendCharts /></el-icon> 测评
          </el-button>
        </div>
      </div>
    </div>

    <!-- 筛选区 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <div class="filter-item">
          <label>筛选模式</label>
          <el-select v-model="filterMode" style="width: 100%">
            <el-option label="🔥 全部妖股潜力股" value="all" />
            <el-option label="⚡ 启动初期（高爆发）" value="early" />
            <el-option label="📈 主升浪中" value="mid" />
            <el-option label="⏳ 蓄力突破阶段" value="pre" />
            <el-option label="⭐ 高评分（≥80分）" value="high_score" />
          </el-select>
        </div>
        <div class="filter-item">
          <label>最低换手率(%)</label>
          <el-input-number v-model="filterTurnoverMin" :min="0" :max="50" :step="1" style="width: 100%" />
        </div>
        <div class="filter-item">
          <label>最低量比</label>
          <el-input-number v-model="filterVolRatioMin" :min="0.1" :max="10" :step="0.1" :precision="1" style="width: 100%" />
        </div>
        <div class="filter-item">
          <label>最大流通市值(亿)</label>
          <el-input-number v-model="filterCapMax" :min="5" :max="50000" :step="5" style="width: 100%" />
        </div>
        <div class="filter-item">
          <label>最低5日涨幅(%)</label>
          <el-input-number v-model="filterGainMin" :min="-20" :max="60" :step="1" style="width: 100%" />
        </div>
        <div class="filter-item filter-actions">
          <el-button type="primary" @click="refreshAll" :loading="loading">
            <el-icon><Search /></el-icon> 开始筛选
          </el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
      <div class="quick-stocks">
        <el-radio-group v-model="selectedBoard" size="small" @change="switchBoard">
          <el-radio-button value="all">全A股</el-radio-button>
          <el-radio-button value="sh">上证主板</el-radio-button>
          <el-radio-button value="sz">深证主板</el-radio-button>
          <el-radio-button value="cyb">创业板</el-radio-button>
          <el-radio-button value="kcb">科创板</el-radio-button>
        </el-radio-group>
        <span class="board-info" v-if="boardStockCount > 0">
          共 <strong>{{ boardStockCount }}</strong> 只成分股
        </span>
      </div>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <span class="table-title"><el-icon><DataLine /></el-icon> 筛选结果（共 {{ filteredData.length }} 只）</span>
          <div class="table-header-right">
            <el-tag type="warning" size="small" effect="plain">实时行情数据</el-tag>
          </div>
        </div>
      </template>

      <div v-if="!loading && allData.length === 0" class="empty-state">
        <el-empty description="暂无筛选结果" :image-size="100">
          <template #description>
            <p class="empty-desc">当前筛选条件下没有匹配的股票</p>
            <p class="empty-hint">请尝试放宽筛选条件或切换板块</p>
          </template>
          <el-button type="primary" @click="resetFilters">重置条件</el-button>
        </el-empty>
      </div>
      <div v-else-if="!loading && filteredData.length === 0 && allData.length > 0" class="empty-state">
        <el-empty description="前端过滤无结果" :image-size="80">
          <template #description>
            <p class="empty-hint">原始数据中有 {{ allData.length }} 只股票，但当前过滤模式下无匹配项</p>
          </template>
          <el-button @click="resetFilters">重置过滤</el-button>
        </el-empty>
      </div>

      <el-table
        v-else
        :data="pagedData"
        v-loading="loading"
        element-loading-text="正在获取实时行情..."
        element-loading-background="rgba(255,255,255,0.7)"
        stripe
        class="pc-table"
        :default-sort="{ prop: 'score', order: 'descending' }"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="code" label="代码" width="100" sortable="custom" fixed />
        <el-table-column prop="name" label="名称" width="110" fixed />
        <el-table-column prop="price" label="最新价" width="90" sortable="custom">
          <template #default="{ row }">
            <span>{{ row.price?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="changePct" label="涨跌幅" width="100" sortable="custom">
          <template #default="{ row }">
            <span :class="row.changePct >= 0 ? 'text-up' : 'text-down'">
              {{ row.changePct >= 0 ? '+' : '' }}{{ row.changePct?.toFixed(2) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="turnover" label="换手率%" width="100" sortable="custom">
          <template #default="{ row }">
            <span>{{ row.turnover?.toFixed(1) }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="volumeRatio" label="量比" width="80" sortable="custom">
          <template #default="{ row }">
            <span>{{ row.volumeRatio?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="gain5d" label="5日涨幅" width="100" sortable="custom">
          <template #default="{ row }">
            <span :class="row.gain5d >= 0 ? 'text-up' : 'text-down'">
              {{ row.gain5d >= 0 ? '+' : '' }}{{ row.gain5d?.toFixed(1) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="marketCap" label="流通市值(亿)" width="120" sortable="custom">
          <template #default="{ row }">
            <span>{{ row.marketCap?.toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="amplitude" label="振幅%" width="90" sortable="custom">
          <template #default="{ row }">
            <span :class="row.amplitude >= 6 ? 'text-up' : row.amplitude >= 3 ? 'text-warn' : ''">
              {{ row.amplitude?.toFixed(1) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="stageName" label="启动阶段" width="150">
          <template #default="{ row }">
            <el-tag :type="getStageTagType(row.stageType)" size="small" effect="dark">
              {{ row.stageName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="评分" width="90" sortable="custom">
          <template #default="{ row }">
            <span :class="getScoreClass(row.score)" class="score-cell">{{ row.score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="recommendLevel" label="推荐度" width="110" sortable="custom">
          <template #default="{ row }">
            <span :style="{ color: row.recommendColor, fontWeight: 700 }">
              {{ row.recommendEmoji }} {{ row.recommendLevel }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="themeHeat" label="题材热度" width="100" sortable="custom">
          <template #default="{ row }">
            <el-progress :percentage="row.themeHeat" :stroke-width="6" :show-text="true" :color="row.themeHeat > 70 ? '#f97316' : row.themeHeat > 50 ? '#eab308' : '#94a3b8'" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="goDetail(row)">
              <el-icon><DataAnalysis /></el-icon> 详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 手机端豆腐块卡片 -->
      <div v-show="!loading && filteredData.length > 0" v-loading="loading" element-loading-text="正在获取实时行情..." element-loading-background="rgba(255,255,255,0.7)" class="mobile-card-list">
        <el-card v-for="row in pagedData" :key="row.code" class="stock-card" shadow="hover" @click="goDetail(row)">
          <div class="card-top">
            <div class="card-code-name">
              <span class="card-code">{{ row.code }}</span>
              <span class="card-name">{{ row.name }}</span>
            </div>
            <el-tag :type="getStageTagType(row.stageType)" size="small" effect="dark">
              {{ row.stageName }}
            </el-tag>
          </div>
          <div class="card-price-row">
            <span class="card-price">{{ row.price?.toFixed(2) }}</span>
            <span :class="row.changePct >= 0 ? 'text-up' : 'text-down'" class="card-change">
              {{ row.changePct >= 0 ? '+' : '' }}{{ row.changePct?.toFixed(2) }}%
            </span>
            <span :class="getScoreClass(row.score)" class="card-score">{{ row.score }}分</span>
          </div>
          <div class="card-metrics">
            <div class="card-metric">
              <span class="metric-label">换手率</span>
              <span class="metric-value">{{ row.turnover?.toFixed(1) }}%</span>
            </div>
            <div class="card-metric">
              <span class="metric-label">量比</span>
              <span class="metric-value">{{ row.volumeRatio?.toFixed(2) }}</span>
            </div>
            <div class="card-metric">
              <span class="metric-label">5日涨幅</span>
              <span class="metric-value" :class="row.gain5d >= 0 ? 'text-up' : 'text-down'">
                {{ row.gain5d >= 0 ? '+' : '' }}{{ row.gain5d?.toFixed(1) }}%
              </span>
            </div>
            <div class="card-metric">
              <span class="metric-label">振幅</span>
              <span class="metric-value" :class="row.amplitude >= 6 ? 'text-up' : row.amplitude >= 3 ? 'text-warn' : ''">
                {{ row.amplitude?.toFixed(1) }}%
              </span>
            </div>
          </div>
          <div class="card-footer">
            <span class="card-cap">市值 {{ row.marketCap?.toFixed(1) }}亿</span>
            <span class="card-rec" :style="{ color: row.recommendColor }">
              {{ row.recommendEmoji }} {{ row.recommendLevel }}
            </span>
          </div>
        </el-card>
      </div>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredData.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </el-card>

    <div class="footer-note">
      <el-icon><InfoFilled /></el-icon>
      评分权重：流通市值(22%) + 换手率(22%) + 量比(18%) + 5日涨幅(15%) + 题材热度(10%) + 振幅(8%)，附加主力资金流向/波动率/连涨天数动态调节。数据实时获取，请理性参考。
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Search, DataLine, TrendCharts, WarningFilled, InfoFilled, DataAnalysis
} from '@element-plus/icons-vue'

const router = useRouter()

// ==================== 板块配置 ====================
const BOARD_FS = {
  all: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
  sh: 'm:1+t:2',
  sz: 'm:0+t:6',
  cyb: 'm:0+t:80',
  kcb: 'm:1+t:23'
}
const BOARD_NAMES = { all: '全A股', sh: '上证主板', sz: '深证主板', cyb: '创业板', kcb: '科创板' }

// ==================== 筛选状态 ====================
const filterMode = ref('all')
const filterTurnoverMin = ref(5)
const filterVolRatioMin = ref(1.5)
const filterCapMax = ref(150)
const filterGainMin = ref(2)
const selectedBoard = ref('all')
const loading = ref(false)
const allData = ref([])
const boardStockCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const sortProp = ref('score')
const sortOrder = ref('descending')
let abortController = null

// ==================== 个股妖性测评快捷入口 ====================
const evalCode = ref('')
function goEval() {
  const code = evalCode.value.trim()
  if (!code) {
    ElMessage.warning('请输入股票代码')
    return
  }
  router.push({
    path: '/home/fund/stock-detail',
    query: { code }
  })
}

// ==================== 数据获取 ====================
async function fetchBoardSnapshot(board) {
  const fs = BOARD_FS[board]
  const PAGE_SIZE = 2000
  const signal = abortController?.signal
  const url1 = `/staticTool/api/push2/api/qt/clist/get?pn=1&pz=${PAGE_SIZE}&po=1&np=1&fltt=2&invt=2&fid=f3&fs=${fs}&fields=f2,f3,f5,f6,f7,f8,f10,f12,f14,f20,f21`
  const response = await fetch(url1, { signal })
  if (!response.ok) throw new Error(`板块行情请求失败 HTTP ${response.status}`)
  const json = await response.json()
  if (!json?.data?.diff?.length) throw new Error('板块无数据')

  const total = json.data.total || 0
  let allDiff = [...json.data.diff]

  if (total > PAGE_SIZE) {
    const totalPages = Math.ceil(total / PAGE_SIZE)
    for (let pn = 2; pn <= totalPages; pn++) {
      const url = `/staticTool/api/push2/api/qt/clist/get?pn=${pn}&pz=${PAGE_SIZE}&po=1&np=1&fltt=2&invt=2&fid=f3&fs=${fs}&fields=f2,f3,f5,f6,f7,f8,f10,f12,f14,f20,f21`
      try {
        const res = await fetch(url, { signal })
        const j = await res.json()
        if (j?.data?.diff?.length) {
          allDiff = allDiff.concat(j.data.diff)
        }
      } catch (e) {
        if (e.name === 'AbortError') throw e
        console.warn(`拉取第${pn}页失败:`, e.message)
      }
    }
  }

  return { total, diff: allDiff }
}

function parseBoardRow(row) {
  const price = row.f2 || 0
  const changePct = row.f3 || 0
  const volumeHand = row.f5 || 0
  const amount = row.f6 || 0
  const amplitude = row.f7 || 0
  const turnoverRaw = row.f8 || 0
  const volumeRatio = row.f10 || 1
  const code = row.f12 || ''
  const name = row.f14 || ''
  const totalCap = row.f20 || 0
  const floatCap = row.f21 || 0

  const marketCapRaw = floatCap > 0 ? floatCap / 1e8 : (totalCap > 0 ? totalCap / 1e8 : 0)
  const amountWan = amount / 1e4

  return {
    code, name, price,
    changePct, amplitude,
    volumeHand, amountWan,
    volumeRatio,
    turnoverRaw,
    marketCapRaw: +marketCapRaw.toFixed(2)
  }
}

async function fetchKline(codeRaw, days = 100) {
  let code = codeRaw.toString().trim()
  let market
  if (code.startsWith('sh')) {
    market = 'sh'
    code = code.replace('sh', '')
  } else if (code.startsWith('sz')) {
    market = 'sz'
    code = code.replace('sz', '')
  } else if (/^6/.test(code)) {
    market = 'sh'
  } else {
    market = 'sz'
  }
  const url = `/staticTool/api/ifzq/appstock/app/fqkline/get?param=${market}${code},day,,,${days},qfq`
  const response = await fetch(url, { signal: abortController?.signal })
  if (!response.ok) throw new Error(`K线请求失败 HTTP ${response.status}`)
  const json = await response.json()
  const dataKey = `${market}${code}`
  const klines = json?.data?.[dataKey]?.day || json?.data?.[dataKey]?.qfqday
  if (!klines?.length) throw new Error('K线数据获取失败')
  return klines.map((item, idx, arr) => {
    const close = parseFloat(item[2])
    let changePct = 0
    if (idx > 0) {
      const prevClose = parseFloat(arr[idx - 1][2])
      if (prevClose > 0) changePct = (close - prevClose) / prevClose * 100
    }
    return {
      date: item[0],
      open: parseFloat(item[1]),
      close,
      high: parseFloat(item[3]),
      low: parseFloat(item[4]),
      volume: parseInt(item[5]) || 0,
      amount: parseFloat(item[6]) || 0,
      changePct: +changePct.toFixed(2)
    }
  })
}

// ==================== 因子提取 ====================
function extractFactors(realtime, klines) {
  const { price, volumeRatio, turnoverRaw, marketCapRaw, changePct, amountWan, amplitude } = realtime
  const name = realtime.name || ''

  let turnover = turnoverRaw
  if (!turnover && marketCapRaw > 0 && amountWan > 0) {
    turnover = (amountWan * 10000) / (marketCapRaw * 1e8) * 100
  }
  turnover = Math.min(turnover || 0, 60)

  let gain5d = changePct
  if (klines?.length >= 5) {
    const recent5 = klines.slice(-5)
    let cumGain = 0
    for (let i = 1; i < recent5.length; i++) cumGain += recent5[i].changePct || 0
    if (Math.abs(cumGain) < 0.05 && recent5[0].close > 0) {
      cumGain = (recent5[recent5.length - 1].close - recent5[0].close) / recent5[0].close * 100
    }
    gain5d = isFinite(cumGain) ? cumGain : changePct
  }

  let themeHeat = 50
  const hotKeywords = ['科技', '信息', '智能', '数据', 'AI', '半导体', '芯片', '新能源', '光伏', '医药', '生物', '医疗']
  for (const kw of hotKeywords) {
    if (name.includes(kw)) themeHeat += 20
  }
  if (name.includes('ST') || name.includes('*ST')) themeHeat -= 35
  if (gain5d > 20) themeHeat += 15
  else if (gain5d > 12) themeHeat += 8
  else if (gain5d > 5) themeHeat += 3
  else if (gain5d < -8) themeHeat -= 15
  else if (gain5d < -3) themeHeat -= 5
  themeHeat = Math.min(98, Math.max(10, themeHeat))

  let moneyFlow = 0
  if (klines?.length >= 10) {
    const recent5Avg = klines.slice(-5).reduce((s, k) => s + (k.amount || 0), 0) / 5
    const prev5Avg = klines.slice(-10, -5).reduce((s, k) => s + (k.amount || 0), 0) / 5
    if (prev5Avg > 0) {
      const ratio = recent5Avg / prev5Avg
      if (ratio > 1.3 && changePct > 0) moneyFlow = Math.min(ratio * 6, 15)
      else if (ratio > 1.1) moneyFlow = Math.min(ratio * 2, 6)
      else if (ratio < 0.85 && changePct < 0) moneyFlow = -Math.min((1 / ratio) * 2.5, 10)
      else if (ratio < 0.92) moneyFlow = -2
    }
  }

  let volatility20d = 0
  if (klines?.length >= 20) {
    const recent20 = klines.slice(-20)
    const returns = recent20.map(k => k.changePct || 0)
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length
    volatility20d = Math.sqrt(variance) * Math.sqrt(250)
  }

  let consecutiveUpDays = 0
  if (klines?.length) {
    for (let i = klines.length - 1; i >= 0; i--) {
      if (klines[i].changePct > 0) consecutiveUpDays++
      else break
    }
  }

  return {
    marketCap: marketCapRaw || 50,
    turnover, volumeRatio: volumeRatio || 1,
    gain5d: +gain5d.toFixed(2),
    themeHeat: Math.round(themeHeat),
    moneyFlow: isFinite(moneyFlow) ? +moneyFlow.toFixed(1) : 0,
    price, changePct, volatility20d: isFinite(volatility20d) ? +volatility20d.toFixed(1) : 0,
    consecutiveUpDays,
    amplitude: amplitude || 0
  }
}

// ==================== 评分与阶段 ====================
function computeScores(factors) {
  const { marketCap, turnover, volumeRatio, gain5d, themeHeat, moneyFlow, volatility20d, consecutiveUpDays, amplitude } = factors

  let marketScore
  if (marketCap <= 5) marketScore = 45
  else if (marketCap <= 15) marketScore = 92
  else if (marketCap <= 25) marketScore = 95
  else if (marketCap <= 50) marketScore = 82
  else if (marketCap <= 80) marketScore = 65
  else if (marketCap <= 120) marketScore = 48
  else if (marketCap <= 200) marketScore = 28
  else marketScore = 12

  let turnoverScore
  if (turnover >= 8 && turnover <= 25) turnoverScore = 95
  else if (turnover >= 5 && turnover < 8) turnoverScore = 72
  else if (turnover > 25 && turnover <= 35) turnoverScore = 55
  else if (turnover > 35 && turnover <= 45) turnoverScore = 30
  else if (turnover > 45 && turnover <= 55) turnoverScore = 18
  else if (turnover > 55) turnoverScore = 10
  else if (turnover < 3) turnoverScore = 10
  else if (turnover < 5) turnoverScore = 25
  else turnoverScore = 12

  let volScore
  if (volumeRatio >= 3.0) volScore = 95
  else if (volumeRatio >= 2.5) volScore = 88
  else if (volumeRatio >= 1.8) volScore = 78
  else if (volumeRatio >= 1.3) volScore = 60
  else if (volumeRatio >= 0.9) volScore = 40
  else volScore = 20

  let gainScore
  if (gain5d >= 10 && gain5d <= 35) gainScore = 95
  else if (gain5d >= 5 && gain5d < 10) gainScore = 75
  else if (gain5d >= 1 && gain5d < 5) gainScore = 55
  else if (gain5d > 35 && gain5d <= 50) gainScore = 45
  else if (gain5d < 1 && gain5d > -5) gainScore = 30
  else gainScore = 15

  let ampScore = 0
  if (amplitude >= 8) ampScore = 95
  else if (amplitude >= 6) ampScore = 82
  else if (amplitude >= 4) ampScore = 65
  else if (amplitude >= 2.5) ampScore = 45
  else ampScore = 20

  let volaBonus = 0
  if (volatility20d > 80) volaBonus = 8
  else if (volatility20d > 60) volaBonus = 5
  else if (volatility20d > 40) volaBonus = 2

  let consecutiveBonus = Math.min(consecutiveUpDays * 1.5, 8)

  let moneyBonus = moneyFlow > 4 ? 12 : moneyFlow > 2 ? 8 : moneyFlow > 1 ? 4 : moneyFlow < -3 ? -12 : moneyFlow < -1 ? -5 : 0

  let total = marketScore * 0.22 + turnoverScore * 0.22 + volScore * 0.18 + gainScore * 0.15 + ampScore * 0.08 + themeHeat * 0.10
  total += volaBonus + consecutiveBonus + moneyBonus
  total = Math.min(100, Math.max(10, Math.round(total)))
  return { total, marketScore, turnoverScore, volScore, gainScore }
}

function getStage(factors, score) {
  const { gain5d, turnover, volumeRatio } = factors
  if (gain5d >= 2 && gain5d < 12 && volumeRatio >= 1.2 && turnover >= 5 && turnover < 15) {
    return { name: '启动前·蓄力突破', type: 'pre' }
  }
  if (gain5d >= 8 && gain5d < 25 && volumeRatio >= 1.8 && turnover >= 8 && turnover <= 30) {
    return { name: '启动初期·主升浪开端', type: 'early' }
  }
  if (gain5d >= 20 && gain5d <= 48 && turnover >= 12 && turnover <= 30 && volumeRatio >= 2.2) {
    return { name: '主升浪中·妖性绽放', type: 'mid' }
  }
  if (gain5d > 45 || (turnover > 32 && gain5d < 8) || (volumeRatio < 1.2 && gain5d > 20)) {
    return { name: '高风险区·鱼尾行情', type: 'risk' }
  }
  if (gain5d < 2 && turnover < 6) {
    return { name: '冷门低迷期', type: 'cold' }
  }
  if (gain5d >= 12 && gain5d < 22) {
    return { name: '启动确认·上涨中继', type: 'early' }
  }
  return { name: '震荡试盘阶段', type: 'pre' }
}

function getRecommendation(score, stageType) {
  if (stageType === 'risk') return { level: '回避', color: '#b91c1c', emoji: '⛔' }
  if (score >= 85) return { level: '强烈推荐', color: '#f97316', emoji: '🔥🔥' }
  if (score >= 72) return { level: '重点关注', color: '#eab308', emoji: '⭐' }
  if (score >= 58) return { level: '适当关注', color: '#3b82f6', emoji: '👀' }
  return { level: '谨慎观望', color: '#6c7a91', emoji: '🌀' }
}

// ==================== 粗筛 ====================
function quickFilter(row, opts) {
  const { capMax, turnoverMin, volRatioMin, gainMin, mode } = opts
  const name = row.f14 || ''
  const cap = (row.f21 || 0) / 1e8
  const turnover = row.f8 || 0
  const volRatio = row.f10 || 0
  const changePct = row.f3 || 0
  const amplitude = row.f7 || 0

  if (name.includes('ST') || name.includes('*ST') || name.startsWith('N')) return false
  if (turnover < 0.01 && Math.abs(changePct) < 0.01) return false
  if (cap > capMax) return false
  if (turnover < turnoverMin) return false
  if (volRatio < volRatioMin) return false
  if (changePct < gainMin) return false

  if (mode === 'early') {
    if (turnover < 5 || turnover > 15) return false
    if (volRatio < 1.5) return false
    if (changePct < 2 || changePct > 12) return false
    if (amplitude < 4) return false
  } else if (mode === 'mid') {
    if (turnover < 10) return false
    if (volRatio < 2.0) return false
    if (changePct < 8) return false
  } else if (mode === 'pre') {
    if (turnover < 3 || turnover > 8) return false
    if (volRatio < 1.1) return false
    if (changePct < -2 || changePct > 5) return false
    if (amplitude < 3) return false
  }

  if (amplitude < 2 && turnover < 8) return false
  return true
}

// ==================== 构建结果行 ====================
function buildResultRow(snapshot, klines) {
  const realtime = parseBoardRow(snapshot)
  const factors = extractFactors(realtime, klines)
  const { total: score } = computeScores(factors)
  const stageObj = getStage(factors, score)
  const rec = getRecommendation(score, stageObj.type)

  return {
    code: realtime.code,
    name: realtime.name,
    price: realtime.price,
    changePct: realtime.changePct,
    turnover: factors.turnover,
    volumeRatio: factors.volumeRatio,
    gain5d: factors.gain5d,
    marketCap: factors.marketCap,
    themeHeat: factors.themeHeat,
    moneyFlow: factors.moneyFlow,
    volatility20d: factors.volatility20d,
    consecutiveUpDays: factors.consecutiveUpDays,
    amplitude: factors.amplitude,
    score,
    stageName: stageObj.name,
    stageType: stageObj.type,
    recommendLevel: rec.level,
    recommendColor: rec.color,
    recommendEmoji: rec.emoji
  }
}

// ==================== 批量筛选 ====================
async function refreshAll() {
  if (abortController) abortController.abort()
  abortController = new AbortController()
  loading.value = true
  allData.value = []
  currentPage.value = 1

  try {
    const board = selectedBoard.value
    ElMessage.info(`正在获取${BOARD_NAMES[board]}行情数据...`)
    const snapshotData = await fetchBoardSnapshot(board)
    boardStockCount.value = snapshotData.total || snapshotData.diff.length

    const opts = {
      capMax: filterCapMax.value,
      turnoverMin: filterTurnoverMin.value,
      volRatioMin: filterVolRatioMin.value,
      gainMin: filterGainMin.value,
      mode: filterMode.value !== 'all' && filterMode.value !== 'high_score' ? filterMode.value : null
    }
    const passed = snapshotData.diff.filter(row => quickFilter(row, opts))

    ElMessage.info(`${BOARD_NAMES[board]}共 ${boardStockCount.value} 只，粗筛通过 ${passed.length} 只，正在获取K线评分...`)

    if (passed.length === 0) {
      loading.value = false
      ElMessage.warning('粗筛后无股票通过，请放宽筛选条件')
      return
    }

    const BATCH = 6
    for (let i = 0; i < passed.length; i += BATCH) {
      const batch = passed.slice(i, i + BATCH)
      const results = await Promise.all(
        batch.map(async (row) => {
          try {
            let klines = []
            try { klines = await fetchKline(row.f12, 100) } catch (e) { /* 容错 */ }
            return buildResultRow(row, klines)
          } catch (e) {
            console.warn(`评估 ${row.f12} 失败:`, e.message)
            return null
          }
        })
      )
      for (const r of results) {
        if (r) allData.value.push(r)
      }
    }

    allData.value.sort((a, b) => b.score - a.score)
    loading.value = false
    ElMessage.success(`筛选完成，共 ${allData.value.length} 只股票`)
  } catch (e) {
    if (e.name === 'AbortError') return
    console.error('筛选失败:', e)
    loading.value = false
    ElMessage.error(`筛选失败：${e.message}`)
  }
}

const filteredData = computed(() => {
  let data = [...allData.value]

  if (filterMode.value === 'early') data = data.filter(d => d.stageType === 'early')
  else if (filterMode.value === 'mid') data = data.filter(d => d.stageType === 'mid')
  else if (filterMode.value === 'pre') data = data.filter(d => d.stageType === 'pre')
  else if (filterMode.value === 'high_score') data = data.filter(d => d.score >= 80)

  if (sortProp.value) {
    data.sort((a, b) => {
      const va = a[sortProp.value]
      const vb = b[sortProp.value]
      const dir = sortOrder.value === 'ascending' ? 1 : -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
  }
  return data
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

function handleSortChange({ prop, order }) {
  sortProp.value = prop
  sortOrder.value = order
}

function resetFilters() {
  filterMode.value = 'all'
  filterTurnoverMin.value = 5
  filterVolRatioMin.value = 1.5
  filterCapMax.value = 150
  filterGainMin.value = 2
  currentPage.value = 1
  refreshAll()
}

function switchBoard() {
  if (selectedBoard.value === 'kcb') {
    filterCapMax.value = 300
    filterTurnoverMin.value = 4
    filterVolRatioMin.value = 1.5
    filterGainMin.value = 2
  } else if (selectedBoard.value === 'cyb') {
    filterCapMax.value = 150
    filterTurnoverMin.value = 5
    filterVolRatioMin.value = 1.5
    filterGainMin.value = 2
  } else {
    filterCapMax.value = 150
    filterTurnoverMin.value = 5
    filterVolRatioMin.value = 1.5
    filterGainMin.value = 2
  }
  filterMode.value = 'all'
  currentPage.value = 1
  refreshAll()
}

function goDetail(row) {
  router.push({
    path: '/home/fund/stock-detail',
    query: { code: row.code, name: row.name }
  })
}

function getStageTagType(type) {
  return type === 'early' ? 'success' : type === 'mid' ? 'warning' : type === 'risk' ? 'danger' : 'info'
}
function getScoreClass(score) {
  if (score >= 85) return 'score-high'
  if (score >= 70) return 'score-mid'
  return 'score-low'
}

onMounted(() => {
  refreshAll()
})

onBeforeUnmount(() => {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
})
</script>

<style lang="scss" scoped>
  @import url('../style/stockFilter/index.scss');
</style>

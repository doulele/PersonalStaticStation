<template>
  <div class="stock-filter-page">
    <!-- 头部 -->
    <div class="hero">
      <div class="hero-content">
        <h1>
          <el-icon :size="28"><TrendCharts /></el-icon>
          妖股潜力筛选
          <span class="badge">多因子量化模型</span>
        </h1>
        <p>基于换手率、量比、流通市值、动量、题材热度等多因子体系，实时筛选A股中具备妖股潜力的标的。数据来源：东方财富板块行情（粗筛）+ 腾讯日K线（深度评分）。</p>
      </div>
      <div class="disclaimer">
        <el-icon><WarningFilled /></el-icon>
        模型仅供技术研究与学习参考，不构成任何投资建议。妖股波动巨大，请理性评估风险。
      </div>
    </div>

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
        <span class="quick-label">选择板块：</span>
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
          <span><el-icon><DataLine /></el-icon> 筛选结果（共 {{ filteredData.length }} 只）</span>
          <el-tag type="warning" size="small" effect="plain">实时行情数据</el-tag>
        </div>
      </template>

      <el-table
        :data="pagedData"
        v-loading="loading"
        element-loading-text="正在获取实时行情..."
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
      <div v-loading="loading" element-loading-text="正在获取实时行情..." class="mobile-card-list">
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Search, DataLine, TrendCharts, WarningFilled, InfoFilled, DataAnalysis
} from '@element-plus/icons-vue'

const router = useRouter()

// ==================== 板块配置 ====================
// 东方财富板块代码 fs 参数
const BOARD_FS = {
  all: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',   // 全A股：深证+创业板+上证+科创板
  sh: 'm:1+t:2',       // 上证主板
  sz: 'm:0+t:6',       // 深证主板
  cyb: 'm:0+t:80',     // 创业板
  kcb: 'm:1+t:23'      // 科创板
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
const boardStockCount = ref(0)  // 板块成分股总数
const currentPage = ref(1)
const pageSize = ref(20)
const sortProp = ref('score')
const sortOrder = ref('descending')

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

// ==================== 数据获取：东方财富板块行情接口（一次获取整个板块） ====================
async function fetchBoardSnapshot(board) {
  const fs = BOARD_FS[board]
  const PAGE_SIZE = 2000
  // 先获取第一页，确定总数
  const url1 = `/api-push2/api/qt/clist/get?pn=1&pz=${PAGE_SIZE}&po=1&np=1&fltt=2&invt=2&fid=f3&fs=${fs}&fields=f2,f3,f5,f6,f7,f8,f10,f12,f14,f20,f21`
  const response = await fetch(url1)
  if (!response.ok) throw new Error(`板块行情请求失败 HTTP ${response.status}`)
  const json = await response.json()
  if (!json?.data?.diff?.length) throw new Error('板块无数据')
  
  const total = json.data.total || 0
  let allDiff = [...json.data.diff]
  
  // 如果总数超过一页，继续拉取后续页
  if (total > PAGE_SIZE) {
    const totalPages = Math.ceil(total / PAGE_SIZE)
    for (let pn = 2; pn <= totalPages; pn++) {
      const url = `/api-push2/api/qt/clist/get?pn=${pn}&pz=${PAGE_SIZE}&po=1&np=1&fltt=2&invt=2&fid=f3&fs=${fs}&fields=f2,f3,f5,f6,f7,f8,f10,f12,f14,f20,f21`
      try {
        const res = await fetch(url)
        const j = await res.json()
        if (j?.data?.diff?.length) {
          allDiff = allDiff.concat(j.data.diff)
        }
      } catch (e) {
        console.warn(`拉取第${pn}页失败:`, e.message)
      }
    }
  }
  
  return { total, diff: allDiff }
}

/**
 * 从东方财富板块快照中解析实时行情数据
 * 字段映射：
 *   f2=最新价, f3=涨跌幅%, f5=成交量(手), f6=成交额, f7=振幅%
 *   f8=换手率%, f10=量比, f12=代码, f14=名称
 *   f20=总市值, f21=流通市值
 */
function parseBoardRow(row) {
  const price = row.f2 || 0
  const changePct = row.f3 || 0
  const volumeHand = row.f5 || 0
  const amount = row.f6 || 0          // 成交额（元）
  const amplitude = row.f7 || 0
  const turnoverRaw = row.f8 || 0     // 换手率%
  const volumeRatio = row.f10 || 1    // 量比
  const code = row.f12 || ''
  const name = row.f14 || ''
  const totalCap = row.f20 || 0       // 总市值
  const floatCap = row.f21 || 0       // 流通市值

  // 流通市值（亿元）
  const marketCapRaw = floatCap > 0 ? floatCap / 1e8 : (totalCap > 0 ? totalCap / 1e8 : 0)
  // 成交额（万元）
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
  // 构造腾讯K线接口的市场前缀: sh → sh, sz → sz
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
  const url = `/api-ifzq/appstock/app/fqkline/get?param=${market}${code},day,,,${days},qfq`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`K线请求失败 HTTP ${response.status}`)
  const json = await response.json()
  const dataKey = `${market}${code}`
  // 腾讯前复权K线数据的key是 qfqday 而非 day
  const klines = json?.data?.[dataKey]?.day || json?.data?.[dataKey]?.qfqday
  if (!klines?.length) throw new Error('K线数据获取失败')
  // 腾讯K线格式: [日期, 开盘, 收盘, 最高, 最低, 成交量]，无涨跌幅字段
  // 需要自己根据相邻两根K线计算涨跌幅
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
      amount: parseFloat(item[5]) || 0,
      changePct: +changePct.toFixed(2)
    }
  })
}

// ==================== 因子提取 ====================
function extractFactors(realtime, klines) {
  const { price, volumeRatio, turnoverRaw, marketCapRaw, changePct, amountWan, amplitude } = realtime
  const name = realtime.name || ''

  // 换手率：东方财富接口直接提供，兜底用成交额/流通市值估算
  let turnover = turnoverRaw
  if (!turnover && marketCapRaw > 0 && amountWan > 0) {
    turnover = (amountWan * 10000) / (marketCapRaw * 1e8) * 100
  }
  turnover = Math.min(turnover || 0, 50)

  // 5日涨幅：取最近5个交易日的累计涨跌幅
  let gain5d = changePct
  if (klines?.length >= 5) {
    const recent5 = klines.slice(-5)
    let cumGain = 0
    for (let i = 1; i < recent5.length; i++) cumGain += recent5[i].changePct || 0
    if (Math.abs(cumGain) < 0.05) {
      cumGain = (recent5[recent5.length - 1].close - recent5[0].close) / recent5[0].close * 100
    }
    gain5d = cumGain
  }

  // 题材热度：名称关键词 + 涨幅动态调整
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

  // 主力资金流向：近5日均成交额 vs 前5日均成交额
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

  // 20日波动率：衡量妖股基因
  let volatility20d = 0
  if (klines?.length >= 20) {
    const recent20 = klines.slice(-20)
    const returns = recent20.map(k => k.changePct || 0)
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length
    volatility20d = Math.sqrt(variance) * Math.sqrt(250) // 年化波动率
  }

  // 连涨天数
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
    moneyFlow: +moneyFlow.toFixed(1),
    price, changePct, volatility20d: +volatility20d.toFixed(1),
    consecutiveUpDays,
    amplitude: amplitude || 0
  }
}

// ==================== 评分与阶段 ====================
function computeScores(factors) {
  const { marketCap, turnover, volumeRatio, gain5d, themeHeat, moneyFlow, volatility20d, consecutiveUpDays, amplitude } = factors

  // 流通市值评分（小盘优先，25亿以下满分，但低于5亿扣分—庄股风险）
  let marketScore
  if (marketCap <= 5) marketScore = 45
  else if (marketCap <= 15) marketScore = 92
  else if (marketCap <= 25) marketScore = 95
  else if (marketCap <= 50) marketScore = 82
  else if (marketCap <= 80) marketScore = 65
  else if (marketCap <= 120) marketScore = 48
  else if (marketCap <= 200) marketScore = 28
  else marketScore = 12

  // 换手率评分（黄金区间8~25%，过高换手是出货信号）
  let turnoverScore
  if (turnover >= 8 && turnover <= 25) turnoverScore = 95
  else if (turnover >= 5 && turnover < 8) turnoverScore = 72
  else if (turnover > 25 && turnover <= 35) turnoverScore = 55
  else if (turnover > 35 && turnover <= 45) turnoverScore = 30
  else if (turnover < 3) turnoverScore = 10
  else if (turnover < 5) turnoverScore = 25
  else turnoverScore = 12

  // 量比评分（≥2.5为放量突破，1.5~2.5为温和放量）
  let volScore
  if (volumeRatio >= 3.0) volScore = 95
  else if (volumeRatio >= 2.5) volScore = 88
  else if (volumeRatio >= 1.8) volScore = 78
  else if (volumeRatio >= 1.3) volScore = 60
  else if (volumeRatio >= 0.9) volScore = 40
  else volScore = 20

  // 5日涨幅评分（10~35%最佳区间，过高则风险溢价衰减）
  let gainScore
  if (gain5d >= 10 && gain5d <= 35) gainScore = 95
  else if (gain5d >= 5 && gain5d < 10) gainScore = 75
  else if (gain5d >= 1 && gain5d < 5) gainScore = 55
  else if (gain5d > 35 && gain5d <= 50) gainScore = 45
  else if (gain5d < 1 && gain5d > -5) gainScore = 30
  else gainScore = 15

  // 振幅评分（当日振幅是妖股活跃度的直接体现）
  let ampScore = 0
  if (amplitude >= 8) ampScore = 95
  else if (amplitude >= 6) ampScore = 82
  else if (amplitude >= 4) ampScore = 65
  else if (amplitude >= 2.5) ampScore = 45
  else ampScore = 20

  // 波动率加分：高波动是妖股特征
  let volaBonus = 0
  if (volatility20d > 80) volaBonus = 8
  else if (volatility20d > 60) volaBonus = 5
  else if (volatility20d > 40) volaBonus = 2

  // 连涨天数加分
  let consecutiveBonus = Math.min(consecutiveUpDays * 1.5, 8)

  // 资金流向调节
  let moneyBonus = moneyFlow > 4 ? 12 : moneyFlow > 2 ? 8 : moneyFlow > 1 ? 4 : moneyFlow < -3 ? -12 : moneyFlow < -1 ? -5 : 0

  // 权重：流通市值(22%) + 换手率(22%) + 量比(18%) + 5日涨幅(15%) + 振幅(8%) + 题材热度(10%) + 额外(5%)
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

// ==================== 粗筛：用筛选条件快速过滤板块快照 ====================
function quickFilter(row, opts) {
  const { capMax, turnoverMin, volRatioMin, gainMin, mode } = opts
  const name = row.f14 || ''
  const cap = (row.f21 || 0) / 1e8          // 流通市值（亿）
  const turnover = row.f8 || 0               // 换手率%
  const volRatio = row.f10 || 0              // 量比
  const changePct = row.f3 || 0              // 涨跌幅%
  const amplitude = row.f7 || 0              // 振幅%

  const isDebug = row.f12 === '600172'

  // 排除 ST/*ST、N开头新股（无K线历史）
  if (name.includes('ST') || name.includes('*ST') || name.startsWith('N')) {
    if (isDebug) console.log('[quickFilter] 600172 被排除: ST/N 股票')
    return false
  }
  // 排除停牌（换手率=0且涨跌幅≈0）
  if (turnover < 0.01 && Math.abs(changePct) < 0.01) {
    if (isDebug) console.log('[quickFilter] 600172 被排除: 疑似停牌 (换手率=', turnover, ', 涨跌幅=', changePct, ')')
    return false
  }

  // 基础条件
  if (cap > capMax) {
    if (isDebug) console.log('[quickFilter] 600172 被排除: 流通市值=', cap.toFixed(1), '>', capMax)
    return false
  }
  if (turnover < turnoverMin) {
    if (isDebug) console.log('[quickFilter] 600172 被排除: 换手率=', turnover, '<', turnoverMin)
    return false
  }
  if (volRatio < volRatioMin) {
    if (isDebug) console.log('[quickFilter] 600172 被排除: 量比=', volRatio, '<', volRatioMin)
    return false
  }
  if (changePct < gainMin) {
    if (isDebug) console.log('[quickFilter] 600172 被排除: 涨跌幅=', changePct, '<', gainMin)
    return false
  }

  // 模式增强粗筛（利用实时数据预判，减少无效K线请求）
  if (mode === 'early') {
    // 启动初期：换手率5~15%，量比≥1.5，涨幅2~12%，振幅≥4%
    if (turnover < 5 || turnover > 15) { if (isDebug) console.log('[quickFilter] 600172 被排除: early模式换手率范围'); return false }
    if (volRatio < 1.5) { if (isDebug) console.log('[quickFilter] 600172 被排除: early模式量比'); return false }
    if (changePct < 2 || changePct > 12) { if (isDebug) console.log('[quickFilter] 600172 被排除: early模式涨幅范围'); return false }
    if (amplitude < 4) { if (isDebug) console.log('[quickFilter] 600172 被排除: early模式振幅'); return false }
  } else if (mode === 'mid') {
    // 主升浪：换手率≥10%，量比≥2.0，涨幅≥8%
    if (turnover < 10) { if (isDebug) console.log('[quickFilter] 600172 被排除: mid模式换手率'); return false }
    if (volRatio < 2.0) { if (isDebug) console.log('[quickFilter] 600172 被排除: mid模式量比'); return false }
    if (changePct < 8) { if (isDebug) console.log('[quickFilter] 600172 被排除: mid模式涨幅'); return false }
  } else if (mode === 'pre') {
    // 蓄力突破：换手率3~8%，量比≥1.1，涨幅-2~5%，振幅≥3%
    if (turnover < 3 || turnover > 8) { if (isDebug) console.log('[quickFilter] 600172 被排除: pre模式换手率范围'); return false }
    if (volRatio < 1.1) { if (isDebug) console.log('[quickFilter] 600172 被排除: pre模式量比'); return false }
    if (changePct < -2 || changePct > 5) { if (isDebug) console.log('[quickFilter] 600172 被排除: pre模式涨幅范围'); return false }
    if (amplitude < 3) { if (isDebug) console.log('[quickFilter] 600172 被排除: pre模式振幅'); return false }
  }

  // 妖股基因：振幅越大越优先（振幅<2%的平庸股直接排除）
  if (amplitude < 2 && turnover < 8) {
    if (isDebug) console.log('[quickFilter] 600172 被排除: 妖股基因不足 (振幅=', amplitude, ', 换手率=', turnover, ')')
    return false
  }

  if (isDebug) console.log('[quickFilter] 600172 粗筛通过 ✓')
  return true
}

// ==================== 构建结果行（从板块快照 + K线） ====================
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
  loading.value = true
  allData.value = []
  currentPage.value = 1

  try {
    // 第一步：获取板块快照（一次性获取整个板块行情）
    const board = selectedBoard.value
    ElMessage.info(`正在获取${BOARD_NAMES[board]}行情数据...`)
    const snapshotData = await fetchBoardSnapshot(board)
    boardStockCount.value = snapshotData.total || snapshotData.diff.length

    // 诊断：检查600172是否在原始数据中
    const debug600172 = snapshotData.diff.find(r => r.f12 === '600172')
    if (debug600172) {
      console.log('[诊断] 600172 在板块数据中:', {
        name: debug600172.f14,
        price: debug600172.f2,
        changePct: debug600172.f3,
        turnover: debug600172.f8,
        volRatio: debug600172.f10,
        amplitude: debug600172.f7,
        floatCap: debug600172.f21,
        floatCapYi: ((debug600172.f21 || 0) / 1e8).toFixed(1)
      })
    } else {
      console.warn('[诊断] 600172 不在板块原始数据中！总数:', snapshotData.diff.length)
    }

    // 第二步：用筛选条件粗筛（传递模式以实现智能预筛）
    const opts = {
      capMax: filterCapMax.value,
      turnoverMin: filterTurnoverMin.value,
      volRatioMin: filterVolRatioMin.value,
      gainMin: filterGainMin.value,
      mode: filterMode.value !== 'all' && filterMode.value !== 'high_score' ? filterMode.value : null
    }
    const passed = snapshotData.diff.filter(row => quickFilter(row, opts))

    // 诊断：检查600172是否在粗筛通过列表中
    const debugPassed = passed.find(r => r.f12 === '600172')
    if (debug600172) {
      console.log('[诊断] 600172 粗筛' + (debugPassed ? '通过 ✓' : '被过滤 ✗'), '当前筛选条件:', opts)
    }
    ElMessage.info(`${BOARD_NAMES[board]}共 ${boardStockCount.value} 只，粗筛通过 ${passed.length} 只，正在获取K线评分...`)

    if (passed.length === 0) {
      loading.value = false
      ElMessage.warning('粗筛后无股票通过，请放宽筛选条件')
      return
    }

    // 第三步：对粗筛通过的股票获取K线并评分（并发，每批6只）
    const BATCH = 6
    for (let i = 0; i < passed.length; i += BATCH) {
      const batch = passed.slice(i, i + BATCH)
      const results = await Promise.all(
        batch.map(async (row) => {
          try {
            const code = row.f12
            let klines = []
            try { klines = await fetchKline(code, 100) } catch (e) { /* 容错 */ }
            const result = buildResultRow(row, klines)
            if (code === '600172') {
              console.log('[诊断] 600172 buildResultRow 结果:', result ? {
                score: result.score,
                stageName: result.stageName,
                turnover: result.turnover,
                gain5d: result.gain5d,
                marketCap: result.marketCap
              } : 'null (K线获取失败?)')
            }
            return result
          } catch (e) {
            if (row.f12 === '600172') console.error('[诊断] 600172 buildResultRow 异常:', e.message)
            console.warn(`评估 ${row.f12} 失败:`, e.message)
            return null
          }
        })
      )
      for (const r of results) {
        if (r) allData.value.push(r)
      }
    }

    // 按评分降序排列
    allData.value.sort((a, b) => b.score - a.score)

    // 诊断：检查600172是否在最终 allData 中
    const debugFinal = allData.value.find(r => r.code === '600172')
    if (debugFinal) {
      console.log('[诊断] 600172 在最终 allData 中! 评分:', debugFinal.score, '排名:', allData.value.indexOf(debugFinal) + 1, '共', allData.value.length, '只')
    } else if (debug600172) {
      console.warn('[诊断] 600172 在板块数据中但不在最终结果中！可能 K 线获取失败或 buildResultRow 返回 null')
    }

    loading.value = false
    ElMessage.success(`筛选完成，共 ${allData.value.length} 只股票`)
  } catch (e) {
    console.error('筛选失败:', e)
    loading.value = false
    ElMessage.error(`筛选失败：${e.message}`)
  }
}

// 前端过滤
const filteredData = computed(() => {
  let data = [...allData.value]

  // 筛选模式
  if (filterMode.value === 'early') data = data.filter(d => d.stageType === 'early')
  else if (filterMode.value === 'mid') data = data.filter(d => d.stageType === 'mid')
  else if (filterMode.value === 'pre') data = data.filter(d => d.stageType === 'pre')
  else if (filterMode.value === 'high_score') data = data.filter(d => d.score >= 80)

  // 数值筛选
  data = data.filter(d =>
    d.turnover >= filterTurnoverMin.value &&
    d.volumeRatio >= filterVolRatioMin.value &&
    d.marketCap <= filterCapMax.value &&
    d.gain5d >= filterGainMin.value
  )

  // 排序
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
}

function switchBoard() {
  // 根据板块自动调整筛选条件
  if (selectedBoard.value === 'kcb') {
    // 科创板：20%涨跌幅，市值偏高，换手率门槛略低但振幅要求更高
    filterCapMax.value = 300
    filterTurnoverMin.value = 4
    filterVolRatioMin.value = 1.5
    filterGainMin.value = 2
  } else if (selectedBoard.value === 'cyb') {
    // 创业板：20%涨跌幅，小盘成长为主，换手率适中
    filterCapMax.value = 150
    filterTurnoverMin.value = 5
    filterVolRatioMin.value = 1.5
    filterGainMin.value = 2
  } else {
    // 全A股/上证/深证：10%涨跌幅，默认妖股筛选条件
    filterCapMax.value = 150
    filterTurnoverMin.value = 5
    filterVolRatioMin.value = 1.5
    filterGainMin.value = 2
  }
  filterMode.value = 'all'
  currentPage.value = 1
  refreshAll()
}

// 跳转详情页
function goDetail(row) {
  router.push({
    path: '/home/fund/stock-detail',
    query: { code: row.code, name: row.name }
  })
}

// 表格辅助
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
</script>

<style scoped>
.stock-filter-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* 头部 */
.hero {
  background: linear-gradient(135deg, #0a0f1f 0%, #121826 100%);
  border-radius: 20px;
  padding: 24px 28px;
  margin-bottom: 20px;
  color: #fff;
}
.hero-content h1 {
  font-size: 1.6rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.hero-content h1 .el-icon { color: #f97316; }
.badge {
  background: #f97316;
  color: #0a0f1f;
  padding: 2px 12px;
  border-radius: 40px;
  font-size: 0.75rem;
  font-weight: 600;
}
.hero-content p {
  margin-top: 10px;
  opacity: 0.8;
  font-size: 0.85rem;
  line-height: 1.5;
}
.disclaimer {
  background: rgba(249, 115, 22, 0.15);
  border-radius: 30px;
  padding: 5px 14px;
  font-size: 0.7rem;
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* 个股妖性测评快捷条 */
.quick-eval-bar {
  margin-bottom: 16px;
}
.quick-eval-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 16px;
  padding: 14px 20px;
  border: 1px solid #e2e8f0;
  gap: 16px;
  flex-wrap: wrap;
}
.quick-eval-left {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #f97316;
  flex-shrink: 0;
}
.quick-eval-title {
  font-weight: 700;
  font-size: 0.95rem;
  color: #0f172a;
}
.quick-eval-desc {
  font-size: 0.78rem;
  color: #94a3b8;
}
.quick-eval-right {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 1;
  max-width: 400px;
  min-width: 240px;
}
.eval-input {
  flex: 1;
}

/* 筛选卡片 */
.filter-card {
  margin-bottom: 16px;
  border-radius: 16px;
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}
.filter-item {
  flex: 1;
  min-width: 130px;
}
.filter-item label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #475569;
  display: block;
  margin-bottom: 4px;
}
.filter-actions {
  flex: none;
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding-bottom: 0;
}
.quick-stocks {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.quick-label {
  font-size: 0.8rem;
  color: #64748b;
  white-space: nowrap;
}
.board-info {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-left: auto;
}
.board-info strong {
  color: #f97316;
}

/* 表格卡片 */
.table-card {
  border-radius: 16px;
}
.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.table-header span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}
.text-up { color: #f56c6c; font-weight: 600; }
.text-down { color: #52c41a; font-weight: 600; }
.text-warn { color: #e6a23c; font-weight: 600; }
.score-cell {
  font-weight: 800;
  font-size: 1.1rem;
}
.score-high { color: #f97316; }
.score-mid { color: #eab308; }
.score-low { color: #6c7a91; }
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* ========== 手机端豆腐块卡片 ========== */
.mobile-card-list {
  display: none;
}
/* PC端显示表格 */
.pc-table { display: block; }

.stock-card {
  border-radius: 14px;
  border: 1px solid #eef2f7;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  transition: all 0.2s ease;
  cursor: pointer;
}
.stock-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}
.stock-card :deep(.el-card__body) { padding: 12px 14px; }

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 8px;
}
.card-code-name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}
.card-code {
  font-size: 0.68rem;
  color: #94a3b8;
  font-family: 'SF Mono', 'Fira Code', monospace;
  flex-shrink: 0;
}
.card-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-price-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}
.card-price {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}
.card-change {
  font-size: 0.9rem;
  font-weight: 700;
}
.card-score {
  margin-left: auto;
  font-size: 1rem;
  font-weight: 800;
}

.card-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
  margin-bottom: 8px;
}
.card-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.metric-label {
  font-size: 0.7rem;
  color: #94a3b8;
}
.metric-value {
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}
.card-cap {
  font-size: 0.7rem;
  color: #94a3b8;
}
.card-rec {
  font-size: 0.75rem;
  font-weight: 700;
}

/* 底部 */
.footer-note {
  text-align: center;
  font-size: 0.7rem;
  color: #6c7a91;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

@media (max-width: 768px) {
  .stock-filter-page { padding: 10px; }

  /* 头部 */
  .hero {
    padding: 18px 16px;
    border-radius: 14px;
    margin-bottom: 14px;
  }
  .hero-content h1 {
    font-size: 1.25rem;
    gap: 6px;
  }
  .hero-content h1 .el-icon { font-size: 20px; }
  .badge {
    font-size: 0.65rem;
    padding: 2px 8px;
  }
  .hero-content p {
    font-size: 0.75rem;
    margin-top: 8px;
  }
  .disclaimer {
    font-size: 0.65rem;
    padding: 4px 10px;
    margin-top: 10px;
  }

  /* 快捷测评条 */
  .quick-eval-inner {
    flex-direction: column;
    align-items: stretch;
    padding: 12px 14px;
    gap: 10px;
    border-radius: 12px;
  }
  .quick-eval-left {
    justify-content: center;
    gap: 6px;
  }
  .quick-eval-title {
    font-size: 0.85rem;
  }
  .quick-eval-desc {
    display: none;
  }
  .quick-eval-right {
    max-width: 100%;
    min-width: unset;
    flex: none;
  }

  /* 筛选卡片 */
  .filter-card {
    border-radius: 12px;
    margin-bottom: 12px;
  }
  .filter-row {
    flex-direction: column;
    gap: 10px;
  }
  .filter-item {
    min-width: 100%;
  }
  .filter-item label {
    font-size: 0.7rem;
  }
  .filter-actions {
    flex-direction: row;
    width: 100%;
  }
  .filter-actions .el-button {
    flex: 1;
  }

  /* 板块选择 */
  .quick-stocks {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-top: 12px;
  }
  .quick-label {
    font-size: 0.75rem;
  }
  .board-info {
    margin-left: 0;
    font-size: 0.72rem;
  }

  /* 表格卡片 */
  .table-card {
    border-radius: 12px;
  }
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .table-header span {
    font-size: 0.88rem;
  }

  /* PC表格隐藏，手机卡片显示 */
  .pc-table { display: none !important; }
  .mobile-card-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* 分页 */
  .pagination-wrap {
    justify-content: center;
  }
  .pagination-wrap :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
  }
  .pagination-wrap :deep(.el-pagination__sizes) {
    display: none;
  }
  .pagination-wrap :deep(.el-pagination__jump) {
    margin-left: 0;
  }

  .footer-note {
    font-size: 0.65rem;
    margin-top: 12px;
  }
}

@media (max-width: 480px) {
  .stock-filter-page { padding: 6px; }

  .hero {
    padding: 14px 12px;
    border-radius: 10px;
  }
  .hero-content h1 {
    font-size: 1.1rem;
  }
  .hero-content p {
    font-size: 0.7rem;
  }

  .quick-eval-inner {
    padding: 10px 12px;
    border-radius: 10px;
  }
  .quick-eval-title {
    font-size: 0.8rem;
  }
  .eval-input :deep(.el-input__inner) {
    font-size: 0.8rem;
  }

  .filter-card {
    border-radius: 10px;
  }
  .filter-item label {
    font-size: 0.65rem;
  }

  .table-card {
    border-radius: 10px;
  }
  .table-header span {
    font-size: 0.8rem;
  }

  /* 卡片微调 */
  .stock-card :deep(.el-card__body) { padding: 10px 12px; }
  .card-price { font-size: 1.05rem; }
  .card-change { font-size: 0.82rem; }
  .card-score { font-size: 0.9rem; }
  .card-name { font-size: 0.78rem; }
  .metric-label { font-size: 0.65rem; }
  .metric-value { font-size: 0.72rem; }
}
</style>

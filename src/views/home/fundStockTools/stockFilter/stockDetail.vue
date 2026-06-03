<template>
  <div class="stock-detail-page">
    <!-- 返回按钮 -->
    <div class="back-bar">
      <el-button text @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
    </div>

    <!-- 股票代码搜索框（独立查询模式） -->
    <div class="search-bar" v-if="!result && !loading">
      <div class="search-card">
        <div class="search-title">
          <el-icon :size="24"><DataAnalysis /></el-icon>
          <h2>个股妖性测评</h2>
        </div>
        <p class="search-desc">输入A股股票代码，一键评估妖性特征与操盘策略</p>
        <div class="search-input-row">
          <el-input
            v-model="searchCode"
            placeholder="输入股票代码，如 000001、600519"
            size="large"
            clearable
            @keyup.enter="handleSearch"
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" size="large" @click="handleSearch" :loading="loading">
            <el-icon><TrendCharts /></el-icon> 开始测评
          </el-button>
        </div>
        <div class="search-tips">
          <span>支持格式：纯数字（000001）、带前缀（sh600519 / sz000001）</span>
        </div>
      </div>
    </div>

    <!-- 头部概要 -->
    <div class="detail-hero" v-if="result">
      <div class="hero-top">
        <div class="hero-left">
          <div :class="['stage-tag', stageTagClass]">{{ result.stageName }}</div>
          <h2>{{ result.name }} <span class="code-text">{{ result.code }}</span></h2>
          <div class="price-line">
            <span class="current-price">¥{{ result.price?.toFixed(2) }}</span>
            <span :class="result.changePct >= 0 ? 'text-up' : 'text-down'" class="change-badge">
              {{ result.changePct >= 0 ? '+' : '' }}{{ result.changePct?.toFixed(2) }}%
            </span>
            <el-tag size="small" type="success" effect="plain">实时</el-tag>
          </div>
        </div>
        <div class="hero-right">
          <div class="score-card">
            <div class="score-num">{{ result.score }}</div>
            <div class="score-label">妖股评分</div>
            <div class="score-bar-bg">
              <div class="score-bar-fill" :style="{ width: result.score + '%' }"></div>
            </div>
          </div>
          <div class="rec-badge" :style="{ color: result.recommendColor, borderColor: result.recommendColor }">
            {{ result.recommendEmoji }} {{ result.recommendLevel }}
          </div>
        </div>
      </div>
      <!-- 快速概览条 -->
      <div class="hero-quick-stats">
        <div class="quick-stat">
          <span class="qs-label">今开</span>
          <span class="qs-value">{{ result.open?.toFixed(2) }}</span>
        </div>
        <div class="quick-stat">
          <span class="qs-label">最高</span>
          <span class="qs-value text-up">{{ result.high?.toFixed(2) }}</span>
        </div>
        <div class="quick-stat">
          <span class="qs-label">最低</span>
          <span class="qs-value text-down">{{ result.low?.toFixed(2) }}</span>
        </div>
        <div class="quick-stat">
          <span class="qs-label">昨收</span>
          <span class="qs-value">{{ result.yesterdayClose?.toFixed(2) }}</span>
        </div>
        <div class="quick-stat">
          <span class="qs-label">振幅</span>
          <span class="qs-value text-warn">{{ result.amplitude?.toFixed(1) }}%</span>
        </div>
        <div class="quick-stat">
          <span class="qs-label">成交额</span>
          <span class="qs-value">{{ result.amountYi?.toFixed(2) }}亿</span>
        </div>
        <div class="quick-stat">
          <span class="qs-label">成交量</span>
          <span class="qs-value">{{ result.volumeWan?.toFixed(1) }}万手</span>
        </div>
      </div>
    </div>

    <div v-loading="loading" element-loading-text="正在获取实时数据..." v-if="!result && !errorMsg">
      <el-empty description="正在加载..." :image-size="60" />
    </div>
    <div v-else-if="errorMsg" class="error-block">
      <el-empty description="获取数据失败" :image-size="80">
        <el-alert type="error" :title="errorMsg" :closable="false" show-icon />
      </el-empty>
    </div>

    <!-- 评估报告主体 -->
    <div v-if="result" class="report-body">
      <!-- 第一行：关键指标卡片（6个核心指标） -->
      <div class="metrics-row">
        <div class="metric-card">
          <div class="metric-icon" style="background: #fef3c7;"><el-icon :size="20"><Odometer /></el-icon></div>
          <div class="metric-info">
            <div class="metric-value">{{ result.turnover?.toFixed(1) }}%</div>
            <div class="metric-label">换手率</div>
          </div>
          <div class="metric-desc">{{ result.turnDesc }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon" style="background: #dbeafe;"><el-icon :size="20"><DataLine /></el-icon></div>
          <div class="metric-info">
            <div class="metric-value">{{ result.volumeRatio?.toFixed(2) }}</div>
            <div class="metric-label">量比</div>
          </div>
          <div class="metric-desc">{{ result.volDesc }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon" style="background: #fce7f3;"><el-icon :size="20"><TrendCharts /></el-icon></div>
          <div class="metric-info">
            <div class="metric-value" :class="result.gain5d >= 0 ? 'text-up' : 'text-down'">
              {{ result.gain5d >= 0 ? '+' : '' }}{{ result.gain5d?.toFixed(1) }}%
            </div>
            <div class="metric-label">5日涨幅</div>
          </div>
          <div class="metric-desc">{{ result.gainDesc }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon" style="background: #d1fae5;"><el-icon :size="20"><Histogram /></el-icon></div>
          <div class="metric-info">
            <div class="metric-value">{{ result.marketCap?.toFixed(1) }}亿</div>
            <div class="metric-label">流通市值</div>
          </div>
          <div class="metric-desc">{{ result.capDesc }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon" style="background: #f3e8ff;"><el-icon :size="20"><Histogram /></el-icon></div>
          <div class="metric-info">
            <div class="metric-value text-warn">{{ result.amplitude?.toFixed(1) }}%</div>
            <div class="metric-label">今日振幅</div>
          </div>
          <div class="metric-desc">{{ result.ampDesc }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon" style="background: #ffedd5;"><el-icon :size="20"><TrendCharts /></el-icon></div>
          <div class="metric-info">
            <div class="metric-value" :class="result.gain10d >= 0 ? 'text-up' : 'text-down'">
              {{ result.gain10d >= 0 ? '+' : '' }}{{ result.gain10d?.toFixed(1) }}%
            </div>
            <div class="metric-label">10日涨幅</div>
          </div>
          <div class="metric-desc">{{ result.gain10dDesc }}</div>
        </div>
      </div>

      <!-- 第二行：评分雷达 + 阶段详情 -->
      <div class="detail-grid">
        <!-- 因子评分详情 -->
        <el-card class="detail-panel" shadow="hover">
          <template #header>
            <span><el-icon><DataAnalysis /></el-icon> 因子评分明细</span>
          </template>
          <div class="factor-list">
            <div class="factor-item">
              <div class="factor-head">
                <span>流通市值 (权重22%)</span>
                <span class="factor-score">{{ result.marketScore }}分</span>
              </div>
              <el-progress :percentage="result.marketScore" :stroke-width="8" :show-text="false" color="#f97316" />
            </div>
            <div class="factor-item">
              <div class="factor-head">
                <span>换手率 (权重22%)</span>
                <span class="factor-score">{{ result.turnoverScore }}分</span>
              </div>
              <el-progress :percentage="result.turnoverScore" :stroke-width="8" :show-text="false" color="#0ea5e9" />
            </div>
            <div class="factor-item">
              <div class="factor-head">
                <span>量比 (权重18%)</span>
                <span class="factor-score">{{ result.volScore }}分</span>
              </div>
              <el-progress :percentage="result.volScore" :stroke-width="8" :show-text="false" color="#8b5cf6" />
            </div>
            <div class="factor-item">
              <div class="factor-head">
                <span>5日涨幅 (权重15%)</span>
                <span class="factor-score">{{ result.gainScore }}分</span>
              </div>
              <el-progress :percentage="result.gainScore" :stroke-width="8" :show-text="false" color="#ec4899" />
            </div>
            <div class="factor-item">
              <div class="factor-head">
                <span>振幅 (权重8%)</span>
                <span class="factor-score">{{ result.ampScore }}分</span>
              </div>
              <el-progress :percentage="result.ampScore" :stroke-width="8" :show-text="false" color="#14b8a6" />
            </div>
            <div class="factor-item">
              <div class="factor-head">
                <span>题材热度 (权重10%)</span>
                <span class="factor-score">{{ result.themeHeat }}分</span>
              </div>
              <el-progress :percentage="result.themeHeat" :stroke-width="8" :show-text="false" color="#10b981" />
            </div>
            <div class="factor-item bonus-row">
              <div class="factor-head">
                <span>波动率加成</span>
                <span class="factor-score">{{ result.volaBonus >= 0 ? '+' : '' }}{{ result.volaBonus }}分</span>
              </div>
            </div>
            <div class="factor-item bonus-row">
              <div class="factor-head">
                <span>连涨加成</span>
                <span class="factor-score">{{ result.consecutiveBonus >= 0 ? '+' : '' }}{{ result.consecutiveBonus }}分</span>
              </div>
            </div>
            <div class="factor-item bonus-row">
              <div class="factor-head">
                <span>资金流向调节</span>
                <span class="factor-score" :class="result.moneyBonus >= 0 ? 'text-up' : 'text-down'">{{ result.moneyBonus >= 0 ? '+' : '' }}{{ result.moneyBonus }}分</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 阶段与目标 -->
        <el-card class="detail-panel" shadow="hover">
          <template #header>
            <span><el-icon><Promotion /></el-icon> 阶段研判 & 目标价位</span>
          </template>
          <div class="stage-detail">
            <div class="stage-header">
              <el-tag :type="stageTagType" size="large" effect="dark">{{ result.stageName }}</el-tag>
            </div>
            <p class="stage-desc">{{ result.stageDesc }}</p>
            <el-divider />
            <div class="target-section">
              <div class="target-label">🎯 模型目标价位区间</div>
              <div class="target-range">
                <span class="target-low">{{ result.targetLow }}</span>
                <span class="target-sep">~</span>
                <span class="target-high">{{ result.targetHigh }}</span>
                <span class="target-unit">元</span>
              </div>
              <div class="target-note">
                基于当前价 ¥{{ result.price?.toFixed(2) }}，预估潜在涨幅
                <strong :class="result.targetUpside >= 0 ? 'text-up' : 'text-down'">
                  {{ result.targetUpside >= 0 ? '+' : '' }}{{ result.targetUpside?.toFixed(1) }}%
                </strong>
              </div>
            </div>
            <el-divider />
            <div class="launch-info">
              <el-icon><Clock /></el-icon> {{ result.launchText }}
            </div>
          </div>
        </el-card>
      </div>

      <!-- 第三行：妖股特征 + 辅助指标 -->
      <div class="detail-grid">
        <!-- 妖股特征量化 -->
        <el-card class="detail-panel" shadow="hover">
          <template #header>
            <span><el-icon><CircleCheckFilled /></el-icon> 妖股特征量化</span>
          </template>
          <ul class="feature-list">
            <li><el-icon class="icon-ok"><CircleCheckFilled /></el-icon> 市值弹性：{{ result.capDesc }}</li>
            <li><el-icon class="icon-warn"><TrendCharts /></el-icon> 量价结构：{{ result.volDesc }}</li>
            <li><el-icon class="icon-warn"><Odometer /></el-icon> 换手意愿：{{ result.turnDesc }}</li>
            <li><el-icon class="icon-warn"><Histogram /></el-icon> 振幅活跃度：{{ result.ampDesc }}</li>
            <li><el-icon class="icon-warn"><DataLine /></el-icon> 短期动能(5日)：{{ result.gainDesc }}</li>
            <li v-if="result.gain10dDesc"><el-icon class="icon-warn"><DataLine /></el-icon> 中期动能(10日)：{{ result.gain10dDesc }}</li>
            <li><el-icon class="icon-warn"><Promotion /></el-icon> 题材强度：{{ result.themeDesc }}</li>
            <li v-if="result.volatility20d"><el-icon class="icon-warn"><TrendCharts /></el-icon> 20日波动率：{{ result.volatility20d }}%（{{ result.volatility20d > 60 ? '高波动妖股基因' : result.volatility20d > 35 ? '中等波动' : '波动偏低' }}）</li>
            <li v-if="result.consecutiveUpDays > 1"><el-icon class="icon-ok"><CircleCheckFilled /></el-icon> 连涨天数：{{ result.consecutiveUpDays }}天</li>
          </ul>
        </el-card>

        <!-- 辅助指标 -->
        <el-card class="detail-panel" shadow="hover">
          <template #header>
            <span><el-icon><Setting /></el-icon> 辅助指标 & 资金面</span>
          </template>
          <div class="aux-grid">
            <div class="aux-item">
              <span class="aux-label">主力资金流向</span>
              <span :class="result.moneyFlow >= 0 ? 'text-up' : 'text-down'" class="aux-value">
                {{ result.moneyFlowPrefix }}{{ result.moneyFlowAbs }}
              </span>
            </div>
            <div class="aux-item">
              <span class="aux-label">涨停参考价</span>
              <span class="aux-value text-up">{{ result.limitUp?.toFixed(2) }}元</span>
            </div>
            <div class="aux-item">
              <span class="aux-label">跌停参考价</span>
              <span class="aux-value text-down">{{ result.limitDown?.toFixed(2) }}元</span>
            </div>
            <div class="aux-item">
              <span class="aux-label">距涨停</span>
              <span class="aux-value text-up">{{ result.limitUpDist?.toFixed(1) }}%</span>
            </div>
            <div class="aux-item">
              <span class="aux-label">20日波动率</span>
              <span class="aux-value">{{ result.volatility20d }}%</span>
            </div>
            <div class="aux-item">
              <span class="aux-label">连涨天数</span>
              <span class="aux-value">{{ result.consecutiveUpDays }}天</span>
            </div>
            <div class="aux-item">
              <span class="aux-label">20日均价</span>
              <span class="aux-value">{{ result.ma20?.toFixed(2) }}元</span>
            </div>
            <div class="aux-item">
              <span class="aux-label">综合评分</span>
              <span class="aux-value score-highlight">{{ result.score }}/100</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 第四行：操盘策略 -->
      <el-card class="strategy-panel" shadow="hover">
        <template #header>
          <span><el-icon><Opportunity /></el-icon> 操盘策略参考</span>
        </template>
        <div class="strategy-content">
          <el-alert
            :type="result.stageType === 'risk' ? 'error' : result.stageType === 'early' ? 'success' : 'warning'"
            :closable="false"
            show-icon
          >
            <template #title>
              <strong>{{ result.strategyText }}</strong>
            </template>
          </el-alert>
          <div class="risk-reminder">
            <el-icon><WarningFilled /></el-icon>
            <span>妖股波动巨大，单日振幅可达±10%~±20%。以上策略仅为模型推演，请结合自身风险承受能力决策。</span>
          </div>
        </div>
      </el-card>
    </div>

    <div class="footer-note">
      <el-icon><InfoFilled /></el-icon>
      评分权重：流通市值(22%) + 换手率(22%) + 量比(18%) + 5日涨幅(15%) + 题材热度(10%) + 振幅(8%)。附加波动率、连涨天数、资金流向动态调节。数据来自腾讯财经 & 东方财富，仅供研究参考。
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft, Clock, DataAnalysis, DataLine, TrendCharts, Histogram,
  CircleCheckFilled, Odometer, Promotion, Opportunity, WarningFilled,
  InfoFilled, Setting, Search
} from '@element-plus/icons-vue'

const route = useRoute()
const stockCode = ref('')
const stockName = ref('')
const searchCode = ref('')
const loading = ref(false)
const errorMsg = ref('')
const result = ref(null)

// 搜索处理
function handleSearch() {
  const code = searchCode.value.trim()
  if (!code) {
    errorMsg.value = '请输入股票代码'
    return
  }
  stockCode.value = code
  stockName.value = ''
  errorMsg.value = ''
  result.value = null
  loadDetail()
}

// ==================== 数据获取（复用主页面逻辑） ====================
async function fetchRealTime(codeRaw) {
  let code = codeRaw.toString().trim()
  if (!code.startsWith('sh') && !code.startsWith('sz')) {
    code = /^6/.test(code) ? 'sh' + code : 'sz' + code
  }
  const url = `/api-qt/q=${code}`
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  const text = new TextDecoder('gbk').decode(buffer)
  const match = text.match(/="(.+)"/)
  if (!match) throw new Error('未获取到行情数据')
  const parts = match[1].split('~')
  if (parts.length < 45) throw new Error('行情数据格式异常')

  const price = parseFloat(parts[3]) || 0
  const yesterdayClose = parseFloat(parts[4]) || 0
  const totalShares = parseFloat(parts[44]) || 0
  const marketCapRaw = totalShares > 0 ? (totalShares * price / 1e8) : 0
  // 振幅计算：(最高-最低)/昨收*100
  const high = parseFloat(parts[33]) || 0
  const low = parseFloat(parts[34]) || 0
  const amplitude = yesterdayClose > 0 ? ((high - low) / yesterdayClose * 100) : 0

  return {
    name: parts[1],
    price,
    yesterdayClose,
    open: parseFloat(parts[5]) || 0,
    high,
    low,
    volumeHand: parseInt(parts[6]) || 0,
    amountWan: parseFloat(parts[37]) || 0,
    volumeRatio: parseFloat(parts[10]) || 1,
    changePct: price && yesterdayClose
      ? ((price - yesterdayClose) / yesterdayClose * 100)
      : 0,
    turnoverRaw: parseFloat(parts[38]) || 0,
    marketCapRaw: +marketCapRaw.toFixed(2),
    amplitude: +amplitude.toFixed(2)
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
  const url = `/api-ifzq/appstock/app/fqkline/get?param=${market}${code},day,,,${days},qfq`
  const response = await fetch(url)
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
      amount: parseFloat(item[5]) || 0,
      changePct: +changePct.toFixed(2)
    }
  })
}

function extractFactors(realtime, klines) {
  const { price, volumeRatio, turnoverRaw, marketCapRaw, changePct, amountWan, amplitude } = realtime
  const name = realtime.name || ''

  let turnover = turnoverRaw
  if (!turnover && marketCapRaw > 0 && amountWan > 0) {
    turnover = (amountWan * 10000) / (marketCapRaw * 1e8) * 100
  }
  turnover = Math.min(turnover || 0, 50)

  // 5日涨幅
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

  // 10日涨幅
  let gain10d = changePct
  if (klines?.length >= 10) {
    const recent10 = klines.slice(-10)
    let cumGain = 0
    for (let i = 1; i < recent10.length; i++) cumGain += recent10[i].changePct || 0
    if (Math.abs(cumGain) < 0.05) {
      cumGain = (recent10[recent10.length - 1].close - recent10[0].close) / recent10[0].close * 100
    }
    gain10d = cumGain
  }

  // 20日均价
  let ma20 = price
  if (klines?.length >= 20) {
    const recent20 = klines.slice(-20)
    ma20 = recent20.reduce((s, k) => s + k.close, 0) / 20
  }

  // 题材热度
  let themeHeat = 50
  const hotKeywords = ['科技', '信息', '智能', '数据', 'AI', '半导体', '芯片', '新能源', '光伏', '医药', '生物', '医疗']
  for (const kw of hotKeywords) { if (name.includes(kw)) themeHeat += 20 }
  if (name.includes('ST') || name.includes('*ST')) themeHeat -= 35
  if (gain5d > 20) themeHeat += 15
  else if (gain5d > 12) themeHeat += 8
  else if (gain5d > 5) themeHeat += 3
  else if (gain5d < -8) themeHeat -= 15
  else if (gain5d < -3) themeHeat -= 5
  themeHeat = Math.min(98, Math.max(10, themeHeat))

  // 资金流向
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

  // 20日波动率
  let volatility20d = 0
  if (klines?.length >= 20) {
    const recent20 = klines.slice(-20)
    const returns = recent20.map(k => k.changePct || 0)
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length
    volatility20d = Math.sqrt(variance) * Math.sqrt(250)
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
    marketCap: marketCapRaw || 50, turnover, volumeRatio: volumeRatio || 1,
    gain5d: +gain5d.toFixed(2), gain10d: +gain10d.toFixed(2),
    themeHeat: Math.round(themeHeat),
    moneyFlow: +moneyFlow.toFixed(1), price, changePct,
    volatility20d: +volatility20d.toFixed(1), consecutiveUpDays,
    amplitude: amplitude || 0, ma20: +ma20.toFixed(2)
  }
}

function computeScores(factors) {
  const { marketCap, turnover, volumeRatio, gain5d, themeHeat, moneyFlow, volatility20d, consecutiveUpDays, amplitude } = factors

  // 流通市值评分（与主页一致）
  let marketScore
  if (marketCap <= 5) marketScore = 45
  else if (marketCap <= 15) marketScore = 92
  else if (marketCap <= 25) marketScore = 95
  else if (marketCap <= 50) marketScore = 82
  else if (marketCap <= 80) marketScore = 65
  else if (marketCap <= 120) marketScore = 48
  else if (marketCap <= 200) marketScore = 28
  else marketScore = 12

  // 换手率评分
  let turnoverScore
  if (turnover >= 8 && turnover <= 25) turnoverScore = 95
  else if (turnover >= 5 && turnover < 8) turnoverScore = 72
  else if (turnover > 25 && turnover <= 35) turnoverScore = 55
  else if (turnover > 35 && turnover <= 45) turnoverScore = 30
  else if (turnover < 3) turnoverScore = 10
  else if (turnover < 5) turnoverScore = 25
  else turnoverScore = 12

  // 量比评分
  let volScore
  if (volumeRatio >= 3.0) volScore = 95
  else if (volumeRatio >= 2.5) volScore = 88
  else if (volumeRatio >= 1.8) volScore = 78
  else if (volumeRatio >= 1.3) volScore = 60
  else if (volumeRatio >= 0.9) volScore = 40
  else volScore = 20

  // 5日涨幅评分
  let gainScore
  if (gain5d >= 10 && gain5d <= 35) gainScore = 95
  else if (gain5d >= 5 && gain5d < 10) gainScore = 75
  else if (gain5d >= 1 && gain5d < 5) gainScore = 55
  else if (gain5d > 35 && gain5d <= 50) gainScore = 45
  else if (gain5d < 1 && gain5d > -5) gainScore = 30
  else gainScore = 15

  // 振幅评分
  let ampScore = 0
  if (amplitude >= 8) ampScore = 95
  else if (amplitude >= 6) ampScore = 82
  else if (amplitude >= 4) ampScore = 65
  else if (amplitude >= 2.5) ampScore = 45
  else ampScore = 20

  // 附加调节
  let volaBonus = 0
  if (volatility20d > 80) volaBonus = 8
  else if (volatility20d > 60) volaBonus = 5
  else if (volatility20d > 40) volaBonus = 2

  let consecutiveBonus = Math.min(consecutiveUpDays * 1.5, 8)
  let moneyBonus = moneyFlow > 4 ? 12 : moneyFlow > 2 ? 8 : moneyFlow > 1 ? 4 : moneyFlow < -3 ? -12 : moneyFlow < -1 ? -5 : 0

  // 权重：流通市值(22%) + 换手率(22%) + 量比(18%) + 5日涨幅(15%) + 振幅(8%) + 题材热度(10%)
  let total = marketScore * 0.22 + turnoverScore * 0.22 + volScore * 0.18 + gainScore * 0.15 + ampScore * 0.08 + themeHeat * 0.10
  total += volaBonus + consecutiveBonus + moneyBonus
  total = Math.min(100, Math.max(10, Math.round(total)))
  return { total, marketScore, turnoverScore, volScore, gainScore, ampScore, volaBonus, consecutiveBonus, moneyBonus }
}

function getStage(factors, score) {
  const { gain5d, turnover, volumeRatio } = factors
  if (gain5d >= 2 && gain5d < 12 && volumeRatio >= 1.2 && turnover >= 5 && turnover < 15) {
    return { name: '启动前·蓄力突破', type: 'pre', desc: '量价温和配合，主力低位吸筹迹象明显。当前处于蓄势阶段，等待放量阳线确认启动信号。' }
  }
  if (gain5d >= 8 && gain5d < 25 && volumeRatio >= 1.8 && turnover >= 8 && turnover <= 30) {
    return { name: '启动初期·主升浪开端', type: 'early', desc: '资金抢筹意愿强烈，量价共振突破，妖气初显。短期爆发力强劲，为最佳介入窗口期。' }
  }
  if (gain5d >= 20 && gain5d <= 48 && turnover >= 12 && turnover <= 30 && volumeRatio >= 2.2) {
    return { name: '主升浪中·妖性绽放', type: 'mid', desc: '连板或大阳线持续，市场情绪高度一致。注意高位分歧信号，持仓者需紧盯分时承接。' }
  }
  if (gain5d > 45 || (turnover > 32 && gain5d < 8) || (volumeRatio < 1.2 && gain5d > 20)) {
    return { name: '高风险区·鱼尾行情', type: 'risk', desc: '换手率异常或缩量滞涨，追高风险极大。可能已进入出货阶段，建议谨慎对待。' }
  }
  if (gain5d < 2 && turnover < 6) {
    return { name: '冷门低迷期', type: 'cold', desc: '缺乏资金关注，交投清淡，暂不具备妖股启动条件。需等待题材催化或资金入场。' }
  }
  if (gain5d >= 12 && gain5d < 22) {
    return { name: '启动确认·上涨中继', type: 'early', desc: '空中加油形态，短暂整理后有望继续上行。量能维持健康，仍有上行空间。' }
  }
  return { name: '震荡试盘阶段', type: 'pre', desc: '主力试探性拉升，需放量确认方向。关注后续异动信号，可能酝酿突破。' }
}

function getTargetPrice(price, stageType, score, gain5d) {
  let lowerRatio, upperRatio
  if (stageType === 'pre') { lowerRatio = 0.15; upperRatio = 0.35 }
  else if (stageType === 'early') { lowerRatio = 0.22; upperRatio = 0.50 }
  else if (stageType === 'mid') { lowerRatio = 0.10; upperRatio = 0.25 }
  else { lowerRatio = -0.08; upperRatio = 0.10 }
  // 根据评分和当前涨幅动态调节
  let adjust = 1 + (score - 50) / 200
  if (gain5d > 30) adjust *= 0.85  // 已大幅上涨，降低预期
  adjust = Math.min(1.3, Math.max(0.75, adjust))
  return {
    low: (price * (1 + lowerRatio * adjust)).toFixed(2),
    high: (price * (1 + upperRatio * adjust)).toFixed(2)
  }
}

function getRecommendation(score, stageType) {
  if (stageType === 'risk') return { level: '回避', color: '#b91c1c', text: '高风险，不建议追涨', emoji: '⛔' }
  if (score >= 85) return { level: '强烈推荐', color: '#f97316', text: '妖性突出，量价配合极佳', emoji: '🔥🔥' }
  if (score >= 72) return { level: '重点关注', color: '#eab308', text: '潜力妖股候选，择机布局', emoji: '⭐' }
  if (score >= 58) return { level: '适当关注', color: '#3b82f6', text: '具备一定妖性，等待催化', emoji: '👀' }
  return { level: '谨慎观望', color: '#6c7a91', text: '妖性不足或风险偏高', emoji: '🌀' }
}

function getLaunchTimeText(stageType) {
  const map = {
    pre: '📅 预计未来3-7个交易日内出现异动拉升，密切关注量能突变信号。',
    early: '⏰ 已进入启动窗口期，短期（1-3日）有望加速上行，建议设好移动止盈。',
    mid: '⌛ 处于主升中段，惯性冲高概率较大，警惕高位分歧板出现。',
    risk: '⚠️ 风险已显著加剧，不适合新开仓位，密切观察高位出货迹象。'
  }
  return map[stageType] || '⏳ 震荡整固中，启动时间需等待放量确认信号。'
}

function getStrategyText(stageType) {
  const map = {
    pre: '逢低潜伏，分批建仓介入，设置-5%止损线。等待放量突破确认后加仓，切忌追高。',
    early: '突破确认后可适当加仓，紧守5日均线作为止盈参考。目标上看第一目标位，到达后可部分止盈。',
    mid: '持仓者继续持有，移动止盈位逐步上移。新开仓需严格控制仓位（不超过总仓位10%），紧盯分时承接。',
    risk: '建议逐步止盈或回避，高位巨量阴线为明确离场信号。宁可错过，不可做错。'
  }
  return map[stageType] || '保持观望，等待更明确的入场信号。'
}

// ==================== 主控 ====================
async function loadDetail() {
  stockCode.value = route.query.code || ''
  stockName.value = route.query.name || ''
  if (!stockCode.value) {
    errorMsg.value = '未提供股票代码'
    return
  }
  loading.value = true
  errorMsg.value = ''

  try {
    const realtime = await fetchRealTime(stockCode.value)
    let klines = []
    try { klines = await fetchKline(stockCode.value, 100) } catch (e) { /* 容错 */ }
    const factors = extractFactors(realtime, klines)
    const { total: score, marketScore, turnoverScore, volScore, gainScore, ampScore, volaBonus, consecutiveBonus, moneyBonus } = computeScores(factors)
    const stageObj = getStage(factors, score)
    const target = getTargetPrice(factors.price, stageObj.type, score, factors.gain5d)
    const rec = getRecommendation(score, stageObj.type)
    const launchText = getLaunchTimeText(stageObj.type)
    const strategyText = getStrategyText(stageObj.type)

    // 描述文案
    const capDesc = factors.marketCap < 15 ? '极小盘，极易被游资撬动' : factors.marketCap < 30 ? '超小盘，弹性极强' : factors.marketCap < 60 ? '小盘优势明显，弹性极佳' : '中大盘股，妖性相对减弱'
    const volDesc = factors.volumeRatio > 3.0 ? '量比爆发式放大，攻击性极强' : factors.volumeRatio > 2.0 ? '量比显著放大，多头强势' : factors.volumeRatio > 1.3 ? '量能温和放大，多头占优' : '量能一般，需补量确认'
    const turnDesc = factors.turnover > 20 ? '交投极度活跃，游资接力激烈' : factors.turnover > 12 ? '交投非常活跃，资金参与度高' : factors.turnover > 8 ? '换手充分，市场参与度良好' : '活跃度有待进一步提升'
    const ampDesc = factors.amplitude > 10 ? '巨幅震荡，多空博弈白热化' : factors.amplitude > 6 ? '高振幅，资金分歧加大' : factors.amplitude > 4 ? '振幅健康，活跃度良好' : '振幅偏低，活跃度不足'
    const gainDesc = factors.gain5d > 20 ? '强势突破，妖股雏形已现' : factors.gain5d > 8 ? '温和上涨，蓄势待发' : factors.gain5d > 3 ? '小幅上行，启动初期' : '短期动能偏弱，蓄势阶段'
    const gain10dDesc = factors.gain10d > 30 ? '中期强势，趋势明确向上' : factors.gain10d > 15 ? '中期向好，上升通道中' : factors.gain10d > 5 ? '中期温和，稳步攀升' : '中期偏弱，有待放量'
    const themeDesc = factors.themeHeat > 75 ? '核心热点共振，极易爆发' : factors.themeHeat > 55 ? '题材有一定热度，需催化剂' : '题材关注度一般'

    // 涨跌停价（根据板块判断涨停幅度）
    const isKcbOrCyb = stockCode.value.startsWith('sh68') || stockCode.value.startsWith('sz30')
    const limitRate = isKcbOrCyb ? 0.20 : 0.10
    const limitUp = factors.price * (1 + limitRate)
    const limitDown = factors.price * (1 - limitRate)
    const limitUpDist = ((limitUp - factors.price) / factors.price * 100)

    const targetUpside = ((parseFloat(target.high) - factors.price) / factors.price * 100)

    result.value = {
      code: stockCode.value,
      name: realtime.name,
      price: realtime.price,
      changePct: realtime.changePct,
      open: realtime.open,
      high: realtime.high,
      low: realtime.low,
      yesterdayClose: realtime.yesterdayClose,
      amplitude: factors.amplitude,
      amountYi: realtime.amountWan / 10000,
      volumeWan: realtime.volumeHand / 100,
      turnover: factors.turnover,
      volumeRatio: factors.volumeRatio,
      gain5d: factors.gain5d,
      gain10d: factors.gain10d,
      marketCap: factors.marketCap,
      ma20: factors.ma20,
      themeHeat: factors.themeHeat,
      moneyFlow: factors.moneyFlow,
      moneyFlowAbs: Math.abs(factors.moneyFlow).toFixed(1),
      moneyFlowPrefix: factors.moneyFlow > 0 ? '+' : factors.moneyFlow < 0 ? '-' : '',
      volatility20d: factors.volatility20d,
      consecutiveUpDays: factors.consecutiveUpDays,
      score,
      marketScore, turnoverScore, volScore, gainScore, ampScore,
      volaBonus, consecutiveBonus, moneyBonus,
      stageName: stageObj.name,
      stageType: stageObj.type,
      stageDesc: stageObj.desc,
      targetLow: target.low,
      targetHigh: target.high,
      targetUpside,
      limitUp, limitDown, limitUpDist,
      recommendLevel: rec.level,
      recommendColor: rec.color,
      recommendEmoji: rec.emoji,
      recommendText: rec.text,
      launchText,
      strategyText,
      capDesc, volDesc, turnDesc, ampDesc, gainDesc, gain10dDesc, themeDesc
    }
  } catch (err) {
    errorMsg.value = err.message || '获取数据失败'
  } finally {
    loading.value = false
  }
}

const stageTagClass = computed(() => {
  if (!result.value) return ''
  const t = result.value.stageType
  return t === 'early' ? 'tag-early' : t === 'mid' ? 'tag-mid' : t === 'risk' ? 'tag-risk' : 'tag-pre'
})
const stageTagType = computed(() => {
  if (!result.value) return 'info'
  const t = result.value.stageType
  return t === 'early' ? 'success' : t === 'mid' ? 'warning' : t === 'risk' ? 'danger' : 'info'
})

onMounted(() => {
  // 如果有路由参数（从筛选列表跳转），自动加载；否则显示搜索框等待用户输入
  const codeFromQuery = route.query.code
  if (codeFromQuery) {
    stockCode.value = codeFromQuery
    stockName.value = route.query.name || ''
    loadDetail()
  }
})
</script>

<style scoped>
.stock-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.back-bar {
  margin-bottom: 16px;
}

/* 搜索卡片 */
.search-bar {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
.search-card {
  background: #fff;
  border-radius: 20px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
  border: 1px solid #e2e8f0;
  text-align: center;
}
.search-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #f97316;
  margin-bottom: 8px;
}
.search-title h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}
.search-desc {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 24px;
}
.search-input-row {
  display: flex;
  gap: 10px;
}
.search-input {
  flex: 1;
}
.search-tips {
  margin-top: 12px;
  font-size: 0.72rem;
  color: #94a3b8;
}

/* 头部 */
.detail-hero {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 20px;
  padding: 28px 32px;
  color: #fff;
  margin-bottom: 20px;
}
.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}
.hero-left h2 {
  font-size: 1.5rem;
  margin: 8px 0;
}
.code-text { font-size: 0.9rem; color: #94a3b8; font-weight: 400; }
.price-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.current-price {
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
}
.change-badge {
  font-size: 1.1rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 8px;
  background: rgba(255,255,255,0.1);
}
.text-up { color: #f87171; }
.text-down { color: #4ade80; }
.text-warn { color: #facc15; }

/* 快速概览条 */
.hero-quick-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.quick-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255,255,255,0.06);
  border-radius: 10px;
  padding: 6px 14px;
  min-width: 70px;
}
.qs-label {
  font-size: 0.65rem;
  color: #94a3b8;
  margin-bottom: 2px;
}
.qs-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: #e2e8f0;
}

.hero-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.score-card {
  text-align: center;
}
.score-num {
  font-size: 3rem;
  font-weight: 900;
  color: #f97316;
  line-height: 1;
}
.score-label {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 4px 0;
}
.score-bar-bg {
  width: 120px;
  height: 6px;
  background: #334155;
  border-radius: 10px;
  overflow: hidden;
}
.score-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f97316, #eab308);
  border-radius: 10px;
  transition: width 0.5s;
}
.rec-badge {
  font-size: 1.1rem;
  font-weight: 800;
  padding: 4px 16px;
  border: 2px solid;
  border-radius: 40px;
}

.stage-tag {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.8rem;
}
.tag-pre { background: #fef3c7; color: #92400e; }
.tag-early { background: #dbeafe; color: #1e40af; }
.tag-mid { background: #fef9c3; color: #a16207; }
.tag-risk { background: #fee2e2; color: #b91c1c; }

.error-block { margin: 40px 0; }

/* 指标卡片行 */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
.metric-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.metric-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.metric-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}
.metric-label {
  font-size: 0.7rem;
  color: #64748b;
}
.metric-desc {
  width: 100%;
  font-size: 0.72rem;
  color: #64748b;
  margin-top: 4px;
}

/* 详情网格 */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.detail-panel {
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

/* 因子评分 */
.factor-list { display: flex; flex-direction: column; gap: 14px; }
.factor-head {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 4px;
}
.factor-score {
  font-weight: 700;
  color: #f97316;
}
.bonus-row {
  padding-left: 12px;
  border-left: 2px solid #e2e8f0;
}
.bonus-row .factor-head span:first-child {
  font-size: 0.78rem;
  color: #64748b;
}

/* 阶段详情 */
.stage-header { margin-bottom: 10px; }
.stage-desc {
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.6;
}
.target-section { text-align: center; }
.target-label {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 8px;
}
.target-range {
  font-size: 1.5rem;
  font-weight: 800;
  color: #f97316;
  margin: 6px 0;
}
.target-sep { color: #94a3b8; margin: 0 8px; }
.target-unit { font-size: 0.9rem; color: #64748b; }
.target-note { font-size: 0.8rem; color: #64748b; margin-top: 4px; }
.launch-info {
  font-size: 0.85rem;
  color: #475569;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.5;
}

/* 特征列表 */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.feature-list li {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  font-size: 0.88rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}
.feature-list li:last-child { border-bottom: none; }
.icon-ok { color: #f97316; }
.icon-warn { color: #ea580c; }

/* 辅助指标 */
.aux-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.aux-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}
.aux-label { font-size: 0.82rem; color: #64748b; }
.aux-value { font-size: 0.9rem; font-weight: 600; color: #0f172a; }
.score-highlight { color: #f97316 !important; font-size: 1.1rem !important; }

/* 策略面板 */
.strategy-panel {
  border-radius: 16px;
  margin-bottom: 16px;
}
.strategy-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.risk-reminder {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 0.75rem;
  color: #94a3b8;
  line-height: 1.5;
}

/* 底部 */
.footer-note {
  text-align: center;
  font-size: 0.7rem;
  color: #6c7a91;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

@media (max-width: 768px) {
  .metrics-row { grid-template-columns: repeat(2, 1fr); }
  .detail-grid { grid-template-columns: 1fr; }
  .aux-grid { grid-template-columns: 1fr; }
  .hero-top { flex-direction: column; align-items: flex-start; }
  .hero-right { flex-direction: row; gap: 20px; }
  .hero-quick-stats { justify-content: flex-start; }
}
@media (max-width: 480px) {
  .metrics-row { grid-template-columns: 1fr; }
  .hero-quick-stats .quick-stat { min-width: 55px; padding: 4px 8px; }
}
</style>

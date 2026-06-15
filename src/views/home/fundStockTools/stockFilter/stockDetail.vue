<template>
  <div class="stock-detail-page fade-in">
    <!-- 返回按钮 -->
    <div class="back-bar">
      <el-button text @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回列表
      </el-button>
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

    <!-- 加载骨架 -->
    <div v-if="loading && !result" class="loading-skeleton">
      <div class="skeleton-hero"></div>
      <div class="skeleton-metrics">
        <div class="skeleton-card" v-for="i in 6" :key="i"></div>
      </div>
    </div>
    <div v-else-if="errorMsg" class="error-block">
      <el-empty description="获取数据失败" :image-size="80">
        <template #description>
          <p class="error-desc">数据获取过程中出现问题</p>
        </template>
        <el-alert type="error" :title="errorMsg" :closable="false" show-icon />
        <el-button type="primary" style="margin-top: 16px" @click="loadDetail">重新加载</el-button>
      </el-empty>
    </div>
    <div v-else-if="!loading && !result && !errorMsg" class="empty-state">
      <el-empty description="未提供股票代码" :image-size="80">
        <template #description>
          <p class="error-desc">请从股票筛选列表中选择一只股票查看详情</p>
        </template>
        <el-button type="primary" @click="$router.back()">返回列表</el-button>
      </el-empty>
    </div>

    <!-- 评估报告主体 -->
    <div v-if="result" class="report-body">
      <!-- 第一行：关键指标卡片（6个核心指标） -->
      <div class="metrics-row section-order-2">
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
      <div class="detail-grid section-order-1">
        <!-- 因子评分详情 -->
        <el-card class="detail-panel panel-order-2" shadow="hover">
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
        <el-card class="detail-panel panel-order-1" shadow="hover">
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
            <!-- 建议介入 & 止损止盈 -->
            <div class="entry-stop-section" v-if="result.entryStop">
              <div class="entry-stop-title">📊 建议介入与止损止盈</div>
              <div class="entry-stop-grid">
                <div class="es-item es-entry">
                  <span class="es-label">建议介入价</span>
                  <span class="es-value" :class="{ 'es-inactive': !result.entryStop.entryPrice }">{{ result.entryStop.entryLabel }}</span>
                </div>
                <div class="es-item es-stop">
                  <span class="es-label">建议止损价</span>
                  <span class="es-value" :class="{ 'es-inactive': !result.entryStop.stopLoss }">{{ result.entryStop.stopLabel }}</span>
                </div>
                <div class="es-item es-tp1">
                  <span class="es-label">止盈目标一</span>
                  <span class="es-value" :class="{ 'es-inactive': !result.entryStop.takeProfit1 }">{{ result.entryStop.tp1Label }}</span>
                </div>
                <div class="es-item es-tp2">
                  <span class="es-label">止盈目标二</span>
                  <span class="es-value" :class="{ 'es-inactive': !result.entryStop.takeProfit2 }">{{ result.entryStop.tp2Label }}</span>
                </div>
              </div>
              <div v-if="result.entryStop.riskRewardRatio !== null" class="es-rr">
                盈亏比 <strong :class="result.entryStop.riskRewardRatio >= 2 ? 'text-up' : 'text-warn'">{{ result.entryStop.riskRewardRatio }}:1</strong>
                <span v-if="result.entryStop.riskRewardRatio >= 3" class="es-rr-tip">（优秀）</span>
                <span v-else-if="result.entryStop.riskRewardRatio >= 2" class="es-rr-tip">（良好）</span>
                <span v-else class="es-rr-tip">（偏低）</span>
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
      <div class="detail-grid section-order-3">
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
            <li v-if="result.volatility20d && isFinite(result.volatility20d)"><el-icon class="icon-warn"><TrendCharts /></el-icon> 20日波动率：{{ result.volatility20d }}%（{{ result.volatility20d > 60 ? '高波动妖股基因' : result.volatility20d > 35 ? '中等波动' : '波动偏低' }}）</li>
            <li v-if="result.consecutiveUpDays > 1"><el-icon class="icon-ok"><CircleCheckFilled /></el-icon> 连涨天数：{{ result.consecutiveUpDays }}天</li>
            <li v-if="result.ma20 && result.price"><el-icon class="icon-warn"><DataLine /></el-icon> 20日均线偏离：{{ ((result.price - result.ma20) / result.ma20 * 100).toFixed(1) }}%（{{ result.price > result.ma20 ? '站上均线' : '跌破均线' }}）</li>
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
              <span class="aux-value">{{ isFinite(result.volatility20d) ? result.volatility20d + '%' : '—' }}</span>
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
              <span class="aux-label">均线偏离</span>
              <span :class="result.price > result.ma20 ? 'text-up' : 'text-down'" class="aux-value">
                {{ result.ma20 && result.price ? ((result.price - result.ma20) / result.ma20 * 100).toFixed(1) + '%' : '—' }}
              </span>
            </div>
            <div class="aux-item">
              <span class="aux-label">综合评分</span>
              <span class="aux-value score-highlight">{{ result.score }}/100</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 第四行：操盘策略 -->
      <el-card class="strategy-panel section-order-4" shadow="hover">
        <template #header>
          <span><el-icon><Opportunity /></el-icon> 操盘策略参考</span>
        </template>
        <div class="strategy-content">
          <!-- 策略概述 -->
          <el-alert
            :type="result.stageType === 'risk' ? 'error' : result.stageType === 'early' ? 'success' : 'warning'"
            :closable="false"
            show-icon
          >
            <template #title>
              <strong>{{ result.strategyText }}</strong>
            </template>
          </el-alert>

          <!-- 策略要点卡片 -->
          <div class="strategy-cards">
            <div class="strategy-card">
              <div class="sc-icon sc-icon-position">
                <el-icon><Odometer /></el-icon>
              </div>
              <div class="sc-body">
                <span class="sc-label">建议仓位</span>
                <span class="sc-value">{{ result.strategyTips?.position || '观望' }}</span>
              </div>
            </div>
            <div class="strategy-card">
              <div class="sc-icon sc-icon-cycle">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="sc-body">
                <span class="sc-label">持仓周期</span>
                <span class="sc-value">{{ result.strategyTips?.cycle || '待定' }}</span>
              </div>
            </div>
            <div class="strategy-card">
              <div class="sc-icon sc-icon-rule">
                <el-icon><DataLine /></el-icon>
              </div>
              <div class="sc-body">
                <span class="sc-label">核心纪律</span>
                <span class="sc-value">{{ result.strategyTips?.rule || '严格止损' }}</span>
              </div>
            </div>
            <div class="strategy-card">
              <div class="sc-icon sc-icon-focus">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="sc-body">
                <span class="sc-label">盯盘重点</span>
                <span class="sc-value">{{ result.strategyTips?.focus || '量价配合' }}</span>
              </div>
            </div>
          </div>

          <!-- 操作要点 -->
          <div class="strategy-checklist">
            <div class="checklist-title">📋 操作要点</div>
            <div class="checklist-item" v-for="(tip, idx) in (result.strategyTips?.checklist || [])" :key="idx">
              <el-icon class="check-icon"><CircleCheckFilled /></el-icon>
              <span>{{ tip }}</span>
            </div>
          </div>

          <!-- 风险提示 -->
          <div class="risk-reminder">
            <el-icon><WarningFilled /></el-icon>
            <span>妖股波动巨大，单日振幅可达±10%~±20%。以上策略仅为模型推演，请结合自身风险承受能力决策。止损纪律是妖股交易的生命线，切勿扛单。</span>
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
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft, Clock, DataAnalysis, DataLine, TrendCharts, Histogram,
  CircleCheckFilled, Odometer, Promotion, Opportunity, WarningFilled,
  InfoFilled, Setting
} from '@element-plus/icons-vue'

const route = useRoute()
const stockCode = ref('')
const stockName = ref('')
const loading = ref(false)
const errorMsg = ref('')
const result = ref(null)
let abortController = null

// ==================== 数据获取（复用主页面逻辑） ====================
async function fetchRealTime(codeRaw) {
  let code = codeRaw.toString().trim()
  if (!code.startsWith('sh') && !code.startsWith('sz')) {
    code = /^6/.test(code) ? 'sh' + code : 'sz' + code
  }
  const url = `/staticTool/api/qt/q=${code}`
  const response = await fetch(url, { signal: abortController?.signal })
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
    // K线数据格式：[日期, 开盘, 收盘, 最高, 最低, 成交量, 成交额]
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

function extractFactors(realtime, klines) {
  const { price, volumeRatio, turnoverRaw, marketCapRaw, changePct, amountWan, amplitude } = realtime
  const name = realtime.name || ''

  let turnover = turnoverRaw
  if (!turnover && marketCapRaw > 0 && amountWan > 0) {
    turnover = (amountWan * 10000) / (marketCapRaw * 1e8) * 100
  }
  // 换手率上限：次新股/极端活跃可能超50%，clamp到60防止极端值
  turnover = Math.min(turnover || 0, 60)

  // 5日涨幅（优先用逐日涨跌幅累加，退化为首尾价差）
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

  // 10日涨幅
  let gain10d = changePct
  if (klines?.length >= 10) {
    const recent10 = klines.slice(-10)
    let cumGain = 0
    for (let i = 1; i < recent10.length; i++) cumGain += recent10[i].changePct || 0
    if (Math.abs(cumGain) < 0.05 && recent10[0].close > 0) {
      cumGain = (recent10[recent10.length - 1].close - recent10[0].close) / recent10[0].close * 100
    }
    gain10d = isFinite(cumGain) ? cumGain : changePct
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
    moneyFlow: isFinite(moneyFlow) ? +moneyFlow.toFixed(1) : 0, price, changePct,
    volatility20d: isFinite(volatility20d) ? +volatility20d.toFixed(1) : 0, consecutiveUpDays,
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
  else if (turnover > 45 && turnover <= 55) turnoverScore = 18
  else if (turnover > 55) turnoverScore = 10
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

/**
 * 计算建议介入价、止损价、止盈价
 *
 * 核心逻辑：
 * - 介入价 = 当前价 × (1 - 回调比例)，回调比例受阶段、评分、涨幅、振幅、市值综合影响
 * - 止损价 = 介入价 × (1 - 止损比例)，止损比例以介入价为基准（而非当前价），更合理
 * - 止盈价 = 介入价 × (1 + 止盈比例)，止盈比例基于阶段+评分+振幅动态调节
 * - 盈亏比 = (目标二 - 介入价) : (介入价 - 止损价)，采用目标二作为潜在收益（保守取目标一也可）
 *
 * 关键改进：
 * 1. 介入价和止损价独立调整，不再共用同一个 multiplier
 * 2. 止损以介入价为锚点，而非当前价
 * 3. 止盈考虑振幅补偿——高振幅股票止盈目标应更高
 * 4. 评分对介入/止损/止盈的影响方向不同
 * 5. 增加均线参考（后续可扩展）
 */
function getEntryStopPrice(price, stageType, score, gain5d, amplitude, marketCap, turnover, ma20) {
  // 不可介入阶段
  if (stageType === 'risk' || stageType === 'cold') {
    return {
      entryPrice: null, stopLoss: null, takeProfit1: null, takeProfit2: null,
      entryLabel: '暂不建议介入', stopLabel: '—', tp1Label: '—', tp2Label: '—',
      riskRewardRatio: null
    }
  }

  // ========== 1. 基础参数（按阶段设定） ==========
  let basePullback, baseStopLoss, baseTP1, baseTP2

  switch (stageType) {
    case 'pre':
      // 蓄力突破：回调3%左右介入，止损5%，止盈目标适中
      basePullback = 0.030
      baseStopLoss = 0.050   // 相对于介入价的止损比例
      baseTP1 = 0.15
      baseTP2 = 0.25
      break
    case 'early':
      // 启动初期：小幅回调即可介入（2%），紧止损（4%），高止盈预期
      basePullback = 0.020
      baseStopLoss = 0.040
      baseTP1 = 0.18
      baseTP2 = 0.30
      break
    case 'mid':
      // 主升浪中：需要更大回调才安全（5%），宽止损防洗盘（7%），降低止盈预期
      basePullback = 0.050
      baseStopLoss = 0.070
      baseTP1 = 0.12
      baseTP2 = 0.20
      break
    default:
      basePullback = 0.040
      baseStopLoss = 0.060
      baseTP1 = 0.12
      baseTP2 = 0.22
  }

  // ========== 2. 动态调节系数 ==========

  // 2a. 评分因子（0.7~1.3）
  // 评分越高 → 回调介入可以更积极（少等回调），止损可略微放宽
  const scoreFactor = 0.7 + (score / 100) * 0.6
  // 介入价回调比例：评分高 → 少回调（积极介入），评分低 → 多回调（保守等待）
  const pullbackScoreAdj = 1.5 - (score / 100) * 0.8  // 范围：0.7~1.4
  // 止损比例：评分高 → 止损略宽（信任评分），评分低 → 止损紧（严格风控）
  const stopScoreAdj = 0.7 + (score / 100) * 0.6  // 范围：0.7~1.3

  // 2b. 涨幅因子——已涨越多，回调需求越大
  // 5日涨幅超过15%：需要更深的回调才安全
  let gainPullbackAdj = 1.0
  if (gain5d > 35) gainPullbackAdj = 1.8
  else if (gain5d > 25) gainPullbackAdj = 1.5
  else if (gain5d > 15) gainPullbackAdj = 1.25
  else if (gain5d > 8) gainPullbackAdj = 1.1
  else if (gain5d < 0) gainPullbackAdj = 0.85  // 已回调过，可稍积极

  // 涨幅对止损的影响：涨幅大 → 止损需放宽以防震出
  let gainStopAdj = 1.0
  if (gain5d > 30) gainStopAdj = 1.35
  else if (gain5d > 20) gainStopAdj = 1.2
  else if (gain5d > 10) gainStopAdj = 1.08
  else if (gain5d < -3) gainStopAdj = 0.9  // 已跌较多，止损收窄

  // 2c. 振幅因子——高振幅股票需要更宽的止损和更高的止盈目标
  let ampStopAdj = 1.0
  let ampTPAdj = 1.0
  if (amplitude > 12) { ampStopAdj = 1.4; ampTPAdj = 1.25 }
  else if (amplitude > 8) { ampStopAdj = 1.2; ampTPAdj = 1.12 }
  else if (amplitude > 5) { ampStopAdj = 1.08; ampTPAdj = 1.05 }
  else if (amplitude < 3) { ampStopAdj = 0.9; ampTPAdj = 0.9 }

  // 2d. 市值因子——小市值波动大
  let capStopAdj = 1.0
  if (marketCap < 15) capStopAdj = 1.2
  else if (marketCap < 30) capStopAdj = 1.1
  else if (marketCap < 50) capStopAdj = 1.05
  else if (marketCap > 150) capStopAdj = 0.9

  // 2e. 换手率因子——高换手意味着活跃度高，止损可略紧（流动性好）
  let turnoverAdj = 1.0
  if (turnover > 30) turnoverAdj = 0.9
  else if (turnover > 20) turnoverAdj = 0.95
  else if (turnover < 5) turnoverAdj = 1.1  // 低换手，流动性差，止损宽一点

  // ========== 3. 综合计算 ==========

  // 介入价回调比例（综合所有因子）
  const adjustedPullback = Math.min(
    basePullback * pullbackScoreAdj * gainPullbackAdj,
    0.12  // 回调上限12%
  )
  const adjustedPullbackClamped = Math.max(adjustedPullback, 0.01)  // 回调下限1%

  // 止损比例（以介入价为基准）
  const adjustedStopRatio = Math.min(
    baseStopLoss * stopScoreAdj * gainStopAdj * ampStopAdj * capStopAdj * turnoverAdj,
    0.12  // 止损上限12%
  )
  const adjustedStopRatioClamped = Math.max(adjustedStopRatio, 0.025)  // 止损下限2.5%

  // 止盈比例（以介入价为基准）
  const tp1Ratio = Math.min(baseTP1 * scoreFactor * ampTPAdj, 0.35)
  const tp2Ratio = Math.min(baseTP2 * scoreFactor * ampTPAdj, 0.55)

  // 计算具体价格
  let entryPrice = +(price * (1 - adjustedPullbackClamped)).toFixed(2)

  // 均线支撑参考：如果回调后的介入价低于MA20，取MA20作为介入价底线
  // MA20通常为中期支撑位，不应轻易跌破
  if (ma20 && ma20 > 0 && entryPrice < ma20 && ma20 < price) {
    entryPrice = +ma20.toFixed(2)
  }

  const stopLoss = +(entryPrice * (1 - adjustedStopRatioClamped)).toFixed(2)
  const takeProfit1 = +(entryPrice * (1 + tp1Ratio)).toFixed(2)
  const takeProfit2 = +(entryPrice * (1 + tp2Ratio)).toFixed(2)

  // ========== 4. 盈亏比 ==========
  // 使用目标二作为潜在收益，更体现妖股的爆发潜力
  const riskPerShare = entryPrice - stopLoss
  const rewardPerShare = takeProfit2 - entryPrice
  const riskRewardRatio = riskPerShare > 0 ? +(rewardPerShare / riskPerShare).toFixed(1) : null

  // 标签文案
  const entryPct = ((price - entryPrice) / price * 100).toFixed(1)
  const stopPct = ((entryPrice - stopLoss) / entryPrice * 100).toFixed(1)
  const tp1Pct = ((takeProfit1 - entryPrice) / entryPrice * 100).toFixed(1)
  const tp2Pct = ((takeProfit2 - entryPrice) / entryPrice * 100).toFixed(1)

  return {
    entryPrice,
    stopLoss,
    takeProfit1,
    takeProfit2,
    entryLabel: `¥${entryPrice}（回调 ${entryPct}%）`,
    stopLabel: `¥${stopLoss}（-${stopPct}%）`,
    tp1Label: `¥${takeProfit1}（+${tp1Pct}%）`,
    tp2Label: `¥${takeProfit2}（+${tp2Pct}%）`,
    riskRewardRatio
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
    risk: '⚠️ 风险已显著加剧，不适合新开仓位，密切观察高位出货迹象。',
    cold: '❄️ 当前处于冷门低迷期，缺乏资金关注，短期内启动概率较低。需等待题材催化或资金入场信号。'
  }
  return map[stageType] || '⏳ 震荡整固中，启动时间需等待放量确认信号。'
}

function getStrategyText(stageType) {
  const map = {
    pre: '逢低潜伏，分批建仓介入，设置-5%止损线。等待放量突破确认后加仓，切忌追高。',
    early: '突破确认后可适当加仓，紧守5日均线作为止盈参考。目标上看第一目标位，到达后可部分止盈。',
    mid: '持仓者继续持有，移动止盈位逐步上移。新开仓需严格控制仓位（不超过总仓位10%），紧盯分时承接。',
    risk: '建议逐步止盈或回避，高位巨量阴线为明确离场信号。宁可错过，不可做错。',
    cold: '不建议参与，流动性差且缺乏催化。可加入自选股观察，等待放量异动后再考虑入场。'
  }
  return map[stageType] || '保持观望，等待更明确的入场信号。'
}

function getStrategyTips(stageType) {
  const map = {
    pre: {
      position: '1-2成试探仓',
      cycle: '3-7个交易日',
      rule: '-5%无条件止损',
      focus: '量能突变+放量突破',
      checklist: [
        '分2-3批建仓，首次不超过1成仓位',
        '放量突破关键阻力位方可加仓',
        '收盘跌破5日线减半仓',
        '单日跌幅超5%立即离场观望'
      ]
    },
    early: {
      position: '3-5成主攻仓',
      cycle: '2-5个交易日',
      rule: '以5日均线为止盈线',
      focus: '分时承接+连板概率',
      checklist: [
        '可适度加仓，总仓位不超过5成',
        '利润超10%后移动止损至成本价',
        '到达第一目标位先止盈1/3',
        '高位放量长上影为离场信号'
      ]
    },
    mid: {
      position: '持仓不动，新开≤1成',
      cycle: '1-3个交易日',
      rule: '移动止盈，回撤-7%离场',
      focus: '高位分歧+出货迹象',
      checklist: [
        '已持仓者逐步上移止盈位',
        '新开仓仅限超短，次日不涨停即走',
        '关注龙虎榜游资动向',
        '高位巨量长阴无条件清仓'
      ]
    },
    risk: {
      position: '不建议参与',
      cycle: '——',
      rule: '宁可错过，不可做错',
      focus: '高位出货+资金撤离',
      checklist: [
        '坚决不开新仓，观望为主',
        '持仓者逢反弹逐步减仓',
        '高位巨量阴线为明确离场信号',
        '等待回调企稳后再评估介入'
      ]
    },
    cold: {
      position: '不建议参与',
      cycle: '——',
      rule: '等待放量异动信号',
      focus: '题材催化+资金入场',
      checklist: [
        '加入自选股观察，不急于入场',
        '等待放量+涨幅双确认信号',
        '关注是否有热点题材催化',
        '若持续缩量阴跌则删除自选'
      ]
    }
  }
  return map[stageType] || {
    position: '观望',
    cycle: '待定',
    rule: '严格止损',
    focus: '量价配合',
    checklist: ['等待更明确的入场信号', '严格控制仓位', '设置好止损位', '不追高、不扛单']
  }
}

// ==================== 主控 ====================
async function loadDetail() {
  // 取消上一次未完成的请求
  if (abortController) {
    abortController.abort()
  }
  abortController = new AbortController()
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
    const strategyTips = getStrategyTips(stageObj.type)
    const entryStop = getEntryStopPrice(factors.price, stageObj.type, score, factors.gain5d, factors.amplitude, factors.marketCap, factors.turnover, factors.ma20)

    // 描述文案
    const capDesc = factors.marketCap < 15 ? '极小盘，极易被游资撬动' : factors.marketCap < 30 ? '超小盘，弹性极强' : factors.marketCap < 60 ? '小盘优势明显，弹性极佳' : '中大盘股，妖性相对减弱'
    const volDesc = factors.volumeRatio > 3.0 ? '量比爆发式放大，攻击性极强' : factors.volumeRatio > 2.0 ? '量比显著放大，多头强势' : factors.volumeRatio > 1.3 ? '量能温和放大，多头占优' : '量能一般，需补量确认'
    const turnDesc = factors.turnover > 20 ? '交投极度活跃，游资接力激烈' : factors.turnover > 12 ? '交投非常活跃，资金参与度高' : factors.turnover > 8 ? '换手充分，市场参与度良好' : '活跃度有待进一步提升'
    const ampDesc = factors.amplitude > 10 ? '巨幅震荡，多空博弈白热化' : factors.amplitude > 6 ? '高振幅，资金分歧加大' : factors.amplitude > 4 ? '振幅健康，活跃度良好' : '振幅偏低，活跃度不足'
    const gainDesc = factors.gain5d > 20 ? '强势突破，妖股雏形已现' : factors.gain5d > 8 ? '温和上涨，蓄势待发' : factors.gain5d > 3 ? '小幅上行，启动初期' : '短期动能偏弱，蓄势阶段'
    const gain10dDesc = factors.gain10d > 30 ? '中期强势，趋势明确向上' : factors.gain10d > 15 ? '中期向好，上升通道中' : factors.gain10d > 5 ? '中期温和，稳步攀升' : '中期偏弱，有待放量'
    const themeDesc = factors.themeHeat > 75 ? '核心热点共振，极易爆发' : factors.themeHeat > 55 ? '题材有一定热度，需催化剂' : '题材关注度一般'

    // 涨跌停价（根据板块判断涨停幅度）
    // 科创板(sh68)、创业板(sz30) ±20%；北交所(bj8) ±30%；主板 ±10%
    const rawCode = stockCode.value.replace(/^(sh|sz|bj)/, '')
    const isKcb = stockCode.value.startsWith('sh68')
    const isCyb = stockCode.value.startsWith('sz30')
    const isBjs = stockCode.value.startsWith('bj8') || /^[48]/.test(rawCode)
    const limitRate = isKcb || isCyb ? 0.20 : isBjs ? 0.30 : 0.10
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
      moneyFlowAbs: (Math.abs(factors.moneyFlow) || 0).toFixed(1),
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
      strategyTips,
      entryStop,
      capDesc, volDesc, turnDesc, ampDesc, gainDesc, gain10dDesc, themeDesc
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('请求已取消')
      return
    }
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
  // 滚动到页面顶部（解决从筛选列表跳转时继承滚动位置的问题）
  window.scrollTo({ top: 0, behavior: 'instant' })

  // 如果有路由参数（从筛选列表跳转），自动加载；否则显示搜索框等待用户输入
  const codeFromQuery = route.query.code
  if (codeFromQuery) {
    stockCode.value = codeFromQuery
    stockName.value = route.query.name || ''
    loadDetail()
  }
})

onBeforeUnmount(() => {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
})
</script>

<style lang="scss" scoped>
  @import url('../style/stockFilter/stockDetail.scss');
</style>

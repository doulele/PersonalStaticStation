<template>
  <div class="sr-detail">
    <!-- ============ 顶部工具条 ============ -->
    <div class="sr-toolbar">
      <button class="back-btn" @click="goBack">← 返回列表</button>
      <div class="horizon-switch">
        <button
          v-for="h in horizons"
          :key="h.key"
          class="horizon-btn"
          :class="{ active: horizon === h.key }"
          @click="changeHorizon(h.key)"
        >{{ h.label }}</button>
      </div>
      <div class="toolbar-right">
        <span v-if="detail" class="update-time">更新 {{ formatTime(detail.updateTime) }}</span>
        <button class="tool-btn" @click="openEastMoney">东财</button>
        <button class="tool-btn" @click="goGuide">评分说明</button>
        <button class="tool-btn refresh" :disabled="loading" @click="load">刷新</button>
      </div>
    </div>

    <!-- 加载 / 错误 -->
    <div v-if="loading && !detail" class="loading-mask">
      <div class="loading-inner">
        <div class="spinner"></div>
        <div class="loading-title">正在计算股票评分</div>
        <div class="loading-desc">正在拉取行情、财务数据与K线，首次约需 2~5 秒</div>
        <div class="loading-stage">
          <span class="stage-item" :class="{ done: stage >= 1 }">① 行情快照</span>
          <span class="stage-arrow">→</span>
          <span class="stage-item" :class="{ done: stage >= 2 }">② 财务数据</span>
          <span class="stage-arrow">→</span>
          <span class="stage-item" :class="{ done: stage >= 3 }">③ 六维评分</span>
        </div>
      </div>
    </div>
    <div v-else-if="errorMsg" class="error-box">⚠️ {{ errorMsg }}</div>

    <template v-else-if="detail">
      <!-- ============ 基本信息 + 评分总览 ============ -->
      <div class="sr-overview">
        <div class="card basic-card">
          <div class="basic-head">
            <div class="stock-title">
              <span class="stock-name">{{ detail.basic.name }}</span>
              <span class="stock-code">{{ detail.basic.code }}</span>
              <span v-if="detail.basic.isSt" class="st-tag">ST</span>
            </div>
            <span class="industry-tag">{{ detail.basic.industry }}</span>
          </div>
          <div class="metric-grid">
            <div class="metric-item">
              <div class="m-label">最新价</div>
              <div class="m-value price" :class="priceClass(detail.basic.changePct)">{{ fmtNum(detail.basic.price, 2) }}</div>
              <div class="m-sub" :class="priceClass(detail.basic.changePct)">{{ fmtPct(detail.basic.changePct) }}</div>
            </div>
            <div class="metric-item">
              <div class="m-label">总市值</div>
              <div class="m-value">{{ fmtYi(detail.basic.marketCap) }}</div>
            </div>
            <div class="metric-item">
              <div class="m-label">流通市值</div>
              <div class="m-value">{{ fmtYi(detail.basic.floatMarketCap) }}</div>
            </div>
            <div class="metric-item">
              <div class="m-label">PE(TTM)</div>
              <div class="m-value">{{ fmtNum(detail.basic.peTtm, 2) }}</div>
            </div>
            <div class="metric-item">
              <div class="m-label">PB</div>
              <div class="m-value">{{ fmtNum(detail.basic.pb, 2) }}</div>
            </div>
            <div class="metric-item">
              <div class="m-label">ROE</div>
              <div class="m-value">{{ detail.basic.roe != null ? detail.basic.roe.toFixed(2) + '%' : '--' }}</div>
            </div>
            <div class="metric-item">
              <div class="m-label">股息率</div>
              <div class="m-value">{{ detail.basic.dividendYield != null ? detail.basic.dividendYield.toFixed(2) + '%' : '--' }}</div>
            </div>
            <div class="metric-item">
              <div class="m-label">报告期</div>
              <div class="m-value small">{{ detail.basic.reportDate ? detail.basic.reportDate.slice(0, 10) : '--' }}</div>
            </div>
          </div>
        </div>

        <div class="card score-card">
          <div class="score-top">
            <div class="score-badge" :class="scoreClass(detail.total)">
              <div class="sb-label">综合评分</div>
              <div class="sb-num">{{ detail.total }}</div>
            </div>
            <div class="score-summary">
              <div class="stars">
                <span class="star-full">{{ '★'.repeat(detail.star) }}</span>
                <span class="star-empty">{{ '★'.repeat(5 - detail.star) }}</span>
              </div>
              <div class="tags">
                <span class="conclusion-tag" :class="conclusionClass(detail.conclusion)">{{ detail.conclusion }}</span>
                <span class="risk-tag" :class="'risk-' + detail.riskLevel">风险{{ detail.riskLevel }}</span>
                <span v-if="detail.aboveMa60" class="ma60-tag">✅ 站上MA60</span>
                <span v-else class="ma60-tag no">⬇ 跌破MA60</span>
              </div>
            </div>
          </div>
          <div v-if="detail.vetoed" class="veto-warn">
            🚫 触发风险否决（{{ detail.vetoReason }}），结论强制为「回避」
          </div>
          <div class="reason-short">{{ detail.reasonShort }}</div>
        </div>
      </div>

      <!-- ============ 六维评分：进度条 + 雷达图 ============ -->
      <div class="sr-dims">
        <div class="card dims-bars">
          <h3 class="card-title">六维评分</h3>
          <div v-for="d in detail.details" :key="d.key" class="dim-bar-row">
            <div class="dim-bar-head">
              <span class="dim-name">{{ d.dimension }}</span>
              <span class="dim-weight">权重 {{ d.weight }}%</span>
              <span class="dim-score" :class="scoreTextClass(d.score)">{{ d.score }}</span>
            </div>
            <div class="dim-bar">
              <div class="dim-bar-fill" :class="'dim-' + d.key" :style="{ width: (d.score || 0) + '%' }"></div>
            </div>
          </div>
        </div>
        <div class="card radar-card">
          <h3 class="card-title">维度雷达</h3>
          <div ref="radarRef" class="radar-chart"></div>
        </div>
      </div>

      <!-- ============ K线图 ============ -->
      <div class="card kline-card">
        <div class="kline-head">
          <h3 class="card-title">日K走势（MA5/10/20/60 · 成交量 · MACD · KDJ）</h3>
          <span class="kline-note">近 {{ detail.kline?.length || 0 }} 个交易日 · 滚轮缩放</span>
        </div>
        <div ref="klineRef" class="kline-chart"></div>
      </div>

      <!-- ============ 六维维度明细 ============ -->
      <div class="dim-details">
        <div v-for="d in detail.details" :key="d.key" class="card dim-card">
          <div class="dim-card-head">
            <span class="dim-card-name">{{ d.dimension }}</span>
            <span class="dim-card-score" :class="scoreTextClass(d.score)">{{ d.score }} 分</span>
            <span class="dim-card-weight">权重 {{ d.weight }}%</span>
          </div>
          <table class="sub-table">
            <thead>
              <tr><th>子指标</th><th>数值</th><th>得分</th><th>权重</th></tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in d.subItems" :key="idx">
                <td class="sub-name">{{ item.name }}</td>
                <td class="sub-value">{{ item.value }}</td>
                <td><span class="sub-score" :class="scoreTextClass(item.score)">{{ item.score != null ? Math.round(item.score) : '--' }}</span></td>
                <td class="sub-weight">{{ item.weight }}%</td>
              </tr>
              <tr v-if="!d.subItems || !d.subItems.length">
                <td colspan="4" class="sub-empty">数据缺失，本维度未计入评分</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ============ 推荐理由 ============ -->
      <div class="card reason-card">
        <h3 class="card-title">推荐理由（{{ currentHorizonLabel }}）</h3>
        <div class="reason-text">{{ detail.reason }}</div>
      </div>

      <!-- ============ 风险提示 ============ -->
      <div class="card risk-card">
        <h3 class="card-title">风险提示</h3>
        <div class="risk-grid">
          <div class="risk-item">
            <div class="r-label">20日波动率</div>
            <div class="r-value" :class="riskColor(detail.riskMetrics?.volatility20, 'vol')">{{ fmtNum(detail.riskMetrics?.volatility20, 1) }}%</div>
          </div>
          <div class="risk-item">
            <div class="r-label">60日波动率</div>
            <div class="r-value">{{ fmtNum(detail.riskMetrics?.volatility60, 1) }}%</div>
          </div>
          <div class="risk-item">
            <div class="r-label">最大回撤(1年)</div>
            <div class="r-value down">{{ fmtNum(detail.riskMetrics?.maxDrawdown1y, 1) }}%</div>
          </div>
          <div class="risk-item">
            <div class="r-label">资产负债率</div>
            <div class="r-value" :class="riskColor(detail.riskMetrics?.debtRatio, 'debt')">{{ fmtNum(detail.riskMetrics?.debtRatio, 1) }}%</div>
          </div>
          <div class="risk-item">
            <div class="r-label">商誉/净资产</div>
            <div class="r-value" :class="riskColor(detail.riskMetrics?.goodwillRatio, 'goodwill')">{{ fmtNum(detail.riskMetrics?.goodwillRatio, 1) }}%</div>
          </div>
          <div class="risk-item">
            <div class="r-label">换手率</div>
            <div class="r-value">{{ fmtNum(detail.riskMetrics?.turnoverRate, 2) }}%</div>
          </div>
        </div>
        <div v-if="detail.vetoed" class="veto-warn veto-block">
          🚫 该股触发风险否决项（{{ detail.vetoReason }}），评分模型强制将其结论设定为「回避」，请谨慎对待。
        </div>
        <p class="risk-note">* 波动率/回撤基于历史K线计算；资产负债率与商誉数据来自最新报告期。ST 标记可能未包含退市整理期个股，请以交易所公告为准。</p>
      </div>

      <!-- ============ 财务指标 ============ -->
      <div class="card fin-card">
        <h3 class="card-title">财务指标 <small class="fin-report" v-if="detail.basic.reportDate">（报告期 {{ detail.basic.reportDate.slice(0, 10) }}）</small></h3>
        <div class="fin-grid">
          <div v-for="f in finMetrics" :key="f.name" class="fin-item">
            <div class="f-label">{{ f.name }}</div>
            <div class="f-value" :class="f.positive != null ? (f.positive ? 'up' : 'down') : ''">{{ f.value }}</div>
          </div>
        </div>
      </div>

      <!-- ============ 资金情绪数据 ============ -->
      <div class="card fund-card">
        <h3 class="card-title">资金情绪数据</h3>
        <div class="fund-grid">
          <div class="fund-panel">
            <div class="fund-title">融资余额（近{{ fundFlow.margin.length }}日）</div>
            <table v-if="fundFlow.margin.length" class="fund-table">
              <thead><tr><th>日期</th><th>融资余额(亿)</th><th>融资买入(亿)</th></tr></thead>
              <tbody>
                <tr v-for="(r, i) in fundFlow.margin" :key="i">
                  <td>{{ r.date }}</td>
                  <td>{{ fmtYi(r.rzye) }}</td>
                  <td>{{ fmtYi(r.rzmre) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="fund-empty">未检测到融资数据（或非两融标的）</div>
          </div>
          <div class="fund-panel">
            <div class="fund-title">机构调研</div>
            <table v-if="fundFlow.surveys.length" class="fund-table">
              <thead><tr><th>日期</th><th>机构类型</th><th>家数</th></tr></thead>
              <tbody>
                <tr v-for="(r, i) in fundFlow.surveys.slice(0, 10)" :key="i">
                  <td>{{ r.date }}</td>
                  <td>{{ r.orgType || '--' }}</td>
                  <td>{{ r.num ?? '--' }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="fund-empty">近期无机构调研记录</div>
          </div>
          <div class="fund-panel">
            <div class="fund-title">龙虎榜</div>
            <table v-if="fundFlow.lhb.length" class="fund-table">
              <thead><tr><th>日期</th><th>原因</th><th>净额(万)</th></tr></thead>
              <tbody>
                <tr v-for="(r, i) in fundFlow.lhb.slice(0, 10)" :key="i">
                  <td>{{ r.date }}</td>
                  <td class="lhb-explain" :title="r.explanation">{{ r.explanation || '--' }}</td>
                  <td :class="(r.buy - r.sell) >= 0 ? 'up' : 'down'">{{ fmtWan(r.buy - r.sell) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="fund-empty">近期未上榜</div>
          </div>
        </div>
      </div>

      <!-- ============ 免责声明 ============ -->
      <div class="disclaimer">
        ⚠️ 数据来源：东方财富 / 腾讯行情，实时计算。本评分模型为多因子量化工具，仅用于技术研究，不构成任何投资建议。评分基于历史数据，历史业绩不代表未来表现，市场有风险，投资需谨慎。
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getStockDetail, getHorizonConfig } from '@/api/stockRecommend'

const route = useRoute()
const router = useRouter()

const detail = ref(null)
const loading = ref(false)
const errorMsg = ref('')
const horizons = ref([])
const horizon = ref(route.query.horizon || 'short')
const stage = ref(0) // loading 阶段进度

const radarRef = ref(null)
const klineRef = ref(null)

let stageTimer = null

// 默认周期配置（接口失败时兜底，保证切换按钮可用）
const DEFAULT_HORIZONS = [
  { key: 'short', label: '短线', desc: '技术面35% + 资金情绪30%，侧重量价与短线动量' },
  { key: 'mid', label: '中长线', desc: '成长与盈利质量各25%，兼顾估值与技术' },
  { key: 'long', label: '长线', desc: '估值+盈利质量合计60%，弱化短期波动' }
]

const currentHorizonLabel = computed(() => {
  const h = horizons.value.find(x => x.key === horizon.value)
  return h ? `${h.label}（${h.desc}）` : horizon.value
})

// ==================== 图表实例 ====================
let radarChart = null
let klineChart = null
let darkObserver = null
let abortCtrl = null

// ==================== 数据加载 ====================
function startStage() {
  stopStage()
  stage.value = 1
  stageTimer = setInterval(() => {
    if (stage.value < 3) stage.value++
  }, 1200)
}
function stopStage() {
  if (stageTimer) { clearInterval(stageTimer); stageTimer = null }
}

async function load() {
  const code = route.params.code
  if (!code) { errorMsg.value = '缺少股票代码'; return }
  loading.value = true
  errorMsg.value = ''
  startStage()
  // 中止上一次未完成的请求（切换周期/代码时），释放连接
  if (abortCtrl) { abortCtrl.abort(); abortCtrl = null }
  abortCtrl = new AbortController()
  try {
    const res = await getStockDetail(code, horizon.value, abortCtrl.signal)
    if (res.code === 0) {
      stage.value = 3
      detail.value = res.data
      await nextTick()
      renderCharts()
    } else {
      errorMsg.value = res.message || '未找到该股票'
    }
  } catch (e) {
    // 主动中止的请求不提示错误
    if (e.name === 'AbortError') return
    errorMsg.value = e.message || '网络错误，请稍后重试'
  } finally {
    stopStage()
    loading.value = false
  }
}

function changeHorizon(h) {
  if (horizon.value === h) return
  horizon.value = h
  load()
}

function loadConfig() {
  horizons.value = DEFAULT_HORIZONS
  getHorizonConfig().then(res => {
    if (res.code === 0 && res.data && res.data.length) horizons.value = res.data
  }).catch(() => {})
}

// ==================== 图表渲染 ====================
function isDark() {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark-mode')
}

function chartColors() {
  return {
    text: isDark() ? '#8b93a7' : '#64748b',
    axisLine: isDark() ? '#2d3142' : '#e2e8f0',
    splitLine: isDark() ? '#22232f' : '#f0f4f8',
    ma5: '#f59e0b', ma10: '#3b82f6', ma20: '#a855f7', ma60: '#06b6d4',
    up: '#ef4444', down: '#10b981', // A股习惯：涨红跌绿
    gridBg: isDark() ? '#15161e' : '#ffffff'
  }
}

function renderCharts() {
  renderRadar()
  renderKline()
}

function renderRadar() {
  if (!radarChart) {
    if (!radarRef.value) return
    radarChart = echarts.init(radarRef.value)
  }
  const c = chartColors()
  const ds = detail.value?.dimScores || {}
  const names = ['估值', '成长', '质量', '技术', '资金', '风险']
  const keys = ['valuation', 'growth', 'quality', 'technical', 'sentiment', 'risk']
  radarChart.setOption({
    backgroundColor: 'transparent',
    radar: {
      indicator: names.map(n => ({ name: n, max: 100 })),
      radius: '68%',
      center: ['50%', '52%'],
      axisName: { color: c.text, fontSize: 12 },
      axisLine: { lineStyle: { color: c.axisLine } },
      splitLine: { lineStyle: { color: c.splitLine } },
      splitArea: { areaStyle: { color: ['rgba(245,158,11,0.02)', 'rgba(245,158,11,0.04)'] } }
    },
    series: [{
      type: 'radar',
      symbolSize: 5,
      data: [{
        value: keys.map(k => ds[k] || 0),
        name: '六维评分',
        lineStyle: { color: '#f59e0b', width: 2 },
        itemStyle: { color: '#f59e0b' },
        areaStyle: { color: 'rgba(245,158,11,0.2)' }
      }]
    }],
    tooltip: {
      trigger: 'item',
      formatter: p => {
        const labels = ['估值', '成长', '质量', '技术', '资金', '风险']
        return labels.map((l, i) => `${l}：${(p.value[i] || 0)}分`).join('<br/>')
      }
    }
  })
}

function renderKline() {
  if (!detail.value?.kline?.length) return
  if (!klineChart) {
    if (!klineRef.value) return
    klineChart = echarts.init(klineRef.value)
  }
  const c = chartColors()
  const kline = detail.value.kline
  const dates = kline.map(k => k.date)
  const closes = kline.map(k => k.close)
  const vols = kline.map(k => k.volume || 0)

  // MA 序列
  const ma = (p) => closes.map((_, i) => {
    if (i < p - 1) return null
    let s = 0
    for (let j = i - p + 1; j <= i; j++) s += closes[j]
    return +(s / p).toFixed(2)
  })

  // MACD 序列
  const emaArr = (arr, p) => {
    const k = 2 / (p + 1)
    const out = []
    let e = null
    for (let i = 0; i < arr.length; i++) {
      e = e == null ? arr[i] : arr[i] * k + e * (1 - k)
      out.push(+e.toFixed(4))
    }
    return out
  }
  const e12 = emaArr(closes, 12)
  const e26 = emaArr(closes, 26)
  const dif = closes.map((_, i) => +(e12[i] - e26[i]).toFixed(4))
  const dea = emaArr(dif, 9)
  const hist = dif.map((d, i) => +((d - dea[i]) * 2).toFixed(4))

  // KDJ(9,3,3) 序列
  const kdjArr = { k: [], d: [], j: [] }
  {
    let prevK = 50, prevD = 50
    const period = 9
    for (let i = 0; i < closes.length; i++) {
      if (i < period - 1) {
        kdjArr.k.push(null); kdjArr.d.push(null); kdjArr.j.push(null)
        continue
      }
      let hh = -Infinity, ll = Infinity
      for (let m = i - period + 1; m <= i; m++) {
        if (kline[m].high > hh) hh = kline[m].high
        if (kline[m].low < ll) ll = kline[m].low
      }
      const rsv = hh === ll ? 50 : (closes[i] - ll) / (hh - ll) * 100
      const newK = (2 / 3) * prevK + (1 / 3) * rsv
      const newD = (2 / 3) * prevD + (1 / 3) * newK
      const newJ = 3 * newK - 2 * newD
      kdjArr.k.push(+newK.toFixed(2))
      kdjArr.d.push(+newD.toFixed(2))
      kdjArr.j.push(+newJ.toFixed(2))
      prevK = newK; prevD = newD
    }
  }

  const volColors = kline.map(k => k.close >= k.open ? c.up : c.down)
  const histColors = hist.map(v => v >= 0 ? c.up : c.down)

  klineChart.setOption({
    backgroundColor: 'transparent',
    animation: false,
    legend: {
      data: ['MA5', 'MA10', 'MA20', 'MA60', 'K', 'D', 'J'],
      top: 0,
      left: 8,
      textStyle: { color: c.text, fontSize: 11 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: isDark() ? '#1e2030' : '#fff',
      borderColor: c.axisLine,
      textStyle: { color: isDark() ? '#cbd5e1' : '#334155', fontSize: 12 }
    },
    axisPointer: {
      link: [{ xAxisIndex: 'all' }]
    },
    grid: [
      { left: 55, right: 16, top: 26, height: '46%' },
      { left: 55, right: 16, top: '60%', height: '13%' },
      { left: 55, right: 16, top: '78%', height: '10%' },
      { left: 55, right: 16, top: '92%', height: '6%' }
    ],
    xAxis: [
      { type: 'category', data: dates, gridIndex: 0, axisLine: { lineStyle: { color: c.axisLine } }, axisLabel: { show: false }, axisTick: { show: false } },
      { type: 'category', data: dates, gridIndex: 1, axisLine: { lineStyle: { color: c.axisLine } }, axisLabel: { show: false }, axisTick: { show: false } },
      { type: 'category', data: dates, gridIndex: 2, axisLine: { lineStyle: { color: c.axisLine } }, axisLabel: { show: false }, axisTick: { show: false } },
      { type: 'category', data: dates, gridIndex: 3, axisLine: { lineStyle: { color: c.axisLine } }, axisLabel: { show: true, color: c.text, fontSize: 10, interval: 'auto' }, axisTick: { show: false } }
    ],
    yAxis: [
      { scale: true, gridIndex: 0, axisLine: { lineStyle: { color: c.axisLine } }, axisLabel: { color: c.text, fontSize: 10 }, splitLine: { lineStyle: { color: c.splitLine } } },
      { scale: true, gridIndex: 1, axisLine: { lineStyle: { color: c.axisLine } }, axisLabel: { color: c.text, fontSize: 10 }, splitLine: { lineStyle: { color: c.splitLine } }, name: '量', nameTextStyle: { color: c.text, fontSize: 10 } },
      { scale: true, gridIndex: 2, axisLine: { lineStyle: { color: c.axisLine } }, axisLabel: { color: c.text, fontSize: 10 }, splitLine: { lineStyle: { color: c.splitLine } }, name: 'MACD', nameTextStyle: { color: c.text, fontSize: 10 } },
      { scale: true, gridIndex: 3, axisLine: { lineStyle: { color: c.axisLine } }, axisLabel: { color: c.text, fontSize: 10 }, splitLine: { lineStyle: { color: c.splitLine } }, name: 'KDJ', nameTextStyle: { color: c.text, fontSize: 10 } }
    ],
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1, 2, 3], start: 62, end: 100 },
      { type: 'slider', xAxisIndex: [0, 1, 2, 3], bottom: 0, height: 16, borderColor: c.axisLine, backgroundColor: 'rgba(128,128,128,0.05)', fillerColor: 'rgba(245,158,11,0.15)', textStyle: { color: c.text, fontSize: 10 } }
    ],
    series: [
      {
        name: '日K', type: 'candlestick', data: kline.map(k => [k.open, k.close, k.low, k.high]),
        itemStyle: { color: c.up, color0: c.down, borderColor: c.up, borderColor0: c.down },
        xAxisIndex: 0, yAxisIndex: 0
      },
      { name: 'MA5', type: 'line', data: ma(5), smooth: true, showSymbol: false, lineStyle: { width: 1, color: c.ma5 }, xAxisIndex: 0, yAxisIndex: 0 },
      { name: 'MA10', type: 'line', data: ma(10), smooth: true, showSymbol: false, lineStyle: { width: 1, color: c.ma10 }, xAxisIndex: 0, yAxisIndex: 0 },
      { name: 'MA20', type: 'line', data: ma(20), smooth: true, showSymbol: false, lineStyle: { width: 1, color: c.ma20 }, xAxisIndex: 0, yAxisIndex: 0 },
      { name: 'MA60', type: 'line', data: ma(60), smooth: true, showSymbol: false, lineStyle: { width: 1, color: c.ma60 }, xAxisIndex: 0, yAxisIndex: 0 },
      {
        name: '成交量', type: 'bar', data: vols, xAxisIndex: 1, yAxisIndex: 1,
        itemStyle: { color: p => volColors[p.dataIndex] }
      },
      {
        name: 'MACD', type: 'bar', data: hist, xAxisIndex: 2, yAxisIndex: 2,
        itemStyle: { color: p => histColors[p.dataIndex] }
      },
      { name: 'DIF', type: 'line', data: dif, showSymbol: false, lineStyle: { width: 1, color: '#f59e0b' }, xAxisIndex: 2, yAxisIndex: 2 },
      { name: 'DEA', type: 'line', data: dea, showSymbol: false, lineStyle: { width: 1, color: '#3b82f6' }, xAxisIndex: 2, yAxisIndex: 2 },
      { name: 'K', type: 'line', data: kdjArr.k, showSymbol: false, lineStyle: { width: 1, color: '#f59e0b' }, xAxisIndex: 3, yAxisIndex: 3 },
      { name: 'D', type: 'line', data: kdjArr.d, showSymbol: false, lineStyle: { width: 1, color: '#3b82f6' }, xAxisIndex: 3, yAxisIndex: 3 },
      { name: 'J', type: 'line', data: kdjArr.j, showSymbol: false, lineStyle: { width: 1, color: '#a855f7' }, xAxisIndex: 3, yAxisIndex: 3 }
    ]
  })
}

// ==================== 财务指标提取 ====================
const finMetrics = computed(() => {
  const d = detail.value?.details || []
  const find = (dimKey, name) => {
    const dim = d.find(x => x.key === dimKey)
    return dim?.subItems?.find(i => i.name === name)
  }
  const qRev = find('growth', '单季营收同比')
  const qProfit = find('growth', '单季净利同比')
  const aRev = find('growth', '营收累计同比')
  const aProfit = find('growth', '净利累计同比')
  const roe = find('quality', 'ROE(净资产收益率)')
  const gross = find('quality', '毛利率')
  const net = find('quality', '净利率')
  const ocf = find('quality', '经营现金流/净利润')
  const goodwill = find('quality', '商誉/净资产')
  const debt = find('risk', '资产负债率')
  const pe = find('valuation', 'PE(TTM)横截面分位')
  const pb = find('valuation', 'PB横截面分位')
  const div = find('valuation', '股息率')

  const list = [
    { name: 'ROE(净资产收益率)', value: roe?.value, positive: roe?.raw != null ? roe.raw >= 0 : null },
    { name: '毛利率', value: gross?.value, positive: gross?.raw != null ? gross.raw >= 0 : null },
    { name: '净利率', value: net?.value, positive: net?.raw != null ? net.raw >= 0 : null },
    { name: '经营现金流/净利润', value: ocf?.value, positive: ocf?.raw != null ? ocf.raw >= 0 : null },
    { name: '单季营收同比', value: qRev?.value, positive: qRev?.raw != null ? qRev.raw >= 0 : null },
    { name: '单季净利同比', value: qProfit?.value, positive: qProfit?.raw != null ? qProfit.raw >= 0 : null },
    { name: '营收累计同比', value: aRev?.value, positive: aRev?.raw != null ? aRev.raw >= 0 : null },
    { name: '净利累计同比', value: aProfit?.value, positive: aProfit?.raw != null ? aProfit.raw >= 0 : null },
    { name: '资产负债率', value: debt?.value, positive: null },
    { name: '商誉/净资产', value: goodwill?.value, positive: null },
    { name: 'PE(TTM)', value: pe?.value, positive: null },
    { name: 'PB', value: pb?.value, positive: null },
    { name: '股息率', value: div?.value, positive: null }
  ]
  return list.filter(x => x.value && x.value !== '数据缺失')
})

// ==================== 资金情绪 ====================
const fundFlow = computed(() => {
  const f = detail.value?.fundFlow || {}
  return {
    margin: (f.margin || []).map(r => ({ ...r, rzye: Number(r.rzye || 0), rzmre: Number(r.rzmre || 0) })),
    surveys: f.surveys || [],
    lhb: (f.lhb || []).map(r => ({ ...r, buy: Number(r.buy || 0), sell: Number(r.sell || 0) }))
  }
})

// ==================== 跳转 ====================
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ path: '/fund/stock-filter' })
}
function goGuide() {
  router.push({ name: 'stockRecommendGuide' })
}
function openEastMoney() {
  const code = detail.value?.basic?.code
  if (!code) return
  const sec = code.startsWith('6') ? 'sh' : (code.startsWith('0') || code.startsWith('3') ? 'sz' : 'bj')
  window.open(`https://quote.eastmoney.com/${sec}${code}.html`, '_blank')
}

// ==================== 格式化 ====================
function fmtNum(v, d = 2) {
  if (v == null || isNaN(v)) return '--'
  return Number(v).toFixed(d)
}
function fmtPct(v) {
  if (v == null || isNaN(v)) return '--'
  return (v > 0 ? '+' : '') + Number(v).toFixed(2) + '%'
}
function fmtYi(v) {
  if (v == null || isNaN(v)) return '--'
  return (Number(v) / 1e8).toFixed(2) + '亿'
}
function fmtWan(v) {
  if (v == null || isNaN(v)) return '--'
  return (Number(v) / 1e4).toFixed(1) + '万'
}
function formatTime(iso) {
  if (!iso) return '--'
  const d = new Date(iso)
  const p = n => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
function priceClass(v) {
  if (v == null) return ''
  return v > 0 ? 'up' : (v < 0 ? 'down' : '')
}
function scoreClass(s) {
  if (s >= 80) return 'sc-green'
  if (s >= 60) return 'sc-yellow'
  return 'sc-red'
}
function scoreTextClass(s) {
  if (s == null) return ''
  if (s >= 72) return 'sc-t-green'
  if (s >= 55) return 'sc-t-yellow'
  return 'sc-t-red'
}
function conclusionClass(c) {
  const map = {
    '重点关注': 'cc-hot', '可关注': 'cc-buy', '中性': 'cc-mid', '谨慎': 'cc-warn', '回避': 'cc-avoid'
  }
  return map[c] || 'cc-mid'
}
function riskColor(v, type) {
  if (v == null) return ''
  if (type === 'vol') return v > 60 ? 'warn' : (v > 30 ? '' : '')
  if (type === 'debt') return v > 70 ? 'warn' : ''
  if (type === 'goodwill') return v > 30 ? 'warn' : ''
  return ''
}

// ==================== 生命周期 ====================
function onResize() {
  radarChart?.resize()
  klineChart?.resize()
}

onMounted(async () => {
  loadConfig()
  await load()
  window.addEventListener('resize', onResize)
  // 监听夜间模式切换，重绘图表
  darkObserver = new MutationObserver(() => {
    if (detail.value) renderCharts()
  })
  darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
  stopStage()
  // 中止进行中的请求，避免路由切换后 pending 请求占用连接
  if (abortCtrl) { abortCtrl.abort(); abortCtrl = null }
  window.removeEventListener('resize', onResize)
  darkObserver?.disconnect()
  radarChart?.dispose()
  klineChart?.dispose()
  radarChart = null
  klineChart = null
})

watch(() => route.params.code, () => { load() })
</script>

<style scoped src="./stockRecommendDetail.scss"></style>

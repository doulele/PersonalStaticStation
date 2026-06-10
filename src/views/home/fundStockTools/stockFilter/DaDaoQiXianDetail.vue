<template>
  <div class="dadao-detail-page fade-in">
    <!-- 返回按钮 -->
    <div class="detail-back-bar">
      <el-button text @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回列表
      </el-button>
      <span class="back-title" v-if="stock">{{ stock.name }} · 大道七线股诊</span>
    </div>

    <!-- 加载骨架 -->
    <div v-if="loading && !stock" class="detail-loading">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="errorMsg" class="detail-error">
      <el-empty description="数据获取失败" :image-size="80">
        <template #description>
          <p class="error-desc">{{ errorMsg }}</p>
        </template>
        <el-button type="primary" @click="loadDetail">重新加载</el-button>
        <el-button @click="$router.back()">返回列表</el-button>
      </el-empty>
    </div>

    <!-- 空状态 - 提供搜索入口 -->
    <div v-else-if="!loading && !stock && !errorMsg" class="detail-empty">
      <el-empty description="请输入股票代码进行诊断" :image-size="100">
        <div class="empty-search">
          <el-input v-model="inputCode" placeholder="输入股票代码，如 000001" clearable size="large" @keyup.enter="goDiagnosis">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" size="large" @click="goDiagnosis" :disabled="!inputCode.trim()">开始诊断</el-button>
        </div>
        <p class="empty-hint">基于800日K线计算通子金叉/死叉、七线支撑压力、RSI、MACD、量价关系</p>
      </el-empty>
    </div>

    <!-- 详情内容 -->
    <div v-if="stock" class="detail-body">
      <!-- 股票概览 Hero -->
      <div class="detail-hero">
        <div class="hero-main">
          <div class="hero-left">
            <h1 class="hero-name">{{ stock.name }} <span class="hero-code">{{ stock.code }}</span></h1>
            <div class="hero-price-row">
              <span class="hero-price">¥{{ stock.close?.toFixed(2) }}</span>
              <span :class="stock.changePct > 0 ? 'price-up' : 'price-down'" class="hero-change">
                {{ stock.changePct > 0 ? '+' : '' }}{{ stock.changePct?.toFixed(2) }}%
              </span>
            </div>
          </div>
          <div class="hero-right">
            <div class="hero-score" :class="scoreLevelClass(stock.score)">
              <div class="score-num">{{ stock.score }}</div>
              <div class="score-level">{{ scoreLevelText(stock.score) }}</div>
            </div>
          </div>
        </div>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-label">换手率</span>
            <span class="stat-value">{{ stock.turnoverRate }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总市值</span>
            <span class="stat-value">{{ stock.totalMv }}亿</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">量比</span>
            <span class="stat-value" :class="{ 'price-up': stock.volRatioVal > 1.5 }">{{ stock.volRatio }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">支撑</span>
            <span class="stat-value price-up">{{ stock.support?.value || '--' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">阻力</span>
            <span class="stat-value price-down">{{ stock.resistance?.value || '--' }}</span>
          </div>
        </div>
        <!-- 快速诊断搜索 -->
        <div class="hero-diagnosis">
          <el-input v-model="inputCode" placeholder="换个股票试试" clearable size="small" @keyup.enter="goDiagnosis">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" size="small" @click="goDiagnosis" :disabled="!inputCode.trim()">诊断</el-button>
        </div>
      </div>

      <!-- 综合评估 -->
      <el-card class="detail-section-card" shadow="never">
        <div class="section-title">💡 综合评估</div>
        <div class="assessment-card" :class="'assessment-' + stock.assessmentLevel">
          <div class="assessment-score-row">
            <span class="assessment-score">{{ stock.score }}</span>
            <span class="assessment-label">{{ stock.assessmentLabel }}</span>
          </div>
          <div class="assessment-bar-bg">
            <div class="assessment-bar" :style="{ width: scoreBarWidth + '%' }" :class="'bar-' + stock.assessmentLevel"></div>
          </div>
          <div class="assessment-text">{{ stock.assessmentText }}</div>
        </div>
      </el-card>

      <!-- 关键信号 -->
      <el-card class="detail-section-card" shadow="never">
        <div class="section-title">🚦 关键信号</div>
        <div class="signal-tags">
          <el-tag v-if="stock.nearGoldenCross" type="success" effect="dark" size="small">⚡ 5日内金叉</el-tag>
          <el-tag v-if="stock.isGolden" type="success" effect="dark" size="small">🔥 通子金叉</el-tag>
          <el-tag v-if="stock.multiHair" type="success" size="small">🌟 多头排列</el-tag>
          <el-tag v-if="stock.macdAboveZero" type="warning" size="small">🔝 MACD零轴上方</el-tag>
          <el-tag v-if="stock.wuChenGolden" type="success" size="small">🔀 午辰金叉</el-tag>
          <el-tag v-if="stock.macdGolden" type="success" size="small">📍 MACD金叉</el-tag>
          <el-tag v-if="stock.priceAboveTong" type="success" size="small" effect="plain">💹 站上通线</el-tag>
          <el-tag v-if="stock.priceAboveWu" type="success" size="small" effect="plain">📈 站上午线</el-tag>
          <el-tag v-if="stock.priceAboveChen" type="success" size="small" effect="plain">🏔️ 站上辰线</el-tag>
          <el-tag v-if="stock.volumeSurge" type="warning" size="small">💧 放量</el-tag>
          <el-tag v-if="stock.shrinkPullback" type="info" size="small">📉 缩量回调</el-tag>
          <el-tag v-if="stock.isDead" type="danger" effect="dark" size="small">🧊 通子死叉</el-tag>
          <el-tag v-if="stock.macdDeath" type="danger" size="small">🔻 MACD死叉</el-tag>
          <el-tag v-if="stock.bearishAlignment" type="danger" size="small">⬇️ 空头排列</el-tag>
          <el-tag v-if="stock.rsiOversold" type="warning" size="small">⚡ RSI超卖</el-tag>
          <el-tag v-if="stock.rsiOverbought" type="danger" size="small">🔥 RSI超买</el-tag>
          <el-tag v-if="!hasAnySignal(stock)" type="info" size="small">无特殊信号</el-tag>
        </div>
      </el-card>

      <!-- 七线位置图 -->
      <el-card class="detail-section-card" shadow="never">
        <div class="section-title">🎯 七线位置图</div>
        <div class="ma-position-track">
          <template v-for="item in sortedMALines" :key="item.key">
            <div v-if="item.isPrice" class="track-row track-price-row">
              <span class="track-dot dot-price"></span>
              <span class="track-name name-price">当前价</span>
              <span class="track-val val-price">¥{{ item.value?.toFixed(2) }}</span>
            </div>
            <div v-else class="track-row" :class="item.isAbove ? 'track-resist' : 'track-suppt'">
              <span class="track-dot" :class="item.isAbove ? 'dot-resist' : 'dot-suppt'"></span>
              <span class="track-name">{{ item.shortName }}</span>
              <span class="track-val">{{ item.value.toFixed(2) }}</span>
              <span class="track-tag" :class="item.isAbove ? 'tag-resist' : 'tag-suppt'">{{ item.isAbove ? '阻力' : '支撑' }}</span>
            </div>
          </template>
        </div>
      </el-card>

      <!-- 七线详情 -->
      <el-card class="detail-section-card" shadow="never">
        <div class="section-title">📐 七线详情</div>
        <div class="ma-detail-table">
          <div class="ma-detail-header">
            <span class="ma-col-name">均线</span>
            <span class="ma-col-value">当前值</span>
            <span class="ma-col-dist">偏离</span>
            <span class="ma-col-slope">趋势</span>
            <span class="ma-col-pos">位置</span>
          </div>
          <div v-for="item in detailMALines" :key="item.key" class="ma-detail-row">
            <span class="ma-col-name">{{ item.name }}</span>
            <span class="ma-col-value">{{ item.value }}</span>
            <span class="ma-col-dist" :class="item.distVal > 0 ? 'price-up' : (item.distVal < 0 ? 'price-down' : '')">{{ item.dist }}</span>
            <span class="ma-col-slope" :class="item.slope === true ? 'slope-up' : (item.slope === false ? 'slope-down' : 'slope-flat')">{{ item.slope === true ? '↑' : (item.slope === false ? '↓' : '—') }}</span>
            <span class="ma-col-pos">
              <span v-if="item.above" class="pos-above">✅ 站上</span>
              <span v-else class="pos-below">❌ 跌破</span>
            </span>
          </div>
        </div>
      </el-card>

      <!-- 技术指标 -->
      <el-card class="detail-section-card" shadow="never">
        <div class="section-title">📉 技术指标</div>
        <!-- RSI -->
        <div class="indicator-block">
          <div class="indicator-label">RSI(14)</div>
          <div class="rsi-visual">
            <div class="rsi-bar-bg">
              <div class="rsi-zone-oversold"></div>
              <div class="rsi-zone-neutral"></div>
              <div class="rsi-zone-overbought"></div>
              <div class="rsi-fill" :style="{ width: stock.rsi + '%' }"></div>
              <div class="rsi-marker" :style="{ left: stock.rsi + '%' }"></div>
            </div>
            <div class="rsi-labels">
              <span>0</span><span>30</span><span>50</span><span>70</span><span>100</span>
            </div>
          </div>
          <div class="indicator-value">
            <span class="indicator-num" :class="{ 'rsi-overbought': stock.rsi > 70, 'rsi-oversold': stock.rsi < 30 }">{{ stock.rsi }}</span>
            <el-tag :type="stock.rsi > 70 ? 'danger' : (stock.rsi < 30 ? 'success' : 'info')" size="small">
              {{ stock.rsi > 70 ? '超买区' : (stock.rsi < 30 ? '超卖区' : (stock.rsi < 50 ? '弱势区' : '强势区')) }}
            </el-tag>
          </div>
        </div>
        <!-- MACD -->
        <div class="indicator-block">
          <div class="indicator-label">MACD(12,26,9)</div>
          <div class="macd-grid">
            <div class="macd-item">
              <span class="macd-key">DIFF</span>
              <span class="macd-val" :class="stock.macdDiffVal > 0 ? 'price-up' : 'price-down'">{{ stock.macdDiffVal?.toFixed(3) }}</span>
            </div>
            <div class="macd-item">
              <span class="macd-key">DEA</span>
              <span class="macd-val" :class="stock.macdDeaVal > 0 ? 'price-up' : 'price-down'">{{ stock.macdDeaVal?.toFixed(3) }}</span>
            </div>
            <div class="macd-item">
              <span class="macd-key">区域</span>
              <el-tag :type="stock.macdAboveZero ? 'success' : 'danger'" size="small">
                {{ stock.macdAboveZero ? '零轴上方' : '零轴下方' }}
              </el-tag>
            </div>
            <div class="macd-item">
              <span class="macd-key">信号</span>
              <el-tag v-if="stock.macdGolden" type="success" size="small">金叉</el-tag>
              <el-tag v-else-if="stock.macdDeath" type="danger" size="small">死叉</el-tag>
              <el-tag v-else-if="stock.macdBull" type="warning" size="small">多头</el-tag>
              <el-tag v-else type="info" size="small">空头</el-tag>
            </div>
          </div>
        </div>
        <!-- 量价 -->
        <div class="indicator-block">
          <div class="indicator-label">量价分析</div>
          <div class="vol-grid">
            <div class="vol-item">
              <span class="vol-key">今日成交量</span>
              <span class="vol-val">{{ stock.volToday }}</span>
            </div>
            <div class="vol-item">
              <span class="vol-key">20日均量</span>
              <span class="vol-val">{{ stock.volAvg20 }}</span>
            </div>
            <div class="vol-item">
              <span class="vol-key">量比</span>
              <span class="vol-val" :class="{ 'price-up': stock.volRatioVal > 1.5 }">{{ stock.volRatio }}</span>
            </div>
            <div class="vol-item">
              <span class="vol-key">信号</span>
              <el-tag v-if="stock.volumeSurge" type="warning" size="small">放量 📈</el-tag>
              <el-tag v-else-if="stock.shrinkPullback" type="info" size="small">缩量回调 📉</el-tag>
              <el-tag v-else type="info" size="small" effect="plain">正常</el-tag>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 涨跌趋势 -->
      <el-card class="detail-section-card" shadow="never">
        <div class="section-title">📈 涨跌趋势</div>
        <div class="trend-grid">
          <div class="trend-item">
            <div class="trend-label">5日</div>
            <div class="trend-value" :class="stock.pct5dVal > 0 ? 'price-up' : (stock.pct5dVal < 0 ? 'price-down' : '')">{{ stock.pct5d }}</div>
          </div>
          <div class="trend-item">
            <div class="trend-label">10日</div>
            <div class="trend-value" :class="stock.pct10dVal > 0 ? 'price-up' : (stock.pct10dVal < 0 ? 'price-down' : '')">{{ stock.pct10d }}</div>
          </div>
          <div class="trend-item">
            <div class="trend-label">20日</div>
            <div class="trend-value" :class="stock.pct20dVal > 0 ? 'price-up' : (stock.pct20dVal < 0 ? 'price-down' : '')">{{ stock.pct20d }}</div>
          </div>
          <div class="trend-item">
            <div class="trend-label">60日</div>
            <div class="trend-value" :class="stock.pct60dVal > 0 ? 'price-up' : (stock.pct60dVal < 0 ? 'price-down' : '')">{{ stock.pct60d }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 指标解释弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="450px" destroy-on-close class="metric-dialog">
      <div class="metric-dialog-body">
        <p><strong>📖 含义：</strong> {{ dialogDesc }}</p>
        <div class="suggestion"><strong>💡 操作建议：</strong> {{ dialogSuggestion }}</div>
      </div>
    </el-dialog>

    <!-- 底部 -->
    <div class="detail-footer">
      📐 大道七线参数: 通17 | 子26 | 午100 | 辰145 | 申320 | 卯455 | 亥732 &nbsp;|&nbsp;
      💡 补充指标: RSI(14)、MACD(12,26,9)、量价关系、涨跌趋势 &nbsp;|&nbsp; 数据来自东方财富/腾讯
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import {
  buildStockMetrics, fetchKline, fetchStockSnapshot,
  scoreLevelClass, scoreLevelText, hasAnySignal,
  METRIC_EXPLANATIONS
} from '@/utils/stockAnalysis'

const route = useRoute()
const router = useRouter()

// ==================== 状态 ====================
const loading = ref(false)
const errorMsg = ref('')
const stock = ref(null)
const inputCode = ref('')
let abortController = null

// 指标解释弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogDesc = ref('')
const dialogSuggestion = ref('')

function showMetricInfo(metricKey) {
  const data = METRIC_EXPLANATIONS[metricKey]
  if (!data) return
  dialogTitle.value = data.title
  dialogDesc.value = data.desc
  dialogSuggestion.value = data.suggestion
  dialogVisible.value = true
}

// ==================== 计算属性 ====================
const sortedMALines = computed(() => {
  const s = stock.value
  if (!s) return []
  const lines = [
    { key: 'tong', shortName: '通17', value: parseFloat(s.ma17) || 0 },
    { key: 'zi', shortName: '子26', value: parseFloat(s.ma26) || 0 },
    { key: 'wu', shortName: '午100', value: parseFloat(s.ma100) || 0 },
    { key: 'chen', shortName: '辰145', value: parseFloat(s.ma145) || 0 },
    { key: 'shen', shortName: '申320', value: parseFloat(s.ma320) || 0 },
    { key: 'mao', shortName: '卯455', value: parseFloat(s.ma455) || 0 },
    { key: 'hai', shortName: '亥732', value: parseFloat(s.ma732) || 0 },
  ].filter(l => l.value > 0).sort((a, b) => b.value - a.value)

  const price = s.close
  const result = []
  let priceInserted = false
  for (const line of lines) {
    if (!priceInserted && price > line.value) {
      result.push({ key: 'price', isPrice: true, value: price })
      priceInserted = true
    }
    result.push({ ...line, isAbove: price < line.value })
  }
  if (!priceInserted) {
    result.push({ key: 'price', isPrice: true, value: price })
  }
  return result
})

const detailMALines = computed(() => {
  const s = stock.value
  if (!s) return []
  return [
    { key: 'tong', name: '通线(MA17)', value: s.ma17, dist: s.distTong, distVal: s.distTongVal, slope: s.ma17Up, above: s.priceAboveTong },
    { key: 'zi', name: '子线(MA26)', value: s.ma26, dist: s.distZi, distVal: s.distZiVal, slope: s.ma26Up, above: s.priceAboveZi },
    { key: 'wu', name: '午线(MA100)', value: s.ma100, dist: s.distWu, distVal: s.distWuVal, slope: s.ma100Up, above: s.priceAboveWu },
    { key: 'chen', name: '辰线(MA145)', value: s.ma145, dist: s.distChen, distVal: s.distChenVal, slope: s.ma145Up, above: s.priceAboveChen },
    { key: 'shen', name: '申线(MA320)', value: s.ma320, dist: s.distShen, distVal: s.distShenVal, slope: s.ma320Up, above: s.priceAboveShen },
    { key: 'mao', name: '卯线(MA455)', value: s.ma455, dist: s.distMao, distVal: s.distMaoVal, slope: s.ma455Up, above: s.priceAboveMao },
    { key: 'hai', name: '亥线(MA732)', value: s.ma732, dist: s.distHai, distVal: s.distHaiVal, slope: s.ma732Up, above: !s.priceBelowHai },
  ]
})

const scoreBarWidth = computed(() => {
  const s = stock.value
  if (!s) return 50
  return Math.min(100, Math.max(0, (s.score + 7) / 22 * 100))
})

// ==================== 数据加载 ====================
async function loadDetail() {
  const code = route.query.code
  if (!code) return

  if (abortController) abortController.abort()
  abortController = new AbortController()
  loading.value = true
  errorMsg.value = ''

  try {
    const signal = abortController.signal
    const [klines, snapshot] = await Promise.all([
      fetchKline(code, 800, signal),
      fetchStockSnapshot(code, signal)
    ])
    stock.value = buildStockMetrics(snapshot, klines)
    document.title = `${stock.value.name} - 大道七线股诊 - ToolHub`
  } catch (err) {
    if (err.name === 'AbortError') { loading.value = false; return }
    console.error('股诊失败:', err)
    errorMsg.value = err.message || '数据获取失败'
  } finally {
    loading.value = false
  }
}

function goDiagnosis() {
  const code = inputCode.value.trim()
  if (!code) return
  // 如果当前已经在详情页，直接加载新数据
  if (route.query.code === code) {
    loadDetail()
  } else {
    router.push({ path: '/home/fund/dadao-detail', query: { code } })
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'instant' })
  const code = route.query.code
  if (code) {
    inputCode.value = code.replace(/^(sh|sz)/, '')
    loadDetail()
  }
})

// 监听路由变化（用户在详情页输入新代码后导航）
watch(() => route.query.code, (newCode) => {
  if (newCode) {
    inputCode.value = newCode.replace(/^(sh|sz)/, '')
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
  @import url('../style/stockFilter/daDaoQiXianDetail.scss');
</style>

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
          :title="h.holdingPeriod ? '建议持仓周期：' + h.holdingPeriod : ''"
          @click="changeHorizon(h.key)"
        >
          <span class="hb-label">{{ h.label }}</span>
          <span v-if="h.holdingPeriod" class="hb-period">{{ h.holdingPeriod }}</span>
        </button>
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

        <!-- 持仓信息条（有持仓时显示） -->
        <!-- <div v-if="positionData?.hasPosition" class="position-bar">
          <div class="pos-item">
            <span class="pos-label">持仓成本</span>
            <span class="pos-value">¥{{ positionData.avgCost.toFixed(3) }}</span>
          </div>
          <div class="pos-divider"></div>
          <div class="pos-item">
            <span class="pos-label">持仓股数</span>
            <span class="pos-value">{{ positionData.totalShares }}股</span>
          </div>
          <div class="pos-divider"></div>
          <div class="pos-item">
            <span class="pos-label">持仓盈亏</span>
            <span class="pos-value" :class="positionData.floatPnl >= 0 ? 'up' : 'down'">
              {{ positionData.floatPnl >= 0 ? '+' : '-' }}¥{{ fmtMoneyShort(Math.abs(positionData.floatPnl)) }}
            </span>
          </div>
          <div class="pos-divider"></div>
          <div class="pos-item">
            <span class="pos-label">盈亏比例</span>
            <span class="pos-value" :class="positionData.floatPnl >= 0 ? 'up' : 'down'">
              {{ positionData.floatPnl >= 0 ? '+' : '-' }}{{ Math.abs(positionData.floatPnlPct) }}%
            </span>
          </div>
        </div> -->
      </div>

      <!-- ============ 持仓操作建议（有持仓时显示） ============ -->
      <div v-if="positionAdvice" class="card pos-advice-card" :class="'pa-' + positionAdvice.level">
        <div class="pa-head">
          <div class="pa-title">
            <span class="pa-label">持仓操作建议</span>
            <span class="pa-action">{{ positionAdvice.actionText }}</span>
          </div>
          <div class="pa-summary">
            持有 {{ positionData.totalShares }} 股 · 成本 ¥{{ positionData.avgCost.toFixed(3) }}
            <span class="pa-pnl" :class="positionData.floatPnl >= 0 ? 'up' : 'down'">
              · {{ positionData.floatPnl >= 0 ? '+' : '' }}{{ positionData.floatPnlPct.toFixed(2) }}%
            </span>
          </div>
        </div>
        <div class="pa-reasons">
          <div v-for="(r, i) in positionAdvice.reasons" :key="i" class="pa-reason">
            <span class="pa-bullet" :class="'bl-' + positionAdvice.level"></span>{{ r }}
          </div>
        </div>
        <div v-if="positionAdvice.refs.length" class="pa-refs">
          <span v-for="(rf, i) in positionAdvice.refs" :key="'rf' + i" class="pa-ref">{{ rf }}</span>
        </div>
        <div class="pa-note">* 建议基于持仓盈亏与评分模型自动生成，仅供参考，不构成投资建议。</div>
      </div>

      <!-- ============ 关键价位：支撑 / 压力 / 止损止盈 ============ -->
      <div v-if="keyLevels" class="card levels-card">
        <h3 class="card-title">
          关键价位 · 支撑压力
          <span class="levels-note">均线 / 前高前低 / 枢轴 / 斐波那契 / ATR</span>
        </h3>
        <div class="levels-body">
          <div class="levels-main">
            <div class="lm-col res">
              <div class="lm-col-head res">压力位</div>
              <div
                v-for="(r, i) in keyLevels.resistances"
                :key="'r' + i"
                class="lm-item res"
                :class="{ nearest: i === 0 }"
              >
                <span class="lmi-tag">{{ r.label }}</span>
                <span class="lmi-price">¥{{ r.price.toFixed(3) }}</span>
                <span class="lmi-dist up">+{{ (((r.price - keyLevels.price) / keyLevels.price) * 100).toFixed(2) }}%</span>
              </div>
              <div v-if="!keyLevels.resistances.length" class="levels-empty">上方暂无有效压力位</div>
            </div>

            <div class="lm-current">
              <div class="lmc-chg" :class="priceClass(detail.basic.changePct)">{{ fmtPct(detail.basic.changePct) }}</div>
              <div class="lmc-price">{{ keyLevels.price.toFixed(3) }}</div>
              <div class="lmc-label">现价</div>
            </div>

            <div class="lm-col sup">
              <div class="lm-col-head sup">支撑位</div>
              <div
                v-for="(s, i) in keyLevels.supports"
                :key="'s' + i"
                class="lm-item sup"
                :class="{ nearest: i === 0 }"
              >
                <span class="lmi-tag">{{ s.label }}</span>
                <span class="lmi-price">¥{{ s.price.toFixed(3) }}</span>
                <span class="lmi-dist down">-{{ (((keyLevels.price - s.price) / keyLevels.price) * 100).toFixed(2) }}%</span>
              </div>
              <div v-if="!keyLevels.supports.length" class="levels-empty">下方暂无有效支撑位</div>
            </div>
          </div>

          <div v-if="keyLevels.tradeRef" class="levels-trade">
            <div class="lt-title">{{ keyLevels.tradeRef.title }}</div>
            <div class="lt-grid" :class="{ 'cols-4': keyLevels.tradeRef.items.length === 4 }">
              <div v-for="(t, i) in keyLevels.tradeRef.items" :key="'t' + i" class="lt-item" :class="t.cls">
                <span class="lt-name">{{ t.name }}</span>
                <span class="lt-price">¥{{ t.price.toFixed(3) }}</span>
                <span class="lt-diff" :class="t.cls">{{ t.diff >= 0 ? '+' : '' }}{{ t.diff.toFixed(2) }}%</span>
              </div>
            </div>
            <div class="lt-desc">{{ keyLevels.tradeRef.desc }}</div>
          </div>

          <div v-if="keyLevels.takeProfit" class="tp-plan">
            <div class="tp-head">
              <span class="tp-title">分批止盈计划 <small>基于持仓成本</small></span>
              <span class="tp-cost">成本 ¥{{ keyLevels.takeProfit.cost.toFixed(3) }}</span>
            </div>
            <div class="tp-grid">
              <div
                v-for="(t, i) in keyLevels.takeProfit.tiers"
                :key="'tp' + i"
                class="tp-item"
                :class="{ reached: t.reached, current: t.current }"
              >
                <div class="tpi-head">
                  <span class="tpi-pct">+{{ Math.round(t.pct * 100) }}%</span>
                  <span v-if="t.reached" class="tpi-status">已达成</span>
                  <span v-else-if="t.current" class="tpi-status">下一档</span>
                </div>
                <div class="tpi-price">¥{{ t.price.toFixed(3) }}</div>
                <div class="tpi-action">{{ t.action }}</div>
                <div class="tpi-dist" :class="t.dist >= 0 ? 'up' : 'down'">
                  {{ t.dist >= 0 ? '+' : '' }}{{ t.dist.toFixed(2) }}%
                  <small>距现价</small>
                </div>
              </div>
            </div>
            <div class="tp-desc">{{ keyLevels.takeProfit.desc }}</div>
          </div>

          <div class="levels-indics">
            <div class="li-item">
              <span class="li-name">ATR(14)</span>
              <span class="li-val">{{ keyLevels.indics.atr ? keyLevels.indics.atr.toFixed(3) + '（' + ((keyLevels.indics.atr / keyLevels.price) * 100).toFixed(2) + '%）' : '--' }}</span>
            </div>
            <div class="li-item">
              <span class="li-name">RSI(14)</span>
              <span class="li-val" :class="keyLevels.indics.rsiState.cls">{{ keyLevels.indics.rsi != null ? keyLevels.indics.rsi.toFixed(1) + '（' + keyLevels.indics.rsiState.text + '）' : '--' }}</span>
            </div>
            <div class="li-item">
              <span class="li-name">布林带</span>
              <span class="li-val" :class="keyLevels.indics.bollPos != null ? (keyLevels.indics.bollPos >= 50 ? 'up' : 'down') : ''">{{ keyLevels.indics.bollPos != null ? keyLevels.indics.bollPos.toFixed(0) + '%' : '--' }}</span>
            </div>
            <div class="li-item">
              <span class="li-name">量能</span>
              <span class="li-val" :class="keyLevels.indics.volRatio != null ? (keyLevels.indics.volRatio >= 1 ? 'up' : 'down') : ''">{{ keyLevels.indics.volRatio != null ? keyLevels.indics.volRatio.toFixed(2) + 'x' : '--' }}</span>
            </div>
          </div>
        </div>
        <div class="levels-note-bottom">* 参考区间非精确点位；止损/清仓/止盈基于 ATR 与关键位推算，仅供参考，不构成投资建议。</div>
      </div>

      <!-- ============ 我的持仓 ============ -->
      <PositionManager
        v-if="detail"
        :stock-code="detail.basic.code"
        :stock-name="detail.basic.name"
        :current-price="detail.basic.price"
      />

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
import PositionManager from './PositionManager.vue'
import { calcPosition } from '@/composables/usePosition.js'

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
  { key: 'short', label: '短线', holdingPeriod: '1~2周', desc: '技术面35% + 资金情绪30%，侧重量价与短线动量' },
  { key: 'mid', label: '中长线', holdingPeriod: '1~3个月', desc: '成长与盈利质量各25%，兼顾估值与技术' },
  { key: 'long', label: '长线', holdingPeriod: '6个月以上', desc: '估值+盈利质量合计60%，弱化短期波动' }
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
  // 周期切换后评分模型完全不同：清空旧周期数据，触发 loading 遮罩，避免旧结果误导
  detail.value = null
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

// ==================== 关键技术位 / 指标计算 ====================
function calcMA(kline, p) {
  if (!kline || kline.length < p) return null
  const seg = kline.slice(-p)
  return seg.reduce((s, k) => s + (k.close || 0), 0) / p
}

function calcATR(kline, p = 14) {
  if (!kline || kline.length < p + 1) return null
  const n = kline.length
  let sum = 0
  for (let i = n - p; i < n; i++) {
    const k = kline[i]
    const prev = kline[i - 1]
    const tr = Math.max(k.high - k.low, Math.abs(k.high - prev.close), Math.abs(k.low - prev.close))
    sum += tr
  }
  return sum / p
}

function calcBoll(kline, p = 20, mult = 2) {
  if (!kline || kline.length < p) return null
  const seg = kline.slice(-p)
  const mid = seg.reduce((s, k) => s + (k.close || 0), 0) / p
  const variance = seg.reduce((s, k) => s + (k.close - mid) ** 2, 0) / p
  const sd = Math.sqrt(variance)
  return { upper: mid + mult * sd, mid, lower: mid - mult * sd }
}

function calcRSI(closes, p = 14) {
  if (!closes || closes.length < p + 1) return null
  let gain = 0
  let loss = 0
  for (let i = closes.length - p; i < closes.length; i++) {
    const chg = closes[i] - closes[i - 1]
    if (chg >= 0) gain += chg
    else loss -= chg
  }
  if (gain + loss === 0) return 50
  return 100 * gain / (gain + loss)
}

function buildIndics(kline, price, atr, boll) {
  const closes = kline.map(k => k.close)
  const rsi = calcRSI(closes, 14)
  const vol5 = kline.slice(-5).reduce((s, k) => s + (k.volume || 0), 0) / 5
  const vol20 = kline.slice(-20).reduce((s, k) => s + (k.volume || 0), 0) / 20
  const volRatio = vol20 > 0 ? vol5 / vol20 : null
  let rsiState = { cls: '', text: '中性' }
  if (rsi != null) {
    if (rsi >= 70) rsiState = { cls: 'up', text: '超买' }
    else if (rsi <= 30) rsiState = { cls: 'down', text: '超卖' }
    else if (rsi >= 55) rsiState = { cls: 'up', text: '偏强' }
    else if (rsi <= 45) rsiState = { cls: 'down', text: '偏弱' }
  }
  const bollPos = boll && boll.upper > boll.lower
    ? Math.min(100, Math.max(0, ((price - boll.lower) / (boll.upper - boll.lower)) * 100))
    : null
  return { atr, rsi, rsiState, bollPos, volRatio, volSurge: volRatio != null && volRatio >= 1.5 }
}

// 分批止盈档位（按持仓周期调整）：涨幅 / 建议卖出动作
const TP_TIERS = {
  short: [
    { pct: 0.03, action: '卖出 1/3 锁利' },
    { pct: 0.06, action: '再卖 1/3' },
    { pct: 0.10, action: '清仓剩余' }
  ],
  mid: [
    { pct: 0.05, action: '卖出 1/3 锁利' },
    { pct: 0.10, action: '再卖 1/3' },
    { pct: 0.15, action: '清仓剩余' }
  ],
  long: [
    { pct: 0.08, action: '卖出 1/3 锁利' },
    { pct: 0.16, action: '再卖 1/3' },
    { pct: 0.25, action: '清仓剩余' }
  ]
}

/**
 * 分批止盈计划：基于持仓成本，按当前周期档位给出止盈价位与分批卖出建议
 */
function buildTakeProfit(cost, price) {
  const cfg = TP_TIERS[horizon.value] || TP_TIERS.mid
  const tiers = cfg.map(t => {
    const tp = cost * (1 + t.pct)
    return {
      pct: t.pct,
      price: +tp.toFixed(3),
      action: t.action,
      dist: ((tp - price) / price) * 100,
      reached: price >= tp - 0.005
    }
  })
  const reachedCount = tiers.filter(t => t.reached).length
  tiers.forEach((t, i) => { t.current = i === reachedCount })
  let desc
  if (reachedCount >= tiers.length) {
    desc = '所有止盈档位均已达到，建议按计划完成剩余分批兑现、锁定利润；若跌破持仓成本则回归止损纪律。'
  } else if (reachedCount > 0) {
    const next = tiers[reachedCount]
    desc = `已达成 ${reachedCount} 档止盈位，下一档 +${Math.round(next.pct * 100)}%（¥${next.price.toFixed(3)}），距现价 ${next.dist >= 0 ? '+' : ''}${next.dist.toFixed(2)}%，可继续按计划分批兑现。`
  } else {
    const next = tiers[0]
    desc = `当前距第一档止盈位（+${Math.round(next.pct * 100)}% · ¥${next.price.toFixed(3)}）${next.dist >= 0 ? '还有 ' + next.dist.toFixed(2) + '%' : '已不足 1%'}，触及后建议卖出 1/3 锁定利润，后续档位依次兑现。`
  }
  return { cost, tiers, reachedCount, desc }
}

/**
 * 计算关键价位：支撑 / 压力（各最多 3 档）+ 止损止盈参考 + 技术指标快照
 */
const keyLevels = computed(() => {
  const d = detail.value
  if (!d?.kline?.length || !d.basic?.price) return null
  const kline = d.kline
  const price = d.basic.price
  const last = kline[kline.length - 1]

  // ---- 候选价位收集 ----
  const cand = []
  const push = (v, label, type) => {
    if (v != null && isFinite(v) && v > 0) cand.push({ price: +v.toFixed(3), label, type })
  }

  ;[5, 10, 20, 60, 120].forEach(p => {
    const v = calcMA(kline, p)
    if (v != null) push(v, `MA${p}`, 'ma')
  })

  const seg20 = kline.slice(-20)
  const seg60 = kline.slice(-60)
  if (seg20.length) {
    push(Math.max(...seg20.map(k => k.high)), '20日高', 'pivot')
    push(Math.min(...seg20.map(k => k.low)), '20日低', 'pivot')
  }
  let h60 = null
  let l60 = null
  if (seg60.length) {
    h60 = Math.max(...seg60.map(k => k.high))
    l60 = Math.min(...seg60.map(k => k.low))
    push(h60, '60日高', 'pivot')
    push(l60, '60日低', 'pivot')
  }

  // 枢轴点（基于最近一根K线）
  const H = last.high
  const L = last.low
  const C = last.close
  const P = (H + L + C) / 3
  ;[
    { v: 2 * P - L, label: 'R1' },
    { v: P + (H - L), label: 'R2' },
    { v: H + 2 * (P - L), label: 'R3' },
    { v: 2 * P - H, label: 'S1' },
    { v: P - (H - L), label: 'S2' },
    { v: L - 2 * (H - P), label: 'S3' }
  ].forEach(x => push(x.v, x.label, 'pivot'))

  // 斐波那契回撤（近60日波段）
  if (h60 != null && l60 != null && h60 > l60) {
    const range = h60 - l60
    ;[0.236, 0.382, 0.5, 0.618].forEach(r => push(h60 - range * r, `Fib${(r * 100).toFixed(1)}`, 'fib'))
  }

  // 布林带
  const boll = calcBoll(kline)
  if (boll) {
    push(boll.upper, '布林上轨', 'boll')
    push(boll.lower, '布林下轨', 'boll')
  }

  // ---- 去重：价差 < 0.8% 视为同一价位，保留高优先级（ma > pivot > fib/boll） ----
  const rank = { ma: 3, pivot: 2, fib: 1, boll: 1 }
  const dedupe = arr => {
    const sorted = [...arr].sort((a, b) => a.price - b.price)
    const out = []
    for (const it of sorted) {
      const prev = out[out.length - 1]
      if (prev && (it.price - prev.price) / price < 0.008) {
        if ((rank[it.type] || 0) > (rank[prev.type] || 0)) out[out.length - 1] = it
        continue
      }
      out.push(it)
    }
    return out
  }

  // 支撑：现价下方从近到远最多 3 档；压力：现价上方从近到远最多 3 档
  const supports = dedupe(cand.filter(c => c.price < price - 0.005)).reverse().slice(0, 3)
  const resistances = dedupe(cand.filter(c => c.price > price + 0.005)).slice(0, 3)

  const atr = calcATR(kline)
  const indics = buildIndics(kline, price, atr, boll)
  const pos = positionData.value
  const hasPos = pos?.hasPosition
  const diffPct = p => (p - price) / price * 100
  let tradeRef = null
  let takeProfit = null

  if (hasPos) {
    const cost = pos.avgCost
    const atrStop = cost - Math.max((atr || 0) * 2, cost * 0.03)
    let stop = atrStop
    const nearSup = supports.length ? supports[supports.length - 1].price : null
    if (nearSup != null && nearSup < stop) stop = nearSup
    stop = Math.max(stop, price * 0.82) // 止损不宜离现价过远
    // 清仓价：在止损基础上再降 1×ATR，作为无条件清仓的最终底线
    let liquidate = stop - Math.max(atr || price * 0.02, price * 0.02)
    liquidate = Math.max(liquidate, price * 0.75) // 清仓底线保护，不低于现价 75%
    const atrW = Math.max(atr || price * 0.02, price * 0.02)
    const tp1 = resistances.length ? resistances[0].price : price + atrW * 2
    const tp2 = resistances[1] ? resistances[1].price : tp1 + atrW
    tradeRef = {
      title: '止损 / 清仓 / 止盈参考（基于持仓成本 + ATR 波动）',
      items: [
        { name: '参考止损', price: +stop.toFixed(3), diff: diffPct(stop), cls: 'down' },
        { name: '清仓价', price: +liquidate.toFixed(3), diff: diffPct(liquidate), cls: 'danger' },
        { name: '第一目标', price: +tp1.toFixed(3), diff: diffPct(tp1), cls: 'up' },
        { name: '第二目标', price: +tp2.toFixed(3), diff: diffPct(tp2), cls: 'up' }
      ],
      desc: `止损取「成本-2×ATR」与最近支撑位中的更低者${atr ? `（ATR≈¥${atr.toFixed(3)}，日均波幅 ${(atr / price * 100).toFixed(2)}%）` : ''}；清仓价为最终底线（止损再降 1×ATR）。跌破止损建议减仓离场，跌破清仓价无条件清仓；第一目标=最近压力位，第二目标=次近压力位，      触及可减仓 1/3~1/2 锁利。`
    }
    // 分批止盈计划：基于持仓成本，按周期档位给出止盈价位与分批卖出建议
    takeProfit = buildTakeProfit(cost, price)
  } else {
    const atrW = Math.max(atr || price * 0.03, price * 0.03)
    const buy1 = supports.length ? supports[0].price : price - atrW
    const buy2 = supports[1] ? supports[1].price : buy1 - atrW * 0.8
    const target = resistances.length ? resistances[0].price : price + atrW * 2
    tradeRef = {
      title: '买卖参考（当前未持仓）',
      items: [
        { name: '参考买点①', price: +buy1.toFixed(3), diff: diffPct(buy1), cls: 'down' },
        { name: '参考买点②', price: +buy2.toFixed(3), diff: diffPct(buy2), cls: 'down' },
        { name: '参考目标', price: +target.toFixed(3), diff: diffPct(target), cls: 'up' }
      ],
      desc: `买点取最近/次近支撑位，回踩企稳后可分批低吸；目标取最近压力位。不建议追高，若放量突破压力位则目标上移至下一档。`
    }
  }

  return { price, supports, resistances, atr, indics, tradeRef, takeProfit }
})

// ==================== 我的持仓 ====================
const positionData = computed(() => {
  const price = detail.value?.basic?.price
  return price ? calcPosition(detail.value.basic.code, price) : null
})

/**
 * 生成持仓操作建议（结合持仓盈亏 + 评分模型 + 关键价位/技术指标）
 * @returns {null | { action, actionText, level, reasons: string[], refs: string[] }}
 */
function buildPositionAdvice(pos, d, lv) {
  const reasons = []
  const refs = []
  const pnlPct = Number(pos.floatPnlPct) || 0
  const aboveMa60 = !!d.aboveMa60
  const total = Number(d.total) || 0
  const conclusion = d.conclusion || ''
  const bearish = total < 55 || conclusion === '谨慎' || conclusion === '回避'
  const price = Number(d.basic?.price || 0)

  // 最新 MA60 数值（参考点位）
  const kline = d.kline || []
  let ma60Val = null
  if (kline.length >= 60) {
    const last = kline.slice(-60)
    ma60Val = +(last.reduce((s, k) => s + (k.close || 0), 0) / 60).toFixed(3)
  }

  // 止损/清仓/止盈位参考
  const stopItem = lv?.tradeRef?.items.find(i => i.name === '参考止损')
  const liquidateItem = lv?.tradeRef?.items.find(i => i.name === '清仓价')
  const tpItems = (lv?.tradeRef?.items || []).filter(i => i.name && i.name.includes('目标'))

  // 技术指标快照
  const ind = lv?.indics
  const indBits = []
  if (ind?.rsi != null) indBits.push(`RSI ${ind.rsi.toFixed(1)}（${ind.rsiState.text}）`)
  if (ind?.bollPos != null) indBits.push(`布林带 ${ind.bollPos.toFixed(0)}% 分位`)
  if (ind?.volRatio != null) indBits.push(ind.volSurge ? `放量 ${ind.volRatio.toFixed(2)}x` : `量能 ${ind.volRatio.toFixed(2)}x`)

  let action = 'hold'
  let actionText = '继续持有'
  let level = 'success'

  // 基础理由
  reasons.push(`模型结论「${conclusion}」，综合评分 ${total} 分${d.vetoed ? '，但已触发风险否决' : ''}`)
  if (pnlPct >= 0) {
    reasons.push(`当前浮盈 ${pnlPct.toFixed(2)}%，持仓成本 ¥${Number(pos.avgCost).toFixed(3)}`)
  } else {
    reasons.push(`当前浮亏 ${Math.abs(pnlPct).toFixed(2)}%，持仓成本 ¥${Number(pos.avgCost).toFixed(3)}`)
  }
  if (ma60Val != null) {
    refs.push(`MA60 ¥${ma60Val}`)
    reasons.push(aboveMa60 ? '股价站上 MA60，中期趋势偏强' : '股价跌破 MA60，中期趋势偏弱')
  }
  if (stopItem) {
    refs.push(`止损 ¥${stopItem.price.toFixed(3)}`)
    const stopDist = price > 0 ? (price - stopItem.price) / price * 100 : 0
    if (pnlPct < 0 && stopDist < 5) reasons.push(`距参考止损位仅 ${Math.max(stopDist, 0).toFixed(1)}%，跌破建议严格止损`)
  }
  if (liquidateItem) {
    refs.push(`清仓 ¥${liquidateItem.price.toFixed(3)}`)
    const liqDist = price > 0 ? (price - liquidateItem.price) / price * 100 : 0
    if (liqDist < 6) reasons.push(`股价距清仓价仅 ${Math.max(liqDist, 0).toFixed(1)}%，跌破请无条件清仓离场`)
  }
  tpItems.forEach(tp => refs.push(`目标 ¥${tp.price.toFixed(3)}`))
  // 分批止盈计划（基于持仓成本）参考点位与进度提示
  const tpPlan = lv?.takeProfit
  if (tpPlan?.tiers?.length) {
    tpPlan.tiers.forEach(t => refs.push(`止盈${Math.round(t.pct * 100)}% ¥${t.price.toFixed(3)}`))
    if (tpPlan.reachedCount > 0) {
      reasons.push(`已到达 ${tpPlan.reachedCount} 档分批止盈位，可按计划逐步兑现利润`)
    }
    const nextTier = tpPlan.tiers[tpPlan.reachedCount]
    if (nextTier && !nextTier.reached && nextTier.dist < 3) {
      reasons.push(`距下一档止盈位（+${Math.round(nextTier.pct * 100)}%）仅 ${Math.max(nextTier.dist, 0).toFixed(1)}%，临近可按计划减仓`)
    }
  }
  if (ind?.atr) refs.push(`ATR ${ind.atr.toFixed(3)}`)
  if (indBits.length) reasons.push('技术信号：' + indBits.join(' · '))

  // 决策逻辑
  if (d.vetoed) {
    action = 'stop'
    actionText = '建议尽快离场'
    level = 'danger'
    reasons.unshift(`触发风险否决（${d.vetoReason}），模型结论强制为「回避」`)
  } else if (pnlPct <= -5 && bearish) {
    action = 'stop'
    actionText = '建议止损离场'
    level = 'danger'
    reasons.push('浮亏超 5% 且模型评分偏低，建议优先控制回撤')
  } else if (pnlPct <= -5 && !aboveMa60) {
    action = 'reduce'
    actionText = '建议减仓观望'
    level = 'warning'
    reasons.push('浮亏且跌破 MA60，建议先降低仓位，待企稳后再评估')
  } else if (pnlPct >= 0 && total >= 70) {
    action = 'hold'
    actionText = pnlPct > 30 ? '持有并分批止盈' : '继续持有'
    level = 'success'
    if (pnlPct > 30) reasons.push('浮盈较大（>30%），可分批止盈锁定部分利润')
    else reasons.push('评分较高且方向正向，可继续持有')
  } else if (pnlPct >= 0 && bearish) {
    action = 'reduce'
    actionText = '逢高减仓'
    level = 'warning'
    reasons.push('虽处浮盈，但模型信号已转弱，可逢高减仓锁定利润')
  } else {
    action = 'hold'
    actionText = '继续持有观察'
    level = 'success'
    reasons.push(pnlPct < 0 ? '浮亏幅度有限，可继续持有观察，并提前设置好止损位' : '模型方向尚可，可继续持有')
  }

  // 目标位互动：股价接近第一目标位 → 提示分批止盈
  if (tpItems.length && price > 0 && price >= tpItems[0].price * 0.99) {
    reasons.push('股价已接近第一目标位，可考虑分批止盈、落袋为安')
  }

  refs.unshift(`成本 ¥${Number(pos.avgCost).toFixed(3)}`)
  refs.push(`现价 ¥${price.toFixed(3)}`)
  return { action, actionText, level, reasons, refs }
}

const positionAdvice = computed(() => {
  const d = detail.value
  const pos = positionData.value
  if (!d || !pos?.hasPosition) return null
  return buildPositionAdvice(pos, d, keyLevels.value)
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
function fmtMoneyShort(absV) {
  if (absV == null || isNaN(absV)) return '--'
  if (absV >= 1e8) return (absV / 1e8).toFixed(2) + '亿'
  if (absV >= 1e4) return (absV / 1e4).toFixed(2) + '万'
  return absV.toFixed(2)
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

<template>
  <div class="normal-panel">
    <!-- ============ 顶部工具条：周期切换 + 搜索 + 操作 ============ -->
    <div class="panel-toolbar">
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
      <div class="search-wrap">
        <input
          v-model="keyword"
          class="search-input"
          type="text"
          placeholder="评测股票代码 / 名称"
          @input="onKeywordInput"
          @focus="onKeywordFocus"
          @keydown.enter="submitSearch"
        />
        <div v-if="suggestions.length" class="search-dropdown">
          <div
            v-for="s in suggestions"
            :key="s.code"
            class="search-item"
            @mousedown.prevent="goDetail(s.code)"
          >
            <span class="s-code">{{ s.code }}</span>
            <span class="s-name">{{ s.name }}</span>
            <span class="s-industry">{{ s.industry }}</span>
          </div>
        </div>
      </div>
      <div class="toolbar-actions">
        <button class="guide-link" @click="goGuide">
          <span class="guide-icon">?</span>评分说明
        </button>
        <span class="action-divider"></span>
        <button class="tool-btn refresh" :disabled="loading" @click="refresh">
          <span class="refresh-icon" :class="{ spinning: loading }">↻</span>刷新
        </button>
      </div>
    </div>

    <!-- 周期说明 + 权重分布 -->
    <div class="horizon-meta" v-if="currentHorizon">
      <span class="hm-desc">{{ currentHorizon.desc }}</span>
      <span class="hm-sep">·</span>
      <span class="hm-weights">
        <span v-for="(w, k) in currentHorizon.dimWeights" :key="k" class="weight-chip" :class="'w-' + k">
          {{ DIM_LABEL[k] }} {{ w }}%
        </span>
      </span>
    </div>

    <!-- ============ 分组筛选 ============ -->
    <div class="filter-panel" :class="{ collapsed: !showFilters }">
      <div class="filter-head">
        <span class="filter-head-title">筛选条件</span>
        <span class="filter-count" v-if="activeFilterCount">{{ activeFilterCount }} 项生效</span>
        <button class="filter-toggle" @click="showFilters = !showFilters">
          {{ showFilters ? '收起' : '展开' }}
        </button>
      </div>
      <div class="filter-groups" v-show="showFilters">
        <div v-for="g in filterGroups" :key="g.key" class="filter-group" :class="{ 'grid2': g.grid2 }">
          <div class="fg-title">
            {{ g.title }}
            <el-popover
              v-if="getGroupExplain(g)"
              placement="top"
              :width="360"
              trigger="click"
              popper-class="filter-explain-popper"
            >
              <template #reference>
                <span class="fg-help" @click.stop>?</span>
              </template>
              <div class="explain-content">
                <div class="explain-title">{{ g.title }}</div>
                <div class="explain-summary">{{ getGroupExplain(g).summary }}</div>
                <div class="explain-items">
                  <div v-for="(it, i) in getGroupExplain(g).items" :key="i" class="explain-item">
                    <span class="explain-item-name">{{ it[0] }}</span>
                    <span class="explain-item-text">{{ it[1] }}</span>
                  </div>
                </div>
                <div class="explain-tips">{{ getGroupExplain(g).tips }}</div>
              </div>
            </el-popover>
          </div>
          <div class="fg-body">
            <div v-for="item in g.items" :key="item.key" class="fg-item" :class="{ 'switch-item': item.type === 'switch' }">
              <label class="fg-label" :title="getExplain(item) || item.label">{{ item.label }}</label>
              <template v-if="item.type === 'range'">
                <input
                  v-model.number="filters[item.minKey]"
                  class="fg-input"
                  type="number"
                  :placeholder="item.placeholderMin"
                />
                <span class="fg-sep">~</span>
                <input
                  v-model.number="filters[item.maxKey]"
                  class="fg-input"
                  type="number"
                  :placeholder="item.placeholderMax"
                />
              </template>
              <template v-else-if="item.type === 'single'">
                <input
                  v-model.number="filters[item.key]"
                  class="fg-input full"
                  type="number"
                  :placeholder="item.placeholder"
                />
              </template>
              <template v-else-if="item.type === 'select'">
                <select class="fg-select" v-model="filters[item.key]">
                  <option v-for="opt in item.options" :key="String(opt.value)" :value="opt.value">{{ opt.label }}</option>
                </select>
              </template>
              <template v-else-if="item.type === 'switch'">
                <label class="switch">
                  <input type="checkbox" v-model="filters[item.key]" :true-value="true" :false-value="null" />
                  <span class="switch-slider"></span>
                </label>
              </template>
            </div>
          </div>
        </div>
      </div>
      <div class="filter-actions" v-show="showFilters">
        <button class="primary-btn" :disabled="loading" @click="applyFilters">应用筛选</button>
        <button class="ghost-btn" @click="resetFilters">重置</button>
      </div>
    </div>

    <!-- ============ 行业评分排名 ============ -->
    <div v-if="industryRank.length" class="rank-panel">
      <div class="rank-header">
        <span class="rank-title">行业评分排名 <small>（{{ horizonLabel }} · 按行业平均分）</small></span>
        <span class="rank-note">点击行业可快速筛选</span>
        <button class="rank-toggle" @click="showRank = !showRank">
          {{ showRank ? '收起 ' : '展开' }}
        </button>
      </div>
      <div class="rank-list" v-show="showRank">
        <div
          v-for="(r, i) in industryRank.slice(0, 10)"
          :key="r.industry"
          class="rank-item"
          :class="{ active: filters.industry === r.industry }"
          @click="toggleIndustry(r.industry)"
        >
          <span class="rank-no" :class="{ top3: i < 3 }">{{ i + 1 }}</span>
          <span class="rank-name" :title="r.industry">{{ r.industry }}</span>
          <div class="rank-bar">
            <div class="rank-bar-fill" :style="{ width: rankBarWidth(r) + '%' }"></div>
          </div>
          <span class="rank-score">{{ r.avgScore }}</span>
          <span class="rank-top" :title="r.top.name">{{ r.top.name }} {{ r.top.score }}分</span>
          <span class="rank-count">{{ r.count }}只</span>
        </div>
      </div>
    </div>

    <!-- ============ 评分表格 ============ -->
    <div class="table-panel">
      <div class="table-head-info">
        <span>共 <b>{{ total }}</b> 只 · 评分池 {{ meta?.poolSize ?? '--' }} 只 · 更新 {{ meta?.updateTime ? formatTime(meta.updateTime) : '--' }}</span>
        <span class="score-tip" title="综合评分为评分池内相对排名分（35~93 区间），分数仅反映在本池内的相对强弱，低分不代表股票基本面差">ⓘ 分数为池内相对排名</span>
        <span v-if="loading" class="loading-text">⏳ 正在加载，请稍候…</span>
        <span v-else-if="errorMsg" class="error-text">⚠️ {{ errorMsg }}</span>
        <span v-else-if="meta?.stage === 'base'" class="base-stage-text">⏳ 基础行情已就绪，完整评分构建中，将自动刷新…</span>
      </div>

      <!-- 首次加载：明显的全屏 loading 遮罩（新流程下基础列表秒级返回，此遮罩仅在快照未就绪时出现） -->
      <div v-if="loading && !rows.length" class="list-loading-mask">
        <div class="llm-inner">
          <div class="llm-spinner"></div>
          <div class="llm-title">正在拉取全市场行情</div>
          <div class="llm-desc">首次进入需获取约 5500 只股票快照并计算基础评分，通常数十秒</div>
          <div class="llm-stage">
            <span class="llm-item" :class="{ done: loadStage >= 1 }">① 全市场快照</span>
            <span class="llm-arrow">→</span>
            <span class="llm-item" :class="{ done: loadStage >= 2 }">② 基础评分排序</span>
            <span class="llm-arrow">→</span>
            <span class="llm-item" :class="{ done: loadStage >= 3 }">③ 补财务 + K线</span>
            <span class="llm-arrow">→</span>
            <span class="llm-item" :class="{ done: loadStage >= 4 }">④ 六维评分</span>
          </div>
          <div class="llm-tip">基础列表就绪后即可浏览，完整评分将在后台自动更新</div>
        </div>
      </div>

      <div class="table-wrap">
        <table class="score-table">
          <thead>
            <tr>
              <th class="th-code">代码 / 名称</th>
              <th>行业</th>
              <th :class="['th-sort', { disabled: loading }]" @click="toggleSort('score')">综合评分 {{ sortIcon('score') }}</th>
              <th :class="['th-sort', { disabled: loading }]" @click="toggleSort('star')">星级 {{ sortIcon('star') }}</th>
              <th :class="['th-sort', { disabled: loading }]" @click="toggleSort('conclusion')">推荐结论 {{ sortIcon('conclusion') }}</th>
              <th>风险</th>
              <th :class="['th-sort', { disabled: loading }]" @click="toggleSort('price')">最新价 {{ sortIcon('price') }}</th>
              <th :class="['th-sort', { disabled: loading }]" @click="toggleSort('changePct')">涨跌幅 {{ sortIcon('changePct') }}</th>
              <th>PE / PB / ROE</th>
              <th class="th-reason">核心推荐理由</th>
              <th class="th-op">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.code" class="data-row" @click="goDetail(row.code)">
              <td class="td-code">
                <div class="stock-name">{{ row.name }}</div>
                <div class="stock-code">{{ row.code }}</div>
                <span v-if="row.board" class="board-tag" :class="'bd-' + row.board">{{ boardLabel(row.board) }}</span>
              </td>
              <td class="td-industry" :title="row.industry">{{ row.industry }}</td>
              <td><span class="score-badge" :class="scoreClass(row.score)">{{ row.score }}</span></td>
              <td><span class="stars"><span class="star-full">{{ '★'.repeat(row.star) }}</span><span class="star-empty">{{ '★'.repeat(5 - row.star) }}</span></span></td>
              <td><span class="conclusion-tag" :class="conclusionClass(row.conclusion)">{{ row.conclusion }}</span></td>
              <td><span class="risk-tag" :class="'risk-' + row.riskLevel">{{ row.riskLevel }}</span></td>
              <td class="td-price">{{ fmtNum(row.price, 2) }}</td>
              <td :class="changeClass(row.changePct)">{{ fmtPct(row.changePct) }}</td>
              <td class="td-metrics">
                <span>PE {{ fmtNum(row.peTtm, 1) }}</span>
                <span>PB {{ fmtNum(row.pb, 2) }}</span>
                <span>ROE {{ row.roe != null ? row.roe.toFixed(1) + '%' : '--' }}</span>
              </td>
              <td class="td-reason" :title="row.reasonShort">{{ row.reasonShort }}</td>
              <td class="td-op" @click.stop>
                <button class="op-btn" @click="goDetail(row.code)">详情</button>
                <button class="op-btn link" @click="openEastMoney(row.code)">东财</button>
              </td>
            </tr>
            <tr v-if="!rows.length && !loading">
              <td colspan="11" class="empty-cell">暂无符合条件的股票，请调整筛选条件</td>
            </tr>
            <tr v-if="loading && !rows.length">
              <td colspan="11" class="empty-cell loading-cell">⏳ 正在构建评分池，首次约需 1~2 分钟…</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ============ 移动端排序工具条 ============ -->
      <div class="mobile-sort-bar">
        <button
          v-for="s in sortOptions"
          :key="s.key"
          class="msort-btn"
          :class="{ active: sortBy === s.key }"
          :disabled="loading"
          @click="toggleSort(s.key)"
        >
          {{ s.label }} {{ sortIcon(s.key) }}
        </button>
      </div>

      <!-- ============ 移动端卡片列表 ============ -->
      <div class="mobile-card-list">
        <div
          v-for="row in rows"
          :key="row.code"
          class="mobile-stock-card"
          @click="goDetail(row.code)"
        >
          <div class="msc-top">
            <div class="msc-name-box">
              <span class="msc-name">{{ row.name }}</span>
              <span class="msc-code">{{ row.code }}</span>
              <span v-if="row.board" class="board-tag" :class="'bd-' + row.board">{{ boardLabel(row.board) }}</span>
            </div>
            <span class="score-badge" :class="scoreClass(row.score)">{{ row.score }}</span>
          </div>
          <div class="msc-tags">
            <span class="conclusion-tag" :class="conclusionClass(row.conclusion)">{{ row.conclusion }}</span>
            <span class="risk-tag" :class="'risk-' + row.riskLevel">{{ row.riskLevel }}风险</span>
            <span class="msc-star"><span class="star-full">{{ '★'.repeat(row.star) }}</span><span class="star-empty">{{ '★'.repeat(5 - row.star) }}</span></span>
          </div>
          <div class="msc-metrics">
            <div class="msc-m">
              <span class="msc-ml">最新价</span>
              <span class="msc-mv">{{ fmtNum(row.price, 2) }}</span>
            </div>
            <div class="msc-m">
              <span class="msc-ml">涨跌幅</span>
              <span class="msc-mv" :class="changeClass(row.changePct)">{{ fmtPct(row.changePct) }}</span>
            </div>
            <div class="msc-m">
              <span class="msc-ml">PE</span>
              <span class="msc-mv">{{ fmtNum(row.peTtm, 1) }}</span>
            </div>
            <div class="msc-m">
              <span class="msc-ml">PB</span>
              <span class="msc-mv">{{ fmtNum(row.pb, 2) }}</span>
            </div>
            <div class="msc-m">
              <span class="msc-ml">ROE</span>
              <span class="msc-mv">{{ row.roe != null ? row.roe.toFixed(1) + '%' : '--' }}</span>
            </div>
          </div>
          <div class="msc-reason">{{ row.reasonShort }}</div>
          <div class="msc-footer">
            <span class="msc-industry">{{ row.industry }}</span>
            <button class="op-btn link" @click.stop="openEastMoney(row.code)">东财</button>
            <button class="op-btn" @click.stop="goDetail(row.code)">详情</button>
          </div>
        </div>
        <div v-if="!rows.length && !loading" class="empty-cell">暂无符合条件的股票，请调整筛选条件</div>
        <div v-if="loading && !rows.length" class="empty-cell loading-cell">⏳ 正在构建评分池，首次约需 1~2 分钟…</div>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <button class="page-btn" :disabled="loading || page <= 1" @click="goPage(page - 1)">‹ 上一页</button>
        <span class="page-info">第 {{ page }} / {{ totalPages }} 页</span>
        <button class="page-btn" :disabled="loading || page >= totalPages" @click="goPage(page + 1)">下一页 ›</button>
        <select v-model="pageSize" class="page-size" :disabled="loading" @change="onPageSizeChange">
          <option :value="20">20 / 页</option>
          <option :value="50">50 / 页</option>
          <option :value="100">100 / 页</option>
        </select>
      </div>

      <!-- 切换分页/排序/筛选时的加载遮罩（已有数据时显示，阻断所有交互） -->
      <div v-if="loading && rows.length" class="list-updating-mask">
        <div class="lum-inner">
          <div class="llm-spinner"></div>
          <div class="lum-title">加载中，请稍候…</div>
        </div>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="disclaimer">
      ⚠️ 数据来源：东方财富 / 腾讯行情，实时计算。本评分模型为多因子量化工具，仅用于技术研究，不构成任何投资建议。评分基于历史数据，历史业绩不代表未来表现，市场有风险，投资需谨慎。
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import {
  getStockList, searchStocks, getIndustries, getIndustryRanking, getHorizonConfig
} from '@/api/stockRecommend'

const router = useRouter()

const DIM_LABEL = { valuation: '估值', growth: '成长', quality: '质量', technical: '技术', sentiment: '资金', risk: '风险' }

const CONCLUSION_OPTIONS = [
  { label: '全部结论', value: '' },
  { label: '重点关注', value: '重点关注' },
  { label: '可关注', value: '可关注' },
  { label: '中性', value: '中性' },
  { label: '谨慎', value: '谨慎' },
  { label: '回避', value: '回避' }
]
const RISK_OPTIONS = [
  { label: '全部风险', value: '' },
  { label: '低', value: '低' },
  { label: '中', value: '中' },
  { label: '高', value: '高' }
]

const horizon = ref('short')

// 默认周期配置（接口失败时兜底，保证周期按钮可用）
const DEFAULT_HORIZONS = [
  { key: 'short', label: '短线', holdingPeriod: '1~2周', desc: '技术面权重35%，资金情绪权重30%，侧重量价与短线动量' },
  { key: 'mid', label: '中长线', holdingPeriod: '1~3个月', desc: '成长与盈利质量权重各25%，兼顾估值与技术' },
  { key: 'long', label: '长线', holdingPeriod: '6个月以上', desc: '估值与盈利质量合计权重60%，弱化短期波动' }
]

const horizons = ref([...DEFAULT_HORIZONS])
const currentHorizon = computed(() => horizons.value.find(h => h.key === horizon.value))
const horizonLabel = computed(() => currentHorizon.value?.label || '短线')

const keyword = ref('')
const suggestions = ref([])
const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const errorMsg = ref('')
const meta = ref(null)
const industryRank = ref([])
const industries = ref([])
const sortBy = ref('score')
const sortOrder = ref('desc')
// 可排序字段（PC 表头 + 移动端排序按钮共用）
const sortOptions = [
  { key: 'score', label: '综合评分' },
  { key: 'star', label: '星级' },
  { key: 'conclusion', label: '推荐结论' },
  { key: 'price', label: '最新价' },
  { key: 'changePct', label: '涨跌幅' }
]
const searchTimer = ref(null)
const loadStage = ref(0) // 首次加载阶段进度
let searchSeq = 0
let loadStageTimer = null
let abortCtrl = null
// 完整评分池轮询（meta.stage==='base' 时静默刷新，直到完整池就绪）
// 完整池构建需数分钟（300 只补 F10+K线），轮询上限放宽到 4 分钟，避免过早放弃导致
// 列表永远停留在「基础分」，与详情页六维分对不上。
let pollTimer = null
let pollCount = 0
const POLL_INTERVAL = 8000
const POLL_MAX = 30
// 周期/行业切换防抖计时器
let loadTimer = null

// 筛选面板折叠状态（移动端默认收起）
const showFilters = ref(typeof window !== 'undefined' ? window.innerWidth > 640 : true)
// 行业评分排名折叠状态（默认展开）
const showRank = ref(true)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

// 已生效的筛选条件数量
const activeFilterCount = computed(() => {
  const f = filters.value
  let n = 0
  Object.entries(f).forEach(([k, v]) => {
    if (k.startsWith('board')) return // 板块是默认状态，不计入"生效项"
    if (v === '' || v === null || v === undefined) return
    // 忽略行业为空字符串，其它有值即算生效
    n++
  })
  return n
})

// ==================== 筛选条件 ====================
const filters = ref({
  // 市场板块多选（默认：沪市主板 + 深市主板，创业板/科创板需权限默认不选）
  boardShMain: true,
  boardSzMain: true,
  boardChinext: null,
  boardStar: null,
  industry: '',
  minPe: null, maxPe: null,
  minPb: null, maxPb: null,
  minDividend: null, maxDividend: null,
  minRevenueGrowth: null, maxRevenueGrowth: null,
  minProfitGrowth: null, maxProfitGrowth: null,
  minQRevGrowth: null, maxQRevGrowth: null,
  minQProfitGrowth: null, maxQProfitGrowth: null,
  minRoe: null, maxRoe: null,
  minGrossMargin: null, maxGrossMargin: null,
  minNetMargin: null, maxNetMargin: null,
  minOcfRatio: null,
  maxGoodwillRatio: null,
  maxDebtRatio: null,
  maxVolatility20: null,
  isAboveMa60: null,
  techBullAlign: null,
  techMacdGolden: null,
  techKdjGolden: null,
  techKdjOversold: null,
  techBreakHigh20: null,
  minTechScore: null, maxTechScore: null,
  minTurnoverRate: null, maxTurnoverRate: null,
  minVolumeRatio: null, maxVolumeRatio: null,
  minChg5d: null, maxChg5d: null,
  minMarketCap: null, maxMarketCap: null,
  riskLevel: '',
  minScore: null, maxScore: null,
  conclusion: ''
})

// 筛选指标详细解释（点击「?」展示）
const EXPLAIN = {
  pe: '市盈率(TTM)，股价 ÷ 过去12个月每股收益。数值越低通常越便宜，但需结合成长性看（高成长股 PE 高属正常）。',
  pb: '市净率，股价 ÷ 每股净资产。适用于银行、周期股等重资产行业，越低越接近净资产价值。',
  div: '股息率，每股分红 ÷ 股价。反映持有股票的现金回报，高股息通常代表稳定分红能力。',
  rev: '营业收入累计同比增长率，反映公司营收规模扩张速度，同比更能剔除季节性因素。',
  profit: '净利润累计同比增长率，反映公司赚钱能力的提升速度，是成长性的核心指标。',
  qRev: '单季度营业收入同比增速，比累计值更能捕捉最新一季的经营变化趋势。',
  qProfit: '单季度净利润同比增速，反映最近一个季度盈利能力的边际变化。',
  roe: '净资产收益率，净利润 ÷ 净资产，衡量股东资金的使用效率。连续多年 ROE>15% 通常视为优质公司。',
  gross: '毛利率，(营收-营业成本) ÷ 营收。反映产品或服务的定价能力与成本控制水平。',
  net: '净利率，净利润 ÷ 营收。反映公司把收入转化为利润的效率，越高盈利质量越好。',
  ocf: '经营现金流净额 ÷ 净利润。大于1说明利润有真金白银支撑，远小于1可能利润含水分。',
  goodwill: '商誉占净资产比例。商誉过高存在减值风险，超过50%会触发评分风险否决。',
  ma60: '股价是否站在60日均线上方。站上MA60通常视为中期趋势走强，跌破则偏弱。',
  bull: '均线多头排列，即 MA5 > MA10 > MA20，短期均线在上、长期在下，代表上升趋势结构。',
  macd: 'MACD金叉，DIF线上穿DEA线，通常视为短期买入信号，出现在低位时信号更可靠。',
  kdj: 'KDJ金叉，K线上穿D线，短线转强信号。KDJ(9,3,3)是常用摆动指标，对短线敏感。',
  kdjLow: 'KDJ超卖，K值与D值均低于20，表明短线超跌，可能出现反弹机会。',
  break: '突破20日高点，股价创近20个交易日新高，代表多头力量强势突破。',
  techScore: '技术面维度评分（0~100），综合均线、动量、MACD、KDJ、波动、量能等子指标加权计算。',
  turn: '换手率，当日成交量 ÷ 流通股本。反映股票交易活跃度，过高可能过热，过低流动性差。',
  volRatio: '量比，近5日均量 ÷ 近20日均量。>1 表示近期放量，反映资金关注度上升。',
  chg5d: '近5个交易日累计涨跌幅，反映短线动能，过大可能短期过热。',
  cap: '总市值，股价 × 总股本。大盘股更稳健，小盘股波动大但成长空间可能更高。',
  risk: '风险等级，由资产负债率、波动率、回撤、商誉等风险指标综合判定，分为低/中/高三档。',
  debt: '资产负债率，总负债 ÷ 总资产。过高财务风险大，超过100%触发评分风险否决。',
  vol20: '20日年化波动率，反映股价波动剧烈程度，数值越高风险越大。',
  score: '综合评分（0~100），六维加权计算并经区间拉伸。≥80绿、60~79黄、<60红。',
  conclusion: '推荐结论，由综合评分与风险等级映射：重点关注/可关注/中性/谨慎/回避。',
  ind: '所属东财行业，按行业筛选后仅保留该行业股票进入评分池。'
}

function getExplain(item) {
  return EXPLAIN[item.key] || ''
}

// 分组标题解释（点击分组标题旁的「?」展示）
const GROUP_EXPLAIN = {
  valuation: {
    summary: '估值衡量"股价贵不贵"，是价值投资的起点。核心思路：用越低的价格买到越好的资产越划算。',
    items: [
      ['PE(TTM)', '市盈率 = 股价 ÷ 过去12个月每股收益。越低代表回本越快，但高成长股 PE 天然偏高，需结合增速判断。'],
      ['PB', '市净率 = 股价 ÷ 每股净资产。低于1意为"破净"，常用于银行、地产、周期股等重资产行业估值。'],
      ['股息率', '每股分红 ÷ 股价。反映持股的现金回报，高股息股通常业绩稳定、现金流充沛。']
    ],
    tips: '建议：低估≠便宜，还需排除"价值陷阱"（业绩持续下滑导致的低 PE）。可配合成长、盈利质量维度综合筛选。'
  },
  growth: {
    summary: '成长性衡量"公司业绩增长有多快"，成长股的核心是业绩的持续扩张能力。',
    items: [
      ['营收同比', '营业收入同比增长率，反映业务规模扩张速度。营收增长是利润增长的前提。'],
      ['净利同比', '净利润同比增长率，反映赚钱能力的提升，比营收更能体现真实盈利变化。'],
      ['单季营收/净利同比', '只看最近一个季度的同比增速，能更早捕捉业绩的拐点或加速，比累计值更灵敏。']
    ],
    tips: '建议：高增速需关注可持续性，警惕靠一次性收益或并购堆出来的"伪增长"。可结合 ROE 看增长质量。'
  },
  quality: {
    summary: '盈利质量衡量"赚的钱是不是真金白银、赚得是否高效"，决定公司盈利的含金量。',
    items: [
      ['ROE', '净资产收益率 = 净利润 ÷ 净资产，衡量股东资金使用效率。连续多年 ROE>15% 通常视为优质公司。'],
      ['毛利率 / 净利率', '毛利率反映产品定价权，净利率反映整体盈利效率，越高代表竞争力越强。'],
      ['现金流/净利', '经营现金流净额 ÷ 净利润，大于1说明利润有现金支撑，远小于1利润可能"含水分"。'],
      ['商誉/净资产', '商誉是并购溢价形成的资产，占比过高存在大额减值风险，超过50%会触发评分否决。']
    ],
    tips: '建议：优先选择高 ROE + 高现金流/净利 + 低商誉的公司，这类公司盈利扎实、抗风险能力强。'
  },
  technical: {
    summary: '技术面通过量价关系判断股价趋势与买卖时机，适合短线交易和择时参考。',
    items: [
      ['站上MA60', '股价是否在60日均线上方，是中期多空的分水岭，站上偏强、跌破偏弱。'],
      ['均线多头排列', 'MA5>MA10>MA20 的上升结构，代表短期趋势向上。'],
      ['MACD金叉', 'DIF 上穿 DEA，经典买入信号，低位金叉更可靠。'],
      ['KDJ金叉 / 超卖', '金叉代表短线转强；超卖（K/D<20）代表短线超跌，可能有反弹机会。'],
      ['突破20日高点', '股价创近20日新高，多头力量强势。'],
      ['技术面评分', '综合均线、动量、MACD、KDJ、波动、量能等子指标加权得出的 0~100 分。']
    ],
    tips: '建议：技术信号有滞后性和假信号，建议配合基本面筛选，短线操作注意止损纪律。'
  },
  sentiment: {
    summary: '资金情绪反映市场资金的关注度和买卖热度，资金持续流入的股票短期动能更强。',
    items: [
      ['换手率', '成交量 ÷ 流通股本，反映交易活跃度。过低流动性差，过高可能短线过热。'],
      ['量比', '近5日均量 ÷ 近20日均量，>1 表示近期明显放量，资金关注度上升。'],
      ['5日涨跌幅', '近5日累计涨跌幅，反映短线动能强度，涨幅过大需防回调。'],
      ['总市值', '股价 × 总股本。大盘股更稳健，小盘股弹性大但波动风险也更高。']
    ],
    tips: '建议：温和放量上涨优于爆量拉升，警惕高位巨量换手（可能是出货信号）。'
  },
  risk: {
    summary: '风险维度评估公司的财务风险和价格波动风险，是"避雷"的关键。',
    items: [
      ['风险等级', '模型综合负债率、波动率、回撤、商誉等判定的低/中/高三档，是核心风险结论。'],
      ['资产负债率', '总负债 ÷ 总资产，过高财务风险大，超过100%触发评分否决。'],
      ['20日波动率', '近20日年化波动率，反映股价剧烈程度，数值越高持有体验越差。'],
      ['综合评分', '六维加权并经区间拉伸的 0~100 分：≥80 绿、60~79 黄、<60 红。'],
      ['推荐结论', '由评分与风险映射：重点关注/可关注/中性/谨慎/回避。']
    ],
    tips: '建议：优先规避高负债、高商誉、高波动标的，ST 股与连续亏损股会被模型强制否决。'
  },
  industry: {
    summary: '行业筛选用于聚焦特定板块，从行业维度缩小选股范围。',
    items: [
      ['所属行业', '按东财行业分类，选择后仅保留该行业股票进入评分池（Top 250）。']
    ],
    tips: '建议：可结合行业评分排名（列表页上方），优先关注平均分较高的行业。'
  }
}

function getGroupExplain(g) {
  return GROUP_EXPLAIN[g.key] || null
}

const filterGroups = computed(() => [
  {
    key: 'boards', icon: '🏛️', title: '市场板块', grid2: true,
    items: [
      { key: 'boardShMain', label: '沪市主板', type: 'switch' },
      { key: 'boardSzMain', label: '深市主板', type: 'switch' },
      { key: 'boardChinext', label: '创业板', type: 'switch' },
      { key: 'boardStar', label: '科创板', type: 'switch' }
    ]
  },
  {
    key: 'valuation', icon: '💰', title: '估值',
    items: [
      { key: 'pe', label: 'PE(TTM)', type: 'range', minKey: 'minPe', maxKey: 'maxPe', placeholderMin: '最小', placeholderMax: '最大' },
      { key: 'pb', label: 'PB', type: 'range', minKey: 'minPb', maxKey: 'maxPb', placeholderMin: '最小', placeholderMax: '最大' },
      { key: 'div', label: '股息率%', type: 'range', minKey: 'minDividend', maxKey: 'maxDividend', placeholderMin: '最小', placeholderMax: '最大' }
    ]
  },
  {
    key: 'growth', icon: '📈', title: '成长',
    items: [
      { key: 'rev', label: '营收同比%', type: 'range', minKey: 'minRevenueGrowth', maxKey: 'maxRevenueGrowth', placeholderMin: '最小', placeholderMax: '最大' },
      { key: 'profit', label: '净利同比%', type: 'range', minKey: 'minProfitGrowth', maxKey: 'maxProfitGrowth', placeholderMin: '最小', placeholderMax: '最大' },
      { key: 'qRev', label: '单季营收同比%', type: 'range', minKey: 'minQRevGrowth', maxKey: 'maxQRevGrowth', placeholderMin: '最小', placeholderMax: '最大' },
      { key: 'qProfit', label: '单季净利同比%', type: 'range', minKey: 'minQProfitGrowth', maxKey: 'maxQProfitGrowth', placeholderMin: '最小', placeholderMax: '最大' }
    ]
  },
  {
    key: 'quality', icon: '💎', title: '盈利质量',
    items: [
      { key: 'roe', label: 'ROE%', type: 'range', minKey: 'minRoe', maxKey: 'maxRoe', placeholderMin: '最小', placeholderMax: '最大' },
      { key: 'gross', label: '毛利率%', type: 'range', minKey: 'minGrossMargin', maxKey: 'maxGrossMargin', placeholderMin: '最小', placeholderMax: '最大' },
      { key: 'net', label: '净利率%', type: 'range', minKey: 'minNetMargin', maxKey: 'maxNetMargin', placeholderMin: '最小', placeholderMax: '最大' },
      { key: 'ocf', label: '现金流/净利', type: 'single', key: 'minOcfRatio', placeholder: '≥' },
      { key: 'goodwill', label: '商誉/净资产%', type: 'single', key: 'maxGoodwillRatio', placeholder: '≤' }
    ]
  },
  {
    key: 'technical', icon: '📊', title: '技术面', grid2: true,
    items: [
      { key: 'techScore', label: '技术面评分', type: 'range', minKey: 'minTechScore', maxKey: 'maxTechScore', placeholderMin: '≥', placeholderMax: '≤' },
      { key: 'ma60', label: '站上MA60', type: 'switch', key: 'isAboveMa60' },
      { key: 'bull', label: '均线多头排列', type: 'switch', key: 'techBullAlign' },
      { key: 'macd', label: 'MACD金叉', type: 'switch', key: 'techMacdGolden' },
      { key: 'kdj', label: 'KDJ金叉', type: 'switch', key: 'techKdjGolden' },
      { key: 'kdjLow', label: 'KDJ超卖', type: 'switch', key: 'techKdjOversold' },
      { key: 'break', label: '突破20日高点', type: 'switch', key: 'techBreakHigh20' }
    ]
  },
  {
    key: 'sentiment', icon: '🔥', title: '资金情绪',
    items: [
      { key: 'turn', label: '换手率%', type: 'range', minKey: 'minTurnoverRate', maxKey: 'maxTurnoverRate', placeholderMin: '最小', placeholderMax: '最大' },
      { key: 'volRatio', label: '量比', type: 'range', minKey: 'minVolumeRatio', maxKey: 'maxVolumeRatio', placeholderMin: '最小', placeholderMax: '最大' },
      { key: 'chg5d', label: '5日涨跌幅%', type: 'range', minKey: 'minChg5d', maxKey: 'maxChg5d', placeholderMin: '最小', placeholderMax: '最大' },
      { key: 'cap', label: '总市值(亿)', type: 'range', minKey: 'minMarketCap', maxKey: 'maxMarketCap', placeholderMin: '最小', placeholderMax: '最大' }
    ]
  },
  {
    key: 'risk', icon: '🛡️', title: '风险与评分',
    items: [
      { key: 'conclusion', label: '推荐结论', type: 'select', key: 'conclusion', options: CONCLUSION_OPTIONS },
      { key: 'risk', label: '风险等级', type: 'select', key: 'riskLevel', options: RISK_OPTIONS },
      { key: 'debt', label: '资产负债率%', type: 'single', key: 'maxDebtRatio', placeholder: '≤' },
      { key: 'vol20', label: '20日波动率%', type: 'single', key: 'maxVolatility20', placeholder: '≤' },
      { key: 'score', label: '综合评分', type: 'range', minKey: 'minScore', maxKey: 'maxScore', placeholderMin: '≥', placeholderMax: '≤' }
    ]
  },
  {
    key: 'industry', icon: '🏢', title: '行业',
    items: [
      {
        key: 'ind', label: '所属行业', type: 'select', key: 'industry',
        options: [{ label: '全部行业', value: '' }, ...industries.value.map(i => ({ label: `${i.name} (${i.count})`, value: i.name }))]
      }
    ]
  }
])

// ==================== 数据加载 ====================
/** 收集当前选中的市场板块（数组形式） */
function collectBoards() {
  const f = filters.value
  const map = { boardShMain: 'sh_main', boardSzMain: 'sz_main', boardChinext: 'chinext', boardStar: 'star' }
  return Object.entries(map).filter(([k]) => f[k]).map(([, v]) => v)
}

function collectFilters() {
  const p = {}
  const f = filters.value
  // 市场板块多选 → boards 参数（4 个全选或全不选 = 不限，不传）
  const boards = collectBoards()
  if (boards.length && boards.length < 4) p.boards = boards.join(',')
  Object.entries(f).forEach(([k, v]) => {
    if (k.startsWith('board')) return
    if (v === '' || v === null || v === undefined) return
    p[k] = v
  })
  return p
}

function startLoadStage() {
  stopLoadStage()
  loadStage.value = 1
  loadStageTimer = setInterval(() => {
    if (loadStage.value < 4) loadStage.value++
  }, 8000)
}
function stopLoadStage() {
  if (loadStageTimer) { clearInterval(loadStageTimer); loadStageTimer = null }
}

async function loadList({ silent = false, attempt = 0, refresh = false } = {}) {
  if (!silent) { loading.value = true; errorMsg.value = '' }
  // 仅当无数据时显示全屏 loading（首次加载），翻页/筛选时保留旧数据
  if (!rows.value.length && !silent) startLoadStage()
  // 中止上一次未完成的请求，释放连接
  if (abortCtrl) { abortCtrl.abort(); abortCtrl = null }
  abortCtrl = new AbortController()
  try {
    const params = {
      horizon: horizon.value,
      page: page.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      ...collectFilters()
    }
    // 强制刷新：绕过服务端评分池缓存，触发重新构建
    if (refresh) params.refresh = 1
    const res = await getStockList(params, abortCtrl.signal)
    if (res.code === 0) {
      rows.value = res.data.list || []
      total.value = res.data.total || 0
      meta.value = res.data.meta || null
      loadStage.value = 4
      // SWR：基础池阶段自动轮询，直到完整评分池就绪（stage==='full'）
      if (res.data.meta?.stage === 'base') startPoll()
      else stopPoll()
    } else {
      errorMsg.value = res.message || '加载失败'
      stopPoll()
    }
  } catch (e) {
    if (e.name === 'AbortError') return
    // 网络抖动/数据源限流：自动重试一次（指数退避），避免用户手动反复刷新
    if (attempt < 1) {
      stopPoll()
      await new Promise(r => setTimeout(r, 1500))
      return loadList({ silent, attempt: attempt + 1 })
    }
    errorMsg.value = e.message || '网络错误'
    stopPoll()
  } finally {
    if (!silent) { stopLoadStage(); loading.value = false }
  }
}

// ---- 完整评分池轮询（stage==='base' 时静默刷新，命中 full 或超限后停止）----
function stopPoll() {
  if (pollTimer) { clearTimeout(pollTimer); pollTimer = null }
  pollCount = 0
}
function startPoll() {
  stopPoll()
  pollTimer = setTimeout(pollOnce, POLL_INTERVAL)
}
async function pollOnce() {
  pollTimer = null
  if (++pollCount > POLL_MAX) { pollCount = 0; return }
  try {
    await loadList({ silent: true })
    // loadList 内部已依据 meta.stage 自行 startPoll / stopPoll
  } catch {
    stopPoll()
  }
}

// 周期/行业切换防抖：合并快速连续操作，减少无效请求
function scheduleLoad(delay = 300) {
  clearTimeout(loadTimer)
  loadTimer = setTimeout(() => {
    loadTimer = null
    stopPoll()
    loadList()
    loadRank()
  }, delay)
}

async function loadRank() {
  try {
    const boards = collectBoards()
    const params = boards.length && boards.length < 4 ? { boards: boards.join(',') } : {}
    const res = await getIndustryRanking(horizon.value, params)
    if (res.code === 0) industryRank.value = res.data || []
  } catch { /* 排名失败不阻塞页面 */ }
}

async function loadConfig() {
  try {
    const res = await getHorizonConfig()
    if (res.code === 0) horizons.value = res.data || []
  } catch { /* ignore */ }
}

async function loadIndustries() {
  try {
    const res = await getIndustries()
    if (res.code === 0) industries.value = res.data || []
  } catch { /* ignore */ }
}

function refresh() {
  stopPoll()
  loadList({ refresh: true })
  loadRank()
}

function changeHorizon(h) {
  if (horizon.value === h) return
  horizon.value = h
  page.value = 1
  // 中止进行中的旧周期请求，避免其返回后覆盖新周期数据
  if (abortCtrl) { abortCtrl.abort(); abortCtrl = null }
  // 周期切换后评分模型完全不同：立即清空上一周期的结果与排名，避免旧数据误导
  rows.value = []
  total.value = 0
  meta.value = null
  industryRank.value = []
  errorMsg.value = ''
  loading.value = true
  loadStage.value = 0
  // 防抖合并快速连续切换，避免对服务器发起重复构建请求
  scheduleLoad()
}

function applyFilters() {
  page.value = 1
  stopPoll()
  loadList()
}

function resetFilters() {
  filters.value = {
    boardShMain: true,
    boardSzMain: true,
    boardChinext: null,
    boardStar: null,
    industry: '',
    minPe: null, maxPe: null, minPb: null, maxPb: null, minDividend: null, maxDividend: null,
    minRevenueGrowth: null, maxRevenueGrowth: null, minProfitGrowth: null, maxProfitGrowth: null,
    minQRevGrowth: null, maxQRevGrowth: null, minQProfitGrowth: null, maxQProfitGrowth: null,
    minRoe: null, maxRoe: null, minGrossMargin: null, maxGrossMargin: null,
    minNetMargin: null, maxNetMargin: null, minOcfRatio: null, maxGoodwillRatio: null,
    maxDebtRatio: null, maxVolatility20: null,
    isAboveMa60: null,
    techBullAlign: null, techMacdGolden: null, techKdjGolden: null, techKdjOversold: null, techBreakHigh20: null,
    minTechScore: null, maxTechScore: null,
    minTurnoverRate: null, maxTurnoverRate: null,
    minVolumeRatio: null, maxVolumeRatio: null, minChg5d: null, maxChg5d: null,
    minMarketCap: null, maxMarketCap: null, riskLevel: '', minScore: null, maxScore: null, conclusion: ''
  }
  applyFilters()
}

function toggleIndustry(ind) {
  filters.value.industry = filters.value.industry === ind ? '' : ind
  page.value = 1
  // 防抖合并快速连续点击行业，避免对服务器发起重复构建请求
  scheduleLoad()
}

// ==================== 排序 / 分页 ====================
function toggleSort(key) {
  if (loading.value) return
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortBy.value = key
    sortOrder.value = 'desc'
  }
  applyFilters()
}
function sortIcon(key) {
  if (sortBy.value !== key) return '↕'
  return sortOrder.value === 'desc' ? '↓' : '↑'
}
function goPage(p) {
  if (loading.value) return
  if (p < 1 || p > totalPages.value) return
  page.value = p
  stopPoll()
  loadList()
}
function onPageSizeChange() {
  if (loading.value) return
  page.value = 1
  stopPoll()
  loadList()
}

// ==================== 搜索联想 ====================
function onKeywordInput() {
  clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(async () => {
    const kw = keyword.value.trim()
    if (!kw) { suggestions.value = []; return }
    const seq = ++searchSeq
    try {
      const res = await searchStocks(kw)
      if (seq === searchSeq && res.code === 0) suggestions.value = res.data || []
    } catch { /* ignore */ }
  }, 300)
}
function onKeywordFocus() {
  if (keyword.value.trim()) onKeywordInput()
}
function submitSearch() {
  if (suggestions.value.length) {
    goDetail(suggestions.value[0].code)
  } else if (keyword.value.trim()) {
    goDetail(keyword.value.trim())
  }
}

// ==================== 跳转 ====================
function goDetail(code) {
  if (loading.value) return
  router.push({ name: 'stockRecommendDetail', params: { code }, query: { horizon: horizon.value } })
}
function goGuide() {
  router.push({ name: 'stockRecommendGuide' })
}
function openEastMoney(code) {
  const sec = code.startsWith('6') ? 'sh' : (code.startsWith('0') || code.startsWith('3') ? 'sz' : 'bj')
  window.open(`https://quote.eastmoney.com/${sec}${code}.html`, '_blank')
}

// ==================== 格式化 ====================
function scoreClass(s) {
  if (s >= 80) return 'sc-green'
  if (s >= 60) return 'sc-yellow'
  return 'sc-red'
}
function conclusionClass(c) {
  const map = {
    '重点关注': 'cc-hot', '可关注': 'cc-buy', '中性': 'cc-mid', '谨慎': 'cc-warn', '回避': 'cc-avoid'
  }
  return map[c] || 'cc-mid'
}
function boardLabel(b) {
  const map = { sh_main: '沪主板', sz_main: '深主板', chinext: '创业板', star: '科创板' }
  return map[b] || b || ''
}
function changeClass(v) {
  if (v == null) return ''
  return v > 0 ? 'up' : (v < 0 ? 'down' : '')
}
function fmtNum(v, d = 2) {
  if (v == null || isNaN(v)) return '--'
  return Number(v).toFixed(d)
}
function fmtPct(v) {
  if (v == null || isNaN(v)) return '--'
  return (v > 0 ? '+' : '') + Number(v).toFixed(2) + '%'
}
function formatTime(iso) {
  if (!iso) return '--'
  const d = new Date(iso)
  const p = n => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
function rankBarWidth(r) {
  const max = industryRank.value[0]?.avgScore || 80
  return Math.max(8, Math.round((r.avgScore / max) * 100))
}

onMounted(() => {
  loadConfig()
  loadIndustries()
  loadList()
  loadRank()
})
onBeforeUnmount(() => {
  clearTimeout(searchTimer.value)
  if (loadTimer) { clearTimeout(loadTimer); loadTimer = null }
  stopPoll()
  stopLoadStage()
  // 中止进行中的请求，避免路由切换后 pending 请求占用连接（后端感知断开后自动取消池构建）
  if (abortCtrl) { abortCtrl.abort(); abortCtrl = null }
})
</script>

<style scoped src="./NormalStockPanel.scss"></style>

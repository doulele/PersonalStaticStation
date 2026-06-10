<template>
  <div class="dadao-qixian-page fade-in">
    <!-- 筛选面板 -->
    <el-card class="filter-panel" shadow="never">
      <div class="filter-title" @click="isMobile && (filterCollapsed = !filterCollapsed)">
        📊 多因子筛选 (勾选即生效)
        <el-tag type="primary" size="small" effect="plain" class="filter-hint-tag">点击ⓘ获取交易指引</el-tag>
        <el-button size="small" @click.stop="resetFilters" style="margin-left: auto;">⟳ 重置筛选</el-button>
        <span class="filter-collapse-btn" v-if="isMobile">
          {{ filterCollapsed ? '展开 ▼' : '收起 ▲' }}
        </span>
      </div>
      <div class="filter-grid" :class="{ 'filter-collapsed': isMobile && filterCollapsed }">
        <!-- 核心信号（最重要，放在最前面） -->
        <div class="filter-group important-group">
          <span class="group-label">核心信号</span>
          <el-checkbox v-model="filters.nearGoldenCross">
            ⚡ 5日内金叉 <el-icon class="help-icon" @click.stop="showMetricInfo('nearGoldenCross')"><QuestionFilled /></el-icon>
          </el-checkbox>
          <el-checkbox v-model="filters.goldenCross">
            🔥 通子金叉 <el-icon class="help-icon" @click.stop="showMetricInfo('goldenCross')"><QuestionFilled /></el-icon>
          </el-checkbox>
          <el-checkbox v-model="filters.multiHair">
            🌟 多头排列 <el-icon class="help-icon" @click.stop="showMetricInfo('multiHair')"><QuestionFilled /></el-icon>
          </el-checkbox>
          <el-checkbox v-model="filters.macdAboveZero">
            🔝 MACD零轴上方 <el-icon class="help-icon" @click.stop="showMetricInfo('macdAboveZero')"><QuestionFilled /></el-icon>
          </el-checkbox>
          <el-checkbox v-model="filters.wuChenGolden">
            🔀 午辰金叉 <el-icon class="help-icon" @click.stop="showMetricInfo('wuChenGolden')"><QuestionFilled /></el-icon>
          </el-checkbox>
          <el-checkbox v-model="filters.macdGolden">
            📍 MACD金叉 <el-icon class="help-icon" @click.stop="showMetricInfo('macdGolden')"><QuestionFilled /></el-icon>
          </el-checkbox>
        </div>
        <!-- 均线位置 -->
        <div class="filter-group">
          <span class="group-label">均线位置</span>
          <el-checkbox v-model="filters.priceAboveTong">
            💹 股价>通线 <el-icon class="help-icon" @click.stop="showMetricInfo('priceAboveTong')"><QuestionFilled /></el-icon>
          </el-checkbox>
          <el-checkbox v-model="filters.priceAboveWu">
            📈 股价>午线 <el-icon class="help-icon" @click.stop="showMetricInfo('priceAboveWu')"><QuestionFilled /></el-icon>
          </el-checkbox>
          <el-checkbox v-model="filters.priceAboveChen">
            🏔️ 股价>辰线 <el-icon class="help-icon" @click.stop="showMetricInfo('priceAboveChen')"><QuestionFilled /></el-icon>
          </el-checkbox>
          <el-checkbox v-model="filters.priceAboveShen">
            ⚓ 股价>申线 <el-icon class="help-icon" @click.stop="showMetricInfo('priceAboveShen')"><QuestionFilled /></el-icon>
          </el-checkbox>
        </div>
        <!-- 量价指标 -->
        <div class="filter-group">
          <span class="group-label">量价指标</span>
          <el-checkbox v-model="filters.volumeSurge">
            💧 放量(>20日均) <el-icon class="help-icon" @click.stop="showMetricInfo('volumeSurge')"><QuestionFilled /></el-icon>
          </el-checkbox>
          <el-checkbox v-model="filters.shrinkPullback">
            📉 缩量回调 <el-icon class="help-icon" @click.stop="showMetricInfo('shrinkPullback')"><QuestionFilled /></el-icon>
          </el-checkbox>
        </div>
        <!-- 风险信号 -->
        <div class="filter-group risk-group">
          <span class="group-label risk-label">风险信号</span>
          <el-checkbox v-model="filters.deadCross">
            🧊 通子死叉 <el-icon class="help-icon" @click.stop="showMetricInfo('deadCross')"><QuestionFilled /></el-icon>
          </el-checkbox>
          <el-checkbox v-model="filters.macdDeath">
            🔻 MACD死叉 <el-icon class="help-icon" @click.stop="showMetricInfo('macdDeath')"><QuestionFilled /></el-icon>
          </el-checkbox>
        </div>
        <!-- 参考指标（参考价值有限） -->
        <div class="filter-group reference-group">
          <span class="group-label">参考指标</span>
          <el-checkbox v-model="filters.rsiOversold">
            <span>⚡ RSI&lt;30超卖</span> <el-icon class="help-icon" @click.stop="showMetricInfo('rsiOversold')"><QuestionFilled /></el-icon>
          </el-checkbox>
          <el-checkbox v-model="filters.rsiOverbought">
            <span>🔥 RSI&gt;70超买</span> <el-icon class="help-icon" @click.stop="showMetricInfo('rsiOverbought')"><QuestionFilled /></el-icon>
          </el-checkbox>
          <el-checkbox v-model="filters.rsiNeutral">
            😐 RSI中性(40-60) <el-icon class="help-icon" @click.stop="showMetricInfo('rsiNeutral')"><QuestionFilled /></el-icon>
          </el-checkbox>
          <el-checkbox v-model="filters.bearishAlignment">
            ⬇️ 空头排列 <el-icon class="help-icon" @click.stop="showMetricInfo('bearishAlignment')"><QuestionFilled /></el-icon>
          </el-checkbox>
          <el-checkbox v-model="filters.priceBelowHai">
            <span>⚠️ 股价&lt;亥线</span> <el-icon class="help-icon" @click.stop="showMetricInfo('priceBelowHai')"><QuestionFilled /></el-icon>
          </el-checkbox>
          <el-checkbox v-model="filters.highAmplitude">
            <span>💥 高振幅(&gt;5%)</span> <el-icon class="help-icon" @click.stop="showMetricInfo('highAmplitude')"><QuestionFilled /></el-icon>
          </el-checkbox>
        </div>
      </div>

      <!-- 板块选择 + 开始筛选 + 个股股诊 -->
      <div class="board-selection">
        <el-radio-group v-model="selectedBoard" size="small" @change="switchBoard">
          <el-radio-button value="all">全A股</el-radio-button>
          <el-radio-button value="sh">上证主板</el-radio-button>
          <el-radio-button value="sz">深证主板</el-radio-button>
          <el-radio-button value="cyb">创业板</el-radio-button>
          <el-radio-button value="kcb">科创板</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="refreshAll" :loading="loading">
          <el-icon><Search /></el-icon> 开始筛选
        </el-button>
        <span v-if="boardStockCount > 0" class="board-info">
          共 <strong>{{ boardStockCount }}</strong> 只
        </span>
      </div>

      <!-- 个股股诊入口 -->
      <div class="diagnosis-bar">
        <span class="diagnosis-label">🩺 个股股诊</span>
        <el-input
          v-model="diagnosisCode"
          placeholder="输入股票代码，如 000001"
          clearable
          size="small"
          style="max-width:200px;"
          @keyup.enter="goDiagnosis"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="success" size="small" @click="goDiagnosis" :disabled="!diagnosisCode.trim()">开始诊断</el-button>
      </div>

      <div class="stat-note">
        ✅ 当前共 {{ allData.length }} 只股票，满足筛选 {{ filteredData.length }} 只
      </div>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <span class="table-title"><el-icon><DataLine /></el-icon> 大道七线分析结果</span>
          <div class="table-header-right">
            <el-tag type="primary" size="small" effect="plain">点击行查看详情</el-tag>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <div v-if="!loading && allData.length === 0" class="empty-state">
        <el-empty description="暂无分析结果" :image-size="100">
          <template #description>
            <p class="empty-desc">请选择板块并点击"开始筛选"</p>
            <p class="empty-hint">数据基于800日K线计算，首次加载可能较慢</p>
          </template>
        </el-empty>
      </div>
      <div v-else-if="!loading && filteredData.length === 0 && allData.length > 0" class="empty-state">
        <el-empty description="筛选无结果" :image-size="80">
          <template #description>
            <p class="empty-hint">原始数据中有 {{ allData.length }} 只股票，但当前筛选条件下无匹配项</p>
          </template>
          <el-button @click="resetFilters">重置筛选</el-button>
        </el-empty>
      </div>

      <!-- PC 端表格（精简版） -->
      <el-table
        v-else
        :data="pagedData"
        v-loading="loading"
        element-loading-text="正在获取K线并计算指标..."
        element-loading-background="rgba(255,255,255,0.7)"
        stripe
        class="pc-table"
        @row-click="openDetail"
        style="cursor: pointer;"
        :default-sort="{ prop: 'score', order: 'descending' }"
      >
        <el-table-column prop="name" label="股票名称" width="130" fixed>
          <template #default="{ row }">
            <div style="font-weight:600;">{{ row.name }}</div>
            <div style="font-size:0.7rem;color:#94a3b8;">{{ row.code }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="close" label="最新价" width="85" sortable>
          <template #default="{ row }">
            <span style="font-weight:700;color:#0f172a;">{{ row.close?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="涨跌幅(%)" width="95" sortable sort-by="changePctVal">
          <template #default="{ row }">
            <span :class="row.changePct > 0 ? 'price-up' : (row.changePct < 0 ? 'price-down' : '')">
              {{ row.changePct > 0 ? '+' : '' }}{{ row.changePct?.toFixed(2) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column label="通子状态" width="125">
          <template #default="{ row }">
            <el-tag v-if="row.isGolden" type="success" size="small" effect="dark">通子金叉 ↑</el-tag>
            <el-tag v-else-if="row.isDead" type="danger" size="small" effect="dark">通子死叉 ↓</el-tag>
            <el-tag v-else-if="row.nearGoldenCross" type="success" size="small" effect="plain">近期金叉</el-tag>
            <el-tag v-else type="info" size="small">--</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="MACD" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.macdGolden" type="success" size="small">金叉 ✓</el-tag>
            <el-tag v-else-if="row.macdBull" type="warning" size="small" effect="plain">多头</el-tag>
            <el-tag v-else type="info" size="small" effect="plain">空头</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="午辰" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.wuChenGolden" type="success" size="small" effect="dark">金叉 ✓</el-tag>
            <el-tag v-else type="info" size="small" effect="plain">--</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="RSI" width="70" sortable sort-by="rsiVal">
          <template #default="{ row }">
            <span :class="{ 'rsi-overbought': row.rsi > 70, 'rsi-oversold': row.rsi < 30 }">{{ row.rsi }}</span>
          </template>
        </el-table-column>
        <el-table-column label="量比" width="75" sortable sort-by="volRatioVal">
          <template #default="{ row }">
            {{ row.volRatio }}
          </template>
        </el-table-column>
        <el-table-column label="5日涨跌(%)" width="100" sortable sort-by="pct5dVal">
          <template #default="{ row }">
            <span :class="row.pct5dVal > 0 ? 'price-up' : (row.pct5dVal < 0 ? 'price-down' : '')">
              {{ row.pct5d }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="评分" width="110" sortable sort-by="score" align="center">
          <template #default="{ row }">
            <span class="score-badge" :class="scoreLevelClass(row.score)">{{ row.score }} <small>{{ scoreLevelText(row.score) }}</small></span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click.stop="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 手机端卡片 -->
      <div v-show="!loading && filteredData.length > 0" class="mobile-card-list">
        <el-card v-for="row in pagedData" :key="row.code" class="dadao-card" shadow="hover" @click="openDetail(row)">
          <div class="card-top">
            <div class="card-code-name">
              <span class="card-code">{{ row.code }}</span>
              <span class="card-name">{{ row.name }}</span>
            </div>
            <el-tag v-if="row.isGolden" type="success" size="small" effect="dark">金叉</el-tag>
            <el-tag v-else-if="row.isDead" type="danger" size="small" effect="dark">死叉</el-tag>
            <el-tag v-else-if="row.nearGoldenCross" type="success" size="small" effect="plain">近期金叉</el-tag>
            <el-tag v-else type="info" size="small">--</el-tag>
          </div>
          <div class="card-price-row">
            <span class="card-price">¥{{ row.close?.toFixed(2) }}</span>
            <span :class="row.changePct > 0 ? 'price-up' : (row.changePct < 0 ? 'price-down' : '')" class="card-change">
              {{ row.changePct > 0 ? '+' : '' }}{{ row.changePct?.toFixed(2) }}%
            </span>
            <span class="card-turnover">换手{{ row.turnoverRate }}%</span>
          </div>
          <div class="card-metrics">
            <div class="card-metric">
              <span class="metric-label">MACD</span>
              <span class="metric-value">{{ row.macdSignal }}</span>
            </div>
            <div class="card-metric">
              <span class="metric-label">午辰</span>
              <span class="metric-value" :class="{ 'price-up': row.wuChenGolden }">{{ row.wuChenGolden ? '金叉 ✓' : '--' }}</span>
            </div>
            <div class="card-metric">
              <span class="metric-label">RSI</span>
              <span class="metric-value" :class="{ 'rsi-overbought': row.rsi > 70, 'rsi-oversold': row.rsi < 30 }">{{ row.rsi }}</span>
            </div>
            <div class="card-metric">
              <span class="metric-label">量比</span>
              <span class="metric-value">{{ row.volRatio }}</span>
            </div>
          </div>
          <div class="card-footer">
            <span>评分: <span class="score-badge" :class="scoreLevelClass(row.score)">{{ row.score }}</span> <small class="score-level-text" :class="scoreLevelClass(row.score)">{{ scoreLevelText(row.score) }}</small></span>
            <span class="card-detail-btn">查看详情 →</span>
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

    <!-- 指标解释弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="450px" destroy-on-close class="metric-dialog">
      <div class="metric-dialog-body">
        <p><strong>📖 含义：</strong> {{ dialogDesc }}</p>
        <div class="suggestion"><strong>💡 操作建议：</strong> {{ dialogSuggestion }}</div>
      </div>
    </el-dialog>

    <!-- 底部 -->
    <div class="dadao-footer">
      📐 大道七线参数: 通17 | 子26 | 午100 | 辰145 | 申320 | 卯455 | 亥732 &nbsp;|&nbsp;
      💡 补充指标: RSI(14)、MACD(12,26,9)、量价关系、涨跌趋势 &nbsp;|&nbsp; 点击ⓘ获得专业解读
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, DataLine, QuestionFilled } from '@element-plus/icons-vue'
import {
  buildStockMetrics, fetchKline,
  scoreLevelClass, scoreLevelText,
  METRIC_EXPLANATIONS
} from '@/utils/stockAnalysis'

const router = useRouter()

// ==================== 移动端检测 ====================
const isMobile = ref(window.innerWidth <= 768)
const filterCollapsed = ref(false)
function updateMobile() { isMobile.value = window.innerWidth <= 768 }
window.addEventListener('resize', updateMobile)

// ==================== 个股股诊 ====================
const diagnosisCode = ref('')
function goDiagnosis() {
  const code = diagnosisCode.value.trim()
  if (!code) return
  router.push({ path: '/home/fund/dadao-detail', query: { code } })
}

// ==================== 板块配置 ====================
const BOARD_FS = {
  all: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
  sh: 'm:1+t:2',
  sz: 'm:0+t:6',
  cyb: 'm:0+t:80',
  kcb: 'm:1+t:23'
}
const BOARD_NAMES = { all: '全A股', sh: '上证主板', sz: '深证主板', cyb: '创业板', kcb: '科创板' }

// ==================== 状态 ====================
const selectedBoard = ref('all')
const loading = ref(false)
const allData = ref([])
const boardStockCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
let abortController = null

// 详情跳转
function openDetail(row) {
  router.push({ path: '/home/fund/dadao-detail', query: { code: row.code, name: row.name } })
}

// 筛选条件
const filters = ref({
  goldenCross: false,
  deadCross: false,
  nearGoldenCross: false,
  macdGolden: false,
  macdAboveZero: false,
  wuChenGolden: false,
  priceAboveTong: false,
  priceAboveWu: false,
  priceAboveChen: false,
  priceAboveShen: false,
  multiHair: false,
  volumeSurge: false,
  shrinkPullback: false,
  rsiOversold: false,
  rsiOverbought: false,
  rsiNeutral: false,
  macdDeath: false,
  bearishAlignment: false,
  priceBelowHai: false,
  highAmplitude: false
})

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

// ==================== 数据获取 ====================
async function fetchBoardSnapshot(board) {
  const fs = BOARD_FS[board]
  const PAGE_SIZE = 2000
  const signal = abortController?.signal
  const url1 = `/api-push2/api/qt/clist/get?pn=1&pz=${PAGE_SIZE}&po=1&np=1&fltt=2&invt=2&fid=f3&fs=${fs}&fields=f2,f3,f5,f6,f7,f8,f9,f10,f12,f14,f20,f21`
  const response = await fetch(url1, { signal })
  if (!response.ok) throw new Error(`板块行情请求失败 HTTP ${response.status}`)
  const json = await response.json()
  if (!json?.data?.diff?.length) throw new Error('板块无数据')

  const total = json.data.total || 0
  let allDiff = [...json.data.diff]

  if (total > PAGE_SIZE) {
    const totalPages = Math.ceil(total / PAGE_SIZE)
    for (let pn = 2; pn <= totalPages; pn++) {
      const url = `/api-push2/api/qt/clist/get?pn=${pn}&pz=${PAGE_SIZE}&po=1&np=1&fltt=2&invt=2&fid=f3&fs=${fs}&fields=f2,f3,f5,f6,f7,f8,f9,f10,f12,f14,f20,f21`
      try {
        const res = await fetch(url, { signal })
        const j = await res.json()
        if (j?.data?.diff?.length) allDiff = allDiff.concat(j.data.diff)
      } catch (e) {
        if (e.name === 'AbortError') throw e
        console.warn(`拉取第${pn}页失败:`, e.message)
      }
    }
  }
  return { total, diff: allDiff }
}

// ==================== 批量筛选 ====================
const MAX_STOCKS = 30

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

    const preFiltered = snapshotData.diff
      .filter(row => {
        const name = row.f14 || ''
        const turnover = row.f8 || 0
        const changePct = row.f3 || 0
        if (name.includes('ST') || name.includes('*ST') || name.startsWith('N')) return false
        if (turnover < 0.01 && Math.abs(changePct) < 0.01) return false
        return true
      })
      .sort((a, b) => (b.f8 || 0) - (a.f8 || 0))
      .slice(0, MAX_STOCKS)

    ElMessage.info(`${BOARD_NAMES[board]}共 ${boardStockCount.value} 只，取换手率前 ${preFiltered.length} 只分析...`)

    if (preFiltered.length === 0) {
      loading.value = false
      ElMessage.warning('无符合条件的股票')
      return
    }

    const BATCH = 6
    for (let i = 0; i < preFiltered.length; i += BATCH) {
      const batch = preFiltered.slice(i, i + BATCH)
      const results = await Promise.all(
        batch.map(async (row) => {
          try {
            const klines = await fetchKline(row.f12, 800, abortController?.signal)
            return buildStockMetrics(row, klines)
          } catch (e) {
            if (e.name === 'AbortError') throw e
            console.warn(`分析 ${row.f12} 失败:`, e.message)
            return null
          }
        })
      )
      for (const r of results) {
        if (r) allData.value.push(r)
      }
    }

    loading.value = false
    ElMessage.success(`分析完成，共 ${allData.value.length} 只股票`)
  } catch (e) {
    if (e.name === 'AbortError') { loading.value = false; return }
    console.error('分析失败:', e)
    loading.value = false
    ElMessage.error(`分析失败：${e.message}`)
  }
}

// ==================== 前端筛选 ====================
const filteredData = computed(() => {
  let data = [...allData.value]
  const f = filters.value

  // 核心信号组
  if (f.goldenCross || f.deadCross || f.nearGoldenCross) {
    data = data.filter(d =>
      (f.goldenCross && d.isGolden) ||
      (f.deadCross && d.isDead) ||
      (f.nearGoldenCross && d.nearGoldenCross)
    )
  }
  if (f.macdGolden) data = data.filter(d => d.macdGolden)
  if (f.macdAboveZero) data = data.filter(d => d.macdAboveZero)
  if (f.wuChenGolden) data = data.filter(d => d.wuChenGolden)
  if (f.multiHair) data = data.filter(d => d.multiHair)

  // 均线位置组
  if (f.priceAboveTong) data = data.filter(d => d.priceAboveTong)
  if (f.priceAboveWu) data = data.filter(d => d.priceAboveWu)
  if (f.priceAboveChen) data = data.filter(d => d.priceAboveChen)
  if (f.priceAboveShen) data = data.filter(d => d.priceAboveShen)

  // 量价指标组
  if (f.volumeSurge) data = data.filter(d => d.volumeSurge)
  if (f.shrinkPullback) data = data.filter(d => d.shrinkPullback)

  // 风险信号组
  if (f.macdDeath) data = data.filter(d => d.macdDeath)

  // 参考指标组
  if (f.rsiOversold) data = data.filter(d => d.rsi < 30)
  if (f.rsiOverbought) data = data.filter(d => d.rsi > 70)
  if (f.rsiNeutral) data = data.filter(d => d.rsi >= 40 && d.rsi <= 60)
  if (f.bearishAlignment) data = data.filter(d => d.bearishAlignment)
  if (f.priceBelowHai) data = data.filter(d => d.priceBelowHai)
  if (f.highAmplitude) data = data.filter(d => d.highAmplitude)

  return data
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

function resetFilters() {
  filters.value = {
    goldenCross: false, deadCross: false, nearGoldenCross: false,
    macdGolden: false, macdAboveZero: false, wuChenGolden: false,
    priceAboveTong: false, priceAboveWu: false, priceAboveChen: false,
    priceAboveShen: false, multiHair: false,
    volumeSurge: false, shrinkPullback: false,
    rsiOversold: false, rsiOverbought: false, rsiNeutral: false,
    macdDeath: false, bearishAlignment: false,
    priceBelowHai: false, highAmplitude: false
  }
  currentPage.value = 1
}

function switchBoard() {
  resetFilters()
  refreshAll()
}

onMounted(() => {
  refreshAll()
})

onBeforeUnmount(() => {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  window.removeEventListener('resize', updateMobile)
})
</script>

<style lang="scss" scoped>
  @import url('../style/stockFilter/daDaoQiXian.scss');
</style>

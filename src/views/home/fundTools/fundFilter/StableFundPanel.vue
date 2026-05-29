<template>
  <div>
    <!-- 筛选条件卡片 -->
    <el-card class="filter-card">
      <template #header>
        <div class="filter-header">
          <span class="filter-title">🔍 稳健筛选条件</span>
          <el-tag type="info" size="small">符合条件: {{ filteredList.length }} 只</el-tag>
        </div>
      </template>
      <el-form :model="filters" class="filter-form">
        <div class="filter-grid">
          <el-form-item label="最大回撤 ≤ (%)">
            <el-input-number v-model="filters.maxDrawdown" :min="0" :max="100" :step="2" size="small" controls-position="right" />
          </el-form-item>
          <el-form-item label="3年年化收益 ≥ (%)">
            <el-input-number v-model="filters.minReturn" :min="-50" :max="100" :step="1" size="small" controls-position="right" />
          </el-form-item>
          <el-form-item label="夏普比率 ≥">
            <el-input-number v-model="filters.minSharpe" :min="-5" :max="10" :step="0.1" :precision="2" size="small" controls-position="right" />
          </el-form-item>
          <el-form-item label="经理年限 ≥ (年)">
            <el-input-number v-model="filters.minManagerYear" :min="0" :max="20" :step="1" size="small" controls-position="right" />
          </el-form-item>
          <el-form-item label="规模 ≥ (亿元)">
            <el-input-number v-model="filters.minFundSize" :min="0" :max="500" :step="5" size="small" controls-position="right" />
          </el-form-item>
          <el-form-item label="排序依据">
            <el-select v-model="filters.sortBy" size="small" style="width:130px">
              <el-option label="综合评分 ↓" value="score" />
              <el-option label="3年年化收益 ↓" value="return3y" />
              <el-option label="最大回撤 ↑" value="drawdown" />
              <el-option label="夏普比率 ↓" value="sharpe" />
            </el-select>
          </el-form-item>
        </div>
        <div class="filter-actions">
          <el-button type="primary" size="small" icon="RefreshRight" @click="load" :loading="loading">刷新数据</el-button>
          <el-button size="small" @click="reset">重置筛选</el-button>
        </div>
      </el-form>
    </el-card>

    <!-- PC端表格 -->
    <el-table v-loading="loading" element-loading-text="努力加载中..." :data="filteredList" stripe border highlight-current-row class="pc-table">
      <el-table-column prop="code" label="编号" width="80" fixed />
      <el-table-column prop="name" label="基金名称" width="200" fixed>
        <template #default="{ row }"><span class="fund-name">{{ row.name }}</span></template>
      </el-table-column>
      <el-table-column prop="type" label="类型" width="90">
        <template #default="{ row }">
          <el-tag size="small" :type="row.type.includes('债券') ? 'warning' : 'success'" effect="plain">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="dwjz" label="当前净值" width="95" sortable>
        <template #default="{ row }">{{ row.dwjz ? row.dwjz.toFixed(4) : '--' }}</template>
      </el-table-column>
      <el-table-column prop="gsz" label="实时估值" width="100" sortable>
        <template #default="{ row }">
          <span :style="{ color: (row.gszzl || 0) >= 0 ? '#f56c6c' : '#67c23a' }">{{ row.gsz ? row.gsz.toFixed(4) : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="gszzl" label="估算涨幅" width="95" sortable>
        <template #default="{ row }">
          <span :style="{ color: (row.gszzl || 0) >= 0 ? '#f56c6c' : '#67c23a', fontWeight: 'bold' }">{{ row.gszzl != null ? (row.gszzl >= 0 ? '+' : '') + row.gszzl.toFixed(2) + '%' : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="annualReturn3y" label="3年年化收益" sortable width="130">
        <template #default="{ row }">
          <span :style="{ color: row.annualReturn3y >= 0 ? '#f56c6c' : '#67c23a', fontWeight: 'bold' }">{{ row.annualReturn3y >= 0 ? '+' : '' }}{{ row.annualReturn3y.toFixed(1) }}%</span>
        </template>
      </el-table-column>
      <el-table-column prop="maxDrawdown" label="最大回撤" sortable width="110">
        <template #default="{ row }"><span :style="{ color: row.maxDrawdown >= 0 ? '#f56c6c' : '#67c23a' }">{{ row.maxDrawdown.toFixed(1) }}%</span></template>
      </el-table-column>
      <el-table-column prop="sharpeRatio" label="夏普比率" sortable width="110">
        <template #default="{ row }"><span :style="{ color: row.sharpeRatio >= 0 ? '#f56c6c' : '#67c23a' }">{{ row.sharpeRatio.toFixed(2) }}</span></template>
      </el-table-column>
      <el-table-column prop="managerYears" label="经理年限(年)" sortable width="130">
        <template #default="{ row }">
          <el-progress :percentage="Math.min(row.managerYears * 5, 100)" :color="row.managerYears >= 0 ? '#f56c6c' : '#67c23a'"><span>{{ row.managerYears.toFixed(1) }}年</span></el-progress>
        </template>
      </el-table-column>
      <el-table-column prop="fundSize" label="规模(亿)" sortable width="100" />
      <el-table-column prop="score" label="综合评分" sortable width="120">
        <template #default="{ row }"><el-tag :type="row.score >= 0 ? 'danger' : 'success'" effect="dark" size="small">{{ row.score }}</el-tag></template>
      </el-table-column>
    </el-table>

    <!-- 手机端卡片列表 -->
    <div v-loading="loading" element-loading-text="努力加载中..." class="mobile-card-list">
      <el-card v-for="row in filteredList" :key="row.code" class="fund-card" shadow="hover">
        <div class="card-header">
          <div class="card-title-row">
            <span class="card-code">{{ row.code }}</span>
            <span class="card-name">{{ row.name }}</span>
            <el-tag size="small" :type="row.type.includes('债券') ? 'warning' : 'success'" effect="plain">{{ row.type }}</el-tag>
          </div>
        </div>
        <div class="card-body">
          <div class="card-row quote-row">
            <div class="card-item"><span class="card-label">净值</span><span class="card-value">{{ row.dwjz ? row.dwjz.toFixed(4) : '--' }}</span></div>
            <div class="card-item"><span class="card-label">估值</span><span class="card-value" :style="{ color: (row.gszzl || 0) >= 0 ? '#f56c6c' : '#67c23a' }">{{ row.gsz ? row.gsz.toFixed(4) : '--' }}</span></div>
            <div class="card-item"><span class="card-label">涨幅</span><span class="card-value" :style="{ color: (row.gszzl || 0) >= 0 ? '#f56c6c' : '#67c23a', fontWeight: 'bold' }">{{ row.gszzl != null ? (row.gszzl >= 0 ? '+' : '') + row.gszzl.toFixed(2) + '%' : '--' }}</span></div>
          </div>
          <div class="card-row return-row">
            <div class="card-item"><span class="card-label">3年年化</span><span class="card-value" :style="{ color: row.annualReturn3y >= 0 ? '#f56c6c' : '#67c23a', fontWeight: 'bold' }">{{ row.annualReturn3y >= 0 ? '+' : '' }}{{ row.annualReturn3y.toFixed(1) }}%</span></div>
            <div class="card-item"><span class="card-label">回撤</span><span class="card-value" :style="{ color: row.maxDrawdown >= 0 ? '#f56c6c' : '#67c23a' }">{{ row.maxDrawdown.toFixed(1) }}%</span></div>
            <div class="card-item"><span class="card-label">夏普</span><span class="card-value" :style="{ color: row.sharpeRatio >= 0 ? '#f56c6c' : '#67c23a' }">{{ row.sharpeRatio.toFixed(2) }}</span></div>
          </div>
          <div class="card-row meta-row">
            <div class="card-item"><span class="card-label">经理</span><span class="card-value">{{ row.managerYears.toFixed(1) }}年</span></div>
            <div class="card-item"><span class="card-label">规模</span><span class="card-value">{{ row.fundSize.toFixed(1) }}亿</span></div>
            <div class="card-item">
              <el-tag :type="row.score >= 0 ? 'danger' : 'success'" size="small" effect="dark">评分 {{ row.score }}</el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 加载提示 -->
    <div v-if="loading" class="loading-tip">
      <el-alert title="努力加载中..." type="info" :closable="false" show-icon />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  fetchAllFunds, fetchHistoryBatch, fetchRankDataStable, fetchEstimatesBatch,
  calcAnnualizedReturn, calcMaxDrawdown, calcSharpeRatio, norm, normInverse,
  getAbortSignal, cancelAllRequests
} from './utils.js'

// 需要排除的低质量/重复类型
const EXCLUDED_TYPES = ['后端', 'B类', 'C类', '指数', 'ETF', 'LOF', '联接', 'QDII', '货币']
const TOP_N = 100          // 候选池：从排名中取前100只稳健型基金做详细计算
const BATCH_CONCURRENCY = 8 // 并行请求并发数

// 综合评分计算 (稳健型：低回撤+高收益+高夏普+资深经理+规模合理)
function computeScore(funds) {
  if (funds.length === 0) return funds
  const returns = funds.map(f => f.annualReturn3y)
  const drawdowns = funds.map(f => f.maxDrawdown)
  const sharpes = funds.map(f => f.sharpeRatio)
  const managers = funds.map(f => f.managerYears)
  const sizes = funds.map(f => f.fundSize)
  return funds.map(f => ({
    ...f,
    score: Math.round(
      norm(returns, f.annualReturn3y) * 30 +
      normInverse(drawdowns, f.maxDrawdown) * 30 +
      norm(sharpes, f.sharpeRatio) * 20 +
      norm(managers, f.managerYears) * 10 +
      norm(sizes, f.fundSize) * 10
    )
  }))
}

const funds = ref([])
const loading = ref(false)
const filters = ref({
  maxDrawdown: 30,
  minReturn: 5,
  minSharpe: 0.5,
  minManagerYear: 2,
  minFundSize: 2,
  sortBy: 'score'
})

const filteredList = computed(() => {
  let list = funds.value.filter(f =>
    f.maxDrawdown >= -filters.value.maxDrawdown &&
    f.annualReturn3y >= filters.value.minReturn &&
    f.sharpeRatio >= filters.value.minSharpe &&
    f.managerYears >= filters.value.minManagerYear &&
    f.fundSize >= filters.value.minFundSize
  )
  const sortKey = filters.value.sortBy
  if (sortKey === 'score') list.sort((a, b) => b.score - a.score)
  else if (sortKey === 'return3y') list.sort((a, b) => b.annualReturn3y - a.annualReturn3y)
  else if (sortKey === 'drawdown') list.sort((a, b) => a.maxDrawdown - b.maxDrawdown)
  else if (sortKey === 'sharpe') list.sort((a, b) => b.sharpeRatio - a.sharpeRatio)
  return list
})

// 判断是否属于稳健型基金类型
function isStableType(type) {
  if (!type) return false
  for (const excl of EXCLUDED_TYPES) {
    if (type.includes(excl)) return false
  }
  return type.includes('混合') || type.includes('债券')
}

// 从历史数据计算基金指标
function calcFundMetrics(history) {
  const netValues = history.map(h => h.netValue).filter(v => !isNaN(v) && v > 0)
  const accNetValues = history.map(h => h.accNetValue).filter(v => !isNaN(v) && v > 0)
  const dailyReturns = history.map(h => h.dailyReturn || 0).filter(r => r !== 0)
  if (netValues.length < 2) return null
  const annualReturn3y = calcAnnualizedReturn(netValues, 3)
  // 使用累计净值计算最大回撤
  const maxDrawdown = calcMaxDrawdown(accNetValues.length >= 2 ? accNetValues : netValues)
  const sharpeRatio = calcSharpeRatio(dailyReturns)
  // 排除极端异常值
  if (annualReturn3y > 500 || annualReturn3y < -100 || maxDrawdown < -99 || sharpeRatio > 20) return null
  return { annualReturn3y, maxDrawdown, sharpeRatio }
}

async function load() {
  loading.value = true
  // 创建新的 AbortController，自动取消上一次的请求
  const { signal } = getAbortSignal()
  try {
    console.log('[StableFundPanel] 开始加载稳健型基金数据...')

    // 步骤1: 用排名接口获取 3 年收益 top 300，作为粗筛候选池
    const rankData = await fetchRankDataStable(signal)
    if (signal.aborted) return
    console.log(`[StableFundPanel] 排名接口返回 ${rankData.length} 只基金`)

    // 步骤2: 获取基金基础信息，建 code→info 映射
    const allFunds = await fetchAllFunds(signal)
    if (signal.aborted) return
    const infoMap = new Map(allFunds.map(f => [f.code, f]))
    console.log(`[StableFundPanel] 基础信息 ${allFunds.length} 条`)

    // 步骤3: 从排名数据中取前 N*3 个做类型筛选，确保筛出足够候选
    const rawPool = rankData.slice(0, TOP_N * 3)
    let candidates = rawPool
      .filter(r => {
        const info = infoMap.get(r.code)
        return info && isStableType(info.type)
      })
      .slice(0, TOP_N)
      .map(r => ({
        code: r.code,
        name: r.name,
        type: infoMap.get(r.code)?.type || r.type
      }))

    console.log(`[StableFundPanel] 粗筛得到 ${candidates.length} 只候选，开始并行获取历史数据...`)

    if (candidates.length === 0) {
      ElMessage.warning('未找到符合条件的稳健型基金')
      return
    }

    // 步骤4: 并行批量获取历史净值（8 个并发）
    const batchResults = await fetchHistoryBatch(
      candidates.map(c => c.code),
      BATCH_CONCURRENCY,
      signal
    )
    if (signal.aborted) return

    // 步骤5: 计算指标 + 评分（使用真实经理年限和规模）
    const enriched = []
    for (const candidate of candidates) {
      const match = batchResults.find(b => b.code === candidate.code)
      if (!match || match.history.length < 100) continue
      const metrics = calcFundMetrics(match.history)
      if (!metrics) continue
      enriched.push({
        name: candidate.name,
        code: candidate.code,
        type: candidate.type,
        annualReturn3y: metrics.annualReturn3y,
        maxDrawdown: metrics.maxDrawdown,
        sharpeRatio: metrics.sharpeRatio,
        managerYears: match.managerYears || 0,
        fundSize: match.fundSize || 0
      })
    }

    console.log(`[StableFundPanel] 最终有效基金: ${enriched.length} 只`)
    const scored = computeScore(enriched)

    // 批量获取实时估值
    console.log(`[StableFundPanel] 开始获取 ${scored.length} 只基金实时估值...`)
    const estimates = await fetchEstimatesBatch(scored.map(f => f.code), 10, signal)
    if (signal.aborted) return
    const estimateMap = new Map(estimates.map(e => [e.code, e]))

    funds.value = scored.map(f => ({
      ...f,
      ...(estimateMap.get(f.code) || {})
    }))
    ElMessage.success(`已加载 ${funds.value.length} 只稳健型基金（含实时估值）`)
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.code === 20)) {
      console.log('[StableFundPanel] 请求已被取消')
    } else {
      console.error('[StableFundPanel] 加载失败:', e)
      ElMessage.error('加载稳健型数据失败，请检查代理配置')
    }
  } finally {
    loading.value = false
  }
}

function reset() {
  filters.value = { maxDrawdown: 30, minReturn: 5, minSharpe: 0.5, minManagerYear: 2, minFundSize: 2, sortBy: 'score' }
}

onMounted(() => {
  load()
})

onUnmounted(() => {
  // 离开页面时取消所有进行中的请求
  cancelAllRequests()
  console.log('[StableFundPanel] 组件已卸载，已取消所有请求')
})

defineExpose({ load })
</script>

<style scoped>
/* ========== 筛选卡片 ========== */
.filter-card {
  margin-bottom: 16px;
  border-radius: 16px;
  border: 1px solid #e8edf2;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  overflow: hidden;
}
.filter-card :deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
  background: #fafbfc;
}
.filter-card :deep(.el-card__body) { padding: 12px 16px; }

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e2a3a;
}
.filter-form { margin-top: 2px; }

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 12px;
}
.filter-grid :deep(.el-form-item) { margin-bottom: 8px; }
.filter-grid :deep(.el-form-item__label) {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: #4a627a;
  width: auto !important;
  justify-content: flex-start;
  padding-right: 4px;
}
.filter-grid :deep(.el-input-number) { width: 110px; }
.filter-grid :deep(.el-input-number .el-input__wrapper) {
  border-radius: 20px;
  box-shadow: 0 0 0 1px #dce5ec;
}
.filter-grid :deep(.el-select .el-input__wrapper) {
  border-radius: 20px;
  box-shadow: 0 0 0 1px #dce5ec;
}

.filter-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
.filter-actions :deep(.el-button) {
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.78rem;
  padding: 7px 20px;
}
.filter-actions :deep(.el-button--primary) {
  background: #10b981;
  border-color: #10b981;
  box-shadow: 0 2px 8px rgba(16,185,129,0.25);
}
.filter-actions :deep(.el-button--primary:hover) {
  background: #059669;
  border-color: #059669;
}

/* ========== PC端表格 ========== */
.pc-table { display: none; }
:deep(.pc-table.el-table) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0,0,0,0.05);
}
:deep(.pc-table .el-table__header th) {
  background: #fbfdff;
  color: #1e2f40;
  font-weight: 700;
  border-bottom: 2px solid #e8edf2;
  font-size: 0.78rem;
}
:deep(.pc-table .el-table__body tr:hover > td) {
  background: #f0fdf6 !important;
}
:deep(.pc-table .el-table__body td) {
  border-bottom: 1px solid #eff2f7;
}
:deep(.pc-table .el-tag--danger) {
  background: #fdeaea;
  color: #c0392b;
  border-color: transparent;
  font-weight: bold;
  border-radius: 20px;
}
:deep(.pc-table .el-tag--success) {
  background: #eaf7ea;
  color: #27ae60;
  border-color: transparent;
  border-radius: 20px;
}

@media (min-width: 768px) {
  .pc-table { display: block; }
  .filter-card { margin-bottom: 24px; border-radius: 20px; }
  .filter-card :deep(.el-card__header) { padding: 14px 20px; }
  .filter-card :deep(.el-card__body) { padding: 18px 20px; }
  .filter-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 8px 20px;
  }
  .filter-grid :deep(.el-input-number) { width: 130px; }
  .filter-grid :deep(.el-form-item__label) { font-size: 0.78rem; }
  .filter-actions :deep(.el-button) { font-size: 0.82rem; padding: 8px 24px; }
}

/* ========== 手机端卡片列表 ========== */
.mobile-card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
@media (min-width: 768px) {
  .mobile-card-list { display: none; }
}

.fund-card {
  border-radius: 16px;
  border: 1px solid #eef2f7;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  transition: all 0.2s ease;
}
.fund-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}
.fund-card :deep(.el-card__body) { padding: 14px 16px; }

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.card-code {
  font-size: 0.7rem;
  color: #94a3b8;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.card-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-body { margin-top: 10px; }
.card-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.card-row:last-child { margin-bottom: 0; }
.card-item {
  display: flex;
  align-items: center;
  gap: 3px;
}
.card-label {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 500;
}
.card-value {
  font-size: 0.78rem;
  font-weight: 600;
  color: #1e293b;
}
.quote-row {
  padding-bottom: 8px;
  border-bottom: 1px dashed #e8edf2;
}
.quote-row .card-item { flex: 1; min-width: 70px; }
.return-row .card-item { min-width: 60px; }
.meta-row .card-item { min-width: 55px; }

.fund-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.88rem;
}

.loading-tip { margin-top: 16px; }
</style>

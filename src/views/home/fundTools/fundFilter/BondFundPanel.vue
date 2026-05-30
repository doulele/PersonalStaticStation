<template>
  <div>
    <!-- 筛选条件卡片 -->
    <el-card class="filter-card">
      <template #header>
        <div class="filter-header">
          <span class="filter-title">🔍 债基筛选条件</span>
          <el-tag type="info" size="small">符合条件: {{ filteredList.length }} 只</el-tag>
        </div>
      </template>
      <el-form :model="filters" class="filter-form">
        <div class="filter-grid">
          <el-form-item label="最大回撤 ≤ (%)">
            <el-input-number v-model="filters.maxDrawdown" :min="0" :max="20" :step="0.5" :precision="1" size="small" controls-position="right" />
          </el-form-item>
          <el-form-item label="3年年化收益 ≥ (%)">
            <el-input-number v-model="filters.minReturn" :min="0" :max="30" :step="0.5" :precision="1" size="small" controls-position="right" />
          </el-form-item>
          <el-form-item label="夏普比率 ≥">
            <el-input-number v-model="filters.minSharpe" :min="-5" :max="10" :step="0.1" :precision="2" size="small" controls-position="right" />
          </el-form-item>
          <el-form-item label="规模 ≥ (亿元)">
            <el-input-number v-model="filters.minSize" :min="0" :max="200" :step="1" size="small" controls-position="right" />
          </el-form-item>
          <el-form-item label="成立年限 ≥ (年)">
            <el-input-number v-model="filters.minYears" :min="0" :max="30" :step="1" size="small" controls-position="right" />
          </el-form-item>
          <el-form-item label="排序依据">
            <el-select v-model="filters.sortBy" size="small" style="width:140px">
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
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag size="small" type="warning" effect="plain">{{ row.type }}</el-tag>
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
      <el-table-column prop="recoveryDays" label="回撤修复天数" sortable width="130">
        <template #default="{ row }">
          <span v-if="row.recoveryDays <= 0" style="color: #e74c3c">至今未修复</span>
          <span v-else :style="{ color: row.recoveryDays <= 90 ? '#27ae60' : row.recoveryDays <= 180 ? '#f39c12' : '#e74c3c' }">{{ row.recoveryDays }}天</span>
        </template>
      </el-table-column>
      <el-table-column prop="fundSize" label="规模(亿)" sortable width="100" />
      <el-table-column prop="fundYears" label="成立年限" sortable width="110">
        <template #default="{ row }"><span :style="{ color: row.fundYears >= 3 ? '#27ae60' : '#e74c3c' }">{{ row.fundYears.toFixed(1) }}年</span></template>
      </el-table-column>
      <el-table-column prop="score" label="综合评分" sortable width="120">
        <template #default="{ row }"><el-tag :type="row.score >= 50 ? 'success' : 'warning'" effect="dark" size="small">{{ row.score }}</el-tag></template>
      </el-table-column>
    </el-table>

    <!-- 手机端卡片列表 -->
    <div v-loading="loading" element-loading-text="努力加载中..." class="mobile-card-list">
      <el-card v-for="row in filteredList" :key="row.code" class="fund-card" shadow="hover">
        <div class="card-header">
          <div class="card-title-row">
            <span class="card-code">{{ row.code }}</span>
            <span class="card-name">{{ row.name }}</span>
            <el-tag size="small" type="warning" effect="plain">{{ row.type }}</el-tag>
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
            <div class="card-item">
              <span class="card-label">修复</span>
              <span class="card-value" v-if="row.recoveryDays <= 0" style="color:#e74c3c">未修复</span>
              <span class="card-value" v-else :style="{ color: row.recoveryDays <= 90 ? '#27ae60' : '#f39c12' }">{{ row.recoveryDays }}天</span>
            </div>
            <div class="card-item"><span class="card-label">规模</span><span class="card-value">{{ row.fundSize.toFixed(1) }}亿</span></div>
            <div class="card-item"><span class="card-label">年限</span><span class="card-value" :style="{ color: row.fundYears >= 3 ? '#27ae60' : '#e74c3c' }">{{ row.fundYears.toFixed(1) }}年</span></div>
            <div class="card-item">
              <el-tag :type="row.score >= 50 ? 'success' : 'warning'" size="small" effect="dark">评分 {{ row.score }}</el-tag>
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
  fetchAllFunds, fetchHistoryBatch, fetchRankDataBond, fetchEstimatesBatch,
  calcAnnualizedReturn, calcMaxDrawdown, calcSharpeRatio, norm, normInverse,
  getAbortSignal, cancelAllRequests
} from './utils.js'

// 需要排除的债基子类型
// 可转债波动接近股票，QDII涉及汇率，货币基金收益太低
const BOND_EXCLUDED = ['可转债', '转债', 'QDII', '美元', '货币']

// 债券型基金类型关键词
const BOND_TYPE_KEYWORDS = ['债券', '纯债', '中短债', '短债', '长债', '信用债', '利率债', '产业债', '定开债', '债基', '债券型']

const TOP_N = 80           // 候选池：从排名中取前80只债基做详细计算
const BATCH_CONCURRENCY = 8 // 并行请求并发数

// 判断是否属于纯债类型
function isBondType(type) {
  if (!type) return false
  for (const excl of BOND_EXCLUDED) {
    if (type.includes(excl)) return false
  }
  for (const kw of BOND_TYPE_KEYWORDS) {
    if (type.includes(kw)) return true
  }
  return false
}

// 去掉 C类/E类 等后缀，用于去重（同一只基金的A/C类，只保留A类）
function normalizeName(name) {
  return name.replace(/[A-Z]$/, '')
}

// 计算回撤修复天数：从净值序列中找到最大回撤发生点之后，净值重新回到回撤前峰值的所需天数
// 返回修复天数（若至今未修复返回-1）
function calcRecoveryDays(accNetValues) {
  if (accNetValues.length < 2) return -1
  let peak = accNetValues[0]
  let peakIdx = 0
  let maxDD = 0
  let ddStartIdx = -1  // 回撤开始位置（峰值的索引）
  let ddEndIdx = -1    // 回撤最低点索引

  for (let i = 1; i < accNetValues.length; i++) {
    if (accNetValues[i] > peak) {
      peak = accNetValues[i]
      peakIdx = i
    }
    const dd = (peak - accNetValues[i]) / peak
    if (dd > maxDD) {
      maxDD = dd
      ddStartIdx = peakIdx
      ddEndIdx = i
    }
  }

  if (ddStartIdx < 0 || ddEndIdx < 0 || maxDD < 0.001) return 0

  // 从最低点之后查找是否恢复到了回撤前的峰值
  const peakValue = accNetValues[ddStartIdx]
  for (let i = ddEndIdx + 1; i < accNetValues.length; i++) {
    if (accNetValues[i] >= peakValue) {
      return i - ddEndIdx  // 修复所需天数（数据点是按天排列的）
    }
  }
  return -1  // 至今未修复
}

// 从历史数据计算基金指标
function calcBondMetrics(history) {
  const netValues = history.map(h => h.netValue).filter(v => !isNaN(v) && v > 0)
  const accNetValues = history.map(h => h.accNetValue).filter(v => !isNaN(v) && v > 0)
  // 债基日收益可能为0（波动极小），不能过滤掉0值！
  const dailyReturns = history.map(h => {
    const r = h.dailyReturn
    return (r != null && !isNaN(r)) ? r : 0
  })
  if (netValues.length < 2) return null
  // 债基用近3年数据计算年化（数据不足3年则按实际数据算）
  const years = Math.min(3, netValues.length / 252)
  const annualReturn3y = calcAnnualizedReturn(netValues, years)
  // 使用累计净值计算最大回撤
  const maxDrawdown = calcMaxDrawdown(accNetValues.length >= 2 ? accNetValues : netValues)
  const sharpeRatio = calcSharpeRatio(dailyReturns)
  // 回撤修复天数
  const recoveryDays = calcRecoveryDays(accNetValues.length >= 2 ? accNetValues : netValues)
  // 排除极端异常值（债基回撤一般不超过20%）
  if (annualReturn3y > 50 || annualReturn3y < -50 || maxDrawdown < -20 || sharpeRatio > 20) return null
  return { annualReturn3y, maxDrawdown, sharpeRatio, recoveryDays }
}

// 综合评分计算
// 债基核心逻辑：回撤极小(最重要) > 收益稳定 > 夏普比率 > 修复快 > 规模适中 > 成立久
// 权重设计：
//   - 最大回撤 30%：债基回撤通常 0.5%~3%，回撤越小越好，这是最重要的指标
//   - 年化收益 25%：在同类债基中，长期年化越高越好
//   - 夏普比率 20%：每单位风险的超额回报，衡量收益质量
//   - 修复天数 15%：回撤后能否快速修复，代表基金韧性
//   - 规模      5%：规模适中（10-80亿）最优
//   - 成立年限  5%：成立3年以上更可靠
function computeBondScore(funds) {
  if (funds.length === 0) return funds
  const returns = funds.map(f => f.annualReturn3y)
  const drawdowns = funds.map(f => f.maxDrawdown)
  const sharpes = funds.map(f => f.sharpeRatio)
  const recoveries = funds.map(f => f.recoveryDays)
  return funds.map(f => {
    // 修复天数评分：归一化（越小越好），未修复的给最低分
    let recoveryScore
    if (f.recoveryDays <= 0) {
      recoveryScore = 0  // 至今未修复，0分
    } else {
      // 90天内修复 → 接近满分；超过365天 → 接近0分
      recoveryScore = Math.max(0, 1 - f.recoveryDays / 365)
    }
    return {
      ...f,
      score: Math.round(
        normInverse(drawdowns, f.maxDrawdown) * 30 +  // 回撤越小越好
        norm(returns, f.annualReturn3y) * 25 +         // 收益越高越好
        norm(sharpes, f.sharpeRatio) * 20 +             // 夏普越高越好
        recoveryScore * 15 +                            // 修复越快越好
        // 规模：10-80亿最优（太小清盘风险，太大影响操作灵活性）
        (f.fundSize >= 10 && f.fundSize <= 80 ? 5 : f.fundSize >= 5 ? 3 : f.fundSize >= 1 ? 1 : 0) +
        // 成立年限：5年以上 +5分，3-5年 +3分，1-3年 +1分
        (f.fundYears >= 5 ? 5 : f.fundYears >= 3 ? 3 : f.fundYears >= 1 ? 1 : 0)
      )
    }
  })
}

const funds = ref([])
const loading = ref(false)
const filters = ref({
  maxDrawdown: 5,       // 默认最大回撤≤5%（债基通常很稳）
  minReturn: 2.5,       // 默认年化≥2.5%
  minSharpe: 0.5,       // 默认夏普≥0.5（债基夏普通常在0.5-2之间）
  minSize: 1,           // 默认规模≥1亿
  minYears: 2,          // 默认成立≥2年
  sortBy: 'score'
})

const filteredList = computed(() => {
  let list = funds.value.filter(f =>
    f.maxDrawdown >= -filters.value.maxDrawdown &&
    f.annualReturn3y >= filters.value.minReturn &&
    f.sharpeRatio >= filters.value.minSharpe &&
    f.fundSize >= filters.value.minSize &&
    f.fundYears >= filters.value.minYears
  )
  const sortKey = filters.value.sortBy
  if (sortKey === 'score') list.sort((a, b) => b.score - a.score)
  else if (sortKey === 'return3y') list.sort((a, b) => b.annualReturn3y - a.annualReturn3y)
  else if (sortKey === 'drawdown') list.sort((a, b) => a.maxDrawdown - b.maxDrawdown)
  else if (sortKey === 'sharpe') list.sort((a, b) => b.sharpeRatio - a.sharpeRatio)
  return list
})

async function load() {
  loading.value = true
  const { signal } = getAbortSignal()
  try {
    console.log('[BondFundPanel] 开始加载债基数据...')

    // 步骤1: 用排名接口获取近3年收益 top 300（限定债券型）
    const rankData = await fetchRankDataBond(signal)
    if (signal.aborted) return
    console.log(`[BondFundPanel] 排名接口返回 ${rankData.length} 只基金`)

    // 步骤2: 获取基金基础信息，建 code→info 映射（用于类型筛选）
    const allFunds = await fetchAllFunds(signal)
    if (signal.aborted) return
    const infoMap = new Map(allFunds.map(f => [f.code, f]))
    console.log(`[BondFundPanel] 基础信息 ${allFunds.length} 条`)

    // 步骤3: 类型筛选 + 去重，只保留纯债类，同基金优先A类
    const candidatesRaw = rankData
      .filter(r => {
        const info = infoMap.get(r.code)
        return info && isBondType(info.type)
      })
      .map(r => ({
        code: r.code,
        name: r.name,
        type: infoMap.get(r.code)?.type || r.type,
        baseName: normalizeName(r.name)  // 去后缀用于去重
      }))

    // 去重：同名基金优先保留A类份额（如"广发集嘉债券A" vs "广发集嘉债券C"）
    const seenNames = new Map()
    for (const f of candidatesRaw) {
      const existing = seenNames.get(f.baseName)
      if (!existing) {
        seenNames.set(f.baseName, f)
      } else {
        // 如果已存在的是C类，新来的是A类，替换
        if (existing.name.endsWith('C') && f.name.endsWith('A')) {
          seenNames.set(f.baseName, f)
        }
      }
    }

    let candidates = Array.from(seenNames.values()).slice(0, TOP_N)

    console.log(`[BondFundPanel] 类型筛选后候选: ${candidates.length} 只`)

    if (candidates.length === 0) {
      const sampleTypes = rankData.slice(0, 20).map(r => {
        const info = infoMap.get(r.code)
        return `${r.code}:${info?.type || '未知'}`
      })
      console.error(`[BondFundPanel] 无候选基金！样本类型:`, sampleTypes)
      ElMessage.warning('未找到符合条件的纯债基金')
      return
    }

    // 步骤4: 并行批量获取历史净值
    const batchResults = await fetchHistoryBatch(
      candidates.map(c => c.code),
      BATCH_CONCURRENCY,
      signal
    )
    if (signal.aborted) return

    // 步骤5: 计算指标 + 评分
    const enriched = []
    for (const candidate of candidates) {
      const match = batchResults.find(b => b.code === candidate.code)
      if (!match || match.history.length < 50) continue  // 至少50个交易日
      const metrics = calcBondMetrics(match.history)
      if (!metrics) continue

      // 计算成立年限
      let fundYears = 0
      if (match.establishedDate) {
        const est = new Date(match.establishedDate)
        const now = new Date()
        fundYears = (now - est) / (365.25 * 24 * 60 * 60 * 1000)
      } else if (match.history.length > 0) {
        const firstDate = new Date(match.history[0].date)
        const now = new Date()
        fundYears = (now - firstDate) / (365.25 * 24 * 60 * 60 * 1000)
      }

      enriched.push({
        name: candidate.name,
        code: candidate.code,
        type: candidate.type,
        annualReturn3y: metrics.annualReturn3y,
        maxDrawdown: metrics.maxDrawdown,
        sharpeRatio: metrics.sharpeRatio,
        recoveryDays: metrics.recoveryDays,
        fundSize: match.fundSize || 0,
        fundYears
      })
    }

    console.log(`[BondFundPanel] 最终有效基金: ${enriched.length} 只`)
    if (enriched.length === 0) {
      console.error('[BondFundPanel] enriched 为空！可能原因: calcBondMetrics 返回 null 或 history 不足50条')
      ElMessage.warning('计算指标后无有效基金，请放宽筛选条件')
      return
    }
    const scored = computeBondScore(enriched)
    console.log(`[BondFundPanel] 评分完成，最高分: ${Math.max(...scored.map(s => s.score))}, 最低分: ${Math.min(...scored.map(s => s.score))}`)

    // 批量获取实时估值
    console.log(`[BondFundPanel] 开始获取 ${scored.length} 只基金实时估值...`)
    const estimates = await fetchEstimatesBatch(scored.map(f => f.code), 10, signal)
    if (signal.aborted) return
    const estimateMap = new Map(estimates.map(e => [e.code, e]))

    funds.value = scored.map(f => ({
      ...f,
      ...(estimateMap.get(f.code) || {})
    }))
    ElMessage.success(`已加载 ${funds.value.length} 只纯债基金（含实时估值）`)
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.code === 20)) {
      console.log('[BondFundPanel] 请求已被取消')
    } else {
      console.error('[BondFundPanel] 加载失败:', e)
      ElMessage.error('加载债基数据失败，请检查代理配置')
    }
  } finally {
    loading.value = false
  }
}

function reset() {
  filters.value = { maxDrawdown: 5, minReturn: 2.5, minSharpe: 0.5, minSize: 1, minYears: 2, sortBy: 'score' }
}

onMounted(() => {
  load()
})

onUnmounted(() => {
  cancelAllRequests()
  console.log('[BondFundPanel] 组件已卸载，已取消所有请求')
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
  background: #e6a23c;
  border-color: #e6a23c;
  box-shadow: 0 2px 8px rgba(230,162,60,0.25);
}
.filter-actions :deep(.el-button--primary:hover) {
  background: #d4922c;
  border-color: #d4922c;
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
  background: #fef9f0 !important;
}
:deep(.pc-table .el-table__body td) {
  border-bottom: 1px solid #eff2f7;
}
:deep(.pc-table .el-tag--success) {
  background: #eaf7ea;
  color: #27ae60;
  border-color: transparent;
  font-weight: bold;
  border-radius: 20px;
}
:deep(.pc-table .el-tag--warning) {
  background: #fef0d5;
  color: #b87a14;
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

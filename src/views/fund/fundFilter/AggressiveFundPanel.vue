<template>
  <div>
    <!-- 筛选条件卡片 -->
    <el-card class="filter-card">
      <template #header>
        <div class="filter-header">
          <span>🔥 进取筛选条件 & 排序</span>
          <el-tag type="info" size="small">符合条件: {{ filteredList.length }} 只</el-tag>
        </div>
      </template>
      <el-form :model="filters" class="filter-form">
        <div class="filter-grid">
          <el-form-item label="近3月收益 ≥ (%)">
            <el-input-number v-model="filters.min3m" :min="0" :max="200" :step="2" size="small" controls-position="right" />
          </el-form-item>
          <el-form-item label="近1年收益 ≥ (%)">
            <el-input-number v-model="filters.min1y" :min="0" :max="500" :step="5" size="small" controls-position="right" />
          </el-form-item>
          <el-form-item label="最大回撤 ≤ (%)">
            <el-input-number v-model="filters.maxDrawdown" :min="0" :max="80" :step="2" size="small" controls-position="right" />
          </el-form-item>
          <el-form-item label="规模 ≥ (亿元)">
            <el-input-number v-model="filters.minSize" :min="0" :max="200" :step="1" size="small" controls-position="right" />
          </el-form-item>
          <el-form-item label="成立年限 ≥ (年)">
            <el-input-number v-model="filters.minYears" :min="0" :max="30" :step="1" size="small" controls-position="right" />
          </el-form-item>
          <el-form-item label="排序依据">
            <el-select v-model="filters.sortBy" size="small" style="width:130px">
              <el-option label="势头改善分 ↓" value="momentumScore" />
              <el-option label="近3月收益 ↓" value="ret3m" />
              <el-option label="近1年收益 ↓" value="ret1y" />
              <el-option label="进取综合分 ↓" value="aggScore" />
            </el-select>
          </el-form-item>
        </div>
        <div class="filter-actions">
          <el-button type="primary" size="small" @click="load" :loading="loading">刷新数据</el-button>
          <el-button size="small" @click="reset">重置筛选</el-button>
        </div>
      </el-form>
    </el-card>

    <!-- PC端表格 -->
    <el-table v-loading="loading" element-loading-text="努力加载中..." :data="filteredList" stripe border class="pc-table">
      <el-table-column prop="code" label="编号" width="75" fixed />
      <el-table-column prop="name" label="基金名称" min-width="150" fixed show-overflow-tooltip />
      <el-table-column prop="theme" label="类型" width="75" />
      <el-table-column prop="dwjz" label="净值" width="85" sortable>
        <template #default="{ row }">{{ row.dwjz ? row.dwjz.toFixed(4) : '--' }}</template>
      </el-table-column>
      <el-table-column prop="gsz" label="估值" width="85" sortable>
        <template #default="{ row }">
          <span :style="{ color: (row.gszzl || 0) >= 0 ? '#f56c6c' : '#67c23a' }">{{ row.gsz ? row.gsz.toFixed(4) : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="gszzl" label="涨幅" width="85" sortable>
        <template #default="{ row }">
          <span :style="{ color: (row.gszzl || 0) >= 0 ? '#f56c6c' : '#67c23a', fontWeight: 'bold' }">{{ row.gszzl != null ? (row.gszzl >= 0 ? '+' : '') + row.gszzl.toFixed(2) + '%' : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="ret1m" label="近1月" sortable width="70">
        <template #default="{ row }"><span :style="{ color: row.ret1m >= 0 ? '#f56c6c' : '#67c23a' }">{{ row.ret1m.toFixed(1) }}%</span></template>
      </el-table-column>
      <el-table-column prop="ret3m" label="近3月" sortable width="70">
        <template #default="{ row }"><span :style="{ color: row.ret3m >= 0 ? '#f56c6c' : '#67c23a' }">{{ row.ret3m.toFixed(1) }}%</span></template>
      </el-table-column>
      <el-table-column prop="ret6m" label="近6月" sortable width="70">
        <template #default="{ row }"><span :style="{ color: row.ret6m >= 0 ? '#f56c6c' : '#67c23a' }">{{ row.ret6m.toFixed(1) }}%</span></template>
      </el-table-column>
      <el-table-column prop="ret1y" label="近1年" sortable width="70">
        <template #default="{ row }"><span :style="{ color: row.ret1y >= 0 ? '#f56c6c' : '#67c23a' }">{{ row.ret1y.toFixed(1) }}%</span></template>
      </el-table-column>
      <el-table-column prop="maxDrawdown" label="最大回撤" sortable width="85">
        <template #default="{ row }"><span :style="{ color: (row.maxDrawdown || 0) >= 0 ? '#f56c6c' : '#67c23a' }">{{ (row.maxDrawdown || 0).toFixed(1) }}%</span></template>
      </el-table-column>
      <el-table-column prop="fundSize" label="规模(亿)" width="80" sortable />
      <el-table-column prop="fundYears" label="成立年限" sortable width="80">
        <template #default="{ row }"><span :style="{ color: row.fundYears < 3 ? '#27ae60' : '#e74c3c' }">{{ row.fundYears.toFixed(1) }}年</span></template>
      </el-table-column>
      <el-table-column prop="momentumScore" label="势头改善" sortable width="85">
        <template #default="{ row }"><el-tag :type="row.momentumScore >= 0 ? 'danger' : 'success'" size="small">{{ row.momentumScore }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="aggScore" label="综合分" sortable width="75">
        <template #default="{ row }"><el-tag :type="row.aggScore >= 0 ? 'danger' : 'success'" size="small">{{ row.aggScore }}</el-tag></template>
      </el-table-column>
    </el-table>

    <!-- 手机端卡片列表 -->
    <div v-loading="loading" element-loading-text="努力加载中..." class="mobile-card-list">
      <el-card v-for="row in filteredList" :key="row.code" class="fund-card" shadow="hover">
        <div class="card-header">
          <div class="card-title-row">
            <span class="card-code">{{ row.code }}</span>
            <span class="card-name">{{ row.name }}</span>
            <el-tag size="small" type="info" effect="plain">{{ row.theme }}</el-tag>
            <el-tag :type="row.momentumScore >= 0 ? 'danger' : 'success'" size="small" effect="dark" class="score-tag">势头 {{ row.momentumScore }}</el-tag>
          </div>
        </div>
        <div class="card-body">
          <div class="card-row quote-row">
            <div class="card-item">
              <span class="card-label">净值</span>
              <span class="card-value">{{ row.dwjz ? row.dwjz.toFixed(4) : '--' }}</span>
            </div>
            <div class="card-item">
              <span class="card-label">估值</span>
              <span class="card-value" :style="{ color: (row.gszzl || 0) >= 0 ? '#f56c6c' : '#67c23a' }">{{ row.gsz ? row.gsz.toFixed(4) : '--' }}</span>
            </div>
            <div class="card-item">
              <span class="card-label">涨幅</span>
              <span class="card-value" :style="{ color: (row.gszzl || 0) >= 0 ? '#f56c6c' : '#67c23a', fontWeight: 'bold' }">{{ row.gszzl != null ? (row.gszzl >= 0 ? '+' : '') + row.gszzl.toFixed(2) + '%' : '--' }}</span>
            </div>
          </div>
          <div class="card-row return-row">
            <div class="card-item"><span class="card-label">近1月</span><span class="card-value" :style="{ color: row.ret1m >= 0 ? '#f56c6c' : '#67c23a' }">{{ row.ret1m.toFixed(1) }}%</span></div>
            <div class="card-item"><span class="card-label">近3月</span><span class="card-value" :style="{ color: row.ret3m >= 0 ? '#f56c6c' : '#67c23a' }">{{ row.ret3m.toFixed(1) }}%</span></div>
            <div class="card-item"><span class="card-label">近6月</span><span class="card-value" :style="{ color: row.ret6m >= 0 ? '#f56c6c' : '#67c23a' }">{{ row.ret6m.toFixed(1) }}%</span></div>
            <div class="card-item"><span class="card-label">近1年</span><span class="card-value" :style="{ color: row.ret1y >= 0 ? '#f56c6c' : '#67c23a' }">{{ row.ret1y.toFixed(1) }}%</span></div>
          </div>
          <div class="card-row meta-row">
            <div class="card-item"><span class="card-label">回撤</span><span class="card-value" :style="{ color: (row.maxDrawdown || 0) >= 0 ? '#f56c6c' : '#67c23a' }">{{ (row.maxDrawdown || 0).toFixed(1) }}%</span></div>
            <div class="card-item"><span class="card-label">规模</span><span class="card-value">{{ row.fundSize.toFixed(1) }}亿</span></div>
            <div class="card-item"><span class="card-label">年限</span><span class="card-value" :style="{ color: row.fundYears < 3 ? '#27ae60' : '#e74c3c' }">{{ row.fundYears.toFixed(1) }}年</span></div>
            <div class="card-item">
              <el-tag :type="row.aggScore >= 0 ? 'danger' : 'success'" size="small" effect="dark">综合 {{ row.aggScore }}</el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchAllFunds, fetchRankData, fetchHistoryBatch, fetchEstimatesBatch, calcMaxDrawdown, norm, normInverse, getAbortSignal, cancelAllRequests } from './utils.js'

// 势头改善分：近1月收益动量(40%) + 近3月相对近6月加速度(30%) + 近1月排名变化分(30%)
// 注：排名变化分数据暂缺，权重按比例重分配为 60% 动量 + 40% 加速度
function computeMomentumScores(funds) {
  const ret1mArr = funds.map(f => f.ret1m)
  const accArr = funds.map(f => f.ret3m - (f.ret6m || f.ret3m * 0.6))
  return funds.map(f => Math.round(
    (norm(ret1mArr, f.ret1m) * 0.6 +
     norm(accArr, f.ret3m - (f.ret6m || f.ret3m * 0.6)) * 0.4) * 100
  ))
}

// 进取综合分
function computeAggressiveScores(funds) {
  const ret3mArr = funds.map(f => f.ret3m)
  const ret1yArr = funds.map(f => f.ret1y)
  const ddArr = funds.map(f => f.maxDrawdown)
  const sizeArr = funds.map(f => f.fundSize)
  return funds.map(f => Math.round(
    (norm(ret3mArr, f.ret3m) * 0.4 +
     norm(ret1yArr, f.ret1y) * 0.3 +
     normInverse(ddArr, f.maxDrawdown) * 0.15 +
     norm(sizeArr, f.fundSize) * 0.1 +
     0.05) * 100
  ))
}

const funds = ref([])
const loading = ref(false)
const filters = ref({
  min3m: 10,
  min1y: 30,
  maxDrawdown: 55,
  minSize: 1,
  minYears: 1,
  sortBy: 'momentumScore'
})

const filteredList = computed(() => {
  let list = funds.value.filter(f =>
    f.ret3m >= filters.value.min3m &&
    f.ret1y >= filters.value.min1y &&
    f.maxDrawdown >= -filters.value.maxDrawdown &&
    f.fundSize >= filters.value.minSize &&
    f.fundYears >= filters.value.minYears
  )
  const sortKey = filters.value.sortBy
  if (sortKey === 'momentumScore') list.sort((a, b) => b.momentumScore - a.momentumScore)
  else if (sortKey === 'ret3m') list.sort((a, b) => b.ret3m - a.ret3m)
  else if (sortKey === 'ret1y') list.sort((a, b) => b.ret1y - a.ret1y)
  else if (sortKey === 'aggScore') list.sort((a, b) => b.aggScore - a.aggScore)
  return list
})

async function load() {
  loading.value = true
  // 创建新的 AbortController，自动取消上一次的请求
  const { signal } = getAbortSignal()
  try {
    console.log('[AggressiveFundPanel] 开始加载进取型基金数据...')
    const rankData = await fetchRankData(signal)
    if (signal.aborted) return
    console.log(`[AggressiveFundPanel] 获取到 ${rankData.length} 条排名数据`)
    const allFunds = await fetchAllFunds(signal)
    if (signal.aborted) return
    console.log(`[AggressiveFundPanel] 获取到 ${allFunds.length} 只基金基础数据`)
    const fundMap = new Map(allFunds.map(f => [f.code, f]))
    const enriched = rankData.map(rank => {
      const basic = fundMap.get(rank.code) || {}
      return {
        name: rank.name,
        code: rank.code,
        theme: basic.type || rank.type,
        ret3m: rank.return3m,
        ret1y: rank.return1y,
        ret1m: rank.return1m || 0,        // 排名接口真实近1月收益
        ret6m: rank.return6m || 0,        // 排名接口真实近6月收益
        maxDrawdown: 0,                   // 待从历史净值计算
        fundSize: rank.fundSize
      }
    })
    console.log(`[AggressiveFundPanel] 合并后得到 ${enriched.length} 只基金`)

    // 获取历史净值，用累计净值计算真实最大回撤
    const TOP_N = Math.min(enriched.length, 50) // 进取型取前50只计算回撤即可
    const topFunds = enriched.slice(0, TOP_N)
    console.log(`[AggressiveFundPanel] 开始获取前 ${TOP_N} 只基金历史净值计算回撤...`)
    const batchResults = await fetchHistoryBatch(topFunds.map(f => f.code), 5, signal)
    if (signal.aborted) return
    const historyMap = new Map()
    const fundYearsMap = new Map()
    for (const result of batchResults) {
      if (result.history && result.history.length >= 50) {
        const accValues = result.history.map(h => h.accNetValue).filter(v => !isNaN(v) && v > 0)
        if (accValues.length >= 2) {
          historyMap.set(result.code, calcMaxDrawdown(accValues))
        }
      }
      // 计算成立年限
      let years = 0
      if (result.establishedDate) {
        const est = new Date(result.establishedDate)
        const now = new Date()
        years = (now - est) / (365.25 * 24 * 60 * 60 * 1000)
      } else if (result.history && result.history.length > 0) {
        const firstDate = new Date(result.history[0].date)
        const now = new Date()
        years = (now - firstDate) / (365.25 * 24 * 60 * 60 * 1000)
      }
      fundYearsMap.set(result.code, years)
    }
    // 回填真实回撤和成立年限
    for (const fund of enriched) {
      if (historyMap.has(fund.code)) {
        fund.maxDrawdown = historyMap.get(fund.code)
      }
      fund.fundYears = fundYearsMap.get(fund.code) || 0
    }
    console.log(`[AggressiveFundPanel] 已计算 ${historyMap.size} 只基金真实回撤和成立年限`)

    // 批量获取实时估值
    const codes = enriched.map(f => f.code)
    console.log(`[AggressiveFundPanel] 开始获取 ${codes.length} 只基金实时估值...`)
    const estimates = await fetchEstimatesBatch(codes, 10, signal)
    if (signal.aborted) return
    const estimateMap = new Map(estimates.map(e => [e.code, e]))

    const momentum = computeMomentumScores(enriched)
    const aggScore = computeAggressiveScores(enriched)
    funds.value = enriched.map((f, idx) => ({
      ...f,
      ...(estimateMap.get(f.code) || {}),
      momentumScore: momentum[idx],
      aggScore: aggScore[idx]
    }))
    console.log(`[AggressiveFundPanel] 最终有效基金: ${funds.value.length} 只`)
    ElMessage.success(`已加载 ${funds.value.length} 只进取型基金（含实时估值）`)
  } catch (e) {
    if (e && (e.name === 'AbortError' || e.code === 20)) {
      console.log('[AggressiveFundPanel] 请求已被取消')
    } else {
      console.error('[AggressiveFundPanel] 加载失败:', e)
      ElMessage.error('加载进取型数据失败，请检查代理配置')
    }
  } finally {
    loading.value = false
  }
}

function reset() {
  filters.value = { min3m: 10, min1y: 30, maxDrawdown: 55, minSize: 1, minYears: 1, sortBy: 'momentumScore' }
}

defineExpose({ load })

onMounted(() => {
  load()
})

onUnmounted(() => {
  // 离开页面时取消所有进行中的请求
  cancelAllRequests()
  console.log('[AggressiveFundPanel] 组件已卸载，已取消所有请求')
})
</script>

<style scoped src="./AggressiveFundPanel.scss"></style>

<template>
  <div class="stock-filter-page fade-in">
    <!-- 个股速查快捷入口 -->
    <div class="quick-eval-bar">
      <div class="quick-eval-inner">
        <div class="quick-eval-left">
          <el-icon :size="22"><Search /></el-icon>
          <span class="quick-eval-title">个股速查</span>
          <span class="quick-eval-desc">输入代码直接查看详情</span>
        </div>
        <div class="quick-eval-right">
          <el-input
            v-model="evalCode"
            placeholder="输入股票代码，如 600519"
            size="default"
            clearable
            @keyup.enter="goDetailByCode"
            class="eval-input"
          />
          <el-button type="success" @click="goDetailByCode" :disabled="!evalCode.trim()">
            <el-icon><View /></el-icon> 查看
          </el-button>
        </div>
      </div>
    </div>

    <!-- 条件筛选区 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-grid">
        <div class="cond-item">
          <label>最新价(元)</label>
          <div class="cond-range">
            <el-input-number v-model="cond.priceMin" :min="0" :max="5000" :controls="false" :value-on-clear="null" placeholder="最低" />
            <span class="cond-sep">~</span>
            <el-input-number v-model="cond.priceMax" :min="0" :max="5000" :controls="false" :value-on-clear="null" placeholder="最高" />
          </div>
        </div>
        <div class="cond-item">
          <label>涨跌幅(%)</label>
          <div class="cond-range">
            <el-input-number v-model="cond.changeMin" :min="-50" :max="50" :controls="false" :value-on-clear="null" placeholder="最低" />
            <span class="cond-sep">~</span>
            <el-input-number v-model="cond.changeMax" :min="-50" :max="50" :controls="false" :value-on-clear="null" placeholder="最高" />
          </div>
        </div>
        <div class="cond-item">
          <label>换手率(%)</label>
          <div class="cond-range">
            <el-input-number v-model="cond.turnoverMin" :min="0" :max="100" :controls="false" :value-on-clear="null" placeholder="最低" />
            <span class="cond-sep">~</span>
            <el-input-number v-model="cond.turnoverMax" :min="0" :max="100" :controls="false" :value-on-clear="null" placeholder="最高" />
          </div>
        </div>
        <div class="cond-item">
          <label>量比</label>
          <div class="cond-range">
            <el-input-number v-model="cond.volMin" :min="0" :max="30" :controls="false" :value-on-clear="null" placeholder="最低" />
            <span class="cond-sep">~</span>
            <el-input-number v-model="cond.volMax" :min="0" :max="30" :controls="false" :value-on-clear="null" placeholder="最高" />
          </div>
        </div>
        <div class="cond-item">
          <label>总市值(亿)</label>
          <div class="cond-range">
            <el-input-number v-model="cond.capMin" :min="0" :max="50000" :controls="false" :value-on-clear="null" placeholder="最低" />
            <span class="cond-sep">~</span>
            <el-input-number v-model="cond.capMax" :min="0" :max="50000" :controls="false" :value-on-clear="null" placeholder="最高" />
          </div>
        </div>
        <div class="cond-item">
          <label>成交额(亿)</label>
          <div class="cond-range">
            <el-input-number v-model="cond.amountMin" :min="0" :max="10000" :controls="false" :value-on-clear="null" placeholder="最低" />
            <span class="cond-sep">~</span>
            <el-input-number v-model="cond.amountMax" :min="0" :max="10000" :controls="false" :value-on-clear="null" placeholder="最高" />
          </div>
        </div>
        <div class="cond-item">
          <label>动态PE</label>
          <div class="cond-range">
            <el-input-number v-model="cond.peMin" :min="-5000" :max="5000" :controls="false" :value-on-clear="null" placeholder="最低" />
            <span class="cond-sep">~</span>
            <el-input-number v-model="cond.peMax" :min="-5000" :max="5000" :controls="false" :value-on-clear="null" placeholder="最高" />
          </div>
        </div>
        <div class="cond-item">
          <label>市净率PB</label>
          <div class="cond-range">
            <el-input-number v-model="cond.pbMin" :min="0" :max="100" :controls="false" :value-on-clear="null" placeholder="最低" />
            <span class="cond-sep">~</span>
            <el-input-number v-model="cond.pbMax" :min="0" :max="100" :controls="false" :value-on-clear="null" placeholder="最高" />
          </div>
        </div>
      </div>

      <div class="cond-switches">
        <el-checkbox v-model="cond.excludeST">排除 ST / *ST</el-checkbox>
        <el-checkbox v-model="cond.excludeLoss">排除亏损股（PE&lt;0）</el-checkbox>
        <div class="filter-actions">
          <el-button type="success" @click="refreshAll" :loading="loading">
            <el-icon><Search /></el-icon> 开始筛选
          </el-button>
          <el-button @click="resetAll">重置</el-button>
        </div>
      </div>

      <div class="quick-stocks">
        <el-radio-group v-model="selectedBoard" size="small" @change="switchBoard">
          <el-radio-button value="all">全A股</el-radio-button>
          <el-radio-button value="sh">上证主板</el-radio-button>
          <el-radio-button value="sz">深证主板</el-radio-button>
          <el-radio-button value="cyb">创业板</el-radio-button>
          <el-radio-button value="kcb">科创板</el-radio-button>
        </el-radio-group>
        <span class="board-info" v-if="stockCount > 0">
          共 <strong>{{ stockCount }}</strong> 只股票
        </span>
      </div>
    </el-card>

    <!-- 结果表格区域 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <span class="table-title"><el-icon><DataLine /></el-icon> 筛选结果（共 {{ filteredData.length }} 只）</span>
          <div class="table-header-right">
            <el-tag type="success" size="small" effect="plain">实时行情 · 前端过滤</el-tag>
          </div>
        </div>
      </template>

      <div v-if="!loading && filteredData.length === 0" class="empty-state">
        <el-empty description="暂无筛选结果" :image-size="100">
          <template #description>
            <p class="empty-desc">当前筛选条件下没有匹配的股票</p>
            <p class="empty-hint">请尝试放宽条件、关闭排除项或切换板块</p>
          </template>
          <el-button type="success" @click="resetAll">重置条件</el-button>
        </el-empty>
      </div>

      <el-table
        v-else
        :data="pagedData"
        v-loading="loading"
        element-loading-text="正在获取实时行情..."
        element-loading-background="rgba(255,255,255,0.7)"
        stripe
        class="pc-table"
        :default-sort="{ prop: 'amountYi', order: 'descending' }"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="code" label="代码" width="90" sortable="custom" fixed />
        <el-table-column prop="name" label="名称" min-width="90" fixed>
          <template #default="{ row }">
            <span :class="{ 'name-st': row.isST }">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="最新价" width="90" sortable="custom">
          <template #default="{ row }">
            <span :class="row.changePct >= 0 ? 'text-up' : 'text-down'">{{ row.price.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="changePct" label="涨跌幅" width="90" sortable="custom" align="right">
          <template #default="{ row }">
            <span :class="row.changePct >= 0 ? 'text-up' : 'text-down'">
              {{ row.changePct >= 0 ? '+' : '' }}{{ row.changePct.toFixed(2) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="turnover" label="换手率" width="90" sortable="custom" align="right">
          <template #default="{ row }">
            {{ row.turnover.toFixed(2) }}%
          </template>
        </el-table-column>
        <el-table-column prop="volRatio" label="量比" width="80" sortable="custom" align="right">
          <template #default="{ row }">
            <span :class="row.volRatio >= 1.5 ? 'text-warn' : ''">{{ row.volRatio.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="amountYi" label="成交额(亿)" width="100" sortable="custom" align="right">
          <template #default="{ row }">
            {{ row.amountYi.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalCapYi" label="总市值(亿)" width="100" sortable="custom" align="right">
          <template #default="{ row }">
            {{ row.totalCapYi.toFixed(1) }}
          </template>
        </el-table-column>
        <el-table-column prop="pe" label="动态PE" width="90" sortable="custom" align="right">
          <template #default="{ row }">
            <span v-if="row.pe === null">-</span>
            <span v-else-if="row.pe < 0" class="text-down">亏损</span>
            <span v-else>{{ row.pe.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="pb" label="PB" width="80" sortable="custom" align="right">
          <template #default="{ row }">
            <span v-if="row.pb === null">-</span>
            <span v-else>{{ row.pb.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="goDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 移动端卡片 -->
      <div v-if="!loading && filteredData.length > 0" class="mobile-card-list">
        <el-card
          v-for="row in pagedData"
          :key="row.code"
          class="stock-card"
          shadow="never"
          @click="goDetail(row)"
        >
          <div class="card-top">
            <div class="card-code-name">
              <span class="card-code">{{ row.code }}</span>
              <span class="card-name" :class="{ 'name-st': row.isST }">{{ row.name }}</span>
            </div>
            <el-tag :type="row.changePct >= 0 ? 'danger' : 'success'" size="small" effect="dark">
              {{ row.changePct >= 0 ? '+' : '' }}{{ row.changePct.toFixed(2) }}%
            </el-tag>
          </div>
          <div class="card-price-row">
            <span class="card-price" :class="row.changePct >= 0 ? 'text-up' : 'text-down'">{{ row.price.toFixed(2) }}</span>
            <span class="card-cap">市值 {{ row.totalCapYi.toFixed(1) }}亿</span>
          </div>
          <div class="card-metrics">
            <div class="card-metric">
              <span class="metric-label">换手率</span>
              <span class="metric-value">{{ row.turnover.toFixed(2) }}%</span>
            </div>
            <div class="card-metric">
              <span class="metric-label">量比</span>
              <span class="metric-value">{{ row.volRatio.toFixed(2) }}</span>
            </div>
            <div class="card-metric">
              <span class="metric-label">成交额</span>
              <span class="metric-value">{{ row.amountYi.toFixed(2) }}亿</span>
            </div>
            <div class="card-metric">
              <span class="metric-label">PE / PB</span>
              <span class="metric-value">
                {{ row.pe === null ? '-' : row.pe.toFixed(1) }} / {{ row.pb === null ? '-' : row.pb.toFixed(1) }}
              </span>
            </div>
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

    <div class="footer-note">
      <el-icon><InfoFilled /></el-icon>
      支持价格 / 涨跌幅 / 换手率 / 量比 / 总市值 / 成交额 / 动态PE / 市净率 多条件自由组合，数据实时获取自东方财富行情，请理性参考。
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, View, DataLine, InfoFilled } from '@element-plus/icons-vue'

const router = useRouter()

// ==================== 板块配置 ====================
const BOARD_FS = {
  all: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
  sh: 'm:1+t:2',
  sz: 'm:0+t:6',
  cyb: 'm:0+t:80',
  kcb: 'm:1+t:23'
}
const BOARD_NAMES = { all: '全A股', sh: '上证主板', sz: '深证主板', cyb: '创业板', kcb: '科创板' }

// ==================== 筛选状态 ====================
const cond = ref({
  priceMin: null, priceMax: null,
  changeMin: null, changeMax: null,
  turnoverMin: null, turnoverMax: null,
  volMin: null, volMax: null,
  capMin: null, capMax: null,
  amountMin: null, amountMax: null,
  peMin: null, peMax: null,
  pbMin: null, pbMax: null,
  excludeST: true,
  excludeLoss: false
})
const selectedBoard = ref('all')
const loading = ref(false)
const allData = ref([])
const stockCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const sortProp = ref('amountYi')
const sortOrder = ref('descending')
let abortController = null

// ==================== 个股速查 ====================
const evalCode = ref('')
function goDetailByCode() {
  const code = evalCode.value.trim()
  if (!code) {
    ElMessage.warning('请输入股票代码')
    return
  }
  router.push({ path: '/fund/stock-detail', query: { code } })
}

// ==================== 数据获取 ====================
async function fetchBoardSnapshot(board) {
  const fs = BOARD_FS[board]
  const PAGE_SIZE = 2000
  const signal = abortController?.signal
  const fields = 'f2,f3,f5,f6,f7,f8,f9,f10,f12,f14,f20,f21,f23'
  const baseUrl = `/staticTool/api/push2/api/qt/clist/get`
  const url1 = `${baseUrl}?pn=1&pz=${PAGE_SIZE}&po=1&np=1&fltt=2&invt=2&fid=f3&fs=${fs}&fields=${fields}`
  const response = await fetch(url1, { signal })
  if (!response.ok) throw new Error(`板块行情请求失败 HTTP ${response.status}`)
  const json = await response.json()
  if (!json?.data?.diff?.length) throw new Error('板块无数据')

  const total = json.data.total || 0
  let allDiff = [...json.data.diff]

  if (total > PAGE_SIZE) {
    const totalPages = Math.ceil(total / PAGE_SIZE)
    for (let pn = 2; pn <= totalPages; pn++) {
      const url = `${baseUrl}?pn=${pn}&pz=${PAGE_SIZE}&po=1&np=1&fltt=2&invt=2&fid=f3&fs=${fs}&fields=${fields}`
      try {
        const res = await fetch(url, { signal })
        const j = await res.json()
        if (j?.data?.diff?.length) {
          allDiff = allDiff.concat(j.data.diff)
        }
      } catch (e) {
        if (e.name === 'AbortError') throw e
        console.warn(`拉取第${pn}页失败:`, e.message)
      }
    }
  }
  return { total, diff: allDiff }
}

function toNum(v) {
  if (v === '-' || v === null || v === undefined || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

function parseRow(row) {
  const name = row.f14 || ''
  const price = toNum(row.f2) ?? 0
  let pe = toNum(row.f9)
  if (pe === 0) pe = null
  let pb = toNum(row.f23)
  if (pb === 0) pb = null
  return {
    code: row.f12 || '',
    name,
    price,
    changePct: toNum(row.f3) ?? 0,
    turnover: toNum(row.f8) ?? 0,
    volRatio: toNum(row.f10) ?? 0,
    amountYi: (toNum(row.f6) ?? 0) / 1e8,
    totalCapYi: (toNum(row.f20) ?? 0) / 1e8,
    pe,
    pb,
    isST: /ST/i.test(name)
  }
}

// ==================== 过滤 ====================
function inRange(v, min, max) {
  if (min !== null && min !== undefined && v < min) return false
  if (max !== null && max !== undefined && v > max) return false
  return true
}

function matches(item) {
  const c = cond.value
  if (c.excludeST && item.isST) return false
  if (c.excludeLoss && item.pe !== null && item.pe < 0) return false
  if (!inRange(item.price, c.priceMin, c.priceMax)) return false
  if (!inRange(item.changePct, c.changeMin, c.changeMax)) return false
  if (!inRange(item.turnover, c.turnoverMin, c.turnoverMax)) return false
  if (!inRange(item.volRatio, c.volMin, c.volMax)) return false
  if (!inRange(item.totalCapYi, c.capMin, c.capMax)) return false
  if (!inRange(item.amountYi, c.amountMin, c.amountMax)) return false
  if (!inRange(item.pe, c.peMin, c.peMax)) return false
  if (!inRange(item.pb, c.pbMin, c.pbMax)) return false
  return true
}

// ==================== 主流程 ====================
async function refreshAll() {
  if (loading.value) return
  loading.value = true
  currentPage.value = 1
  abortController?.abort()
  abortController = new AbortController()
  try {
    const { total, diff } = await fetchBoardSnapshot(selectedBoard.value)
    stockCount.value = total
    allData.value = diff.map(parseRow).filter(row => row.price > 0 || row.changePct !== 0)
    loading.value = false
    ElMessage.success(`获取 ${BOARD_NAMES[selectedBoard.value]} 行情完成，筛选出 ${filteredData.value.length} 只`)
  } catch (e) {
    if (e.name === 'AbortError') return
    console.error('筛选失败:', e)
    loading.value = false
    ElMessage.error(`筛选失败：${e.message}`)
  }
}

const filteredData = computed(() => {
  const data = allData.value.filter(matches)
  if (sortProp.value) {
    data.sort((a, b) => {
      const va = a[sortProp.value]
      const vb = b[sortProp.value]
      const dir = sortOrder.value === 'ascending' ? 1 : -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va ?? '').localeCompare(String(vb ?? '')) * dir
    })
  }
  return data
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

function handleSortChange({ prop, order }) {
  sortProp.value = prop
  sortOrder.value = order
}

function resetAll() {
  cond.value = {
    priceMin: null, priceMax: null,
    changeMin: null, changeMax: null,
    turnoverMin: null, turnoverMax: null,
    volMin: null, volMax: null,
    capMin: null, capMax: null,
    amountMin: null, amountMax: null,
    peMin: null, peMax: null,
    pbMin: null, pbMax: null,
    excludeST: true,
    excludeLoss: false
  }
  currentPage.value = 1
  refreshAll()
}

function switchBoard() {
  currentPage.value = 1
  refreshAll()
}

function goDetail(row) {
  router.push({
    path: '/fund/stock-detail',
    query: { code: row.code, name: row.name }
  })
}

onMounted(() => {
  refreshAll()
})

onBeforeUnmount(() => {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
})
</script>

<style lang="scss" scoped src="./NormalStockPanel.scss"></style>

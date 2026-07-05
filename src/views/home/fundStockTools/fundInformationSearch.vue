<template>
  <div class="fund-drawdown">
    <!-- ========== Hero 头部 ========== -->
    <div class="hero">
      <h1 class="hero-title">
        基金历史回撤 & 实时涨跌幅
        <span class="hero-badge">{{ favorites.length }} 只跟踪中</span>
      </h1>
      <p class="hero-desc">
        一站式追踪基金净值变化，从指定日期计算历史回撤幅度，结合实时估值涨幅，
        帮您快速判断买入时机与持仓风险。支持自定义分类管理，让基金监控更高效。
      </p>
      <div class="hero-features">
        <el-button class="hero-feature-tag" plain size="small" @click="openManageDialog">
          常用基金管理
        </el-button>
      </div>
    </div>

    <!-- ========== 搜索工具栏（条件 + 查询） ========== -->
    <div class="search-toolbar">
      <div class="toolbar-row">
        <div class="toolbar-left">
          <div class="toolbar-input-group">
            <span class="toolbar-label">基金代码</span>
            <el-input
              v-model="inputCodes"
              placeholder="多个用逗号分隔，如 007811,008186"
              clearable
              size="large"
              class="toolbar-code-input"
              @keyup.enter="handleQuery"
            />
          </div>
          <div class="toolbar-input-group">
            <span class="toolbar-label">回撤起点</span>
            <el-date-picker
              v-model="drawdownDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              size="large"
              class="toolbar-date-picker"
            />
          </div>
          <div class="toolbar-input-group">
            <span class="toolbar-label">分类</span>
            <el-select
              v-model="selectedCategory"
              size="large"
              class="toolbar-category-select"
              @change="onCategoryChange"
            >
              <el-option
                v-for="cat in categoryOptionsWithCount"
                :key="cat.value"
                :label="cat.label"
                :value="cat.value"
              />
            </el-select>
          </div>
        </div>
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          class="toolbar-query-btn"
          @click="handleQuery"
        >查询</el-button>
      </div>

      <!-- 错误提示 -->
      <div v-if="errors.length" class="toolbar-error">
        <el-alert title="以下基金查询失败" type="error" :closable="false" show-icon>
          <ul>
            <li v-for="e in errors" :key="e.code">{{ e.code }}：{{ e.message }}</li>
          </ul>
        </el-alert>
      </div>
    </div>

    <!-- ========== 列表操作栏 ========== -->
    <div class="list-header-bar" v-if="fundList.length">
      <span v-if="statusText" class="list-status-text">{{ statusText }}</span>
      <div class="list-sort-group">
        <el-select
          v-model="sortField"
          placeholder="默认排序"
          clearable
          size="small"
          class="list-sort-select"
          @change="onMobileSortChange"
        >
          <el-option
            v-for="opt in sortOptions"
            :key="opt.key"
            :label="opt.label"
            :value="opt.key"
          />
        </el-select>
        <el-button
          v-if="sortField"
          :icon="sortOrder === 'asc' ? 'Top' : 'Bottom'"
          circle
          size="small"
          class="sort-order-btn"
          @click="toggleSortOrder"
        />
      </div>
    </div>

    <!-- ========== 桌面端表格 + 分页 ========== -->
    <el-card v-if="fundList.length" shadow="hover" class="table-card desktop-only">
      <el-table
        :data="paginatedFundList"
        border
        stripe
        :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: 600 }"
        style="width: 100%"
        @sort-change="onTableSortChange"
      >
        <el-table-column prop="code" label="基金代码" width="100" />
        <el-table-column prop="name" label="基金名称" min-width="140" />
        <el-table-column prop="customType" label="自定义类别" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.customType !== '—'" :type="getTypeTagType(row.customType)" size="small">
              {{ row.customType }}
            </el-tag>
            <span v-else class="no-data">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="todayChange" label="今日涨跌幅" width="130" sortable="custom">
          <template #default="{ row }">
            <span v-if="row.todayChange !== '—'" :class="getChangeClass(row.todayChange)">
              {{ row.todayChange }}
            </span>
            <span v-else class="no-data">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="maxValue" label="区间最高净值" width="110" sortable="custom" />
        <el-table-column prop="maxDate" label="区间最高净值日期" width="130" />
        <el-table-column prop="curValue" label="最新净值" width="110" sortable="custom" />
        <el-table-column prop="curDate" label="最新日期" width="120" />
        <el-table-column prop="drawdown" label="历史最大回撤" width="120" sortable="custom">
          <template #default="{ row }">
            <span :class="getChangeClass(row.drawdown)">{{ row.drawdown }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="rangeMaxDrawdown" label="区间最大回撤" width="140" sortable="custom">
          <template #default="{ row }">
            <span v-if="row.rangeMaxDrawdown !== '—'" :class="getChangeClass(row.rangeMaxDrawdown)">
              {{ row.rangeMaxDrawdown }}%
            </span>
            <span v-else class="no-data">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="curDrawdown" label="区间当前回撤" width="130" sortable="custom">
          <template #default="{ row }">
            <span v-if="row.curDrawdown !== '—'" :class="getChangeClass(row.curDrawdown)">
              {{ row.curDrawdown }}%
            </span>
            <span v-else class="no-data">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="dwjz" label="昨日净值" width="110" sortable="custom" />
        <el-table-column prop="gsz" label="实时估值" width="110" sortable="custom" />
        <el-table-column prop="gztime" label="估值时间" width="110" />
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="resultPage"
          :page-size="resultPageSize"
          :page-sizes="[10, 20, 50]"
          :total="allQueryCodes.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="onResultSizeChange"
        />
      </div>
    </el-card>

    <!-- ========== 移动端卡片 ========== -->
    <div v-if="fundList.length" class="card-list mobile-only">
      <div
        v-for="fund in mobileDisplayList"
        :key="fund.code"
        class="fund-card-m"
      >
        <!-- 卡片头部：代码 + 类别标签 + 名称 -->
        <div class="card-head-m">
          <div class="card-head-row1">
            <span class="card-code-m">{{ fund.code }}</span>
            <span
              v-if="fund.customType !== '—'"
              class="card-type-badge"
              :class="'type-' + getTypeTagClass(fund.customType)"
            >{{ fund.customType }}</span>
          </div>
          <span class="card-name-m">{{ fund.name }}</span>
        </div>

        <!-- 核心指标：涨跌 + 回撤（大号展示） -->
        <div class="card-metrics-m">
          <div class="metric-main" :class="getChangeClass(fund.todayChange)">
            <span class="metric-label">今日涨跌幅</span>
            <span class="metric-value">{{ fund.todayChange }}</span>
          </div>
          <div class="metric-row">
            <div class="metric-item">
              <span class="metric-label">历史最大回撤</span>
              <span class="metric-value" :class="getChangeClass(fund.drawdown)">{{ fund.drawdown }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">区间当前回撤</span>
              <span class="metric-value" :class="getChangeClass(fund.curDrawdown)">
                {{ fund.curDrawdown !== '—' ? fund.curDrawdown + '%' : '—' }}
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-label">区间最大回撤</span>
              <span class="metric-value" :class="getChangeClass(fund.rangeMaxDrawdown)">
                {{ fund.rangeMaxDrawdown !== '—' ? fund.rangeMaxDrawdown + '%' : '—' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 净值明细 -->
        <div class="card-detail-m">
          <div class="detail-item">
            <span class="detail-label">最新净值</span>
            <span class="detail-val">{{ fund.curValue }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">区间最高净值</span>
            <span class="detail-val">{{ fund.maxValue }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">最新日期</span>
            <span class="detail-val">{{ fund.curDate }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">区间最高日期</span>
            <span class="detail-val">{{ fund.maxDate }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">昨日净值</span>
            <span class="detail-val">{{ fund.dwjz }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">实时估值</span>
            <span class="detail-val">{{ fund.gsz }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">估值时间</span>
            <span class="detail-val">
              <template v-if="fund.gztime !== '—'">
                {{ splitGztime(fund.gztime).date }} {{ splitGztime(fund.gztime).time }}
              </template>
              <span v-else>—</span>
            </span>
          </div>
        </div>
      </div>
      <!-- 滚动加载更多 -->
      <div
        v-if="hasMoreMobile"
        ref="mobileSentinel"
        class="scroll-sentinel"
      >
        <span v-if="loadingMore" class="load-more-tip">
          <span class="spinner"></span> 加载更多...
        </span>
        <span v-else class="load-more-tip">上滑加载更多</span>
      </div>
      <div v-else-if="allQueryCodes.length > 0" class="no-more-tip">
        — 已加载全部 {{ fundList.length }} 只 —
      </div>
    </div>

    <!-- ========== 常用基金管理弹框 ========== -->
    <el-dialog
      v-model="showManageDialog"
      title="常用基金管理"
      width="850px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div class="manage-header">
        <el-input
          v-model="manageSearch"
          placeholder="搜索基金代码或名称"
          clearable
          class="manage-search"
          @input="managePage = 1"
        />
        <el-button type="primary" @click="openAddDialog">+ 新增基金</el-button>
      </div>

      <div class="manage-list">
        <div
          v-for="row in paginatedManageList"
          :key="row.id"
          class="manage-list-item"
        >
          <div class="manage-item-info">
            <span class="manage-item-code">{{ row.code }}</span>
            <span class="manage-item-name">{{ row.name }}</span>
            <el-tag :type="getTypeTagType(row.customType)" size="small">{{ row.customType }}</el-tag>
          </div>
          <div class="manage-item-actions">
            <el-button size="small" type="primary" link @click="openEditDialog(row)">编辑</el-button>
            <el-popconfirm
              title="确定删除该基金？"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button size="small" type="danger" link>删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="managePage"
          :page-size="managePageSize"
          :page-sizes="[10, 20]"
          :total="filteredFavorites.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="managePage = 1"
        />
      </div>

      <template #footer>
        <el-button @click="showManageDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ========== 新增/编辑基金弹框 ========== -->
    <el-dialog
      v-model="showFormDialog"
      :title="isEdit ? '编辑基金' : '新增基金'"
      width="480px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <el-form label-width="90px" class="fund-form">
        <el-form-item label="基金代码">
          <div class="code-search-row">
            <el-input
              v-model="formCode"
              placeholder="输入6位基金代码"
              maxlength="6"
              class="code-input-inner"
              @keyup.enter="searchFundCode"
            />
            <el-button
              type="primary"
              :loading="searchingCode"
              :disabled="!isValidCode"
              @click="searchFundCode"
            >
              查询
            </el-button>
          </div>
        </el-form-item>

        <!-- 查询结果 -->
        <el-form-item v-if="searchResult" label="查询结果">
          <div class="search-result-item" @click="selectSearchResult">
            <el-tag type="success" size="large">{{ searchResult.code }}</el-tag>
            <span class="result-name">{{ searchResult.name }}</span>
            <span class="result-hint">👆 点击选择</span>
          </div>
        </el-form-item>

        <el-form-item label="基金名称">
          <el-input v-model="formName" placeholder="基金名称（查询后自动填充）" />
        </el-form-item>

        <el-form-item label="自定义类别">
          <el-select v-model="formType" placeholder="选择类别" style="width: 100%">
            <el-option
              v-for="t in typeOptions"
              :key="t"
              :label="t"
              :value="t"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showFormDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!canSave" @click="saveFavorite">
          {{ isEdit ? '保存修改' : '确认新增' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { formatDate } from '@/utils/common/date'

// ==================== 常量 ====================
const STORAGE_KEY = 'fund_favorites'
const STORAGE_VERSION_KEY = 'fund_favorites_version'
const DATA_VERSION = 3 // 递增此版本号会触发数据重建
const CATEGORY_OPTIONS = ['全部', 'ETF', '华宝', '天天']
const TYPE_OPTIONS = ['ETF', '华宝', '天天']

/** 默认常用基金（首次访问或版本升级时初始化） */
const DEFAULT_FAVORITES = [
  // ===== ETF =====
  { id: 'd001', code: '512000', name: '华宝中证全指证券公司ETF', customType: 'ETF' },
  { id: 'd002', code: '512710', name: '富国中证军工龙头ETF', customType: 'ETF' },
  { id: 'd003', code: '518880', name: '华安黄金易ETF', customType: 'ETF' },
  { id: 'd004', code: '159770', name: '天弘中证机器人ETF', customType: 'ETF' },
  { id: 'd005', code: '159995', name: '华夏国证半导体芯片ETF', customType: 'ETF' },
  { id: 'd006', code: '161125', name: '易方达标普500指数人民币A', customType: 'ETF' },
  { id: 'd007', code: '161226', name: '国投瑞银白银期货(LOF)A', customType: 'ETF' },
  { id: 'd008', code: '161725', name: '招商中证白酒指数(LOF)A', customType: 'ETF' },
  // ===== 华宝 =====
  { id: 'd009', code: '013402', name: '华夏恒生科技ETF发起式联接(QDII)A', customType: '华宝' },
  { id: 'd010', code: '040046', name: '华安纳斯达克100ETF联接(QDII)A', customType: '华宝' },
  { id: 'd011', code: '050025', name: '博时标普500ETF联接A', customType: '华宝' },
  { id: 'd012', code: '022453', name: '嘉实中证A500ETF联接A', customType: '华宝' },
  { id: 'd013', code: '100032', name: '富国中证红利指数增强A', customType: '华宝' },
  { id: 'd014', code: '005827', name: '易方达蓝筹精选混合', customType: '华宝' },
  { id: 'd015', code: '006327', name: '易方达中证海外互联网50ETF联接(QDII)A', customType: '华宝' },
  { id: 'd016', code: '110007', name: '易方达稳健收益债券A', customType: '华宝' },
  { id: 'd017', code: '110011', name: '易方达优质精选混合(QDII)', customType: '华宝' },
  { id: 'd018', code: '110017', name: '易方达增强回报债券A', customType: '华宝' },
  { id: 'd019', code: '110020', name: '易方达沪深300ETF联接A', customType: '华宝' },
  { id: 'd020', code: '003624', name: '创金合信资源股票发起式A', customType: '华宝' },
  { id: 'd021', code: '007721', name: '天弘标普500发起(QDII-FOF)A', customType: '华宝' },
  { id: 'd022', code: '001717', name: '工银前沿医疗股票A', customType: '华宝' },
  { id: 'd023', code: '011369', name: '华商均衡成长混合A', customType: '华宝' },
  { id: 'd024', code: '160213', name: '国泰纳斯达克100指数(QDII)', customType: '华宝' },
  { id: 'd025', code: '161005', name: '富国天惠成长混合(LOF)A', customType: '华宝' },
  { id: 'd026', code: '161130', name: '易方达纳斯达克100ETF联接(QDII-LOF)A(人民币)', customType: '华宝' },
  { id: 'd027', code: '161721', name: '招商沪深300地产等权重指数A', customType: '华宝' },
  { id: 'd028', code: '161725', name: '招商中证白酒指数(LOF)A', customType: '华宝' },
  { id: 'd029', code: '164906', name: '交银中证海外中国互联网指数(LOF)A', customType: '华宝' },
  // ===== 天天 =====
  { id: 'd030', code: '110020', name: '易方达沪深300ETF联接A', customType: '天天' },
  { id: 'd031', code: '005763', name: '中欧电子信息产业沪港深股票C', customType: '天天' },
  { id: 'd032', code: '720001', name: '财通价值动量混合A', customType: '天天' },
  { id: 'd033', code: '017498', name: '淳厚添益债券A', customType: '天天' },
  { id: 'd034', code: '690002', name: '民生增强收益债券A', customType: '天天' },
  { id: 'd035', code: '008186', name: '淳厚信睿混合A', customType: '天天' },
  { id: 'd036', code: '011370', name: '华商均衡成长混合C', customType: '天天' },
  { id: 'd037', code: '020857', name: '嘉实多益债券A', customType: '天天' },
  { id: 'd038', code: '006030', name: '南方昌元可转债债券A', customType: '天天' },
  { id: 'd039', code: '001407', name: '景顺长城稳健回报混合C', customType: '天天' },
  { id: 'd040', code: '012454', name: '淳厚鑫悦混合A', customType: '天天' },
  { id: 'd041', code: '022453', name: '嘉实中证A500ETF联接A', customType: '天天' },
]

// ==================== 常用基金数据（localStorage 持久化） ====================
const favorites = ref([])

/** 从 localStorage 加载常用基金（带版本号，版本升级时自动重建） */
const loadFavorites = () => {
  try {
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY)
    // 版本不一致 → 重建数据
    if (storedVersion && String(storedVersion) === String(DATA_VERSION)) {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          favorites.value = parsed
          return
        }
      }
    }
  } catch (e) {
    console.warn('[favorites] 读取失败，使用默认数据', e)
  }
  // 首次使用或版本升级 → 写入默认数据
  favorites.value = [...DEFAULT_FAVORITES]
  saveFavorites()
}

/** 保存到 localStorage */
const saveFavorites = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.value))
    localStorage.setItem(STORAGE_VERSION_KEY, String(DATA_VERSION))
  } catch (e) {
    console.warn('[favorites] 保存失败', e)
  }
}

/** 生成唯一ID */
const genId = () => 'f' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)

// ==================== 类别筛选 ====================
const selectedCategory = ref('全部')
const categoryOptions = CATEGORY_OPTIONS
const typeOptions = TYPE_OPTIONS

/** 类别选项（带数量） */
const categoryOptionsWithCount = computed(() => {
  return categoryOptions.map((cat) => ({
    value: cat,
    label: cat === '全部'
      ? `全部 (${favorites.value.length})`
      : `${cat} (${favorites.value.filter((f) => f.customType === cat).length})`,
  }))
})

/** 根据类别获取常用基金代码列表 */
const getFavoriteCodesByCategory = (cat) => {
  if (cat === '全部') return favorites.value.map((f) => f.code)
  return favorites.value.filter((f) => f.customType === cat).map((f) => f.code)
}

/** 类别切换 → 自动填入对应代码 */
const onCategoryChange = (cat) => {
  const codes = getFavoriteCodesByCategory(cat)
  inputCodes.value = codes.join(',')
}

// ==================== 查询状态 ====================
const loading = ref(false)
const pageLoading = ref(false)
const statusText = ref('')
const drawdownDate = ref('2024-01-01')
const inputCodes = ref('')

// ==================== 分页查询 ====================
const allQueryCodes = ref([])           // 本次查询的全部基金代码
const fundDataCache = ref({})           // { code: fundData } 已加载数据缓存
const queryErrors = ref([])             // 累积的错误

/** fundList 兼容模板，从缓存取值 */
const fundList = computed(() => Object.values(fundDataCache.value))

/** 从缓存取当前页原始数据 */
const currentPageRawData = computed(() => {
  if (allQueryCodes.value.length === 0) return []
  const start = (resultPage.value - 1) * resultPageSize.value
  const codes = allQueryCodes.value.slice(start, start + resultPageSize.value)
  return codes.map((code) => fundDataCache.value[code]).filter(Boolean)
})

/** 当前页是否全部已加载 */
const isCurrentPageReady = computed(() => {
  if (allQueryCodes.value.length === 0) return true
  const start = (resultPage.value - 1) * resultPageSize.value
  const codes = allQueryCodes.value.slice(start, start + resultPageSize.value)
  return codes.every((code) => fundDataCache.value[code] !== undefined)
})

/** 所有已加载数据（给 errors 兼容模板） */
const errors = computed(() => queryErrors.value)

// ==================== 排序相关 ====================
const sortField = ref('')
const sortOrder = ref('desc')
const sortOptions = [
  { key: 'todayChange', label: '今日涨跌幅' },
  { key: 'drawdown', label: '历史最大回撤' },
  { key: 'curDrawdown', label: '区间当前回撤' },
  { key: 'rangeMaxDrawdown', label: '区间最大回撤' },
  { key: 'curValue', label: '最新净值' },
  { key: 'maxValue', label: '最高净值' },
  { key: 'dwjz', label: '昨日净值' },
  { key: 'gsz', label: '实时估值' },
]

const getSortValue = (row, key) => {
  const val = row[key]
  if (val === '—' || val === undefined || val === null) return -Infinity
  const str = String(val).replace('%', '')
  const num = parseFloat(str)
  return isNaN(num) ? -Infinity : num
}

const sortedFundList = computed(() => {
  if (!sortField.value) return fundList.value
  const arr = [...fundList.value]
  arr.sort((a, b) => {
    const va = getSortValue(a, sortField.value)
    const vb = getSortValue(b, sortField.value)
    if (va === -Infinity && vb === -Infinity) return 0
    if (va === -Infinity) return 1
    if (vb === -Infinity) return -1
    return sortOrder.value === 'asc' ? va - vb : vb - va
  })
  return arr
})

// ==================== 结果分页 ====================
const resultPage = ref(1)
const resultPageSize = ref(10)

const paginatedFundList = computed(() => {
  // 有排序 → 全局排序后切片
  if (sortField.value) {
    const start = (resultPage.value - 1) * resultPageSize.value
    return sortedFundList.value.slice(start, start + resultPageSize.value)
  }
  // 无排序 → 按原始顺序展示当前页
  return currentPageRawData.value
})

/** 切换每页条数 → 重置缓存并重新加载 */
const onResultSizeChange = (size) => {
  resultPageSize.value = size
  resultPage.value = 1
  fundDataCache.value = {}
  queryErrors.value = []
  loadAllData(true)
}

/** 翻页 → 如果当前页未加载则加载 */
watch(resultPage, async (page) => {
  if (!isCurrentPageReady.value) {
    await loadCurrentPage(page)
  }
})

/** 查询代码变化 → 重置页码及移动端 */
watch(allQueryCodes, () => {
  resultPage.value = 1
  mobilePage.value = 1
})

const toggleSort = (key) => {
  if (sortField.value === key) {
    sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortField.value = key
    sortOrder.value = 'desc'
  }
}

const resetSort = () => {
  sortField.value = ''
  sortOrder.value = 'desc'
}

const onMobileSortChange = (key) => {
  if (!key) {
    resetSort()
  } else {
    sortOrder.value = 'desc'
  }
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}

// ==================== 移动端无限滚动 ====================
const mobilePage = ref(1)           // 移动端已加载到第几页
const loadingMore = ref(false)      // 正在加载更多
const mobileSentinel = ref(null)    // 滚动哨兵 DOM 引用
let mobileObserver = null           // IntersectionObserver 实例

/** 移动端展示列表：累积已加载的所有页面数据 */
const mobileDisplayList = computed(() => {
  if (allQueryCodes.value.length === 0) return []
  const endIdx = mobilePage.value * resultPageSize.value
  const maxIdx = Math.min(endIdx, allQueryCodes.value.length)

  if (sortField.value) {
    // 有排序 → 全部已加载数据全局排序后截断
    return sortedFundList.value.slice(0, maxIdx)
  }
  // 无排序 → 按原始查询顺序取
  return allQueryCodes.value
    .slice(0, maxIdx)
    .map((c) => fundDataCache.value[c])
    .filter(Boolean)
})

/** 是否还有更多未展示 */
const hasMoreMobile = computed(() => {
  return mobilePage.value * resultPageSize.value < allQueryCodes.value.length
})

/** 加载移动端下一页 */
const loadNextMobilePage = async () => {
  if (loadingMore.value || !hasMoreMobile.value) return
  const nextPage = mobilePage.value + 1
  loadingMore.value = true
  // 确保下一页数据已加载
  if (!isCurrentPageReady.value) {
    await loadCurrentPage(nextPage)
  }
  mobilePage.value = nextPage
  loadingMore.value = false
}

/** 重新绑定哨兵观察器（卡片列表更新后） */
const setupMobileObserver = () => {
  if (mobileObserver) mobileObserver.disconnect()
  if (!mobileSentinel.value || !hasMoreMobile.value) return
  mobileObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !loadingMore.value) {
        loadNextMobilePage()
      }
    },
    { rootMargin: '300px' } // 提前 300px 触发预加载
  )
  mobileObserver.observe(mobileSentinel.value)
}

/** 清理观察器 */
const teardownMobileObserver = () => {
  if (mobileObserver) {
    mobileObserver.disconnect()
    mobileObserver = null
  }
}

/** 卡片列表渲染后重新绑定哨兵 */
watch(mobileDisplayList, () => {
  nextTick(() => setupMobileObserver())
})

/** 排序变化时移动端从头展示 */
watch(sortField, () => {
  mobilePage.value = 1
  nextTick(() => setupMobileObserver())
})

const onTableSortChange = ({ prop, order }) => {
  if (!order) {
    resetSort()
  } else {
    sortField.value = prop
    sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
  }
}

// ==================== 工具函数 ====================
const getChangeClass = (value) => {
  const num = parseFloat(value)
  if (isNaN(num)) return ''
  return num < 0 ? 'down' : num > 0 ? 'up' : ''
}

const splitGztime = (gztime) => {
  if (!gztime || gztime === '—') return { date: '—', time: '' }
  const idx = gztime.lastIndexOf(' ')
  if (idx === -1) return { date: gztime, time: '' }
  return { date: gztime.substring(0, idx), time: gztime.substring(idx + 1) }
}

const getTypeTagType = (type) => {
  const map = { ETF: 'warning', 华宝: 'success', 天天: '' }
  return map[type] || 'info'
}

const getTypeTagClass = (type) => {
  const map = { ETF: 'etf', 华宝: 'huabao', 天天: 'tiantian' }
  return map[type] || 'default'
}

// ==================== 数据加载 ====================
const calcMaxDrawdown = (trends, fromDate) => {
  if (!trends || trends.length < 2) return '—'
  let data = trends
  if (fromDate) {
    const cutoff = new Date(fromDate).getTime()
    data = trends.filter((item) => item.x >= cutoff)
    if (data.length < 2) return '—'
  }
  let maxDD = 0
  let ddPeak = data[0].y
  for (let i = 1; i < data.length; i++) {
    const val = data[i].y
    if (val > ddPeak) {
      ddPeak = val
    } else {
      const dd = (val - ddPeak) / ddPeak
      if (dd < maxDD) maxDD = dd
    }
  }
  const result = (maxDD * 100).toFixed(2)
  return parseFloat(result) < -99 ? '—' : result
}

const calcCurDrawdown = (trends, fromDate) => {
  if (!trends || trends.length < 2) return '—'
  const cutoff = new Date(fromDate).getTime()
  const filtered = trends.filter((item) => item.x >= cutoff)
  if (filtered.length < 2) return '—'
  let peak = filtered[0].y
  for (let i = 1; i < filtered.length; i++) {
    if (filtered[i].y > peak) peak = filtered[i].y
  }
  const cur = filtered[filtered.length - 1].y
  const dd = ((cur - peak) / peak) * 100
  return (parseFloat(dd.toFixed(2)) < -99) ? '—' : dd.toFixed(2)
}

const loadHistoryData = async (code) => {
  const res = await fetch(`/staticTool/api/fund/history/${code}`)
  if (!res.ok) throw new Error(`历史数据请求失败 HTTP ${res.status}`)
  const json = await res.json()
  const d = json.data || {}
  const name = d.name || ''
  const rawTrends = d.acWorthTrend || []
  if (rawTrends.length === 0) throw new Error('历史净值数据缺失')
  const trends = rawTrends
    .map((item) => ({
      x: Array.isArray(item)
        ? new Date(item[0]).getTime()
        : typeof item.x === 'number'
          ? item.x
          : new Date(item.x).getTime(),
      y: Array.isArray(item) ? parseFloat(item[1]) : parseFloat(item.y),
    }))
    .filter((item) => !isNaN(item.x) && Number.isFinite(item.y) && item.y > 0)
  if (trends.length === 0) throw new Error('累计净值数据异常（过滤后无有效数据），请检查基金代码')
  // 区间最高净值（从回撤起点日期算起）
  const ddCutoff = new Date(drawdownDate.value).getTime()
  const rangeTrends = trends.filter((item) => item.x >= ddCutoff)
  let maxItem = rangeTrends.length > 0 ? rangeTrends[0] : trends[0]
  for (const item of rangeTrends) {
    if (item.y > maxItem.y) maxItem = item
  }
  const currentItem = trends[trends.length - 1]
  return {
    name,
    maxDate: rangeTrends.length > 0 ? formatDate(maxItem.x) : '—',
    maxValue: rangeTrends.length > 0 ? maxItem.y : '—',
    curDate: formatDate(currentItem.x),
    curValue: currentItem.y,
    drawdown: calcMaxDrawdown(trends),
    curDrawdown: calcCurDrawdown(trends, drawdownDate.value),
    rangeMaxDrawdown: calcMaxDrawdown(trends, drawdownDate.value),
  }
}

const loadRealTimeData = async (code) => {
  const res = await fetch(`/staticTool/api/fund/estimate/${code}`)
  if (!res.ok) throw new Error(`实时估值请求失败 HTTP ${res.status}`)
  const json = await res.json()
  const data = json.data
  if (data && data.dwjz && data.gsz && parseFloat(data.gsz) > 0 && data.gztime) {
    return {
      dwjz: parseFloat(data.dwjz),
      gsz: parseFloat(data.gsz),
      gszzl: data.gszzl,
      gztime: data.gztime,
      name: data.name || '',
    }
  }
  throw new Error('暂无实时估值')
}

const loadFundFull = async (code) => {
  const [historyResult, realtimeResult] = await Promise.allSettled([
    loadHistoryData(code),
    loadRealTimeData(code),
  ])
  // 从常用基金中获取自定义类别
  const fav = favorites.value.find((f) => f.code === code)
  const data = {
    code,
    name: '—',
    customType: fav?.customType || '—',
    maxDate: '—',
    maxValue: '—',
    curDate: '—',
    curValue: '—',
    drawdown: '—',
    curDrawdown: '—',
    rangeMaxDrawdown: '—',
    gsz: '—',
    gztime: '—',
    dwjz: '—',
    todayChange: '—',
  }
  if (historyResult.status === 'fulfilled') {
    Object.assign(data, historyResult.value)
  } else {
    throw new Error(historyResult.reason.message)
  }
  if (realtimeResult.status === 'fulfilled') {
    const r = realtimeResult.value
    data.gsz = r.gsz
    data.gztime = r.gztime
    data.dwjz = r.dwjz
    if (r.gszzl && !isNaN(parseFloat(r.gszzl))) {
      data.todayChange = r.gszzl + '%'
    } else {
      data.todayChange = ((r.gsz - r.dwjz) / r.dwjz) * 100
      data.todayChange = data.todayChange.toFixed(2) + '%'
    }
  }
  return data
}

// ==================== 分页加载核心 ====================

/** 并行加载一批基金代码（最多 CONCURRENCY 个并发） */
const loadBatch = async (codes) => {
  const CONCURRENCY = 6
  const errs = []
  for (let i = 0; i < codes.length; i += CONCURRENCY) {
    const batch = codes.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(batch.map((c) => loadFundFull(c)))
    results.forEach((r, idx) => {
      const code = batch[idx]
      if (r.status === 'fulfilled') {
        fundDataCache.value = { ...fundDataCache.value, [code]: r.value }
      } else {
        errs.push({ code, message: r.reason?.message || '未知错误' })
      }
    })
    const loaded = Object.keys(fundDataCache.value).length
    statusText.value = `加载中 ${loaded}/${allQueryCodes.value.length} ...`
  }
  if (errs.length) {
    queryErrors.value = [...queryErrors.value, ...errs]
  }
  return errs
}

/** 加载指定页数据 */
const loadCurrentPage = async (page) => {
  const start = (page - 1) * resultPageSize.value
  const codes = allQueryCodes.value.slice(start, start + resultPageSize.value)
  const needLoad = codes.filter((c) => !fundDataCache.value[c])
  if (needLoad.length === 0) return
  pageLoading.value = true
  await loadBatch(needLoad)
  pageLoading.value = false
}

/** 加载全部数据（phase1: 首页 → phase2: 后台余量） */
const loadAllData = async (isReset = false) => {
  const codes = allQueryCodes.value
  if (codes.length === 0) return

  if (isReset) {
    fundDataCache.value = {}
    queryErrors.value = []
  }

  loading.value = true
  statusText.value = '开始加载...'

  // Phase 1: 优先加载首页（快速首屏）
  const firstPage = codes.slice(0, Math.min(resultPageSize.value, codes.length))
  await loadBatch(firstPage)
  loading.value = false

  const total = Object.keys(fundDataCache.value).length
  if (codes.length <= resultPageSize.value) {
    statusText.value = queryErrors.value.length
      ? `完成（成功 ${total} 只，失败 ${queryErrors.value.length} 只）`
      : `全部加载完成，共 ${total} 只基金`
    return
  }

  // Phase 2: 后台并行加载剩余数据
  statusText.value = `首屏已加载 ${total}/${codes.length}，后台继续加载中...`
  const remaining = codes.slice(resultPageSize.value)
  await loadBatch(remaining)

  const finalTotal = Object.keys(fundDataCache.value).length
  statusText.value = queryErrors.value.length
    ? `完成（成功 ${finalTotal} 只，失败 ${queryErrors.value.length} 只）`
    : `全部加载完成，共 ${finalTotal} 只基金`
}

// ==================== 查询入口 ====================
const handleQuery = async () => {
  let raw = inputCodes.value.trim()
  // 搜索框为空 → 自动填入当前类别的全部常用基金
  if (!raw) {
    const codes = getFavoriteCodesByCategory(selectedCategory.value)
    if (codes.length === 0) return
    raw = codes.join(',')
    // 不填充输入框，保持干净，但正常查询
  }
  const codes = raw
    .split(/[，,\s]+/)
    .filter((c) => /^\d{6}$/.test(c))
  if (codes.length === 0) return

  allQueryCodes.value = codes
  resultPage.value = 1
  await loadAllData(true)
}

// ==================== 常用基金管理弹框 ====================
const showManageDialog = ref(false)
const manageSearch = ref('')
const managePage = ref(1)
const managePageSize = ref(10)

/** 搜索过滤后的列表 */
const filteredFavorites = computed(() => {
  const keyword = manageSearch.value.trim().toLowerCase()
  if (!keyword) return favorites.value
  return favorites.value.filter(
    (f) =>
      f.code.includes(keyword) ||
      f.name.toLowerCase().includes(keyword) ||
      f.customType.toLowerCase().includes(keyword)
  )
})

/** 分页后的管理列表 */
const paginatedManageList = computed(() => {
  const start = (managePage.value - 1) * managePageSize.value
  return filteredFavorites.value.slice(start, start + managePageSize.value)
})

/** 搜索/筛选变化时重置页码 */
watch(manageSearch, () => {
  managePage.value = 1
})

/** 打开管理弹框 */
const openManageDialog = () => {
  manageSearch.value = ''
  managePage.value = 1
  showManageDialog.value = true
}

/** 删除 */
const handleDelete = (id) => {
  favorites.value = favorites.value.filter((f) => f.id !== id)
  saveFavorites()
  // 如果当前页空了且不是第一页，回退一页
  const total = filteredFavorites.value.length
  const maxPage = Math.ceil(total / managePageSize.value)
  if (managePage.value > maxPage && maxPage > 0) {
    managePage.value = maxPage
  }
}

// ==================== 新增/编辑弹框 ====================
const showFormDialog = ref(false)
const isEdit = ref(false)
const editingId = ref('')
const formCode = ref('')
const formName = ref('')
const formType = ref('ETF')
const searchingCode = ref(false)
const searchResult = ref(null)

/** 基金代码是否合法（6位数字） */
const isValidCode = computed(() => /^\d{6}$/.test(formCode.value))

/** 是否可保存 */
const canSave = computed(() => {
  return isValidCode.value && formName.value.trim() && formType.value
})

/** 通过接口查询基金名称 */
const searchFundCode = async () => {
  if (!isValidCode.value) return
  searchingCode.value = true
  searchResult.value = null
  try {
    const res = await fetch(`/staticTool/api/fund/history/${formCode.value}`)
    if (!res.ok) throw new Error('查询失败')
    const json = await res.json()
    const name = json.data?.name || ''
    if (!name) throw new Error('未找到该基金')
    searchResult.value = { code: formCode.value, name }
  } catch (err) {
    searchResult.value = null
    alert(`查询失败：${err.message}`)
  } finally {
    searchingCode.value = false
  }
}

/** 点击选择查询结果 → 自动填充名称 */
const selectSearchResult = () => {
  if (!searchResult.value) return
  formName.value = searchResult.value.name
  searchResult.value = null
}

/** 打开新增弹框 */
const openAddDialog = () => {
  isEdit.value = false
  editingId.value = ''
  formCode.value = ''
  formName.value = ''
  formType.value = 'ETF'
  searchResult.value = null
  showFormDialog.value = true
}

/** 打开编辑弹框 */
const openEditDialog = (row) => {
  isEdit.value = true
  editingId.value = row.id
  formCode.value = row.code
  formName.value = row.name
  formType.value = row.customType || 'ETF'
  searchResult.value = null
  showFormDialog.value = true
}

/** 保存新增/编辑 */
const saveFavorite = () => {
  if (!canSave.value) return
  if (isEdit.value) {
    // 编辑
    const idx = favorites.value.findIndex((f) => f.id === editingId.value)
    if (idx !== -1) {
      favorites.value[idx] = {
        ...favorites.value[idx],
        code: formCode.value.trim(),
        name: formName.value.trim(),
        customType: formType.value,
      }
    }
  } else {
    // 新增
    favorites.value.push({
      id: genId(),
      code: formCode.value.trim(),
      name: formName.value.trim(),
      customType: formType.value,
    })
  }
  saveFavorites()
  showFormDialog.value = false
  // 同步更新搜索框（如果当前类别匹配）
  if (selectedCategory.value === '全部' || selectedCategory.value === formType.value) {
    nextTick(() => onCategoryChange(selectedCategory.value))
  }
}

// ==================== 页面初始化 ====================
onMounted(() => {
  loadFavorites()
  // 页面加载时自动查询全部常用基金
  nextTick(() => handleQuery())
})

onUnmounted(() => {
  teardownMobileObserver()
})
</script>

<style lang="scss" scoped>
@import url('./style/fundInformationSearch.scss');
</style>
e>
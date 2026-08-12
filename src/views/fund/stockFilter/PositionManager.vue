<template>
  <div class="position-manager" v-if="stockCode">
    <!-- 折叠标题栏 -->
    <div class="pm-header" @click="expanded = !expanded">
      <div class="pm-header-left">
        <span class="pm-title">我的交易记录</span>
        <el-tag v-if="posData?.hasPosition" size="small" :type="posData.floatPnl >= 0 ? 'danger' : 'success'" effect="dark">
          {{ posData.floatPnl >= 0 ? '+' : '-' }}{{ Math.abs(posData.floatPnlPct) }}%
        </el-tag>
        <el-tag v-else size="small" type="info" effect="plain">无持仓</el-tag>
      </div>
      <div class="pm-header-right">
        <span class="pm-count">{{ txs.length }}笔记录</span>
        <el-icon :class="{ 'pm-arrow-rotated': expanded }"><ArrowDown /></el-icon>
      </div>
    </div>

    <!-- 展开内容 -->
    <el-collapse-transition>
      <div v-show="expanded" class="pm-body">
        <!-- 有持仓时顶部高亮展示持仓成本和盈亏百分比 -->
        <!-- <div v-if="posData?.hasPosition" class="pm-pos-highlight">
          <div class="pm-pos-highlight-item">
            <span class="pm-pos-highlight-label">持仓成本</span>
            <span class="pm-pos-highlight-value">¥{{ posData.avgCost.toFixed(3) }}</span>
          </div>
          <div class="pm-pos-highlight-divider"></div>
          <div class="pm-pos-highlight-item">
            <span class="pm-pos-highlight-label">持仓盈亏</span>
            <span class="pm-pos-highlight-value" :class="posData.floatPnl >= 0 ? 'text-up' : 'text-down'">
              {{ posData.floatPnl >= 0 ? '+' : '-' }}¥{{ formatMoney(Math.abs(posData.floatPnl)) }}
            </span>
          </div>
          <div class="pm-pos-highlight-divider"></div>
          <div class="pm-pos-highlight-item">
            <span class="pm-pos-highlight-label">盈亏比例</span>
            <span class="pm-pos-highlight-value" :class="posData.floatPnl >= 0 ? 'text-up' : 'text-down'">
              {{ posData.floatPnl >= 0 ? '+' : '-' }}{{ Math.abs(posData.floatPnlPct) }}%
            </span>
          </div>
        </div> -->

        <!-- 持仓概览（有持仓时显示） -->
        <div v-if="posData?.hasPosition" class="pm-overview">
          <div class="pm-overview-item">
            <span class="pm-ov-label">持仓均价</span>
            <span class="pm-ov-value">¥{{ posData.avgCost.toFixed(3) }}</span>
          </div>
          <div class="pm-overview-item">
            <span class="pm-ov-label">持仓股数</span>
            <span class="pm-ov-value">{{ posData.totalShares }}股</span>
          </div>
          <div class="pm-overview-item">
            <span class="pm-ov-label">持仓市值</span>
            <span class="pm-ov-value">¥{{ formatMoney(posData.currentValue) }}</span>
          </div>
          <div class="pm-overview-item">
            <span class="pm-ov-label">持仓盈亏</span>
            <span class="pm-ov-value" :class="posData.floatPnl >= 0 ? 'text-up' : 'text-down'">
              {{ posData.floatPnl >= 0 ? '+' : '-' }}¥{{ formatMoney(Math.abs(posData.floatPnl)) }}
            </span>
          </div>
          <div class="pm-overview-item">
            <span class="pm-ov-label">盈亏比例</span>
            <span class="pm-ov-value" :class="posData.floatPnl >= 0 ? 'text-up' : 'text-down'">
              {{ posData.floatPnl >= 0 ? '+' : '-' }}{{ Math.abs(posData.floatPnlPct) }}%
            </span>
          </div>
          <!-- <div class="pm-overview-item">
            <span class="pm-ov-label">已实现盈亏</span>
            <span class="pm-ov-value" :class="posData.realizedPnl >= 0 ? 'text-up' : 'text-down'">
              {{ posData.realizedPnl >= 0 ? '+' : '-' }}¥{{ formatMoney(Math.abs(posData.realizedPnl)) }}
            </span>
          </div> -->
          <!-- <div class="pm-overview-item">
            <span class="pm-ov-label">累计手续费</span>
            <span class="pm-ov-value text-down">-¥{{ formatMoney(posData.totalFees || 0) }}</span>
          </div> -->
          <div class="pm-overview-item">
            <span class="pm-ov-label">累计分红</span>
            <span class="pm-ov-value text-up" v-if="posData.totalDividend > 0">+¥{{ formatMoney(posData.totalDividend) }}</span>
            <span class="pm-ov-value pm-ov-none" v-else>—</span>
          </div>
        </div>

        <!-- 添加按钮（操作栏移到这里：概览卡片下方、列表上方） -->
        <div class="pm-add-bar">
          <span class="pm-add-stock-name" v-if="stockName">{{ stockName }}<br class="pm-stock-br" v-if="stockCode"><span class="pm-add-stock-code" v-if="stockCode">{{ stockCode }}</span></span>
          <span class="pm-add-stock-name" v-else>交易操作</span>
          <div class="pm-add-actions">
            <el-button size="small" @click="openDialog('buy')">买入</el-button>
            <el-button size="small" @click="openDialog('sell')" :disabled="!posData?.hasPosition">卖出</el-button>
            <el-button size="small" @click="openDialog('dividend')">分红</el-button>
            <el-button size="small" @click="openDialog('bonus')">送股</el-button>
            <!-- 通用截图识别组件 -->
            <ImageRecognizer
              title="交易记录识别"
              @confirm="handleImportConfirm"
            >
              <template #trigger="{ open, loading }">
                <el-button size="small" type="primary" plain @click="open" :loading="loading">导入截图</el-button>
              </template>
            <template #result-table="{ records }">
              <el-table :data="records" size="small" max-height="300" style="width:100%;margin-top:10px">
                <el-table-column prop="date" label="日期" width="100" />
                <el-table-column label="类型" width="60">
                  <template #default="{ row }">
                    <el-tag size="small" :type="row.type === 'buy' ? 'danger' : 'success'" effect="light">
                      {{ row.type === 'buy' ? '买入' : '卖出' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="价格" width="80">
                  <template #default="{ row }">¥{{ row.price.toFixed(3) }}</template>
                </el-table-column>
                <el-table-column prop="shares" label="股数" width="80" />
                <el-table-column label="费用" width="70">
                  <template #default="{ row }">
                    <span v-if="row.fee != null">¥{{ Number(row.fee).toFixed(2) }}</span>
                    <span v-else class="pm-ov-none">—</span>
                  </template>
                </el-table-column>
                <el-table-column label="金额" width="100">
                  <template #default="{ row }">¥{{ (row.price * row.shares).toFixed(2) }}</template>
                </el-table-column>
              </el-table>
            </template>
            <template #result-empty>
              <el-empty description="未能识别到交易记录" :image-size="60">
                <template #description>
                  <p>请确认截图包含买入/卖出明细表格</p>
                  <p style="font-size:0.72rem;color:#c0c4cc;margin-top:4px">支持华泰、中信、同花顺等主流券商截图</p>
                </template>
              </el-empty>
            </template>
          </ImageRecognizer>

            <el-button v-if="txs.length > 0" size="small" text type="danger" @click="handleClear" style="margin-left:0">
              <span class="pm-btn-text">清空记录</span><span class="pm-btn-short">清空</span>
            </el-button>
          </div>
        </div>

        <!-- 交易记录列表（分页） -->
        <div class="pm-tx-list" v-if="pagedTxs.length > 0">
          <div class="pm-tx-row pm-tx-header-row">
            <span class="pm-tx-date">日期</span>
            <span class="pm-tx-type">类型</span>
            <span class="pm-tx-price">价格</span>
            <span class="pm-tx-shares">数量</span>
            <span class="pm-tx-fee">费用</span>
            <span class="pm-tx-amount">金额</span>
            <span class="pm-tx-act"></span>
          </div>
          <div v-for="tx in pagedTxs" :key="tx.id" class="pm-tx-row" :class="'pm-tx-' + tx.type">
            <span class="pm-tx-date">{{ formatDate(tx.date) }}</span>
            <span class="pm-tx-type">
              <el-tag size="small" :type="txTypeTag(tx.type)" effect="light">{{ txTypeLabel(tx.type) }}</el-tag>
            </span>
            <span class="pm-tx-price">{{ formatPrice(tx) }}</span>
            <span class="pm-tx-shares">{{ formatShares(tx) }}</span>
            <span class="pm-tx-fee">{{ formatTxFee(tx) }}</span>
            <span class="pm-tx-amount" :class="tx.type === 'buy' ? 'text-down' : tx.type === 'sell' ? 'text-up' : ''">
              {{ formatAmount(tx) }}
            </span>
            <span class="pm-tx-act">
              <el-button text size="small" type="danger" @click.stop="handleRemove(tx.id)" :icon="Delete">删除</el-button>
            </span>
          </div>
          <!-- 分页 -->
          <div class="pm-tx-pagination" v-if="txs.length > pageSize">
            <el-pagination
              v-model:current-page="txPage"
              :page-size="pageSize"
              :total="txs.length"
              layout="prev, pager, next"
              small
              background
            />
          </div>
        </div>

        <!-- 添加/编辑弹窗 -->
        <el-dialog
          v-model="dialogVisible"
          :title="dialogTitle"
          width="380px"
          :close-on-click-modal="false"
          destroy-on-close
        >
          <el-form :model="form" label-width="70px" label-position="left" size="default">
            <el-form-item label="日期">
              <el-date-picker
                v-model="form.date"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width:100%"
              />
            </el-form-item>
            <el-form-item v-if="formType === 'dividend'" label="分红金额">
              <el-input-number v-model="form.shares" :min="0" :precision="2" :step="100" style="width:100%"
                placeholder="总分红金额（元）" controls-position="right" />
            </el-form-item>
            <el-form-item v-if="formType === 'dividend'" label="每股分红">
              <el-input-number v-model="form.price" :min="0" :precision="3" :step="0.01" style="width:100%"
                placeholder="选填：每股分红金额" controls-position="right" />
            </el-form-item>
            <el-form-item v-else-if="formType === 'bonus'" label="送股比例">
              <el-input-number v-model="form.ratio" :min="0" :precision="2" :step="0.1" style="width:100%"
                placeholder="如10送3则填0.3" controls-position="right" />
              <span class="pm-form-hint">例如：10送3 → 填 0.3</span>
            </el-form-item>
            <template v-else>
              <el-form-item label="价格">
                <el-input-number v-model="form.price" :min="0" :precision="3" :step="0.01" style="width:100%"
                  placeholder="成交价格" controls-position="right" />
              </el-form-item>
              <el-form-item label="股数">
                <el-input-number v-model="form.shares" :min="100" :step="100" style="width:100%"
                  placeholder="成交股数（100的倍数）" controls-position="right" />
              </el-form-item>
            </template>
            <el-form-item label="备注">
              <el-input v-model="form.note" placeholder="选填" maxlength="30" show-word-limit />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSave" :disabled="!canSave">保存</el-button>
          </template>
        </el-dialog>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Wallet, ArrowDown, Plus, Minus, Present, Connection, Delete, Camera } from '@element-plus/icons-vue'
import { getTransactions, addTransaction, removeTransaction, clearTransactions, calcPosition, TX_TYPES } from '@/composables/usePosition.js'
import { ElMessageBox, ElMessage } from 'element-plus'
import ImageRecognizer from '@/components/ImageRecognizer.vue'

const props = defineProps({
  stockCode: { type: String, default: '' },
  stockName: { type: String, default: '' },
  currentPrice: { type: Number, default: 0 },
})

const emit = defineEmits(['position-change'])

const expanded = ref(false)
const dialogVisible = ref(false)
const formType = ref('buy')
const txPage = ref(1)
const pageSize = 10

const pagedTxs = computed(() => {
  const start = (txPage.value - 1) * pageSize
  return txs.value.slice(start, start + pageSize)
})

// ===== 截图导入：使用通用 ImageRecognizer 组件 =====
function handleImportConfirm(records) {
  for (const record of records) {
    addTransaction(props.stockCode, {
      type: record.type,
      price: record.price,
      shares: record.shares,
      date: record.date || new Date().toISOString().slice(0, 10),
      fee: record.fee,
      note: record.note || '截图导入'
    })
  }
  ElMessage.success(`成功导入 ${records.length} 条交易记录`)
  expanded.value = true
  txPage.value = 1
  emit('position-change', calcPosition(props.stockCode, props.currentPrice))
}

// 表单
const today = new Date().toISOString().slice(0, 10)
const form = ref({
  date: today,
  price: 0,
  shares: 0,
  note: '',
  ratio: 0,
})

// 从 composable 读取
const txs = computed(() => getTransactions(props.stockCode))
const posData = computed(() => calcPosition(props.stockCode, props.currentPrice))

const dialogTitle = computed(() => {
  const map = { buy: '添加买入记录', sell: '添加卖出记录', dividend: '添加分红记录', bonus: '添加送股记录' }
  return map[formType.value] || '添加交易记录'
})

const canSave = computed(() => {
  if (formType.value === 'dividend') {
    return (form.value.shares > 0 || form.value.price > 0)
  }
  if (formType.value === 'bonus') {
    return form.value.ratio > 0
  }
  return form.value.price > 0 && form.value.shares > 0
})

function openDialog(type) {
  formType.value = type
  form.value = {
    date: today,
    price: type === 'buy' ? props.currentPrice || 0 : 0,
    shares: 0,
    note: '',
    ratio: 0,
  }
  dialogVisible.value = true
}

function handleSave() {
  const payload = {
    type: formType.value,
    date: form.value.date,
    price: form.value.price,
    shares: form.value.shares,
    note: form.value.note,
    ratio: form.value.ratio,
  }
  addTransaction(props.stockCode, payload)
  dialogVisible.value = false
  expanded.value = true
  ElMessage.success('记录已保存')
  emit('position-change', posData.value)
}

function handleRemove(txId) {
  ElMessageBox.confirm('确定删除这条交易记录吗？', '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    removeTransaction(props.stockCode, txId)
    // 处理页码越界
    if (pagedTxs.value.length === 0 && txPage.value > 1) {
      txPage.value = Math.max(1, Math.ceil(txs.value.length / pageSize))
    }
    ElMessage.success('已删除')
    emit('position-change', posData.value)
  }).catch(() => {})
}

function handleClear() {
  ElMessageBox.confirm(`确定清空"${props.stockName || props.stockCode}"的所有交易记录吗？此操作不可恢复。`, '确认清空', {
    confirmButtonText: '清空',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    clearTransactions(props.stockCode)
    expanded.value = false
    ElMessage.success('已清空')
    emit('position-change', null)
  }).catch(() => {})
}

// ===== 格式化工具 =====
function formatDate(d) { return d?.slice(5) || d } // 08-12
function formatPrice(tx) {
  if (tx.type === 'dividend') return '¥' + (tx.price || tx.shares).toFixed(3)
  if (tx.type === 'bonus') return tx.ratio ? `10送${(tx.ratio * 10).toFixed(0)}` : '—'
  return '¥' + tx.price.toFixed(3)
}
function formatShares(tx) {
  if (tx.type === 'dividend') return '—'
  if (tx.type === 'bonus') return tx.ratio ? `+${(tx.ratio * 100).toFixed(0)}%` : '—'
  return tx.shares + '股'
}
function formatAmount(tx) {
  if (tx.type === 'dividend') return '+¥' + (tx.shares || (tx.price * 1000)).toFixed(2)
  if (tx.type === 'bonus') return '—'
  const amount = tx.price * tx.shares
  const sign = tx.type === 'sell' ? '+' : '-'
  return sign + '¥' + amount.toFixed(2)
}
function formatTxFee(tx) {
  if (tx.type !== 'buy' && tx.type !== 'sell') return '—'
  // 有实际费用直接展示
  if (tx.fee != null) return '¥' + Number(tx.fee).toFixed(2)
  // 无费用记录时按系统估算口径展示（买入：佣金最低5元；卖出：佣金 + 印花税0.1%）
  const amount = tx.shares * tx.price
  const commission = Math.max(amount * 0.00025, 5)
  if (tx.type === 'buy') return '≈¥' + commission.toFixed(2)
  return '≈¥' + (commission + amount * 0.001).toFixed(2)
}
function formatMoney(v) {
  if (Math.abs(v) >= 10000) return (v / 10000).toFixed(2) + '万'
  return Math.abs(v).toFixed(2)
}
function txTypeLabel(type) { return TX_TYPES[type]?.label || type }
function txTypeTag(type) {
  const map = { buy: 'danger', sell: 'success', dividend: 'warning', bonus: 'primary' }
  return map[type] || 'info'
}

// 初始时如果有交易记录则自动展开
onMounted(() => {
  if (txs.value.length > 0) {
    expanded.value = true
  }
})

// 监听股票代码变化
watch(() => props.stockCode, () => {
  expanded.value = txs.value.length > 0
})
</script>

<style lang="scss" scoped src="./PositionManager.scss"></style>

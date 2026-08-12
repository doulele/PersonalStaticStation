/**
 * 持仓管理 Composable
 * - 多只股票的交易记录管理（买入/卖出/分红/送股）
 * - 自动计算持仓均价、浮动盈亏、已实现盈亏
 * - localStorage 持久化
 */

import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'stock_positions_v1'

// ==================== 全局状态（跨组件共享） ====================
const allPositions = ref(loadFromStorage())

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allPositions.value))
}

// ==================== 交易类型 ====================
// buy: 买入, sell: 卖出, dividend: 现金分红, bonus: 送股/转增
export const TX_TYPES = {
  buy: { label: '买入', color: '#f87171', sign: 1 },
  sell: { label: '卖出', color: '#4ade80', sign: -1 },
  dividend: { label: '分红', color: '#eab308', sign: 0 },
  bonus: { label: '送股', color: '#a78bfa', sign: 0 },
}

// ==================== 单只股票的计算 ====================

/**
 * 获取某只股票的所有交易记录
 */
export function getTransactions(stockCode) {
  return allPositions.value[stockCode]?.transactions || []
}

/**
 * 添加交易记录
 * @param {string} stockCode 股票代码
 * @param {object} tx { type, price, shares, date, note, ratio }
 *   - type: 'buy'|'sell'|'dividend'|'bonus'
 *   - price: 价格（分红填每股金额，送股填0）
 *   - shares: 股数/金额
 *   - date: 日期 YYYY-MM-DD
 *   - note: 备注
 *   - ratio: 送股比例（仅 bonus 类型，如 10送3 则 ratio=0.3）
 */
export function addTransaction(stockCode, tx) {
  if (!allPositions.value[stockCode]) {
    allPositions.value[stockCode] = { transactions: [] }
  }
  const id = Date.now() + Math.random().toString(36).slice(2, 6)
  allPositions.value[stockCode].transactions.push({
    id,
    type: tx.type,
    price: Number(tx.price) || 0,
    shares: Number(tx.shares) || 0,
    date: tx.date || new Date().toISOString().slice(0, 10),
    note: tx.note || '',
    fee: tx.fee != null ? Number(tx.fee) : null,
    ratio: tx.type === 'bonus' ? (Number(tx.ratio) || 0) : 0,
  })
  // 按日期排序（最新的在前）
  allPositions.value[stockCode].transactions.sort((a, b) => b.date.localeCompare(a.date))
  saveToStorage()
}

/**
 * 删除交易记录
 */
export function removeTransaction(stockCode, txId) {
  if (!allPositions.value[stockCode]) return
  allPositions.value[stockCode].transactions = allPositions.value[stockCode].transactions.filter(t => t.id !== txId)
  if (allPositions.value[stockCode].transactions.length === 0) {
    delete allPositions.value[stockCode]
  }
  saveToStorage()
}

/**
 * 更新交易记录
 */
export function updateTransaction(stockCode, txId, updates) {
  const list = allPositions.value[stockCode]?.transactions
  if (!list) return
  const idx = list.findIndex(t => t.id === txId)
  if (idx === -1) return
  Object.assign(list[idx], updates)
  list.sort((a, b) => b.date.localeCompare(a.date))
  saveToStorage()
}

/**
 * 清空某只股票的所有交易
 */
export function clearTransactions(stockCode) {
  delete allPositions.value[stockCode]
  saveToStorage()
}

// ==================== 持仓计算 ====================

/**
 * 计算单只股票的持仓概览
 * 成本价采用券商「摊薄成本价」口径：
 *   摊薄均价 = (累计买入金额含手续费 − 累计卖出回笼金额 + 累计卖出费用) ÷ 当前股数
 * 特点：历史已实现盈亏会摊进剩余持仓成本，与券商 App 展示一致。
 * 已实现盈亏仍按移动加权配对计算：
 * - 买入增加持仓和总成本，重新计算均价
 * - 卖出按当时的均价配对，计算已实现盈亏
 * - 分红记录现金收入
 * - 送股增加持仓但不增加成本（摊薄均价）
 */
/**
 * 获取某笔交易的实际费用
 * 优先用记录中的 fee 字段，没有则从同类型历史记录推算
 */
function getActualFee(tx, allTxs) {
  // 有实际费用直接用
  if (tx.fee != null) return Number(tx.fee)
  // 从历史记录中找同类型的平均费用
  const sameType = allTxs.filter(t => t.type === tx.type && t.fee != null)
  if (sameType.length > 0) {
    const avg = sameType.reduce((s, t) => s + Number(t.fee), 0) / sameType.length
    return +avg.toFixed(2)
  }
  // 无历史数据，用默认估算（买入5元，卖出按佣金+印花税估算）
  const amount = tx.shares * tx.price
  if (tx.type === 'buy') {
    return +Math.max(amount * 0.00025, 5).toFixed(2)
  }
  // 卖出：佣金最低5元 + 印花税0.1%
  return +(Math.max(amount * 0.00025, 5) + amount * 0.001).toFixed(2)
}

export function calcPosition(stockCode, currentPrice) {
  const txs = getTransactions(stockCode)
  if (!txs.length) return null

  let totalDividend = 0 // 累计分红
  let realizedPnl = 0   // 已实现盈亏（移动加权配对）
  let totalShares = 0   // 当前持仓
  let totalCost = 0     // 移动加权当前持仓成本（用于配对，非展示口径）
  let totalFees = 0     // 累计手续费
  let totalBuyCost = 0  // 累计买入金额（含手续费），摊薄口径分子
  let totalSellAmt = 0  // 累计卖出回笼金额（不含费用），摊薄口径扣减项
  let totalSellFee = 0  // 累计卖出费用，摊薄口径加回项

  // 按日期排序（早→晚）处理
  const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date))

  for (const tx of sorted) {
    if (tx.type === 'buy') {
      const amount = tx.shares * tx.price
      const fee = getActualFee(tx, sorted)
      totalShares += tx.shares
      totalCost += amount + fee
      totalBuyCost += amount + fee
      totalFees += fee
    } else if (tx.type === 'bonus' && tx.ratio > 0 && totalShares > 0) {
      const bonusShares = Math.floor(totalShares * tx.ratio)
      totalShares += bonusShares
    } else if (tx.type === 'sell') {
      if (totalShares <= 0) continue
      const sellShares = Math.min(tx.shares, totalShares)
      const avgAtSell = totalCost / totalShares
      const fee = getActualFee(tx, sorted)
      realizedPnl += (tx.price - avgAtSell) * sellShares - fee
      totalCost -= sellShares * avgAtSell
      totalShares -= sellShares
      totalSellAmt += tx.price * sellShares
      totalSellFee += fee
      totalFees += fee
    } else if (tx.type === 'dividend') {
      const divAmount = tx.shares > 0 ? tx.shares : (tx.price * totalShares)
      totalDividend += divAmount
      realizedPnl += divAmount
    }
  }

  // 券商摊薄成本价口径
  const avgCost = totalShares > 0 ? (totalBuyCost - totalSellAmt + totalSellFee) / totalShares : 0

  // 持仓盈亏（按摊薄成本价）
  const floatPnl = currentPrice && totalShares > 0 ? (currentPrice - avgCost) * totalShares : 0
  const floatPnlPct = avgCost > 0 ? ((currentPrice - avgCost) / avgCost * 100) : 0

  return {
    totalShares,
    avgCost: +avgCost.toFixed(3),
    totalCost: +totalCost.toFixed(2),
    totalFees: +totalFees.toFixed(2),
    totalDividend: +totalDividend.toFixed(2),
    realizedPnl: +realizedPnl.toFixed(2),
    floatPnl: +floatPnl.toFixed(2),
    floatPnlPct: +floatPnlPct.toFixed(2),
    totalPnl: +(realizedPnl + floatPnl).toFixed(2),
    currentValue: currentPrice ? +(currentPrice * totalShares).toFixed(2) : 0,
    hasPosition: totalShares > 0,
    txCount: txs.length,
    totalBought: txs.filter(t => t.type === 'buy').reduce((s, t) => s + t.shares, 0),
    totalSold: txs.filter(t => t.type === 'sell').reduce((s, t) => s + t.shares, 0),
  }
}

// ==================== 对外暴露 ====================

/**
 * 获取所有有持仓的股票代码列表
 */
export function getAllStockCodes() {
  return Object.keys(allPositions.value).filter(code => {
    const txs = allPositions.value[code]?.transactions || []
    return txs.length > 0
  })
}

/**
 * 判断某只股票是否有交易记录
 */
export function hasTransactions(stockCode) {
  return (allPositions.value[stockCode]?.transactions?.length || 0) > 0
}

export { allPositions }

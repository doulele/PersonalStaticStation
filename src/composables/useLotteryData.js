/**
 * 彩票数据共享状态
 * SSQPanel / DLTPanel 通过此 composable 获取真实数据（替代 mock 数据）
 */
import { ref, readonly } from 'vue'
import { fetchBaseData, syncRecentData, fetchStats } from '@/api/lottery'

// ==================== 模块级共享状态 ====================
const ssqData = ref(null)          // 双色球数据
const dltData = ref(null)          // 大乐透数据
const loading = ref(false)         // 加载状态
const dataSource = ref('mock')     // 'mock' | 'cache' | 'api'
const stats = ref(null)            // 缓存统计
const lastSyncMsg = ref('')        // 最近同步消息

// ==================== 操作函数 ====================

/**
 * 初始化：从后端缓存加载基础数据
 */
async function loadBaseData() {
  if (ssqData.value && dltData.value) return // 已加载过

  loading.value = true
  let hasAnyData = false

  for (const type of ['ssq', 'dlt']) {
    try {
      const result = await fetchBaseData(type)
      if (result && result.code === 1 && Array.isArray(result.data) && result.data.length > 0) {
        if (type === 'ssq') ssqData.value = result.data
        else dltData.value = result.data
        hasAnyData = true
        console.log(`[useLotteryData] ${type} 从缓存加载了 ${result.data.length} 条数据`)
      }
    } catch (e) {
      console.log(`[useLotteryData] ${type} 缓存数据不可用:`, e.message)
    }
  }

  if (hasAnyData) {
    dataSource.value = 'cache'
  }

  loading.value = false

  // 同时加载统计信息
  loadStats()
}

/**
 * 加载缓存统计
 */
async function loadStats() {
  try {
    const result = await fetchStats()
    if (result && result.code === 1) {
      stats.value = result.data
    }
  } catch (e) {
    console.log('[useLotteryData] 统计加载失败')
  }
}

/**
 * 从 RollToolsApi 同步近期数据
 */
async function syncData(type, count = 200) {
  loading.value = true
  lastSyncMsg.value = ''

  try {
    const result = await syncRecentData(type, count)
    if (result && result.code === 1) {
      const { records, total, newAdded } = result.data
      if (type === 'ssq') ssqData.value = records
      else dltData.value = records
      dataSource.value = 'api'

      lastSyncMsg.value = `同步完成: ${type} 共 ${total} 期 (新增 ${newAdded} 期)`
      await loadStats()
      return { success: true, msg: lastSyncMsg.value }
    } else {
      lastSyncMsg.value = '同步失败: ' + (result?.msg || '未知错误')
      return { success: false, msg: lastSyncMsg.value }
    }
  } catch (e) {
    lastSyncMsg.value = '同步失败: ' + e.message
    return { success: false, msg: lastSyncMsg.value }
  } finally {
    loading.value = false
  }
}

/**
 * 检查是否有真实数据可用
 */
function hasRealData(type) {
  if (type === 'ssq') return ssqData.value && ssqData.value.length > 0
  if (type === 'dlt') return dltData.value && dltData.value.length > 0
  return false
}

// ==================== 导出 ====================
export function useLotteryData() {
  return {
    ssqData: readonly(ssqData),
    dltData: readonly(dltData),
    loading,
    dataSource,
    stats,
    lastSyncMsg,
    loadBaseData,
    loadStats,
    syncData,
    hasRealData
  }
}

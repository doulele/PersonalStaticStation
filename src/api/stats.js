// ==================== 工具点击统计 API ====================

const API_BASE = '/staticTool/api/stats'

/**
 * 记录一次工具页面点击
 * @param {string} toolPath - 工具路由路径，如 "/home/lifeServices/lottery"
 */
export async function recordToolClick(toolPath) {
  try {
    await fetch(`${API_BASE}/tool-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: toolPath })
    })
  } catch (e) {
    // 静默失败，不影响导航
    console.warn('[recordToolClick] 上报失败:', e.message)
  }
}

/**
 * 获取工具点击量排名
 * @returns {Promise<Array<{path: string, clicks: number}>>}
 */
export async function fetchToolRanking() {
  try {
    const res = await fetch(`${API_BASE}/tool-ranking`)
    const data = await res.json()
    return data.code === 1 ? data.data : []
  } catch (e) {
    console.warn('[fetchToolRanking] 获取失败:', e.message)
    return []
  }
}

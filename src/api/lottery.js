// ==================== 彩票开奖数据 API ====================
// 通过后端代理请求 RollToolsApi (mxnzp.com)
// 敏感密钥 (app_id/app_secret) 仅在后端 .env 中，前端不可见

const API_BASE = '/staticTool/api/lottery'

/**
 * 解析 MXNZP API 返回的开奖号码
 *
 * 实际 API 返回的 openCode 格式多变，需做统一兼容：
 *   SSQ: "01,02,03,04,05,06+07"       → { reds: [1..6], blue: 7 }
 *   SSQ: "01,02,03,04,05,06,07"       → 无 + → 前6红蓝，第7为蓝球
 *   DLT: "25,29,08,10,30+01+02"       → 后区也用 + 分隔
 *   DLT: "01,02,03,04,05+06,07"       → 后区逗号分隔
 *   DLT: "01,02,03,04,05,06,07"       → 无 + → 前5前区，后2后区
 *
 * 处理策略：
 * 1. 找到第一个 "+" → 之前为前区/红球，之后全部为后区/蓝球
 * 2. 后区部分可能再含 "+"（DLT 两个后区号码用 + 隔开），统一替换为 ","
 * 3. 均用逗号 split 取数字
 */
function parseOpenCode(openCode, type) {
  if (!openCode) return {}

  const cleaned = openCode.trim()

  // 按第一个 "+" 划分主区域和特殊区域
  let main = '', special = ''
  const plusIdx = cleaned.indexOf('+')
  if (plusIdx > -1) {
    main = cleaned.slice(0, plusIdx).trim()
    // 后区可能也用 "+" 分隔（DLT: "01+02"），统一转为逗号
    special = cleaned.slice(plusIdx + 1).replace(/\+/g, ',').trim()
  } else {
    main = cleaned
  }

  // 逗号分隔取数字；兼容首尾空格
  const mainNums = main.split(',').map(Number).filter(n => !isNaN(n) && n > 0)
  const specialNums = special.split(',').map(Number).filter(n => !isNaN(n) && n > 0)

  if (type === 'ssq') {
    // 双色球: 6 红球 + 1 蓝球（无 + 时第 7 个数字为蓝球）
    return {
      reds: mainNums.slice(0, 6),
      blue: specialNums[0] || mainNums[6] || 0
    }
  } else {
    // 大乐透: 5 前区 + 2 后区
    const allNums = [...mainNums, ...specialNums]
    return {
      fronts: allNums.slice(0, 5),
      backs: allNums.slice(5, 7)
    }
  }
}

/**
 * 根据期号查询开奖结果
 */
export async function fetchDrawByIssue(issue, type) {
  try {
    const res = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lottery_id: type, lottery_no: issue })
    })
    const data = await res.json()
    if (data.code === 1 && data.data) {
      const d = data.data
      return {
        ...parseOpenCode(d.openCode, type),
        issue: d.expect || '',
        date: (d.time || '').split(' ')[0],
        prizePool: d.prizePool || ''
      }
    }
    // API 返回错误时提示用户
    console.warn('[fetchDrawByIssue] API 返回错误:', data.msg)
    return null
  } catch (e) {
    console.warn('[fetchDrawByIssue] 请求失败:', e.message)
    return null
  }
}

/**
 * 查询最新开奖结果
 */
export async function fetchLatestDraw(type) {
  try {
    const res = await fetch(`${API_BASE}/latest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lottery_id: type })
    })
    const data = await res.json()
    if (data.code === 1 && data.data) {
      const d = data.data
      return {
        ...parseOpenCode(d.openCode, type),
        issue: d.expect || '',
        date: (d.time || '').split(' ')[0],
        prizePool: d.prizePool || ''
      }
    }
    console.warn('[fetchLatestDraw] API 返回错误:', data.msg)
    return null
  } catch (e) {
    console.warn('[fetchLatestDraw] 请求失败:', e.message)
    return null
  }
}

/**
 * 查询历史开奖结果列表（近 N 期）
 */
export async function fetchHistoryDraws(type, count = 50) {
  try {
    const res = await fetch(`${API_BASE}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lottery_id: type, page_size: count })
    })
    const data = await res.json()
    if (data.code === 1 && Array.isArray(data.data)) {
      return data.data.map(d => ({
        ...parseOpenCode(d.openCode, type),
        issue: d.expect || '',
        date: (d.time || '').split(' ')[0],
        prizePool: d.prizePool || ''
      }))
    }
    console.warn('[fetchHistoryDraws] API 返回错误:', data.msg)
    return []
  } catch (e) {
    console.warn('[fetchHistoryDraws] 请求失败:', e.message)
    return []
  }
}

// ==================== 数据同步 API（新增） ====================

/**
 * 获取缓存的彩票基础数据
 * @param {'ssq' | 'dlt'} type
 * @returns {Promise<{code: number, msg: string, data: Array|null}>}
 */
export async function fetchBaseData(type) {
  try {
    const res = await fetch(`${API_BASE}/base-data/${type}`)
    return await res.json()
  } catch (e) {
    console.warn('[fetchBaseData] 请求失败:', e.message)
    return { code: -1, msg: e.message, data: null }
  }
}

/**
 * 获取缓存统计信息
 */
export async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`)
    return await res.json()
  } catch (e) {
    return { code: -1, msg: e.message, data: null }
  }
}

/**
 * 从 RollToolsApi 同步近期数据
 * @param {'ssq' | 'dlt'} type
 * @param {number} count - 数量 (最多300)
 */
export async function syncRecentData(type, count = 200) {
  try {
    const res = await fetch(`${API_BASE}/sync-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, count })
    })
    return await res.json()
  } catch (e) {
    return { code: -1, msg: e.message, data: null }
  }
}

/**
 * 全量重新爬取（需密码）
 * @param {'ssq' | 'dlt' | 'all'} type
 * @param {string} password
 */
export async function syncFullData(type, password) {
  try {
    const res = await fetch(`${API_BASE}/sync-full`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, password })
    })
    return await res.json()
  } catch (e) {
    return { code: -1, msg: e.message, data: null }
  }
}

/**
 * 验证爬取密码
 * @param {string} password
 */
export async function verifyPassword(password) {
  try {
    const res = await fetch(`${API_BASE}/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
    return await res.json()
  } catch (e) {
    return { code: -1, msg: e.message, data: { valid: false } }
  }
}

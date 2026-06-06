// ==================== 彩票开奖数据 API ====================
// 当前使用 mock 数据，接入真实接口时替换为后端代理请求

const USE_REAL_API = false // 改为 true 并配置 JUHE_KEY 后启用真实接口

/**
 * Vite 代理配置（vite.config.js 中添加）：
 *   server: { proxy: { '/api/lottery': { target: 'https://apis.juhe.cn/lottery', changeOrigin: true, rewrite: path => path.replace(/^\/api\/lottery/, '') } } }
 * 然后设置 USE_REAL_API = true，JUHE_KEY 填入你的 key
 */
const JUHE_KEY = 'YOUR_JUHE_KEY'

/**
 * 根据期号查询开奖结果
 */
export async function fetchDrawByIssue(issue, type) {
  if (USE_REAL_API) {
    try {
      const res = await fetch(`/api/lottery/query?lottery_id=${type}&lottery_no=${issue}&key=${JUHE_KEY}`)
      const data = await res.json()
      if (data.error_code === 0 && data.result) {
        return parseJuheResult(type, data.result)
      }
    } catch (e) {
      console.warn('真实接口请求失败，fallback mock:', e.message)
    }
  }
  // Mock: 基于期号生成确定性开奖结果
  return getMockByIssue(issue, type)
}

/**
 * 查询最新开奖结果
 */
export async function fetchLatestDraw(type) {
  if (USE_REAL_API) {
    try {
      const res = await fetch(`/api/lottery/query?lottery_id=${type}&key=${JUHE_KEY}`)
      const data = await res.json()
      if (data.error_code === 0 && data.result) {
        return parseJuheResult(type, data.result)
      }
    } catch (e) {
      console.warn('真实接口请求失败，fallback mock:', e.message)
    }
  }
  return getMockLatest(type)
}

/**
 * 查询历史开奖结果列表（近 N 期）
 */
export async function fetchHistoryDraws(type, count = 50) {
  if (USE_REAL_API) {
    try {
      const res = await fetch(`/api/lottery/history?lottery_id=${type}&page_size=${count}&key=${JUHE_KEY}`)
      const data = await res.json()
      if (data.error_code === 0 && data.result?.lotteryResList) {
        return data.result.lotteryResList.map(r => parseJuheResult(type, r))
      }
    } catch (e) {
      console.warn('真实接口请求失败，fallback mock:', e.message)
    }
  }
  return getMockHistory(type, count)
}

function parseJuheResult(type, raw) {
  if (type === 'ssq') {
    return {
      issue: raw.lottery_no || raw.issue,
      date: raw.lottery_date || raw.date,
      reds: (raw.lottery_res || '').split(',').slice(0, 6).map(Number),
      blue: Number((raw.lottery_res || '').split(',')[6] || 0),
      prizePool: raw.lottery_sale_amount || '',
    }
  } else {
    const parts = (raw.lottery_res || '').split(',')
    return {
      issue: raw.lottery_no || raw.issue,
      date: raw.lottery_date || raw.date,
      fronts: parts.slice(0, 5).map(Number),
      backs: parts.slice(5, 7).map(Number),
      prizePool: raw.lottery_sale_amount || '',
    }
  }
}

// ==================== Mock 数据 ====================

const SSQ_HOT_NUMS = {
  reds: [6, 9, 12, 14, 17, 19, 22, 24, 26, 27, 29, 31, 32],
  blues: [1, 4, 7, 9, 12, 15],
}

const DLT_HOT_NUMS = {
  fronts: [7, 10, 12, 14, 17, 19, 22, 24, 27, 29, 31, 33],
  backs: [2, 5, 7, 9, 11],
}

/**
 * 基于种子的确定性伪随机（确保同一期号始终返回相同号码）
 */
function seededRandom(seed) {
  let s = seed
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function deterministicPicks(pool, count, seed) {
  const rand = seededRandom(seed)
  const shuffled = [...pool].sort(() => rand() - 0.5)
  return shuffled.slice(0, count).sort((a, b) => a - b)
}

function generateIssue(date, index) {
  const year = date.getFullYear()
  const base = (date.getMonth() + 1) * 100 + date.getDate()
  const seq = String(index + 1).padStart(3, '0')
  return `${year}${String(base).padStart(4, '0')}${seq}`
}

/**
 * 根据期号计算种子（确保同一期号+彩种永远返回相同结果）
 */
function issueSeed(issue, type) {
  let hash = 0
  const str = issue + '_' + type
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function getMockLatest(type) {
  const now = new Date()
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const issue = generateIssue(now, 0)
  const seed = issueSeed(issue, type)
  if (type === 'ssq') {
    return {
      issue,
      date,
      reds: deterministicPicks(SSQ_HOT_NUMS.reds, 6, seed),
      blue: SSQ_HOT_NUMS.blues[Math.floor(seededRandom(seed + 1000)() * SSQ_HOT_NUMS.blues.length)],
    }
  } else {
    return {
      issue,
      date,
      fronts: deterministicPicks(DLT_HOT_NUMS.fronts, 5, seed),
      backs: deterministicPicks(DLT_HOT_NUMS.backs, 2, seed + 2000),
    }
  }
}

/**
 * 根据指定期号生成 mock 开奖数据（确定性）
 */
function getMockByIssue(issue, type) {
  const seed = issueSeed(issue, type)
  // 从期号反推日期（粗略估计：期号前8位可能是日期）
  let date = ''
  if (issue.length >= 8) {
    const year = issue.substring(0, 4)
    const month = issue.substring(4, 6)
    const day = issue.substring(6, 8)
    date = `${year}-${month}-${day}`
  } else {
    const now = new Date()
    date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }
  if (type === 'ssq') {
    return {
      issue,
      date,
      reds: deterministicPicks(SSQ_HOT_NUMS.reds, 6, seed),
      blue: SSQ_HOT_NUMS.blues[Math.floor(seededRandom(seed + 1000)() * SSQ_HOT_NUMS.blues.length)],
    }
  } else {
    return {
      issue,
      date,
      fronts: deterministicPicks(DLT_HOT_NUMS.fronts, 5, seed),
      backs: deterministicPicks(DLT_HOT_NUMS.backs, 2, seed + 2000),
    }
  }
}

function getMockHistory(type, count) {
  const results = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() - i * 3 - (type === 'ssq' ? 0 : 1))
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const issue = generateIssue(d, i)
    const seed = issueSeed(issue, type)
    if (type === 'ssq') {
      results.push({
        issue,
        date: dateStr,
        reds: deterministicPicks(SSQ_HOT_NUMS.reds, 6, seed),
        blue: SSQ_HOT_NUMS.blues[Math.floor(seededRandom(seed + 1000)() * SSQ_HOT_NUMS.blues.length)],
      })
    } else {
      results.push({
        issue,
        date: dateStr,
        fronts: deterministicPicks(DLT_HOT_NUMS.fronts, 5, seed),
        backs: deterministicPicks(DLT_HOT_NUMS.backs, 2, seed + 2000),
      })
    }
  }
  return results
}

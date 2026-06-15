// ==================== 共享工具函数 ====================

// ==================== 票据工具函数 ====================

/**
 * 生成随机16进制序列号 (20位)
 */
export function genSerial() {
  const chars = '0123456789ABCDEF'
  let s = ''
  for (let i = 0; i < 20; i++) s += chars[Math.floor(Math.random() * 16)]
  return s
}

/**
 * 生成随机流水号 (8位)
 */
export function genFlowNo() {
  return String(Math.floor(Math.random() * 90000000) + 10000000)
}

/**
 * 生成随机站点号 (10位)
 */
export function genStationNo() {
  const area = String(Math.floor(Math.random() * 900000) + 100000)
  const shop = String(Math.floor(Math.random() * 9000) + 1000)
  return area + shop
}

/**
 * 生成模拟期号
 */
export function genIssue() {
  const now = new Date()
  const year = now.getFullYear()
  const weekNum = Math.ceil(
    (new Date(year, now.getMonth(), now.getDate()) - new Date(year, 0, 1)) / (7 * 86400000)
  )
  return `${year}${String(weekNum * 3).padStart(3, '0')}`
}

// ==================== 核心算法 ====================

/**
 * 加权不放回抽样
 * @param {number[]} weights - 权重数组（索引0对应数字1）
 * @param {number} maxNum - 最大数字
 * @param {number} k - 抽取个数
 * @returns {number[]} 抽取的数字数组（1-based）
 */
export function weightedSampleWithoutReplace(weights, maxNum, k) {
  const items = [...Array(maxNum).keys()]
  const w = [...weights]
  const result = []
  for (let t = 0; t < k; t++) {
    const total = w.reduce((a, b) => a + b, 0)
    const r = Math.random() * total
    let acc = 0
    for (let i = 0; i < items.length; i++) {
      acc += w[i]
      if (r <= acc) {
        result.push(items[i] + 1)
        w.splice(i, 1)
        items.splice(i, 1)
        break
      }
    }
  }
  return result
}

/**
 * 加权有放回抽样（抽1个）
 * @param {number[]} weights
 * @param {number} maxNum
 * @returns {number} 索引 (0-based)
 */
export function weightedSampleOne(weights, maxNum) {
  const total = weights.reduce((a, b) => a + b, 0)
  let rand = Math.random() * total
  let acc = 0
  for (let i = 0; i < maxNum; i++) {
    acc += weights[i]
    if (rand <= acc) return i
  }
  return 0
}

/**
 * 生成模拟红球数据
 * @returns {number[]} 6个不重复的排序红球
 */
export function generateMockReds(redCount = 33) {
  const hotPool = redCount === 33
    ? [9, 12, 14, 16, 19, 22, 25, 27, 29, 31]
    : [9, 12, 14, 16, 19, 22, 25, 27, 29, 31, 34]
  const picks = []
  while (picks.length < (redCount === 33 ? 6 : 5)) {
    let pick
    if (Math.random() < 0.7 && hotPool.length) {
      pick = hotPool[Math.floor(Math.random() * hotPool.length)]
    } else {
      pick = Math.floor(Math.random() * redCount) + 1
    }
    if (!picks.includes(pick)) picks.push(pick)
  }
  picks.sort((a, b) => a - b)
  return picks
}

/**
 * 生成内置数据集
 * @param {Object} options - { redCount, blueCount, startYear, endYear }
 */
export function buildBuiltInDataset(options = {}) {
  const {
    redCount = 33,
    blueCount = 16,
    startYear = 2020,
    endYear = 2024,
    count = 320,
  } = options
  const data = []
  const startDate = new Date(startYear, 0, 2)
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i * 3)
    if (d.getFullYear() > endYear) break
    const reds = generateMockReds(redCount)
    const blue = ((i * 13 + 7) % blueCount) + 1
    data.push({ date: d.toISOString().slice(0, 10), reds, blue })
  }
  return data
}

// ==================== 组合过滤工具 ====================

/**
 * 检查组合是否满足奇偶比约束
 * @param {number[]} reds - 红球/前区数组（已排序）
 * @param {number} minOdd - 最小奇数个数
 * @param {number} maxOdd - 最大奇数个数
 */
export function checkOddEven(reds, minOdd, maxOdd) {
  const oddCount = reds.filter(n => n % 2 === 1).length
  return oddCount >= minOdd && oddCount <= maxOdd
}

/**
 * 检查组合是否满足和值范围
 */
export function checkSum(reds, minSum, maxSum) {
  const sum = reds.reduce((a, b) => a + b, 0)
  return sum >= minSum && sum <= maxSum
}

/**
 * 检查组合是否包含连号
 */
export function hasConsecutive(reds) {
  for (let i = 1; i < reds.length; i++) {
    if (reds[i] - reds[i - 1] === 1) return true
  }
  return false
}

/**
 * 检查组合是否包含与历史最新一期重复的数字
 * @param {number[]} reds - 待检查的组合
 * @param {number[]} lastReds - 最新一期的红球
 * @param {number} maxRepeat - 最大允许重号个数
 */
export function checkRepeat(reds, lastReds, maxRepeat) {
  if (!lastReds || lastReds.length === 0) return true
  const overlap = reds.filter(n => lastReds.includes(n)).length
  return overlap <= maxRepeat
}

/**
 * 获取热号列表（概率高于阈值）
 * @param {number[]} probArr - 概率数组 (1-based, 索引1对应数字1)
 * @param {number} threshold - 热号阈值百分比
 * @returns {Set<number>} 热号数字集合
 */
export function getHotNumbers(probArr, threshold) {
  const hot = new Set()
  const avg = probArr.slice(1).reduce((a, b) => a + b, 0) / (probArr.length - 1) || 0
  for (let i = 1; i < probArr.length; i++) {
    if (probArr[i] >= avg * threshold) hot.add(i)
  }
  return hot
}

/**
 * 检查组合是否满足热号比例约束
 * @param {number[]} reds - 组合
 * @param {Set<number>} hotSet - 热号集合
 * @param {number} minHot - 最少热号个数
 * @param {number} maxHot - 最多热号个数
 */
export function checkHotRatio(reds, hotSet, minHot, maxHot) {
  const hotCount = reds.filter(n => hotSet.has(n)).length
  return hotCount >= minHot && hotCount <= maxHot
}

/**
 * 核心统计计算（适用于双色球和大乐透）
 * @param {Array} filtered - 过滤后的历史数据
 * @param {Object} options - { mode, lambda, redMax, blueMax, redPickCount, bluePickCount }
 * @returns {Object} { redProb, blueProb, posProb, periodCount }
 */
export function computeStatistics(filtered, options = {}) {
  const {
    mode = 'weighted',
    lambda = 0.07,
    redMax = 33,
    blueMax = 16,
    redPickCount = 6,
    bluePickCount = 1,
  } = options
  if (filtered.length === 0) {
    return {
      redProb: new Array(redMax + 1).fill(0),
      blueProb: new Array(blueMax + 1).fill(0),
      posProb: {},
      periodCount: 0,
    }
  }

  const redCount = new Array(redMax + 1).fill(0)
  const blueCount = new Array(blueMax + 1).fill(0)
  const posCount = Array.from({ length: redPickCount + 1 }, () => new Array(redMax + 1).fill(0))
  let totalWeight = 0

  for (let i = 0; i < filtered.length; i++) {
    const item = filtered[i]
    let weight = 1
    if (mode === 'weighted') {
      const idx = filtered.length - 1 - i
      weight = Math.exp(-lambda * idx)
    }
    totalWeight += weight
    for (const r of item.reds) redCount[r] += weight
    // 支持后区多球
    if (Array.isArray(item.blues)) {
      for (const b of item.blues) blueCount[b] += weight
    } else {
      blueCount[item.blue] += weight
    }
    for (let pos = 0; pos < item.reds.length; pos++) {
      const num = item.reds[pos]
      posCount[pos + 1][num] += weight
    }
  }

  const redProb = redCount.map(v => (v / totalWeight) * 100)
  const blueProb = blueCount.map(v => (v / totalWeight) * 100)
  const posProb = {}
  for (let p = 1; p <= redPickCount; p++) {
    const arr = new Array(redMax + 1).fill(0)
    for (let n = 1; n <= redMax; n++) arr[n] = (posCount[p][n] / totalWeight) * 100
    posProb[`pos${p}`] = arr
  }
  return { redProb, blueProb, posProb, periodCount: filtered.length }
}

// ==================== 012路分布方案 ====================

/** 按 mod 3 分组 */
function groupByRoad(maxNum) {
  const g = { 0: [], 1: [], 2: [] }
  for (let i = 1; i <= maxNum; i++) g[i % 3].push(i)
  return g
}

/** 常见012路分布（按历史频率排序） */
function commonRoadDists(pick) {
  if (pick === 6) return [[2,2,2],[3,2,1],[3,1,2],[2,3,1],[2,1,3],[1,3,2],[1,2,3],[4,1,1],[3,3,0]]
  if (pick === 5) return [[2,2,1],[2,1,2],[1,2,2],[3,1,1],[1,3,1],[1,1,3],[3,2,0],[2,3,0],[4,1,0]]
  return [[1,1,1]]
}

/** 从分组数组中不放回采样 */
function sampleFromGroup(nums, weights, n) {
  const items = nums.map(x => ({ num: x, w: Math.max(weights[x - 1], 0.001) }))
  const res = []
  let pool = [...items]
  for (let i = 0; i < n && pool.length > 0; i++) {
    const total = pool.reduce((s, it) => s + it.w, 0)
    let rand = Math.random() * total, acc = 0
    for (let j = 0; j < pool.length; j++) {
      acc += pool[j].w
      if (rand <= acc) { res.push(pool[j].num); pool.splice(j, 1); break }
    }
  }
  return res
}

/**
 * 012路分布采样
 */
export function road012Sample(weights, maxNum, pickCount) {
  const groups = groupByRoad(maxNum)
  const dists = commonRoadDists(pickCount)
  for (let a = 0; a < 80; a++) {
    const [n0, n1, n2] = dists[Math.floor(Math.random() * dists.length)]
    if (n0 > groups[0].length || n1 > groups[1].length || n2 > groups[2].length) continue
    const result = [
      ...sampleFromGroup(groups[0], weights, n0),
      ...sampleFromGroup(groups[1], weights, n1),
      ...sampleFromGroup(groups[2], weights, n2),
    ]
    if (new Set(result).size === pickCount) { result.sort((a, b) => a - b); return result }
  }
  return weightedSampleWithoutReplace([...weights], maxNum, pickCount).sort((a, b) => a - b)
}

// ==================== 龙头凤尾方案 ====================

/**
 * 分析历史数据的龙头/凤尾分布概率
 * @returns {{ headProb: number[], tailProb: number[] }} — 归一化后的概率数组(0-based索引)
 */
export function analyzeHeadAndTail(history, maxNum) {
  const headCount = new Array(maxNum).fill(0)
  const tailCount = new Array(maxNum).fill(0)
  let total = 0
  for (const item of history) {
    const reds = item.reds || item.fronts
    if (!reds || reds.length < 2) continue
    headCount[reds[0] - 1]++
    tailCount[reds[reds.length - 1] - 1]++
    total++
  }
  return {
    headProb: headCount.map(v => (total ? v / total : 0)),
    tailProb: tailCount.map(v => (total ? v / total : 0)),
  }
}

/**
 * 龙头凤尾采样：先定头尾，中间用加权填充
 */
export function headTailSample(weights, maxNum, pickCount, headProb, tailProb) {
  for (let a = 0; a < 80; a++) {
    const head = weightedSampleOne(headProb, maxNum) + 1
    const tail = weightedSampleOne(tailProb, maxNum) + 1
    if (head >= tail) continue
    const midCount = pickCount - 2
    if (midCount === 0) return [head, tail]
    const available = []
    for (let n = head + 1; n < tail; n++) available.push(n)
    if (available.length < midCount) continue
    const mw = available.map(n => Math.max(weights[n - 1], 0.001))
    const ids = weightedSampleWithoutReplace(mw, mw.length, midCount)
    const mids = ids.map(i => available[i - 1])
    const result = [head, ...mids, tail].sort((a, b) => a - b)
    if (new Set(result).size === pickCount) return result
  }
  return weightedSampleWithoutReplace([...weights], maxNum, pickCount).sort((a, b) => a - b)
}

// ==================== 跨度+和值约束方案 ====================

/**
 * 分析历史跨度与和值的中心80%区间
 */
export function analyzeSpanAndSum(history) {
  const spans = [], sums = []
  for (const item of history) {
    const reds = item.reds || item.fronts
    if (!reds || reds.length < 2) continue
    spans.push(reds[reds.length - 1] - reds[0])
    sums.push(reds.reduce((a, b) => a + b, 0))
  }
  spans.sort((a, b) => a - b); sums.sort((a, b) => a - b)
  const n = history.length
  if (n < 5) return { minSpan: 0, maxSpan: 99, minSum: 0, maxSum: 999 }
  const p10 = Math.floor(n * 0.1)
  const p90 = Math.floor(n * 0.9)
  return { minSpan: spans[p10], maxSpan: spans[p90], minSum: sums[p10], maxSum: sums[p90] }
}

/**
 * 跨度+和值约束采样
 */
export function spanSumSample(weights, maxNum, pickCount, minSpan, maxSpan, minSum, maxSum) {
  for (let a = 0; a < 100; a++) {
    const reds = weightedSampleWithoutReplace([...weights], maxNum, pickCount)
    reds.sort((a, b) => a - b)
    const span = reds[reds.length - 1] - reds[0]
    const sum = reds.reduce((a, b) => a + b, 0)
    if (span >= minSpan && span <= maxSpan && sum >= minSum && sum <= maxSum) return reds
  }
  return weightedSampleWithoutReplace([...weights], maxNum, pickCount).sort((a, b) => a - b)
}

// ==================== 遗漏追冷方案 ====================

/**
 * 计算每个数字的遗漏值（距今多少期未出）
 * @returns {number[]} 0-based 权重数组，遗漏值越大权重越高
 */
export function calcMissingWeights(history, maxNum) {
  const lastSeen = new Array(maxNum).fill(history.length)
  for (let idx = history.length - 1; idx >= 0; idx--) {
    const reds = history[idx].reds || history[idx].fronts
    if (!reds) continue
    for (const r of reds) {
      if (lastSeen[r - 1] === history.length) lastSeen[r - 1] = history.length - 1 - idx
    }
  }
  return lastSeen.map(v => v + 1) // +1 避免零权重
}

/**
 * 生成模拟前区数据
 * @param {number} max - 最大数字
 * @param {number} pick - 选取个数
 */
export function generateMockRedsForDLT(max = 35, pick = 5) {
  const hotPool = [7, 10, 12, 14, 17, 19, 22, 24, 27, 29, 31, 33]
  const picks = []
  while (picks.length < pick) {
    let pickNum
    if (Math.random() < 0.65 && hotPool.length) {
      pickNum = hotPool[Math.floor(Math.random() * hotPool.length)]
    } else {
      pickNum = Math.floor(Math.random() * max) + 1
    }
    if (!picks.includes(pickNum)) picks.push(pickNum)
  }
  picks.sort((a, b) => a - b)
  return picks
}

/**
 * 生成模拟后区数据（不放回）
 * @param {number} max - 最大数字
 * @param {number} pick - 选取个数
 */
export function generateMockBlues(max = 12, pick = 2) {
  const picks = []
  while (picks.length < pick) {
    const pickNum = Math.floor(Math.random() * max) + 1
    if (!picks.includes(pickNum)) picks.push(pickNum)
  }
  picks.sort((a, b) => a - b)
  return picks
}

/**
 * 生成大乐透内置数据集
 */
export function buildDLTDataset(options = {}) {
  const { startYear = 2020, endYear = 2024, count = 360 } = options
  const data = []
  const startDate = new Date(startYear, 0, 1)
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i * 3)
    if (d.getFullYear() > endYear) break
    const reds = generateMockRedsForDLT(35, 5)
    const blues = generateMockBlues(12, 2)
    data.push({ date: d.toISOString().slice(0, 10), reds, blues })
  }
  return data
}

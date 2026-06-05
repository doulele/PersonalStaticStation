// ==================== 共享工具函数 ====================

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

// ==================== 彩票中奖规则判定 ====================

/**
 * 双色球中奖规则
 * @param {number[]} userReds - 用户红球（6个）
 * @param {number} userBlue - 用户蓝球（1个）
 * @param {number[]} drawReds - 开奖红球（6个）
 * @param {number} drawBlue - 开奖蓝球（1个）
 * @returns {{ level: number, name: string, matchedReds: number[], matchedBlue: boolean }}
 */
export function checkSSQ(userReds, drawReds, userBlue, drawBlue) {
  const redSet = new Set(drawReds)
  const matchedReds = userReds.filter(r => redSet.has(r))
  const matchedBlue = userBlue === drawBlue
  const redCount = matchedReds.length

  let level, name
  if (redCount === 6 && matchedBlue)      { level = 1; name = '一等奖' }
  else if (redCount === 6 && !matchedBlue) { level = 2; name = '二等奖' }
  else if (redCount === 5 && matchedBlue)  { level = 3; name = '三等奖' }
  else if (redCount === 5 && !matchedBlue) { level = 4; name = '四等奖' }
  else if (redCount === 4 && matchedBlue)  { level = 4; name = '四等奖' }
  else if (redCount === 4 && !matchedBlue) { level = 5; name = '五等奖' }
  else if (redCount === 3 && matchedBlue)  { level = 5; name = '五等奖' }
  else if (matchedBlue)                    { level = 6; name = '六等奖' }
  else                                     { level = 0; name = '未中奖' }

  return { level, name, matchedReds, matchedBlue }
}

/**
 * 大乐透中奖规则
 * @param {number[]} userFronts - 用户前区（5个）
 * @param {number[]} userBacks - 用户后区（2个）
 * @param {number[]} drawFronts - 开奖前区（5个）
 * @param {number[]} drawBacks - 开后区（2个）
 * @returns {{ level: number, name: string, matchedFronts: number[], matchedBacks: number[] }}
 */
export function checkDLT(userFronts, userBacks, drawFronts, drawBacks) {
  const frontSet = new Set(drawFronts)
  const backSet = new Set(drawBacks)
  const matchedFronts = userFronts.filter(f => frontSet.has(f))
  const matchedBacks = userBacks.filter(b => backSet.has(b))
  const fCount = matchedFronts.length
  const bCount = matchedBacks.length

  let level, name
  if (fCount === 5 && bCount === 2) { level = 1; name = '一等奖' }
  else if (fCount === 5 && bCount === 1) { level = 2; name = '二等奖' }
  else if (fCount === 5 && bCount === 0) { level = 3; name = '三等奖' }
  else if (fCount === 4 && bCount === 2) { level = 4; name = '四等奖' }
  else if (fCount === 4 && bCount === 1) { level = 5; name = '五等奖' }
  else if (fCount === 3 && bCount === 2) { level = 6; name = '六等奖' }
  else if (fCount === 4 && bCount === 0) { level = 7; name = '七等奖' }
  else if ((fCount === 3 && bCount === 1) || (fCount === 2 && bCount === 2)) { level = 8; name = '八等奖' }
  else if ((fCount === 3 && bCount === 0) || (fCount === 2 && bCount === 1) || (fCount === 1 && bCount === 2) || (fCount === 0 && bCount === 2)) { level = 9; name = '九等奖' }
  else { level = 0; name = '未中奖' }

  return { level, name, matchedFronts, matchedBacks }
}

/**
 * 根据号码自动识别彩种
 * @param {{ reds?: number[], blue?: number, fronts?: number[], backs?: number[] }} numbers
 * @returns {'ssq'|'dlt'|null}
 */
export function detectLotteryType(numbers) {
  // 有 fronts/backs 格式 → 大乐透
  if (numbers.fronts?.length === 5 && numbers.backs?.length === 2) return 'dlt'
  // 有 reds/blue 格式 → 双色球
  if (numbers.reds?.length === 6 && typeof numbers.blue === 'number') return 'ssq'
  // 都不符合
  return null
}

/**
 * 获取中奖等级对应的样式类名和颜色
 */
export function getPrizeStyle(level) {
  const map = {
    1: { cls: 'prize-level-1', color: '#e60012', bg: '#fff0f0', label: '一等奖' },
    2: { cls: 'prize-level-2', color: '#e67e22', bg: '#fff8f0', label: '二等奖' },
    3: { cls: 'prize-level-3', color: '#f39c12', bg: '#fffbe6', label: '三等奖' },
    4: { cls: 'prize-level-4', color: '#27ae60', bg: '#f0fff4', label: '四等奖' },
    5: { cls: 'prize-level-5', color: '#2980b9', bg: '#f0f8ff', label: '五等奖' },
    6: { cls: 'prize-level-6', color: '#8e44ad', bg: '#faf0ff', label: '六等奖' },
    7: { cls: 'prize-level-7', color: '#7f8c8d', bg: '#f5f6f7', label: '七等奖' },
    8: { cls: 'prize-level-8', color: '#95a5a6', bg: '#f8f9fa', label: '八等奖' },
    9: { cls: 'prize-level-9', color: '#bdc3c7', bg: '#fcfcfc', label: '九等奖' },
    0: { cls: 'prize-level-0', color: '#999', bg: '#f5f5f5', label: '未中奖' },
  }
  return map[level] || map[0]
}

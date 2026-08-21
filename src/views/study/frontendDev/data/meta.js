/**
 * 前端知识图谱 - 等级 / 经验值 / 成就定义
 */

/**
 * 等级体系
 * 经验值规则：点亮节点 +5，答对一题 +2，每日打卡 +3
 */
export const XP_RULES = {
  node: 5,        // 点亮一个节点
  answer: 2,      // 答对一题
  checkin: 3,     // 每日打卡
  quizPass: 5     // 随堂测验通过（点亮节点已含，此为达标额外奖励）
}

export const LEVELS_XP = [
  { key: 'junior', name: '初级', min: 0, max: 99, color: '#22c55e' },
  { key: 'middle', name: '中级', min: 100, max: 299, color: '#3b82f6' },
  { key: 'senior', name: '高级', min: 300, max: 599, color: '#f59e0b' },
  { key: 'expert', name: '专家', min: 600, max: Infinity, color: '#ef4444' }
]

/** 根据经验值获取当前等级 */
export function getLevelByXp(xp) {
  let current = LEVELS_XP[0]
  for (const lv of LEVELS_XP) {
    if (xp >= lv.min) current = lv
  }
  return current
}

/** 下一级信息（用于进度条），已达最高级返回 null */
export function getNextLevel(xp) {
  const current = getLevelByXp(xp)
  const idx = LEVELS_XP.indexOf(current)
  if (idx >= LEVELS_XP.length - 1) return null
  return LEVELS_XP[idx + 1]
}

/**
 * 成就定义
 * check 函数在 store 中被调用，接收 { learnedCount, totalNodes, answerTotal, answerCorrect, checkinStreak, bestCategoryPercent, xp, levelKey }
 * 返回 true 表示达成
 */
export const ACHIEVEMENTS = [
  { id: 'ach-first-node', name: '初入前端', icon: '🌱', desc: '点亮第 1 个知识点', check: s => s.learnedCount >= 1 },
  { id: 'ach-node-10', name: '点亮新星', icon: '✨', desc: '点亮 10 个知识点', check: s => s.learnedCount >= 10 },
  { id: 'ach-node-50', name: '点亮先锋', icon: '🌟', desc: '点亮 50 个知识点', check: s => s.learnedCount >= 50 },
  { id: 'ach-node-100', name: '点亮大师', icon: '💎', desc: '点亮 100 个知识点', check: s => s.learnedCount >= 100 },
  { id: 'ach-answer-50', name: '刷题新手', icon: '✏️', desc: '累计作答 50 题', check: s => s.answerTotal >= 50 },
  { id: 'ach-answer-200', name: '刷题达人', icon: '🚀', desc: '累计作答 200 题', check: s => s.answerTotal >= 200 },
  { id: 'ach-answer-500', name: '刷题狂人', icon: '🏆', desc: '累计作答 500 题', check: s => s.answerTotal >= 500 },
  { id: 'ach-first-checkin', name: '首次打卡', icon: '📅', desc: '完成首次每日打卡', check: s => s.checkinStreak >= 1 },
  { id: 'ach-checkin-7', name: '坚持一周', icon: '🔥', desc: '连续打卡 7 天', check: s => s.checkinStreak >= 7 },
  { id: 'ach-checkin-30', name: '月度坚持', icon: '🗓️', desc: '连续打卡 30 天', check: s => s.checkinStreak >= 30 },
  { id: 'ach-category-full', name: '分类制霸', icon: '👑', desc: '任意分类完成度达到 100%', check: s => s.bestCategoryPercent >= 100 },
  { id: 'ach-level-middle', name: '晋升中级', icon: '🎖️', desc: '达到中级等级', check: s => s.levelKey === 'middle' || s.levelKey === 'senior' || s.levelKey === 'expert' },
  { id: 'ach-level-senior', name: '晋升高级', icon: '🥇', desc: '达到高级等级', check: s => s.levelKey === 'senior' || s.levelKey === 'expert' },
  { id: 'ach-level-expert', name: '专家之路', icon: '🏅', desc: '达到专家等级', check: s => s.levelKey === 'expert' }
]

/**
 * 答题判定工具
 */

/**
 * 判断用户答案是否正确
 * @param {Object} question 题目（含 type/answer）
 * @param {*} userAnswer 用户答案（single/judge: 索引数字；multi: 索引数组）
 * @returns {boolean}
 */
export function checkAnswer(question, userAnswer) {
  if (!question) return false
  const type = question.type
  const answer = question.answer

  if (type === 'multi') {
    if (!Array.isArray(userAnswer) || !Array.isArray(answer)) return false
    if (userAnswer.length !== answer.length) return false
    const a = [...userAnswer].sort()
    const b = [...answer].sort()
    return a.every((v, i) => v === b[i])
  }

  if (type === 'judge') {
    const userBool = userAnswer === 0
    return userBool === answer
  }

  return userAnswer === answer
}

/**
 * 获取题型的选项标签（用于展示）
 */
export function questionTypeName(type) {
  const map = { single: '单选', multi: '多选', judge: '判断' }
  return map[type] || type
}

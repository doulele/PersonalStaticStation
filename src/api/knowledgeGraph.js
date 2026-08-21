/**
 * 前端知识图谱（技能成长平台）API
 */
import { get, post, del } from './request'

// ==================== 内容接口 ====================

/** 题库概览（各分类节点数 + 题目统计） */
export function getOverview() {
  return get('/knowledge-graph/overview')
}

/** 知识点列表（可按分类过滤） */
export function getNodes(cat) {
  return get('/knowledge-graph/nodes', { cat })
}

/** 知识点详情（含 content 与关联题目） */
export function getNodeDetail(id) {
  return get(`/knowledge-graph/nodes/${id}`)
}

/** 随堂测验题（某节点关联题目） */
export function getNodeQuestions(id) {
  return get(`/knowledge-graph/nodes/${id}/questions`)
}

/** 专项刷题 / 综合筛选题目 */
export function getQuestions(params) {
  return get('/knowledge-graph/questions', params)
}

// ==================== 用户学习接口 ====================

/** 获取用户全部学习进度 */
export function getProgress() {
  return get('/knowledge-graph/progress')
}

/** 标记已掌握（点亮节点） */
export function learnNode(nodeId) {
  return post('/knowledge-graph/learn', { nodeId })
}

/** 提交单题答案 */
export function submitAnswer(payload) {
  return post('/knowledge-graph/answer', payload)
}

/** 随堂测验批量提交 */
export function submitQuiz(payload) {
  return post('/knowledge-graph/quiz', payload)
}

/** 手动打卡 */
export function checkin() {
  return post('/knowledge-graph/checkin')
}

/** 收藏夹列表 */
export function getFavorites() {
  return get('/knowledge-graph/favorites')
}

/** 添加收藏 */
export function addFavorite(qid) {
  return post('/knowledge-graph/favorites', { qid })
}

/** 取消收藏 */
export function removeFavorite(qid) {
  return del(`/knowledge-graph/favorites/${qid}`)
}

/** 错题本列表 */
export function getWrong() {
  return get('/knowledge-graph/wrong')
}

/** 移除错题（确认掌握） */
export function removeWrong(qid) {
  return post('/knowledge-graph/wrong/remove', { qid })
}

/** 技能雷达数据 */
export function getRadar() {
  return get('/knowledge-graph/radar')
}

/** 成长曲线 */
export function getGrowth(range = 'week') {
  return get('/knowledge-graph/growth', { range })
}

/** 成就状态 */
export function getAchievements() {
  return get('/knowledge-graph/achievements')
}

// ==================== 面试题模块 ====================

/** 面试题库（hot/cat/type/limit 筛选，mode=random 随机组卷） */
export function getInterviewQuestions(params) {
  return get('/knowledge-graph/interview/questions', params)
}

/** 面试题概览（各分类题数 + 高频题数） */
export function getInterviewOverview() {
  return get('/knowledge-graph/interview/overview')
}

/** 交卷评分（整卷提交 → 评分报告） */
export function submitInterview(payload) {
  return post('/knowledge-graph/interview/submit', payload)
}

/** 考试记录（历史） */
export function getInterviewHistory() {
  return get('/knowledge-graph/interview/history')
}

/** 单次考试详情 */
export function getInterviewHistoryDetail(id) {
  return get(`/knowledge-graph/interview/history/${id}`)
}

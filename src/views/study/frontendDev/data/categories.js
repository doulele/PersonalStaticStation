/**
 * 前端知识图谱 - 分类 / 难度 / 题目标签定义
 * 与后端 data/knowledge-graph 中 14 个分类 cat 保持一致
 */

/** 14 个知识分类（special: true 表示专项分类） */
export const CATEGORIES = [
  { id: 'html', name: 'HTML', icon: '🌐', color: '#e44d26' },
  { id: 'css', name: 'CSS', icon: '🎨', color: '#2965f1' },
  { id: 'javascript', name: 'JavaScript', icon: '⚡', color: '#f7df1e' },
  { id: 'typescript', name: 'TypeScript', icon: '📘', color: '#3178c6' },
  { id: 'vue', name: 'Vue.js', icon: '💚', color: '#42b883' },
  { id: 'react', name: 'React', icon: '⚛️', color: '#61dafb' },
  { id: 'mini-program', name: '小程序', icon: '📱', color: '#07c160' },
  { id: 'engineering', name: '工程化', icon: '🛠️', color: '#8b5cf6' },
  { id: 'micro-frontend', name: '微前端', icon: '🧩', color: '#f43f5e' },
  { id: 'graphics', name: '图形可视化', icon: '📊', color: '#06b6d4' },
  { id: 'fullstack', name: '大前端全栈', icon: '🌍', color: '#10b981' },
  { id: 'network', name: '浏览器网络', icon: '🌐', color: '#f59e0b' },
  { id: 'baguwen', name: '八股文专项', icon: '📚', color: '#6366f1', special: true },
  { id: 'framework', name: '框架原理', icon: '🔬', color: '#ec4899', special: true }
]

/** 难度等级（level 1-4） */
export const LEVELS = [
  { id: 1, name: '入门', color: '#22c55e' },
  { id: 2, name: '进阶', color: '#3b82f6' },
  { id: 3, name: '高级', color: '#f59e0b' },
  { id: 4, name: '专家', color: '#ef4444' }
]

/** 题目标签 */
export const QUESTION_TAGS = ['八股文', '场景题', '框架原理', '手写题']

/** 根据难度 level 获取信息 */
export function getLevel(level) {
  return LEVELS.find(l => l.id === level) || LEVELS[0]
}

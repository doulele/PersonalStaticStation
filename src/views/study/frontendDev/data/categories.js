/**
 * 前端知识图谱 - 分类 / 难度 / 题目标签定义
 * 与后端 data/knowledge-graph 中 15 个分类 cat 保持一致
 */

/** 15 个知识分类（special: true 表示专项分类，order 越小越常用/越靠前） */
export const CATEGORIES = [
  { id: 'javascript', name: 'JavaScript', icon: '⚡', color: '#f7df1e', desc: 'ES 核心、异步编程、原型链与手写实现', order: 1 },
  { id: 'html', name: 'HTML', icon: '🌐', color: '#e44d26', desc: '标签语义化、表单、多媒体与 SEO 基础', order: 2 },
  { id: 'css', name: 'CSS', icon: '🎨', color: '#2965f1', desc: '布局体系、动画过渡、预处理与工程化', order: 3 },
  { id: 'vue3', name: 'Vue3', icon: '🟢', color: '#42b883', desc: 'Composition API、Proxy 响应式与核心原理', order: 4 },
  { id: 'react', name: 'React', icon: '⚛️', color: '#61dafb', desc: 'JSX、Hooks、Fiber 调度与生态实践', order: 5 },
  { id: 'typescript', name: 'TypeScript', icon: '📘', color: '#3178c6', desc: '类型系统、泛型约束与工程化应用', order: 6 },
  { id: 'network', name: '浏览器网络', icon: '🌐', color: '#f59e0b', desc: '浏览器渲染、网络协议与前端安全', order: 7 },
  { id: 'engineering', name: '工程化', icon: '🛠️', color: '#8b5cf6', desc: '构建打包、模块规范、CI/CD 与质量保障', order: 8 },
  { id: 'baguwen', name: '八股文专项', icon: '📚', color: '#6366f1', desc: '高频八股文系统梳理，覆盖核心考点', special: true, order: 9 },
  { id: 'framework', name: '框架原理', icon: '🔬', color: '#ec4899', desc: 'Vue / React 底层原理深入剖析', special: true, order: 10 },
  { id: 'vue2', name: 'Vue2', icon: '🍃', color: '#42b883', desc: 'Vue2 响应式、组件通信与全家桶生态', order: 11 },
  { id: 'mini-program', name: '小程序', icon: '📱', color: '#07c160', desc: '小程序架构、生命周期与原生能力', order: 12 },
  { id: 'fullstack', name: '大前端全栈', icon: '🌍', color: '#10b981', desc: 'Node 后端、SSR、同构与全栈实践', order: 13 },
  { id: 'micro-frontend', name: '微前端', icon: '🧩', color: '#f43f5e', desc: '微前端方案选型、沙箱隔离与通信机制', order: 14 },
  { id: 'graphics', name: '图形可视化', icon: '📊', color: '#06b6d4', desc: 'Canvas、SVG、WebGL 与可视化方案', order: 15 }
]

/** 难度等级（level 1-4） */
export const LEVELS = [
  { id: 1, name: '入门', color: '#22c55e' },
  { id: 2, name: '进阶', color: '#3b82f6' },
  { id: 3, name: '高级', color: '#f59e0b' },
  { id: 4, name: '专家', color: '#ef4444' }
]

/** 题目标签 */
export const QUESTION_TAGS = ['八股文', '场景题', '框架原理', '手写题', '代码输出', '工程实践', '实战题', '高频追问']

/** 根据难度 level 获取信息 */
export function getLevel(level) {
  return LEVELS.find(l => l.id === level) || LEVELS[0]
}

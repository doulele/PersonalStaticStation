/** 理解力训练 · 前端共享元数据（与后端 DIMS/LEVEL_DESC 对齐，兜底展示用） */
export const DIM_META = [
  { id: 'D1', name: '抓主干', full: '抓主干（感知）', desc: '区分核心与细节，一句话说清主旨', color: 'var(--cp-d1)', icon: '◎' },
  { id: 'D2', name: '拆逻辑', full: '拆逻辑（解构）', desc: '追踪推理链，识别前提与结论', color: 'var(--cp-d2)', icon: '⛓' },
  { id: 'D3', name: '译人话', full: '译人话（重构）', desc: '脱离原文措辞，用自己的话复述', color: 'var(--cp-d3)', icon: '✍' },
  { id: 'D4', name: '追问批判', full: '追问批判（批判）', desc: '识别隐含前提，发现论证漏洞', color: 'var(--cp-d4)', icon: '⚖' }
]
export const LEVEL_META = [
  { key: 'L0', name: '空白', desc: '尚未激活该能力' },
  { key: 'L1', name: '初识', desc: '能秒抓主干' },
  { key: 'L2', name: '掌握', desc: '能分清观点和理由' },
  { key: 'L3', name: '熟练', desc: '能画出逻辑链条' },
  { key: 'L4', name: '精通', desc: '能用自己的话完整复述' },
  { key: 'L5', name: '大师', desc: '能识别预设和潜在反驳' }
]

/** 训练强度 */
export const INTENSITY_OPTS = [
  { value: 'light', label: '轻松', hint: '每天 1 题，低负担' },
  { value: 'standard', label: '标准', hint: '每天 2 题（短板+维护）' },
  { value: 'deep', label: '深度', hint: '每天 3 题，高强度投入' }
]
/** 训练频率 */
export const FREQUENCY_OPTS = [
  { value: 'daily', label: '每日训练', hint: '周一至周日每天都练' },
  { value: 'weekend_off', label: '周末休息', hint: '周一至周五训练' },
  { value: 'custom', label: '自定义', hint: '自选每周训练日' }
]
/** 周几：1=周一 */
export const WEEK_DAYS = [
  { v: 1, label: '一' }, { v: 2, label: '二' }, { v: 3, label: '三' },
  { v: 4, label: '四' }, { v: 5, label: '五' }, { v: 6, label: '六' }, { v: 7, label: '日' }
]

/** 身份类型候选 */
export const IDENTITY_OPTS = [
  { value: '在校学生', icon: '🎓' },
  { value: '职场人士', icon: '💼' },
  { value: '管理者', icon: '🧭' },
  { value: '研发/技术岗', icon: '💻' },
  { value: '金融/商业从业', icon: '📈' },
  { value: '自由职业', icon: '🛠' }
]

/** 职业领域候选（自由多选，可追加） */
export const DOMAIN_CHIPS = [
  '研发编程', '理工科', '自然科学', '工程技术',
  '产品运营', '市场营销', '金融风控', '经济',
  '法学', '法律合规', '人文社科', '社会科学',
  '医科', '医疗临床', '其他'
]

/** 题型名 */
export const KIND_NAME = {
  choice: '单选', premise: '前提判断', order: '排序', term: '术语填空',
  retell: '转述复述', challenge: '批判质疑', input: '简答'
}
export const dimById = (id) => DIM_META.find((d) => d.id === id) || { id, name: id, color: 'var(--cp-accent)', icon: '✦', desc: '' }

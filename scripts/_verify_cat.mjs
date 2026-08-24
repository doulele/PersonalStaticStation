/**
 * 通用校验脚本：验证某个分类数据文件的完整性
 * 用法: node scripts/_verify_cat.mjs css
 */
import { pathToFileURL } from 'url'

const name = process.argv[2] || 'css'
const file = 'F:/personal/' + '\u4e2a\u4eba\u7f51\u7ad9\u9879\u76ee' + '/personToolStation/PersonalStaticStationBackend/data/knowledge-graph/' + name + '.js'

const mod = await import(pathToFileURL(file).href)
const { nodes, questions } = mod

console.log(`== ${name}.js 校验 ==`)
console.log('nodes:', nodes.length, '| questions:', questions.length)

const nodeIds = new Set()
const qids = new Set()
let refCount = 0

for (const n of nodes) {
  const errs = []
  if (!n.id || !n.cat || !n.name || typeof n.level !== 'number' || typeof n.sort !== 'number' || !n.content) errs.push('基础字段缺失')
  if (!n.source) errs.push('缺少 source')
  if (!Array.isArray(n.refs) || n.refs.length === 0) errs.push('refs 为空或非数组')
  n.refs && n.refs.forEach(r => { if (!r.title || !/^https?:\/\//.test(r.url)) errs.push('ref 结构错误: ' + JSON.stringify(r)) })
  if (nodeIds.has(n.id)) errs.push('id 重复')
  nodeIds.add(n.id)
  if (errs.length) throw new Error(`节点 ${n.id} 校验失败: ${errs.join('; ')}`)
}

for (const q of questions) {
  const errs = []
  if (!q.id || !q.node || !nodeIds.has(q.node)) errs.push('node 不存在: ' + q.node)
  if (!['single', 'multi', 'judge'].includes(q.type)) errs.push('type 非法: ' + q.type)
  if (!Array.isArray(q.options) || q.options.length < 2) errs.push('options 非法')
  if (q.type === 'multi' && !Array.isArray(q.answer)) errs.push('multi 的 answer 不是数组')
  if (q.type !== 'multi' && typeof q.answer !== 'boolean' && typeof q.answer !== 'number') errs.push('answer 类型非法')
  if (!q.q || !q.explain) errs.push('q/explain 缺失')
  if (qids.has(q.id)) errs.push('id 重复')
  qids.add(q.id)
  if (q.ref) refCount++
  if (errs.length) throw new Error(`题目 ${q.id} 校验失败: ${errs.join('; ')}`)
}

for (const q of questions) {
  if (q.type === 'multi') {
    q.answer.forEach(a => { if (a < 0 || a >= q.options.length) throw new Error(`题目 ${q.id} multi 答案索引越界`) })
  } else if (q.type === 'single') {
    if (q.answer < 0 || q.answer >= q.options.length) throw new Error(`题目 ${q.id} single 答案索引越界`)
  }
}

const tags = {}
questions.forEach(q => q.tags && q.tags.forEach(t => { tags[t] = (tags[t] || 0) + 1 }))
const levels = {}
questions.forEach(q => { levels[q.level] = (levels[q.level] || 0) + 1 })
const perNode = {}
questions.forEach(q => { perNode[q.node] = (perNode[q.node] || 0) + 1 })

console.log('题目题型分布:', JSON.stringify(tags))
console.log('题目难度分布:', JSON.stringify(levels))
console.log('各节点题量:', JSON.stringify(perNode))
console.log('带 ref 参考链接的题目:', refCount, '/', questions.length)
console.log('ALL OK')

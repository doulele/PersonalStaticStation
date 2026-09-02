/**
 * 本地书籍导入解析：TXT（正则切章 + 编码识别） / EPUB（epubjs 解析）
 */
import ePub from 'epubjs'

export function isSupportedExt(name) {
  return /\.(txt|epub)$/i.test(name)
}

export function fileBaseName(name) {
  return (name || '').replace(/\.[^.]+$/, '') || '未命名书籍'
}

// ==================== 文本编码 ====================
function decodeText(buf) {
  let utf8 = null
  try {
    utf8 = new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    utf8 = null
  }
  if (utf8 !== null) {
    const cjk = (utf8.match(/[\u4e00-\u9fff]/g) || []).length
    if (utf8.length === 0 || cjk / utf8.length > 0.02) return utf8
  }
  try {
    return new TextDecoder('gbk').decode(buf)
  } catch {
    return utf8 || ''
  }
}

// ==================== TXT ====================
/** 章节标题：第X章/回/节/卷/集/部/篇… 以及 序章/楔子/尾声 等无编号标题 */
const CHAPTER_RE = /(?:^|\n)[ \t]*((?:(?:第[0-9０-９一二三四五六七八九十百千万零两〇]+[章回节卷集部篇])|(?:序章|楔子|引子|序言|引言|前言|尾声|后记|番外|完结感言))[^\n]{0,40})/g

function splitChapters(text) {
  const titles = []
  const starts = []
  let m
  const re = new RegExp(CHAPTER_RE.source, 'g')
  while ((m = re.exec(text))) {
    const title = m[1].replace(/^[ \t]+/, '').trim()
    starts.push(m.index + m[0].indexOf(m[1]))
    titles.push(title)
  }
  if (!titles.length) {
    // 无章节结构：按约 5000 字分卷
    const size = 5000
    const total = text.length
    const chapters = []
    let i = 0
    let n = 1
    while (i < total) {
      chapters.push({ title: `第 ${n} 部分`, content: text.slice(i, i + size).trim() })
      i += size
      n += 1
    }
    return chapters.length ? chapters : [{ title: '正文', content: text.trim() }]
  }
  const chapters = []
  for (let i = 0; i < titles.length; i++) {
    const start = starts[i]
    const end = i + 1 < starts.length ? starts[i + 1] : text.length
    chapters.push({ title: titles[i], content: text.slice(start, end).replace(/^[ \t]*\n+/, '').trim() })
  }
  return chapters.filter((c) => c.content)
}

export async function parseTxt(file, onProgress) {
  const buf = await file.arrayBuffer()
  onProgress && onProgress(0.3)
  const text = decodeText(buf).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const chapters = splitChapters(text)
  onProgress && onProgress(1)
  return {
    title: fileBaseName(file.name),
    author: '',
    format: 'txt',
    chapters
  }
}

// ==================== EPUB ====================
function extractParas(root) {
  const paras = []
  const walk = (node) => {
    if (!node || node.nodeType !== 1) return
    const hasBlock = Array.from(node.children || []).some((ch) =>
      /^(p|div|section|article|h[1-6]|li|blockquote|table|pre)$/i.test(ch.tagName)
    )
    if (!hasBlock) {
      const t = (node.textContent || '').replace(/\s+/g, ' ').trim()
      if (t && t.length > 1) paras.push(t)
      return
    }
    Array.from(node.children || []).forEach(walk)
  }
  walk(root)
  return paras
}

export async function parseEpub(file, onProgress) {
  const buf = await file.arrayBuffer()
  const book = ePub(buf)
  await book.ready
  const nav = await book.loaded.navigation
  const spine = await book.loaded.spine

  // 目录 href → 标题映射
  const titleMap = {}
  const walkToc = (list) => {
    for (const it of list || []) {
      const href = (it.href || '').split('#')[0].split('?')[0]
      if (href) titleMap[href] = (it.label || '').trim()
      if (it.subitems) walkToc(it.subitems)
    }
  }
  walkToc(nav.toc)

  const chapters = []
  const total = spine.length || 1
  for (let i = 0; i < spine.length; i++) {
    const item = spine[i]
    onProgress && onProgress(0.1 + 0.85 * (i / total))
    const href = (item.href || '').split('#')[0].split('?')[0]
    const title = titleMap[href] || `第 ${i + 1} 节`
    let paras = []
    try {
      const doc = await book.load(item.href)
      const root = doc.body || doc.documentElement
      if (root) paras = extractParas(root)
    } catch {
      paras = []
    }
    if (paras.length) chapters.push({ title, content: paras.join('\n\n') })
  }
  onProgress && onProgress(1)
  return {
    title: fileBaseName(file.name),
    author: '',
    format: 'epub',
    chapters
  }
}

/** 根据扩展名选择解析器 */
export async function parseBook(file, onProgress) {
  if (/\.txt$/i.test(file.name)) return parseTxt(file, onProgress)
  if (/\.epub$/i.test(file.name)) return parseEpub(file, onProgress)
  throw new Error('仅支持 TXT / EPUB 格式')
}

export default { isSupportedExt, parseBook, parseTxt, parseEpub, fileBaseName }

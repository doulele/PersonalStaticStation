/**
 * 轻量 Markdown 渲染器
 * 支持：标题(#/##/###)、加粗(**)、行内代码(`)、代码块(```)、
 *       无序列表(-)、有序列表(1.)、表格(|...|)、段落
 */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inline(text) {
  let t = escapeHtml(text)
  // 行内代码
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
  // 加粗
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  return t
}

function splitTableRow(line) {
  return line.trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(c => inline(c.trim()))
}

export function renderMarkdown(md) {
  if (!md) return ''
  const lines = md.split('\n')
  let html = ''
  let i = 0
  let inCode = false
  let codeBuf = []
  let listBuf = []
  let listType = null

  const flushList = () => {
    if (!listBuf.length) return
    const tag = listType === 'ol' ? 'ol' : 'ul'
    html += `<${tag}>${listBuf.join('')}</${tag}>`
    listBuf = []
    listType = null
  }

  while (i < lines.length) {
    const line = lines[i]

    // 代码块
    if (line.trim().startsWith('```')) {
      if (inCode) {
        html += `<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`
        codeBuf = []
        inCode = false
      } else {
        flushList()
        inCode = true
      }
      i++
      continue
    }
    if (inCode) {
      codeBuf.push(line)
      i++
      continue
    }

    // 表格
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|[\s\-:|]+\|\s*$/.test(lines[i + 1])) {
      flushList()
      const header = splitTableRow(line)
      const rows = []
      let j = i + 2
      while (j < lines.length && lines[j].trim().startsWith('|')) {
        rows.push(splitTableRow(lines[j]))
        j++
      }
      html += '<table><thead><tr>' + header.map(h => `<th>${h}</th>`).join('') + '</tr></thead>'
      html += '<tbody>' + rows.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody></table>'
      i = j
      continue
    }

    // 空行
    if (!line.trim()) {
      flushList()
      i++
      continue
    }

    // 标题
    const h3 = line.match(/^###\s+(.*)/)
    if (h3) { flushList(); html += `<h3>${inline(h3[1])}</h3>`; i++; continue }
    const h2 = line.match(/^##\s+(.*)/)
    if (h2) { flushList(); html += `<h2>${inline(h2[1])}</h2>`; i++; continue }
    const h1 = line.match(/^#\s+(.*)/)
    if (h1) { flushList(); html += `<h1>${inline(h1[1])}</h1>`; i++; continue }

    // 无序列表
    const ul = line.match(/^\s*-\s+(.*)/)
    if (ul) {
      if (listType !== 'ul') { flushList(); listType = 'ul' }
      listBuf.push(`<li>${inline(ul[1])}</li>`)
      i++
      continue
    }

    // 有序列表
    const ol = line.match(/^\s*\d+\.\s+(.*)/)
    if (ol) {
      if (listType !== 'ol') { flushList(); listType = 'ol' }
      listBuf.push(`<li>${inline(ol[1])}</li>`)
      i++
      continue
    }

    // 普通段落
    flushList()
    html += `<p>${inline(line.trim())}</p>`
    i++
  }

  flushList()
  if (inCode && codeBuf.length) {
    html += `<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`
  }
  return html
}

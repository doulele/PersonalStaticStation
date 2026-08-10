/**
 * 转录与自动标签工具
 * --------------------------------------------------------------
 * 本文件封装「自动打标」与「转写」逻辑。
 *
 * ⚠️ 真实部署时：语音转写应调用本地 faster-whisper / Whisper.cpp 服务
 *    （支持 near 普通话的河南方言 + 自定义热词）。当前静态站点无后端，
 *    故提供 mock 模式，并预留 transcribeViaBackend() 作为与后端对接的入口。
 */

// 标签触发关键词（与需求文档 4.2 自动标签一致）
const TAG_KEYWORDS = {
  结论: ['决定', '结论', '确定', '就这么定', '通过', '一致认为', '最终'],
  待定: ['先搁置', '待定', '以后再说', '下次', '暂缓', '未决定', '留待'],
  行动项: ['行动项', '任务', '去做', '负责', '落实', '安排', '跟进', '计划做']
}

/**
 * 基于关键词自动识别标签
 * @param {string} text
 * @param {string[]} hotwords 自定义热词（额外触发「结论」）
 * @returns {string[]} 标签数组，可能为空
 */
export function autoTag(text, hotwords = []) {
  if (!text) return []
  const tags = new Set()
  for (const [tag, words] of Object.entries(TAG_KEYWORDS)) {
    if (words.some(w => text.includes(w))) tags.add(tag)
  }
  if (hotwords.length && hotwords.some(w => text.includes(w))) tags.add('结论')
  return [...tags]
}

/**
 * 从文本中抽取时间词，用于行动项截止时间（简单规则）
 * 支持：今天 / 明天 / 后天 / 周X / X月X日 / X天内
 * @returns {string|null} YYYY-MM-DD
 */
export function extractDueDate(text) {
  if (!text) return null
  const today = new Date()
  const addDays = (n) => {
    const d = new Date(today)
    d.setDate(d.getDate() + n)
    return d.toISOString().slice(0, 10)
  }
  if (text.includes('今天')) return addDays(0)
  if (text.includes('明天')) return addDays(1)
  if (text.includes('后天')) return addDays(2)
  const weekMap = { '周一': 1, '星期二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 0, '星期日': 0 }
  for (const [k, v] of Object.entries(weekMap)) {
    if (text.includes(k)) {
      const cur = today.getDay()
      let diff = (v - cur + 7) % 7
      if (diff === 0) diff = 7
      return addDays(diff)
    }
  }
  const md = text.match(/(\d{1,2})月(\d{1,2})日/)
  if (md) {
    const y = today.getFullYear()
    const m = String(md[1]).padStart(2, '0')
    const d = String(md[2]).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const nd = text.match(/(\d{1,2})天内/)
  if (nd) return addDays(parseInt(nd[1], 10))
  return null
}

/**
 * 从文本抽取「行动项」标题（取第一句或关键词后内容）
 */
export function extractTaskTitle(text) {
  if (!text) return ''
  const clean = text.replace(/^[（(]?\d+[)）.、]?\s*/, '')
  const seg = clean.split(/[。；;]/)[0]
  return seg.slice(0, 40)
}

/**
 * 通过后端进行真正的语音转写（支持说话人识别）
 * 将音频 Blob 上传到后端 /family-meeting/transcribe，后端调用 faster-whisper/whisper.cpp
 * @param {Blob} audioBlob - 录音 Blob (webm)
 * @param {object} options
 * @param {string} options.language - 语言 zh/en/auto
 * @param {string[]} options.hotwords - 自定义热词
 * @param {boolean} options.withDiarization - 是否启用说话人识别
 * @param {string} options.familyId - 家庭ID（说话人识别时需要）
 * @returns {Promise<{text:string, segments:Array, engine:string, diarization?:object}>}
 */
export async function transcribeViaBackend(audioBlob, options = {}) {
  const { language = 'zh', hotwords = [], withDiarization = false, familyId = '' } = options

  const fd = new FormData()
  // 确保文件名有正确的扩展名
  const ext = audioBlob.type.includes('webm') ? 'webm' : 'wav'
  fd.append('audio', audioBlob, `recording_${Date.now()}.${ext}`)
  fd.append('language', language)
  if (hotwords.length > 0) {
    fd.append('hotwords', hotwords.join(','))
  }
  if (withDiarization) {
    fd.append('withDiarization', 'true')
    if (familyId) fd.append('familyId', familyId)
  }

  // 🔒 携带认证 token
  const headers = {}
  try {
    const token = localStorage.getItem('auth_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  } catch { /* ignore */ }

  // 使用相对路径，通过 vite proxy 转发到后端
  const baseUrl = import.meta.env.VITE_API_BASE || '/staticTool/api'
  const res = await fetch(`${baseUrl}/family-meeting/transcribe`, {
    method: 'POST',
    headers,
    body: fd
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `转写请求失败 (${res.status})`)
  }

  const json = await res.json()
  if (!json.success) {
    throw new Error(json.error || '转写失败')
  }

  return {
    text: json.data.text || '',
    segments: json.data.segments || [],
    engine: json.data.engine || 'unknown',
    diarization: json.data.diarization || null
  }
}

/**
 * Mock 转写（当后端不可用时的占位实现）
 * @deprecated 请使用 transcribeViaBackend
 */
export function mockTranscribe() {
  return Promise.resolve({
    text: '',
    timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false })
  })
}

/**
 * 情绪色值映射（用于记忆墙色块）
 */
export const TAG_COLORS = {
  结论: '#10b981',
  待定: '#f59e0b',
  行动项: '#6366f1',
  情感记录: '#94a3b8'
}

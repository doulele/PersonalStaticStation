/**
 * novelOnline 共享状态：书架 / 多书进度 / 历史 / 笔记 / 书签 / 阅读统计 / 搜索历史 / TTS 朗读
 * 小数据持久化 localStorage，导入书籍全文持久化 IndexedDB（见 services/db.js）
 */
import { reactive, watch } from 'vue'
import { putLocalBook, getLocalBook, deleteLocalBook } from './services/db'

const LS = {
  shelf: 'novel_shelf',
  progress: 'novel_progress',
  history: 'novel_history',
  settings: 'novel_settings',
  notes: 'novel_notes',
  bookmarks: 'novel_bookmarks',
  stats: 'novel_stats',
  searchHistory: 'novel_search_history'
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    /* ignore quota */
  }
}

let _uidN = 0
export function uid() {
  return `${Date.now().toString(36)}${(_uidN++).toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function dateStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ==================== 书架 ====================
export const shelf = reactive({ items: load(LS.shelf, []) })
watch(() => shelf.items, (v) => save(LS.shelf, v), { deep: true })

export function isInShelf(bookKey) {
  return shelf.items.some((b) => b.key === bookKey)
}

export function addShelf(book) {
  if (isInShelf(book.key)) return
  shelf.items.unshift({ ...book, group: book.group || 'reading', addedAt: Date.now() })
}

export function toggleShelf(book) {
  const i = shelf.items.findIndex((b) => b.key === book.key)
  if (i > -1) shelf.items.splice(i, 1)
  else shelf.items.unshift({ ...book, group: 'reading', addedAt: Date.now() })
}

export function removeShelf(bookKey) {
  const i = shelf.items.findIndex((b) => b.key === bookKey)
  if (i > -1) shelf.items.splice(i, 1)
  delete progress[bookKey]
  history.items = history.items.filter((h) => h.key !== bookKey)
  notes.items = notes.items.filter((n) => n.bookKey !== bookKey)
  delete bookmarks[bookKey]
}

export function setShelfGroup(bookKey, group) {
  const b = shelf.items.find((x) => x.key === bookKey)
  if (b) b.group = group
}

/** 书架状态分组：在读 / 想读 / 读完 / 未分组 */
export const SHELF_GROUPS = [
  { key: 'reading', label: '在读' },
  { key: 'want', label: '想读' },
  { key: 'finished', label: '读完' },
  { key: '', label: '未分组' }
]

export function groupLabel(g) {
  const f = SHELF_GROUPS.find((x) => x.key === g)
  return f ? f.label : '未分组'
}

// ==================== 本地导入书 ====================
export function addLocalBook(book, chapters) {
  const key = `local:${Date.now().toString(36)}:${book.title}`
  const b = {
    ...book,
    key,
    type: 'local',
    source: 'local',
    format: book.format || 'txt',
    group: 'reading',
    addedAt: Date.now()
  }
  return putLocalBook(b, chapters).then(() => {
    shelf.items.unshift(b)
    return b
  })
}

export function removeLocalBook(key) {
  return deleteLocalBook(key)
}

// ==================== 进度（多书） ====================
export const progress = reactive(load(LS.progress, {}))
watch(() => progress, (v) => save(LS.progress, v), { deep: true })

export function saveProgress(bookKey, data) {
  progress[bookKey] = { ...progress[bookKey], ...data, updatedAt: Date.now() }
}

export function getProgress(bookKey) {
  return progress[bookKey] || null
}

/** 书架进度百分比（按章节粗略估算，paraIndex>0 视为章内过半） */
export function calcPercent(p, totalChapters) {
  if (!p || !totalChapters) return 0
  const seg = p.paraIndex > 0 ? 0.5 : 0
  return Math.min(99, Math.round(((p.chapterIndex + seg) / totalChapters) * 100))
}

// ==================== 历史 ====================
export const history = reactive({ items: load(LS.history, []) })
watch(() => history.items, (v) => save(LS.history, v), { deep: true })

export function pushHistory(book) {
  const i = history.items.findIndex((b) => b.key === book.key)
  if (i > -1) history.items.splice(i, 1)
  history.items.unshift({ ...book, lastAt: Date.now() })
  if (history.items.length > 50) history.items.pop()
}

export function clearHistory() {
  history.items = []
}

// ==================== 阅读设置 ====================
export const settings = reactive({
  fontSize: 18,
  lineHeight: 2,
  bg: 'sepia',
  fontFamily: 'serif',
  ttsRate: 1,
  autoNext: true,
  ...load(LS.settings, {})
})
watch(() => settings, (v) => save(LS.settings, v), { deep: true })

// ==================== 笔记（划线摘录） ====================
export const notes = reactive({ items: load(LS.notes, []) })
watch(() => notes.items, (v) => save(LS.notes, v), { deep: true })

export function addNote(n) {
  const item = { id: uid(), time: Date.now(), ...n }
  notes.items.unshift(item)
  if (notes.items.length > 500) notes.items.pop()
  return item
}

export function removeNote(id) {
  notes.items = notes.items.filter((n) => n.id !== id)
}

export function notesOfChapter(bookKey, chapterIndex) {
  return notes.items.filter((n) => n.bookKey === bookKey && n.chapterIndex === chapterIndex)
}

export function notesOfBook(bookKey) {
  return notes.items.filter((n) => n.bookKey === bookKey)
}

// ==================== 书签（收藏章节） ====================
export const bookmarks = reactive(load(LS.bookmarks, {}))
watch(() => bookmarks, (v) => save(LS.bookmarks, v), { deep: true })

export function toggleBookmark(bookKey, chapterIndex) {
  const arr = bookmarks[bookKey] || (bookmarks[bookKey] = [])
  const i = arr.indexOf(chapterIndex)
  if (i > -1) arr.splice(i, 1)
  else arr.push(chapterIndex)
}

export function isBookmarked(bookKey, chapterIndex) {
  return (bookmarks[bookKey] || []).includes(chapterIndex)
}

export function bookmarksOfBook(bookKey) {
  return bookmarks[bookKey] || []
}

// ==================== 阅读统计 ====================
export const stats = reactive(load(LS.stats, {}))
watch(() => stats, (v) => save(LS.stats, v), { deep: true })

export function addReadTime(ms) {
  if (!(ms > 0)) return
  const d = dateStr()
  stats[d] = (stats[d] || 0) + ms
}

/** 最近 n 天统计 [{date, ms}]，含今天 */
export function statsOfDays(n) {
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const key = dateStr(new Date(Date.now() - i * 86400000))
    out.push({ date: key, ms: stats[key] || 0 })
  }
  return out
}

export function totalStatsMs() {
  return Object.values(stats).reduce((a, b) => a + b, 0)
}

// ==================== 搜索历史 ====================
export const searchHistory = reactive({ items: load(LS.searchHistory, []) })
watch(() => searchHistory.items, (v) => save(LS.searchHistory, v), { deep: true })

export function pushSearchHistory(kw) {
  const q = (kw || '').trim()
  if (!q) return
  const i = searchHistory.items.indexOf(q)
  if (i > -1) searchHistory.items.splice(i, 1)
  searchHistory.items.unshift(q)
  if (searchHistory.items.length > 10) searchHistory.items.pop()
}

export function clearSearchHistory() {
  searchHistory.items = []
}

// ==================== 备份 / 恢复 ====================
export async function exportBackup() {
  const locals = []
  for (const b of shelf.items) {
    if (b.type === 'local') {
      const full = await getLocalBook(b.key).catch(() => null)
      if (full) locals.push({ key: full.key, book: full.book, chapters: full.chapters })
    }
  }
  return {
    app: 'novelOnline',
    version: 1,
    exportedAt: Date.now(),
    shelf: shelf.items,
    progress: { ...progress },
    history: history.items,
    notes: notes.items,
    bookmarks: { ...bookmarks },
    settings: { ...settings },
    stats: { ...stats },
    searchHistory: searchHistory.items,
    locals
  }
}

export async function importBackup(json) {
  if (!json || json.app !== 'novelOnline') throw new Error('无效的备份文件')
  if (Array.isArray(json.shelf)) shelf.items = json.shelf.map((b) => ({ ...b }))
  if (json.progress && typeof json.progress === 'object') {
    Object.keys(json.progress).forEach((k) => (progress[k] = json.progress[k]))
  }
  if (Array.isArray(json.history)) history.items = json.history.map((h) => ({ ...h }))
  if (Array.isArray(json.notes)) notes.items = json.notes.map((n) => ({ ...n }))
  if (json.bookmarks && typeof json.bookmarks === 'object') {
    Object.keys(json.bookmarks).forEach((k) => (bookmarks[k] = json.bookmarks[k]))
  }
  if (json.settings && typeof json.settings === 'object') Object.assign(settings, json.settings)
  if (json.stats && typeof json.stats === 'object') {
    Object.keys(json.stats).forEach((k) => (stats[k] = json.stats[k]))
  }
  if (Array.isArray(json.searchHistory)) searchHistory.items = json.searchHistory.slice(0, 10)
  for (const l of json.locals || []) {
    if (l && l.book && Array.isArray(l.chapters)) {
      await putLocalBook(l.book, l.chapters).catch(() => {})
    }
  }
}

// ==================== TTS 朗读控制器 ====================
export const tts = reactive({
  playing: false,
  paused: false,
  rate: load(LS.settings, {}).ttsRate ?? 1,
  bookKey: null,
  chapterIndex: 0,
  paraIndex: 0,
  paragraphs: [],
  chapterTitle: '',
  bookTitle: '',
  voices: [],
  voiceURI: localStorage.getItem('novel_voice_uri') || '',
  supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  sleepLeft: 0, // 定时关闭剩余分钟（0=未开启）
  autoNext: load(LS.settings, {}).autoNext !== false,
  sleepPreset: 0
})

/** 当前朗读的段落（供高亮联动） */
export const currentPara = reactive({ text: '', index: -1 })

let timer = null
let sleepTimer = null
let chapterEndCb = null

function loadVoices() {
  tts.voices = window.speechSynthesis.getVoices()
}

if (tts.supported) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = loadVoices
}

function pickVoice() {
  if (!tts.voices.length) return null
  if (tts.voiceURI) {
    const hit = tts.voices.find((v) => v.voiceURI === tts.voiceURI)
    if (hit) return hit
  }
  const zh = tts.voices.find((v) => /zh|cmn|Chinese/i.test(v.lang) && /natural/i.test(v.name))
  if (zh) return zh
  return tts.voices.find((v) => /zh|cmn|Chinese/i.test(v.lang)) || null
}

function stopSpeak() {
  window.speechSynthesis.cancel()
  if (timer) clearInterval(timer)
  timer = null
}

function saveTtsProgress() {
  saveProgress(tts.bookKey, {
    chapterIndex: tts.chapterIndex,
    paraIndex: tts.paraIndex,
    mode: 'listen'
  })
}

function speakCurrent() {
  // 防止每段朗读结束时链式调用累积多个 interval（旧定时器必须先清）
  if (timer) clearInterval(timer)
  timer = null
  const paras = tts.paragraphs
  if (!paras || tts.paraIndex < 0 || tts.paraIndex >= paras.length) {
    // 本章朗读完毕
    tts.playing = false
    currentPara.index = -1
    currentPara.text = ''
    const cb = chapterEndCb
    if (cb) cb()
    return
  }
  const text = paras[tts.paraIndex]
  currentPara.text = text
  currentPara.index = tts.paraIndex
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'zh-CN'
  u.rate = tts.rate
  const v = pickVoice()
  if (v) u.voice = v
  u.onend = () => {
    saveTtsProgress()
    tts.paraIndex += 1
    if (tts.playing) speakCurrent()
  }
  u.onerror = () => {
    tts.playing = false
  }
  window.speechSynthesis.speak(u)
  timer = setInterval(() => {
    // Chrome 长文本自动暂停保护：每 10s 续播
    if (tts.playing && window.speechSynthesis.speaking && window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }
  }, 10000)
}

/** 注册章节朗读结束回调（用于自动连播下一章） */
export function onChapterEnd(cb) {
  chapterEndCb = cb
}

export function speakPara(bookKey, chapterIndex, paraIndex, paragraphs, chapterTitle, bookTitle) {
  if (!tts.supported) return
  stopSpeak()
  tts.bookKey = bookKey
  tts.chapterIndex = chapterIndex
  tts.paraIndex = paraIndex
  tts.paragraphs = paragraphs || []
  tts.chapterTitle = chapterTitle || ''
  tts.bookTitle = bookTitle || ''
  tts.playing = true
  tts.paused = false
  if (tts.sleepLeft > 0) startSleepCountdown()
  speakCurrent()
}

export function toggleTts() {
  if (!tts.supported) return
  if (tts.playing) {
    tts.paused = true
    tts.playing = false
    window.speechSynthesis.pause()
  } else if (tts.paused && window.speechSynthesis.paused) {
    tts.playing = true
    tts.paused = false
    window.speechSynthesis.resume()
  } else {
    speakCurrent()
    tts.playing = true
  }
}

export function stopTts() {
  stopSpeak()
  tts.playing = false
  tts.paused = false
  currentPara.index = -1
  currentPara.text = ''
  if (sleepTimer) clearInterval(sleepTimer)
  sleepTimer = null
  tts.sleepLeft = 0
}

export function setTtsRate(rate) {
  tts.rate = rate
  settings.ttsRate = rate
}

export function setVoice(uri) {
  tts.voiceURI = uri
  try {
    localStorage.setItem('novel_voice_uri', uri)
  } catch {
    /* ignore */
  }
}

export function toggleAutoNext() {
  tts.autoNext = !tts.autoNext
  settings.autoNext = tts.autoNext
}

/** 设置定时关闭（分钟），0 = 取消 */
export function setSleep(minutes) {
  if (sleepTimer) clearInterval(sleepTimer)
  sleepTimer = null
  tts.sleepPreset = minutes
  tts.sleepLeft = Math.max(0, minutes)
  if (tts.sleepLeft > 0 && tts.playing) startSleepCountdown()
}

function startSleepCountdown() {
  if (sleepTimer) return
  sleepTimer = setInterval(() => {
    tts.sleepLeft -= 1
    if (tts.sleepLeft <= 0) {
      tts.sleepLeft = 0
      if (sleepTimer) clearInterval(sleepTimer)
      sleepTimer = null
      stopTts()
    }
  }, 60 * 1000)
}

export function cleanupTts() {
  stopSpeak()
  tts.playing = false
  tts.paused = false
}

export default {
  shelf,
  progress,
  history,
  settings,
  notes,
  bookmarks,
  stats,
  searchHistory,
  tts,
  currentPara,
  isInShelf,
  addShelf,
  toggleShelf,
  removeShelf,
  setShelfGroup,
  SHELF_GROUPS,
  groupLabel,
  addLocalBook,
  removeLocalBook,
  saveProgress,
  getProgress,
  calcPercent,
  pushHistory,
  clearHistory,
  addNote,
  removeNote,
  notesOfChapter,
  notesOfBook,
  toggleBookmark,
  isBookmarked,
  bookmarksOfBook,
  addReadTime,
  statsOfDays,
  totalStatsMs,
  pushSearchHistory,
  clearSearchHistory,
  exportBackup,
  importBackup,
  speakPara,
  toggleTts,
  stopTts,
  setTtsRate,
  setVoice,
  toggleAutoNext,
  setSleep,
  onChapterEnd,
  cleanupTts
}

<template>
  <div class="reader-root" :class="[{ 'reader-focus': focusMode }, themeClass]">
    <!-- 顶部工具栏 -->
    <div class="reader-top">
      <button class="reader-back" @click="goBack">← 返回</button>
      <div class="reader-title">{{ book.title }}</div>
      <div class="reader-top-actions">
        <button class="reader-icon" title="我的摘录" @click="$emit('open-notes')">💬</button>
        <button class="reader-icon" title="阅读统计" @click="$emit('open-stats')">📊</button>
        <button class="reader-icon" :title="focusMode ? '退出专注' : '专注模式'" @click="focusMode = !focusMode">🎯</button>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="reader-progress">
      <div class="reader-progress-bar" :style="{ width: chapterPercent + '%' }"></div>
    </div>

    <!-- 主区 -->
    <div class="reader-main" :class="{ 'no-side': !showToc }">
      <!-- 目录侧栏 -->
      <aside v-if="showToc" class="reader-toc">
        <div class="reader-toc-head">
          <span>目录</span>
          <span class="reader-toc-count">{{ chapters.length }} 章</span>
        </div>
        <div class="reader-toc-list">
          <button
            v-for="(ch, i) in chapters"
            :key="i"
            class="reader-toc-item"
            :class="{ active: i === chapterIndex, bookmarked: isBookmarked(book.key, i) }"
            @click="jumpTo(i)"
          >
            <span class="toc-bm" v-if="isBookmarked(book.key, i)">★</span>
            {{ ch.title || `第 ${i + 1} 章` }}
          </button>
        </div>
      </aside>

      <!-- 正文 -->
      <div class="reader-body" ref="bodyEl" @scroll="onScroll">
        <div v-if="bookLoading" class="reader-loading">正在加载书籍…</div>
        <template v-else>
          <div class="reader-chapter">
            <h2 class="reader-chapter-title">{{ currentChapter.title || `第 ${chapterIndex + 1} 章` }}</h2>
            <div v-if="chapterLoading" class="reader-loading">章节加载中…</div>
            <template v-else>
              <p
                v-for="(para, pi) in paragraphs"
                :key="pi"
                class="reader-para"
                :class="{ reading: isReadingPara(pi) }"
                :style="paraStyle"
                :data-para="pi"
                @dblclick="onDoubleClick($event, pi)"
              >{{ para }}</p>
              <div v-if="!paragraphs.length" class="reader-empty">本章内容为空</div>
            </template>
          </div>
          <div class="reader-chapter-end">
            <span v-if="chapterIndex < chapters.length - 1" class="reader-next" @click="jumpTo(chapterIndex + 1)">下一章 →</span>
            <span v-else class="reader-end">— 本书已读完 —</span>
          </div>
        </template>
      </div>
    </div>

    <!-- 底部控制条 -->
    <div class="reader-bottom">
      <div class="reader-bottom-left">
        <button class="reader-icon" title="书签" @click="toggleBookmark(book.key, chapterIndex)">
          {{ isBookmarked(book.key, chapterIndex) ? '★' : '☆' }}
        </button>
        <button class="reader-icon" title="定时关闭" @click="showSleep = !showSleep">⏰</button>
        <button class="reader-icon" title="目录" @click="showToc = !showToc">☰</button>
        <button class="reader-icon" title="朗读设置" @click="showTtsMenu = !showTtsMenu">🎵</button>
      </div>
      <div class="reader-bottom-center">
        <button class="reader-icon" @click="prevPara">⏮</button>
        <button class="reader-play" @click="onPlayClick">
          <span v-if="tts.playing && !tts.paused">⏸</span>
          <span v-else>▶</span>
        </button>
        <button class="reader-icon" @click="nextPara">⏭</button>
        <span class="reader-pos">{{ chapterIndex + 1 }} / {{ chapters.length }} 章</span>
      </div>
      <div class="reader-bottom-right">
        <button class="reader-icon" @click="onPlayClick">
          {{ tts.playing ? (tts.paused ? '❚❚' : '🔊') : '🔇' }}
        </button>
        <span class="reader-rate">{{ tts.rate }}x</span>
        <button class="reader-icon" title="阅读设置" @click="showSettings = !showSettings">⚙</button>
      </div>
    </div>

    <!-- 阅读设置弹层 -->
    <div v-if="showSettings" class="reader-pop" @click.self="showSettings = false">
      <div class="reader-pop-card">
        <div class="pop-row">
          <label>字号</label>
          <input type="range" min="14" max="30" v-model.number="settings.fontSize" />
          <span>{{ settings.fontSize }}px</span>
        </div>
        <div class="pop-row">
          <label>行距</label>
          <input type="range" min="1.4" max="2.8" step="0.1" v-model.number="settings.lineHeight" />
        </div>
        <div class="pop-row">
          <label>字体</label>
          <select v-model="settings.fontFamily">
            <option value="serif">衬线</option>
            <option value="sans-serif">无衬线</option>
            <option value="'KaiTi', '楷体', serif">楷体</option>
            <option value="'SimSun', '宋体', serif">宋体</option>
          </select>
        </div>
        <div class="pop-row">
          <label>主题</label>
          <div class="theme-options">
            <button v-for="t in themes" :key="t.key" class="theme-dot" :class="{ active: settings.bg === t.key }" :style="{ background: t.bg }" @click="settings.bg = t.key" :title="t.name"></button>
          </div>
        </div>
        <div class="pop-row">
          <label>自动连播</label>
          <input type="checkbox" :checked="tts.autoNext" @change="toggleAutoNext" />
        </div>
      </div>
    </div>

    <!-- TTS 设置弹层 -->
    <div v-if="showTtsMenu" class="reader-pop" @click.self="showTtsMenu = false">
      <div class="reader-pop-card">
        <div class="pop-row">
          <label>语速</label>
          <input type="range" min="0.5" max="2" step="0.1" :value="tts.rate" @input="setTtsRate(Number($event.target.value))" />
          <span>{{ tts.rate }}x</span>
        </div>
        <div class="pop-row">
          <label>音色</label>
          <select :value="tts.voiceURI" @change="setVoice($event.target.value)">
            <option value="">自动</option>
            <option v-for="v in tts.voices" :key="v.voiceURI" :value="v.voiceURI">{{ v.name }}</option>
          </select>
        </div>
        <p v-if="!tts.supported" class="pop-tip">当前浏览器不支持语音朗读（建议 Chrome / Edge）</p>
      </div>
    </div>

    <!-- 定时关闭弹层 -->
    <div v-if="showSleep" class="reader-pop" @click.self="showSleep = false">
      <div class="reader-pop-card">
        <div class="pop-row">
          <button v-for="m in [15, 30, 45, 60]" :key="m" class="btn" :class="{ active: tts.sleepPreset === m }" @click="setSleep(m)">{{ m }} 分钟</button>
          <button class="btn" :class="{ active: tts.sleepPreset === 0 }" @click="setSleep(0)">关闭</button>
        </div>
        <p v-if="tts.sleepLeft > 0" class="pop-tip">剩余 {{ tts.sleepLeft }} 分钟</p>
      </div>
    </div>

    <!-- 划线操作条 -->
    <div v-if="selectionMenu" class="sel-menu" :style="selStyle">
      <button @click="doNote(false)">划线</button>
      <button @click="showComment = true">划线+备注</button>
      <button @click="doQuote">名句卡片</button>
    </div>

    <!-- 备注输入 -->
    <div v-if="showComment" class="comment-mask" @click.self="showComment = false">
      <div class="comment-card">
        <p class="comment-text">“{{ selectionText }}”</p>
        <textarea v-model="commentText" placeholder="写点备注…" rows="3"></textarea>
        <div class="comment-actions">
          <button class="btn ghost" @click="showComment = false">取消</button>
          <button class="btn primary" @click="doNote(true)">保存</button>
        </div>
      </div>
    </div>

    <QuoteCard v-if="quoteVisible" :text="quoteText" :book-title="book.title" :chapter-title="currentChapter.title" @close="quoteVisible = false" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import QuoteCard from './QuoteCard.vue'
import { getWikisourceBook, getWikisourceChapter } from '@/api/novelOnline'
import { getLocalBook } from '../services/db'
import {
  settings,
  progress,
  saveProgress,
  pushHistory,
  toggleBookmark,
  isBookmarked,
  toggleTts,
  tts,
  setTtsRate,
  setVoice,
  toggleAutoNext,
  setSleep,
  onChapterEnd,
  speakPara,
  stopTts,
  addNote,
  addReadTime
} from '../store'

const paraStyle = computed(() => ({
  fontSize: settings.fontSize + 'px',
  lineHeight: settings.lineHeight,
  fontFamily: settings.fontFamily
}))

const props = defineProps({
  book: { type: Object, required: true },
  chapters: { type: Array, default: () => [] },
  startChapter: { type: Number, default: 0 },
  startPara: { type: Number, default: 0 }
})
const emit = defineEmits(['close', 'open-stats', 'open-notes'])

const book = computed(() => props.book)

// ==================== 章节数据 ====================
const chapters = ref([])
const bookLoading = ref(true)
const chapterLoading = ref(false)
const chapterIndex = ref(0)
const paraIndex = ref(0)
const paragraphs = ref([])
const chapterLoaded = ref(false)

const bodyEl = ref(null)
const showToc = ref(typeof window !== 'undefined' ? window.innerWidth > 768 : true)
const showSettings = ref(false)
const showTtsMenu = ref(false)
const showSleep = ref(false)
const focusMode = ref(false)

const themes = [
  { key: 'sepia', name: '羊皮纸', bg: '#f5ecd7' },
  { key: 'paper', name: '白纸', bg: '#ffffff' },
  { key: 'night', name: '夜间', bg: '#1c1f26' },
  { key: 'green', name: '护眼绿', bg: '#cde8cd' }
]
const themeClass = computed(() => `theme-${settings.bg || 'sepia'}`)
const currentChapter = computed(() => chapters.value[chapterIndex.value] || { title: '', content: '' })
const chapterPercent = computed(() => (chapters.value.length ? Math.round(((chapterIndex.value + 0.5) / chapters.value.length) * 100) : 0))

// ==================== 书籍加载 ====================
async function ensureBook() {
  bookLoading.value = true
  try {
    if (props.chapters && props.chapters.length) {
      chapters.value = props.chapters.map((c) => ({ ...c }))
    } else if (book.value.type === 'local') {
      const full = await getLocalBook(book.value.key)
      chapters.value = (full && full.chapters) || []
    } else if (book.value.source === 'wikisource') {
      const res = await getWikisourceBook(book.value.title)
      const items = (res && (res.items || res.chapters || [])) || []
      chapters.value = items.map((c) => ({ title: c.title, page: c.page || c.title, content: '' }))
    }
  } catch (e) {
    console.error('加载书籍失败', e)
    chapters.value = []
  } finally {
    bookLoading.value = false
  }
}

async function loadChapter(i, pi) {
  if (i < 0 || i >= chapters.value.length) return
  chapterIndex.value = i
  chapterLoading.value = true
  chapterLoaded.value = false
  try {
    let content = chapters.value[i].content
    if (!content && book.value.source === 'wikisource') {
      const res = await getWikisourceChapter(chapters.value[i].page)
      content = (res && (res.content || res.text)) || ''
      chapters.value[i].content = content
    }
    paragraphs.value = splitParas(content)
    chapterLoaded.value = true
  } catch (e) {
    console.error('章节加载失败', e)
    paragraphs.value = []
    chapterLoaded.value = true
  } finally {
    chapterLoading.value = false
  }
  // 定位
  if (typeof pi === 'number') {
    paraIndex.value = Math.max(0, Math.min(pi, Math.max(0, paragraphs.value.length - 1)))
  } else {
    const saved = progress[book.value.key]
    paraIndex.value = saved && saved.chapterIndex === i ? saved.paraIndex || 0 : 0
  }
  await nextTick()
  // 定位完成后立即保存（保证跨章跳转/切段后进度准确，不再依赖调用方手动同步）
  syncProgress()
  const el = bodyEl.value
  if (!el) return
  if (paraIndex.value > 0) {
    const p = el.querySelector(`[data-para="${paraIndex.value}"]`)
    if (p) {
      el.scrollTop = p.offsetTop - el.clientHeight / 3
      return
    }
  }
  el.scrollTop = 0
}

function splitParas(content) {
  if (!content) return []
  return String(content)
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length)
}

function jumpTo(i) {
  if (i < 0 || i >= chapters.value.length) return
  // 跳章时若正在朗读本书，先停止，避免读到旧章
  stopReadingTts()
  loadChapter(i, 0)
}

// ==================== 进度 ====================
function syncProgress() {
  saveProgress(book.value.key, {
    chapterIndex: chapterIndex.value,
    paraIndex: paraIndex.value,
    mode: 'read',
    percent: chapterPercent.value
  })
}

function prevPara() {
  if (paraIndex.value > 0) {
    paraIndex.value -= 1
    syncProgress()
  } else if (chapterIndex.value > 0) {
    stopReadingTts()
    loadChapter(chapterIndex.value - 1, 0)
  }
}

function nextPara() {
  if (paraIndex.value < paragraphs.value.length - 1) {
    paraIndex.value += 1
    syncProgress()
  } else if (chapterIndex.value < chapters.value.length - 1) {
    stopReadingTts()
    loadChapter(chapterIndex.value + 1, 0)
  }
}

// 若正在朗读本书则停止（跳章/切段时调用）
function stopReadingTts() {
  if (tts.playing && tts.bookKey === book.value.key) stopTts()
}

// ==================== 朗读 ====================
// 播放/暂停：若当前朗读的不是本书，则从本书当前段开始朗读
function onPlayClick() {
  if (!tts.supported) return
  if (tts.bookKey === book.value.key) {
    toggleTts()
  } else {
    speakFrom(paraIndex.value)
  }
}

function speakFrom(pi) {
  speakPara(
    book.value.key,
    chapterIndex.value,
    pi,
    paragraphs.value,
    currentChapter.value.title,
    book.value.title
  )
}

onChapterEnd(() => {
  if (!tts.autoNext) return
  if (chapterIndex.value < chapters.value.length - 1) {
    const next = chapterIndex.value + 1
    loadChapter(next, 0).then(() => speakFrom(0))
  } else {
    stopTts()
  }
})

function isReadingPara(pi) {
  return tts.playing && !tts.paused && tts.bookKey === book.value.key && tts.chapterIndex === chapterIndex.value && pi === tts.paraIndex
}

watch(
  () => tts.paraIndex,
  (pi) => {
    if (!tts.playing || tts.bookKey !== book.value.key) return
    if (tts.chapterIndex !== chapterIndex.value) return
    const el = bodyEl.value
    const p = el && el.querySelector(`[data-para="${pi}"]`)
    if (p) el.scrollTop = p.offsetTop - el.clientHeight / 3
  }
)

// 听书跨章时同步保存进度（含百分比，书架进度条才准确）
watch(
  () => tts.chapterIndex,
  (ci) => {
    if (!tts.playing || tts.bookKey !== book.value.key || !chapters.value.length) return
    saveProgress(book.value.key, {
      chapterIndex: ci,
      paraIndex: tts.paraIndex,
      mode: 'listen',
      percent: Math.round(((ci + 0.5) / chapters.value.length) * 100)
    })
  }
)

// ==================== 阅读时长统计 ====================
let lastTick = Date.now()
let accMs = 0
const statTimer = setInterval(() => {
  const now = Date.now()
  const dt = now - lastTick
  lastTick = now
  if (dt < 20000) accMs += dt
  if (accMs >= 30000) {
    addReadTime(accMs)
    accMs = 0
  }
}, 5000)

// ==================== 滚动同步 ====================
let scrollSaveTimer = null
function onScroll() {
  const el = bodyEl.value
  if (!el || !chapterLoaded.value) return
  const paras = el.querySelectorAll('.reader-para')
  if (!paras.length) return
  let best = 0
  let bestDist = Infinity
  const mid = el.scrollTop + el.clientHeight / 2
  for (let i = 0; i < paras.length; i++) {
    const d = Math.abs(paras[i].offsetTop - mid)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  }
  paraIndex.value = best
  // 节流写入 localStorage：高频滚动时合并保存
  if (scrollSaveTimer) return
  scrollSaveTimer = setTimeout(() => {
    scrollSaveTimer = null
    saveProgress(book.value.key, { chapterIndex: chapterIndex.value, paraIndex: paraIndex.value, mode: 'read', percent: chapterPercent.value })
  }, 300)
}

// ==================== 划线 / 摘录 ====================
const selectionMenu = ref(false)
const selStyle = ref({})
const selectionText = ref('')
const selectionPara = ref(0)
const showComment = ref(false)
const commentText = ref('')
const quoteVisible = ref(false)
const quoteText = ref('')

function onDoubleClick(e, pi) {
  const sel = window.getSelection()
  if (!sel || !sel.toString().trim()) return
  selectionText.value = sel.toString().trim()
  selectionPara.value = pi
  const rect = e.target.getBoundingClientRect()
  selStyle.value = {
    top: Math.max(rect.top - 44, 8) + 'px',
    left: Math.min(Math.max(rect.left + rect.width / 2, 80), window.innerWidth - 260) + 'px'
  }
  selectionMenu.value = true
}

function doNote(withComment) {
  const text = selectionText.value
  if (text) {
    addNote({
      bookKey: book.value.key,
      bookTitle: book.value.title,
      chapterIndex: chapterIndex.value,
      chapterTitle: currentChapter.value.title,
      text,
      comment: withComment ? commentText.value.trim() : ''
    })
  }
  selectionMenu.value = false
  showComment.value = false
  commentText.value = ''
  window.getSelection() && window.getSelection().removeAllRanges()
}

function doQuote() {
  quoteText.value = selectionText.value
  quoteVisible.value = true
  selectionMenu.value = false
  window.getSelection() && window.getSelection().removeAllRanges()
}

// 点击划线菜单以外的区域时收起菜单
function onDocMouseDown(e) {
  if (selectionMenu.value && !e.target.closest('.sel-menu') && !e.target.closest('.comment-mask')) {
    selectionMenu.value = false
  }
}

// ==================== 生命周期 ====================
onMounted(async () => {
  await ensureBook()
  const saved = progress[book.value.key]
  const sc = saved && saved.chapterIndex != null ? saved.chapterIndex : props.startChapter
  const sp = saved && saved.chapterIndex === sc ? saved.paraIndex || 0 : props.startPara
  await loadChapter(sc, sp)
  pushHistory(book.value)
  document.addEventListener('mousedown', onDocMouseDown)
})

onBeforeUnmount(() => {
  clearInterval(statTimer)
  document.removeEventListener('mousedown', onDocMouseDown)
  if (scrollSaveTimer) clearTimeout(scrollSaveTimer)
  if (tts.bookKey === book.value.key && tts.playing) {
    stopTts()
  }
})

function goBack() {
  syncProgress()
  emit('close')
}
</script>

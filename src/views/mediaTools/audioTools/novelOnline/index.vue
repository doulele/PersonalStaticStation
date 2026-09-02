<template>
  <div class="novel-online">
    <!-- ===== 顶栏 ===== -->
    <header class="no-header">
      <div class="no-header-left">
        <h1 class="no-title">在线阅读</h1>
        <span class="no-sub">聚合搜索 · 公版文库全文 · TTS 听书 · 本地导入</span>
      </div>
      <div class="no-header-actions">
        <button class="no-shelf-btn" @click="shelfOpen = true">
          <svg viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
          书架
          <span v-if="shelfCount" class="shelf-badge">{{ shelfCount }}</span>
        </button>
        <button class="no-shelf-btn" @click="importOpen = true">📂 导入书籍</button>
      </div>
    </header>

    <!-- ===== 搜索区 ===== -->
    <div class="no-search">
      <div class="search-box" @focusin="showHistory = true" @focusout="delayHideHistory">
        <svg class="search-icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <input
          v-model="kw"
          class="search-input"
          placeholder="搜索书名 / 作者（如：三体、红楼梦、刘慈欣）"
          @keyup.enter="doSearch"
        />
        <button class="search-btn" @click="doSearch">搜索</button>
        <div v-if="showHistory && searchHistory.items.length" class="search-history">
          <div class="search-history-head">
            <span>搜索历史</span>
            <button class="link-btn" @click="clearSearchHistory">清空</button>
          </div>
          <button v-for="h in searchHistory.items" :key="h" class="history-item" @mousedown.prevent="useHistory(h)">🕐 {{ h }}</button>
        </div>
      </div>
      <div class="no-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="tab"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >{{ tab.label }}</button>
        <span v-if="searching" class="searching-hint">搜索中…</span>
      </div>
    </div>

    <!-- ===== 主体 ===== -->
    <main class="no-body">
      <!-- 每日一书 -->
      <section v-if="!searched && dailyBook" class="daily-book" @click="openClassic(dailyBook)">
        <div class="daily-cover" :style="dailyCoverStyle">{{ (dailyBook.title || '书')[0] }}</div>
        <div class="daily-meta">
          <span class="daily-tag">今日推荐</span>
          <p class="daily-title">{{ dailyBook.title }}</p>
          <p class="daily-desc">{{ dailyBook.author }} · {{ dailyBook.genre }}</p>
          <p class="daily-desc2">{{ dailyBook.desc }}</p>
        </div>
        <span class="daily-action">开始阅读 ›</span>
      </section>

      <!-- 搜索错误 -->
      <div v-if="searchError" class="no-error">{{ searchError }}</div>

      <!-- 已搜索：微信读书结果 -->
      <section v-if="searched && showWeread" class="no-section">
        <h2 class="section-title">
          微信读书
          <span class="count">{{ filteredWeread.length }} 本</span>
          <span class="hint">版权书籍 · 需在微信读书内阅读</span>
        </h2>
        <div v-if="filteredWeread.length" class="book-grid">
          <div
            v-for="b in filteredWeread"
            :key="b.bookId"
            class="book-card"
            @click="openDetail(b)"
          >
            <img v-if="b.cover" :src="b.cover" class="book-cover" loading="lazy" alt="" />
            <div v-else class="book-cover placeholder">{{ (b.title || '书')[0] }}</div>
            <div class="book-meta">
              <p class="book-name" :title="b.title">{{ b.title }}</p>
              <p class="book-author">{{ b.author }}</p>
              <p class="book-intro" :title="b.intro">{{ b.intro || '暂无简介' }}</p>
              <p class="book-foot">
                <span class="book-external">外部阅读</span>
                <span v-if="b.rating" class="book-rating">★{{ (b.rating / 10).toFixed(1) }}</span>
                <span class="book-pub">{{ b.publisher }}</span>
              </p>
            </div>
          </div>
        </div>
        <div v-else class="no-result">未在微信读书找到「{{ kw }}」</div>
      </section>

      <!-- 已搜索：公版文库结果 -->
      <section v-if="searched && showWikisource" class="no-section">
        <h2 class="section-title">
          公版文库
          <span class="count">{{ filteredWikisource.length }} 条</span>
          <span class="hint">维基文库 · 公版书籍免费全文</span>
        </h2>
        <div v-if="filteredWikisource.length" class="ws-list">
          <div
            v-for="s in filteredWikisource"
            :key="s.pageid"
            class="ws-item"
            @click="openWikisource(s)"
          >
            <div class="ws-icon">
              <svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 15.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM15 8H9V6h6v2z"/></svg>
            </div>
            <div class="ws-meta">
              <p class="ws-title">{{ displayTitle(s.title) }}</p>
              <p class="ws-snippet">{{ s.snippet }}</p>
            </div>
            <span class="ws-action">阅读全文 ›</span>
          </div>
        </div>
        <div v-else class="no-result">未在公版文库找到「{{ kw }}」</div>
      </section>

      <!-- 未搜索：公版经典推荐 -->
      <template v-if="!searched">
        <section class="no-section">
          <h2 class="section-title">
            公版经典
            <span class="hint">古籍名著 · 免费全文阅读 + 听书</span>
          </h2>
          <div v-if="classicsLoading" class="no-loading">书单加载中…</div>
          <div v-else class="book-grid classics-grid">
            <div
              v-for="b in classics"
              :key="b.title"
              class="book-card classic-card"
              @click="openClassic(b)"
            >
              <div class="book-cover placeholder classic-cover">{{ (b.title || '书')[0] }}</div>
              <div class="book-meta">
                <p class="book-name">{{ b.title }}</p>
                <p class="book-author">{{ b.author }}</p>
                <p class="book-intro" :title="b.desc">{{ b.desc }}</p>
                <p class="book-foot">
                  <span class="book-pub">{{ b.genre }}</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </template>
    </main>

    <!-- ===== 底部组件 ===== -->
    <BookReader
      v-if="readerBook"
      :book="readerBook"
      @close="readerBook = null"
      @open-stats="statsOpen = true"
      @open-notes="notesOpen = true"
    />
    <BookDetail
      v-if="detailBook"
      :book="detailBook"
      @close="detailBook = null"
    />
    <ShelfDrawer
      v-if="shelfOpen"
      @close="shelfOpen = false"
      @open-book="openFromShelf"
      @open-notes="notesOpen = true"
    />
    <ImportModal
      v-if="importOpen"
      @close="importOpen = false"
      @open-reader="openReader"
    />
    <StatsPanel v-if="statsOpen" @close="statsOpen = false" />
    <NotesPanel v-if="notesOpen" @close="notesOpen = false" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { searchBooks, getClassics } from '@/api/novelOnline'
import { shelf, cleanupTts, searchHistory, pushSearchHistory, clearSearchHistory } from './store'
import BookReader from './components/BookReader.vue'
import BookDetail from './components/BookDetail.vue'
import ShelfDrawer from './components/ShelfDrawer.vue'
import ImportModal from './components/ImportModal.vue'
import StatsPanel from './components/StatsPanel.vue'
import NotesPanel from './components/NotesPanel.vue'

const kw = ref('')
const activeTab = ref('all')
const searched = ref(false)
const searching = ref(false)
const searchError = ref('')
const results = reactive({ weread: [], wikisource: [] })

const classics = ref([])
const classicsLoading = ref(true)

const readerBook = ref(null)
const detailBook = ref(null)
const shelfOpen = ref(false)
const importOpen = ref(false)
const statsOpen = ref(false)
const notesOpen = ref(false)
const showHistory = ref(false)

let hideTimer = null

const tabs = [
  { value: 'all', label: '全部' },
  { value: 'weread', label: '微信读书' },
  { value: 'wikisource', label: '公版文库' }
]

const shelfCount = computed(() => shelf.items.length)
const showWeread = computed(() => activeTab.value === 'all' || activeTab.value === 'weread')
const showWikisource = computed(() => activeTab.value === 'all' || activeTab.value === 'wikisource')
const filteredWeread = computed(() => results.weread)
const filteredWikisource = computed(() => results.wikisource)

// ==================== 每日一书（按日期种子从经典书单挑一本） ====================
const dailyBook = computed(() => {
  if (!classics.value.length) return null
  const d = new Date()
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  return classics.value[seed % classics.value.length]
})

const dailyCoverStyle = computed(() => {
  const b = dailyBook.value
  if (!b) return {}
  let h = 0
  const s = b.title || '?'
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const hue = h % 360
  return { background: `linear-gradient(135deg, hsl(${hue}, 55%, 45%), hsl(${(hue + 40) % 360}, 60%, 30%))` }
})

// ==================== 搜索 ====================
function delayHideHistory() {
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => (showHistory.value = false), 150)
}

function useHistory(h) {
  kw.value = h
  doSearch()
}

async function doSearch() {
  const q = kw.value.trim()
  if (!q) return
  pushSearchHistory(q)
  showHistory.value = false
  searching.value = true
  searchError.value = ''
  try {
    const res = await searchBooks(q)
    results.weread = res.groups?.weread || []
    results.wikisource = res.groups?.wikisource || []
    searched.value = true
  } catch (e) {
    searchError.value = e.message || '搜索失败，请稍后重试'
  } finally {
    searching.value = false
  }
}

// ==================== 打开 ====================
function openDetail(b) {
  detailBook.value = { ...b }
}

function openReader(book) {
  readerBook.value = null
  nextTick(() => {
    readerBook.value = book
  })
}

function openWikisource(s) {
  const title = displayTitle(s.title)
  openReader({
    source: 'wikisource',
    title,
    key: `ws:${title}`
  })
}

function openClassic(b) {
  openReader({
    source: 'wikisource',
    title: b.title,
    author: b.author,
    intro: b.desc,
    key: `ws:${b.title}`
  })
}

function openFromShelf(b) {
  if (b.type === 'local') {
    openReader({ ...b })
  } else if (b.source === 'wikisource') {
    openReader({ ...b })
  } else {
    openDetail(b)
  }
}

function displayTitle(t) {
  return t.split('/')[0]
}

// ==================== 生命周期 ====================
onMounted(async () => {
  try {
    classics.value = (await getClassics()).items || []
  } catch {
    classics.value = []
  } finally {
    classicsLoading.value = false
  }
})

onBeforeUnmount(() => {
  cleanupTts()
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<style lang="scss" src="./index.scss"></style>

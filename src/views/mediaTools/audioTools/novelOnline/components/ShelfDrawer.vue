<template>
  <div class="shelf-mask" @click.self="$emit('close')">
    <div class="shelf-card">
      <div class="shelf-head">
        <h3>我的书架 <span class="shelf-count">{{ shelf.items.length }}</span></h3>
        <div class="shelf-head-actions">
          <button class="btn ghost small" @click="onExport">导出备份</button>
          <button class="btn ghost small" @click="fileInput.click()">导入备份</button>
          <button class="icon-btn" @click="$emit('close')">✕</button>
        </div>
        <input ref="fileInput" type="file" accept=".json" hidden @change="onImportBackup" />
      </div>

      <div class="shelf-tabs">
        <button
          v-for="g in tabs"
          :key="g.key"
          class="shelf-tab"
          :class="{ active: activeTab === g.key }"
          @click="activeTab = g.key"
        >
          {{ g.label }} ({{ countBy(g.key) }})
        </button>
      </div>

      <div class="shelf-search" v-if="shelf.items.length">
        <input v-model="searchQ" type="text" placeholder="搜索书架…" />
      </div>

      <div v-if="!filtered.length" class="shelf-empty">
        <p>{{ shelf.items.length ? '没有匹配的书籍' : '书架还是空的' }}</p>
        <p class="shelf-empty-sub">{{ shelf.items.length ? '换个关键词或分组试试' : '去搜索添加书籍，或导入本地 TXT / EPUB' }}</p>
      </div>

      <div v-else class="shelf-list">
        <div v-for="b in filtered" :key="b.key" class="shelf-item">
          <div class="shelf-cover" :style="coverStyle(b)">{{ (b.title || '?').slice(0, 1) }}</div>
          <div class="shelf-info" @click="openBook(b)">
            <p class="shelf-title">{{ b.title }}</p>
            <p class="shelf-meta">
              {{ b.author || '佚名' }} · {{ sourceLabel(b) }}
              <span v-if="b.type === 'local'" class="shelf-tag">本地</span>
            </p>
            <div class="shelf-progress">
              <div class="shelf-progress-bar"><div :style="{ width: progressPct(b) + '%' }"></div></div>
              <span class="shelf-progress-text">{{ progressPct(b) }}%</span>
            </div>
          </div>
          <div class="shelf-actions">
            <button class="reader-icon" title="继续阅读" @click="openBook(b)">▶</button>
            <button class="reader-icon" title="摘录" @click="$emit('open-notes')">💬</button>
            <button class="reader-icon" title="删除" @click="removeBook(b)">🗑</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { shelf, progress, removeShelf, removeLocalBook, exportBackup, importBackup, SHELF_GROUPS } from '../store'

const emit = defineEmits(['close', 'open-book', 'open-notes'])

const fileInput = ref(null)
const activeTab = ref('all')
const searchQ = ref('')

const tabs = [{ key: 'all', label: '全部' }, ...SHELF_GROUPS]

function countBy(g) {
  if (g === 'all') return shelf.items.length
  return shelf.items.filter((b) => (b.group || '') === g).length
}

const filtered = computed(() => {
  let list = shelf.items
  if (activeTab.value !== 'all') list = list.filter((b) => (b.group || '') === activeTab.value)
  if (searchQ.value.trim()) {
    const q = searchQ.value.trim().toLowerCase()
    list = list.filter((b) => (b.title || '').toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q))
  }
  return list
})

function progressPct(b) {
  const p = progress[b.key]
  if (p && typeof p.percent === 'number') return Math.min(100, Math.max(0, Math.round(p.percent)))
  return 0
}

function sourceLabel(b) {
  if (b.type === 'local') return '本地导入'
  if (b.source === 'wikisource') return '维基文库'
  return '微信读书'
}

function coverStyle(b) {
  let h = 0
  const s = b.title || '?'
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const hue = h % 360
  return { background: `linear-gradient(135deg, hsl(${hue}, 55%, 45%), hsl(${(hue + 40) % 360}, 60%, 30%))` }
}

function openBook(b) {
  emit('open-book', b)
}

function removeBook(b) {
  if (!window.confirm(`确定从书架删除《${b.title}》？\n（本地导入的书将同时删除全文）`)) return
  if (b.type === 'local') removeLocalBook(b.key)
  removeShelf(b.key)
}

async function onExport() {
  try {
    const data = await exportBackup()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `novel-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (e) {
    window.alert('导出失败：' + (e.message || e))
  }
}

async function onImportBackup(e) {
  const f = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!f) return
  try {
    const text = await f.text()
    await importBackup(JSON.parse(text))
    window.alert('备份恢复成功')
  } catch (err) {
    window.alert('恢复失败：' + (err.message || err))
  }
}
</script>

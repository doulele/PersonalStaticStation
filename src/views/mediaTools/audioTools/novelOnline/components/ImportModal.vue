<template>
  <div class="import-mask" @click.self="$emit('close')">
    <div class="import-card">
      <h3 class="import-title">导入本地书籍</h3>
      <p class="import-sub">支持 TXT / EPUB，解析后存入本地书架（IndexedDB，不占服务器）</p>

      <div class="import-drop" :class="{ dragging }" @click="pick" @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="onDrop">
        <svg viewBox="0 0 24 24"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
        <p>点击选择文件，或将文件拖拽到此处</p>
        <input ref="fileInput" type="file" accept=".txt,.epub" multiple hidden @change="onPick" />
      </div>

      <div v-if="importing" class="import-progress">
        <p class="import-progress-text">
          {{ progressText }}
          <span v-if="currentFile">（{{ currentFile }}）</span>
        </p>
        <div class="progress-track"><div class="progress-bar" :style="{ width: progress * 100 + '%' }"></div></div>
      </div>

      <div v-if="results.length" class="import-results">
        <p class="import-results-title">导入结果：</p>
        <div v-for="r in results" :key="r.key" class="import-result-item">
          <span class="ir-name">{{ r.title }}</span>
          <span class="ir-ch">{{ r.chapters }} 章</span>
          <span class="ir-ok">✓ 已入书架</span>
          <button class="ir-open" @click="openNow(r)">立即阅读</button>
        </div>
      </div>

      <div v-if="error" class="import-error">{{ error }}</div>

      <div class="import-actions">
        <button class="btn ghost" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { parseBook, isSupportedExt, fileBaseName } from '../services/importer'
import { addLocalBook } from '../store'

const emit = defineEmits(['close', 'open-reader'])

const fileInput = ref(null)
const dragging = ref(false)
const importing = ref(false)
const progress = ref(0)
const currentFile = ref('')
const error = ref('')
const results = ref([])

const progressText = computed(() => {
  if (progress.value <= 0.15) return '读取文件…'
  if (progress.value <= 0.6) return '解析章节…'
  return '整理中…'
})

function pick() {
  fileInput.value && fileInput.value.click()
}

function onPick(e) {
  handleFiles(Array.from(e.target.files || []))
  e.target.value = ''
}

function onDrop(e) {
  dragging.value = false
  handleFiles(Array.from(e.dataTransfer.files || []))
}

async function handleFiles(files) {
  const valid = files.filter((f) => isSupportedExt(f.name))
  if (!valid.length) {
    error.value = '仅支持 TXT / EPUB 格式文件'
    return
  }
  error.value = ''
  importing.value = true
  results.value = []
  for (const file of valid) {
    currentFile.value = fileBaseName(file.name)
    progress.value = 0
    try {
      const parsed = await parseBook(file, (p) => (progress.value = p))
      const book = await addLocalBook(parsed, parsed.chapters)
      results.value.push({
        key: book.key,
        title: book.title,
        chapters: parsed.chapters.length
      })
    } catch (err) {
      error.value = `${fileBaseName(file.name)} 解析失败：${err.message || '未知错误'}`
    }
  }
  importing.value = false
  currentFile.value = ''
  progress.value = 0
}

function openNow(r) {
  emit('open-reader', { key: r.key, title: r.title, type: 'local', source: 'local' })
  emit('close')
}
</script>

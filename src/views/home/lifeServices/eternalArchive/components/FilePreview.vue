<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="file?.name || '文件预览'"
    :width="isMobile ? '92vw' : '80%'"
    top="5vh"
    class="preview-dialog"
    :close-on-click-modal="false"
  >
    <div v-if="file" class="preview-container">
      <!-- 水印 -->
      <div class="watermark-overlay">
        <div class="watermark-text">
          此档案由 {{ username }} 于 {{ nowStr }} 预览 · 仅供个人查阅
        </div>
      </div>

      <!-- 智能摘要 -->
      <div v-if="showSummary" class="ai-summary">
        <span class="summary-icon">✨</span>
        <div>
          <p class="summary-title">智能摘要</p>
          <p class="summary-text">{{ generateSummary(file) }}</p>
        </div>
        <el-button text size="small" @click="showSummary = false">收起</el-button>
      </div>

      <!-- 文件预览内容 -->
      <div class="preview-body">
        <!-- 图片预览 -->
        <div v-if="isImage" class="image-preview">
          <img :src="previewSrc" :alt="file.name" class="preview-image" />
        </div>

        <!-- 文本预览 -->
        <div v-else-if="isText" class="text-preview">
          <pre class="text-content">{{ textContent }}</pre>
        </div>

        <!-- 其他格式 -->
        <div v-else class="generic-preview">
          <div class="generic-card">
            <span class="generic-icon">📁</span>
            <h3>{{ file.name }}</h3>
            <p>{{ formatSize(file.size) }} · {{ file.type || '未知类型' }}</p>
            <p class="generic-hint">此格式暂不支持内联预览，请下载后查看</p>
            <el-button type="primary" @click="handleDownload">下载文件</el-button>
          </div>
        </div>
      </div>

      <!-- 关键实体标签 -->
      <div v-if="entities.length > 0" class="entities-bar">
        <span class="entities-label">关键实体：</span>
        <span v-for="e in entities" :key="e" class="entity-chip">{{ e }}</span>
      </div>

      <!-- 侧边栏：关联推荐 -->
      <div v-if="relatedFiles.length > 0" class="related-panel">
        <h4 class="related-title">📎 可能关联的文件</h4>
        <div v-for="rf in relatedFiles" :key="rf.id" class="related-item">
          <span>{{ fileIcon(rf.type) }}</span>
          <span>{{ rf.name }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
      <el-button type="primary" @click="handleDownload">
        <el-icon><Download /></el-icon> 下载
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'

const isMobile = ref(window.innerWidth < 768)
function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const props = defineProps({
  visible: { type: Boolean, default: false },
  file: { type: Object, default: null }
})

const emit = defineEmits(['update:visible'])

const showSummary = ref(true)
const textContent = ref('')
const previewSrc = ref('')
const username = ref('用户')

const nowStr = computed(() => new Date().toLocaleString('zh-CN'))
const isImage = computed(() => props.file?.type?.startsWith('image/'))
const isText = computed(() => {
  const t = props.file?.type || ''
  return t.includes('text') || t.includes('json') || t.includes('csv') || t.includes('markdown')
})

const entities = computed(() => {
  if (!props.file?.ocrText) return []
  const text = props.file.ocrText
  const found = []
  // 简单的实体提取模拟
  const datePattern = /\d{4}[年\-\/]\d{1,2}[月\-\/]\d{1,2}[日]?/g
  const moneyPattern = /(\d+[\.,]?\d*)\s*(万|千|百)?\s*元/g
  let m
  while ((m = datePattern.exec(text)) && found.length < 3) found.push(m[0])
  while ((m = moneyPattern.exec(text)) && found.length < 5) found.push(m[0])
  return [...new Set(found)]
})

const relatedFiles = computed(() => {
  if (!props.file) return []
  const allFiles = JSON.parse(localStorage.getItem('ea_files') || '[]')
  return allFiles.filter(f =>
    f.id !== props.file.id &&
    (f.category === props.file.category || f.tags?.some(t => props.file.tags?.includes(t)))
  ).slice(0, 4)
})

watch(() => props.visible, (v) => {
  if (v && props.file) {
    showSummary.value = true
    if (isText.value) {
      textContent.value = props.file.ocrText || '（无文本内容）'
    }
    if (isImage.value && props.file.dataUrl) {
      previewSrc.value = props.file.dataUrl
    }
  }
})

function generateSummary(file) {
  if (file.ocrText) {
    return file.ocrText.slice(0, 200) + (file.ocrText.length > 200 ? '...' : '')
  }
  return `这是一份${file.securityLevel}级档案「${file.name}」，属于${file.category || '未分类'}类别。${file.description ? '备注：' + file.description : ''}`
}

function handleDownload() {
  // 模拟下载 - 实际场景中会触发后端下载
  ElMessage.success(`开始下载「${props.file?.name}」`)
}

function fileIcon(type) {
  if (type?.includes('pdf')) return '📄'
  if (type?.includes('word')) return '📝'
  if (type?.includes('excel')) return '📊'
  if (type?.includes('image')) return '🖼️'
  return '📁'
}
function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style lang="scss" scoped>
.preview-container {
  position: relative;
  min-height: 400px;
}

.watermark-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
  overflow: hidden;
}
.watermark-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-25deg);
  font-size: 28px;
  color: rgba(0,0,0,0.06);
  white-space: nowrap;
  font-weight: 700;
  letter-spacing: 2px;
}

.ai-summary {
  display: flex;
  gap: 12px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #f0fdfa, #ccfbf1);
  border: 1px solid #14b8a6;
  border-radius: 12px;
  margin-bottom: 16px;
}
.summary-icon { font-size: 24px; flex-shrink: 0; }
.summary-title { font-size: 13px; font-weight: 600; color: #0d9488; margin: 0 0 4px; }
.summary-text { font-size: 13px; color: #0f172a; margin: 0; line-height: 1.6; }

.preview-body {
  min-height: 300px;
}
.image-preview { text-align: center; }
.preview-image { max-width: 100%; max-height: 60vh; border-radius: 8px; }
.text-preview {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  max-height: 60vh;
  overflow: auto;
}
.text-content { margin: 0; font-size: 13px; line-height: 1.8; white-space: pre-wrap; color: #0f172a; }
.generic-preview { text-align: center; padding: 60px 20px; }
.generic-icon { font-size: 64px; display: block; margin-bottom: 16px; }
.generic-card h3 { font-size: 16px; color: #0f172a; margin: 0 0 8px; }
.generic-card p { font-size: 13px; color: #94a3b8; margin: 0 0 4px; }
.generic-hint { font-size: 12px; color: #94a3b8; margin: 12px 0 !important; }

.entities-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.entities-label { font-size: 12px; color: #64748b; }
.entity-chip {
  padding: 3px 10px;
  background: #f0fdfa;
  border: 1px solid #14b8a6;
  border-radius: 12px;
  font-size: 11px;
  color: #0d9488;
  cursor: pointer;
  &:hover { background: #ccfbf1; }
}

.related-panel {
  margin-top: 16px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 10px;
}
.related-title { font-size: 13px; font-weight: 600; color: #0f172a; margin: 0 0 8px; }
.related-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  &:hover { color: #0d9488; }
}

html.dark-mode & {
  .ai-summary { background: #0d2a26; border-color: #14b8a6; }
  .summary-text { color: #e2dee9; }
  .text-preview { background: #252540; }
  .text-content { color: #e2dee9; }
  .entity-chip { background: #0d2a26; }
  .related-panel { background: #252540; }
  .related-title { color: #e2dee9; }
}
</style>

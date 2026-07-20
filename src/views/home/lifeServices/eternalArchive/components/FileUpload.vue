<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="📤 上传档案"
    :width="isMobile ? '92vw' : '620px'"
    class="upload-dialog"
  >
    <!-- 拖拽区域 -->
    <div
      class="drop-zone"
      :class="{ dragover: isDragover }"
      @dragover.prevent="isDragover = true"
      @dragleave.prevent="isDragover = false"
      @drop.prevent="handleDrop"
    >
      <span class="drop-icon">🏛️</span>
      <p class="drop-text">拖拽文件到此处，或点击选择</p>
      <p class="drop-hint">支持 PDF、Word、Excel、图片、文本等格式</p>
      <input
        ref="fileInputRef"
        type="file"
        multiple
        @change="handleFileSelect"
        style="display:none"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt,.md,.csv"
      />
      <el-button type="primary" @click="$refs.fileInputRef.click()" class="select-btn">
        选择文件
      </el-button>
    </div>

    <!-- 上传队列 -->
    <div v-if="uploadQueue.length > 0" class="upload-queue">
      <h4 class="queue-title">上传队列 ({{ uploadQueue.length }})</h4>
      <div v-for="(item, i) in uploadQueue" :key="i" class="queue-item">
        <div class="queue-info">
          <span class="queue-icon">{{ fileIcon(item.type) }}</span>
          <div class="queue-meta">
            <span class="queue-name">{{ item.name }}</span>
            <span class="queue-size">{{ formatSize(item.size) }}</span>
          </div>
        </div>
        <div class="queue-fields">
          <el-select v-model="item.securityLevel" size="small" placeholder="安全等级" style="width:90px;">
            <el-option label="S级" value="S" />
            <el-option label="A级" value="A" />
            <el-option label="B级" value="B" />
          </el-select>
          <el-select v-model="item.category" size="small" placeholder="分类" style="width:100px;" filterable allow-create>
            <el-option v-for="c in presetCategories" :key="c" :label="c" :value="c" />
          </el-select>
          <el-input v-model="item.description" size="small" placeholder="备注..." style="width:120px;" />
          <el-button circle size="small" type="danger" text @click="removeFromQueue(i)">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button
        type="primary"
        @click="handleUpload"
        :disabled="uploadQueue.length === 0"
        class="confirm-btn"
      >
        归档 {{ uploadQueue.length }} 个档案
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Close } from '@element-plus/icons-vue'

const isMobile = ref(window.innerWidth < 768)
function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const props = defineProps({
  visible: { type: Boolean, default: false },
  files: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:visible', 'uploaded'])

const isDragover = ref(false)
const uploadQueue = ref([])
const fileInputRef = ref(null)

const presetCategories = ['证件', '合同', '财务', '教育', '医疗', '房产', '工作', '个人', '其他']

function fileIcon(type) {
  if (type?.includes('pdf')) return '📄'
  if (type?.includes('word') || type?.includes('document')) return '📝'
  if (type?.includes('excel') || type?.includes('sheet')) return '📊'
  if (type?.includes('image')) return '🖼️'
  if (type?.includes('text')) return '📃'
  return '📁'
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 智能预填：解析文件名
function parseFileName(name) {
  const withoutExt = name.replace(/\.[^/.]+$/, '')
  let category = '其他'
  const catMap = {
    '合同': '合同', '协议': '合同', '简历': '工作', '证书': '教育',
    '身份证': '证件', '护照': '证件', '户口': '证件', '发票': '财务',
    '工资': '财务', '账单': '财务', '体检': '医疗', '病历': '医疗',
    '房产': '房产', '租房': '房产', '报告': '工作', '方案': '工作'
  }
  for (const [kw, cat] of Object.entries(catMap)) {
    if (withoutExt.includes(kw)) { category = cat; break }
  }
  return { category }
}

function handleFileSelect(e) {
  addFiles(Array.from(e.target.files))
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function handleDrop(e) {
  isDragover.value = false
  addFiles(Array.from(e.dataTransfer.files))
}

function addFiles(fileList) {
  fileList.forEach(file => {
    // 去重检查
    const exists = uploadQueue.value.find(q => q.name === file.name && q.size === file.size)
    if (exists) {
      ElMessage.warning(`"${file.name}" 已在队列中`)
      return
    }
    const parsed = parseFileName(file.name)
    uploadQueue.value.push({
      name: file.name,
      size: file.size,
      type: file.type,
      securityLevel: 'B',
      category: parsed.category,
      description: '',
      tags: [parsed.category]
    })
  })
}

function removeFromQueue(index) {
  uploadQueue.value.splice(index, 1)
}

function handleUpload() {
  emit('uploaded', uploadQueue.value.map(item => ({ ...item })))
  uploadQueue.value = []
  emit('update:visible', false)
}
</script>

<style lang="scss" scoped>
.drop-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 14px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
  background: #f8fafc;
  &.dragover {
    border-color: #0d9488;
    background: #f0fdfa;
  }
}
.drop-icon { font-size: 48px; display: block; margin-bottom: 12px; }
.drop-text { font-size: 15px; color: #0f172a; margin: 0 0 4px; font-weight: 600; }
.drop-hint { font-size: 13px; color: #94a3b8; margin: 0 0 16px; }
.select-btn {
  background: linear-gradient(135deg, #0d9488, #14b8a6);
  border: none;
}

.upload-queue {
  margin-top: 20px;
}
.queue-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 10px;
}
.queue-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 8px;
  gap: 12px;
  flex-wrap: wrap;
}
.queue-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}
.queue-icon { font-size: 20px; }
.queue-meta { min-width: 0; }
.queue-name { font-size: 13px; color: #0f172a; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.queue-size { font-size: 11px; color: #94a3b8; }
.queue-fields {
  display: flex;
  align-items: center;
  gap: 6px;
}
.confirm-btn {
  background: linear-gradient(135deg, #0d9488, #14b8a6);
  border: none;
}

html.dark-mode & {
  .drop-zone { background: #252540; border-color: #2d2d4a; &.dragover { background: #0d2a26; border-color: #14b8a6; } }
  .drop-text { color: #e2dee9; }
  .queue-item { background: #252540; }
  .queue-name { color: #e2dee9; }
}
</style>

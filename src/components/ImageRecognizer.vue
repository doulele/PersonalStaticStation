<template>
  <div class="ir-root">
    <slot name="trigger" :ocrEnabled="ocrEnabled" :aiEnabled="aiEnabled" :isLoggedIn="isLoggedIn" :loading="loading" :open="open">
      <el-button type="primary" plain @click="open" :loading="loading">
        <el-icon><Camera /></el-icon> 导入截图
      </el-button>
    </slot>

    <input ref="fileInputRef" type="file" :accept="accept" style="display:none" @change="handleFileChange" />

    <el-dialog v-model="dialogVisible" :title="title" :width="dialogWidth" :close-on-click-modal="false" destroy-on-close>
      <!-- 模式选择卡片（始终显示） -->
      <div class="ir-mode-cards" v-if="ocrEnabled || aiEnabled">
        <div
          v-if="ocrEnabled"
          :class="['ir-mode-card', { 'ir-mode-card--active': mode === 'ocr' }]"
          @click="switchMode('ocr')"
        >
          <el-icon :size="20"><Document /></el-icon>
          <div class="ir-mode-card-body">
            <span class="ir-mode-card-label">OCR 识别</span>
            <span class="ir-mode-card-desc">腾讯云 OCR，通用快速</span>
          </div>
          <el-icon v-if="mode === 'ocr'" color="var(--el-color-primary)" :size="18"><CircleCheckFilled /></el-icon>
        </div>
        <div
          v-if="aiEnabled"
          :class="['ir-mode-card', { 'ir-mode-card--active': mode === 'ai' }]"
          @click="switchMode('ai')"
        >
          <el-icon :size="20"><MagicStick /></el-icon>
          <div class="ir-mode-card-body">
            <span class="ir-mode-card-label">
              AI 识别
              <el-tooltip v-if="aiRequireLogin && !isLoggedIn" content="需登录" placement="top">
                <el-icon :size="12" class="ir-lock-inline"><Lock /></el-icon>
              </el-tooltip>
            </span>
            <span class="ir-mode-card-desc">DeepSeek 视觉，更精准</span>
          </div>
          <el-icon v-if="mode === 'ai'" color="var(--el-color-primary)" :size="18"><CircleCheckFilled /></el-icon>
        </div>
      </div>

      <!-- 上传区域：未上传显示大块区域，已上传显示紧凑提示行 -->
      <div v-if="!previewUrl" class="ir-upload-zone" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
        <el-icon :size="32" class="ir-upload-icon"><UploadFilled /></el-icon>
        <span class="ir-upload-text">点击或拖拽截图到此处</span>
        <span class="ir-upload-hint">JPG / PNG，最大 10MB</span>
      </div>

      <!-- 已上传：紧凑水平提示行 + 重新上传按钮 -->
      <div v-else class="ir-upload-compact">
        <div class="ir-upload-compact-info">
          <el-icon :size="16" color="var(--el-color-primary)"><PictureFilled /></el-icon>
          <span class="ir-upload-compact-text">截图已上传</span>
        </div>
        <el-button size="small" text @click="triggerUpload" :disabled="loading">
          <el-icon><Refresh /></el-icon> 重新上传
        </el-button>
      </div>

      <!-- 加载状态（已上传后用紧凑的内嵌显示） -->
      <div v-if="loading" class="ir-status-inline">
        <el-icon class="is-loading" :size="14"><Loading /></el-icon>
        <span>{{ mode === 'ai' ? 'AI 识别中...' : 'OCR 识别中...' }}</span>
      </div>

      <!-- 结果 -->
      <div v-if="records.length > 0 && !loading" class="ir-result">
        <div class="ir-result-head">
          <span class="ir-count">共 {{ records.length }} 条记录</span>
          <el-tag size="small" :type="source === 'ai' ? 'success' : ''" effect="plain">
            {{ source === 'ai' ? 'AI' : 'OCR' }}
          </el-tag>
        </div>

        <slot name="result-table" :records="pagedRecords">
          <el-table :data="pagedRecords" size="small" max-height="280" style="width:100%;margin-top:6px">
            <el-table-column v-for="col in defaultColumns" :key="col.prop" v-bind="col" />
          </el-table>
        </slot>

        <div class="ir-pagination" v-if="records.length > pageSize">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="records.length"
            layout="prev, pager, next"
            small
            background
          />
        </div>
      </div>

      <div v-if="records.length === 0 && !loading && attempted" class="ir-empty">
        <slot name="result-empty">
          <el-empty description="未识别到记录" :image-size="60" />
        </slot>
      </div>

      <template #footer>
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="confirm" :disabled="records.length === 0 || loading">
          确认导入 {{ records.length }} 条
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Camera, Lock, Loading, CircleCheckFilled, UploadFilled, Refresh, Document, MagicStick, PictureFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  apiEndpoint: { type: String, default: '/staticTool/api/ocr/parse-trade-records' },
  ocrEnabled: { type: Boolean, default: true },
  aiEnabled: { type: Boolean, default: true },
  aiRequireLogin: { type: Boolean, default: true },
  accept: { type: String, default: 'image/*' },
  maxFileSize: { type: Number, default: 10 * 1024 * 1024 },
  title: { type: String, default: '截图识别' },
  pageSize: { type: Number, default: 10 },
  formDataBuilder: { type: Function, default: null },
  resultParser: { type: Function, default: null },
  columns: { type: Array, default: () => [] },
})

const emit = defineEmits(['confirm', 'error'])

const fileInputRef = ref(null)
const dialogVisible = ref(false)
const mode = ref('ocr')
const loading = ref(false)
const previewUrl = ref('')
const records = ref([])
const source = ref('')
const attempted = ref(false)
const currentPage = ref(1)

const isLoggedIn = computed(() => !!localStorage.getItem('auth_token'))
const dialogWidth = computed(() => window.innerWidth < 600 ? '95%' : '540px')

const pagedRecords = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  return records.value.slice(start, start + props.pageSize)
})

const defaultColumns = computed(() => {
  if (props.columns.length > 0) return props.columns
  return [
    { prop: 'date', label: '日期', width: 100 },
    { prop: 'type', label: '类型', width: 60 },
    { prop: 'price', label: '价格', width: 80 },
    { prop: 'shares', label: '数量', width: 80 },
  ]
})

function open() {
  mode.value = (!props.ocrEnabled && props.aiEnabled) ? 'ai' : 'ocr'
  records.value = []
  attempted.value = false
  previewUrl.value = ''
  source.value = ''
  currentPage.value = 1
  dialogVisible.value = true
}

function close() {
  dialogVisible.value = false
  previewUrl.value = ''
  records.value = []
  attempted.value = false
}

function switchMode(m) {
  if (loading.value) return
  if (m === 'ai' && props.aiRequireLogin && !isLoggedIn.value) return
  mode.value = m
  // 如果已上传过图片，切换模式后重新识别
  if (previewUrl.value && attempted.value) {
    triggerUpload()
  }
}

function triggerUpload() {
  fileInputRef.value?.click()
}

function handleDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function handleFileChange(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (file) processFile(file)
}

function processFile(file) {
  if (file.size > props.maxFileSize) {
    ElMessage.warning(`文件不能超过 ${(props.maxFileSize / 1024 / 1024).toFixed(0)}MB`)
    return
  }
  const reader = new FileReader()
  reader.onload = () => { previewUrl.value = reader.result }
  reader.readAsDataURL(file)
  doRecognize(file)
}

async function doRecognize(file) {
  loading.value = true
  attempted.value = true
  records.value = []
  currentPage.value = 1

  let formData = new FormData()
  formData.append('image', file)
  formData.append('useAI', mode.value === 'ai' ? 'true' : 'false')
  if (props.formDataBuilder) {
    formData = props.formDataBuilder(formData, file, mode.value)
  }

  try {
    const token = localStorage.getItem('auth_token')
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(props.apiEndpoint, { method: 'POST', headers, body: formData })
    const json = await res.json()

    if (json.code === 0 && json.data) {
      const parsed = props.resultParser ? props.resultParser(json) : (json.data.records || [])
      records.value = parsed
      source.value = json.data.source || 'ocr'
      if (records.value.length === 0) {
        ElMessage.warning(json.message || '未识别到记录')
      } else {
        ElMessage.success(json.message || `识别到 ${records.value.length} 条`)
      }
    } else {
      ElMessage.error(json.message || '识别失败')
      emit('error', json.message || '识别失败')
    }
  } catch (err) {
    console.error('[ImageRecognizer] 请求失败:', err)
    ElMessage.error('网络请求失败')
    emit('error', err.message)
  } finally {
    loading.value = false
  }
}

function confirm() {
  if (records.value.length === 0) return
  emit('confirm', records.value)
  close()
}
</script>

<style lang="scss" scoped>
.ir-root { display: contents; }

// ===== 模式卡片 =====
.ir-mode-cards {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.ir-mode-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 2px solid var(--el-border-color, #e4e7ed);
  border-radius: 10px;
  cursor: pointer;
  transition: all .2s;
  background: var(--el-bg-color, #fff);

  &:hover {
    border-color: var(--el-color-primary-light-5, #a0cfff);
    background: var(--el-color-primary-light-9, rgba(64,158,255,.04));
  }

  &--active {
    border-color: var(--el-color-primary, #409eff);
    background: var(--el-color-primary-light-9, rgba(64,158,255,.06));
    box-shadow: 0 0 0 1px var(--el-color-primary, #409eff);
  }
}

.ir-mode-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ir-mode-card-label {
  font-size: .85rem;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
  display: flex;
  align-items: center;
  gap: 4px;
}

.ir-mode-card-desc {
  font-size: .72rem;
  color: var(--el-text-color-secondary, #909399);
}

.ir-lock-inline {
  color: var(--el-text-color-placeholder, #c0c4cc);
}

// ===== 上传区域 =====
.ir-upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 26px 16px;
  border: 2px dashed var(--el-border-color, #dcdfe6);
  border-radius: 10px;
  cursor: pointer;
  transition: all .2s;

  &:hover {
    border-color: var(--el-color-primary, #409eff);
    background: var(--el-color-primary-light-9, rgba(64,158,255,.04));
  }
}

.ir-upload-icon {
  color: var(--el-text-color-placeholder, #c0c4cc);
}

.ir-upload-text {
  font-size: .88rem;
  color: var(--el-text-color-regular, #606266);
}

.ir-upload-hint {
  font-size: .72rem;
  color: var(--el-text-color-placeholder, #c0c4cc);
}

// ===== 紧凑上传提示 =====
.ir-upload-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-top: 4px;
  border-radius: 6px;
  background: var(--el-fill-color-light, #f5f7fa);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.ir-upload-compact-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: .85rem;
  color: var(--el-text-color-primary, #303133);
}

// ===== 内嵌加载状态 =====
.ir-status-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: .82rem;
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, rgba(64,158,255,.06));
}

// ===== 结果 =====
.ir-result { margin-top: 8px; }

.ir-result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.ir-count {
  font-size: .82rem;
  color: var(--el-text-color-secondary, #909399);
}

.ir-pagination {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.ir-empty { padding: 20px 0; }

// ===== 暗黑 =====
html.dark-mode {
  .ir-mode-card {
    border-color: #475569;
    &:hover { border-color: #3b82f6; background: rgba(59,130,246,.08); }
    &--active { border-color: #3b82f6; background: rgba(59,130,246,.12); box-shadow: 0 0 0 1px #3b82f6; }
  }

  .ir-upload-zone {
    border-color: #475569;
    &:hover { border-color: #3b82f6; background: rgba(59,130,246,.06); }
  }

  .ir-upload-compact {
    background: rgba(30,41,59,.6);
    border-color: #334155;
  }

  .ir-status-inline { background: rgba(59,130,246,.1); }
}

// ===== 移动端 =====
@media (max-width: 600px) {
  .ir-mode-cards { gap: 6px; }

  .ir-mode-card {
    padding: 10px;
    gap: 6px;
  }

  .ir-upload-zone {
    padding: 18px 12px;
    gap: 4px;
  }
}
</style>

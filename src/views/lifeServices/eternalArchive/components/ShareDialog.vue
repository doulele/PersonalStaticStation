<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="🔗 安全分享"
    :width="isMobile ? '92vw' : '480px'"
    class="share-dialog"
  >
    <div v-if="file" class="share-container">
      <div class="share-file-info">
        <span class="share-file-icon">📄</span>
        <div>
          <span class="share-file-name">{{ file.name }}</span>
          <span class="share-file-level">{{ file.securityLevel }}级档案</span>
        </div>
      </div>

      <el-form label-position="top" size="default">
        <el-form-item label="生效时间窗口">
          <div class="time-range">
            <el-date-picker v-model="shareForm.startDate" type="date" placeholder="开始日期" style="width:48%;" />
            <span class="range-sep">至</span>
            <el-date-picker v-model="shareForm.endDate" type="date" placeholder="结束日期" style="width:48%;" />
          </div>
        </el-form-item>

        <el-form-item label="最大访问次数">
          <el-radio-group v-model="shareForm.maxAccess">
            <el-radio-button :value="1">1次</el-radio-button>
            <el-radio-button :value="3">3次</el-radio-button>
            <el-radio-button :value="10">10次</el-radio-button>
            <el-radio-button :value="999">无限次</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="访问码（告知被分享者）">
          <div class="access-code-row">
            <el-input v-model="shareForm.accessCode" readonly class="code-input" />
            <el-button @click="generateCode">重新生成</el-button>
          </div>
        </el-form-item>
      </el-form>

      <div class="share-preview">
        <p class="preview-hint">💡 分享预览页水印：「此文件由 [你] 于 [时间] 分享给 [访问码持有者]」</p>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleShare">创建分享链接</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

const isMobile = ref(window.innerWidth < 768)
function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const props = defineProps({
  visible: { type: Boolean, default: false },
  file: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'shared'])

const shareForm = ref({
  startDate: new Date(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  maxAccess: 3,
  accessCode: ''
})

watch(() => props.visible, (v) => {
  if (v) {
    generateCode()
    shareForm.value.startDate = new Date()
    shareForm.value.endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
})

function generateCode() {
  shareForm.value.accessCode = Math.random().toString(36).slice(2, 8).toUpperCase()
}

function handleShare() {
  emit('shared', {
    startDate: shareForm.value.startDate?.toISOString(),
    endDate: shareForm.value.endDate?.toISOString(),
    maxAccess: shareForm.value.maxAccess,
    accessCode: shareForm.value.accessCode,
    shareUrl: `https://example.com/share/${Math.random().toString(36).slice(2, 10)}`
  })
  ElMessage.success('分享链接已创建')
  emit('update:visible', false)
}
</script>

<style lang="scss" scoped>
.share-file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 20px;
}
.share-file-icon { font-size: 28px; }
.share-file-name { font-size: 14px; font-weight: 600; color: #0f172a; display: block; }
.share-file-level { font-size: 11px; color: #94a3b8; }

.time-range { display: flex; align-items: center; gap: 8px; }
.range-sep { font-size: 13px; color: #94a3b8; }

.access-code-row { display: flex; gap: 8px; }
.code-input {
  :deep(.el-input__inner) { font-family: monospace; font-size: 18px; letter-spacing: 4px; text-align: center; font-weight: 700; }
}

.share-preview {
  margin-top: 16px;
  padding: 12px;
  background: #f0fdfa;
  border-radius: 8px;
}
.preview-hint { font-size: 12px; color: #0d9488; margin: 0; }

html.dark-mode & {
  .share-file-info { background: #252540; }
  .share-file-name { color: #e2dee9; }
  .share-preview { background: #0d2a26; }
}
</style>

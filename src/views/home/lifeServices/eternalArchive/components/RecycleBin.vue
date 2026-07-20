<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="🗑️ 回收站"
    :width="isMobile ? '92vw' : '650px'"
    class="recycle-dialog"
  >
    <div v-if="files.length > 0" class="recycle-list">
      <div class="recycle-header">
        <span class="header-hint">文件将在保留期满后自动清理</span>
        <el-button text size="small" type="danger" @click="handleClearAll">清空回收站</el-button>
      </div>
      <div v-for="file in files" :key="file.id" class="recycle-item">
        <span class="recycle-icon">📄</span>
        <div class="recycle-info">
          <span class="recycle-name">{{ file.name }}</span>
          <span class="recycle-meta">
            {{ file.securityLevel }}级 · {{ formatSize(file.size) }} · 剩余 {{ daysLeft(file) }} 天
          </span>
        </div>
        <div class="recycle-actions">
          <el-button size="small" type="primary" text @click="$emit('restore', file)">恢复</el-button>
          <el-button size="small" type="danger" text @click="$emit('destroy', file)">永久删除</el-button>
        </div>
      </div>
    </div>
    <div v-else class="recycle-empty">
      <span class="empty-icon">🗑️</span>
      <p>回收站为空</p>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessageBox } from 'element-plus'

const isMobile = ref(window.innerWidth < 768)
function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

defineProps({ visible: { type: Boolean, default: false }, files: { type: Array, default: () => [] } })
const emit = defineEmits(['update:visible', 'restore', 'destroy'])

function formatSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
function daysLeft(file) {
  if (!file.deletedAt) return 0
  const age = (Date.now() - new Date(file.deletedAt).getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.ceil((file.retentionDays || 15) - age))
}

async function handleClearAll() {
  try {
    await ElMessageBox.confirm('确定要永久清空回收站所有文件吗？', '⚠️ 清空回收站', {
      confirmButtonText: '确认永久删除', cancelButtonText: '取消', type: 'error'
    })
    // 逐个触发销毁
    emit('destroy', { all: true })
  } catch { }
}
</script>

<style lang="scss" scoped>
.recycle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.header-hint { font-size: 12px; color: #94a3b8; }
.recycle-list { }
.recycle-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 8px;
}
.recycle-icon { font-size: 22px; }
.recycle-info { flex: 1; min-width: 0; }
.recycle-name { font-size: 13px; font-weight: 500; color: #0f172a; display: block; }
.recycle-meta { font-size: 11px; color: #94a3b8; }
.recycle-actions { display: flex; gap: 4px; }
.recycle-empty {
  text-align: center;
  padding: 60px 20px;
  .empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
  p { color: #94a3b8; font-size: 14px; }
}

html.dark-mode & {
  .recycle-item { background: #252540; }
  .recycle-name { color: #e2dee9; }
}
</style>

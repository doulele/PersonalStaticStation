<template>
  <div class="timeline-view">
    <div v-if="files.length > 0" class="timeline">
      <div v-for="group in groupedFiles" :key="group.key" class="timeline-group">
        <div class="timeline-node">
          <span class="node-dot"></span>
          <span class="node-label">{{ group.label }}</span>
        </div>
        <div class="timeline-files">
          <div
            v-for="file in group.files"
            :key="file.id"
            class="timeline-file"
            @click="$emit('detail', file)"
          >
            <span class="tl-file-icon">{{ fileIcon(file.type) }}</span>
            <div class="tl-file-info">
              <span class="tl-file-name">{{ file.name }}</span>
              <span class="tl-file-meta">
                {{ file.securityLevel }}级 · {{ formatSize(file.size) }}
              </span>
            </div>
            <el-button text size="small" @click.stop="$emit('preview', file)">预览</el-button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <span class="empty-icon">🕰️</span>
      <p class="empty-text">暂无档案记录</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ files: { type: Array, default: () => [] } })
defineEmits(['preview', 'detail'])

const groupedFiles = computed(() => {
  const groups = {}
  props.files.forEach(f => {
    const date = new Date(f.uploadDate)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!groups[key]) {
      groups[key] = { key, label: `${date.getFullYear()}年${date.getMonth() + 1}月`, files: [] }
    }
    groups[key].files.push(f)
  })
  return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key))
})

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
.timeline-view { }

.timeline {
  position: relative;
  padding-left: 32px;
  &::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: linear-gradient(to bottom, #0d9488, #14b8a6);
    border-radius: 1px;
  }
}

.timeline-group { margin-bottom: 24px; }
.timeline-node {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  margin-left: -32px;
}
.node-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0d9488;
  border: 3px solid #ccfbf1;
  box-shadow: 0 0 0 3px #f0fdfa;
  flex-shrink: 0;
}
.node-label {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.timeline-files {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.timeline-file {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: #0d9488; background: #f0fdfa; }
}
.tl-file-icon { font-size: 24px; }
.tl-file-info { flex: 1; min-width: 0; }
.tl-file-name { font-size: 14px; font-weight: 500; color: #0f172a; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tl-file-meta { font-size: 11px; color: #94a3b8; }

.empty-state {
  text-align: center;
  padding: 80px 20px;
  .empty-icon { font-size: 64px; display: block; margin-bottom: 16px; }
  .empty-text { font-size: 18px; color: #64748b; }
}

html.dark-mode & {
  .node-dot { background: #14b8a6; border-color: #0d2a26; box-shadow: 0 0 0 3px #0d2a26; }
  .node-label { color: #e2dee9; }
  .timeline-file { background: #1e1e2e; border-color: #2d2d4a; &:hover { background: #0d2a26; } }
  .tl-file-name { color: #e2dee9; }
}
</style>

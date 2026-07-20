<template>
  <div class="file-grid-view">
    <div v-if="files.length > 0" class="grid-container">
      <div
        v-for="file in files"
        :key="file.id"
        class="file-card"
        @click="$emit('detail', file)"
      >
        <!-- 缩略图/图标 -->
        <div class="card-thumb" :class="file.securityLevel">
          <span class="thumb-icon">{{ fileIcon(file.type) }}</span>
          <span class="thumb-level">{{ file.securityLevel }}</span>
          <span v-if="file.isColdStorage" class="cold-mark">❄️</span>
        </div>
        <!-- 信息 -->
        <div class="card-body">
          <h4 class="card-name" :title="file.name">{{ file.name }}</h4>
          <p v-if="file.description" class="card-desc">{{ file.description }}</p>
          <div class="card-meta">
            <span>{{ formatDate(file.uploadDate) }}</span>
            <span>{{ formatSize(file.size) }}</span>
          </div>
        </div>
        <!-- 悬浮操作 -->
        <div class="card-actions">
          <el-button circle size="small" @click.stop="$emit('preview', file)" title="预览">
            <el-icon><View /></el-icon>
          </el-button>
          <el-button circle size="small" @click.stop="$emit('share', file)" title="分享">
            <el-icon><Share /></el-icon>
          </el-button>
          <el-button circle size="small" @click.stop="$emit('archive', file)" :title="file.isColdStorage ? '取消冷存储' : '冷存储'">
            <el-icon><component :is="file.isColdStorage ? 'Sunny' : 'Moon'" /></el-icon>
          </el-button>
          <el-button circle size="small" type="danger" @click.stop="$emit('delete', file)" title="删除">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <span class="empty-icon">🏛️</span>
      <p class="empty-text">档案库为空</p>
      <p class="empty-hint">点击上方"上传档案"开始构建你的数字保险库</p>
    </div>
  </div>
</template>

<script setup>
import { View, Share, Delete, Sunny, Moon } from '@element-plus/icons-vue'

defineProps({ files: { type: Array, default: () => [] } })
defineEmits(['preview', 'detail', 'delete', 'share', 'archive'])

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
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('zh-CN') : ''
}
</script>

<style lang="scss" scoped>
.file-grid-view { }

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.file-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
  &:hover {
    border-color: #0d9488;
    box-shadow: 0 4px 20px rgba(13, 148, 136, 0.1);
    transform: translateY(-2px);
    .card-actions { opacity: 1; transform: translateY(0); }
  }
}

.card-thumb {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #f8fafc;
  &.S { background: linear-gradient(135deg, #fef3c7, #fde68a); }
  &.A { background: linear-gradient(135deg, #e2e8f0, #cbd5e1); }
  &.B { background: linear-gradient(135deg, #fef2e8, #fde4cf); }
}
.thumb-icon { font-size: 36px; }
.thumb-level {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(255,255,255,0.8);
  color: #0f172a;
}
.cold-mark { position: absolute; top: 8px; left: 8px; font-size: 14px; }

.card-body {
  padding: 14px;
}
.card-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-desc {
  font-size: 12px;
  color: #94a3b8;
  margin: 0 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #94a3b8;
}

.card-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.25s;
  border-top: 1px solid #f1f5f9;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  .empty-icon { font-size: 64px; display: block; margin-bottom: 16px; }
  .empty-text { font-size: 18px; color: #64748b; margin: 0 0 8px; }
  .empty-hint { font-size: 14px; color: #94a3b8; margin: 0; }
}

@media (max-width: 768px) {
  .grid-container { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
  .card-actions { opacity: 1; transform: translateY(0); position: static; background: transparent; border: none; padding-top: 0; }
}

html.dark-mode & {
  .file-card { background: #1e1e2e; border-color: #2d2d4a; }
  .card-thumb { background: #252540; &.S { background: #2d2a1a; } &.A { background: #252540; } &.B { background: #2d1f1a; } }
  .card-name { color: #e2dee9; }
  .card-actions { background: rgba(30,30,46,0.95); border-color: #2d2d4a; }
  .empty-state { background: #1e1e2e; border-color: #2d2d4a; }
}
</style>

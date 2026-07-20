<template>
  <div class="file-list-view">
    <el-table :data="files" style="width:100%" @row-click="(row) => $emit('detail', row)" class="ea-table">
      <el-table-column width="40">
        <template #default="{ row }">
          <span class="file-type-icon">{{ fileIcon(row.type) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="文件名" min-width="200">
        <template #default="{ row }">
          <div class="file-name-cell">
            <span class="file-name">{{ row.name }}</span>
            <div class="file-tags">
              <span class="level-badge" :class="row.securityLevel">{{ row.securityLevel }}级</span>
              <span v-if="row.category" class="cat-badge">{{ row.category }}</span>
              <span v-if="row.versionChain" class="ver-badge" title="有版本链">🔗</span>
              <span v-if="row.isColdStorage" class="cold-badge">❄️冷存储</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="大小" width="90" align="right">
        <template #default="{ row }">{{ formatSize(row.size) }}</template>
      </el-table-column>
      <el-table-column label="上传日期" width="110">
        <template #default="{ row }">{{ formatDate(row.uploadDate) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <div class="row-actions" @click.stop>
            <el-button text size="small" @click="$emit('preview', row)">预览</el-button>
            <el-button text size="small" @click="$emit('detail', row)">详情</el-button>
            <el-button text size="small" @click="$emit('share', row)">分享</el-button>
            <el-dropdown trigger="click">
              <el-button text size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="$emit('archive', row)">
                    {{ row.isColdStorage ? '取消冷存储' : '移入冷存储' }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="$emit('delete', row)" style="color:#ef4444;">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="files.length === 0" class="empty-state">
      <span class="empty-icon">🏛️</span>
      <p class="empty-text">档案库为空</p>
      <p class="empty-hint">点击上方"上传档案"开始构建你的数字保险库</p>
    </div>
  </div>
</template>

<script setup>
import { MoreFilled } from '@element-plus/icons-vue'

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
.file-list-view {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
}
.ea-table {
  :deep(.el-table__header th) { background: #f8fafc; color: #64748b; font-weight: 600; }
  :deep(.el-table__row) { cursor: pointer; &:hover { background: #f0fdfa; } }
}
.file-type-icon { font-size: 20px; }
.file-name-cell { display: flex; flex-direction: column; gap: 4px; }
.file-name { font-size: 14px; font-weight: 500; color: #0f172a; }
.file-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.level-badge {
  font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 600;
  &.S { background: #fef3c7; color: #92400e; }
  &.A { background: #e2e8f0; color: #475569; }
  &.B { background: #fef2e8; color: #9a3412; }
}
.cat-badge { font-size: 10px; color: #94a3b8; }
.ver-badge, .cold-badge { font-size: 11px; }
.row-actions { display: flex; align-items: center; gap: 2px; }

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

html.dark-mode & {
  .file-list-view { background: #1e1e2e; border-color: #2d2d4a; }
  .ea-table :deep(.el-table__header th) { background: #252540; color: #94a3b8; }
  .ea-table :deep(.el-table__row) { &:hover { background: #0d2a26; } }
  .file-name { color: #e2dee9; }
  .empty-state { background: #1e1e2e; border-color: #2d2d4a; }
}
</style>

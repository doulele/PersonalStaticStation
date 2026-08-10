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

<style lang="scss" scoped src="./FileGrid.scss"></style>

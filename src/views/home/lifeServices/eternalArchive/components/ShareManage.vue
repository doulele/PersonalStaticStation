<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="🔗 我的分享"
    :width="isMobile ? '92vw' : '550px'"
    class="share-manage-dialog"
  >
    <div v-if="shares.length > 0" class="share-list">
      <div v-for="share in shares" :key="share.id" class="share-item">
        <div class="share-item-info">
          <span class="share-item-name">📄 {{ share.fileName }}</span>
          <div class="share-item-meta">
            <span>访问码：{{ share.accessCode }}</span>
            <span>剩余 {{ share.maxAccess === 999 ? '∞' : share.maxAccess }} 次</span>
            <span :class="{ expired: isExpired(share) }">
              {{ isExpired(share) ? '已过期' : formatDate(share.endDate) + ' 到期' }}
            </span>
          </div>
        </div>
        <el-button size="small" type="danger" text @click="$emit('revoke', share)">
          撤回
        </el-button>
      </div>
    </div>
    <div v-else class="share-empty">
      <span class="empty-icon">🔗</span>
      <p>暂无进行中的分享</p>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isMobile = ref(window.innerWidth < 768)
function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

defineProps({ visible: { type: Boolean, default: false }, shares: { type: Array, default: () => [] } })
defineEmits(['update:visible', 'revoke'])

function isExpired(share) {
  return share.endDate && new Date(share.endDate) < new Date()
}
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('zh-CN') : ''
}
</script>

<style lang="scss" scoped>
.share-list { }
.share-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 8px;
  gap: 12px;
}
.share-item-info { min-width: 0; }
.share-item-name { font-size: 14px; font-weight: 500; color: #0f172a; display: block; margin-bottom: 4px; }
.share-item-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #94a3b8;
  flex-wrap: wrap;
}
.expired { color: #ef4444; font-weight: 600; }

.share-empty {
  text-align: center;
  padding: 60px 20px;
  .empty-icon { font-size: 48px; display: block; margin-bottom: 12px; }
  p { color: #94a3b8; font-size: 14px; }
}

html.dark-mode & {
  .share-item { background: #252540; }
  .share-item-name { color: #e2dee9; }
}
</style>

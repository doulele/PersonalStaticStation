<template>
  <el-drawer :model-value="visible" @update:model-value="(val) => emit('update:visible', val)" title="消息中心" size="400px" direction="rtl" destroy-on-close>
    <div class="notification-panel">
      <div class="np-header" v-if="notifications.length > 0">
        <el-button size="small" text @click="handleMarkAll">全部已读</el-button>
      </div>

      <div v-if="notifications.length > 0" class="np-list">
        <div
          v-for="n in notifications"
          :key="n.id"
          class="np-item"
          :class="{ unread: !n.isRead }"
          @click="handleRead(n)"
        >
          <div class="np-icon">
            {{ typeIcon(n.type) }}
          </div>
          <div class="np-content">
            <div class="np-title">{{ n.title }}</div>
            <div class="np-desc" v-if="n.content">{{ n.content }}</div>
            <div class="np-time">{{ timeAgo(n.createdAt) }}</div>
          </div>
          <div v-if="!n.isRead" class="np-dot"></div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">🔔</div>
        <p>暂无消息</p>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['update:visible'])
const store = useStore()

const notifications = computed(() => store.state.wishTreeHole.notifications)

function typeIcon(type) {
  const map = {
    celebration: '🎉',
    pat: '👋',
    sos: '💚',
    reminder: '⏰',
    default: '📌'
  }
  return map[type] || '📌'
}

function timeAgo(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}小时前`
  return `${Math.floor(h / 24)}天前`
}

function handleRead(n) {
  if (!n.isRead) {
    store.dispatch('wishTreeHole/markRead', n.id)
  }
}

function handleMarkAll() {
  store.dispatch('wishTreeHole/markAllRead')
}
</script>

<style lang="scss" scoped>
.notification-panel { }

.np-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.np-list {
  display: flex;
  flex-direction: column;
}

.np-item {
  display: flex;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;

  &:hover { background: #f8fafc; }

  &.unread { background: #eef2ff; }
}

.np-icon {
  font-size: 24px;
  flex-shrink: 0;
  width: 40px;
  text-align: center;
}

.np-content {
  flex: 1;
  min-width: 0;
}

.np-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
}

.np-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.4;
}

.np-time {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 6px;
}

.np-dot {
  position: absolute;
  top: 18px;
  right: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #94a3b8;
  .empty-icon { font-size: 48px; margin-bottom: 12px; }
}

@media (max-width: 768px) {
  .np-item { padding: 12px 10px; }
  .np-icon { font-size: 20px; width: 32px; }
  .np-title { font-size: 13px; }
  .np-desc { font-size: 12px; }
  .empty-state { padding: 60px 16px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .np-item {
    &:hover { background: #252540; }
    &.unread { background: #252050; }
  }
  .np-title { color: #e2dee9; }
  .np-desc { color: #94a3b8; }
  .np-time { color: #64748b; }
}
</style>

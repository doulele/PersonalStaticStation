<template>
  <el-drawer :model-value="visible" @update:model-value="(val) => emit('update:visible', val)" title="消息中心" :size="direction === 'btt' ? '70%' : '400px'" :direction="direction" destroy-on-close>
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

const props = defineProps({ visible: Boolean, direction: { type: String, default: 'rtl' } })
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
  margin-bottom: 16px;
}

.np-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.np-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #6366f1, #a855f7);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
    transform: translateY(-2px);

    &::before {
      opacity: 1;
    }
  }

  &.unread {
    background: #eef2ff;
    border-color: #dde4f7;

    &::before {
      opacity: 1;
    }
  }
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
  .empty-icon { font-size: 64px; margin-bottom: 16px; }
  p { font-size: 18px; color: #64748b; margin: 0; }
}

@media (max-width: 768px) {
  .np-item { padding: 14px; }
  .np-icon { font-size: 20px; width: 32px; }
  .np-title { font-size: 13px; }
  .np-desc { font-size: 12px; }
  .empty-state { padding: 60px 16px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .np-item {
    background: #252540;
    border-color: #2d2d4a;
    &:hover { background: #1e1e2e; border-color: #a78bfa; box-shadow: 0 4px 16px rgba(167, 139, 250, 0.08); transform: translateY(-2px); }
    &.unread { background: #1e2040; border-color: #2d2d4a; }
  }
  .np-title { color: #e2dee9; }
  .np-desc { color: #94a3b8; }
  .np-time { color: #64748b; }
  .empty-state {
    p { color: #94a3b8; }
    .empty-icon { color: #64748b; }
  }
}
</style>

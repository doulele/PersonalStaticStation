<template>
  <div class="flow-workshop">
    <!-- 统计卡片 -->
    <div class="ws-stats">
      <div class="ws-stat-card">
        <span class="ws-stat-icon">🧘</span>
        <div>
          <span class="ws-stat-value">{{ totalSessions }}</span>
          <span class="ws-stat-label">总专注次数</span>
        </div>
      </div>
      <div class="ws-stat-card">
        <span class="ws-stat-icon">⏱️</span>
        <div>
          <span class="ws-stat-value">{{ totalMinutes }}</span>
          <span class="ws-stat-label">总专注分钟</span>
        </div>
      </div>
      <div class="ws-stat-card">
        <span class="ws-stat-icon">🏆</span>
        <div>
          <span class="ws-stat-value">{{ efficientCount }}</span>
          <span class="ws-stat-label">高效红利次数</span>
        </div>
      </div>
    </div>

    <!-- 当前无专注会话时展示可专注的任务 -->
    <div class="ws-section">
      <h3 class="ws-section-title">选择一个任务开始专注</h3>
      <div v-if="availableTasks.length > 0" class="ws-task-grid">
        <div
          v-for="task in availableTasks"
          :key="task.id"
          class="ws-task-chip"
          @click="$emit('start', task.id)"
        >
          <span class="ws-task-energy">{{ task.energy === 'high' ? '⚡' : '🍃' }}</span>
          <span class="ws-task-title">{{ task.title }}</span>
          <span class="ws-task-duration">{{ task.duration || 25 }}分钟</span>
        </div>
      </div>
      <div v-else class="ws-empty">
        <p>暂无可用任务，去创建一些吧~</p>
      </div>
    </div>

    <!-- 历史专注记录 -->
    <div class="ws-section" v-if="sessions.length > 0">
      <h3 class="ws-section-title">专注历史</h3>
      <div class="ws-history-list">
        <div v-for="s in sessions.slice(0, 20)" :key="s.taskId + s.startTime" class="ws-history-item">
          <span class="ws-history-energy">{{ s.energy === 'high' ? '⚡' : '🍃' }}</span>
          <span class="ws-history-title">{{ s.taskTitle }}</span>
          <span class="ws-history-time">
            {{ s.actualMinutes || s.duration }}分钟
            <span v-if="isEfficient(s)" class="efficient-badge">高效</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeSession: { type: Object, default: null },
  sessions: { type: Array, default: () => [] }
})

defineEmits(['start', 'stop', 'complete'])

const totalSessions = computed(() => props.sessions.filter(s => s.status === 'completed').length)
const totalMinutes = computed(() =>
  props.sessions.filter(s => s.status === 'completed').reduce((sum, s) => sum + (s.actualMinutes || s.duration || 0), 0)
)
const efficientCount = computed(() =>
  props.sessions.filter(s => s.status === 'completed' && s.actualMinutes < (s.duration || 25) * 0.8).length
)

// 从主页面tasks中获取 - 这里简化处理
const availableTasks = computed(() => {
  const tasks = JSON.parse(localStorage.getItem('ta_tasks') || '[]')
  return tasks.filter(t => t.status === 'active')
})

function isEfficient(session) {
  return session.actualMinutes < (session.duration || 25) * 0.8
}
</script>

<style lang="scss" scoped>
.flow-workshop { }

.ws-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}
.ws-stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}
.ws-stat-icon { font-size: 32px; }
.ws-stat-value { font-size: 24px; font-weight: 700; color: #0f172a; display: block; }
.ws-stat-label { font-size: 12px; color: #94a3b8; }

.ws-section { margin-bottom: 28px; }
.ws-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 14px;
}

.ws-task-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ws-task-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: #d4a843;
    background: #fff;
    box-shadow: 0 2px 12px rgba(212, 168, 67, 0.1);
  }
}
.ws-task-energy { font-size: 20px; }
.ws-task-title { flex: 1; font-size: 14px; font-weight: 500; color: #0f172a; }
.ws-task-duration { font-size: 13px; color: #94a3b8; }

.ws-history-list { display: flex; flex-direction: column; gap: 8px; }
.ws-history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 10px;
  font-size: 13px;
}
.ws-history-energy { font-size: 16px; }
.ws-history-title { flex: 1; color: #0f172a; }
.ws-history-time { color: #94a3b8; display: flex; align-items: center; gap: 6px; }
.efficient-badge {
  background: #dcfce7;
  color: #16a34a;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.ws-empty {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .ws-stats { grid-template-columns: 1fr; }
  .ws-stat-card { padding: 14px; }
}

html.dark-mode & {
  .ws-stat-card { background: #1e1e2e; border-color: #2d2d4a; }
  .ws-stat-value { color: #e2dee9; }
  .ws-stat-label { color: #64748b; }
  .ws-section-title { color: #e2dee9; }
  .ws-task-chip { background: #252540; border-color: #2d2d4a; &:hover { background: #1e1e2e; border-color: #f0c060; } }
  .ws-task-title { color: #e2dee9; }
  .ws-task-duration { color: #64748b; }
  .ws-history-item { background: #252540; }
  .ws-history-title { color: #e2dee9; }
  .ws-history-time { color: #64748b; }
  .efficient-badge { background: #1a2d1a; }
  .ws-empty { color: #64748b; }
}
</style>

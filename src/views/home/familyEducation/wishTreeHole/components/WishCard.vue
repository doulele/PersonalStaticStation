<template>
  <div class="wish-card" :class="statusClass" @click="$emit('click')">
    <div class="wc-left">
      <!-- 进度环 -->
      <div class="progress-ring">
        <svg viewBox="0 0 48 48" class="ring-svg">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#e2e8f0" stroke-width="4" />
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            :stroke="progressColor"
            stroke-width="4"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            class="ring-progress"
          />
        </svg>
        <span class="progress-text">{{ wish.progress }}%</span>
      </div>
    </div>

    <div class="wc-center">
      <div class="wc-title">{{ wish.title }}</div>
      <div class="wc-meta">
        <el-tag :type="priorityType" size="small">{{ wish.priority }}优先级</el-tag>
        <el-tag size="small" effect="plain">{{ wish.category }}</el-tag>
        <span v-if="wish.creatorName && wish.creatorName !== '匿名'" class="wc-author">
          {{ wish.creatorName }}
        </span>
      </div>
      <!-- 天气挂件 -->
      <div v-if="latestMood" class="wc-mood-weather" :title="latestMood">
        {{ weatherEmoji }}
      </div>
    </div>

    <div class="wc-right">
      <div class="wc-days" v-if="wish.targetDate">
        <span class="days-num" :class="{ overdue: daysLeft < 0 }">
          {{ daysLeft < 0 ? '逾期' + Math.abs(daysLeft) + '天' : '剩' + daysLeft + '天' }}
        </span>
        <span class="days-label">{{ formatDate(wish.targetDate) }}</span>
      </div>
      <div v-else class="wc-days">
        <span class="days-num no-deadline">无截止</span>
      </div>
    </div>

    <!-- 操作按钮组 -->
    <div class="wc-actions" @click.stop>
      <el-tooltip content="打卡进度" placement="top">
        <el-button circle size="small" :type="wish.status === '已完成' ? 'success' : 'primary'" @click="$emit('checkin')">
          <el-icon><Check /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="延期" placement="top" v-if="wish.status !== '已完成'">
        <el-button circle size="small" @click="$emit('delay')">
          <el-icon><Clock /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="归档" placement="top" v-if="wish.status === '已完成' && !wish.archivedAt">
        <el-button circle size="small" type="success" @click="$emit('archive')">
          <el-icon><FolderChecked /></el-icon>
        </el-button>
      </el-tooltip>
      <el-popconfirm title="确定要删除这个愿望吗？" @confirm="$emit('delete')" confirm-button-text="删除" cancel-button-text="取消">
        <template #reference>
          <el-button circle size="small" type="danger" plain>
            <el-icon><Delete /></el-icon>
          </el-button>
        </template>
      </el-popconfirm>
      <el-tooltip content="拍一拍" placement="top">
        <el-button circle size="small" type="warning" plain @click="$emit('pat')">
          👋
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Check, Clock, Delete, FolderChecked } from '@element-plus/icons-vue'

const props = defineProps({
  wish: { type: Object, required: true },
  latestMood: { type: String, default: '' }
})

defineEmits(['click', 'checkin', 'delete', 'archive', 'delay', 'pat'])

const circumference = 2 * Math.PI * 20

const dashOffset = computed(() => {
  return circumference - (circumference * props.wish.progress) / 100
})

const statusClass = computed(() => {
  if (props.wish.status === '已完成') return 'completed'
  if (props.wish.status === '逾期') return 'overdue'
  return ''
})

const progressColor = computed(() => {
  if (props.wish.status === '已完成') return '#10b981'
  if (props.wish.status === '逾期') return '#f59e0b'
  if (props.wish.progress > 50) return '#6366f1'
  return '#3b82f6'
})

const daysLeft = computed(() => {
  if (!props.wish.targetDate) return null
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const target = new Date(props.wish.targetDate)
  return Math.ceil((target - now) / 86400000)
})

const priorityType = computed(() => {
  const map = { '高': 'danger', '中': 'warning', '低': 'info' }
  return map[props.wish.priority] || 'info'
})

const weatherEmoji = computed(() => {
  const text = props.latestMood || ''
  if (text.includes('开心') || text.includes('棒') || text.includes('好')) return '☀️'
  if (text.includes('累') || text.includes('平静') || text.includes('一般')) return '☁️'
  if (text.includes('难过') || text.includes('哭') || text.includes('烦')) return '🌧️'
  if (text.includes('焦虑') || text.includes('害怕') || text.includes('担心')) return '⛈️'
  return ''
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
</script>

<style lang="scss" scoped>
.wish-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: #6366f1;
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1);
    transform: translateY(-2px);

    .wc-actions { opacity: 1; transform: translateX(0); }
  }

  &.completed { border-left: 4px solid #10b981; }
  &.overdue { border-left: 4px solid #f59e0b; }
}

.wc-left {
  flex-shrink: 0;
}

.progress-ring {
  position: relative;
  width: 52px;
  height: 52px;
}

.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-progress {
  transition: stroke-dashoffset 0.5s ease, stroke 0.3s ease;
}

.progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
}

.wc-center {
  flex: 1;
  min-width: 0;
}

.wc-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wc-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.wc-author {
  font-size: 12px;
  color: #94a3b8;
}

.wc-mood-weather {
  margin-top: 6px;
  font-size: 18px;
}

.wc-right {
  flex-shrink: 0;
  text-align: right;
  min-width: 70px;
}

.wc-days {
  .days-num {
    display: block;
    font-size: 18px;
    font-weight: 700;
    color: #6366f1;
    &.overdue { color: #ef4444; }
    &.no-deadline { font-size: 13px; color: #94a3b8; }
  }
  .days-label {
    font-size: 11px;
    color: #94a3b8;
  }
}

// 操作按钮 - 默认隐藏
.wc-actions {
  display: flex;
  gap: 6px;
  position: absolute;
  right: 20px;
  bottom: 12px;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.25s ease;
}

@media (max-width: 768px) {
  .wish-card {
    padding: 14px;
    gap: 10px;
    flex-wrap: wrap;
  }
  .wc-left { order: 1; }
  .wc-center { order: 2; flex: 1 1 calc(100% - 80px); }
  .wc-right { order: 3; min-width: 50px; }
  .wc-title { font-size: 14px; margin-bottom: 6px; }
  .wc-actions {
    order: 4;
    width: 100%;
    position: static;
    opacity: 1;
    transform: none;
    flex-wrap: wrap;
    justify-content: flex-start;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #f1f5f9;
    .el-button {
      min-width: 36px;
      min-height: 36px;
    }
  }
  .progress-ring { width: 44px; height: 44px; }
  .wc-days .days-num { font-size: 15px; }
}

@media (max-width: 480px) {
  .wc-meta { flex-wrap: wrap; }
  .wc-title { font-size: 13px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .wish-card {
    background: #1e1e2e;
    border-color: #2d2d4a;
    &:hover { border-color: #a78bfa; box-shadow: 0 4px 20px rgba(167, 139, 250, 0.12); }
  }
  .wc-title { color: #e2dee9; }
  .wc-author { color: #64748b; }
  .progress-text { color: #e2dee9; }
  .days-num:not(.overdue):not(.no-deadline) { color: #a78bfa; }
  .days-label { color: #64748b; }
  // SVG 进度环背景色
  .ring-svg circle:first-child { stroke: #2d2d4a; }
  .wc-meta .el-tag--plain { background: #252540; color: #94a3b8; border-color: #2d2d4a; }
  // 移动端操作按钮分隔线
  @media (max-width: 768px) {
    .wc-actions { border-top-color: #2d2d4a; }
  }
}
</style>

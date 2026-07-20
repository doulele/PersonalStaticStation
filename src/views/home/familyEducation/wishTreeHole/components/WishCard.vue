<template>
  <div class="wish-card" :class="[statusClass, { 'just-completed': showCelebrate }]" @click="$emit('click')">
    <!-- 完成撒花 -->
    <div v-if="showCelebrate" class="confetti-burst">
      <span v-for="i in 12" :key="i" class="confetti-piece" :style="{ '--i': i }">{{ ['🎉','✨','🌟','💫','🎊','⭐'][i % 6] }}</span>
    </div>

    <!-- 左侧进度环 -->
    <div class="wc-left">
      <div class="progress-ring" :class="{ 'ring-pulse': wish.progress >= 100 }">
        <svg viewBox="0 0 48 48" class="ring-svg">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#e2e8f0" stroke-width="4" />
          <circle cx="24" cy="24" r="20" fill="none" :stroke="progressColor" stroke-width="4"
            stroke-linecap="round" :stroke-dasharray="circumference" :stroke-dashoffset="dashOffset" class="ring-progress" />
        </svg>
        <span class="progress-text" :class="{ completed: wish.progress >= 100 }">{{ wish.progress }}%</span>
      </div>
    </div>

    <!-- 右侧主体内容 -->
    <div class="wc-body">
      <!-- 第一行：标题 + 截止标签 -->
      <div class="wc-title-row">
        <span class="wc-title">{{ wish.title }}</span>
        <span class="wc-deadline-tag" :class="{ overdue: daysLeft < 0, 'no-deadline': !wish.targetDate }">
          {{ wish.targetDate ? (daysLeft < 0 ? '逾期' + Math.abs(daysLeft) + '天' : '剩' + daysLeft + '天') : '无截止' }}
        </span>
      </div>

      <!-- 描述（有则显示，最多2行） -->
      <div v-if="wish.description" class="wc-desc">{{ wish.description }}</div>

      <!-- 第二行：标签 + 日期 + 创建者 -->
      <div class="wc-info-row">
        <div class="wc-tags">
          <el-tag :type="priorityType" size="small">{{ wish.priority }}优先级</el-tag>
          <el-tag size="small" effect="plain">{{ wish.category }}</el-tag>
        </div>
        <div class="wc-meta-right">
          <span class="wc-date" v-if="wish.targetDate">{{ formatDate(wish.targetDate) }}截止</span>
          <span v-if="wish.creatorName && !isMine" class="wc-author">{{ wish.creatorName }}</span>
        </div>
      </div>
    </div>

    <!-- 操作按钮组 -->
    <div class="wc-actions" @click.stop>
      <el-button size="small" text class="btn-pat" v-if="!isMine" @click="$emit('pat')">拍一拍</el-button>
      <el-button size="small" text class="btn-checkin" :class="{ done: wish.status === '已完成' }" @click="$emit('checkin')">打卡</el-button>
      <el-button size="small" text class="btn-delay" v-if="wish.status !== '已完成'" @click="$emit('delay')">延期</el-button>
      <el-button size="small" text class="btn-archive" v-if="wish.status === '已完成' && !wish.archivedAt" @click="$emit('archive')">归档</el-button>
      <el-popconfirm title="确定删除这个愿望？" @confirm="$emit('delete')" confirm-button-text="删除" cancel-button-text="取消">
        <template #reference>
          <el-button size="small" text class="btn-delete">删除</el-button>
        </template>
      </el-popconfirm>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const props = defineProps({
  wish: { type: Object, required: true }
})

defineEmits(['click', 'checkin', 'delete', 'archive', 'delay', 'pat'])

const isMine = computed(() => store.state.auth?.user?.userId === props.wish.userId)
const circumference = 2 * Math.PI * 20

const dashOffset = computed(() => circumference - (circumference * props.wish.progress) / 100)

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

const showCelebrate = ref(false)
watch(() => props.wish.progress, (val) => {
  if (val >= 100) { showCelebrate.value = true; setTimeout(() => { showCelebrate.value = false }, 2500) }
}, { immediate: true })

const daysLeft = computed(() => {
  if (!props.wish.targetDate) return null
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.ceil((new Date(props.wish.targetDate) - now) / 86400000)
})

const priorityType = computed(() => ({ '高': 'danger', '中': 'warning', '低': 'info' }[props.wish.priority] || 'info'))

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
</script>

<style lang="scss" scoped>
.wish-card {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    "ring body"
    ".   actions";
  column-gap: 14px;
  row-gap: 12px;
  padding: 18px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #6366f1, #a855f7);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    border-color: #6366f1;
    box-shadow: 0 8px 30px rgba(99, 102, 241, 0.1);
    transform: translateY(-2px);
    &::before { opacity: 1; }
  }

  &.completed { opacity: 0.85; }
  &.overdue { border-color: #fecaca; }
}

// ====== 左侧进度环 ======
.wc-left {
  grid-area: ring;
  padding-top: 2px;
}

.progress-ring {
  position: relative;
  width: 48px;
  height: 48px;
}

.ring-svg {
  width: 100%; height: 100%;
  transform: rotate(-90deg);
}

.ring-progress {
  transition: stroke-dashoffset 0.5s ease, stroke 0.3s ease;
}

.progress-text {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  color: #0f172a;

  &.completed {
    color: #10b981; font-size: 13px;
    &::after { content: ' ✓'; }
  }
}

// ====== 右侧主体 ======
.wc-body {
  grid-area: body;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wc-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wc-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.wc-deadline-tag {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background: #eef2ff;
  color: #6366f1;
  white-space: nowrap;

  &.overdue { background: #fef2f2; color: #ef4444; }
  &.no-deadline { background: #f1f5f9; color: #94a3b8; }
}

.wc-desc {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.wc-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.wc-tags {
  display: flex;
  align-items: center;
  gap: 6px;
}

.wc-meta-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.wc-date {
  font-size: 12px;
  color: #94a3b8;
}

.wc-author {
  font-size: 12px;
  color: #94a3b8;
  &::before { content: '·'; margin-right: 8px; }
}

// ====== 操作按钮 ======
.wc-actions {
  grid-area: actions;
  display: flex;
  justify-content: flex-end;
  gap: 0;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;

  :deep(.el-button) { padding: 3px 8px; margin-left: 0; font-size: 12px; }

  .btn-pat { color: #f59e0b; &:hover { color: #d97706; background: #fffbeb; } }
  .btn-checkin { color: #6366f1; &:hover { color: #4f46e5; background: #eef2ff; }
    &.done { color: #10b981; &:hover { color: #059669; background: #ecfdf5; } }
  }
  .btn-delay { color: #8b5cf6; &:hover { color: #7c3aed; background: #f5f3ff; } }
  .btn-archive { color: #10b981; &:hover { color: #059669; background: #ecfdf5; } }
  .btn-delete { color: #ef4444; &:hover { color: #dc2626; background: #fef2f2; } }
}

// ====== 撒花 ======
.confetti-burst { position: absolute; inset: 0; pointer-events: none; z-index: 5; overflow: visible; }
.confetti-piece {
  position: absolute; top: 50%; left: 50%; font-size: 20px;
  animation: confettiPop 2s ease-out forwards;
  animation-delay: calc(var(--i) * 0.08s);
}
@keyframes confettiPop {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  20% { transform: translate(calc(-50% + (var(--i) - 6) * 18px), calc(-50% - 40px + (var(--i) #{'%'} 3) * 20px)) scale(1.3); opacity: 1; }
  100% { transform: translate(calc(-50% + (var(--i) - 6) * 50px), calc(-50% - 100px + (var(--i) #{'%'} 3) * 40px)) scale(0.5); opacity: 0; }
}

// ====== 进度环脉冲 ======
.ring-pulse { animation: ringPulse 1s ease-in-out infinite; }
@keyframes ringPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }

.wish-card.just-completed {
  border-color: #10b981;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
}

// ====== 移动端 ======
@media (max-width: 768px) {
  .wish-card { padding: 14px; gap: 12px; }
  .wc-body { gap: 4px; }
  .wc-title { font-size: 14px; }
  .wc-actions { margin-top: 4px; padding-top: 8px; gap: 2px;
    :deep(.el-button) { font-size: 11px; padding: 2px 6px; }
  }
  .progress-ring { width: 42px; height: 42px; }
}

@media (max-width: 480px) {
  .wc-title { font-size: 13px; }
  .wc-actions :deep(.el-button) { font-size: 10px; padding: 2px 5px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .wish-card {
    background: #1e1e2e;
    border-color: #2d2d4a;
    &:hover { border-color: #a78bfa; background: #252540; box-shadow: 0 8px 30px rgba(167, 139, 250, 0.12); }
    &.overdue { border-color: #7f1d1d; }
  }
  .wc-title { color: #e2dee9; }
  .wc-author { color: #64748b; }
  .progress-text { color: #e2dee9; }
  .wc-date { color: #64748b; }
  .wc-deadline-tag.no-deadline { background: #2d2d4a; color: #64748b; }
  .ring-svg circle:first-child { stroke: #2d2d4a; }
  .wc-actions { border-top-color: #2d2d4a; }
  .wc-meta .el-tag--plain { background: #252540; color: #94a3b8; border-color: #2d2d4a; }
}
</style>

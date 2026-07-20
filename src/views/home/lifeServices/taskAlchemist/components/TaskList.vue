<template>
  <div class="task-list">
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="filter-group">
        <span class="filter-label">状态</span>
        <el-select v-model="filterStatus" size="small" @change="onFilterChange" style="width: 110px;" :placeholder="isMobile ? '全部状态' : ''">
          <el-option label="全部" value="all" />
          <el-option label="进行中" value="active" />
          <el-option label="已完成" value="completed" />
          <el-option label="已逾期" value="overdue" />
        </el-select>
        <span class="filter-label">精力</span>
        <el-select v-model="filterEnergy" size="small" @change="onFilterChange" style="width: 110px;" :placeholder="isMobile ? '全部精力' : ''">
          <el-option label="全部" value="all" />
          <el-option label="高能耗" value="high" />
          <el-option label="低能耗" value="low" />
        </el-select>
        <span class="filter-label">优先级</span>
        <el-select v-model="filterPriority" size="small" @change="onFilterChange" style="width: 110px;" :placeholder="isMobile ? '全部优先级' : ''">
          <el-option label="全部" value="all" />
          <el-option label="紧急" value="urgent" />
          <el-option label="重要" value="important" />
          <el-option label="普通" value="normal" />
        </el-select>
      </div>
      <el-button type="primary" @click="$emit('add')" class="add-btn">
        <el-icon><Plus /></el-icon>
        <span>新建任务</span>
      </el-button>
    </div>

    <!-- 今日推荐标签（低调居中） -->
    <div v-if="recommendLabel" class="recommend-label">
      <span class="recommend-icon">{{ recommendLabel.icon }}</span>
      <span>{{ recommendLabel.text }}</span>
    </div>

    <!-- 任务卡片列表 -->
    <div v-if="filteredTasks.length > 0" class="task-cards">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="task-card"
        :class="[
          `energy-${task.energy}`,
          `status-${task.status}`,
          { 'is-recommended': recommendedIds.includes(task.id) }
        ]"
      >
        <!-- 上部分：内容区 -->
        <div class="card-main" @click="handleCardClick(task)">
          <div class="card-side">
            <div class="energy-badge" :class="task.energy">
              <span class="energy-icon-text">{{ task.energy === 'high' ? '⚡' : '🍃' }}</span>
              <span class="energy-name">{{ task.energy === 'high' ? '高' : '低' }}</span>
            </div>
          </div>
          <div class="task-body">
            <div class="task-title-row">
              <h4 class="task-title">{{ task.title }}</h4>
              <span v-if="task.priority" class="priority-dot" :class="task.priority" :title="priorityLabel(task.priority)"></span>
            </div>
            <p v-if="task.description" class="task-desc">{{ task.description }}</p>
            <div class="task-meta">
              <span v-if="task.duration" class="meta-item">{{ task.duration }}分钟</span>
              <span v-if="task.deadline" class="meta-item" :class="{ 'deadline-near': isDeadlineNear(task) }">{{ formatDeadline(task.deadline) }}</span>
              <span v-if="task.penanceTask" class="meta-item penance">赎罪任务待完成</span>
              <span v-if="!task.duration && !task.deadline && !task.penanceTask" class="meta-item meta-empty">未设置时长/截止</span>
            </div>
          </div>
        </div>

        <!-- 下部分：操作栏独占一行靠右 -->
        <div class="card-actions" @click.stop>
          <el-button size="small" @click="$emit('focus', task)" class="act-btn primary">开始专注</el-button>
          <el-button size="small" type="success" @click="$emit('complete', task)" class="act-btn">完成任务</el-button>
          <el-button size="small" @click="$emit('edit', task)" class="act-btn">编辑</el-button>
          <el-button size="small" @click="$emit('delay', task)" class="act-btn">延期</el-button>
          <el-button size="small" type="danger" @click="$emit('delete', task)" class="act-btn">删除</el-button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <span class="empty-icon">⚗️</span>
      <p class="empty-text">暂无炼金任务</p>
      <p class="empty-hint">点击上方"新建任务"，将你的待办事项投入炼金炉吧</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  currentHour: { type: Number, default: 0 }
})

const emit = defineEmits(['add', 'edit', 'delete', 'focus', 'complete', 'delay'])

const isMobile = ref(window.innerWidth < 768)
function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const filterStatus = ref('all')
const filterEnergy = ref('all')
const filterPriority = ref('all')

const filteredTasks = computed(() => {
  let list = props.tasks
  if (filterStatus.value !== 'all') {
    list = list.filter(t => t.status === filterStatus.value)
  }
  if (filterEnergy.value !== 'all') {
    list = list.filter(t => t.energy === filterEnergy.value)
  }
  if (filterPriority.value !== 'all') {
    list = list.filter(t => t.priority === filterPriority.value)
  }
  return list
})

// 推荐标签
const recommendLabel = computed(() => {
  const h = props.currentHour
  const isGolden = (h >= 9 && h < 11.5) || (h >= 14.5 && h < 17)
  const isSilver = (h >= 12 && h < 14.5)
  const isNight = h >= 21
  if (isGolden) return { icon: '🔥', text: '黄金时段 - 推荐攻坚高能耗任务' }
  if (isSilver) return { icon: '☕', text: '碎片时段 - 适合处理低能耗琐事' }
  if (isNight) return { icon: '🌙', text: '深夜时段 - 仅展示规划类低能耗任务' }
  return null
})

const recommendedIds = computed(() => {
  const h = props.currentHour
  return props.tasks.filter(t => {
    if (t.status !== 'active') return false
    const isGolden = (h >= 9 && h < 11.5) || (h >= 14.5 && h < 17)
    const isSilver = (h >= 12 && h < 14.5)
    const isNight = h >= 21
    if (isGolden && t.energy === 'high') return true
    if (isSilver && t.energy === 'low') return true
    if (isNight && t.energy === 'low') return true
    return false
  }).map(t => t.id)
})

function onFilterChange() {}

function priorityLabel(p) {
  const map = { urgent: '🔴 紧急', important: '🟡 重要', normal: '🟢 普通' }
  return map[p] || ''
}

function handleCardClick(task) {
  if (task.status === 'active' || task.status === 'overdue') {
    emit('focus', task)
  }
}

function formatDeadline(deadline) {
  if (!deadline) return ''
  const d = new Date(deadline)
  const now = new Date()
  const diff = d - now
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return `已逾期${Math.abs(days)}天`
  if (days === 0) return '今天截止'
  if (days === 1) return '明天截止'
  return `${days}天后截止`
}

function isDeadlineNear(task) {
  if (!task.deadline) return false
  const d = new Date(task.deadline)
  const now = new Date()
  const hoursLeft = (d - now) / (1000 * 60 * 60)
  return hoursLeft < 2 && hoursLeft > 0
}
</script>

<style lang="scss" scoped>
.task-list { }

// ==================== 操作栏 ====================
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.filter-label {
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
}
.add-btn {
  background: linear-gradient(135deg, #d4a843, #c9952e);
  border: none;
  &:hover {
    background: linear-gradient(135deg, #c9952e, #b8861e);
  }
}

// ==================== 推荐标签（居中低调） ====================
.recommend-label {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(148, 163, 184, 0.08);
  border-radius: 10px;
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 16px;
  font-weight: 400;
}
.recommend-icon { font-size: 14px; }

// ==================== 任务卡片 ====================
.task-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.task-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: #d4a843;
    box-shadow: 0 4px 20px rgba(212, 168, 67, 0.12);
    transform: translateY(-1px);
  }

  &.is-recommended {
    border-color: #d4a843;
    box-shadow: 0 0 0 2px rgba(212, 168, 67, 0.18);
  }

  &.status-completed {
    opacity: 0.55;
    .task-title { text-decoration: line-through; }
  }

  &.status-overdue {
    border-color: #ef4444;
    background: linear-gradient(135deg, #fef2f2, #fff);
  }
}

// 上部分：内容区
.card-main {
  display: flex;
  align-items: stretch;
  gap: 12px;
  padding: 14px 16px 8px;
  cursor: pointer;
}
.card-side {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  padding-top: 2px;
}
.energy-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  width: 40px;
  height: 42px;
  border-radius: 10px;
  font-weight: 600;
  &.high { background: linear-gradient(135deg, #fef2f2, #fee2e2); color: #dc2626; }
  &.low { background: linear-gradient(135deg, #f0fdf4, #dcfce7); color: #16a34a; }
}
.energy-icon-text { font-size: 17px; line-height: 1; }
.energy-name { font-size: 10px; line-height: 1; }

.task-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.task-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.task-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}
.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  &.urgent { background: #ef4444; box-shadow: 0 0 0 2px #fef2f2; }
  &.important { background: #eab308; box-shadow: 0 0 0 2px #fefce8; }
  &.normal { background: #22c55e; box-shadow: 0 0 0 2px #f0fdf4; }
}
.task-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}
.task-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  min-height: 18px;
}
.meta-item {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  &.deadline-near { color: #ef4444; font-weight: 600; }
  &.penance { color: #f59e0b; font-weight: 500; }
  &.meta-empty { color: #cbd5e1; font-style: italic; }
}

// 下部分：操作栏独占一行靠右
.card-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 6px 16px 12px;
  border-top: 1px solid #f1f5f9;
}
.act-btn {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  &:hover {
    border-color: #d4a843;
    color: #d4a843;
    background: #fef3c7;
  }
  &.primary {
    border-color: #d4a843;
    color: #d4a843;
    background: #fef3c7;
    &:hover { background: #fde68a; }
  }
}

// ==================== 空状态 ====================
.empty-state {
  text-align: center;
  padding: 80px 20px;
  .empty-icon { font-size: 64px; display: block; margin-bottom: 16px; }
  .empty-text { font-size: 18px; color: #64748b; margin: 0 0 8px; }
  .empty-hint { font-size: 14px; color: #94a3b8; margin: 0; }
}

// ==================== 响应式 ====================
@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-group {
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 6px;
  }
  .filter-label { display: none; }
  .card-main { padding: 12px 12px 6px; gap: 10px; }
  .card-side { width: 34px; }
  .energy-badge { width: 34px; height: 36px; }
  .energy-icon-text { font-size: 15px; }
  .task-title { font-size: 14px; }
  .task-meta { gap: 10px; }
  .card-actions {
    gap: 6px;
    padding: 6px 12px 10px;
    flex-wrap: wrap;
  }
  .act-btn { font-size: 11px; padding: 3px 10px; }
}

html.dark-mode & {
  .task-card {
    background: #1e1e2e;
    border-color: #2d2d4a;
    &:hover { border-color: #f0c060; }
    &.status-overdue { background: linear-gradient(135deg, #2d1a1a, #1e1e2e); border-color: #ef4444; }
  }
  .energy-badge.high { background: linear-gradient(135deg, #2d1a1a, #1e1e2e); }
  .energy-badge.low { background: linear-gradient(135deg, #1a2d1a, #1e1e2e); }
  .task-title { color: #e2dee9; }
  .task-desc { color: #94a3b8; }
  .meta-item { color: #64748b; }
  .card-actions { border-color: #2d2d4a; }
  .act-btn { background: #252540; border-color: #2d2d4a; color: #64748b; &:hover { border-color: #f0c060; color: #f0c060; background: #2d2a1a; } }
  .act-btn.primary { border-color: #f0c060; color: #f0c060; background: #2d2a1a; }
  .recommend-label { background: rgba(148, 163, 184, 0.06); color: #64748b; }
  .empty-text { color: #94a3b8; }
  .empty-hint { color: #64748b; }
  .priority-dot.urgent { box-shadow: 0 0 0 2px #2d1a1a; }
  .priority-dot.important { box-shadow: 0 0 0 2px #2d2a1a; }
  .priority-dot.normal { box-shadow: 0 0 0 2px #1a2d1a; }
}
</style>

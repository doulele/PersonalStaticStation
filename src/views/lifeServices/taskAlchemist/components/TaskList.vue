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

<style lang="scss" scoped src="./TaskList.scss"></style>

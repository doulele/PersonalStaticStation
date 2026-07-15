<template>
  <el-drawer
    :model-value="visible" @update:model-value="(val) => emit('update:visible', val)"
    title="愿望详情"
    size="480px"
    direction="rtl"
    destroy-on-close
  >
    <div v-if="wish" class="wish-detail">
      <!-- 头部信息 -->
      <div class="detail-header">
        <h2 class="detail-title">{{ wish.title }}</h2>
        <div class="detail-meta">
          <el-tag :type="statusTagType" size="small">{{ wish.status }}</el-tag>
          <el-tag size="small" effect="plain">{{ wish.category }}</el-tag>
          <span v-if="wish.targetDate" class="detail-date">
            📅 {{ formatDate(wish.targetDate) }}
            <span v-if="daysLeft > 0" class="days-left">（剩{{ daysLeft }}天）</span>
            <span v-else class="days-overdue">（已逾期{{ Math.abs(daysLeft) }}天）</span>
          </span>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="detail-progress">
        <div class="progress-info">
          <span>进度</span>
          <span>{{ wish.progress }}%</span>
        </div>
        <el-progress
          :percentage="wish.progress"
          :color="progressColor"
          :stroke-width="12"
          :striped="wish.progress < 100"
          :striped-flow="wish.progress < 100"
        />
      </div>

      <!-- 描述 -->
      <div class="detail-section" v-if="wish.description">
        <h4>📝 描述</h4>
        <p>{{ wish.description }}</p>
      </div>

      <!-- 子任务 -->
      <div class="detail-section" v-if="subTasks.length > 0">
        <h4>✅ 子任务 ({{ doneCount }}/{{ subTasks.length }})</h4>
        <div class="subtask-list">
          <div v-for="(task, idx) in subTasks" :key="idx" class="subtask-item" :class="{ done: task.done }">
            <el-checkbox v-model="task.done" @change="saveSubTasks" />
            <span>{{ task.title || '未命名任务' }}</span>
          </div>
        </div>
      </div>

      <!-- 情绪时间轴 -->
      <div class="detail-section" v-if="moods.length > 0">
        <h4>💬 情绪时间轴</h4>
        <div class="mood-timeline">
          <div v-for="mood in moods" :key="mood.id" class="mood-item">
            <div class="mood-mask">{{ mood.isAnonymous ? mood.animalMask : mood.creatorName }}</div>
            <div class="mood-content">{{ mood.content }}</div>
            <div class="mood-time">{{ timeAgo(mood.createdAt) }}</div>
          </div>
        </div>
      </div>

      <!-- 打卡记录 -->
      <div class="detail-section" v-if="checkins && checkins.length > 0">
        <h4>📌 打卡记录</h4>
        <div class="checkin-list">
          <div v-for="ci in checkins" :key="ci.id" class="checkin-item">
            <span class="checkin-dot">✓</span>
            <span class="checkin-text">{{ ci.note || '打卡' }} ({{ ci.progress }}%)</span>
            <span class="checkin-time">{{ timeAgo(ci.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="detail-actions" v-if="wish.status !== '已完成'">
        <el-button type="primary" @click="handleCheckin" :icon="CircleCheck">
          打卡进度
        </el-button>
        <el-button @click="handleDelay" :icon="Clock">延期</el-button>
        <el-button @click="$emit('pat', { userId: wish.userId, targetType: 'wish', targetId: wish.id, message: `拍了拍「${wish.title}」` })">
          👋 拍一拍
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { CircleCheck, Clock } from '@element-plus/icons-vue'

const props = defineProps({
  visible: Boolean,
  wishId: [String, null]
})
const emit = defineEmits(['update:visible', 'pat'])
const store = useStore()

const wish = computed(() => store.state.wishTreeHole.currentWish)
const moods = computed(() => wish.value?.moods || [])
const checkins = computed(() => wish.value?.checkins || [])
const subTasks = computed({
  get: () => wish.value?.subTasks || [],
  set: (v) => {}
})

const doneCount = computed(() => subTasks.value.filter(t => t.done).length)

const daysLeft = computed(() => {
  if (!wish.value?.targetDate) return 0
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.ceil((new Date(wish.value.targetDate) - now) / 86400000)
})

const statusTagType = computed(() => {
  const map = { '进行中': '', '已完成': 'success', '逾期': 'warning' }
  return map[wish.value?.status] || ''
})

const progressColor = computed(() => {
  if (wish.value?.status === '已完成') return '#10b981'
  if (wish.value?.status === '逾期') return '#f59e0b'
  if (wish.value?.progress > 50) return '#6366f1'
  return '#3b82f6'
})

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function timeAgo(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}小时前`
  const days = Math.floor(h / 24)
  return `${days}天前`
}

async function handleCheckin() {
  if (!wish.value) return
  const newProgress = Math.min(wish.value.progress + 20, 100)
  const res = await store.dispatch('wishTreeHole/checkinWish', { id: wish.value.id, progress: newProgress })
  if (res.success) {
    ElMessage.success(newProgress >= 100 ? '🎉 愿望达成！' : '打卡成功！')
    if (wish.value.id) store.dispatch('wishTreeHole/loadWishDetail', wish.value.id)
  }
}

async function handleDelay() {
  if (!wish.value) return
  try {
    const { value: dateStr } = await ElMessageBox.prompt('延期到哪天？', '延期愿望', {
      inputType: 'date',
      inputValue: wish.value.targetDate || ''
    })
    if (dateStr) {
      await store.dispatch('wishTreeHole/delayWish', { id: wish.value.id, newDate: dateStr })
      ElMessage.success('已延期')
      store.dispatch('wishTreeHole/loadWishDetail', wish.value.id)
    }
  } catch { /* 取消 */ }
}

async function saveSubTasks() {
  if (!wish.value) return
  await store.dispatch('wishTreeHole/updateSubTasks', { id: wish.value.id, subTasks: subTasks.value })
}
</script>

<style lang="scss" scoped>
.wish-detail {
  padding: 0 4px;

  .detail-header {
    margin-bottom: 20px;
  }

  .detail-title {
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 12px;
  }

  .detail-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .detail-date {
    font-size: 13px;
    color: #64748b;
    .days-left { color: #6366f1; }
    .days-overdue { color: #ef4444; }
  }

  .detail-progress {
    margin-bottom: 24px;
    .progress-info {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
    }
  }

  .detail-section {
    margin-bottom: 24px;
    h4 {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 12px;
    }
    p {
      font-size: 14px;
      color: #475569;
      line-height: 1.7;
    }
  }

  .subtask-list {
    .subtask-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
      &.done span { text-decoration: line-through; color: #94a3b8; }
    }
  }

  .mood-timeline {
    .mood-item {
      padding: 12px;
      background: #f8fafc;
      border-radius: 10px;
      margin-bottom: 8px;
      .mood-mask {
        font-size: 12px;
        color: #6366f1;
        font-weight: 600;
        margin-bottom: 4px;
      }
      .mood-content {
        font-size: 14px;
        color: #334155;
        line-height: 1.5;
      }
      .mood-time {
        font-size: 11px;
        color: #94a3b8;
        margin-top: 4px;
      }
    }
  }

  .checkin-list {
    .checkin-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      font-size: 13px;
      .checkin-dot {
        color: #10b981;
        font-weight: 700;
      }
      .checkin-text { color: #475569; flex: 1; }
      .checkin-time { color: #94a3b8; font-size: 11px; }
    }
  }

  .detail-actions {
    display: flex;
    gap: 10px;
    padding-top: 24px;
    border-top: 1px solid #e2e8f0;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .wish-detail {
    .detail-title { font-size: 18px; }
    .detail-actions {
      flex-direction: column;
      .el-button { width: 100%; justify-content: center; }
    }
    .subtask-item { padding: 10px 0; }
    .mood-item { padding: 10px; }
  }
}

@media (max-width: 480px) {
  .wish-detail .detail-meta { gap: 4px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .detail-title { color: #e2dee9; }
  .detail-meta .detail-date { color: #94a3b8; }
  .detail-progress .progress-info { color: #94a3b8; }
  .detail-section h4 { color: #e2dee9; }
  .detail-section p { color: #94a3b8; }
  .mood-item { background: #252540 !important; }
  .mood-mask { color: #a78bfa !important; }
  .mood-content { color: #94a3b8 !important; }
  .mood-time { color: #64748b !important; }
  .subtask-item { border-color: #2d2d4a !important; }
  .checkin-item .checkin-text { color: #94a3b8; }
  .detail-actions { border-color: #2d2d4a !important; }
}
</style>

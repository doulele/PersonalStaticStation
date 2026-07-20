<template>
  <el-drawer
    :model-value="visible" @update:model-value="(val) => emit('update:visible', val)"
    :title="isMine ? '编辑愿望' : '愿望详情'"
    size="480px"
    direction="rtl"
    destroy-on-close
  >
    <div v-if="wish" class="wish-detail">
      <!-- ====== 编辑模式 ====== -->
      <template v-if="isMine">
        <el-form :model="form" label-position="top" ref="formRef" class="edit-form">
          <el-form-item label="愿望标题" prop="title">
            <el-input v-model="form.title" maxlength="50" show-word-limit />
          </el-form-item>

          <el-form-item label="描述">
            <el-input v-model="form.description" type="textarea" :rows="3" placeholder="详细描述一下..." />
          </el-form-item>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="分类">
                <el-select v-model="form.category" style="width: 100%">
                  <el-option label="生活" value="生活" />
                  <el-option label="学习" value="学习" />
                  <el-option label="旅行" value="旅行" />
                  <el-option label="体验" value="体验" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="优先级">
                <el-select v-model="form.priority" style="width: 100%">
                  <el-option label="高" value="高" />
                  <el-option label="中" value="中" />
                  <el-option label="低" value="低" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="截止日期">
            <el-date-picker v-model="form.targetDate" type="date" placeholder="选择日期" style="width: 100%" />
          </el-form-item>

          <!-- 子任务 -->
          <el-form-item label="子任务">
            <div class="edit-subtasks">
              <div v-for="(task, idx) in form.subTasks" :key="idx" class="subtask-row">
                <el-input v-model="task.title" placeholder="子任务名称" size="small" />
                <el-button circle size="small" :icon="Delete" @click="form.subTasks.splice(idx, 1)" />
              </div>
              <el-button size="small" text type="primary" @click="addSubTask">+ 添加子任务</el-button>
            </div>
          </el-form-item>

          <div class="edit-actions">
            <el-button @click="emit('update:visible', false)">取消</el-button>
            <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
          </div>
        </el-form>
      </template>

      <!-- ====== 查看模式（别人的愿望） ====== -->
      <template v-else>
        <div class="detail-card">
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

          <div class="detail-progress">
            <div class="progress-info">
              <span>进度</span>
              <span>{{ wish.progress }}%</span>
            </div>
            <el-progress :percentage="wish.progress" :color="progressColor" :stroke-width="12"
              :striped="wish.progress < 100" :striped-flow="wish.progress < 100" />
          </div>
        </div>

        <div class="detail-section" v-if="wish.description">
          <h4>描述</h4>
          <p>{{ wish.description }}</p>
        </div>

        <div class="detail-section" v-if="subTasks.length > 0">
          <h4>子任务 ({{ doneCount }}/{{ subTasks.length }})</h4>
          <div class="subtask-list">
            <div v-for="(task, idx) in subTasks" :key="idx" class="subtask-card" :class="{ done: task.done }">
              <el-checkbox v-model="task.done" @change="saveSubTasks" />
              <span>{{ task.title || '未命名任务' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="moods.length > 0">
          <h4>情绪时间轴</h4>
          <div class="mood-timeline">
            <div v-for="mood in moods" :key="mood.id" class="mood-card">
              <div class="mood-mask">{{ mood.isAnonymous ? mood.animalMask : mood.creatorName }}</div>
              <div class="mood-content">{{ mood.content }}</div>
              <div class="mood-time">{{ timeAgo(mood.createdAt) }}</div>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="checkins && checkins.length > 0">
          <h4>打卡记录</h4>
          <div class="checkin-list">
            <div v-for="ci in checkins" :key="ci.id" class="checkin-card">
              <span class="checkin-dot">✓</span>
              <span class="checkin-text">{{ ci.note || '打卡' }} ({{ ci.progress }}%)</span>
              <span class="checkin-time">{{ timeAgo(ci.createdAt) }}</span>
            </div>
          </div>
        </div>

        <div class="detail-actions" v-if="wish.status !== '已完成'">
          <el-button type="primary" @click="handleCheckin" :icon="CircleCheck">打卡进度</el-button>
          <el-button @click="handleDelay" :icon="Clock">延期</el-button>
          <el-button type="warning" plain @click="$emit('pat', { userId: wish.userId, targetType: 'wish', targetId: wish.id, message: `拍了拍「${wish.title}」` })">
            <span class="pat-icon">👋</span> 拍一拍
          </el-button>
        </div>
      </template>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck, Clock, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  visible: Boolean,
  wishId: [String, null]
})
const emit = defineEmits(['update:visible', 'pat'])
const store = useStore()

const wish = computed(() => store.state.wishTreeHole.currentWish)
const isMine = computed(() => store.state.auth?.user?.userId === wish.value?.userId)
const moods = computed(() => wish.value?.moods || [])
const checkins = computed(() => wish.value?.checkins || [])
const subTasks = computed(() => wish.value?.subTasks || [])
const doneCount = computed(() => subTasks.value.filter(t => t.done).length)

const daysLeft = computed(() => {
  if (!wish.value?.targetDate) return 0
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.ceil((new Date(wish.value.targetDate) - now) / 86400000)
})

const statusTagType = computed(() => ({ '进行中': '', '已完成': 'success', '逾期': 'warning' }[wish.value?.status] || ''))

const progressColor = computed(() => {
  if (wish.value?.status === '已完成') return '#10b981'
  if (wish.value?.status === '逾期') return '#f59e0b'
  if (wish.value?.progress > 50) return '#6366f1'
  return '#3b82f6'
})

// ====== 编辑表单 ======
const saving = ref(false)
const formRef = ref(null)
const form = reactive({
  title: '',
  description: '',
  category: '生活',
  priority: '中',
  targetDate: '',
  subTasks: []
})

watch(() => wish.value, (w) => {
  if (w && isMine.value) {
    form.title = w.title || ''
    form.description = w.description || ''
    form.category = w.category || '生活'
    form.priority = w.priority || '中'
    form.targetDate = w.targetDate || ''
    form.subTasks = [...(w.subTasks || [])]
  }
}, { immediate: true })

function addSubTask() {
  form.subTasks.push({ title: '', done: false })
}

async function handleSave() {
  saving.value = true
  try {
    const data = {
      ...form,
      targetDate: form.targetDate ? new Date(form.targetDate).toISOString().slice(0, 10) : null
    }
    const res = await store.dispatch('wishTreeHole/updateWish', { id: wish.value.id, data })
    if (res.success) {
      ElMessage.success('已保存')
      store.dispatch('wishTreeHole/loadWishDetail', wish.value.id)
    }
  } catch { /* ignore */ }
  saving.value = false
}

// ====== 查看模式操作 ======
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
  return `${Math.floor(h / 24)}天前`
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
}

// ====== 编辑表单 ======
.edit-form {
  .edit-subtasks {
    display: flex;
    flex-direction: column;
    gap: 6px;
    .subtask-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }
  .edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }
}

// ====== 查看模式 ======
.detail-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.detail-header { margin-bottom: 20px; }

.detail-title {
  font-size: 20px;
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
  .progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #64748b;
    margin-bottom: 8px;
  }
}

.detail-section {
  margin-bottom: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  h4 {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 12px;
  }
  p {
    font-size: 14px;
    color: #475569;
    line-height: 1.7;
    margin: 0;
  }
}

.subtask-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  .subtask-card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    &.done span { text-decoration: line-through; color: #94a3b8; }
  }
}

.mood-timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
  .mood-card {
    padding: 12px 16px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    .mood-mask { font-size: 12px; color: #6366f1; font-weight: 700; margin-bottom: 4px; }
    .mood-content { font-size: 14px; color: #334155; line-height: 1.5; }
    .mood-time { font-size: 12px; color: #94a3b8; margin-top: 4px; }
  }
}

.checkin-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  .checkin-card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    .checkin-dot { color: #10b981; font-weight: 700; }
    .checkin-text { color: #475569; flex: 1; font-size: 14px; }
    .checkin-time { color: #94a3b8; font-size: 12px; }
  }
}

.detail-actions {
  display: flex;
  gap: 10px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .detail-title { font-size: 18px; }
  .detail-actions {
    flex-direction: column;
    .el-button { width: 100%; justify-content: center; }
  }
  .subtask-card, .mood-card, .checkin-card { padding: 10px 12px; }
}

@media (max-width: 480px) {
  .detail-meta { gap: 4px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .edit-form .edit-actions { border-color: #2d2d4a; }
  .detail-card {
    background: #1e1e2e; border-color: #2d2d4a;
  }
  .detail-title { color: #e2dee9; }
  .detail-date { color: #94a3b8; }
  .detail-progress .progress-info { color: #94a3b8; }
  .detail-section {
    background: #1e1e2e; border-color: #2d2d4a;
    h4 { color: #e2dee9; }
    p { color: #94a3b8; }
  }
  .subtask-card {
    background: #252540; border-color: #2d2d4a;
    &.done span { color: #64748b; }
  }
  .mood-card {
    background: #252540; border-color: #2d2d4a;
    .mood-mask { color: #a78bfa; }
    .mood-content { color: #94a3b8; }
    .mood-time { color: #64748b; }
  }
  .checkin-card {
    background: #252540; border-color: #2d2d4a;
    .checkin-text { color: #94a3b8; }
  }
  .detail-actions { border-color: #2d2d4a; }
}
</style>

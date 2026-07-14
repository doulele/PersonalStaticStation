<template>
  <div class="db-root">
    <MeetingSelect v-model="meetingId" />
    <template v-if="meetingId">

    <!-- 看板统计 -->
    <div class="db-stats">
      <div class="stat-card todo">
        <span class="stat-num">{{ tasks.filter(t => t.status === 'todo').length }}</span>
        <span class="stat-label">待开始</span>
      </div>
      <div class="stat-card doing">
        <span class="stat-num">{{ tasks.filter(t => t.status === 'doing').length }}</span>
        <span class="stat-label">进行中</span>
      </div>
      <div class="stat-card done">
        <span class="stat-num">{{ tasks.filter(t => t.status === 'done').length }}</span>
        <span class="stat-label">已完成</span>
      </div>
      <div class="stat-card rate">
        <span class="stat-num">{{ completionRate }}%</span>
        <span class="stat-label">完成率</span>
      </div>
    </div>

    <!-- 任务看板列 -->
    <div class="db-board">
      <div class="db-col" v-for="col in columns" :key="col.key">
        <div class="db-col-hd" :style="{ background: col.color }">
          <span>{{ col.label }}</span>
          <el-tag size="small" effect="dark">{{ col.items.length }}</el-tag>
        </div>
        <div class="db-col-body">
          <div v-for="t in col.items" :key="t.id" class="task-card">
            <div class="tc-title">{{ t.title }}</div>
            <div class="tc-meta">
              <span v-if="t.assignee">👤 {{ name(t.assignee) }}</span>
              <span v-if="t.dueDate">📅 {{ t.dueDate }}</span>
            </div>
            <div class="tc-actions">
              <el-dropdown trigger="click" @command="(s) => moveTask(t.id, s)">
                <el-button size="small">移动</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="t.status !== 'todo'" command="todo">移入待开始</el-dropdown-item>
                    <el-dropdown-item v-if="t.status !== 'doing'" command="doing">移入进行中</el-dropdown-item>
                    <el-dropdown-item v-if="t.status !== 'done'" command="done">移入已完成</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-dropdown trigger="click" @command="(uid) => onAssign(t.id, uid)">
                <el-button size="small" link>{{ t.assignee ? '改派' : '指派' }}</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-for="m in members" :key="m.id" :command="m.id">{{ m.name }}</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-date-picker
                v-if="!t.dueDate"
                v-model="editDates[t.id]"
                type="date"
                size="small"
                value-format="YYYY-MM-DD"
                placeholder="截止"
                style="width:120px"
                @change="(d) => onDue(t.id, d)"
              />
              <el-popconfirm title="删除任务？" @confirm="store.dispatch('familyMeeting/removeTask', t.id)">
                <template #reference><el-button size="small" link type="danger">删除</el-button></template>
              </el-popconfirm>
            </div>
          </div>
          <div v-if="col.items.length === 0" class="empty-col">暂无任务</div>
        </div>
      </div>
    </div>

    <!-- 复盘上次决议 -->
    <el-card shadow="never" class="review-card" v-if="prevMeeting">
      <template #header><span>🔄 复盘：上次决议完成率</span></template>
      <p>
        上次会议 "{{ prevMeeting.title }}" 共创建
        <b>{{ tasksForMeeting(prevMeeting.id).length }}</b> 项任务，
        完成 <b>{{ tasksForMeeting(prevMeeting.id).filter(t => t.status === 'done').length }}</b> 项
      </p>
    </el-card>
    </template>
    <el-empty v-else description="请先选择或新建一个会议" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import MeetingSelect from './MeetingSelect.vue'

const store = useStore()
const meetingId = ref(store.getters['familyMeeting/visibleMeetings'][0]?.id || '')
const editDates = ref({})

const tasks = computed(() => store.getters['familyMeeting/tasksForMeeting'](meetingId.value))
const members = computed(() => store.state.familyMeeting.members)

function name(id) { return store.getters['familyMeeting/memberName'](id) }
function tasksForMeeting(mid) { return store.state.familyMeeting.tasks.filter(t => t.meetingId === mid) }

const completionRate = computed(() => {
  const all = tasks.value
  if (!all.length) return 0
  return Math.round((all.filter(t => t.status === 'done').length / all.length) * 100)
})

const columns = computed(() => [
  { key: 'todo', label: '📋 待开始', color: '#e2e8f0', items: tasks.value.filter(t => t.status === 'todo') },
  { key: 'doing', label: '⚡ 进行中', color: '#dbeafe', items: tasks.value.filter(t => t.status === 'doing') },
  { key: 'done', label: '✅ 已完成', color: '#d1fae5', items: tasks.value.filter(t => t.status === 'done') }
])

const prevMeeting = computed(() => {
  const all = store.getters['familyMeeting/visibleMeetings']
    .filter(m => m.id !== meetingId.value && m.status === 'closed')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  return all[0] || null
})

function moveTask(id, status) {
  store.dispatch('familyMeeting/updateTask', { id, patch: { status } })
}
function onAssign(id, uid) {
  store.dispatch('familyMeeting/updateTask', { id, patch: { assignee: uid } })
}
function onDue(id, date) {
  store.dispatch('familyMeeting/updateTask', { id, patch: { dueDate: date } })
  ElMessage.success('截止时间已设定')
}
</script>

<style lang="scss" scoped>
.db-root { display: flex; flex-direction: column; gap: 14px; }
.db-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat-card {
  background: #fff; border-radius: 12px; padding: 16px; text-align: center;
  border: 1px solid #e2e8f0;
  &.todo { border-top: 3px solid #94a3b8; } &.doing { border-top: 3px solid #6366f1; }
  &.done { border-top: 3px solid #10b981; } &.rate { border-top: 3px solid #f59e0b; }
}
.stat-num { font-size: 26px; font-weight: 800; color: #0f172a; }
.stat-label { display: block; font-size: 13px; color: #64748b; margin-top: 4px; }
.db-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.db-col { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; min-height: 160px; }
.db-col-hd {
  padding: 10px 14px; font-weight: 700; color: #0f172a; display: flex; justify-content: space-between; align-items: center;
  font-size: 14px;
}
.db-col-body { padding: 8px; display: flex; flex-direction: column; gap: 8px; }
.task-card {
  background: #f8fafc; border-radius: 10px; padding: 12px; border: 1px solid #e2e8f0;
}
.tc-title { font-weight: 600; color: #0f172a; word-break: break-word; }
.tc-meta { font-size: 12px; color: #64748b; margin-top: 4px; display: flex; gap: 10px; flex-wrap: wrap; }
.tc-actions { display: flex; gap: 4px; align-items: center; margin-top: 8px; flex-wrap: wrap; }
.empty-col { color: #94a3b8; text-align: center; padding: 24px 0; font-size: 13px; }
.review-card { border-radius: 14px; p { color: #475569; } }

// ===== 响应式 =====
@media (max-width: 1024px) {
  .db-stats { grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .stat-card { padding: 12px 8px; }
}

@media (max-width: 768px) {
  .db-stats { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .db-board { grid-template-columns: 1fr; gap: 10px; }
  .db-col { min-height: auto; }
  .db-col-hd { padding: 10px 12px; }
  .stat-num { font-size: 22px; }
  .tc-actions { gap: 6px; }
}

@media (max-width: 480px) {
  .db-root { gap: 10px; }
  .stat-card { padding: 12px; border-radius: 10px; }
  .task-card { padding: 10px; border-radius: 8px; }
}
</style>

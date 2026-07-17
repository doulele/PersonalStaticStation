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
.db-root { display: flex; flex-direction: column; gap: 16px; }
.db-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.stat-card {
  background: #fff; border-radius: 14px; padding: 20px 16px; text-align: center;
  border: 1px solid #e8ecf4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  transition: all 0.25s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
  &.todo { border-top: 3px solid #94a3b8; background: linear-gradient(180deg, #fafbfd 0%, #fff 100%); }
  &.doing { border-top: 3px solid #6366f1; background: linear-gradient(180deg, #fafbff 0%, #fff 100%); }
  &.done { border-top: 3px solid #10b981; background: linear-gradient(180deg, #f0fdf6 0%, #fff 100%); }
  &.rate { border-top: 3px solid #f59e0b; background: linear-gradient(180deg, #fffbeb 0%, #fff 100%); }
}
.stat-num { font-size: 30px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.stat-label { display: block; font-size: 13px; color: #94a3b8; margin-top: 6px; font-weight: 600; }
.db-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.db-col {
  background: #fff; border-radius: 14px; border: 1px solid #e8ecf4;
  overflow: hidden; min-height: 180px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.db-col-hd {
  padding: 12px 16px; font-weight: 700; color: #0f172a;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 14px; letter-spacing: 0.01em;
  :deep(.el-tag) { font-weight: 700; }
}
.db-col-body { padding: 10px; display: flex; flex-direction: column; gap: 10px; }
.task-card {
  background: #f8fafc; border-radius: 12px; padding: 14px; border: 1px solid #f1f5f9;
  transition: all 0.2s;
  &:hover { background: #fff; border-color: #e8ecf4; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
}
.tc-title { font-weight: 700; color: #0f172a; word-break: break-word; font-size: 14px; }
.tc-meta { font-size: 12px; color: #94a3b8; margin-top: 6px; display: flex; gap: 12px; flex-wrap: wrap; }
.tc-actions { display: flex; gap: 6px; align-items: center; margin-top: 10px; flex-wrap: wrap; padding-top: 10px; border-top: 1px solid #f1f5f9; }
.empty-col { color: #94a3b8; text-align: center; padding: 32px 0; font-size: 13px; }
.review-card {
  border-radius: 16px;
  border: 1px solid #e8ecf4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafbfd;
    border-radius: 16px 16px 0 0;
    font-weight: 700; font-size: 14px;
  }
  p { color: #475569; line-height: 1.6; }
}

// ===== 响应式 =====
@media (max-width: 1024px) {
  .db-stats { grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .stat-card { padding: 16px 10px; }
  .stat-num { font-size: 26px; }
}

@media (max-width: 768px) {
  .db-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .db-board { grid-template-columns: 1fr; gap: 12px; }
  .db-col { min-height: auto; }
  .db-col-hd { padding: 12px 14px; }
  .stat-num { font-size: 24px; }
  .tc-actions { gap: 8px; }
}

@media (max-width: 480px) {
  .db-root { gap: 12px; }
  .stat-card { padding: 14px; border-radius: 12px; }
  .task-card { padding: 12px; border-radius: 10px; }
  .stat-num { font-size: 22px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .stat-card {
    background: #1e1e2e; border-color: #2d2d4a;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    &:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
    &.todo { background: linear-gradient(180deg, #212136 0%, #1e1e2e 100%); border-top-color: #64748b; }
    &.doing { background: linear-gradient(180deg, rgba(167,139,250,0.06) 0%, #1e1e2e 100%); border-top-color: #a78bfa; }
    &.done { background: linear-gradient(180deg, rgba(16,185,129,0.06) 0%, #1e1e2e 100%); border-top-color: #10b981; }
    &.rate { background: linear-gradient(180deg, rgba(245,158,11,0.06) 0%, #1e1e2e 100%); border-top-color: #f59e0b; }
  }
  .stat-num { color: #e2dee9; }
  .stat-label { color: #64748b; }
  .db-col { background: #1e1e2e; border-color: #2d2d4a; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
  .db-col-hd { color: #e2dee9; background: #212136 !important; }
  .task-card {
    background: #252540; border-color: #2d2d4a;
    &:hover { background: #2a2a45; border-color: #3a3a5a; box-shadow: 0 2px 10px rgba(0,0,0,0.15); }
  }
  .tc-title { color: #e2dee9; }
  .tc-meta { color: #64748b; }
  .tc-actions { border-top-color: #2d2d4a; }
  .empty-col { color: #64748b; }
  .review-card {
    background: #1e1e2e; border-color: #2d2d4a; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    .el-card__header { border-bottom-color: #252540; background: #212136; }
    p { color: #94a3b8; }
  }
}
</style>

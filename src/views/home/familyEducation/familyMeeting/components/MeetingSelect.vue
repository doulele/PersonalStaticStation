<template>
  <div class="meeting-select">
    <!-- 顶部操作栏 -->
    <div class="ms-toolbar">
      <span class="ms-title">会议列表</span>
      <el-button type="primary" @click="openCreateDialog">+ 新建会议</el-button>
    </div>

    <!-- 会议卡片网格 -->
    <div v-if="visibleMeetings.length" class="ms-grid">
      <div
        v-for="m in visibleMeetings"
        :key="m.id"
        class="ms-card"
        :class="{ 'ms-card--active': modelValue === m.id }"
        @click="onCardClick(m)"
      >
        <!-- 状态色条 -->
        <div class="ms-card-stripe" :class="stripeClass(m.status)"></div>

        <div class="ms-card-body">
          <!-- 标题行 -->
          <div class="ms-card-header">
            <h4 class="ms-card-title">{{ m.title }}</h4>
            <div class="ms-card-badges">
              <el-tag v-if="m.encrypted && !isUnlocked(m.id)" size="small" type="warning" effect="dark">🔒</el-tag>
              <el-tag v-if="m.encrypted && isUnlocked(m.id)" size="small" type="success" effect="dark">🔓</el-tag>
              <el-tag :type="statusTagType(m.status)" size="small" effect="plain">{{ statusText(m.status) }}</el-tag>
            </div>
          </div>

          <!-- 信息行 -->
          <div class="ms-card-info">
            <span class="ms-info-item">
              <el-icon :size="14"><Calendar /></el-icon>
              {{ m.date }}
            </span>
            <span class="ms-info-item">
              <el-icon :size="14"><User /></el-icon>
              {{ (m.participants || []).length }} 人参与
            </span>
          </div>

          <!-- 统计 -->
          <div class="ms-card-stats">
            <span>📋 记录 {{ recordCount(m.id) }}</span>
            <span>📝 议题 {{ agendaCount(m.id) }}</span>
            <span>✅ 任务 {{ taskCount(m.id) }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="ms-card-actions" @click.stop>
          <el-tooltip content="查看详情" placement="top">
            <el-button circle size="small" @click="onDetail(m)">
              <el-icon :size="15"><View /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="编辑会议" placement="top">
            <el-button circle size="small" type="primary" @click="onEdit(m)">
              <el-icon :size="15"><Edit /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="删除会议" placement="top">
            <el-popconfirm
              title="确定删除此会议？相关记录将被一并删除"
              confirm-button-text="删除"
              cancel-button-text="取消"
              confirm-button-type="danger"
              @confirm="onDelete(m.id)"
            >
              <template #reference>
                <el-button circle size="small" type="danger">
                  <el-icon :size="15"><Delete /></el-icon>
                </el-button>
              </template>
            </el-popconfirm>
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="ms-empty">
      <el-icon :size="48"><FolderOpened /></el-icon>
      <p>暂无会议，点击上方按钮创建第一个家庭会议吧</p>
    </div>

    <!-- ==================== 新建/编辑会议弹窗 ==================== -->
    <el-dialog
      v-model="formDialog.visible"
      :title="formDialog.isEdit ? '编辑家庭会议' : '新建家庭会议'"
      width="480px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form label-position="left" class="meeting-form">
        <el-form-item label="会议主题" required>
          <el-input v-model="formDialog.title" placeholder="如：周末家庭例会" maxlength="30" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="formDialog.date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="参与者" required>
          <div class="participant-form">
            <el-radio-group v-model="formDialog.participantMode" class="participant-mode">
              <el-radio value="all">全部家庭成员</el-radio>
              <el-radio value="specific">指定成员</el-radio>
            </el-radio-group>

            <el-select
              v-if="formDialog.participantMode === 'specific'"
              v-model="formDialog.participants"
              multiple
              placeholder="选择参与成员"
              class="participant-select"
            >
              <el-option v-for="m in members" :key="m.id" :value="m.id" :label="m.name" />
            </el-select>
            <span v-else class="participant-hint">
              <el-icon><CircleCheck /></el-icon> 将自动包含当前全部 {{ members.length }} 位家庭成员
            </span>
          </div>
        </el-form-item>
        <el-form-item label="会议状态" v-if="formDialog.isEdit">
          <el-radio-group v-model="formDialog.status">
            <el-radio value="pre">筹备中</el-radio>
            <el-radio value="active">进行中</el-radio>
            <el-radio value="closed">已结束</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="加密会议" class="encrypt-item">
          <div class="encrypt-row">
            <span class="encrypt-tip">开启后进入会议需要输入密码</span>
            <el-switch v-model="formDialog.encrypted" />
          </div>
          <el-input
            v-if="formDialog.encrypted"
            v-model="formDialog.encryptPass"
            type="password"
            show-password
            placeholder="设置查看密码"
            class="encrypt-input"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialog.visible = false">取消</el-button>
        <el-button type="primary" :disabled="!canSubmitForm" @click="onSubmitForm">
          {{ formDialog.isEdit ? '保存修改' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ==================== 详情弹窗 ==================== -->
    <el-dialog
      v-model="detailDialog.visible"
      :title="detailDialog.data?.title || '会议详情'"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
    >
      <template v-if="detailDialog.data">
        <div class="detail-body">
          <!-- 基本信息 -->
          <div class="detail-section">
            <h4>📋 基本信息</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="d-label">状态</span>
                <el-tag :type="statusTagType(detailDialog.data.status)" size="small">
                  {{ statusText(detailDialog.data.status) }}
                </el-tag>
              </div>
              <div class="detail-item">
                <span class="d-label">日期</span>
                <span>{{ detailDialog.data.date }}</span>
              </div>
              <div class="detail-item">
                <span class="d-label">加密</span>
                <span>{{ detailDialog.data.encrypted ? '是' : '否' }}</span>
              </div>
              <div class="detail-item full">
                <span class="d-label">参与者</span>
                <span>{{ detailPtNames }}</span>
              </div>
            </div>
          </div>

          <!-- 数据统计 -->
          <div class="detail-section">
            <h4>📊 数据统计</h4>
            <div class="detail-stats">
              <div class="d-stat-card">
                <strong>{{ detailRecordCount }}</strong>
                <span>会议记录</span>
              </div>
              <div class="d-stat-card">
                <strong>{{ detailAgendaCount }}</strong>
                <span>议题数</span>
              </div>
              <div class="d-stat-card">
                <strong>{{ detailTaskCount }}</strong>
                <span>任务数</span>
              </div>
              <div class="d-stat-card">
                <strong>{{ detailPatchCount }}</strong>
                <span>补丁数</span>
              </div>
            </div>
          </div>

          <!-- 任务完成率 -->
          <div class="detail-section" v-if="detailTaskCount > 0">
            <h4>🎯 任务进度</h4>
            <div class="d-progress">
              <el-progress
                :percentage="detailTaskDoneRate"
                :color="'#6366f1'"
                :stroke-width="8"
              >
                <span class="d-progress-text">{{ detailTaskDone }} / {{ detailTaskCount }} 已完成</span>
              </el-progress>
            </div>
          </div>

          <!-- 最近记录 -->
          <div class="detail-section" v-if="detailRecentRecords.length">
            <h4>📝 最近记录</h4>
            <div class="d-record-list">
              <div v-for="r in detailRecentRecords" :key="r.id" class="d-record-item">
                <span class="d-rec-tag" v-for="t in r.autoTags" :key="t" :style="{ background: tagColor(t), color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', marginRight: '4px' }">{{ t }}</span>
                <span class="d-rec-tag" v-for="t in r.manualTags" :key="'m'+t" :style="{ background: '#6366f1', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', marginRight: '4px' }">{{ t }}</span>
                <span class="d-rec-text">{{ r.content?.slice(0, 80) }}{{ r.content?.length > 80 ? '…' : '' }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="goToMeeting(detailDialog.data?.id)">进入会议室 →</el-button>
      </template>
    </el-dialog>

    <!-- 🔒 加密会议密码验证弹窗 -->
    <el-dialog v-model="unlockDialog.visible" title="🔒 加密会议" width="400px" :close-on-click-modal="false" append-to-body>
      <p style="margin-bottom:12px; color:#475569;">
        会议 "<strong>{{ unlockDialog.title }}</strong>" 已加密，请输入查看密码：
      </p>
      <el-input
        v-model="unlockDialog.password"
        type="password"
        show-password
        placeholder="输入密码"
        @keyup.enter="onUnlock"
      />
      <template #footer>
        <el-button @click="unlockDialog.visible = false">取消</el-button>
        <el-button type="primary" :disabled="!unlockDialog.password" @click="onUnlock">解锁</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { Calendar, User, View, Edit, Delete, FolderOpened, CircleCheck } from '@element-plus/icons-vue'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])

const store = useStore()

// ==================== 表单弹窗（新建/编辑共用） ====================
const formDialog = reactive({
  visible: false,
  isEdit: false,
  editId: '',
  title: '',
  date: new Date().toISOString().slice(0, 10),
  participantMode: 'all',     // 'all' | 'specific'
  participants: [],
  status: 'pre',
  encrypted: false,
  encryptPass: ''
})

// ==================== 详情弹窗 ====================
const detailDialog = reactive({
  visible: false,
  data: null
})

// ==================== 加密解锁弹窗 ====================
const unlockDialog = reactive({
  visible: false,
  title: '',
  targetId: '',
  password: ''
})

// ---- 计算属性 ----
const visibleMeetings = computed(() => store.getters['familyMeeting/visibleMeetings'])
const members = computed(() => store.state.familyMeeting.members)
const allRecords = computed(() => store.state.familyMeeting.records)
const allAgendaItems = computed(() => store.state.familyMeeting.agendaItems)
const allTasks = computed(() => store.state.familyMeeting.tasks)
const allPatches = computed(() => store.state.familyMeeting.patches)

const canSubmitForm = computed(() => {
  if (!formDialog.title) return false
  if (formDialog.participantMode === 'all') return true
  return formDialog.participants.length > 0
})

// 详情页计算
const detailPtNames = computed(() => {
  if (!detailDialog.data) return ''
  return (detailDialog.data.participants || [])
    .map(id => store.getters['familyMeeting/memberName'](id))
    .join('、')
})
const detailRecordCount = computed(() => {
  if (!detailDialog.data) return 0
  return allRecords.value.filter(r => r.meetingId === detailDialog.data.id).length
})
const detailAgendaCount = computed(() => {
  if (!detailDialog.data) return 0
  return allAgendaItems.value.filter(a => a.meetingId === detailDialog.data.id).length
})
const detailTaskCount = computed(() => {
  if (!detailDialog.data) return 0
  return allTasks.value.filter(t => t.meetingId === detailDialog.data.id).length
})
const detailPatchCount = computed(() => {
  if (!detailDialog.data) return 0
  return allPatches.value.filter(p => p.meetingId === detailDialog.data.id).length
})
const detailTaskDone = computed(() => {
  if (!detailDialog.data) return 0
  return allTasks.value.filter(t => t.meetingId === detailDialog.data.id && t.status === 'done').length
})
const detailTaskDoneRate = computed(() => {
  if (detailTaskCount.value === 0) return 0
  return Math.round((detailTaskDone.value / detailTaskCount.value) * 100)
})
const detailRecentRecords = computed(() => {
  if (!detailDialog.data) return []
  return allRecords.value
    .filter(r => r.meetingId === detailDialog.data.id)
    .sort((a, b) => b.seq - a.seq)
    .slice(0, 5)
})

// ---- 工具函数 ----
function isUnlocked(id) {
  return store.state.familyMeeting.unlockedMeetings.includes(id)
}

function statusText(s) {
  return { pre: '筹备中', active: '进行中', closed: '已结束' }[s] || ''
}
function statusTagType(s) {
  return { pre: 'warning', active: 'success', closed: 'info' }[s] || 'info'
}
function stripeClass(s) {
  return { pre: 'stripe-warn', active: 'stripe-success', closed: 'stripe-info' }[s] || 'stripe-info'
}
function tagColor(t) {
  return { 结论: '#10b981', 待定: '#f59e0b', 行动项: '#6366f1', 情感记录: '#94a3b8' }[t] || '#6366f1'
}

function recordCount(meetingId) {
  return allRecords.value.filter(r => r.meetingId === meetingId).length
}
function agendaCount(meetingId) {
  return allAgendaItems.value.filter(a => a.meetingId === meetingId).length
}
function taskCount(meetingId) {
  return allTasks.value.filter(t => t.meetingId === meetingId).length
}

// ---- 卡片点击 ----
function onCardClick(m) {
  if (m.encrypted && !isUnlocked(m.id)) {
    unlockDialog.targetId = m.id
    unlockDialog.title = m.title
    unlockDialog.password = ''
    unlockDialog.visible = true
    return
  }
  emit('update:modelValue', m.id)
}

// ---- 新建 ----
function openCreateDialog() {
  formDialog.isEdit = false
  formDialog.editId = ''
  formDialog.title = ''
  formDialog.date = new Date().toISOString().slice(0, 10)
  formDialog.participantMode = 'all'
  formDialog.participants = []
  formDialog.status = 'pre'
  formDialog.encrypted = false
  formDialog.encryptPass = ''
  formDialog.visible = true
}

// ---- 编辑 ----
function onEdit(m) {
  formDialog.isEdit = true
  formDialog.editId = m.id
  formDialog.title = m.title
  formDialog.date = m.date
  const existingParts = m.participants || []
  const allMemberIds = members.value.map(mb => mb.id)
  const isAllMembers = allMemberIds.length > 0 && allMemberIds.every(id => existingParts.includes(id))
  formDialog.participantMode = isAllMembers ? 'all' : 'specific'
  formDialog.participants = [...existingParts]
  formDialog.status = m.status || 'pre'
  formDialog.encrypted = !!m.encrypted
  formDialog.encryptPass = m.encryptPass || ''
  formDialog.visible = true
}

// ---- 提交表单（新建/编辑统一） ----
async function onSubmitForm() {
  if (!canSubmitForm.value) return
  if (formDialog.encrypted && !formDialog.encryptPass) {
    ElMessage.warning('加密会议需设置查看密码')
    return
  }
  const authUserId = store.state.auth?.user?.userId

  if (!authUserId) {
    ElMessage.error('请先登录后再创建会议')
    return
  }

  // 解析参与者：全部模式 → 包含所有家庭成员；指定模式 → 使用选择的成员
  let parts
  if (formDialog.participantMode === 'all') {
    const allMemberIds = members.value.map(m => m.id)
    parts = allMemberIds.includes(authUserId) ? allMemberIds : [...allMemberIds, authUserId]
  } else {
    parts = formDialog.participants.includes(authUserId)
      ? formDialog.participants
      : [...formDialog.participants, authUserId]
  }

  if (formDialog.isEdit) {
    // 编辑模式
    await store.dispatch('familyMeeting/updateMeeting', {
      id: formDialog.editId,
      patch: {
        title: formDialog.title,
        date: formDialog.date,
        participants: parts,
        status: formDialog.status,
        encrypted: formDialog.encrypted,
        encryptPass: formDialog.encryptPass
      }
    })
    ElMessage.success('会议已更新')
  } else {
    // 新建模式：dispatch 返回 Promise，需要 await
    console.log('[MeetingSelect] 即将创建会议，authUserId=', authUserId, 'participants=', parts)
    const m = await store.dispatch('familyMeeting/createMeeting', {
      title: formDialog.title,
      date: formDialog.date,
      participants: parts,
      encrypted: formDialog.encrypted,
      encryptPass: formDialog.encryptPass
    })
    console.log('[MeetingSelect] 创建会议返回:', m)
    if (m && m.id) {
      emit('update:modelValue', m.id)
      ElMessage.success('会议已创建')
    } else {
      ElMessage.error('会议创建失败，返回数据异常')
    }
  }
  formDialog.visible = false
}

// ---- 详情 ----
function onDetail(m) {
  detailDialog.data = m
  detailDialog.visible = true
}

// ---- 删除 ----
function onDelete(meetingId) {
  // 如果删除的是当前选中的会议，清空选择
  if (props.modelValue === meetingId) {
    emit('update:modelValue', '')
  }
  store.dispatch('familyMeeting/removeMeeting', meetingId)
  ElMessage.success('会议已删除')
}

// ---- 从详情页进入会议室 ----
function goToMeeting(meetingId) {
  detailDialog.visible = false
  if (meetingId) {
    const meeting = store.state.familyMeeting.meetings.find(m => m.id === meetingId)
    if (meeting?.encrypted && !isUnlocked(meetingId)) {
      unlockDialog.targetId = meetingId
      unlockDialog.title = meeting.title
      unlockDialog.password = ''
      unlockDialog.visible = true
      return
    }
    emit('update:modelValue', meetingId)
  }
}

// ---- 解锁加密会议 ----
function onUnlock() {
  if (!unlockDialog.password) return
  const success = store.dispatch('familyMeeting/unlockMeeting', {
    meetingId: unlockDialog.targetId,
    password: unlockDialog.password
  })
  if (success) {
    ElMessage.success('密码正确，会议已解锁')
    unlockDialog.visible = false
    emit('update:modelValue', unlockDialog.targetId)
  } else {
    ElMessage.error('密码错误，请重试')
    unlockDialog.password = ''
  }
}
</script>

<style lang="scss" scoped>
// ==================== 容器 ====================
.meeting-select {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// ==================== 工具栏 ====================
.ms-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.ms-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 0.01em;
}
.all-hint {
  font-size: 12px;
  color: #10b981;
  font-weight: 500;
}

/* ---- 表单项：label 与输入框同行 ---- */
.meeting-form :deep(.el-form-item) {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.meeting-form :deep(.el-form-item__label) {
  flex-shrink: 0;
  width: 92px;
  padding-right: 12px;
  text-align: right;
  line-height: 32px;
  margin-bottom: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meeting-form :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
  line-height: 32px;
}

.participant-form {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 4px;
}
.participant-mode {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-bottom: 0;
}
.participant-select {
  width: 100%;
}
.participant-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #10b981;
  font-weight: 500;
  line-height: 1.4;
  .el-icon { color: currentColor; flex-shrink: 0; }
}
.encrypt-item :deep(.el-form-item__content) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.encrypt-row {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  flex-wrap: wrap;
}
.encrypt-tip {
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
}
.encrypt-input {
  width: 100%;
  max-width: 220px;
}

.ms-toolbar :deep(.el-button--primary) {
  border-radius: 10px;
  font-weight: 600;
  letter-spacing: 0.01em;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
  transition: all 0.25s;
  &:hover { box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35); transform: translateY(-1px); }
}

// ==================== 卡片网格 ====================
.ms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

// ==================== 单张卡片 ====================
.ms-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e8ecf4;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 8px 30px rgba(0,0,0,0.08);
    transform: translateY(-3px);
    border-color: #c7d2fe;
  }

  &.ms-card--active {
    border-color: #6366f1;
    border-width: 2px;
    margin: -1px;
    box-shadow: 0 4px 24px rgba(99, 102, 241, 0.25);
    background: linear-gradient(135deg, #f5f3ff, #eef2ff);
    position: relative;
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04));
      border-radius: 16px;
      pointer-events: none;
      z-index: 0;
    }
    .ms-card-stripe {
      height: 5px;
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
    }
    .ms-card-title {
      color: #4f46e5;
    }
  }
}

// 状态色条
.ms-card-stripe {
  height: 4px;
  flex-shrink: 0;
  &.stripe-warn    { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  &.stripe-success { background: linear-gradient(90deg, #10b981, #34d399); }
  &.stripe-info    { background: linear-gradient(90deg, #94a3b8, #cbd5e1); }
}

// 卡片主体
.ms-card-body {
  padding: 16px 18px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ms-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.ms-card-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
}
.ms-card-badges {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.ms-card-info {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.ms-info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
  .el-icon { flex-shrink: 0; color: #94a3b8; }
}

.ms-card-stats {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #94a3b8;
  padding-top: 6px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

// 操作按钮
.ms-card-actions {
  display: flex;
  gap: 6px;
  padding: 10px 18px 14px;
  justify-content: flex-end;
  border-top: 1px solid #f1f5f9;

  .el-button {
    transition: all 0.2s;
    &:hover { transform: scale(1.1); }
  }
}

// ==================== 空状态 ====================
.ms-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 0;
  color: #94a3b8;
  gap: 16px;
  p { font-size: 14px; }
}

// ==================== 弹窗通用 ====================
:deep(.el-dialog) {
  border-radius: 16px;
  .el-dialog__header { padding: 20px 24px 12px; }
  .el-dialog__title { font-weight: 700; font-size: 18px; color: #0f172a; }
  .el-dialog__body { padding: 8px 24px 20px; }
  .el-dialog__footer { padding: 12px 24px 20px; }
  @media (max-width: 520px) {
    width: 92% !important;
    margin-top: 10vh !important;
    border-radius: 14px;
    .el-dialog__header { padding: 16px 16px 8px; }
    .el-dialog__body { padding: 8px 16px 16px; }
    .el-dialog__footer { padding: 8px 16px 16px; }
  }
}

// ==================== 详情弹窗 ====================
.detail-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.detail-section {
  h4 {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 12px;
  }
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 10px;
  &.full { grid-column: 1 / -1; }
  .d-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.03em; }
  span:not(.d-label) { font-size: 13px; color: #334155; font-weight: 500; }
}
.detail-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.d-stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 12px;
  border: 1px solid #e8ecf4;
  strong { font-size: 22px; color: #6366f1; font-weight: 700; }
  span { font-size: 11px; color: #94a3b8; }
}
.d-progress {
  padding: 4px 0;
}
.d-progress-text {
  font-size: 12px;
  color: #64748b;
}
.d-record-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
}
.d-record-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 8px;
  flex-wrap: wrap;
}
.d-rec-text {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
  word-break: break-word;
}

  // ==================== 暗色模式 PC 横向布局选中态 ====================
  html.dark-mode & {
    @media (min-width: 769px) {
      .ms-card--active {
        border-color: #a78bfa !important;
        border-width: 2px !important;
        margin: 0 !important;
        box-shadow: 0 4px 24px rgba(167, 139, 250, 0.25) !important;
        background: linear-gradient(135deg, #242045, #1e1e3a) !important;
        .ms-card-stripe {
          width: 5px;
          box-shadow: 2px 0 12px rgba(167, 139, 250, 0.4);
        }
        .ms-card-title { color: #c4b5fd; }
      }
    }
  }

  // ==================== 响应式 ====================
@media (max-width: 768px) {
  .ms-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }
  .detail-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

// ==================== PC 端：横向长条卡片 ====================
@media (min-width: 769px) {
  .ms-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ms-card {
    flex-direction: row;
    align-items: stretch;

    &:hover {
      transform: translateX(4px);
    }
  }

  .ms-card--active {
    border-color: #6366f1 !important;
    border-width: 2px !important;
    margin: 0;
    box-shadow: 0 4px 24px rgba(99, 102, 241, 0.25) !important;
    background: linear-gradient(135deg, #f5f3ff, #eef2ff) !important;
    transform: translateX(2px);
    .ms-card-stripe {
      width: 5px;
      box-shadow: 2px 0 10px rgba(99, 102, 241, 0.4);
    }
    .ms-card-title { color: #4f46e5; }
  }

  .ms-card-stripe {
    width: 4px;
    height: auto;
    flex-shrink: 0;
  }

  .ms-card-body {
    flex: 1 1 0;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    padding: 14px 18px;
    min-width: 0;
  }

  .ms-card-header {
    flex: 1 1 180px;
    min-width: 0;
  }

  .ms-card-badges {
    flex-shrink: 0;
  }

  .ms-card-info {
    flex-shrink: 0;
    gap: 12px;
  }

  .ms-card-stats {
    flex-shrink: 0;
    border-top: none;
    padding-top: 0;
    padding-left: 14px;
    border-left: 1px solid #f1f5f9;
  }

  .ms-card-actions {
    flex-shrink: 0;
    border-top: none;
    border-left: 1px solid #f1f5f9;
    padding: 10px 16px;
    align-self: center;
  }
}

@media (max-width: 480px) {
  .ms-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .ms-toolbar {
    flex-direction: column;
    align-items: stretch;
    .el-button { width: 100%; }
  }
  .ms-card-body { padding: 12px 14px; }
  .ms-card-actions { padding: 8px 14px 12px; }
  .participant-mode { gap: 6px 12px; }
  .encrypt-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .encrypt-input { max-width: none; }
  :deep(.el-dialog) {
    width: 92% !important;
  }
  /* 小屏下 label 回到上方 */
  :deep(.el-form-item) {
    flex-direction: column;
    align-items: stretch;
  }
  :deep(.el-form-item__label) {
    width: auto;
    text-align: left;
    padding-right: 0;
    line-height: 1.5;
    margin-bottom: 4px;
    font-size: 13px;
  }
  :deep(.el-radio__label) { font-size: 13px; }
}
</style>

<style lang="scss">
// ===== 暗色模式 =====
html.dark-mode {
  .ms-title { color: #e2dee9; }
  .participant-hint { color: #34d399; }
  .encrypt-tip { color: #64748b; }
  .encrypt-input .el-input__inner {
    background: #1e1e2e;
    border-color: #2d2d4a;
    color: #e2dee9;
  }
  .meeting-form .el-form-item__label { color: #94a3b8; }

  .ms-card {
    background: #1e1e2e;
    border-color: #2d2d4a;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);

    &:hover {
      box-shadow: 0 8px 30px rgba(0,0,0,0.25);
      border-color: #5b4bcf;
    }

    &.ms-card--active {
      border-color: #a78bfa;
      border-width: 2px;
      margin: -1px;
      box-shadow: 0 4px 24px rgba(167, 139, 250, 0.25);
      background: linear-gradient(135deg, #242045, #1e1e3a);
      position: relative;
      &::before {
        content: '';
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: linear-gradient(135deg, rgba(167,139,250,0.08), rgba(139,92,246,0.05));
        border-radius: 16px;
        pointer-events: none;
        z-index: 0;
      }
      .ms-card-title { color: #c4b5fd; }
      .ms-card-stripe { height: 5px; box-shadow: 0 0 12px rgba(167, 139, 250, 0.4); }
    }
  }

  .ms-card-title { color: #e2dee9; }
  .ms-info-item { color: #94a3b8; .el-icon { color: #64748b; } }
  .ms-card-stats { color: #64748b; border-top-color: #252540; border-left-color: #252540; }
  .ms-card-actions { border-top-color: #252540; border-left-color: #252540; }

  .ms-empty { color: #64748b; }

  .el-dialog {
    .el-dialog__title { color: #e2dee9; }
  }

  .detail-section h4 { color: #e2dee9; }
  .detail-item {
    background: #252540;
    .d-label { color: #64748b; }
    span:not(.d-label) { color: #cbd5e1; }
  }
  .d-stat-card {
    background: linear-gradient(135deg, #1e1e2e, #252540);
    border-color: #2d2d4a;
    strong { color: #a78bfa; }
    span { color: #64748b; }
  }
  .d-progress-text { color: #94a3b8; }
  .d-record-list { &::-webkit-scrollbar-thumb { background: #3a3a5a; } }
  .d-record-item {
    background: #252540;
    .d-rec-text { color: #94a3b8; }
  }
}
</style>

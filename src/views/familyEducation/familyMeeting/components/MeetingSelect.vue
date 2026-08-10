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
            <span>记录 {{ recordCount(m.id) }}</span>
            <span>议题 {{ agendaCount(m.id) }}</span>
            <span>任务 {{ taskCount(m.id) }}</span>
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
      width="520px"
      :close-on-click-modal="false"
      append-to-body
      class="detail-dialog"
    >
      <template #header>
        <div class="detail-title-row">
          <span class="detail-title-text">{{ detailDialog.data?.title || '会议详情' }}</span>
          <el-tag
            v-if="detailDialog.data"
            :type="statusTagType(detailDialog.data.status)"
            size="small"
            effect="dark"
          >{{ statusText(detailDialog.data.status) }}</el-tag>
        </div>
      </template>
      <template v-if="detailDialog.data">
        <div class="detail-body">
          <!-- 基本信息卡片 -->
          <div class="detail-section">
            <div class="detail-info-cards">
              <div class="d-info-card">
                <span class="d-info-icon">📅</span>
                <div class="d-info-content">
                  <span class="d-info-label">日期</span>
                  <span class="d-info-value">{{ detailDialog.data.date }}</span>
                </div>
              </div>
              <div class="d-info-card">
                <span class="d-info-icon">👥</span>
                <div class="d-info-content">
                  <span class="d-info-label">参与者</span>
                  <span class="d-info-value">{{ detailPtNames || '所有人' }}</span>
                </div>
              </div>
              <div class="d-info-card" v-if="detailDialog.data.encrypted">
                <span class="d-info-icon">🔒</span>
                <div class="d-info-content">
                  <span class="d-info-label">加密</span>
                  <span class="d-info-value">已加密</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 数据统计 -->
          <div class="detail-section">
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
                <span>决策任务</span>
              </div>
              <div class="d-stat-card">
                <strong>{{ detailConclusionCount }}</strong>
                <span>结论数</span>
              </div>
            </div>
          </div>

          <!-- 任务进度 + 标签摘要 -->
          <div class="detail-section">
            <div class="detail-summary-row">
              <!-- 任务进度 -->
              <div class="d-progress-card" v-if="detailTaskCount > 0">
                <span class="d-progress-label">任务完成进度</span>
                <el-progress
                  :percentage="detailTaskDoneRate"
                  :color="detailTaskDoneRate === 100 ? '#10b981' : '#6366f1'"
                  :stroke-width="10"
                />
                <span class="d-progress-num">{{ detailTaskDone }} / {{ detailTaskCount }}</span>
              </div>
              <!-- 标签分布 -->
              <div class="d-tag-summary" v-if="detailTagSummary.length">
                <span class="d-progress-label">标签分布</span>
                <div class="d-tag-row">
                  <span v-for="t in detailTagSummary" :key="t.name" class="d-tag-chip" :style="{ background: t.color }">
                    {{ t.name }} {{ t.count }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="goToMeeting(detailDialog.data?.id)">进入会议室</el-button>
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
const detailConclusionCount = computed(() => {
  if (!detailDialog.data) return 0
  return allRecords.value.filter(r => r.meetingId === detailDialog.data.id && r.manualTags.includes('结论')).length
})
const detailTagSummary = computed(() => {
  if (!detailDialog.data) return []
  const records = allRecords.value.filter(r => r.meetingId === detailDialog.data.id)
  const counts = { 结论: 0, 待定: 0, 行动项: 0 }
  records.forEach(r => {
    r.manualTags.forEach(t => { if (counts[t] !== undefined) counts[t]++ })
  })
  const colors = { 结论: '#10b981', 待定: '#f59e0b', 行动项: '#6366f1' }
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .map(([name, count]) => ({ name, count, color: colors[name] }))
})
const detailTaskDone = computed(() => {
  if (!detailDialog.data) return 0
  return allTasks.value.filter(t => t.meetingId === detailDialog.data.id && t.status === 'done').length
})
const detailTaskDoneRate = computed(() => {
  if (detailTaskCount.value === 0) return 0
  return Math.round((detailTaskDone.value / detailTaskCount.value) * 100)
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

<style lang="scss" scoped src="./MeetingSelect.scss"></style>

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
    background: #1e1e2e !important;
    border-color: #2d2d4a !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15) !important;

    &:hover {
      box-shadow: 0 8px 30px rgba(0,0,0,0.25) !important;
      border-color: #5b4bcf !important;
    }

    &.ms-card--active {
      border-color: #a78bfa !important;
      border-width: 2px !important;
      margin: -1px !important;
      box-shadow: 0 4px 24px rgba(167, 139, 250, 0.25) !important;
      background: linear-gradient(135deg, #242045, #1e1e3a) !important;
      position: relative;
      &::before {
        content: '';
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: linear-gradient(135deg, rgba(167,139,250,0.08), rgba(139,92,246,0.05)) !important;
        border-radius: 16px;
        pointer-events: none;
        z-index: 0;
      }
      .ms-card-title { color: #c4b5fd !important; }
      .ms-card-stripe { height: 5px; box-shadow: 0 0 12px rgba(167, 139, 250, 0.4) !important; }
      .ms-card-stats { border-top-color: rgba(167,139,250,0.15) !important; color: #94a3b8 !important; }
      .ms-card-actions { border-top-color: rgba(167,139,250,0.15) !important; color: #94a3b8 !important; }
    }
    .ms-card-title { color: #e2dee9 !important; }
    .ms-info-item { color: #64748b !important; .el-icon { color: #64748b !important; } }
    .ms-card-stats { color: #64748b !important; border-top-color: #252540 !important; }
    .ms-card-actions { border-top-color: #252540 !important; }
  }

  .ms-card-title { color: #e2dee9; }
  .ms-info-item { color: #94a3b8; .el-icon { color: #64748b; } }
  .ms-card-stats { color: #64748b; border-top-color: #252540; border-left-color: #252540; }
  .ms-card-actions { border-top-color: #252540; border-left-color: #252540; }

  .ms-empty { color: #64748b; }

  .el-dialog {
    background: #1e1e2e;
    .el-dialog__header { background: #1e1e2e; }
    .el-dialog__title { color: #e2dee9; }
  }

  .detail-section h4 { color: #e2dee9; }
  .d-info-card {
    background: #252540;
    border-color: #2d2d4a;
    .d-info-label { color: #64748b; }
    .d-info-value { color: #cbd5e1; }
  }
  .d-stat-card {
    background: linear-gradient(135deg, #1e1e2e, #252540);
    border-color: #2d2d4a;
    strong { color: #a78bfa; }
    span { color: #64748b; }
  }
  .d-progress-card {
    background: #252540;
    border-color: #2d2d4a;
  }
  .detail-title-text { color: #e2dee9; }
  .d-progress-label { color: #94a3b8; }
  .d-progress-num { color: #94a3b8; }
}
</style>

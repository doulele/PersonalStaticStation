<template>
  <div class="mm-root">
    <div class="mm-header">
      <h2 class="mm-title">家庭成员</h2>
      <p class="mm-desc">{{ family?.name }} · 共 {{ members.length }} 位成员</p>
    </div>

    <!-- 邀请码卡片 -->
    <el-card shadow="never" class="mm-card invite-card">
      <div class="invite-row">
        <div class="invite-info">
          <span class="invite-label">🔗 邀请码</span>
          <div class="invite-val-wrap">
            <code v-if="inviteCode" class="invite-code" @click="copyInvite" :title="'点击复制'">{{ inviteCode }}</code>
            <span v-else class="invite-empty">暂无邀请码</span>
          </div>
        </div>
        <div class="invite-actions">
          <el-button
            v-if="inviteCode"
            size="small"
            plain
            @click="copyInvite"
          >
            <el-icon :size="14"><CopyDocument /></el-icon>复制
          </el-button>
          <el-button
            size="small"
            type="primary"
            :loading="inviteLoading"
            @click="generateInvite"
          >
            {{ inviteCode ? '刷新邀请码' : '生成邀请码' }}
          </el-button>
        </div>
      </div>
      <div class="invite-tip">
        <el-icon :size="14"><InfoFilled /></el-icon>
        分享邀请码给家人，他们可以在注册/登录后通过「加入已有家庭」使用此码加入
      </div>
    </el-card>

    <!-- 成员列表 -->
    <div class="member-list">
      <div
        v-for="m in sortedMembers"
        :key="m.id"
        class="member-card"
        :class="{ 'is-me': m.id === authUserId, 'is-editing': editingId === m.id }"
      >
        <div class="mc-avatar">
          <el-avatar
            :size="48"
            :style="{ background: avatarColor(m) }"
          >{{ m.name.charAt(0) }}</el-avatar>
          <span v-if="m.id === authUserId" class="mc-me-badge">我</span>
        </div>

        <div class="mc-body">
          <div class="mc-top">
            <!-- 编辑模式 -->
            <template v-if="editingId === m.id">
              <el-input
                v-model="editName"
                size="small"
                maxlength="10"
                class="mc-edit-input"
                @keyup.enter="saveEdit(m)"
              />
              <el-select v-model="editRole" size="small" class="mc-edit-role">
                <el-option label="管理员" value="admin" />
                <el-option label="普通成员" value="member" />
              </el-select>
              <el-button size="small" type="primary" @click="saveEdit(m)">保存</el-button>
              <el-button size="small" @click="cancelEdit">取消</el-button>
            </template>
            <!-- 展示模式 -->
            <template v-else>
              <span class="mc-name">{{ m.name }}</span>
              <el-tag
                size="small"
                :type="m.role === 'admin' ? 'warning' : 'info'"
                effect="plain"
                class="mc-role-tag"
              >
                {{ m.role === 'admin' ? '管理员' : '成员' }}
              </el-tag>
            </template>
          </div>
          <div class="mc-stats">
            <span class="mc-stat">
              <el-icon :size="12"><Calendar /></el-icon>
              {{ getMemberMeetingCount(m.id) }} 次会议
            </span>
            <span class="mc-stat">
              <el-icon :size="12"><List /></el-icon>
              {{ getMemberTaskCount(m.id) }} 项任务
            </span>
            <span class="mc-stat">
              <el-icon :size="12"><ChatLineSquare /></el-icon>
              {{ getMemberRecordCount(m.id) }} 条发言
            </span>
          </div>
        </div>

        <div class="mc-actions" v-if="isAdmin && editingId !== m.id">
          <el-button
            v-if="m.id !== authUserId"
            link
            size="small"
            type="primary"
            @click="startEdit(m)"
          >
            <el-icon :size="14"><EditPen /></el-icon>
          </el-button>
          <el-popconfirm
            v-if="m.id !== family?.adminId"
            title="确定要移除该成员吗？该成员将从所有会议的参与者中移除。"
            @confirm="removeMember(m.id)"
          >
            <template #reference>
              <el-button link size="small" type="danger">
                <el-icon :size="14"><Delete /></el-icon>
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <!-- 添加成员 (admin only) -->
    <el-card v-if="isAdmin" shadow="never" class="mm-card add-card">
      <template #header>
        <span class="card-h">➕ 添加新成员</span>
      </template>
      <div class="add-form">
        <el-input
          v-model="newMemberName"
          placeholder="输入成员姓名"
          maxlength="10"
          @keyup.enter="addMember"
          style="flex:1;min-width:140px"
        />
        <el-select v-model="newMemberRole" style="width:120px">
          <el-option label="普通成员" value="member" />
          <el-option label="管理员" value="admin" />
        </el-select>
        <el-button type="primary" :disabled="!newMemberName.trim()" @click="addMember">
          添加成员
        </el-button>
      </div>
    </el-card>

    <!-- 空状态 -->
    <el-empty v-if="members.length === 0" description="暂无家庭成员，请先创建家庭空间" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import {
  CopyDocument, InfoFilled, EditPen, Delete, Calendar, List, ChatLineSquare
} from '@element-plus/icons-vue'

const store = useStore()

// ===== 状态 =====
const inviteLoading = ref(false)
const newMemberName = ref('')
const newMemberRole = ref('member')
const editingId = ref(null)
const editName = ref('')
const editRole = ref('')

// ===== 计算属性 =====
const members = computed(() => store.state.familyMeeting.members)
const family = computed(() => store.state.familyMeeting.family)
const inviteCode = computed(() => family.value?.inviteCode || '')
const authUserId = computed(() => store.state.auth?.user?.userId || store.state.familyMeeting.currentUserId)
const isAdmin = computed(() => {
  const m = members.value.find(x => x.id === authUserId.value)
  return m?.role === 'admin'
})
const meetings = computed(() => store.state.familyMeeting.meetings)
const tasks = computed(() => store.state.familyMeeting.tasks)
const records = computed(() => store.state.familyMeeting.records)

// 成员排序：管理员在前，当前用户在前
const sortedMembers = computed(() => {
  const list = [...members.value]
  return list.sort((a, b) => {
    if (a.id === authUserId.value) return -1
    if (b.id === authUserId.value) return 1
    if (a.role === 'admin' && b.role !== 'admin') return -1
    if (b.role === 'admin' && a.role !== 'admin') return 1
    return 0
  })
})

// ===== 方法 =====
function avatarColor(m) {
  if (m.id === authUserId.value) return 'linear-gradient(135deg, #6366f1, #8b5cf6)'
  return m.role === 'admin' ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'linear-gradient(135deg, #06b6d4, #0ea5e9)'
}

function getMemberMeetingCount(memberId) {
  return meetings.value.filter(m => m.participants.includes(memberId)).length
}

function getMemberTaskCount(memberId) {
  return tasks.value.filter(t => t.assignee === memberId).length
}

function getMemberRecordCount(memberId) {
  return records.value.filter(r => r.speakerId === memberId).length
}

// ===== 邀请码 =====
async function generateInvite() {
  inviteLoading.value = true
  try {
    const res = await store.dispatch('familyMeeting/generateInviteCode')
    if (res.success) {
      ElMessage.success('邀请码已生成')
    } else {
      ElMessage.error(res.error || '生成失败')
    }
  } catch {
    ElMessage.error('生成失败')
  } finally {
    inviteLoading.value = false
  }
}

async function copyInvite() {
  try {
    await navigator.clipboard.writeText(inviteCode.value)
    ElMessage.success('邀请码已复制到剪贴板')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

// ===== 成员操作 =====
function addMember() {
  const name = newMemberName.value.trim()
  if (!name) return
  if (members.value.some(m => m.name === name)) {
    ElMessage.warning('已存在同名成员')
    return
  }
  store.dispatch('familyMeeting/addMember', { name, role: newMemberRole.value })
  newMemberName.value = ''
  ElMessage.success(`已添加成员「${name}」`)
}

function startEdit(m) {
  editingId.value = m.id
  editName.value = m.name
  editRole.value = m.role
}

function cancelEdit() {
  editingId.value = null
  editName.value = ''
  editRole.value = ''
}

function saveEdit(m) {
  const name = editName.value.trim()
  if (!name) {
    ElMessage.warning('姓名不能为空')
    return
  }
  if (members.value.some(x => x.id !== m.id && x.name === name)) {
    ElMessage.warning('已存在同名成员')
    return
  }
  store.dispatch('familyMeeting/updateMember', {
    id: m.id,
    patch: { name, role: editRole.value }
  })
  ElMessage.success(`成员信息已更新`)
  cancelEdit()
}

function removeMember(id) {
  const member = members.value.find(x => x.id === id)
  store.dispatch('familyMeeting/removeMember', id)
  ElMessage.success(`已移除成员「${member?.name || id}」`)
}
</script>

<style lang="scss" scoped>
.mm-root {
  max-width: 720px;
}
.mm-header {
  margin-bottom: 20px;
}
.mm-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 6px;
  letter-spacing: -0.01em;
}
.mm-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

// ===== 邀请码卡片 =====
.mm-card {
  border-radius: 16px;
  margin-bottom: 16px;
  border: 1px solid #e8ecf4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.invite-card {
  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}
.invite-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.invite-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.invite-label {
  font-weight: 700;
  font-size: 14px;
  color: #0f172a;
  white-space: nowrap;
}
.invite-val-wrap {
  min-width: 0;
}
.invite-code {
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 3px;
  color: #4f46e5;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  padding: 2px 14px;
  border-radius: 10px;
  cursor: pointer;
  user-select: all;
  transition: all 0.2s;
  display: inline-block;
  &:hover {
    background: #dde4ff;
    color: #4338ca;
  }
}
.invite-empty {
  font-size: 13px;
  color: #94a3b8;
  font-style: italic;
}
.invite-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.invite-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}

// ===== 成员列表 =====
.member-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}
.member-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e8ecf4;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  &:hover {
    border-color: #c7d2fe;
    box-shadow: 0 4px 12px rgba(99,102,241,0.06);
    transform: translateY(-1px);
  }
  &.is-me {
    background: linear-gradient(135deg, #faf5ff 0%, #eef2ff 100%);
    border-color: #c4b5fd;
  }
  &.is-editing {
    background: #fffbeb;
    border-color: #fbbf24;
  }
}
.mc-avatar {
  position: relative;
  flex-shrink: 0;
  :deep(.el-avatar) {
    font-weight: 700;
    font-size: 20px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.1);
  }
}
.mc-me-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  background: #6366f1;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 8px;
  line-height: 1.4;
  box-shadow: 0 2px 4px rgba(99,102,241,0.3);
}
.mc-body {
  flex: 1;
  min-width: 0;
}
.mc-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.mc-name {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mc-role-tag {
  flex-shrink: 0;
}
.mc-edit-input {
  width: 140px;
}
.mc-edit-role {
  width: 110px;
}
.mc-stats {
  display: flex;
  gap: 16px;
  margin-top: 6px;
  flex-wrap: wrap;
}
.mc-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  .el-icon { color: #a5b4fc; }
}
.mc-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  margin-left: auto;
}

// ===== 添加成员卡片 =====
.add-card {
  :deep(.el-card__header) {
    padding: 14px 20px;
    border-bottom: 1px solid #f1f5f9;
    background: #fafbfd;
    border-radius: 16px 16px 0 0;
  }
  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}
.card-h {
  font-weight: 700;
  font-size: 15px;
  color: #0f172a;
}
.add-form {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

// ===== 响应式 =====
@media (max-width: 768px) {
  .mm-root { max-width: 100%; }
  .mm-title { font-size: 22px; }
  .member-card {
    padding: 14px;
    gap: 12px;
    border-radius: 14px;
  }
  .mc-stats {
    gap: 10px;
  }
  .mc-edit-input { width: 110px; }
  .mc-edit-role { width: 100px; }
  .add-form {
    flex-direction: column;
    .el-select { width: 100% !important; }
    .el-button { width: 100%; }
  }
}

@media (max-width: 480px) {
  .mm-title { font-size: 20px; }
  .mc-name { font-size: 15px; }
  .mc-stats { gap: 8px; }
  .invite-code { font-size: 16px; letter-spacing: 2px; padding: 2px 10px; }
  .invite-label { font-size: 13px; }
  .invite-actions {
    width: 100%;
    .el-button { flex: 1; }
  }
}
</style>

<style lang="scss">
html.dark-mode {
  .mm-title { color: #e2dee9; }
  .mm-desc { color: #94a3b8; }
  .mm-card {
    background: #1e1e2e;
    border-color: #2d2d4a;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
  .invite-card {
    .el-card__body { background: #1e1e2e; }
  }
  .invite-label { color: #e2dee9; }
  .invite-code {
    color: #a78bfa;
    background: linear-gradient(135deg, #1e1a2e, #242040);
    &:hover { background: #2a2448; color: #c4b5fd; }
  }
  .invite-tip { color: #64748b; }
  .member-card {
    background: #252540;
    border-color: #2d2d4a;
    &:hover { border-color: #5b4bcf; box-shadow: 0 4px 12px rgba(139,92,246,0.1); }
    &.is-me {
      background: linear-gradient(135deg, #1e1a2e 0%, #1a1a2e 100%);
      border-color: #5b4bcf;
    }
    &.is-editing { background: #2a2418; border-color: #b45309; }
  }
  .mc-name { color: #e2dee9; }
  .mc-stat { color: #64748b; .el-icon { color: #7c6fcf; } }
  .add-card {
    .el-card__header { background: #212136; border-bottom-color: #252540; }
  }
  .card-h { color: #e2dee9; }
}
</style>

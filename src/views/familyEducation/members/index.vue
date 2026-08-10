<template>
  <div class="family-members-page">
    <!-- 页面头部：返回按钮 + 页面标题介绍 -->
    <div class="page-hero">
      <el-button link class="back-btn" @click="$router.push('/familyEducation')">
        <el-icon><ArrowLeft /></el-icon>返回
      </el-button>
      <div class="hero-content">
        <h1 class="hero-title">家庭空间管理</h1>
        <p class="hero-desc">管理你的家庭空间，邀请家人一起协作</p>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="familiesLoading" class="loading-state">
      <el-icon class="is-loading" :size="28"><Loading /></el-icon>
      <span>加载家庭列表...</span>
    </div>

    <template v-else>
      <!-- 家庭选择器 -->
      <div v-if="myFamilies.length > 0" class="family-selector">
        <div class="family-tabs">
          <div
            v-for="f in myFamilies"
            :key="f.familyId"
            class="family-tab"
            :class="{ 'is-active': family?.id === f.familyId }"
            @click="onSwitchFamily(f)"
          >
            <span class="tab-avatar" :class="f.role === 'admin' ? 'bg-amber' : 'bg-cyan'">
              {{ f.familyName.charAt(0) }}
            </span>
            <span class="tab-name">{{ f.familyName }}</span>
            <span class="tab-role" :class="f.role">
              {{ f.role === 'admin' ? '管理' : '成员' }}
            </span>
            <span v-if="family?.id === f.familyId" class="tab-active-dot"></span>
          </div>
        </div>
      </div>

      <!-- 无家庭时，创建/加入按钮居中展示 -->
      <div v-if="myFamilies.length === 0 && !familiesLoading" class="onboarding-actions">
        <el-button class="onboarding-btn" type="primary" @click="openCreateDialog">
          <el-icon :size="18"><Plus /></el-icon>创建家庭空间
        </el-button>
        <el-button class="onboarding-btn" plain @click="openJoinDialog">
          <el-icon :size="18"><Link /></el-icon>加入已有家庭
        </el-button>
      </div>

      <!-- 标题+操作行 -->
      <div v-if="family" class="section-header">
        <div class="section-header-left">
          <h2 class="section-title">{{ family.name }}</h2>
        </div>
        <div class="section-header-right">
          <el-button class="action-btn action-btn-create" @click="openCreateDialog">
            创建空间
          </el-button>
          <el-button class="action-btn action-btn-join" @click="openJoinDialog">
            加入空间
          </el-button>
        </div>
      </div>

      <!-- 活跃家庭成员管理 -->
      <div v-if="family" class="member-section">
        <!-- 工具栏：统计 + 添加/邀请成员 -->
        <div class="member-toolbar">
          <div class="toolbar-stats">
            <span class="stat-item">
              <el-icon :size="14"><UserFilled /></el-icon>
              {{ members.length }} 位成员
            </span>
            <span class="stat-item">
              <el-icon :size="14"><Calendar /></el-icon>
              {{ totalMeetings }} 次会议
            </span>
          </div>
          <div>
            <el-button
              v-if="isAdmin"
              type="primary"
              class="add-member-btn"
              @click="showAddMemberDialog = true"
            >
              添加新成员
            </el-button>
            <el-button
              v-else
              type="primary"
              class="add-member-btn"
              @click="handleInviteMember"
            >
              邀请新成员
            </el-button>
          </div>
        </div>
        <MemberManagement
          :key="family?.id"
          @memberKicked="onMemberKicked"
          @dissolve="handleDissolve"
          @leave="handleLeave"
        />
      </div>

      <!-- 空状态 -->
      <div v-if="myFamilies.length === 0 && !familiesLoading" class="empty-state">
        <div class="empty-icon">
          <el-icon :size="56"><OfficeBuilding /></el-icon>
        </div>
        <h3 class="empty-title">还没有加入任何家庭空间</h3>
        <p class="empty-desc">创建你自己的家庭空间，或通过邀请码加入家人的家庭</p>
      </div>
    </template>

    <!-- 添加成员对话框 -->
    <el-dialog v-model="showAddMemberDialog" title="添加新成员" width="440px" :close-on-click-modal="false" destroy-on-close>
      <el-form label-position="top" class="dialog-form">
        <el-form-item label="搜索用户">
          <el-select
            v-model="selectedUserId"
            filterable
            remote
            reserve-keyword
            placeholder="输入昵称搜索已注册用户"
            :remote-method="onSearchUsers"
            :loading="searchingUsers"
            style="width:100%"
            popper-class="user-search-dropdown"
            @change="onUserSelected"
          >
            <el-option
              v-for="user in searchResults"
              :key="user.userId"
              :label="user.nickname"
              :value="user.userId"
              :disabled="user._alreadyMember"
            >
              <div class="user-option">
                <span>{{ user.nickname }}</span>
                <el-tag v-if="user._alreadyMember" size="small" type="info" class="already-tag">已加入</el-tag>
              </div>
            </el-option>
            <template #empty>
              <div class="search-empty">
                <el-icon :size="22"><UserFilled /></el-icon>
                <p>没有找到匹配的用户</p>
                <span class="search-empty-tip">提示：不能搜索和添加你自己哦</span>
              </div>
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="newMemberRole" style="width:100%">
            <el-option label="普通成员" value="member" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <!-- 邀请码区域 -->
      <div class="invite-section">
        <div class="invite-divider">
          <span>或者通过邀请码邀请</span>
        </div>
        <div class="invite-code-box">
          <code class="invite-code-big">{{ inviteCode || '暂无邀请码' }}</code>
          <div class="invite-code-actions">
            <el-button v-if="inviteCode" size="small" @click="copyInviteFromDialog">复制邀请码</el-button>
            <el-button v-else size="small" type="primary" :loading="inviteLoading" @click="generateInviteForDialog">生成邀请码</el-button>
            <el-button v-if="inviteCode" size="small" text :loading="inviteLoading" @click="generateInviteForDialog">
              <el-icon :size="14"><Refresh /></el-icon>刷新
            </el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showAddMemberDialog = false">取消</el-button>
        <el-button type="primary" :loading="addingMember" :disabled="!selectedUserId" @click="addMember">
          确认添加
        </el-button>
      </template>
    </el-dialog>

    <!-- 创建家庭对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建新家庭空间" width="440px" :close-on-click-modal="false" destroy-on-close>
      <el-form label-position="top" class="dialog-form">
        <el-form-item label="家庭名称">
          <el-input v-model="createName" placeholder="给你的家庭空间起个名字" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="你的称呼">
          <el-input v-model="createAdminName" :placeholder="authUserNickname" maxlength="10" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" :disabled="!createName.trim() || !createAdminName.trim()" @click="onCreateFamily">
          确认创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 加入家庭对话框 -->
    <el-dialog v-model="showJoinDialog" title="加入已有家庭空间" width="440px" :close-on-click-modal="false" destroy-on-close>
      <el-form label-position="top" class="dialog-form">
        <el-form-item label="邀请码">
          <el-input v-model="joinCode" placeholder="请输入邀请码，如 FAM-ABC123" maxlength="12" class="join-code-input" />
        </el-form-item>
        <el-form-item label="你的称呼">
          <el-input v-model="joinUserName" :placeholder="authUserNickname" maxlength="10" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showJoinDialog = false">取消</el-button>
        <el-button type="primary" :loading="joining" :disabled="!joinCode.trim() || !joinUserName.trim()" @click="onJoinFamily">
          确认加入
        </el-button>
      </template>
    </el-dialog>

    <!-- 解散家庭确认 -->
    <el-dialog v-model="showDissolveConfirm" title="解散家庭空间" width="420px">
      <div class="confirm-body">
        <el-icon :size="40" color="#ef4444"><WarningFilled /></el-icon>
        <p>确定要解散 <strong>「{{ family?.name }}」</strong> 吗？</p>
        <p class="confirm-warning">此操作不可逆，所有会议记录、任务和成员数据将被永久删除。</p>
      </div>
      <template #footer>
        <el-button @click="showDissolveConfirm = false">取消</el-button>
        <el-button type="danger" :loading="dissolving" @click="confirmDissolve">确认解散</el-button>
      </template>
    </el-dialog>

    <!-- 退出家庭确认 -->
    <el-dialog v-model="showLeaveConfirm" title="退出家庭空间" width="420px">
      <div class="confirm-body">
        <p>确定要退出 <strong>「{{ family?.name }}」</strong> 吗？</p>
        <p class="confirm-warning">退出后你将失去对该家庭空间的访问权限。</p>
      </div>
      <template #footer>
        <el-button @click="showLeaveConfirm = false">取消</el-button>
        <el-button type="danger" :loading="leaving" @click="confirmLeave">确认退出</el-button>
      </template>
    </el-dialog>

    <!-- 邀请新成员对话框 -->
    <el-dialog v-model="showInviteDialog" title="邀请新成员" width="440px" :close-on-click-modal="false" destroy-on-close>
      <div class="invite-dialog-body">
        <div class="invite-code-box">
          <span class="invite-label">家庭邀请码</span>
          <code class="invite-code-big">{{ inviteCode || '暂无邀请码' }}</code>
          <el-button
            v-if="inviteCode"
            type="primary"
            size="small"
            class="invite-copy-btn"
            @click="copyInviteFromDialog"
          >复制邀请码</el-button>
          <el-button
            v-else
            type="primary"
            size="small"
            :loading="inviteLoading"
            @click="generateInviteForDialog"
          >生成邀请码</el-button>
        </div>
        <p class="invite-tip">将邀请码分享给家人，对方在"加入家庭空间"中输入即可加入</p>
      </div>
      <template #footer>
        <el-button @click="showInviteDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { searchUsersApi } from '@/api/auth'
import {
  ArrowLeft, Loading, Plus, Link, Refresh, Share,
  UserFilled, Calendar, OfficeBuilding, WarningFilled
} from '@element-plus/icons-vue'
import MemberManagement from '../familyMeeting/components/MemberManagement.vue'

const store = useStore()

// ===== 表单状态 =====
const creating = ref(false)
const joining = ref(false)
const createName = ref('')
const createAdminName = ref('')
const joinCode = ref('')
const joinUserName = ref('')

// ===== 对话框状态 =====
const showCreateDialog = ref(false)
const showJoinDialog = ref(false)
const showDissolveConfirm = ref(false)
const showLeaveConfirm = ref(false)
const showInviteDialog = ref(false)

// ===== 操作状态 =====
const switchingFamily = ref(null)
const dissolving = ref(false)
const leaving = ref(false)
const inviteLoading = ref(false)

// ===== 添加成员 =====
const showAddMemberDialog = ref(false)
const selectedUserId = ref('')
const selectedUserName = ref('')
const newMemberRole = ref('member')
const addingMember = ref(false)
const searchingUsers = ref(false)
const searchResults = ref([])

// 已加入的成员 ID 集合
const memberIdSet = computed(() => new Set(members.value.map(m => m.id)))

function onSearchUsers(keyword) {
  if (!keyword || keyword.trim().length === 0) {
    searchResults.value = []
    return
  }
  searchingUsers.value = true
  searchUsersApi(keyword.trim())
    .then(res => {
      if (res.success) {
        searchResults.value = (res.data || []).map(u => ({
          ...u,
          _alreadyMember: memberIdSet.value.has(u.userId)
        }))
      } else {
        searchResults.value = []
        ElMessage.warning(res.error || '搜索失败')
      }
    })
    .catch(err => {
      searchResults.value = []
      ElMessage.error(err.message || '搜索请求失败')
    })
    .finally(() => {
      searchingUsers.value = false
    })
}

function onUserSelected(userId) {
  const user = searchResults.value.find(u => u.userId === userId)
  if (user) {
    selectedUserName.value = user.nickname
  }
}

// ===== 计算属性 =====
const family = computed(() => store.state.familyMeeting.family)
const members = computed(() => store.state.familyMeeting.members)
const meetings = computed(() => store.state.familyMeeting.meetings)
const myFamilies = computed(() => store.state.familyMeeting.myFamilies)
const familiesLoading = computed(() => store.state.familyMeeting.familiesLoading)
const authUserNickname = computed(() => store.state.auth?.user?.nickname || '你的名字')
const authUserId = computed(() => store.state.auth?.user?.userId)
const totalMeetings = computed(() => meetings.value?.length || 0)
const myRoleInActiveFamily = computed(() => store.getters['familyMeeting/myRoleInActiveFamily'])
const inviteCode = computed(() => family.value?.inviteCode || '')
const isAdmin = computed(() => myRoleInActiveFamily.value === 'admin')

// ===== 生命周期 =====
onMounted(async () => {
  const currentUserId = store.state.auth?.user?.userId
  const storeUserId = store.state.familyMeeting.currentUserId

  // 用户切换检测：如果 store 里的 currentUserId 和当前登录用户不一致，说明是切换用户了
  if (storeUserId && storeUserId !== currentUserId) {
    store.commit('familyMeeting/RESET_ALL')
  }

  if (!store.state.familyMeeting._initialized) {
    await store.dispatch('familyMeeting/initFromBackend')
  } else {
    await store.dispatch('familyMeeting/loadMyFamilies')
  }

  // 安全兜底：如果当前用户没有任何家庭，清空可能残留的旧家庭状态
  if (myFamilies.value.length === 0) {
    store.commit('familyMeeting/RESET_ALL')
  }

  if (family.value && members.value.length > 0) {
    const currentUser = members.value.find(m => m.id === currentUserId)
    if (!currentUser) {
      await store.dispatch('familyMeeting/loadMyFamilies')
      if (myFamilies.value.length > 0) {
        await store.dispatch('familyMeeting/switchFamily', myFamilies.value[0].familyId)
      } else {
        store.commit('familyMeeting/RESET_ALL')
      }
    }
  }

  const nick = authUserNickname.value
  if (nick) {
    createAdminName.value = nick
    joinUserName.value = nick
  }
})

// ===== 对话框打开 =====
function openCreateDialog() {
  createName.value = ''
  createAdminName.value = authUserNickname.value || ''
  showCreateDialog.value = true
}
function openJoinDialog() {
  joinCode.value = ''
  joinUserName.value = authUserNickname.value || ''
  showJoinDialog.value = true
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
  if (!inviteCode.value) return
  try {
    await navigator.clipboard.writeText(inviteCode.value)
    ElMessage.success('邀请码已复制到剪贴板')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

// ===== 邀请新成员 =====
async function handleInviteMember() {
  showInviteDialog.value = true
  // 如果没有邀请码，自动生成一个
  if (!inviteCode.value) {
    inviteLoading.value = true
    try {
      const res = await store.dispatch('familyMeeting/generateInviteCode')
      if (!res.success) {
        ElMessage.error(res.error || '生成邀请码失败')
      }
    } catch {
      ElMessage.error('生成邀请码失败')
    } finally {
      inviteLoading.value = false
    }
  }
}

async function copyInviteFromDialog() {
  if (!inviteCode.value) return
  try {
    await navigator.clipboard.writeText(inviteCode.value)
    ElMessage.success('邀请码已复制到剪贴板')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

async function generateInviteForDialog() {
  // 如果已有邀请码，刷新前确认
  if (inviteCode.value) {
    try {
      await ElMessageBox.confirm('刷新邀请码后，旧的邀请码将失效，确定要刷新吗？', '刷新邀请码', {
        confirmButtonText: '确认刷新',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
  }
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

// ===== 家庭操作 =====
async function onCreateFamily() {
  if (!createName.value.trim() || !createAdminName.value.trim()) {
    ElMessage.warning('请填写完整信息')
    return
  }
  creating.value = true
  try {
    const res = await store.dispatch('familyMeeting/initFamily', {
      name: createName.value.trim(),
      adminName: createAdminName.value.trim()
    })
    if (res.success !== false) {
      ElMessage.success(`家庭空间「${createName.value.trim()}」创建成功`)
      showCreateDialog.value = false
      await store.dispatch('familyMeeting/loadMyFamilies')
      // 自动生成邀请码
      await store.dispatch('familyMeeting/generateInviteCode')
    } else {
      ElMessage.error(res.error || '创建失败')
    }
  } catch (e) {
    ElMessage.error('创建失败: ' + (e.message || '未知错误'))
  } finally {
    creating.value = false
  }
}

async function onJoinFamily() {
  const code = joinCode.value.trim().toUpperCase()
  const name = joinUserName.value.trim() || authUserNickname.value
  if (!code) { ElMessage.warning('请输入邀请码'); return }
  if (!name) { ElMessage.warning('请输入你的称呼'); return }

  joining.value = true
  try {
    const res = await store.dispatch('familyMeeting/joinFamily', { inviteCode: code, userName: name })
    if (res.success) {
      ElMessage.success(res.message || '已加入家庭空间')
      showJoinDialog.value = false
      joinCode.value = ''
      joinUserName.value = ''
      await store.dispatch('familyMeeting/loadMyFamilies')
    } else if (res.needConfirm) {
      const res2 = await store.dispatch('familyMeeting/joinFamily', { inviteCode: code, userName: name, deleteExisting: false })
      if (res2.success) {
        ElMessage.success('已加入家庭空间')
        showJoinDialog.value = false
        joinCode.value = ''
        joinUserName.value = ''
        await store.dispatch('familyMeeting/loadMyFamilies')
      } else {
        ElMessage.error(res2.error || '加入失败')
      }
    } else {
      ElMessage.error(res.error || '加入失败，请检查邀请码')
    }
  } catch {
    ElMessage.error('网络错误，请重试')
  } finally {
    joining.value = false
  }
}

async function onSwitchFamily(f) {
  if (family.value?.id === f.familyId) return
  switchingFamily.value = f.familyId
  try {
    const res = await store.dispatch('familyMeeting/switchFamily', f.familyId)
    if (res.success) {
      ElMessage.success(`已切换到「${f.familyName}」`)
    } else {
      ElMessage.error(res.error || '切换失败')
    }
  } catch {
    ElMessage.error('切换失败')
  } finally {
    switchingFamily.value = null
  }
}

function handleDissolve() {
  showDissolveConfirm.value = true
}

function handleLeave() {
  showLeaveConfirm.value = true
}

async function confirmDissolve() {
  if (!family.value) return
  dissolving.value = true
  try {
    const res = await store.dispatch('familyMeeting/dissolveFamily', family.value.id)
    if (res.success) {
      ElMessage.success(`「${family.value.name}」已解散`)
      showDissolveConfirm.value = false
    } else {
      ElMessage.error(res.error || '解散失败')
    }
  } catch {
    ElMessage.error('解散失败')
  } finally {
    dissolving.value = false
  }
}

async function confirmLeave() {
  if (!family.value) return
  leaving.value = true
  try {
    const res = await store.dispatch('familyMeeting/leaveSpecificFamily', family.value.id)
    if (res.success) {
      ElMessage.success(`已退出「${family.value.name}」`)
      showLeaveConfirm.value = false
    } else {
      ElMessage.error(res.error || '退出失败')
    }
  } catch {
    ElMessage.error('退出失败')
  } finally {
    leaving.value = false
  }
}

function addMember() {
  const userId = selectedUserId.value
  const name = selectedUserName.value
  if (!userId || !name) return
  if (memberIdSet.value.has(userId)) {
    ElMessage.warning('该用户已是家庭成员')
    return
  }
  addingMember.value = true
  store.dispatch('familyMeeting/addMember', { userId, name, role: newMemberRole.value })
  ElMessage.success(`已添加「${name}」`)
  selectedUserId.value = ''
  selectedUserName.value = ''
  newMemberRole.value = 'member'
  showAddMemberDialog.value = false
  addingMember.value = false
}

function onMemberKicked() {
  store.dispatch('familyMeeting/loadMyFamilies')
}
</script>

<style lang="scss" scoped src="./index.scss"></style>

<style lang="scss">
// ==================== 移动端弹框宽度适配（非 scoped，覆盖 element-plus 内联 width） ====================
@media (max-width: 768px) {
  .el-overlay-dialog .el-dialog {
    width: 90% !important;
    max-width: 90vw;
  }
}
@media (max-width: 480px) {
  .el-overlay-dialog .el-dialog {
    width: 92% !important;
    max-width: 92vw;
  }
}

html.dark-mode {
  .family-members-page {
    .top-bar { border-bottom-color: #2d2d4a; }
    .top-title { color: #e2dee9; }
    .top-subtitle { color: #64748b; }
    .back-btn { color: #94a3b8; &:hover { color: #a78bfa; } }

    .family-tab {
      background: #1e1e2e; border-color: #2d2d4a;
      &:hover { border-color: #5b4bcf; box-shadow: 0 2px 12px rgba(139,92,246,0.12); }
      &.is-active { background: #1e1a2e; border-color: #7c6fcf; }
    }
    .tab-name { color: #e2dee9; }
    .tab-role {
      &.admin  { color: #fbbf24; background: #2a2418; }
      &.member { color: #22d3ee; background: #162832; }
    }

    .action-btn {
      color: #fff;
    }
    .action-btn-create {
      background: linear-gradient(135deg, #5b4bcf, #7c6fcf);
      &:hover { box-shadow: 0 6px 20px rgba(139,92,246,0.35); }
    }
    .action-btn-join {
      background: linear-gradient(135deg, #0891b2, #06b6d4);
      &:hover { box-shadow: 0 6px 20px rgba(6,182,212,0.3); }
    }

    .invite-code-inline {
      color: #a78bfa;
      background: linear-gradient(135deg, #1e1a2e, #242040);
      &:hover { background: #2a2448; color: #c4b5fd; }
    }
    .invite-refresh-btn { color: #64748b; &:hover { color: #a78bfa; } }
    .invite-generate-btn { color: #a78bfa; &:hover { color: #c4b5fd; background: #1e1a2e; } }
    .stat-item { color: #94a3b8; .el-icon { color: #7c6fcf; } }

    .empty-icon { background: linear-gradient(135deg, #1e1a2e, #242040); color: #a78bfa; }
    .empty-title { color: #e2dee9; }
    .empty-desc  { color: #64748b; }
    .dialog-form .el-form-item__label { color: #e2dee9; }
    .confirm-body p { color: #cbd5e1; strong { color: #e2dee9; } }
    .confirm-warning { color: #64748b !important; }
  }
}
</style>

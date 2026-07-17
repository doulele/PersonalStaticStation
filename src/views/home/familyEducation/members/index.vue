<template>
  <div class="family-members-page">
    <!-- 页面头部：返回按钮 + 页面标题介绍 -->
    <div class="page-hero">
      <el-button link class="back-btn" @click="$router.push('/home/familyEducation')">
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

<style lang="scss" scoped>
// ==================== 页面容器 ====================
.family-members-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px 80px;
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

// ==================== 页面头部（返回按钮 + 标题介绍） ====================
.page-hero {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}
.back-btn {
  font-size: 14px;
  color: #64748b;
  flex-shrink: 0;
  margin-top: 0;
  &:hover { color: #6366f1; }
}
.hero-content {
  padding: 24px 0 12px 0;
  text-align: center;
  flex: 1;
}
.hero-title {
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
  margin: 0;
  line-height: 1.2;
  background: linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-desc {
  font-size: 15px;
  color: #64748b;
  margin: 10px 0 0;
  font-weight: 400;
  letter-spacing: 0.02em;
}

// ==================== 区域标题行（标题+邀请码 | 创建+加入） ====================
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.section-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  white-space: nowrap;
}
.section-header-right {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

// ==================== 弹窗内邀请码区域 ====================
.invite-section {
  margin-top: 4px;
}
.invite-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e2e8f0;
  }
  span {
    font-size: 12px;
    color: #94a3b8;
    white-space: nowrap;
  }
}
.invite-code-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: #f5f3ff;
  border: 1px solid #e9d5ff;
  border-radius: 10px;
}
.invite-code-big {
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 3px;
  color: #4f46e5;
  background: #fff;
  padding: 6px 20px;
  border-radius: 8px;
  user-select: all;
}
.invite-code-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

// ==================== 加载状态 ====================
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px 20px;
  color: #94a3b8;
  font-size: 14px;
}

// ==================== 家庭选择器 ====================
.family-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}
.family-tabs {
  display: flex;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
  min-width: 0;
}
.family-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px 8px 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  user-select: none;

  &:hover {
    border-color: #c7d2fe;
    box-shadow: 0 2px 8px rgba(99,102,241,0.08);
    transform: translateY(-1px);
  }
  &.is-active {
    background: #eef2ff;
    border-color: #818cf8;
    box-shadow: 0 2px 8px rgba(99,102,241,0.1);
  }
}
.tab-avatar {
  width: 32px; height: 32px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700; color: #fff;
  flex-shrink: 0;
  &.bg-amber { background: linear-gradient(135deg, #f59e0b, #f97316); }
  &.bg-cyan  { background: linear-gradient(135deg, #06b6d4, #0ea5e9); }
}
.tab-name {
  font-size: 14px; font-weight: 600; color: #0f172a;
  white-space: nowrap; max-width: 120px;
  overflow: hidden; text-overflow: ellipsis;
}
.tab-role {
  font-size: 11px; font-weight: 600;
  padding: 1px 7px; border-radius: 6px; flex-shrink: 0;
  &.admin  { color: #b45309; background: #fef3c7; }
  &.member { color: #0e7490; background: #cffafe; }
}
.tab-active-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.4);
  flex-shrink: 0;
}
.action-btn {
  padding: 8px 16px;
  font-size: 13px; font-weight: 600;
  border-radius: 8px;
  border: none;
  color: #fff;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  .el-icon { margin-right: 4px; }
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99,102,241,0.3);
  }
  &:active { transform: translateY(0); }
}
.action-btn-create {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  &:hover {
    box-shadow: 0 6px 20px rgba(99,102,241,0.4);
  }
}
.action-btn-join {
  background: linear-gradient(135deg, #06b6d4, #0ea5e9);
  color: #fff;
  &:hover {
    box-shadow: 0 6px 20px rgba(6,182,212,0.35);
  }
}

// ==================== 成员管理区域 ====================
.member-section {
  margin-top: 8px;
}

// 工具栏：添加成员 + 统计
.member-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px 16px;
}
.add-member-btn {
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  padding: 7px 16px;
}
.toolbar-stats {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}
.stat-item {
  display: flex; align-items: center; gap: 5px;
  font-size: 13px; color: #64748b;
  .el-icon { color: #a5b4fc; }
}

// ==================== 空状态 ====================
.empty-state {
  text-align: center; padding: 80px 20px;
}
.empty-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 96px; height: 96px; border-radius: 24px;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  color: #818cf8; margin-bottom: 24px;
}
.empty-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
.empty-desc  { font-size: 14px; color: #94a3b8; margin: 0 0 28px; }

// ==================== 无家庭时操作按钮（居中） ====================
.onboarding-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 40px 20px 0;
}
.onboarding-btn {
  padding: 16px 36px;
  font-size: 16px;
  font-weight: 700;
  border-radius: 14px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  .el-icon { margin-right: 8px; }
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.25); }
  &:active { transform: translateY(0); }
}

// ==================== 对话框公用 ====================
.dialog-form :deep(.el-form-item__label) { font-weight: 600; color: #0f172a; }

// 用户搜索下拉选项
.user-option {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%;
}
.already-tag { font-size: 11px; margin-left: 8px; flex-shrink: 0; }

// 搜索无结果提示
.search-empty {
  text-align: center; padding: 20px 16px; color: #94a3b8;
  .el-icon { margin-bottom: 8px; color: #cbd5e1; }
  p { margin: 0; font-size: 14px; font-weight: 500; }
}
.search-empty-tip { font-size: 12px; display: block; margin-top: 6px; }

.join-code-input :deep(.el-input__inner) {
  text-transform: uppercase; letter-spacing: 2px;
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-weight: 700; text-align: center;
}
.confirm-body {
  text-align: center; padding: 12px 0;
  p { margin: 16px 0 0; font-size: 15px; color: #334155; strong { color: #0f172a; } }
}
.confirm-warning { font-size: 13px !important; color: #94a3b8 !important; margin-top: 8px !important; }

// ==================== 邀请新成员弹窗 ====================
.invite-dialog-body {
  text-align: center;
  padding: 12px 0;
}
.invite-label {
  font-size: 13px;
  color: #7c3aed;
  font-weight: 600;
}
.invite-copy-btn {
  font-weight: 600;
}
.invite-tip {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 12px;
}

// ==================== 响应式 ====================
@media (max-width: 768px) {
  .family-members-page { padding: 12px 16px 80px; width: 100%; overflow-x: hidden; }
  .top-bar { padding-bottom: 14px; align-items: flex-start; }
  .top-title { font-size: 22px; }
  .top-subtitle { font-size: 12px; }
  .family-selector { flex-direction: column; align-items: stretch; gap: 12px; max-width: 100%; overflow: hidden; }
  .family-tabs {
    overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; max-width: 100%;
    -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar { height: 4px; }
    &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
  }
  .family-tab { flex-shrink: 0; }
  .selector-actions {
    .action-btn { flex: 1; justify-content: center; }
  }
  .onboarding-actions { flex-direction: row; flex-wrap: nowrap; }
  .onboarding-btn { flex: 1; justify-content: center; padding: 14px 12px; font-size: 14px; }
  .onboarding-btn .el-icon { display: none; }
  .member-toolbar { flex-wrap: wrap; gap: 8px; }
  .add-member-btn { flex: 1; justify-content: center; }
  .toolbar-stats { justify-content: center; }
}

@media (max-width: 480px) {
  .family-members-page { padding: 10px 12px 80px; width: 100%; overflow-x: hidden; }
  .top-title { font-size: 20px; }
}
</style>

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

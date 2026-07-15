<template>
  <div class="mmp-page">
    <div class="mmp-back">
      <el-button link @click="$router.push('/home/familyEducation')">
        <el-icon><ArrowLeft /></el-icon>返回家庭/教育
      </el-button>
    </div>

    <h1 class="mmp-title">👨‍👩‍👧‍👦 家庭成员管理</h1>
    <p class="mmp-subtitle">统一的家庭空间管理中心 — 家庭会议和愿望清单共享同一家庭</p>

    <!-- 已有家庭：显示成员管理 -->
    <template v-if="hasFamily">
      <MemberManagement />

      <!-- 🔀 加入新家庭空间 -->
      <div class="mmp-action-card">
        <div class="action-header">
          <span class="action-icon">🔀</span>
          <div>
            <h3 class="action-title">加入新家庭空间</h3>
            <p class="action-desc">离开当前家庭，通过邀请码加入另一个家庭空间</p>
          </div>
        </div>
        <el-form label-position="top" class="action-form" @submit.prevent="onJoinOtherFamily">
          <el-form-item label="邀请码">
            <el-input
              v-model="joinOtherCode"
              placeholder="如：FAM-ABC123"
              maxlength="12"
              class="join-code-input"
            />
          </el-form-item>
          <el-form-item label="你的称呼">
            <el-input
              v-model="joinOtherName"
              :placeholder="authUserNickname"
              maxlength="10"
            />
          </el-form-item>
          <el-button
            type="warning"
            :loading="joinOtherLoading"
            :disabled="!joinOtherCode"
            @click="onJoinOtherFamily"
          >加入新家庭空间</el-button>
        </el-form>
      </div>

      <!-- 🚪 退出当前家庭空间 -->
      <div class="mmp-action-card mmp-action-card--danger">
        <div class="action-header">
          <span class="action-icon">🚪</span>
          <div>
            <h3 class="action-title">退出当前家庭空间</h3>
            <p class="action-desc">退出后你将无法看到当前家庭的数据</p>
          </div>
        </div>
        <el-popconfirm
          title="确定要退出当前家庭空间吗？退出后你将无法看到该家庭的会议和数据。"
          confirm-button-text="确定退出"
          cancel-button-text="取消"
          confirm-button-type="danger"
          @confirm="onLeaveFamily"
        >
          <template #reference>
            <el-button type="danger" :loading="leaveLoading" style="width:100%">退出家庭空间</el-button>
          </template>
        </el-popconfirm>
      </div>
    </template>

    <!-- 无家庭：创建/加入 -->
    <div v-else class="mmp-setup">
      <div class="setup-card">
        <div class="setup-illustration">🏠</div>
        <h2 class="setup-title">创建或加入家庭空间</h2>
        <p class="setup-desc">
          创建一个家庭空间，与家人一起组织会议、追踪愿望、分享心情。<br />
          已有邀请码？直接加入家人的家庭空间。
        </p>

        <el-tabs v-model="activeTab" class="setup-tabs">
          <el-tab-pane label="创建家庭" name="create">
            <div class="setup-form">
              <el-input
                v-model="familyName"
                placeholder="给你的家庭起个名字"
                maxlength="20"
                show-word-limit
                size="large"
              />
              <el-input
                v-model="adminName"
                :placeholder="authUserNickname"
                maxlength="10"
                size="large"
              />
              <el-button
                type="primary"
                size="large"
                :loading="creating"
                @click="handleCreate"
                :disabled="!familyName.trim() || !adminName.trim()"
              >
                创建家庭空间
              </el-button>
            </div>
          </el-tab-pane>

          <el-tab-pane label="加入家庭" name="join">
            <div class="setup-form">
              <el-input
                v-model="inviteCode"
                placeholder="输入邀请码（如：FAM-ABC123）"
                maxlength="12"
                size="large"
                style="text-transform: uppercase; letter-spacing: 2px; text-align: center; font-family: monospace; font-weight: 700;"
              />
              <el-input
                v-model="joinName"
                :placeholder="authUserNickname"
                maxlength="10"
                size="large"
              />
              <el-button
                type="success"
                size="large"
                :loading="joining"
                @click="handleJoin"
                :disabled="!inviteCode.trim() || !joinName.trim()"
              >
                加入家庭
              </el-button>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import MemberManagement from '../familyMeeting/components/MemberManagement.vue'

const store = useStore()

// 家庭状态（共享空间）
const hasFamily = computed(() => store.getters['familyMeeting/hasFamily'])
const currentUser = computed(() => store.getters['familyMeeting/currentUser'])

// 创建/加入表单
const activeTab = ref('create')
const familyName = ref('')
const adminName = ref('')
const inviteCode = ref('')
const joinName = ref('')
const creating = ref(false)
const joining = ref(false)

// 🔀 加入新家庭空间
const joinOtherCode = ref('')
const joinOtherName = ref('')
const joinOtherLoading = ref(false)
const family = computed(() => store.state.familyMeeting.family)
const authUserNickname = computed(() => store.state.auth?.user?.nickname || '你的名字')

// 🚪 退出家庭空间
const leaveLoading = ref(false)

async function handleCreate() {
  creating.value = true
  try {
    store.dispatch('familyMeeting/initFamily', {
      name: familyName.value.trim(),
      adminName: adminName.value.trim()
    })
    ElMessage.success('家庭空间创建成功！')
    setTimeout(() => { location.reload() }, 500)
  } catch (e) {
    ElMessage.error('创建失败')
  } finally {
    creating.value = false
  }
}

async function handleJoin() {
  joining.value = true
  try {
    const res = await store.dispatch('familyMeeting/joinFamily', {
      inviteCode: inviteCode.value.trim().toUpperCase(),
      userName: joinName.value.trim()
    })
    if (res.success) {
      ElMessage.success(res.message || '成功加入家庭！')
      setTimeout(() => { location.reload() }, 500)
    } else if (res.needConfirm) {
      const { ElMessageBox } = await import('element-plus')
      try {
        await ElMessageBox.confirm(
          `你当前已有家庭空间「${res.existingFamily?.name || '未知'}」。<br/>加入新空间将离开当前空间，确定继续吗？`,
          '⚠️ 更换家庭空间',
          { confirmButtonText: '确定加入', cancelButtonText: '取消', type: 'warning', dangerouslyUseHTMLString: true }
        )
        const res2 = await store.dispatch('familyMeeting/joinFamily', {
          inviteCode: inviteCode.value.trim().toUpperCase(),
          userName: joinName.value.trim(),
          deleteExisting: true
        })
        if (res2.success) {
          ElMessage.success('成功加入新家庭！')
          setTimeout(() => { location.reload() }, 500)
        } else {
          ElMessage.error(res2.error || '加入失败')
        }
      } catch { /* 用户取消 */ }
    } else {
      ElMessage.error(res.error || '加入失败，请检查邀请码')
    }
  } catch (e) {
    ElMessage.error('网络错误，请重试')
  } finally {
    joining.value = false
  }
}

// 初始化
onMounted(async () => {
  if (!store.state.familyMeeting._initialized) {
    await store.dispatch('familyMeeting/initFromBackend')
  }
  // 🔒 安全校验：如果存在家庭数据，但当前用户不在成员列表中，说明数据异常
  if (hasFamily.value && !currentUser.value) {
    console.warn('[members] 数据异常：当前用户不在家庭成员列表中，强制重置')
    await store.dispatch('familyMeeting/resetAll')
    location.reload()
  }
  // 默认填写当前用户昵称
  const nick = authUserNickname.value
  if (nick) {
    adminName.value = nick
    joinName.value = nick
    joinOtherName.value = nick
  }
})

// 🔀 加入新家庭空间
async function onJoinOtherFamily() {
  const code = joinOtherCode.value.trim().toUpperCase()
  const name = joinOtherName.value.trim() || authUserNickname.value
  if (!code) { ElMessage.warning('请输入邀请码'); return }
  if (!name) { ElMessage.warning('请输入你的称呼'); return }

  const currentFamilyName = family.value?.name || '当前'
  try {
    await ElMessageBox.confirm(
      `你当前已有家庭空间「${currentFamilyName}」。<br/>加入新空间将<b>删除当前空间及所有数据</b>（会议、议题、记录、任务等），<br/>确定要继续吗？`,
      '⚠️ 更换家庭空间',
      { confirmButtonText: '确定加入新空间', cancelButtonText: '取消', type: 'warning', dangerouslyUseHTMLString: true }
    )
  } catch { return }

  joinOtherLoading.value = true
  try {
    const res = await store.dispatch('familyMeeting/joinFamily', {
      inviteCode: code,
      userName: name,
      deleteExisting: true
    })
    if (res.success) {
      ElMessage.success(res.message || '成功加入新家庭！')
      joinOtherCode.value = ''
      joinOtherName.value = ''
      setTimeout(() => { location.reload() }, 800)
    } else {
      ElMessage.error(res.error || '加入失败，请检查邀请码')
    }
  } catch (e) {
    ElMessage.error('网络错误，请重试')
  } finally {
    joinOtherLoading.value = false
  }
}

// 🚪 退出家庭空间
async function onLeaveFamily() {
  leaveLoading.value = true
  try {
    const res = await store.dispatch('familyMeeting/leaveFamily')
    if (res.success) {
      ElMessage.success(res.message || '已退出家庭空间')
      setTimeout(() => { location.reload() }, 800)
    } else {
      ElMessage.error(res.error || '退出失败')
    }
  } catch (e) {
    ElMessage.error('退出失败，请重试')
  } finally {
    leaveLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.mmp-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  animation: fadeIn 0.3s ease-out;
  padding-bottom: 80px;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.mmp-back {
  margin-bottom: 8px;
}

// ===== 标题 =====
.mmp-title {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
}
.mmp-subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin: 0 0 24px;
}

// ===== 创建/加入 卡片 =====
.mmp-setup {
  display: flex;
  justify-content: center;
  padding-top: 24px;
}
.setup-card {
  text-align: center;
  max-width: 460px;
  width: 100%;
  background: #fff;
  border-radius: 20px;
  padding: 44px 36px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}
.setup-illustration { font-size: 56px; margin-bottom: 12px; }
.setup-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
}
.setup-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 28px;
}
.setup-tabs { width: 100%; }
.setup-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 14px;
}

// ===== 加入/退出 操作卡片 =====
.mmp-action-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  margin-top: 20px;
  border: 1px solid #e8ecf4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  transition: all 0.25s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
  &--danger {
    border-color: #fecaca;
    background: linear-gradient(135deg, #fff5f5, #fef2f2);
    .action-icon { color: #ef4444; }
  }
}
.action-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 18px;
}
.action-icon {
  font-size: 28px;
  flex-shrink: 0;
  line-height: 1.2;
}
.action-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
}
.action-desc {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
}
.action-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.join-code-input :deep(.el-input__inner) {
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
  font-family: monospace;
  font-weight: 700;
}

// ====== 响应式 ======
@media (max-width: 768px) {
  .mmp-page { padding: 16px; max-width: 100%; }
  .mmp-title { font-size: 22px; }
  .setup-card { padding: 28px 18px; border-radius: 16px; }
  .setup-illustration { font-size: 40px; }
  .setup-title { font-size: 17px; }
  .setup-desc { font-size: 13px; margin-bottom: 20px; }
}

@media (max-width: 480px) {
  .mmp-page { padding: 12px 12px 80px; }
  .mmp-title { font-size: 20px; }
  .setup-card { padding: 24px 14px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .mmp-title { color: #e2dee9; }
  .mmp-subtitle { color: #94a3b8; }
  .setup-card { background: #1e1e2e; box-shadow: 0 4px 24px rgba(0,0,0,0.3); }
  .setup-title { color: #e2dee9; }
  .setup-desc { color: #94a3b8; }
  .mmp-action-card {
    background: #1e1e2e;
    border-color: #2d2d4a;
    &--danger {
      border-color: #7f1d1d;
      background: linear-gradient(135deg, #2d1d1d, #1e1e2e);
    }
    .action-title { color: #e2dee9; }
    .action-desc { color: #94a3b8; }
  }
}
</style>

<template>
  <div class="setup-root">
    <div class="setup-card">
      <div class="setup-head">
        <el-icon :size="40" color="#6366f1"><ChatDotRound /></el-icon>
        <h1>搭建你的家庭会议空间</h1>
        <p>私密、安全、支持语音转写。数据与你的账号绑定，仅自己可见。</p>
      </div>

      <el-steps v-if="setupMode === 'create'" :active="step" align-center finish-status="success" class="setup-steps">
        <el-step title="创建家庭空间" />
        <el-step title="添加家庭成员" />
        <el-step title="进入会议室" />
      </el-steps>

      <!-- 步骤1：创建家庭 或 加入已有家庭 -->
      <div v-if="step === 0" class="setup-body">
        <!-- 模式选择 -->
        <el-radio-group v-model="setupMode" class="mode-select" size="large">
          <el-radio-button value="create">🏠 创建新家庭</el-radio-button>
          <el-radio-button value="join">🔗 加入已有家庭</el-radio-button>
        </el-radio-group>

        <!-- 创建新家庭 -->
        <template v-if="setupMode === 'create'">
          <el-form label-position="top">
            <el-form-item label="家庭空间名称">
              <el-input v-model="familyName" placeholder="如：野生小猿园一家" maxlength="20" />
            </el-form-item>
            <el-form-item label="你的称呼（家庭管理员）">
              <el-input v-model="adminName" :placeholder="authUserNickname || '如：爸爸'" maxlength="10" />
            </el-form-item>
          </el-form>
          <el-button
            type="primary"
            size="large"
            round
            :disabled="!familyName || !adminName"
            @click="onCreateFamily"
          >创建空间</el-button>
        </template>

        <!-- 加入已有家庭 -->
        <template v-else>
          <el-form label-position="top">
            <el-form-item label="邀请码">
              <el-input
                v-model="joinCode"
                placeholder="如：FAM-ABC123"
                maxlength="12"
                style="text-transform: uppercase; letter-spacing: 2px; font-family: monospace; font-weight: 700; font-size: 16px;"
                @input="joinError = ''"
              />
            </el-form-item>
            <el-form-item label="你的称呼">
              <el-input v-model="joinName" :placeholder="authUserNickname || '如：妈妈'" maxlength="10" @input="joinError = ''" />
            </el-form-item>
          </el-form>
          <p v-if="joinError" style="color:#ef4444; font-size:13px; margin-top:-8px;">{{ joinError }}</p>
          <el-button
            type="primary"
            size="large"
            round
            :loading="joining"
            :disabled="!joinCode || !joinName"
            @click="onJoinFamily"
          >加入家庭</el-button>
        </template>
      </div>

      <!-- 步骤2：添加成员 -->
      <div v-else-if="step === 1" class="setup-body">
        <div class="member-add">
          <el-input v-model="newMember" placeholder="输入成员姓名（完全实名制）" maxlength="10"
            @keyup.enter="onAddMember" style="flex:1" />
          <el-select v-model="newRole" placeholder="角色" style="width:120px">
            <el-option label="普通成员" value="member" />
            <el-option label="管理员" value="admin" />
          </el-select>
          <el-button type="primary" @click="onAddMember">添加</el-button>
        </div>

        <div class="member-list">
          <div v-for="m in members" :key="m.id" class="member-item">
            <el-avatar :style="{ background: m.role === 'admin' ? '#f59e0b' : '#6366f1' }">
              {{ m.name.charAt(0) }}
            </el-avatar>
            <span class="member-name">{{ m.name }}</span>
            <el-tag size="small" :type="m.role === 'admin' ? 'warning' : 'info'" effect="plain">
              {{ m.role === 'admin' ? '管理员' : '成员' }}
            </el-tag>
            <el-button
              v-if="m.id !== family.adminId"
              link type="danger" size="small" @click="onRemove(m.id)"
            >移除</el-button>
          </div>
        </div>
        <el-button type="success" size="large" round @click="step = 2">完成，进入会议室</el-button>
      </div>

      <!-- 步骤3：完成 -->
      <div v-else class="setup-body setup-done">
        <el-result icon="success" title="家庭会议空间已就绪" sub-title="点击下方按钮开始你的第一次家庭会议">
        </el-result>
        <router-link to="/home/familyEducation/familyMeeting">
          <el-button type="primary" size="large" round>进入会议室</el-button>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { ChatDotRound } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useStore()
const step = ref(0)
const familyName = ref('')

const authUserNickname = computed(() => store.state.auth?.user?.nickname || '')
// 🔒 管理员名称默认使用站点用户昵称
const adminName = ref(authUserNickname.value || '')
const newMember = ref('')
const newRole = ref('member')

// 🔗 加入家庭
const setupMode = ref('create')
const joinCode = ref('')
const joinName = ref(authUserNickname.value || '')
const joinError = ref('')
const joining = ref(false)

const members = computed(() => store.state.familyMeeting.members)
const family = computed(() => store.state.familyMeeting.family)
const hasFamily = computed(() => store.getters['familyMeeting/hasFamily'])

function onCreateFamily() {
  store.dispatch('familyMeeting/initFamily', {
    name: familyName.value.trim(),
    adminName: adminName.value.trim() || authUserNickname.value || '管理员'
  })
  step.value = 1
}

async function onJoinFamily() {
  const code = joinCode.value.trim().toUpperCase()
  const name = joinName.value.trim()
  if (!code || !name) return

  // 🔒 如果用户已有家庭空间，先提醒
  if (hasFamily.value && family.value) {
    try {
      await ElMessageBox.confirm(
        `你当前已有家庭空间「${family.value.name}」。<br/>加入新空间将<b>删除当前空间及所有数据</b>（会议、议题、记录、任务等），<br/>确定要继续吗？`,
        '⚠️ 更换家庭空间',
        {
          confirmButtonText: '确定加入新空间',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )
      // 用户确认 → 执行带 deleteExisting 的加入
      await doJoin(code, name, true)
    } catch {
      // 用户取消
    }
    return
  }

  await doJoin(code, name, false)
}

async function doJoin(code, name, deleteExisting) {
  joining.value = true
  joinError.value = ''
  try {
    const res = await store.dispatch('familyMeeting/joinFamily', {
      inviteCode: code,
      userName: name,
      deleteExisting
    })
    if (res.success) {
      ElMessage.success(res.message || '成功加入家庭！')
      step.value = 3  // 直接跳到完成页
    } else if (res.needConfirm) {
      // 后端也返回了冲突信息（双重保险）
      try {
        await ElMessageBox.confirm(
          `你当前已有家庭空间「${res.existingFamily?.name || '未知'}」。<br/>加入新空间将<b>删除当前空间及所有数据</b>，<br/>确定要继续吗？`,
          '⚠️ 更换家庭空间',
          {
            confirmButtonText: '确定加入新空间',
            cancelButtonText: '取消',
            type: 'warning',
            dangerouslyUseHTMLString: true
          }
        )
        await doJoin(code, name, true)
      } catch {
        // 用户取消
      }
    } else {
      joinError.value = res.error || '加入失败，请检查邀请码'
    }
  } catch (e) {
    joinError.value = '网络错误，请重试'
  } finally {
    joining.value = false
  }
}

function onAddMember() {
  const name = newMember.value.trim()
  if (!name) return
  if (members.value.some(m => m.name === name)) {
    ElMessage.warning('已存在同名成员')
    return
  }
  store.dispatch('familyMeeting/addMember', { name, role: newRole.value })
  newMember.value = ''
}

function onRemove(id) {
  store.dispatch('familyMeeting/removeMember', id)
}
</script>

<style lang="scss" scoped>
.setup-root {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #eef2ff 0%, #faf5ff 40%, #f0f9ff 100%);
  padding: 24px;
}
.mode-select {
  justify-content: center;
  :deep(.el-radio-button__inner) { padding: 12px 24px; font-size: 15px; font-weight: 600; }
}
.setup-card {
  width: 100%;
  max-width: 560px;
  background: #fff;
  border-radius: 24px;
  padding: 40px;
  box-shadow:
    0 4px 6px -1px rgba(0,0,0,0.02),
    0 10px 30px -5px rgba(99, 102, 241, 0.08),
    0 20px 60px -10px rgba(99, 102, 241, 0.15);
  animation: cardIn 0.5s cubic-bezier(0.22, 0.61, 0.36, 1);
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.setup-head {
  text-align: center;
  margin-bottom: 28px;
  .el-icon {
    filter: drop-shadow(0 4px 8px rgba(99, 102, 241, 0.3));
  }
  h1 { font-size: 24px; color: #0f172a; margin: 16px 0 10px; font-weight: 700; letter-spacing: -0.01em; }
  p { font-size: 14px; color: #64748b; line-height: 1.7; max-width: 380px; margin: 0 auto; }
}
.setup-steps {
  margin-bottom: 32px;
  :deep(.el-step__title) { font-size: 13px; font-weight: 600; }
  :deep(.el-step__head.is-finish) { color: #6366f1; border-color: #6366f1; }
  :deep(.el-step__head.is-process) { color: #6366f1; border-color: #6366f1; }
}
.setup-body {
  display: flex; flex-direction: column; gap: 18px;
  animation: fadeSlide 0.35s ease-out;
}
@keyframes fadeSlide {
  from { opacity: 0; transform: translateX(12px); }
  to { opacity: 1; transform: translateX(0); }
}
.member-add { display: flex; gap: 10px; flex-wrap: wrap; }
.member-list {
  display: flex; flex-direction: column; gap: 8px;
  max-height: 280px; overflow-y: auto;
  padding-right: 4px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
}
.member-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: #f8fafc; border-radius: 14px;
  border: 1px solid #f1f5f9;
  transition: all 0.2s;
  &:hover { background: #fff; border-color: #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  .member-name { font-weight: 600; color: #0f172a; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; }
  :deep(.el-avatar) { box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
}
.setup-done { align-items: center; padding: 20px 0; }

@media (max-width: 600px) {
  .setup-root { padding: 12px; align-items: flex-start; padding-top: 40px; }
  .setup-card { padding: 28px 22px; border-radius: 20px; max-width: 100%; }
  .setup-head {
    margin-bottom: 24px;
    h1 { font-size: 20px; }
    p { font-size: 13px; }
  }
  .setup-steps {
    margin-bottom: 24px;
    :deep(.el-step__title) { font-size: 11px; }
  }
  .member-add {
    flex-direction: column;
    .el-button { width: 100%; }
    .el-select { width: 100% !important; }
  }
}

@media (max-width: 480px) {
  .setup-card { padding: 24px 18px; border-radius: 16px; }
  .setup-head h1 { font-size: 18px; }
  .member-item { padding: 10px 12px; gap: 8px; border-radius: 12px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .setup-root { background: linear-gradient(160deg, #1a1a2e 0%, #1e1a2e 40%, #1a1a2a 100%); }
  .setup-card {
    background: #1e1e2e;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3), 0 10px 30px -5px rgba(99,102,241,0.1), 0 20px 60px -10px rgba(0,0,0,0.4);
  }
  .setup-head {
    .el-icon { filter: drop-shadow(0 4px 8px rgba(167,139,250,0.3)); }
    h1 { color: #e2dee9; }
    p { color: #94a3b8; }
  }
  .member-list { &::-webkit-scrollbar-thumb { background: #3a3a5a; } }
  .member-item {
    background: #252540; border-color: #2d2d4a;
    &:hover { background: #2a2a45; border-color: #3a3a5a; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .member-name { color: #e2dee9; }
  }
}
</style>

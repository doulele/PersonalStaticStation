<template>
  <div class="setup-root">
    <div class="setup-card">
      <div class="setup-head">
        <el-icon :size="40" color="#6366f1"><ChatDotRound /></el-icon>
        <h1>搭建你的家庭会议空间</h1>
        <p>私密、安全、支持语音转写。数据与你的账号绑定，仅自己可见。</p>
      </div>

      <el-steps :active="step" align-center finish-status="success" class="setup-steps">
        <el-step title="创建家庭空间" />
        <el-step title="添加家庭成员" />
        <el-step title="进入会议室" />
      </el-steps>

      <!-- 步骤1：创建家庭 -->
      <div v-if="step === 0" class="setup-body">
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
import { ElMessage } from 'element-plus'

const store = useStore()
const step = ref(0)
const familyName = ref('')

const authUserNickname = computed(() => store.state.auth?.user?.nickname || '')
// 🔒 管理员名称默认使用站点用户昵称
const adminName = ref(authUserNickname.value || '')
const newMember = ref('')
const newRole = ref('member')

const members = computed(() => store.state.familyMeeting.members)
const family = computed(() => store.state.familyMeeting.family)

function onCreateFamily() {
  store.dispatch('familyMeeting/initFamily', {
    name: familyName.value.trim(),
    adminName: adminName.value.trim() || authUserNickname.value || '管理员'
  })
  step.value = 1
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
  background: linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%);
  padding: 24px;
}
.setup-card {
  width: 100%;
  max-width: 560px;
  background: #fff;
  border-radius: 20px;
  padding: 36px;
  box-shadow: 0 20px 60px rgba(99, 102, 241, 0.12);
}
.setup-head {
  text-align: center;
  margin-bottom: 24px;
  h1 { font-size: 22px; color: #0f172a; margin: 12px 0 8px; }
  p { font-size: 14px; color: #64748b; line-height: 1.6; }
}
.setup-steps { margin-bottom: 28px;
  :deep(.el-step__title) { font-size: 13px; }
}
.setup-body { display: flex; flex-direction: column; gap: 16px; }
.member-add { display: flex; gap: 10px; flex-wrap: wrap; }
.member-list { display: flex; flex-direction: column; gap: 10px; max-height: 280px; overflow-y: auto; }
.member-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; background: #f8fafc; border-radius: 12px;
  .member-name { font-weight: 600; color: #0f172a; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
.setup-done { align-items: center; }

@media (max-width: 600px) {
  .setup-root { padding: 12px; align-items: flex-start; }
  .setup-card { padding: 24px 20px; border-radius: 16px; max-width: 100%; }
  .setup-head {
    margin-bottom: 20px;
    h1 { font-size: 20px; }
    p { font-size: 13px; }
  }
  .setup-steps {
    margin-bottom: 20px;
    :deep(.el-step__title) { font-size: 11px; }
  }
  .member-add {
    flex-direction: column;
    .el-button { width: 100%; }
    .el-select { width: 100% !important; }
  }
}

@media (max-width: 480px) {
  .setup-card { padding: 20px 16px; border-radius: 14px; }
  .setup-head h1 { font-size: 18px; }
  .member-item { padding: 8px 10px; gap: 8px; border-radius: 10px; }
}
</style>

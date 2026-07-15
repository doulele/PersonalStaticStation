<template>
  <div class="family-setup">
    <div class="setup-card">
      <div class="setup-illustration">🏡✨</div>
      <h2 class="setup-title">欢迎来到愿望清单 & 家庭树洞</h2>
      <p class="setup-desc">
        在这里，你可以和家人一起追逐愿望、分享心情。<br />
        创建或加入一个家庭来开始吧！
      </p>

      <el-tabs v-model="activeTab" class="setup-tabs">
        <!-- 创建家庭 -->
        <el-tab-pane label="创建家庭" name="create">
          <div class="setup-form">
            <el-input
              v-model="familyName"
              placeholder="给你的家庭起个名字"
              maxlength="20"
              show-word-limit
              size="large"
            />
            <el-button
              type="primary"
              size="large"
              :loading="creating"
              @click="handleCreate"
              :disabled="!familyName.trim()"
              class="setup-submit"
            >
              创建家庭空间
            </el-button>
          </div>
        </el-tab-pane>

        <!-- 加入家庭 -->
        <el-tab-pane label="加入家庭" name="join">
          <div class="setup-form">
            <el-input
              v-model="inviteCode"
              placeholder="输入6位邀请码"
              maxlength="6"
              size="large"
              style="text-transform: uppercase; letter-spacing: 4px; text-align: center;"
            />
            <el-button
              type="success"
              size="large"
              :loading="joining"
              @click="handleJoin"
              :disabled="inviteCode.length < 6"
              class="setup-submit"
            >
              加入家庭
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 邀请码展示 -->
      <div v-if="currentInviteCode" class="invite-code-display">
        <p class="invite-label">分享邀请码给家人：</p>
        <div class="invite-code-box">
          <span class="invite-code-text">{{ currentInviteCode }}</span>
          <el-button size="small" text @click="copyInviteCode">复制</el-button>
        </div>
        <p class="invite-hint">你的家人输入这个邀请码即可加入你的家庭</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['created', 'joined'])
const store = useStore()

const activeTab = ref('create')
const familyName = ref('')
const inviteCode = ref('')
const creating = ref(false)
const joining = ref(false)
const currentInviteCode = ref('')

async function handleCreate() {
  if (!familyName.value.trim()) return
  creating.value = true
  try {
    const res = await store.dispatch('wishTreeHole/createFamily', familyName.value.trim())
    if (res.success) {
      ElMessage.success('家庭创建成功！')
      currentInviteCode.value = store.state.wishTreeHole.family?.inviteCode
      emit('created')
    } else {
      ElMessage.error(res.error || '创建失败')
    }
  } catch (e) {
    ElMessage.error('创建失败，请稍后再试')
  } finally {
    creating.value = false
  }
}

async function handleJoin() {
  if (inviteCode.value.length < 6) return
  joining.value = true
  try {
    const res = await store.dispatch('wishTreeHole/joinFamily', inviteCode.value.toUpperCase())
    if (res.success) {
      ElMessage.success('加入家庭成功！')
      emit('joined')
    } else {
      ElMessage.error(res.error || '加入失败')
    }
  } catch (e) {
    ElMessage.error('加入失败，请稍后再试')
  } finally {
    joining.value = false
  }
}

function copyInviteCode() {
  navigator.clipboard.writeText(currentInviteCode.value)
  ElMessage.success('已复制邀请码')
}
</script>

<style lang="scss" scoped>
.family-setup {
  display: flex;
  justify-content: center;
  padding-top: 60px;
}

.setup-card {
  text-align: center;
  max-width: 440px;
  width: 100%;
  background: #fff;
  border-radius: 20px;
  padding: 48px 40px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}

.setup-illustration { font-size: 64px; margin-bottom: 16px; }

.setup-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
}

.setup-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 32px;
}

.setup-tabs {
  width: 100%;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 16px;
}

.setup-submit {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.invite-code-display {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
}

.invite-label {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 12px;
}

.invite-code-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 20px;
  background: #f8fafc;
  border: 2px dashed #6366f1;
  border-radius: 12px;
}

.invite-code-text {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 6px;
  color: #6366f1;
  font-family: monospace;
}

.invite-hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 8px 0 0;
}

@media (max-width: 768px) {
  .family-setup { padding-top: 20px; }
  .setup-card {
    padding: 28px 18px;
    border-radius: 16px;
    margin: 0 8px;
  }
  .setup-illustration { font-size: 48px; }
  .setup-title { font-size: 18px; }
  .setup-desc { font-size: 13px; margin-bottom: 24px; }
  .invite-code-text { font-size: 24px; letter-spacing: 4px; }
}

@media (max-width: 480px) {
  .setup-card { padding: 24px 14px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .setup-card { background: #1e1e2e; box-shadow: 0 4px 24px rgba(0,0,0,0.3); }
  .setup-title { color: #e2dee9; }
  .setup-desc { color: #94a3b8; }
  .invite-label { color: #94a3b8; }
  .invite-code-box { background: #252540; border-color: #a78bfa; }
  .invite-code-text { color: #a78bfa; }
  .invite-hint { color: #64748b; }
  .invite-code-display { border-color: #2d2d4a; }
}
</style>

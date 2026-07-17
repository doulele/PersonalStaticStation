<template>
  <div class="profile-page">
    <div class="profile-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2>个人设置</h2>
        <p class="page-subtitle">管理您的账户信息和密码</p>
      </div>

      <!-- 用户信息卡片 -->
      <div class="info-card">
        <div class="card-title">
          <el-icon><UserFilled /></el-icon>
          <span>账户信息</span>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">用户ID</span>
            <span class="info-value mono">{{ currentUser?.userId || '-' }}</span>
          </div>
          <div class="info-item" v-if="currentUser?.username">
            <span class="info-label">用户名</span>
            <span class="info-value">{{ currentUser.username }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">邮箱</span>
            <span class="info-value">{{ currentUser?.email || '未绑定' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">注册时间</span>
            <span class="info-value">{{ formatDate(currentUser?.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">最后登录</span>
            <span class="info-value">{{ formatDate(currentUser?.lastLogin) }}</span>
          </div>
        </div>
      </div>

      <!-- 修改昵称 -->
      <div class="section-card">
        <div class="card-title">
          <el-icon><Edit /></el-icon>
          <span>修改昵称</span>
        </div>
        <el-form
          ref="nicknameFormRef"
          :model="nicknameForm"
          :rules="nicknameRules"
          label-position="top"
          @submit.prevent="handleUpdateNickname"
        >
          <el-form-item label="昵称" prop="nickname">
            <el-input
              v-model="nicknameForm.nickname"
              placeholder="请输入新昵称（2-20个字符）"
              maxlength="20"
              show-word-limit
              clearable
              @keyup.enter="handleUpdateNickname"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :loading="nicknameLoading"
              :disabled="nicknameForm.nickname === currentUser?.nickname"
              @click="handleUpdateNickname"
            >
              {{ nicknameLoading ? '保存中...' : '保存昵称' }}
            </el-button>
            <el-button @click="resetNickname">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 修改密码 -->
      <div class="section-card">
        <div class="card-title">
          <el-icon><Lock /></el-icon>
          <span>修改密码</span>
        </div>
        <el-form
          ref="passwordFormRef"
          :model="passwordForm"
          :rules="passwordRules"
          label-position="top"
          @submit.prevent="handleChangePassword"
        >
          <el-form-item label="旧密码" prop="oldPassword">
            <el-input
              v-model="passwordForm.oldPassword"
              type="password"
              placeholder="请输入旧密码"
              show-password
            />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="至少6位新密码"
              show-password
            />
          </el-form-item>
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              show-password
              @keyup.enter="handleChangePassword"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :loading="passwordLoading"
              @click="handleChangePassword"
            >
              {{ passwordLoading ? '修改中...' : '修改密码' }}
            </el-button>
            <el-button @click="resetPassword">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 成功/错误提示 -->
      <transition name="fade">
        <div v-if="successMsg" class="success-msg">
          <el-icon><CircleCheckFilled /></el-icon>
          {{ successMsg }}
        </div>
      </transition>
      <transition name="fade">
        <div v-if="errorMsg" class="error-msg">
          <el-icon><WarningFilled /></el-icon>
          {{ errorMsg }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { UserFilled, Edit, Lock, CircleCheckFilled, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { checkNicknameApi } from '@/api/auth'

const store = useStore()

const currentUser = computed(() => store.getters['auth/currentUser'])

// ==================== 提示消息 ====================
const successMsg = ref('')
const errorMsg = ref('')
let msgTimer = null

function showSuccess(msg) {
  successMsg.value = msg
  errorMsg.value = ''
  clearTimeout(msgTimer)
  msgTimer = setTimeout(() => { successMsg.value = '' }, 4000)
}

function showError(msg) {
  errorMsg.value = msg
  successMsg.value = ''
  clearTimeout(msgTimer)
  msgTimer = setTimeout(() => { errorMsg.value = '' }, 6000)
}

// ==================== 修改昵称 ====================
const nicknameFormRef = ref(null)
const nicknameLoading = ref(false)
const nicknameForm = reactive({
  nickname: ''
})

const nicknameRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度应为2-20个字符', trigger: 'blur' },
    { validator: validateNicknameUnique, trigger: 'blur' }
  ]
}

const validateNicknameUnique = async (rule, value, callback) => {
  const trimmed = (value || '').trim()
  if (!trimmed || trimmed.length < 2) { callback(); return }
  // 如果昵称和当前一样，跳过检查
  if (trimmed === (currentUser.value?.nickname || '')) { callback(); return }
  try {
    const res = await checkNicknameApi(trimmed)
    if (res.success && !res.available) {
      callback(new Error('该昵称已被其他用户使用'))
    } else {
      callback()
    }
  } catch { callback() }
}

onMounted(() => {
  nicknameForm.nickname = currentUser.value?.nickname || ''
})

watch(currentUser, (user) => {
  if (user) {
    nicknameForm.nickname = user.nickname || ''
  }
})

function resetNickname() {
  nicknameForm.nickname = currentUser.value?.nickname || ''
  nicknameFormRef.value?.clearValidate()
}

async function handleUpdateNickname() {
  const valid = await nicknameFormRef.value.validate().catch(() => false)
  if (!valid) return

  nicknameLoading.value = true
  try {
    const result = await store.dispatch('auth/updateProfile', {
      nickname: nicknameForm.nickname.trim()
    })
    if (result.success) {
      ElMessage.success('昵称修改成功')
      showSuccess('昵称修改成功')
    } else {
      showError(result.error || '修改昵称失败')
    }
  } finally {
    nicknameLoading.value = false
  }
}

// ==================== 修改密码 ====================
const passwordFormRef = ref(null)
const passwordLoading = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的新密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

function resetPassword() {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordFormRef.value?.clearValidate()
}

async function handleChangePassword() {
  const valid = await passwordFormRef.value.validate().catch(() => false)
  if (!valid) return

  passwordLoading.value = true
  try {
    const result = await store.dispatch('auth/changePassword', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    if (result.success) {
      ElMessage.success('密码修改成功，请牢记新密码')
      showSuccess('密码修改成功')
      resetPassword()
    } else {
      showError(result.error || '修改密码失败')
    }
  } finally {
    passwordLoading.value = false
  }
}

// ==================== 工具函数 ====================
function formatDate(dateStr) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day} ${h}:${min}`
  } catch {
    return dateStr
  }
}
</script>

<style lang="scss" scoped>
.profile-page {
  max-width: 680px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}

.profile-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// ==================== 页面标题 ====================
.page-header {
  margin-bottom: 4px;

  h2 {
    font-size: 24px;
    font-weight: 600;
    color: var(--heading-color, #1f2937);
    margin: 0 0 6px;
  }

  .page-subtitle {
    font-size: 14px;
    color: var(--text-secondary, #6b7280);
    margin: 0;
  }
}

// ==================== 卡片通用 ====================
.info-card,
.section-card {
  background: var(--bg-white, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  padding: 24px;
  transition: background 0.3s, border-color 0.3s;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--heading-color, #1f2937);
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);

  .el-icon {
    color: var(--color-primary, #409eff);
    font-size: 18px;
  }
}

// ==================== 信息网格 ====================
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--text-secondary, #909399);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 15px;
  color: var(--text-primary, #374151);
  word-break: break-all;

  &.mono {
    font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
    font-size: 13px;
  }
}

// ==================== 表单样式 ====================
.section-card :deep(.el-form-item) {
  margin-bottom: 18px;

  .el-form-item__label {
    color: var(--text-primary, #374151);
    font-weight: 500;
  }
}

.section-card :deep(.el-input) {
  max-width: 400px;
}

.section-card :deep(.el-button) {
  border-radius: 8px;
}

// ==================== 消息提示 ====================
.success-msg,
.error-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.success-msg {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
}

.error-msg {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// ==================== 移动端适配 ====================
@media (max-width: 768px) {
  .profile-page {
    padding: 16px 12px 40px;
  }

  .profile-container {
    gap: 16px;
  }

  .page-header {
    h2 {
      font-size: 20px;
    }
    .page-subtitle {
      font-size: 13px;
    }
  }

  .info-card,
  .section-card {
    padding: 18px;
  }

  .card-title {
    font-size: 15px;
    margin-bottom: 16px;
    padding-bottom: 12px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .info-value {
    font-size: 14px;
  }

  .section-card :deep(.el-input) {
    max-width: 100%;
  }

  .section-card :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  .section-card :deep(.el-button) {
    width: 100%;
    margin-left: 0 !important;
    margin-bottom: 8px;
  }

  .section-card :deep(.el-form-item:last-child .el-form-item__content) {
    flex-wrap: wrap;
  }
}

@media (max-width: 400px) {
  .profile-page {
    padding: 12px 8px 36px;
  }

  .info-card,
  .section-card {
    padding: 14px;
    border-radius: 10px;
  }

  .page-header {
    h2 { font-size: 18px; }
  }

  .card-title {
    font-size: 14px;
  }

  .info-value {
    font-size: 13px;
  }
}
</style>

<style lang="scss">
/* ===== 深色模式（非 scoped） ===== */
html.dark-mode .profile-page {
  --el-input-bg-color: #1a1a2e;
  --el-fill-color-blank: #1a1a2e;
  --el-border-color: #2d2d4a;
  --el-text-color-regular: #94a3b8;
  --el-text-color-primary: #e2dee9;

  .info-card,
  .section-card {
    background: #1e1e2e;
    border-color: #2d2d4a;
  }

  .card-title {
    color: #e2dee9;
    border-bottom-color: #2d2d4a;

    .el-icon {
      color: #a78bfa;
    }
  }

  .page-header h2 {
    color: #e2dee9;
  }

  .page-subtitle {
    color: #64748b;
  }

  .info-label {
    color: #64748b;
  }

  .info-value {
    color: #cbd5e1;
  }

  .el-form-item__label {
    color: #94a3b8 !important;
  }

  .el-input__wrapper {
    background-color: #1a1a2e !important;
    box-shadow: 0 0 0 1px #2d2d4a inset !important;

    &:hover {
      box-shadow: 0 0 0 1px #4c3d8f inset !important;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px #7c3aed inset !important;
    }
  }

  .el-input__inner {
    color: #e2dee9 !important;

    &::placeholder {
      color: #4b5563;
    }
  }

  .el-input__suffix,
  .el-input__prefix,
  .el-input__clear {
    color: #6b7280;
  }

  .el-input__password {
    color: #6b7280;
    &:hover { color: #94a3b8; }
  }

  .el-button--default {
    --el-button-bg-color: #252540;
    --el-button-border-color: #2d2d4a;
    --el-button-text-color: #94a3b8;
    --el-button-hover-bg-color: #2d2d4a;
    --el-button-hover-border-color: #4c3d8f;
    --el-button-hover-text-color: #e2dee9;
  }

  .success-msg {
    background: rgba(22, 163, 74, 0.1);
    border-color: rgba(22, 163, 74, 0.2);
  }

  .error-msg {
    background: rgba(220, 38, 38, 0.1);
    border-color: rgba(220, 38, 38, 0.2);
  }
}

// ==================== 移动端暗色模式 ====================
@media (max-width: 768px) {
  html.dark-mode .profile-page {
    .info-card,
    .section-card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
  }
}
</style>

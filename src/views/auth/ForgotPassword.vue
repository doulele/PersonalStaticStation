<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <router-link to="/home" class="auth-logo">
          <img src="/favicon.svg" alt="ToolHub" />
          <span>Utility<span class="highlight">Tool</span></span>
        </router-link>
        <h2>忘记密码</h2>
        <p class="auth-subtitle">选择找回方式</p>
      </div>

      <!-- 找回方式切换 -->
      <div class="register-tabs">
        <button
          :class="['tab-btn', { active: resetType === 'username' }]"
          @click="switchTab('username')"
        >用户名找回</button>
        <button
          :class="['tab-btn', { active: resetType === 'email' }]"
          @click="switchTab('email')"
        >邮箱找回</button>
      </div>

      <!-- ========== 用户名找回流程 ========== -->
      <template v-if="resetType === 'username'">
        <!-- 步骤 1：输入用户名 -->
        <el-form
          v-if="usernameStep === 1"
          ref="usernameFormRef"
          :model="usernameForm"
          :rules="usernameRules"
          label-position="top"
          @submit.prevent="handleGetQuestion"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="usernameForm.username"
              placeholder="请输入注册时填写的用户名"
              :prefix-icon="User"
              size="large"
              clearable
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="usernameLoading"
              class="submit-btn"
              @click="handleGetQuestion"
            >
              {{ usernameLoading ? '查询中...' : '下一步' }}
            </el-button>
          </el-form-item>

          <div v-if="errorMsg" class="error-msg">
            <el-icon><WarningFilled /></el-icon>
            {{ errorMsg }}
          </div>
        </el-form>

        <!-- 步骤 2：回答密保问题 + 设置新密码 -->
        <el-form
          v-if="usernameStep === 2"
          ref="answerFormRef"
          :model="answerForm"
          :rules="answerRules"
          label-position="top"
          @submit.prevent="handleAnswerReset"
        >
          <div class="question-card">
            <el-icon><QuestionFilled /></el-icon>
            <span>密保问题：{{ currentQuestion }}</span>
          </div>

          <el-form-item label="密保答案" prop="securityAnswer">
            <el-input
              v-model="answerForm.securityAnswer"
              placeholder="请输入你之前设置的密保答案"
              :prefix-icon="Key"
              size="large"
              clearable
            />
          </el-form-item>

          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="answerForm.newPassword"
              type="password"
              placeholder="请输入新密码（至少6位）"
              :prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>

          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input
              v-model="answerForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              :prefix-icon="Lock"
              size="large"
              show-password
              @keyup.enter="handleAnswerReset"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="resetting"
              class="submit-btn"
              @click="handleAnswerReset"
            >
              {{ resetting ? '重置中...' : '重置密码' }}
            </el-button>
          </el-form-item>

          <div v-if="errorMsg" class="error-msg">
            <el-icon><WarningFilled /></el-icon>
            {{ errorMsg }}
          </div>
        </el-form>
      </template>

      <!-- ========== 邮箱找回流程（原有） ========== -->
      <template v-if="resetType === 'email'">
        <!-- 步骤 1：输入邮箱发送验证码 -->
        <el-form
          v-if="step === 1"
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="handleSendCode"
        >
          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="form.email"
              placeholder="请输入注册邮箱地址"
              :prefix-icon="Message"
              size="large"
              clearable
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="sending"
              class="submit-btn"
              @click="handleSendCode"
            >
              {{ sending ? '发送中...' : '发送验证码' }}
            </el-button>
          </el-form-item>

          <div v-if="errorMsg" class="error-msg">
            <el-icon><WarningFilled /></el-icon>
            {{ errorMsg }}
          </div>

          <div v-if="successMsg" class="success-msg">
            <el-icon><CircleCheckFilled /></el-icon>
            {{ successMsg }}
          </div>
        </el-form>

        <!-- 步骤 2：输入验证码 + 新密码 -->
        <el-form
          v-else
          ref="resetFormRef"
          :model="resetForm"
          :rules="resetRules"
          label-position="top"
          @submit.prevent="handleResetPassword"
        >
          <el-form-item label="验证码" prop="code">
            <el-input
              v-model="resetForm.code"
              placeholder="请输入邮件中的6位验证码"
              :prefix-icon="Key"
              size="large"
              clearable
              maxlength="6"
            />
          </el-form-item>

          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="resetForm.newPassword"
              type="password"
              placeholder="请输入新密码（至少6位）"
              :prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>

          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input
              v-model="resetForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              :prefix-icon="Lock"
              size="large"
              show-password
              @keyup.enter="handleResetPassword"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="resetting"
              class="submit-btn"
              @click="handleResetPassword"
            >
              {{ resetting ? '重置中...' : '重置密码' }}
            </el-button>
          </el-form-item>

          <div v-if="errorMsg" class="error-msg">
            <el-icon><WarningFilled /></el-icon>
            {{ errorMsg }}
          </div>

          <div class="resend-link">
            <span>没收到验证码？</span>
            <a :class="{ disabled: countdown > 0 }" @click="handleResendCode">
              {{ countdown > 0 ? `${countdown}秒后重新发送` : '重新发送' }}
            </a>
          </div>
        </el-form>
      </template>

      <div class="auth-footer">
        <span>想起密码了？</span>
        <router-link to="/login" class="link">立即登录</router-link>
      </div>

      <div class="auth-back">
        <router-link to="/home" class="back-link">
          <el-icon><ArrowLeft /></el-icon> 返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Lock, WarningFilled, ArrowLeft, Key, CircleCheckFilled, User, QuestionFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { forgotPasswordApi, resetPasswordApi, getSecurityQuestionApi, resetPasswordByUsernameApi } from '@/api/auth'

const router = useRouter()

const resetType = ref('username') // 'username' | 'email'

// ==================== 邮箱找回 ====================
const step = ref(1)
const formRef = ref(null)
const resetFormRef = ref(null)
const sending = ref(false)
const resetting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const countdown = ref(0)
let countdownTimer = null

const form = reactive({ email: '' })
const resetForm = reactive({
  code: '', newPassword: '', confirmPassword: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ]
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== resetForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const resetRules = {
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

async function handleSendCode() {
  errorMsg.value = ''
  successMsg.value = ''

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  sending.value = true
  try {
    const res = await forgotPasswordApi(form.email.trim())
    if (res.success) {
      successMsg.value = '验证码已发送到您的邮箱，请查收'
      setTimeout(() => {
        step.value = 2
        successMsg.value = ''
        startCountdown()
      }, 1000)
    } else {
      errorMsg.value = res.error || '发送验证码失败'
    }
  } catch (err) {
    errorMsg.value = err.message || '发送失败，请稍后重试'
  } finally {
    sending.value = false
  }
}

async function handleResetPassword() {
  errorMsg.value = ''

  const valid = await resetFormRef.value.validate().catch(() => false)
  if (!valid) return

  resetting.value = true
  try {
    const res = await resetPasswordApi(
      form.email.trim(), resetForm.code.trim(), resetForm.newPassword
    )
    if (res.success) {
      ElMessage.success('密码重置成功，请使用新密码登录')
      router.push('/login')
    } else {
      errorMsg.value = res.error || '重置密码失败'
    }
  } catch (err) {
    errorMsg.value = err.message || '重置失败，请稍后重试'
  } finally {
    resetting.value = false
  }
}

async function handleResendCode() {
  if (countdown.value > 0) return
  errorMsg.value = ''
  sending.value = true
  try {
    const res = await forgotPasswordApi(form.email.trim())
    if (res.success) {
      ElMessage.success('验证码已重新发送')
      startCountdown()
    } else {
      errorMsg.value = res.error || '重新发送失败'
    }
  } catch (err) {
    errorMsg.value = err.message || '发送失败，请稍后重试'
  } finally {
    sending.value = false
  }
}

function startCountdown() {
  countdown.value = 60
  clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) countdown.value--
    else clearInterval(countdownTimer)
  }, 1000)
}

// ==================== 用户名找回 ====================
const usernameStep = ref(1)
const usernameFormRef = ref(null)
const answerFormRef = ref(null)
const usernameLoading = ref(false)
const currentQuestion = ref('')

const usernameForm = reactive({ username: '' })
const answerForm = reactive({
  securityAnswer: '', newPassword: '', confirmPassword: ''
})

const usernameRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ]
}

const validateAnswerConfirmPassword = (rule, value, callback) => {
  if (value !== answerForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const answerRules = {
  securityAnswer: [
    { required: true, message: '请输入密保答案', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateAnswerConfirmPassword, trigger: 'blur' }
  ]
}

async function handleGetQuestion() {
  errorMsg.value = ''

  const valid = await usernameFormRef.value.validate().catch(() => false)
  if (!valid) return

  usernameLoading.value = true
  try {
    const res = await getSecurityQuestionApi(usernameForm.username.trim())
    if (res.success) {
      currentQuestion.value = res.data.securityQuestion
      usernameStep.value = 2
    } else {
      errorMsg.value = res.error || '查询失败'
    }
  } catch (err) {
    errorMsg.value = err.message || '查询失败，请稍后重试'
  } finally {
    usernameLoading.value = false
  }
}

async function handleAnswerReset() {
  errorMsg.value = ''

  const valid = await answerFormRef.value.validate().catch(() => false)
  if (!valid) return

  resetting.value = true
  try {
    const res = await resetPasswordByUsernameApi(
      usernameForm.username.trim(),
      answerForm.securityAnswer.trim(),
      answerForm.newPassword
    )
    if (res.success) {
      ElMessage.success('密码重置成功，请使用新密码登录')
      router.push('/login')
    } else {
      errorMsg.value = res.error || '重置密码失败'
    }
  } catch (err) {
    errorMsg.value = err.message || '重置失败，请稍后重试'
  } finally {
    resetting.value = false
  }
}

function switchTab(type) {
  resetType.value = type
  errorMsg.value = ''
  successMsg.value = ''
}

onBeforeUnmount(() => {
  clearInterval(countdownTimer)
})
</script>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  padding: 24px;
  transition: background 0.4s ease;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-white);
  border-radius: 16px;
  padding: 32px 36px 36px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
  transition: background 0.4s ease, border-color 0.4s ease;
}

.auth-header {
  text-align: center;
  margin-bottom: 20px;
}

.auth-logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-size: 20px;
  font-weight: 600;
  color: var(--heading-color);
  margin-bottom: 12px;

  img {
    width: 28px;
    height: 28px;
  }

  .highlight {
    color: var(--primary-color);
  }
}

.auth-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--heading-color);
  margin: 0 0 6px;
}

.auth-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.auth-card :deep(.el-form-item__label) {
  color: var(--text-primary);
  font-weight: 500;
}

.auth-card :deep(.el-form-item) {
  margin-bottom: 18px;
}

.register-tabs {
  display: flex;
  background: var(--bg-color, #f5f5f5);
  border-radius: 10px;
  padding: 3px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition: all 0.25s ease;

  &.active {
    background: var(--bg-white, #fff);
    color: var(--heading-color);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  &:hover:not(.active) {
    color: var(--text-primary);
  }
}

.question-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: #f0f5ff;
  border: 1px solid #d6e4ff;
  border-radius: 10px;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 18px;

  .el-icon {
    font-size: 20px;
    flex-shrink: 0;
  }
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 8px;
  color: #f56c6c;
  font-size: 13px;
  margin-top: -8px;
}

.success-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 8px;
  color: #67c23a;
  font-size: 13px;
  margin-top: -8px;
}

.resend-link {
  text-align: center;
  margin-top: -8px;
  font-size: 13px;
  color: var(--text-secondary);

  a {
    color: var(--primary-color);
    cursor: pointer;
    margin-left: 4px;

    &:hover { text-decoration: underline; }

    &.disabled {
      color: var(--text-secondary);
      cursor: not-allowed;
      text-decoration: none;
    }
  }
}

.auth-footer {
  text-align: center;
  margin-top: 18px;
  font-size: 14px;
  color: var(--text-secondary);

  .link {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
    margin-left: 4px;

    &:hover { text-decoration: underline; }
  }
}

.auth-back {
  text-align: center;
  margin-top: 14px;

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--text-secondary);
    text-decoration: none;

    &:hover { color: var(--primary-color); }
  }
}

// ==================== 移动端适配 ====================
@media (max-width: 768px) {
  .auth-page {
    padding: 16px;
    align-items: flex-start;
    padding-top: 40px;
  }

  .auth-card {
    max-width: 100%;
    padding: 24px 18px 28px;
    border-radius: 12px;
  }

  .auth-header {
    margin-bottom: 16px;
  }

  .auth-logo {
    font-size: 18px;
    img { width: 24px; height: 24px; }
  }

  .auth-header h2 {
    font-size: 20px;
  }

  .auth-subtitle {
    font-size: 12px;
  }

  .register-tabs {
    border-radius: 8px;
  }

  .tab-btn {
    font-size: 12px;
    padding: 7px 12px;
  }

  .question-card {
    padding: 12px 14px;
    font-size: 13px;
  }

  .auth-card :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  .auth-card :deep(.el-form-item__label) {
    font-size: 13px;
  }
}

@media (max-width: 400px) {
  .auth-page {
    padding: 12px;
    padding-top: 30px;
  }

  .auth-card {
    padding: 20px 14px 24px;
  }

  .submit-btn {
    height: 42px;
    font-size: 15px;
  }

  .tab-btn {
    font-size: 11px;
    padding: 6px 10px;
    border-radius: 6px;
  }

  .register-tabs {
    border-radius: 6px;
    padding: 2px;
  }

  .question-card {
    padding: 10px 12px;
    font-size: 12px;
    border-radius: 8px;
  }
}
</style>

<style lang="scss">
/* ===== 深色模式 ===== */
html.dark-mode .auth-page {
  --el-input-bg-color: #1a1a2e;
  --el-fill-color-blank: #1a1a2e;
  --el-fill-color-light: #252540;
  --el-border-color: #2d2d4a;
  --el-border-color-light: #2d2d4a;
  --el-text-color-regular: #94a3b8;
  --el-text-color-primary: #e2dee9;
  --el-text-color-secondary: #64748b;
  --el-color-white: #1e1e2e;
  --el-bg-color: #1e1e2e;

  .auth-card {
    background: #1e1e2e;
    border-color: #2d2d4a;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  }

  .auth-logo {
    color: #e2dee9;
    .highlight { color: #a78bfa; }
  }

  .auth-header h2 { color: #e2dee9; }
  .auth-subtitle { color: #64748b; }
  .el-form-item__label { color: #94a3b8; }

  .register-tabs { background: #252540; }

  .tab-btn {
    color: #64748b;
    &.active {
      background: #1e1e2e;
      color: #e2dee9;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    &:hover:not(.active) { color: #94a3b8; }
  }

  .question-card {
    background: rgba(29, 78, 216, 0.12);
    border-color: rgba(29, 78, 216, 0.2);
    color: #93c5fd;
  }

  .el-input__wrapper {
    background-color: #1a1a2e !important;
    box-shadow: 0 0 0 1px #2d2d4a inset !important;
    &:hover { box-shadow: 0 0 0 1px #4c3d8f inset !important; }
    &.is-focus { box-shadow: 0 0 0 1px #7c3aed inset !important; }
  }

  .el-input__inner {
    color: #e2dee9 !important;
    &::placeholder { color: #4b5563; }
  }

  .el-input__suffix, .el-input__prefix, .el-input__clear { color: #6b7280; }

  .error-msg {
    background: rgba(245, 108, 108, 0.1);
    border-color: rgba(245, 108, 108, 0.2);
  }

  .success-msg {
    background: rgba(103, 194, 58, 0.1);
    border-color: rgba(103, 194, 58, 0.2);
  }

  .resend-link {
    color: #64748b;
    a { color: #a78bfa; &.disabled { color: #64748b; } }
  }

  .auth-footer {
    color: #64748b;
    .link { color: #a78bfa; }
  }

  .auth-back .back-link {
    color: #64748b;
    &:hover { color: #a78bfa; }
  }

  .el-input__password {
    color: #6b7280;
    &:hover { color: #94a3b8; }
  }
}

// ==================== 移动端暗色模式 ====================
@media (max-width: 768px) {
  html.dark-mode .auth-page {
    .auth-card {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
    }
  }
}
</style>

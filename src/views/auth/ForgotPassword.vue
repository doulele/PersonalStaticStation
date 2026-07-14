<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <router-link to="/home" class="auth-logo">
          <img src="/favicon.svg" alt="ToolHub" />
          <span>Utility<span class="highlight">Tool</span></span>
        </router-link>
        <h2>忘记密码</h2>
        <p class="auth-subtitle">输入邮箱获取重置密码验证码</p>
      </div>

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
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Lock, WarningFilled, ArrowLeft, Key, CircleCheckFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { forgotPasswordApi, resetPasswordApi } from '@/api/auth'

const router = useRouter()

const step = ref(1)
const formRef = ref(null)
const resetFormRef = ref(null)
const sending = ref(false)
const resetting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const countdown = ref(0)
let countdownTimer = null

const form = reactive({
  email: ''
})

const resetForm = reactive({
  code: '',
  newPassword: '',
  confirmPassword: ''
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

// 步骤 1：发送验证码
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
      // 延迟展示后进入步骤 2
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

// 步骤 2：重置密码
async function handleResetPassword() {
  errorMsg.value = ''

  const valid = await resetFormRef.value.validate().catch(() => false)
  if (!valid) return

  resetting.value = true
  try {
    const res = await resetPasswordApi(
      form.email.trim(),
      resetForm.code.trim(),
      resetForm.newPassword
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

// 重新发送验证码
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
    if (countdown.value > 0) {
      countdown.value--
    } else {
      clearInterval(countdownTimer)
    }
  }, 1000)
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
  padding: 40px 36px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
  transition: background 0.4s ease, border-color 0.4s ease;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-size: 20px;
  font-weight: 600;
  color: var(--heading-color);
  margin-bottom: 20px;

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
  margin: 0 0 8px;
}

.auth-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.auth-card :deep(.el-form-item__label) {
  color: var(--text-primary);
  font-weight: 500;
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

    &:hover {
      text-decoration: underline;
    }

    &.disabled {
      color: var(--text-secondary);
      cursor: not-allowed;
      text-decoration: none;
    }
  }
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: var(--text-secondary);

  .link {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
    margin-left: 4px;

    &:hover {
      text-decoration: underline;
    }
  }
}

.auth-back {
  text-align: center;
  margin-top: 16px;

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--text-secondary);
    text-decoration: none;

    &:hover {
      color: var(--primary-color);
    }
  }
}
</style>

<style lang="scss">
/* ===== 深色模式（非 scoped，确保覆盖 Element Plus 内部样式） ===== */
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

  .auth-header h2 {
    color: #e2dee9;
  }

  .auth-subtitle {
    color: #64748b;
  }

  .el-form-item__label {
    color: #94a3b8;
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
    a {
      color: #a78bfa;
      &.disabled { color: #64748b; }
    }
  }

  .auth-footer {
    color: #64748b;
    .link { color: #a78bfa; }
  }

  .auth-back .back-link {
    color: #64748b;
    &:hover { color: #a78bfa; }
  }
}
</style>

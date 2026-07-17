<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <router-link to="/home" class="auth-logo">
          <img src="/favicon.svg" alt="ToolHub" />
          <span>Utility<span class="highlight">Tool</span></span>
        </router-link>
        <h2>创建账号</h2>
        <p class="auth-subtitle">选择一种方式，快速注册</p>
      </div>

      <!-- 注册方式切换 -->
      <div class="register-tabs">
        <button
          :class="['tab-btn', { active: registerType === 'username' }]"
          @click="switchTab('username')"
        >用户名注册</button>
        <button
          :class="['tab-btn', { active: registerType === 'email' }]"
          @click="switchTab('email')"
        >邮箱注册</button>
      </div>

      <!-- ========== 用户名注册表单 ========== -->
      <el-form
        v-if="registerType === 'username'"
        ref="usernameFormRef"
        :model="usernameForm"
        :rules="usernameRules"
        label-position="top"
        @submit.prevent="handleUsernameRegister"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="usernameForm.username"
            placeholder="2-20位，字母/数字/中文/下划线"
            :prefix-icon="User"
            size="large"
            clearable
            maxlength="20"
          />
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="usernameForm.nickname"
            placeholder="显示名称（2-20个字符）"
            :prefix-icon="User"
            size="large"
            clearable
            maxlength="20"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="usernameForm.password"
            type="password"
            placeholder="至少6位密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="usernameForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item label="邀请码" prop="inviteCode">
          <el-input
            v-model="usernameForm.inviteCode"
            placeholder="请输入邀请码"
            :prefix-icon="Key"
            size="large"
            clearable
            @keyup.enter="handleUsernameRegister"
          />
        </el-form-item>

        <el-form-item label="密保问题" prop="securityQuestion">
          <el-select
            v-model="usernameForm.securityQuestion"
            placeholder="请选择密保问题（用于找回密码）"
            size="large"
            class="full-width"
          >
            <el-option
              v-for="q in securityQuestions"
              :key="q"
              :label="q"
              :value="q"
            />
            <el-option label="自定义问题..." value="__custom__" />
          </el-select>
          <el-input
            v-if="usernameForm.securityQuestion === '__custom__'"
            v-model="usernameForm.customQuestion"
            placeholder="请输入你的密保问题"
            size="large"
            maxlength="50"
            style="margin-top: 8px;"
          />
        </el-form-item>

        <el-form-item label="密保答案" prop="securityAnswer">
          <el-input
            v-model="usernameForm.securityAnswer"
            placeholder="牢记此答案，用于找回密码"
            :prefix-icon="Key"
            size="large"
            clearable
            maxlength="50"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="submit-btn"
            @click="handleUsernameRegister"
          >
            {{ loading ? '注册中...' : '注册' }}
          </el-button>
        </el-form-item>

        <div v-if="errorMsg" class="error-msg">
          <el-icon><WarningFilled /></el-icon>
          {{ errorMsg }}
        </div>
        <div class="register-tip">
          无需邮箱，但需要输入正确的邀请码才能注册
        </div>
      </el-form>

      <!-- ========== 邮箱注册表单（原有） ========== -->
      <el-form
        v-else
        ref="emailFormRef"
        :model="emailForm"
        :rules="emailRules"
        label-position="top"
        @submit.prevent="handleEmailRegister"
      >
        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="emailForm.nickname"
            placeholder="请输入昵称（2-20个字符）"
            :prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="emailForm.email"
            placeholder="请输入邮箱地址"
            :prefix-icon="Message"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="emailForm.password"
            type="password"
            placeholder="至少6位密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="emailForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item label="邀请码" prop="inviteCode">
          <el-input
            v-model="emailForm.inviteCode"
            placeholder="请输入邀请码"
            :prefix-icon="Key"
            size="large"
            clearable
            @keyup.enter="handleEmailRegister"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="submit-btn"
            @click="handleEmailRegister"
          >
            {{ loading ? '注册中...' : '注册' }}
          </el-button>
        </el-form-item>

        <div v-if="errorMsg" class="error-msg">
          <el-icon><WarningFilled /></el-icon>
          {{ errorMsg }}
        </div>
      </el-form>

      <div class="auth-footer">
        <span>已有账号？</span>
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
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { User, Message, Lock, Key, WarningFilled, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { checkNicknameApi } from '@/api/auth'

const router = useRouter()
const route = useRoute()
const store = useStore()

const registerType = ref('username') // 'username' | 'email'
const loading = computed(() => store.getters['auth/isLoading'])
const errorMsg = computed(() => store.getters['auth/authError'])

// ==================== 密保问题预选项 ====================
const securityQuestions = [
  '你出生的城市是？',
  '你的生日是？（例如：1990-01-01）',
  '你最喜欢的食物是？',
  '你的小学名称是？',
  '你最好的朋友的名字是？',
  '你第一只宠物的名字是？'
]

// ==================== 用户名注册表单 ====================
const usernameFormRef = ref(null)
const usernameForm = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  inviteCode: '',
  securityQuestion: '',
  customQuestion: '',
  securityAnswer: ''
})

const validateUsernameConfirmPassword = (rule, value, callback) => {
  if (value !== usernameForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validateSecurityAnswer = (rule, value, callback) => {
  if (!value || value.trim().length < 2) {
    callback(new Error('密保答案至少2个字符'))
  } else {
    callback()
  }
}

const validateNicknameUnique = async (rule, value, callback) => {
  if (!value || value.trim().length < 2) {
    callback()
    return
  }
  try {
    const res = await checkNicknameApi(value.trim())
    if (res.success && !res.available) {
      callback(new Error('该昵称已被使用'))
    } else {
      callback()
    }
  } catch {
    callback()
  }
}

const usernameRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应为2-20个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '只能包含字母、数字、下划线和中文', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度应为2-20个字符', trigger: 'blur' },
    { validator: validateNicknameUnique, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateUsernameConfirmPassword, trigger: 'blur' }
  ],
  inviteCode: [
    { required: true, message: '请输入邀请码', trigger: 'blur' }
  ],
  securityQuestion: [
    { required: true, message: '请选择密保问题', trigger: 'change' }
  ],
  securityAnswer: [
    { required: true, message: '请输入密保答案', trigger: 'blur' },
    { validator: validateSecurityAnswer, trigger: 'blur' }
  ]
}

async function handleUsernameRegister() {
  const valid = await usernameFormRef.value.validate().catch(() => false)
  if (!valid) return

  // 处理自定义问题
  let question = usernameForm.securityQuestion
  if (question === '__custom__') {
    question = usernameForm.customQuestion.trim()
    if (!question) {
      ElMessage.error('请输入自定义密保问题')
      return
    }
  }

  const result = await store.dispatch('auth/registerUsername', {
    username: usernameForm.username.trim(),
    password: usernameForm.password,
    nickname: usernameForm.nickname.trim(),
    inviteCode: usernameForm.inviteCode.trim(),
    securityQuestion: question,
    securityAnswer: usernameForm.securityAnswer.trim()
  })

  if (result.success) {
    ElMessage.success('注册成功')
    const redirect = route.query.redirect || '/home'
    router.push(redirect)
  }
}

// ==================== 邮箱注册表单 ====================
const emailFormRef = ref(null)
const emailForm = reactive({
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
  inviteCode: ''
})

const validateEmailConfirmPassword = (rule, value, callback) => {
  if (value !== emailForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const emailRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度应为2-20个字符', trigger: 'blur' },
    { validator: validateNicknameUnique, trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateEmailConfirmPassword, trigger: 'blur' }
  ],
  inviteCode: [
    { required: true, message: '请输入邀请码', trigger: 'blur' }
  ]
}

async function handleEmailRegister() {
  const valid = await emailFormRef.value.validate().catch(() => false)
  if (!valid) return

  const result = await store.dispatch('auth/registerEmail', {
    email: emailForm.email.trim(),
    password: emailForm.password,
    nickname: emailForm.nickname.trim(),
    inviteCode: emailForm.inviteCode.trim()
  })

  if (result.success) {
    ElMessage.success('注册成功')
    const redirect = route.query.redirect || '/home'
    router.push(redirect)
  }
}

// ==================== 切换注册方式 ====================
function switchTab(type) {
  registerType.value = type
}
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

// ==================== 注册方式切换 ====================
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

.auth-card :deep(.el-form-item__label) {
  color: var(--text-primary);
  font-weight: 500;
}

.auth-card :deep(.el-form-item) {
  margin-bottom: 18px;
}

.full-width {
  width: 100%;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}

.register-tip {
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: -4px;
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

    &:hover {
      text-decoration: underline;
    }
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

    &:hover {
      color: var(--primary-color);
    }
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

  .auth-card :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  .auth-card :deep(.el-form-item__label) {
    font-size: 13px;
  }

  .register-tip {
    font-size: 11px;
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

  .auth-header h2 {
    color: #e2dee9;
  }

  .auth-subtitle {
    color: #64748b;
  }

  .el-form-item__label {
    color: #94a3b8;
  }

  .register-tabs {
    background: #252540;
  }

  .tab-btn {
    color: #64748b;

    &.active {
      background: #1e1e2e;
      color: #e2dee9;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }

    &:hover:not(.active) {
      color: #94a3b8;
    }
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

  // el-select 下拉框深色适配
  .el-select {
    --el-fill-color-blank: #1a1a2e;
  }

  .el-select .el-input__wrapper {
    background-color: #1a1a2e !important;
  }

  .el-select-dropdown {
    background-color: #1e1e2e !important;
    border-color: #2d2d4a !important;
  }

  .el-select-dropdown__item {
    color: #94a3b8 !important;

    &.hover, &:hover {
      background-color: #252540 !important;
    }

    &.selected {
      color: #a78bfa !important;
      background-color: rgba(167, 139, 250, 0.1) !important;
    }
  }

  .el-popper__arrow::before {
    background: #1e1e2e !important;
    border-color: #2d2d4a !important;
  }

  .error-msg {
    background: rgba(245, 108, 108, 0.1);
    border-color: rgba(245, 108, 108, 0.2);
  }

  .register-tip {
    color: #64748b;
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

// ==================== 移动端暗色模式 ====================
@media (max-width: 768px) {
  html.dark-mode .auth-page {
    .auth-card {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
    }
  }
}
</style>

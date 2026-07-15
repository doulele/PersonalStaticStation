<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <router-link to="/home" class="auth-logo">
          <img src="/favicon.svg" alt="ToolHub" />
          <span>Utility<span class="highlight">Tool</span></span>
        </router-link>
        <h2>登录账号</h2>
        <p class="auth-subtitle">登录后享受更多个性化功能</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="邮箱 / 用户名" prop="account">
          <el-input
            v-model="form.account"
            placeholder="输入邮箱或用户名"
            :prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
          <div class="forgot-pwd-row">
            <router-link to="/forgot-password" class="forgot-link">忘记密码？</router-link>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="submit-btn"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>

        <div v-if="errorMsg" class="error-msg">
          <el-icon><WarningFilled /></el-icon>
          {{ errorMsg }}
        </div>
      </el-form>

      <div class="auth-footer">
        <span>还没有账号？</span>
        <router-link to="/register" class="link">立即注册</router-link>
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
import { Message, Lock, WarningFilled, ArrowLeft, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const store = useStore()

const formRef = ref(null)
const loading = computed(() => store.getters['auth/isLoading'])
const errorMsg = computed(() => store.getters['auth/authError'])

const form = reactive({
  account: '',
  password: ''
})

const rules = {
  account: [
    { required: true, message: '请输入邮箱或用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const account = form.account.trim()
  // 判断是否为邮箱（包含 @）
  const isEmail = /@/.test(account)

  const result = await store.dispatch('auth/login', {
    account,
    password: form.password,
    isUsername: !isEmail
  })

  if (result.success) {
    ElMessage.success('登录成功')
    const redirect = route.query.redirect || '/home'
    router.push(redirect)
  }
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

.forgot-pwd-row {
  text-align: right;
  margin-top: -2px;

  .forgot-link {
    font-size: 13px;
    color: var(--primary-color);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
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

// ==================== 移动端适配 ====================
@media (max-width: 768px) {
  .auth-page {
    padding: 16px;
    align-items: flex-start;
    padding-top: 60px;
  }

  .auth-card {
    max-width: 100%;
    padding: 28px 20px 32px;
    border-radius: 12px;
  }

  .auth-header {
    margin-bottom: 24px;
  }

  .auth-logo {
    font-size: 18px;
    img { width: 24px; height: 24px; }
  }

  .auth-header h2 {
    font-size: 20px;
  }

  .auth-subtitle {
    font-size: 13px;
  }

  .auth-card :deep(.el-form-item__label) {
    font-size: 13px;
  }
}

@media (max-width: 400px) {
  .auth-page {
    padding: 12px;
    padding-top: 40px;
  }

  .auth-card {
    padding: 22px 16px 28px;
  }

  .submit-btn {
    height: 42px;
    font-size: 15px;
  }
}
</style>

<style lang="scss">
/* ===== 深色模式（非 scoped，确保覆盖 Element Plus 内部样式） ===== */
html.dark-mode .auth-page {
  // 关键：设置 Element Plus CSS 变量来覆盖输入框背景/边框/文字
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

  // Element Plus 输入框深色覆盖（双重保险：CSS变量 + 直接样式）
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

  // 图标颜色
  .el-input__suffix,
  .el-input__prefix,
  .el-input__clear {
    color: #6b7280;
  }

  // 密码切换按钮（show-password）
  .el-input__password {
    color: #6b7280;
    &:hover { color: #94a3b8; }
  }

  .error-msg {
    background: rgba(245, 108, 108, 0.1);
    border-color: rgba(245, 108, 108, 0.2);
  }

  .auth-footer {
    color: #64748b;
    .link { color: #a78bfa; }
  }

  .forgot-pwd-row .forgot-link {
    color: #a78bfa;
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

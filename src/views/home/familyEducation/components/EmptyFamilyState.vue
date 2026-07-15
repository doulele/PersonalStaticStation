<template>
  <div class="empty-family-state">
    <div class="empty-family-card">
      <div class="empty-family-art">
        <div class="empty-family-orbit">
          <div class="empty-family-icon-wrap">
            <el-icon :size="40"><House /></el-icon>
          </div>
        </div>
      </div>
      <h2 class="empty-family-title">你还没有加入家庭空间</h2>
      <p class="empty-family-desc">
        请前往「家庭成员管理」页面创建或加入一个家庭空间，然后即可使用{{ featureName }}功能。
      </p>
      <div class="empty-family-actions">
        <el-button size="large" class="empty-family-btn plain" @click="$router.push('/home/familyEducation')">
          返回
        </el-button>
        <el-button type="primary" size="large" class="empty-family-btn" @click="$router.push('/home/familyEducation/members')">
          前往家庭成员管理
        </el-button>
      </div>
      <div class="empty-family-tip">
        <el-icon :size="14"><InfoFilled /></el-icon>
        <span>家庭空间数据在家庭会议和愿望清单中共享</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { House, InfoFilled } from '@element-plus/icons-vue'

defineProps({
  featureName: { type: String, default: '对应' }
})
</script>

<style lang="scss" scoped>
.empty-family-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
}

.empty-family-card {
  text-align: center;
  max-width: 460px;
  width: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  padding: 52px 44px 44px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.04),
    0 10px 20px -4px rgba(0, 0, 0, 0.05),
    0 24px 60px -12px rgba(99, 102, 241, 0.12);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 8px 12px -2px rgba(0, 0, 0, 0.05),
      0 18px 30px -6px rgba(0, 0, 0, 0.06),
      0 32px 72px -16px rgba(99, 102, 241, 0.14);
  }
}

.empty-family-art {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-family-orbit {
  position: relative;
  width: 110px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
  }

  &::before {
    inset: 0;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.08));
    animation: pulse-soft 3s ease-in-out infinite;
  }

  &::after {
    inset: 14px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    box-shadow: 0 12px 28px rgba(99, 102, 241, 0.32);
  }
}

.empty-family-icon-wrap {
  position: relative;
  z-index: 1;
  color: #fff;
}

.empty-family-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 12px;
  letter-spacing: -0.01em;
}

.empty-family-desc {
  font-size: 15px;
  color: #64748b;
  line-height: 1.75;
  margin: 0 0 28px;
}

.empty-family-actions {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.empty-family-btn {
  flex: 1;
  border-radius: 12px;
  font-weight: 600;
  padding: 12px 16px;
  height: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &.plain {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #334155;
    &:hover {
      background: #e2e8f0;
      border-color: #94a3b8;
      color: #0f172a;
    }
  }

  &:not(.plain):hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.35);
  }
}

.empty-family-tip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #94a3b8;
  padding: 8px 14px;
  background: #f1f5f9;
  border-radius: 999px;

  .el-icon {
    color: #94a3b8;
  }
}

@keyframes pulse-soft {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: 0.75; }
}

@media (max-width: 520px) {
  .empty-family-card {
    padding: 36px 24px 32px;
    border-radius: 20px;
  }
  .empty-family-orbit {
    width: 92px;
    height: 92px;
    &::after { inset: 12px; }
  }
  .empty-family-title { font-size: 20px; }
  .empty-family-desc { font-size: 14px; }
}
</style>

<style lang="scss">
html.dark-mode {
  .empty-family-card {
    background: linear-gradient(180deg, #1e1e2e 0%, #181826 100%);
    border-color: #2d2d4a;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.2),
      0 10px 20px -4px rgba(0, 0, 0, 0.25),
      0 24px 60px -12px rgba(139, 92, 246, 0.18);
    &:hover {
      box-shadow:
        0 8px 12px -2px rgba(0, 0, 0, 0.25),
        0 18px 30px -6px rgba(0, 0, 0, 0.3),
        0 32px 72px -16px rgba(139, 92, 246, 0.22);
    }
  }

  .empty-family-orbit::before {
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(139, 92, 246, 0.1));
  }
  .empty-family-orbit::after {
    background: linear-gradient(135deg, #6366f1 0%, #a78bfa 100%);
    box-shadow: 0 12px 28px rgba(99, 102, 241, 0.28);
  }

  .empty-family-title { color: #e2dee9; }
  .empty-family-desc { color: #94a3b8; }

  .empty-family-btn {
    &.plain {
      background: #252540;
      border-color: #3f3f66;
      color: #c4b5e2;
      &:hover {
        background: #2d2d4a;
        border-color: #5a4f8a;
        color: #e2dee9;
      }
    }
  }

  .empty-family-tip {
    color: #64748b;
    background: #252540;
    .el-icon { color: #64748b; }
  }
}
</style>

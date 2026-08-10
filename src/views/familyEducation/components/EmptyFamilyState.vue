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
        <el-button size="large" class="empty-family-btn plain" @click="$router.push('/familyEducation')">
          返回
        </el-button>
        <el-button type="primary" size="large" class="empty-family-btn" @click="$router.push('/familyEducation/members')">
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

<style lang="scss" scoped src="./EmptyFamilyState.scss"></style>

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

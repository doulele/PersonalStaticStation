<template>
  <div class="image-tools-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text class="back-btn" @click="$router.back()">返回</el-button>
      <div class="header-center">
        <h1 class="page-title">图片处理</h1>
        <p class="page-desc">图片在线一键处理工具</p>
      </div>
      <div class="header-spacer"></div>
    </div>

    <div class="page-content">
      <el-empty description="图片处理功能开发中，敬请期待...">
        <el-button type="primary" @click="$router.back()">返回上一页</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.image-tools-page {
  padding: 40px 24px;
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 48px;
}

.back-btn {
  flex-shrink: 0;
}

.header-center {
  flex: 1;
  text-align: center;
}

.header-spacer {
  flex-shrink: 0;
  width: 60px;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.page-desc {
  font-size: 16px;
  color: #64748b;
}

.page-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

@media (max-width: 768px) {
  .image-tools-page { padding: 24px 16px; }
  .page-title { font-size: 28px; }
}
</style>

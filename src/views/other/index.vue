<template>
  <div class="other-page">
    <div class="page-header">
      <h1 class="page-title">其他</h1>
      <p class="page-desc">更多功能正在开发中，敬请期待...</p>
    </div>
    
    <el-empty description="内容待补充" />
  </div>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.other-page {
  animation: fadeIn 0.5s ease-out;
}

.page-header {
  text-align: center;
  margin-bottom: 48px;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  
  &::after {
    content: '';
    display: block;
    width: 60px;
    height: 4px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 12px auto 0;
    border-radius: 2px;
  }
}

.page-desc {
  font-size: 16px;
  color: #909399;
}
</style>

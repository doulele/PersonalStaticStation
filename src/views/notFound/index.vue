<template>
  <div class="not-found">
    <div class="content">
      <div class="error-code">404</div>
      <h1 class="title">Page Not Found</h1>
      <p class="desc">The page you're looking for doesn't exist or has been moved.</p>
      <div class="actions">
        <el-button type="primary" size="large" @click="$router.push('/home')">
          Back to Home
        </el-button>
        <el-button size="large" @click="$router.back()">
          Go Back
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.not-found {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  padding: 40px 24px;
}

.content {
  text-align: center;
  max-width: 500px;
}

.error-code {
  font-size: 140px;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
}

.desc {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 32px;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  
  .el-button {
    padding: 12px 32px;
    font-size: 15px;
    border-radius: 10px;
  }
}
</style>

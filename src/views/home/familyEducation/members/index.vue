<template>
  <div class="mmp-page">
    <div class="mmp-back">
      <el-button link @click="$router.push('/home/familyEducation')">
        <el-icon><ArrowLeft /></el-icon>返回家庭/教育
      </el-button>
    </div>
    <MemberManagement />
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue'
import MemberManagement from '../familyMeeting/components/MemberManagement.vue'
</script>

<style lang="scss" scoped>
.mmp-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.mmp-back {
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .mmp-page {
    padding: 16px;
    max-width: 100%;
  }
}
</style>

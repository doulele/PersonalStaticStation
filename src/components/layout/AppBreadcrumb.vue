<template>
  <div class="breadcrumb-wrapper" v-if="breadcrumbs.length > 1">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/home' }">
        <el-icon><HomeFilled /></el-icon>
        <span>Home</span>
      </el-breadcrumb-item>
      <el-breadcrumb-item 
        v-for="(item, index) in breadcrumbs" 
        :key="item.path"
      >
        {{ item.meta?.title || item.name }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled } from '@element-plus/icons-vue'

const route = useRoute()

// 需要排除的索引页名称
const excludeNames = ['HomeIndex', 'OtherIndex']

const breadcrumbs = computed(() => {
  // 过滤掉索引页，只保留分类页和详情页
  return route.matched.filter(item => 
    item.meta?.title && !excludeNames.includes(item.name)
  )
})
</script>

<style lang="scss" scoped>
.breadcrumb-wrapper {
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;

  :deep(.el-breadcrumb) {
    font-size: 14px;
    
    .el-breadcrumb__inner {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #64748b;
      
      a {
        color: #64748b;
        font-weight: 400;
        
        &:hover {
          color: #6366f1;
        }
      }
    }

    .el-breadcrumb__separator {
      color: #cbd5e1;
    }
  }
}
</style>

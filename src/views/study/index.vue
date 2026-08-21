<template>
  <div class="study-page">
    <div class="page-header">
      <h1 class="page-title">技能学习</h1>
      <p class="page-desc">技能学习、知识沉淀与持续成长</p>
    </div>

    <div class="tools-grid">

      <router-link to="/study/frontend-dev" class="tool-card" @click="recordToolClick('/study/frontend-dev')">
        <div class="tool-card-inner">
          <div class="tool-icon blue">
            <el-icon :size="32"><Monitor /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">前端开发</h3>
            <p class="tool-desc">前端开发技能学习与练习（内容建设中）</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

    </div>
  </div>
</template>

<script setup>
import { ArrowRight, Monitor } from '@element-plus/icons-vue'
import { recordToolClick } from '@/api/stats'
</script>

<style lang="scss" scoped src="./index.scss"></style>

<style lang="scss">
html.dark-mode {
  .page-title { color: #e2dee9; }
  .page-desc { color: #94a3b8; }
  .tool-card-inner {
    background: #1e1e2e; border-color: #2d2d4a;
    &:hover {
      border-color: #a78bfa; background: #252540;
      box-shadow: 0 8px 30px rgba(167, 139, 250, 0.12);
      .tool-arrow { color: #a78bfa; }
    }
  }
  .tool-name { color: #e2dee9; }
  .tool-desc { color: #94a3b8; }
  .tool-arrow { color: #64748b; }
}
</style>

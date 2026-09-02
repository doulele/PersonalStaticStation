<template>
  <div class="hotstation-tools-list">
    <div class="page-header">
      <h1 class="page-title">信息工作台</h1>
      <p class="page-desc">AI 驱动的信息策展与二次创作辅助</p>
    </div>

    <div class="tools-grid">
      <router-link to="/hotstation/curation" class="tool-card" @click="recordToolClick('/hotstation/curation')">
        <div class="tool-card-inner">
          <div class="tool-icon">
            <el-icon :size="32"><News /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">信息策展与二创工作台</h3>
            <p class="tool-desc">AI 信息策展与二创：热点追踪、事实核实、一键生成文章/脚本</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { Reading, ArrowRight } from '@element-plus/icons-vue'
import { recordToolClick } from '@/api/stats'

// News 图标在 @element-plus/icons-vue 中不存在，用 Reading 别名保持一致性
const News = Reading
</script>

<style lang="scss" scoped src="./index.scss"></style>

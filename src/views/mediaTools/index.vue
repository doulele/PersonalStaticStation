<template>
  <div class="audio-video-images-tools-page">
    <div class="page-header">
      <h1 class="page-title">音视频图像</h1>
      <p class="page-desc">影音娱乐与图片创作工具</p>
    </div>

    <div class="tools-grid">
      <router-link to="/mediaTools/vipVideoParse" class="tool-card" @click="recordToolClick('/mediaTools/vipVideoParse')">
        <div class="tool-card-inner">
          <div class="tool-icon">
            <el-icon :size="32"><VideoPlay /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">VIP视频解析</h3>
            <p class="tool-desc">免费观看全网VIP视频，多线路解析</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      <router-link to="/mediaTools/novelOnline" class="tool-card" @click="recordToolClick('/mediaTools/novelOnline')">
        <div class="tool-card-inner">
          <div class="tool-icon purple">
            <el-icon :size="32"><Headset /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">在线音频</h3>
            <p class="tool-desc">海量书籍小说在线搜索与收听</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      <router-link to="/mediaTools/imageTools" class="tool-card" @click="recordToolClick('/mediaTools/imageTools')">
        <div class="tool-card-inner">
          <div class="tool-icon blue">
            <el-icon :size="32"><Picture /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">图片处理</h3>
            <p class="tool-desc">图片裁剪、压缩、格式转换一站式处理</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ArrowRight, VideoPlay, Headset, Picture } from '@element-plus/icons-vue'
import { recordToolClick } from '@/api/stats'
</script>

<style lang="scss" scoped src="./index.scss"></style>

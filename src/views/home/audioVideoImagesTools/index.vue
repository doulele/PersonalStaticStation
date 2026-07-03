<template>
  <div class="audio-video-images-tools-page">
    <div class="page-header">
      <h1 class="page-title">音视频图像</h1>
      <p class="page-desc">影音娱乐与图片创作工具</p>
    </div>

    <div class="tools-grid">
      <router-link to="/home/audioVideoImagesTools/vipVideoParse" class="tool-card" @click="recordToolClick('/home/audioVideoImagesTools/vipVideoParse')">
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

      <router-link to="/home/audioVideoImagesTools/novelOnline" class="tool-card" @click="recordToolClick('/home/audioVideoImagesTools/novelOnline')">
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

      <router-link to="/home/audioVideoImagesTools/imageTools" class="tool-card" @click="recordToolClick('/home/audioVideoImagesTools/imageTools')">
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

<style lang="scss" scoped>
.audio-video-images-tools-page {
  padding: 40px 24px;
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  text-align: center;
  margin-bottom: 48px;
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

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.tool-card {
  display: block;
  text-decoration: none;
}

.tool-card-inner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #6366f1, #a855f7);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 8px 30px rgba(99, 102, 241, 0.1);
    transform: translateY(-2px);

    &::before {
      opacity: 1;
    }

    .tool-arrow {
      transform: translateX(4px);
      color: #6366f1;
    }
  }
}

.tool-icon {
  width: 64px;
  height: 64px;
  min-width: 64px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #ffffff;

  &.blue {
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  }

  &.green {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }

  &.purple {
    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  }
}

.tool-info {
  flex: 1;
  min-width: 0;
}

.tool-name {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 6px;
}

.tool-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
}

.tool-arrow {
  color: #94a3b8;
  transition: all 0.3s ease;
  font-size: 20px;
}

@media (max-width: 768px) {
  .audio-video-images-tools-page {
    padding: 24px 16px;
  }

  .page-title {
    font-size: 28px;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }

  .tool-card-inner {
    padding: 20px;
  }
}

</style>

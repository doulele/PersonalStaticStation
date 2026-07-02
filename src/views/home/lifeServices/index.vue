<template>
  <div class="life-services-page">
    <div class="page-header">
      <h1 class="page-title">生活服务</h1>
      <p class="page-desc">实用的日常生活工具集合</p>
    </div>

    <div class="tools-grid">
      <router-link to="/home/lifeServices/travelGuide" class="tool-card">
        <div class="tool-card-inner">
          <div class="tool-icon">
            <el-icon :size="32"><MapLocation /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">旅游攻略</h3>
            <p class="tool-desc">热门旅游目的地攻略与行程规划</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      <router-link to="/home/lifeServices/oilPrice" class="tool-card">
        <div class="tool-card-inner">
          <div class="tool-icon green">
            <el-icon :size="32"><Coin /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">今日油价</h3>
            <p class="tool-desc">全国各地实时油价查询</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      <router-link to="/home/lifeServices/weather" class="tool-card">
        <div class="tool-card-inner">
          <div class="tool-icon blue">
            <el-icon :size="32"><Sunny /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">天气预报</h3>
            <p class="tool-desc">全国城市实时天气查询与多日预报</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>

      <router-link to="/home/lifeServices/travelMemo" class="tool-card">
        <div class="tool-card-inner">
          <div class="tool-icon orange">
            <el-icon :size="32"><Memo /></el-icon>
          </div>
          <div class="tool-info">
            <h3 class="tool-name">出行备忘</h3>
            <p class="tool-desc">出行物品清单，轻松打包不遗漏</p>
          </div>
          <el-icon class="tool-arrow"><ArrowRight /></el-icon>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ArrowRight, MapLocation, Coin, Memo, Sunny } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.life-services-page {
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

  &.green {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }

  &.blue {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  }

  &.orange {
    background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
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
  .life-services-page {
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

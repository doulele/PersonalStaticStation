<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-bg">
        <div class="hero-gradient"></div>
        <div class="hero-particles"></div>
      </div>
      <div class="hero-content">
        <span class="hero-badge">免费工具 · 人人可用</span>
        <h1 class="hero-title">
          <span class="title-line">强大的在线工具集</span>
          <span class="title-line accent">无限可能等你探索</span>
        </h1>
        <p class="hero-subtitle">
          精心挑选的优质工具合集，助你提升工作效率，一站式解决日常开发与办公需求
        </p>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-value">50+</span>
            <span class="stat-label">实用工具</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">10K+</span>
            <span class="stat-label">累计用户</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">99.9%</span>
            <span class="stat-label">服务可用</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Tools Grid -->
    <section class="tools-section">
      <div class="section-header">
        <h2 class="section-title">热门工具</h2>
        <p class="section-desc">为开发者和职场人士打造的高效工具集合</p>
      </div>
      
      <div class="tools-grid">
        <router-link to="/home/fund" class="tool-card">
          <div class="tool-card-inner">
            <div class="tool-icon">
              <el-icon :size="28"><DataLine /></el-icon>
            </div>
            <div class="tool-info">
              <h3 class="tool-name">基金/股票</h3>
              <p class="tool-desc">基金筛选、股票信息查询与分析</p>
            </div>
            <el-icon class="tool-arrow"><ArrowRight /></el-icon>
          </div>
        </router-link>

        <router-link to="/home/lottery" class="tool-card">
          <div class="tool-card-inner">
            <div class="tool-icon yellow">
              <el-icon :size="28"><Present /></el-icon>
            </div>
            <div class="tool-info">
              <h3 class="tool-name">双色球 / 大乐透分析</h3>
              <p class="tool-desc">双色球 / 大乐透历史数据统计分析</p>
            </div>
            <el-icon class="tool-arrow"><ArrowRight /></el-icon>
          </div>
        </router-link>

        <router-link to="/home/audioVideoImagesTools" class="tool-card">
          <div class="tool-card-inner">
            <div class="tool-icon blue">
              <el-icon :size="28"><Document /></el-icon>
            </div>
            <div class="tool-info">
              <h3 class="tool-name">影音图像</h3>
              <p class="tool-desc">音频、视频、图片在线工具</p>
            </div>
            <el-icon class="tool-arrow"><ArrowRight /></el-icon>
          </div>
        </router-link>

        <router-link to="/home/lifeServices" class="tool-card">
          <div class="tool-card-inner">
            <div class="tool-icon green">
              <el-icon :size="28"><Service /></el-icon>
            </div>
            <div class="tool-info">
              <h3 class="tool-name">生活服务</h3>
              <p class="tool-desc">旅游攻略、今日油价等生活工具</p>
            </div>
            <el-icon class="tool-arrow"><ArrowRight /></el-icon>
          </div>
        </router-link>

        <router-link to="/password-generator" class="tool-card">
          <div class="tool-card-inner">
            <div class="tool-icon orange">
              <el-icon :size="28"><Lock /></el-icon>
            </div>
            <div class="tool-info">
              <h3 class="tool-name">密码生成器</h3>
              <p class="tool-desc">生成高强度安全密码</p>
            </div>
            <el-icon class="tool-arrow"><ArrowRight /></el-icon>
          </div>
        </router-link>

        <router-link to="/api-tester" class="tool-card">
          <div class="tool-card-inner">
            <div class="tool-icon purple">
              <el-icon :size="28"><Connection /></el-icon>
            </div>
            <div class="tool-info">
              <h3 class="tool-name">API 测试</h3>
              <p class="tool-desc">快速测试 REST API 接口</p>
            </div>
            <el-icon class="tool-arrow"><ArrowRight /></el-icon>
          </div>
        </router-link>

        <router-link to="/time-converter" class="tool-card">
          <div class="tool-card-inner">
            <div class="tool-icon red">
              <el-icon :size="28"><Timer /></el-icon>
            </div>
            <div class="tool-info">
              <h3 class="tool-name">时区转换</h3>
              <p class="tool-desc">全球时区时间即时转换</p>
            </div>
            <el-icon class="tool-arrow"><ArrowRight /></el-icon>
          </div>
        </router-link>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-content">
        <h2 class="cta-title">准备好提升效率了吗？</h2>
        <p class="cta-desc">无需注册，立即开始使用我们的免费工具</p>
        <el-button type="primary" size="large" class="cta-btn">
          免费开始使用
        </el-button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ArrowRight, DataLine, Present, Document, Service, Lock, Connection, Timer } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.home-page {
  width: 100%;
}

// Hero Section
.hero {
  position: relative;
  min-height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0a0a0f;
}

.hero-bg {
  position: absolute;
  inset: 0;
}

.hero-gradient {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent),
    radial-gradient(ellipse 60% 40% at 80% 60%, rgba(139, 92, 246, 0.1), transparent),
    radial-gradient(ellipse 50% 30% at 20% 80%, rgba(59, 130, 246, 0.08), transparent);
}

.hero-particles {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(255,255,255,0.03) 1px, transparent 1px),
    radial-gradient(circle at 80% 70%, rgba(255,255,255,0.02) 1px, transparent 1px),
    radial-gradient(circle at 40% 60%, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 60px 60px, 80px 80px, 100px 100px;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 60px 24px;
  max-width: 900px;
  width: 100%;
}

.hero-badge {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #818cf8;
  letter-spacing: 0.5px;
  margin-bottom: 24px;
}

.hero-title {
  font-size: clamp(28px, 5vw, 64px);
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 20px;
  letter-spacing: -0.02em;
}

.title-line {
  display: block;
  color: #ffffff;
}

.title-line.accent {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  max-width: 500px;
  margin: 0 auto 36px;
  line-height: 1.7;
}

.hero-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
}

// Tools Section
.tools-section {
  padding: 80px 24px;
  background: #ffffff;
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.section-desc {
  font-size: 16px;
  color: #64748b;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
  max-width: 1400px;
  margin: 0 auto;
}

.tool-card {
  display: block;
  text-decoration: none;
}

.tool-card-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
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
  width: 50px;
  height: 50px;
  min-width: 50px;
  border-radius: 12px;
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

  &.orange {
    background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  }

  &.purple {
    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  }

  &.red {
    background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
  }

  &.yellow {
    background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%);
  }
}

.tool-info {
  flex: 1;
  min-width: 0;
}

.tool-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 3px;
}

.tool-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.4;
}

.tool-arrow {
  color: #94a3b8;
  transition: all 0.3s ease;
  font-size: 20px;
}

// CTA Section
.cta-section {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  padding: 80px 24px;
}

.cta-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.cta-title {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
}

.cta-desc {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 32px;
}

.cta-btn {
  padding: 14px 40px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  
  &:hover {
    background: linear-gradient(135deg, #5558e3 0%, #7c3aed 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
  }
}

// Responsive
@media (max-width: 768px) {
  .hero {
    min-height: 380px;
  }

  .hero-content {
    padding: 48px 20px;
  }

  .hero-badge {
    font-size: 11px;
    padding: 5px 12px;
    margin-bottom: 18px;
  }

  .hero-title {
    font-size: clamp(22px, 6vw, 36px);
    margin-bottom: 14px;
  }

  .hero-subtitle {
    font-size: 14px;
    max-width: 360px;
    margin-bottom: 28px;
  }

  .hero-stats {
    gap: 20px;
  }

  .stat-value {
    font-size: 22px;
  }

  .stat-label {
    font-size: 11px;
  }

  .stat-divider {
    height: 30px;
  }

  .section-title {
    font-size: 24px;
  }

  .section-desc {
    font-size: 14px;
  }

  .tools-section {
    padding: 48px 16px;
  }

  .section-header {
    margin-bottom: 32px;
  }

  .tools-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .tool-card-inner {
    padding: 16px;
    gap: 14px;
  }

  .tool-icon {
    width: 44px;
    height: 44px;
    min-width: 44px;
    border-radius: 10px;
  }

  .tool-name {
    font-size: 15px;
  }

  .tool-desc {
    font-size: 12px;
  }

  .cta-section {
    padding: 48px 16px;
  }

  .cta-title {
    font-size: 24px;
  }

  .cta-desc {
    font-size: 14px;
  }

  .cta-btn {
    padding: 12px 32px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .hero {
    min-height: 340px;
  }

  .hero-content {
    padding: 40px 16px;
  }

  .hero-badge {
    font-size: 10px;
    padding: 4px 10px;
    margin-bottom: 14px;
  }

  .hero-title {
    font-size: clamp(20px, 5vw, 28px);
    margin-bottom: 10px;
  }

  .hero-subtitle {
    font-size: 13px;
    max-width: 300px;
    margin-bottom: 22px;
    line-height: 1.6;
  }

  .hero-stats {
    gap: 14px;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-label {
    font-size: 10px;
  }

  .stat-divider {
    display: none;
  }

  .tools-section {
    padding: 36px 12px;
  }

  .section-title {
    font-size: 22px;
  }

  .section-desc {
    font-size: 13px;
  }

  .tool-card-inner {
    padding: 14px;
    gap: 12px;
    border-radius: 12px;
  }

  .tool-icon {
    width: 40px;
    height: 40px;
    min-width: 40px;
    border-radius: 8px;
    :deep(.el-icon) {
      font-size: 20px !important;
    }
  }

  .tool-name {
    font-size: 14px;
  }

  .tool-desc {
    font-size: 11px;
  }

  .tool-arrow {
    font-size: 18px;
  }

  .cta-section {
    padding: 40px 16px;
  }

  .cta-title {
    font-size: 20px;
  }

  .cta-desc {
    font-size: 13px;
  }

  .cta-btn {
    padding: 10px 28px;
    font-size: 13px;
  }
}
</style>

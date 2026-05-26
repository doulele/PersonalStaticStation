<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-bg">
        <div class="hero-gradient"></div>
        <div class="hero-particles"></div>
      </div>
      <div class="hero-content">
        <span class="hero-badge">Free Tools for Everyone</span>
        <h1 class="hero-title">
          <span class="title-line">Powerful Tools.</span>
          <span class="title-line accent">Limitless Possibilities.</span>
        </h1>
        <p class="hero-subtitle">
          A curated collection of premium tools designed to streamline your workflow
        </p>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-value">50+</span>
            <span class="stat-label">Tools</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">10K+</span>
            <span class="stat-label">Users</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">99.9%</span>
            <span class="stat-label">Uptime</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Tools Grid -->
    <section class="tools-section">
      <div class="section-header">
        <h2 class="section-title">Popular Tools</h2>
        <p class="section-desc">Essential utilities for developers and professionals</p>
      </div>
      
      <div class="tools-grid">
        <router-link to="/home/fund" class="tool-card">
          <div class="tool-card-inner">
            <div class="tool-icon">
              <el-icon :size="28"><DataLine /></el-icon>
            </div>
            <div class="tool-info">
              <h3 class="tool-name">基金/股票</h3>
              <p class="tool-desc">Fund & Stock Information Search</p>
            </div>
            <el-icon class="tool-arrow"><ArrowRight /></el-icon>
          </div>
        </router-link>

        <router-link to="/json-formatter" class="tool-card">
          <div class="tool-card-inner">
            <div class="tool-icon blue">
              <el-icon :size="28"><Document /></el-icon>
            </div>
            <div class="tool-info">
              <h3 class="tool-name">JSON Formatter</h3>
              <p class="tool-desc">Format and validate JSON data</p>
            </div>
            <el-icon class="tool-arrow"><ArrowRight /></el-icon>
          </div>
        </router-link>

        <router-link to="/image-compress" class="tool-card">
          <div class="tool-card-inner">
            <div class="tool-icon green">
              <el-icon :size="28"><Picture /></el-icon>
            </div>
            <div class="tool-info">
              <h3 class="tool-name">Image Compressor</h3>
              <p class="tool-desc">Optimize images for web</p>
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
              <h3 class="tool-name">Password Generator</h3>
              <p class="tool-desc">Create secure passwords</p>
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
              <h3 class="tool-name">API Tester</h3>
              <p class="tool-desc">Test REST APIs easily</p>
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
              <h3 class="tool-name">Time Converter</h3>
              <p class="tool-desc">Convert time zones instantly</p>
            </div>
            <el-icon class="tool-arrow"><ArrowRight /></el-icon>
          </div>
        </router-link>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-content">
        <h2 class="cta-title">Ready to boost your productivity?</h2>
        <p class="cta-desc">Start using our tools today, no signup required</p>
        <el-button type="primary" size="large" class="cta-btn">
          Get Started Free
        </el-button>
      </div>
    </section>
  </div>
</template>

<script setup>
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
}

.hero-badge {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #818cf8;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 24px;
}

.hero-title {
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 24px;
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
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  max-width: 500px;
  margin: 0 auto 40px;
  line-height: 1.7;
}

.hero-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
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
  text-transform: uppercase;
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
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
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
  gap: 20px;
  padding: 24px;
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
  width: 56px;
  height: 56px;
  min-width: 56px;
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
}

.tool-info {
  flex: 1;
  min-width: 0;
}

.tool-name {
  font-size: 17px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
}

.tool-desc {
  font-size: 13px;
  color: #64748b;
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
    min-height: 400px;
  }

  .hero-stats {
    flex-wrap: wrap;
    gap: 24px;
  }

  .stat-divider {
    display: none;
  }

  .tools-section {
    padding: 48px 16px;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }

  .cta-section {
    padding: 48px 16px;
  }
}
</style>

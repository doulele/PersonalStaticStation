<template>
  <div class="lottery-selector">
    <!-- 头部 Hero -->
    <div class="hero" :class="{ 'hero-dlt': activeLottery === 'dlt' }">
      <!-- 背景装饰 -->
      <div class="hero-bg-decor">
        <div class="hero-circle c1"></div>
        <div class="hero-circle c2"></div>
        <div class="hero-circle c3"></div>
      </div>

      <div class="hero-inner">
        <!-- 顶部标签 + 标题 -->
        <div class="hero-top">
          <div class="hero-tag" :class="{ 'tag-dlt': activeLottery === 'dlt' }">
            <span class="tag-dot"></span>
            {{ activeLottery === 'ssq' ? '双色球' : '大乐透' }} · 数据分析工具
          </div>
          <h1 class="hero-title">
            <template v-if="activeLottery === 'ssq'">
              <span class="title-icon">🔴</span>
              双色球分析
              <span class="title-icon">🔵</span>
            </template>
            <template v-else>
              <span class="title-icon">🟡</span>
              大乐透分析
              <span class="title-icon">🟣</span>
            </template>
          </h1>
          <p class="hero-subtitle" v-if="activeLottery === 'ssq'">
            多维度概率分析 + <strong>三大分析模型</strong>：整体频率 · 位置概率矩阵 · 时间衰减加权
          </p>
          <p class="hero-subtitle" v-else>
            <strong>5+2</strong> 选号规则下的多模型分析：整体频率 · 位置概率矩阵 · 时间衰减加权
          </p>
        </div>

        <!-- 中间统计行 -->
        <div class="hero-meta" v-if="activeLottery === 'ssq'">
          <div class="meta-item">
            <span class="meta-value">6+1</span>
            <span class="meta-label">玩法</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-value">1–33</span>
            <span class="meta-label">红球</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-value">1–16</span>
            <span class="meta-label">蓝球</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-value">×3</span>
            <span class="meta-label">算法模型</span>
          </div>
        </div>
        <div class="hero-meta" v-else>
          <div class="meta-item">
            <span class="meta-value">5+2</span>
            <span class="meta-label">玩法</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-value">1–35</span>
            <span class="meta-label">前区</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-value">1–12</span>
            <span class="meta-label">后区</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-value">×3</span>
            <span class="meta-label">算法模型</span>
          </div>
        </div>

        <!-- 提示条 -->
        <div class="hero-tip" :class="{ 'tip-dlt': activeLottery === 'dlt' }">
          <el-icon><InfoFilled /></el-icon>
          <span v-if="activeLottery === 'ssq'">加权概率模式为近期开奖数据赋予更高权重，更准确地反映当前走势。</span>
          <span v-else>核心算法框架与双色球共用，已完整适配 5+2 大乐透选号规则。</span>
        </div>

        <!-- 彩种切换 Tab -->
        <div class="hero-tabs">
          <button
            class="hero-tab tab-ssq"
            :class="{ active: activeLottery === 'ssq' }"
            @click="activeLottery = 'ssq'"
          >
            <span class="tab-ball red"></span>
            <span class="tab-ball blue"></span>
            <span class="tab-text">双色球</span>
            <span class="tab-badge">6+1</span>
          </button>
          <button
            class="hero-tab tab-dlt"
            :class="{ active: activeLottery === 'dlt' }"
            @click="activeLottery = 'dlt'"
          >
            <span class="tab-ball yellow"></span>
            <span class="tab-ball purple"></span>
            <span class="tab-text">大乐透</span>
            <span class="tab-badge">5+2</span>
          </button>
          <button
            class="hero-tab tab-query"
            :class="{ active: activeLottery === 'query' }"
            @click="activeLottery = 'query'"
          >
            <el-icon class="search-icon"><Search /></el-icon>
            <span class="tab-text">中奖查询</span>
            <span class="tab-badge">验奖</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 子面板 -->
    <SSQPanel v-if="activeLottery === 'ssq'" />
    <DLTPanel v-else-if="activeLottery === 'dlt'" />
    <WinQueryPanel v-else-if="activeLottery === 'query'" />

    <!-- 底部提示 -->
    <div class="footer-note">
      <el-icon><WarningFilled /></el-icon>
      分析结果仅供娱乐参考，历史数据不代表未来开奖结果。请理性购彩，量力而行。
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { InfoFilled, WarningFilled, Search } from '@element-plus/icons-vue'
import SSQPanel from './SSQPanel.vue'
import DLTPanel from './DLTPanel.vue'
import WinQueryPanel from './WinQueryPanel.vue'

const activeLottery = ref('ssq')
</script>

<style lang="scss" scoped>
// ========== 全局变量 ==========
$bg: #f1f5f9;
$card-bg: #ffffff;
$text-primary: #0f172a;
$text-secondary: #475569;
$text-muted: #94a3b8;
$border: #e2e8f0;
$radius-sm: 12px;
$radius-md: 20px;
$radius-lg: 28px;

.lottery-selector {
  padding: 0;
  max-width: 1520px;
  margin: 0 auto;
  min-height: 100vh;
  background: $bg;

  @media (min-width: 768px) {
    padding: 20px 28px;
  }
}

// ========== Hero ==========
.hero {
  position: relative;
  background: linear-gradient(160deg, #1a0a2e 0%, #2d1045 30%, #4a1942 60%, #7f1d1d 100%);
  overflow: hidden;
  border-radius: 0;
  color: #fff;
  transition: background 0.5s ease;

  @media (min-width: 768px) {
    border-radius: $radius-lg;
  }

  &.hero-dlt {
    background: linear-gradient(160deg, #0c0a2e 0%, #1e1b4b 30%, #312e81 60%, #4338ca 100%);
  }
}

// 背景装饰圆
.hero-bg-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  .hero-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.08;
    &.c1 {
      width: 500px; height: 500px;
      background: #ef4444;
      top: -200px; right: -150px;
    }
    &.c2 {
      width: 300px; height: 300px;
      background: #8b5cf6;
      bottom: -100px; left: -80px;
    }
    &.c3 {
      width: 200px; height: 200px;
      background: #f59e0b;
      top: 40%; right: 10%;
    }
  }
}

.hero-inner {
  position: relative;
  z-index: 1;
  padding: 28px 20px 24px;

  @media (min-width: 768px) {
    padding: 44px 44px 36px;
  }
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 16px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #fca5a5;
  margin-bottom: 18px;
  backdrop-filter: blur(6px);

  @media (min-width: 768px) {
    font-size: 12px;
    padding: 6px 20px;
  }

  &.tag-dlt {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.35);
    color: #a5b4fc;
  }

  .tag-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #ef4444;
    &.tag-dlt & { background: #818cf8; }
  }
}

.hero-title {
  font-size: clamp(26px, 5vw, 44px);
  font-weight: 800;
  margin: 0 0 14px;
  line-height: 1.15;
  letter-spacing: -0.03em;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  .title-icon {
    font-size: clamp(22px, 4vw, 36px);
    line-height: 1;
  }
}

.hero-subtitle {
  font-size: 13px;
  opacity: 0.72;
  line-height: 1.7;
  margin: 0 0 20px;
  max-width: 640px;
  font-weight: 400;

  @media (min-width: 768px) {
    font-size: 15px;
    margin-bottom: 24px;
  }

  strong {
    opacity: 1;
    color: #fff;
    font-weight: 700;
  }
}

// 统计行
.hero-meta {
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: wrap;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: $radius-md;
  padding: 12px 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);

  @media (min-width: 768px) {
    padding: 16px 28px;
    gap: 0;
  }
}

.meta-item {
  flex: 1;
  min-width: 70px;
  text-align: center;
  padding: 4px 8px;
}

.meta-value {
  display: block;
  font-size: clamp(16px, 3vw, 24px);
  font-weight: 800;
  line-height: 1.2;
}

.meta-label {
  display: block;
  font-size: 10px;
  opacity: 0.55;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;

  @media (min-width: 768px) {
    font-size: 11px;
  }
}

.meta-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
}

// 提示条
.hero-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: $radius-sm;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
  backdrop-filter: blur(4px);

  @media (min-width: 768px) {
    padding: 12px 20px;
    font-size: 13px;
    border-radius: 16px;
  }

  &.tip-dlt {
    background: rgba(167, 139, 250, 0.12);
    border-color: rgba(167, 139, 250, 0.2);
  }
}

// 切换按钮
.hero-tabs {
  display: flex;
  gap: 6px;

  @media (min-width: 768px) {
    gap: 14px;
  }
}

.hero-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 6px;
  border: 1.5px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.75);
  border-radius: 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  backdrop-filter: blur(4px);
  position: relative;
  overflow: hidden;

  @media (min-width: 768px) {
    flex: none;
    min-width: 240px;
    gap: 8px;
    padding: 14px 24px;
    font-size: 14px;
    border-radius: 18px;
  }

  // 双色球 — 红色系
  &.tab-ssq {
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.35), rgba(185, 28, 28, 0.3));
    border-color: rgba(239, 68, 68, 0.25);
    color: rgba(255, 255, 255, 0.85);
    &:hover {
      border-color: rgba(239, 68, 68, 0.55);
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.45), rgba(220, 38, 38, 0.4));
      color: #fca5a5;
    }
    &.active {
      background: linear-gradient(135deg, rgba(220, 38, 38, 0.9), rgba(185, 28, 28, 0.85));
      border-color: #dc2626;
      color: #fff;
      box-shadow: 0 8px 30px rgba(220, 38, 38, 0.4);
    }
  }

  // 大乐透 — 紫色系
  &.tab-dlt {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(79, 70, 229, 0.28));
    border-color: rgba(99, 102, 241, 0.3);
    color: rgba(255, 255, 255, 0.85);
    &:hover {
      border-color: rgba(99, 102, 241, 0.55);
      background: linear-gradient(135deg, rgba(129, 140, 248, 0.45), rgba(99, 102, 241, 0.4));
      color: #a5b4fc;
    }
    &.active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(79, 70, 229, 0.85));
      border-color: #6366f1;
      color: #fff;
      box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4);
    }
  }

  // 中奖查询 — 绿色系
  &.tab-query {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.28));
    border-color: rgba(16, 185, 129, 0.3);
    color: rgba(255, 255, 255, 0.85);
    &:hover {
      border-color: rgba(16, 185, 129, 0.55);
      background: linear-gradient(135deg, rgba(52, 211, 153, 0.45), rgba(16, 185, 129, 0.4));
      color: #6ee7b7;
    }
    &.active {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.85));
      border-color: #10b981;
      color: #fff;
      box-shadow: 0 8px 30px rgba(16, 185, 129, 0.4);
    }
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  &.active {
    transform: translateY(-2px);
  }

  .tab-ball {
    display: none;
    @media (min-width: 768px) {
      display: inline-block;
      width: 12px; height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
      &.red { background: #ef4444; }
      &.blue { background: #3b82f6; }
      &.yellow { background: #f59e0b; }
      &.purple { background: #8b5cf6; }
    }
  }

  .search-icon {
    display: none;
    @media (min-width: 768px) {
      display: inline-flex;
    }
  }

  .tab-text {
    white-space: nowrap;
  }

  .tab-badge {
    display: none;
    @media (min-width: 768px) {
      display: inline-block;
      font-size: 11px;
      padding: 3px 10px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 100px;
      font-weight: 500;
      white-space: nowrap;
    }
  }
}

// ========== Footer ==========
.footer-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 24px 12px;
  text-align: center;
  font-size: 11px;
  color: $text-muted;
  background: $card-bg;
  padding: 14px 18px;
  border-radius: 16px;
  border: 1px solid $border;
  line-height: 1.5;

  @media (min-width: 768px) {
    margin: 36px 0;
    font-size: 12px;
    padding: 16px 28px;
    border-radius: 20px;
  }
}
</style>

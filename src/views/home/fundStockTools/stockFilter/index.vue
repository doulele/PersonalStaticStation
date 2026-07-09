<template>
  <div class="stock-selector">
    <!-- 头部 Hero -->
    <div class="hero" :class="{ 'hero-dadao': activeModel === 'dadao' }">
      <div class="hero-top">
        <h1 class="hero-title">
          <span v-if="activeModel === 'yaogu'">🔥 妖股潜力筛选</span>
          <span v-else>⚡ 大道七线 · 智能解盘</span>
          <span v-if="activeModel === 'yaogu'" class="hero-badge yaogu-badge">多因子量化模型</span>
          <span v-else class="hero-badge dadao-badge">七线支撑压力</span>
          <small v-if="activeModel === 'yaogu'">换手率 · 量比 · 动量 · 题材热度</small>
          <small v-else>金叉死叉 · RSI · MACD · 量价关系</small>
        </h1>
      </div>
      <p class="hero-desc" v-if="activeModel === 'yaogu'">
        基于换手率、量比、流通市值、动量、题材热度等多因子体系，实时筛选A股中具备妖股潜力的标的。数据来源：东方财富板块行情（粗筛）+ 腾讯日K线（深度评分）。
      </p>
      <p class="hero-desc" v-else>
        基于通子金叉/死叉 | 七线支撑压力 | RSI | MACD | 量价关系 —— 点击指标ⓘ 查看含义与操作建议
      </p>
      <div class="model-tabs">
        <button
          class="model-tab yaogu-tab"
          :class="{ active: activeModel === 'yaogu' }"
          @click="activeModel = 'yaogu'"
        >🔥 妖股潜力筛选</button>
        <button
          class="model-tab dadao-tab"
          :class="{ active: activeModel === 'dadao' }"
          @click="activeModel = 'dadao'"
        >⚡ 大道七线筛选</button>
      </div>
    </div>

    <YaoGuPanel v-if="activeModel === 'yaogu'" />
    <DaDaoQiXianPanel v-else-if="activeModel === 'dadao'" />

    <div class="footer-note">
      ⚠️ 数据来自东方财富/腾讯，实时计算。历史业绩不代表未来，投资需谨慎。
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import YaoGuPanel from './YaoGuPanel.vue'
import DaDaoQiXianPanel from './DaDaoQiXianPanel.vue'

const activeModel = ref('yaogu')
</script>

<style scoped>
.stock-selector {
  padding: 8px;
  max-width: 1500px;
  margin: 0 auto;
  min-height: 100vh;
  background: #f0f4f8;
}

/* 夜间模式 */
:global(html.dark-mode) {
  .stock-selector {
    background: #000000;
  }
  .footer-note {
    background: #1e1e2e;
    color: #94a3b8;
    box-shadow: none;
  }
}

/* ========== Hero 头部 ========== */
.hero {
  background: linear-gradient(135deg, #141b2b 0%, #1f2a3e 100%);
  border-radius: 20px;
  padding: 18px 16px;
  margin-bottom: 14px;
  color: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  transition: background 0.3s ease;
}
.hero-dadao {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.hero-top {
  margin-bottom: 8px;
}

.hero-title {
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 0;
  line-height: 1.4;
}

.hero-badge {
  padding: 3px 10px;
  border-radius: 30px;
  font-size: 0.65rem;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.3px;
}
.hero-badge.yaogu-badge {
  background: #f97316;
}
.hero-badge.dadao-badge {
  background: #3b82f6;
}

.hero-title small {
  font-size: 0.6rem;
  background: rgba(255, 255, 255, 0.12);
  padding: 3px 10px;
  border-radius: 30px;
  white-space: nowrap;
}

.hero-desc {
  margin-top: 10px;
  opacity: 0.85;
  font-size: 0.7rem;
  line-height: 1.6;
}
.hero-desc strong {
  color: #fff;
  opacity: 1;
}

/* 模型切换按钮 */
.model-tabs {
  margin-top: 18px;
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
}
.model-tab {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  padding: 7px 12px;
  border-radius: 30px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  outline: none;
  flex: 1;
  text-align: center;
  white-space: nowrap;
}
.model-tab:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
}
.model-tab.active.yaogu-tab {
  background: #f97316;
  border-color: #f97316;
  color: #fff;
  box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35);
  transform: translateY(-1px);
}
.model-tab.active.dadao-tab {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
  transform: translateY(-1px);
}

/* ========== Footer ========== */
.footer-note {
  margin-top: 20px;
  text-align: center;
  font-size: 0.62rem;
  color: #6b7f93;
  background: #fff;
  padding: 12px 16px;
  border-radius: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

/* ========== PC 端优化 ========== */
@media (min-width: 768px) {
  .stock-selector { padding: 24px; }
  .hero {
    border-radius: 30px;
    padding: 30px 36px;
    margin-bottom: 28px;
  }
  .hero-title { font-size: 1.7rem; }
  .hero-badge { padding: 5px 16px; font-size: 0.8rem; }
  .hero-title small { font-size: 0.72rem; padding: 5px 14px; }
  .hero-desc { font-size: 0.88rem; }
  .model-tab { padding: 9px 22px; font-size: 0.84rem; flex: none; max-width: 200px; }
  .footer-note { margin-top: 36px; font-size: 0.72rem; padding: 16px 24px; }
}
</style>

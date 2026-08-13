<template>
  <div class="stock-selector">
    <!-- 头部 Hero -->
    <div class="hero" :class="{ 'hero-dadao': activeModel === 'dadao' }">
      <div class="hero-top">
        <h1 class="hero-title">
          <span v-if="activeModel === 'yaogu'">🔥 妖股潜力筛选</span>
          <span v-else-if="activeModel === 'normal'">🎯 普通股票筛选</span>
          <span v-else>⚡ 大道七线 · 智能解盘</span>
          <span v-if="activeModel === 'yaogu'" class="hero-badge yaogu-badge">多因子量化模型</span>
          <span v-else-if="activeModel === 'normal'" class="hero-badge normal-badge">通用条件选股</span>
          <span v-else class="hero-badge dadao-badge">七线支撑压力</span>
          <small v-if="activeModel === 'yaogu'">换手率 · 量比 · 动量 · 题材热度</small>
          <small v-else-if="activeModel === 'normal'">价格 · 估值 · 量能 · 市值</small>
          <small v-else>金叉死叉 · RSI · MACD · 量价关系</small>
        </h1>
      </div>
      <p class="hero-desc" v-if="activeModel === 'yaogu'">
        基于换手率、量比、流通市值、动量、题材热度等多因子体系，实时筛选A股中具备妖股潜力的标的。数据来源：东方财富板块行情（粗筛）+ 腾讯日K线（深度评分）。
      </p>
      <p class="hero-desc" v-else-if="activeModel === 'normal'">
        通用条件选股：支持最新价、涨跌幅、换手率、量比、总市值、成交额、动态PE、市净率等多条件自由组合，一次拉取全市场实时行情快速过滤，适合寻找低估值蓝筹、放量异动、超跌反弹等各类标的。
      </p>
      <p class="hero-desc" v-else>
        基于通子金叉/死叉 | 七线支撑压力 | RSI | MACD | 量价关系 —— 点击指标ⓘ 查看含义与操作建议
      </p>
      <div class="model-tabs">
        <button
          class="model-tab normal-tab"
          :class="{ active: activeModel === 'normal' }"
          @click="activeModel = 'normal'"
        >🎯 普通股票筛选</button>
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
    <NormalStockPanel v-else-if="activeModel === 'normal'" />
    <DaDaoQiXianPanel v-else-if="activeModel === 'dadao'" />

    <div class="footer-note">
      ⚠️ 数据来自东方财富/腾讯，实时计算。历史业绩不代表未来，投资需谨慎。
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import YaoGuPanel from './YaoGuPanel.vue'
import NormalStockPanel from './NormalStockPanel.vue'
import DaDaoQiXianPanel from './DaDaoQiXianPanel.vue'

const activeModel = ref('normal')
</script>

<style scoped src="./index.scss"></style>

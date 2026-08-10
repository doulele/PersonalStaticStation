<template>
  <div class="fund-selector">
    <!-- 头部 Hero -->
    <div class="hero" :class="{ 'hero-aggressive': activeModel === 'aggressive' }">
      <div class="hero-top">
        <h1 class="hero-title">
          <span v-if="activeModel === 'stable'">🛡️ 稳健长期型 · 穿越周期模型</span>
          <span v-else-if="activeModel === 'bond'">💰 固收纯债型 · 安全垫模型</span>
          <span v-else>⚡ 进取热点型 · 势头改善潜力模型</span>
          <span v-if="activeModel === 'aggressive'" class="hero-badge">动量捕捉 · 起势识别</span>
          <span v-else-if="activeModel === 'bond'" class="hero-badge bond-badge">极低回撤 · 稳定收息</span>
          <span v-else class="hero-badge stable-badge">低回撤 · 长期价值</span>
          <small v-if="activeModel === 'aggressive'">避免追高，捕捉排名回升信号</small>
          <small v-else-if="activeModel === 'bond'">纯债优选，稳健配置首选</small>
          <small v-else>精选稳健标的，追求长期复利</small>
        </h1>
      </div>
      <p class="hero-desc" v-if="activeModel === 'stable'">
        侧重低回撤、长期年化收益、资深经理。<strong>评分权重</strong>：年化收益30% + 最大回撤30% + 夏普20% + 经理年限10% + 规模10%。
      </p>
      <p class="hero-desc" v-else-if="activeModel === 'bond'">
        专注纯债类基金，排除可转债/QDII/货币。<strong>评分权重</strong>：最大回撤30% + 年化收益25% + 夏普比率20% + 回撤修复天数15% + 规模5% + 成立年限5%。
      </p>
      <p class="hero-desc" v-else>
        <strong>势头改善分</strong> = 近1月收益动量(60%) + 近3月相对近6月加速度(40%)。分数越高代表近期趋势由弱转强，处于起势阶段。
      </p>
      <div class="hero-insight" v-if="activeModel === 'aggressive'">
        💡 当一只基金过去3个月涨幅很大但近1月趋缓 → 势头改善分降低；反之，前期落后但近期加速上升 → 高潜力值。
      </div>
      <div class="hero-insight bond-insight" v-else-if="activeModel === 'bond'">
        💡 债基回撤通常<3%，核心看长期年化是否跑赢银行理财（>3%），夏普比率越高代表单位风险收益越好，回撤修复快说明风控强。
      </div>
      <div class="hero-insight stable-insight" v-else>
        💡 关注长期年化收益高且回撤控制优秀的基金，夏普比率越高代表收益风险比越佳。
      </div>
      <div class="model-tabs">
        <button
          class="model-tab"
          :class="{ active: activeModel === 'stable' }"
          @click="activeModel = 'stable'"
        >🛡️ 稳健长期型</button>
        <button
          class="model-tab bond-tab"
          :class="{ active: activeModel === 'bond' }"
          @click="activeModel = 'bond'"
        >💰 固收纯债型</button>
        <button
          class="model-tab"
          :class="{ active: activeModel === 'aggressive' }"
          @click="activeModel = 'aggressive'"
        >⚡ 进取热点型</button>
      </div>
    </div>

    <StableFundPanel v-if="activeModel === 'stable'" />
    <BondFundPanel v-else-if="activeModel === 'bond'" />
    <AggressiveFundPanel v-else-if="activeModel === 'aggressive'" />

    <div class="footer-note">
      ⚠️ 数据来自天天基金，实时计算。历史业绩不代表未来，投资需谨慎。
    </div>
  </div>
</template>

<script setup>
  import { ref, onUnmounted } from 'vue'
  import StableFundPanel from './StableFundPanel.vue'
  import BondFundPanel from './BondFundPanel.vue'
  import AggressiveFundPanel from './AggressiveFundPanel.vue'
  import { cancelAllRequests } from './utils.js'

  const activeModel = ref('stable')

  onUnmounted(() => {
    // 离开页面时取消所有进行中的请求
    cancelAllRequests()
    console.log('[FundFilter] 页面已卸载，已取消所有请求')
  })
</script>

<style scoped src="./index.scss"></style>

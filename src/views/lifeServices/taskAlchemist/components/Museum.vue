<template>
  <div class="museum-page">
    <!-- 成就统计 -->
    <div class="museum-header">
      <div class="museum-stat">
        <span class="museum-stat-num">{{ unlockedCount }}</span>
        <span class="museum-stat-label">已解锁</span>
      </div>
      <div class="museum-stat">
        <span class="museum-stat-num">{{ fragments.length }}</span>
        <span class="museum-stat-label">记忆碎片</span>
      </div>
      <div class="museum-stat">
        <span class="museum-stat-num">{{ cards.length }}</span>
        <span class="museum-stat-label">合成卡牌</span>
      </div>
    </div>

    <!-- 成就卡牌陈列架 -->
    <div class="museum-section">
      <h3 class="museum-section-title">成就徽章</h3>
      <div class="achievement-grid">
        <div
          v-for="ach in achievements"
          :key="ach.id"
          class="achievement-card"
          :class="{ unlocked: ach.unlocked, legendary: ach.isLegendary }"
        >
          <div class="ach-icon-wrap">
            <span v-if="ach.unlocked" class="ach-icon">{{ ach.icon }}</span>
            <span v-else class="ach-icon shadow">❓</span>
          </div>
          <div class="ach-info">
            <span class="ach-name">{{ ach.unlocked ? ach.name : '神秘剪影' }}</span>
            <span v-if="!ach.unlocked" class="ach-hint">{{ ach.desc }}</span>
            <span v-else class="ach-date">解锁于 {{ formatDate(ach.unlockedAt) }}</span>
          </div>
          <div v-if="!ach.unlocked" class="ach-progress">
            <el-progress :percentage="Math.round(ach.progress / ach.target * 100)" :show-text="false" :stroke-width="4" />
            <span class="ach-progress-text">{{ ach.progress }}/{{ ach.target }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 记忆碎片 -->
    <div class="museum-section" v-if="fragments.length > 0">
      <h3 class="museum-section-title">✨ 记忆碎片</h3>
      <div class="fragment-grid">
        <div v-for="f in fragments" :key="f.id" class="fragment-chip">
          <span>{{ f.icon }}</span>
          <span>{{ f.name }}</span>
        </div>
      </div>
    </div>

    <!-- 合成卡牌 -->
    <div class="museum-section" v-if="cards.length > 0">
      <h3 class="museum-section-title">🃏 传奇卡牌</h3>
      <div class="card-grid">
        <div v-for="c in cards" :key="c.id" class="card-item">
          <span class="card-icon">{{ c.icon }}</span>
          <span class="card-name">{{ c.name }}</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="achievements.length === 0" class="museum-empty">
      <span class="empty-icon">🏛️</span>
      <p>博物志尚未开启，开始完成任务来收集成就吧！</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  achievements: { type: Array, default: () => [] },
  fragments: { type: Array, default: () => [] },
  cards: { type: Array, default: () => [] }
})

const unlockedCount = computed(() => props.achievements.filter(a => a.unlocked).length)

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
</script>

<style lang="scss" scoped src="./Museum.scss"></style>

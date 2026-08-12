<template>
  <div class="report-page">
    <!-- 今日统计 -->
    <div class="report-card today-card">
      <h3 class="report-title">今日炼金报告</h3>
      <div class="report-grid">
        <div class="report-item">
          <span class="report-value">{{ stats.completed }}</span>
          <span class="report-label">已完成</span>
        </div>
        <div class="report-item">
          <span class="report-value green">{{ stats.aheadCount }}</span>
          <span class="report-label">提前完成</span>
        </div>
        <div class="report-item">
          <span class="report-value red">{{ stats.overdue }}</span>
          <span class="report-label">逾期</span>
        </div>
        <div class="report-item">
          <span class="report-value gold">{{ stats.freeCoins }}</span>
          <span class="report-label">自由币</span>
        </div>
        <div class="report-item">
          <span class="report-value">{{ stats.partnerMinutes }}</span>
          <span class="report-label">陪伴分钟</span>
        </div>
        <div class="report-item">
          <span class="report-value">{{ stats.total }}</span>
          <span class="report-label">总任务</span>
        </div>
      </div>
    </div>

    <!-- 周精力热力图 -->
    <div class="report-card">
      <h3 class="report-title">本周精力热力图</h3>
      <div class="heatmap">
        <div v-for="day in heatmap" :key="day.date" class="heatmap-day">
          <span class="heatmap-label">{{ day.day }}</span>
          <div class="heatmap-bar-wrap">
            <div
              class="heatmap-bar"
              :style="{ width: (day.count / maxCount) * 100 + '%' }"
              :class="`level-${day.level}`"
            >
              <span v-if="day.count > 0" class="heatmap-count">{{ day.count }}个</span>
            </div>
          </div>
        </div>
      </div>
      <p v-if="maxCount === 0" class="heatmap-empty">本周还没有完成任务，开始你的炼金之旅吧！</p>
    </div>

    <!-- 历史日报 -->
    <div class="report-card" v-if="history.length > 0">
      <h3 class="report-title">📜 历史日报</h3>
      <div class="history-list">
        <div v-for="r in history" :key="r.date" class="history-item">
          <span class="history-date">{{ formatDate(r.date) }}</span>
          <div class="history-stats">
            <span>✅ {{ r.completed }}/{{ r.total }}</span>
            <span>⏰ 提前 {{ r.aheadCount }}</span>
            <span>🪙 {{ r.freeCoins }}币</span>
          </div>
          <span class="history-summary">{{ r.summary }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  stats: { type: Object, default: () => ({}) },
  history: { type: Array, default: () => [] },
  heatmap: { type: Array, default: () => [] }
})

const maxCount = computed(() => Math.max(...props.heatmap.map(d => d.count), 1))

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
</script>

<style lang="scss" scoped src="./DailyReport.scss"></style>

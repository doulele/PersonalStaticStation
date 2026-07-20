<template>
  <div class="report-page">
    <!-- 今日统计 -->
    <div class="report-card today-card">
      <h3 class="report-title">📊 今日炼金报告</h3>
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
      <h3 class="report-title">🔥 本周精力热力图</h3>
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

<style lang="scss" scoped>
.report-page { }

.report-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px;
  margin-bottom: 20px;
}
.today-card {
  background: linear-gradient(135deg, #fef3c7, #fffdf0);
  border-color: #d4a843;
}
.report-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 16px;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.report-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.report-value {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  &.green { color: #16a34a; }
  &.red { color: #ef4444; }
  &.gold { color: #d4a843; }
}
.report-label { font-size: 12px; color: #94a3b8; }

// 热力图
.heatmap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.heatmap-day {
  display: flex;
  align-items: center;
  gap: 12px;
}
.heatmap-label {
  width: 24px;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  text-align: center;
}
.heatmap-bar-wrap {
  flex: 1;
  height: 28px;
  background: #f1f5f9;
  border-radius: 6px;
  overflow: hidden;
}
.heatmap-bar {
  height: 100%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  transition: width 0.5s ease;
  min-width: 0;
  &.level-1 { background: #fef3c7; }
  &.level-2 { background: #fde68a; }
  &.level-3 { background: #f0c060; }
  &.level-4 { background: #d4a843; }
}
.heatmap-count { font-size: 11px; color: #92400e; font-weight: 600; white-space: nowrap; }
.heatmap-empty {
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  padding: 20px;
  margin: 0;
}

// 历史
.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 10px;
  flex-wrap: wrap;
}
.history-date {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
}
.history-stats {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #64748b;
}
.history-summary {
  font-size: 12px;
  color: #94a3b8;
  flex: 1;
  text-align: right;
  min-width: 150px;
}

@media (max-width: 768px) {
  .report-card { padding: 16px; }
  .report-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .report-value { font-size: 22px; }
  .history-item { flex-direction: column; align-items: flex-start; gap: 6px; }
  .history-summary { text-align: left; }
}

html.dark-mode & {
  .report-card { background: #1e1e2e; border-color: #2d2d4a; }
  .today-card { background: #2d2a1a; border-color: #f0c060; }
  .report-title { color: #e2dee9; }
  .report-value { color: #e2dee9; }
  .heatmap-bar-wrap { background: #252540; }
  .history-item { background: #252540; }
  .history-date { color: #e2dee9; }
  .history-summary { color: #64748b; }
}
</style>

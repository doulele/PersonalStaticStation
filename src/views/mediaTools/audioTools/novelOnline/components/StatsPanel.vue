<template>
  <PanelBase title="阅读统计" @close="$emit('close')">
    <div class="stats-summary">
      <div class="stat-item">
        <b>{{ fmtMin(totalMs) }}</b>
        <span>累计阅读(分钟)</span>
      </div>
      <div class="stat-item">
        <b>{{ fmtMin(todayMs) }}</b>
        <span>今日</span>
      </div>
      <div class="stat-item">
        <b>{{ activeDays }}</b>
        <span>活跃天数</span>
      </div>
    </div>

    <div class="stats-heat">
      <p class="stats-section-title">最近 12 周打卡热力图</p>
      <div class="heat-grid">
        <div
          v-for="d in heatDays"
          :key="d.date"
          class="heat-cell"
          :style="{ background: heatColor(d.ms) }"
          :title="`${d.date} · ${fmtMin(d.ms)} 分钟`"
        ></div>
      </div>
      <div class="heat-legend">
        <span>少</span>
        <i v-for="c in legendColors" :key="c" :style="{ background: c }"></i>
        <span>多</span>
      </div>
    </div>

    <div class="stats-weekly">
      <p class="stats-section-title">本周小结</p>
      <ul class="weekly-list">
        <li>本周阅读 <b>{{ fmtMin(weekMs) }}</b> 分钟，共 <b>{{ weekActiveDays }}</b> 天</li>
        <li>累计阅读 <b>{{ fmtMin(totalMs) }}</b> 分钟，打卡 <b>{{ activeDays }}</b> 天</li>
        <li>共收藏 <b>{{ noteCount }}</b> 条摘录、<b>{{ shelfCount }}</b> 本书在书架</li>
      </ul>
    </div>
  </PanelBase>
</template>

<script setup>
import { computed } from 'vue'
import PanelBase from './PanelBase.vue'
import { stats, statsOfDays, totalStatsMs, notes, shelf, dateStr } from '../store'

defineEmits(['close'])

const DAYS = 84 // 12 周

function fmtMin(ms) {
  return Math.round((ms || 0) / 60000)
}

const todayMs = computed(() => stats[dateStr()] || 0)
const totalMs = computed(() => totalStatsMs())
const activeDays = computed(() => Object.keys(stats).filter((d) => (stats[d] || 0) > 60000).length)

const heatDays = computed(() => statsOfDays(DAYS))

function heatColor(ms) {
  if (!ms) return 'var(--heat-0, #eee)'
  const min = ms / 60000
  if (min < 10) return 'var(--heat-1, #c8e6c9)'
  if (min < 30) return 'var(--heat-2, #81c784)'
  if (min < 60) return 'var(--heat-3, #4caf50)'
  return 'var(--heat-4, #2e7d32)'
}

const legendColors = [heatColor(0), heatColor(5 * 60000), heatColor(20 * 60000), heatColor(45 * 60000), heatColor(90 * 60000)]

const weekDays = computed(() => {
  const now = new Date()
  const day = (now.getDay() + 6) % 7 // 周一为起点
  const out = []
  for (let i = 0; i < 7; i++) {
    out.push(dateStr(new Date(now.getTime() - (day - i) * 86400000)))
  }
  return out
})
const weekMs = computed(() => weekDays.value.reduce((a, d) => a + (stats[d] || 0), 0))
const weekActiveDays = computed(() => weekDays.value.filter((d) => (stats[d] || 0) > 60000).length)
const noteCount = computed(() => notes.items.length)
const shelfCount = computed(() => shelf.items.length)
</script>

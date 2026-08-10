<template>
  <div class="archive-stats">
    <div class="stats-row">
      <!-- 存储水位表 -->
      <div class="stat-card storage-card">
        <h4 class="stat-title">💾 存储空间</h4>
        <div class="storage-visual">
          <div class="storage-bar-wrap">
            <div class="storage-bar">
              <div class="bar-segment s-level" :style="{ width: sPercent + '%' }" title="S级"></div>
              <div class="bar-segment a-level" :style="{ width: aPercent + '%' }" title="A级"></div>
              <div class="bar-segment b-level" :style="{ width: bPercent + '%' }" title="B级"></div>
            </div>
            <div class="storage-legend">
              <span class="legend-item s">🟡 S级 {{ sCount }}个</span>
              <span class="legend-item a">⚪ A级 {{ aCount }}个</span>
              <span class="legend-item b">🟤 B级 {{ bCount }}个</span>
            </div>
          </div>
          <div class="storage-water-tank">
            <svg viewBox="0 0 80 120" class="tank-svg">
              <defs>
                <clipPath id="tankClip">
                  <rect x="10" y="10" width="60" height="100" rx="8" />
                </clipPath>
              </defs>
              <rect x="10" y="10" width="60" height="100" rx="8" fill="#e2e8f0" />
              <rect x="10" :y="waterY" width="60" :height="waterH" rx="8" fill="url(#waterGrad)" clip-path="url(#tankClip)" class="water-fill" />
              <rect x="10" y="10" width="60" height="100" rx="8" fill="none" stroke="#94a3b8" stroke-width="1.5" />
              <defs>
                <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#14b8a6" />
                  <stop offset="100%" stop-color="#0d9488" />
                </linearGradient>
              </defs>
            </svg>
            <div class="tank-label">{{ usagePercent }}%</div>
          </div>
        </div>
        <p class="storage-text">{{ formatSize(storageUsed) }} / {{ formatSize(storageLimit) }} MB</p>
      </div>

      <!-- 快速统计 -->
      <div class="stat-card">
        <h4 class="stat-title">📊 档案概览</h4>
        <div class="quick-stats">
          <div class="quick-stat">
            <span class="quick-num">{{ files.length }}</span>
            <span class="quick-label">文件总数</span>
          </div>
          <div class="quick-stat">
            <span class="quick-num">{{ coldCount }}</span>
            <span class="quick-label">冷存储</span>
          </div>
          <div class="quick-stat">
            <span class="quick-num">{{ versionedCount }}</span>
            <span class="quick-label">有版本链</span>
          </div>
          <div class="quick-stat">
            <span class="quick-num">{{ recentCount }}</span>
            <span class="quick-label">近7天上新</span>
          </div>
        </div>
      </div>

      <!-- 保鲜提醒 -->
      <div class="stat-card" v-if="expiringFiles.length > 0">
        <h4 class="stat-title">⏰ 保鲜提醒</h4>
        <div class="expiring-list">
          <div v-for="f in expiringFiles.slice(0, 5)" :key="f.id" class="expiring-item">
            <span class="expiring-icon">{{ f.securityLevel === 'S' ? '🔴' : f.securityLevel === 'A' ? '🟡' : '🟢' }}</span>
            <span class="expiring-name">{{ f.name }}</span>
            <span class="expiring-days">{{ daysUntil(f.freshUntil) }}天后到期</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  files: { type: Array, default: () => [] },
  storageUsed: { type: Number, default: 0 },
  storageLimit: { type: Number, default: 500 }
})

const sCount = computed(() => props.files.filter(f => f.securityLevel === 'S').length)
const aCount = computed(() => props.files.filter(f => f.securityLevel === 'A').length)
const bCount = computed(() => props.files.filter(f => f.securityLevel === 'B').length)

const totalSize = computed(() => props.files.reduce((s, f) => s + (f.size || 0), 0) || 1)
const sPercent = computed(() => props.files.filter(f => f.securityLevel === 'S').reduce((s, f) => s + (f.size || 0), 0) / totalSize.value * 100)
const aPercent = computed(() => props.files.filter(f => f.securityLevel === 'A').reduce((s, f) => s + (f.size || 0), 0) / totalSize.value * 100)
const bPercent = computed(() => props.files.filter(f => f.securityLevel === 'B').reduce((s, f) => s + (f.size || 0), 0) / totalSize.value * 100)

const usagePercent = computed(() => Math.min(Math.round(props.storageUsed / props.storageLimit * 100), 100))
const waterY = computed(() => 10 + 100 * (1 - usagePercent.value / 100))
const waterH = computed(() => 100 * usagePercent.value / 100)

const coldCount = computed(() => props.files.filter(f => f.isColdStorage).length)
const versionedCount = computed(() => props.files.filter(f => f.versionChain).length)
const recentCount = computed(() => {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return props.files.filter(f => new Date(f.uploadDate).getTime() > weekAgo).length
})

const expiringFiles = computed(() => {
  const now = Date.now()
  const soon = now + 30 * 24 * 60 * 60 * 1000
  return props.files.filter(f => f.freshUntil && new Date(f.freshUntil).getTime() < soon)
})

function formatSize(mb) {
  if (mb < 1) return (mb * 1024).toFixed(0) + ' KB'
  return mb.toFixed(1) + ' MB'
}

function daysUntil(dateStr) {
  if (!dateStr) return 0
  return Math.max(0, Math.ceil((new Date(dateStr) - Date.now()) / (1000 * 60 * 60 * 24)))
}
</script>

<style lang="scss" scoped src="./ArchiveStats.scss"></style>

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
      <h3 class="museum-section-title">🏆 成就徽章</h3>
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

<style lang="scss" scoped>
.museum-page { }

.museum-header {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}
.museum-stat {
  text-align: center;
  padding: 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}
.museum-stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #d4a843;
  display: block;
}
.museum-stat-label {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.museum-section { margin-bottom: 28px; }
.museum-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 14px;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.achievement-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s;
  &.unlocked {
    background: linear-gradient(135deg, #fef3c7, #fffdf0);
    border-color: #d4a843;
  }
  &.legendary.unlocked {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    border-color: #f0c060;
    box-shadow: 0 2px 12px rgba(212, 168, 67, 0.2);
  }
}
.ach-icon-wrap {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #f1f5f9;
}
.unlocked .ach-icon-wrap { background: #fef3c7; }
.ach-icon { font-size: 24px; }
.ach-icon.shadow { font-size: 24px; opacity: 0.4; filter: grayscale(1); }
.ach-info { flex: 1; min-width: 0; }
.ach-name { font-size: 14px; font-weight: 600; color: #0f172a; display: block; }
.ach-hint { font-size: 12px; color: #94a3b8; display: block; margin-top: 2px; }
.ach-date { font-size: 11px; color: #d4a843; display: block; margin-top: 2px; }
.ach-progress { display: flex; align-items: center; gap: 6px; min-width: 80px; }
.ach-progress-text { font-size: 11px; color: #94a3b8; white-space: nowrap; }

.fragment-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.fragment-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #ede9fe, #f5f3ff);
  border: 1px solid #c4b5fd;
  border-radius: 20px;
  font-size: 13px;
  color: #7c3aed;
}

.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.card-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 2px solid #d4a843;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(212, 168, 67, 0.2);
}
.card-icon { font-size: 28px; }
.card-name { font-size: 15px; font-weight: 700; color: #92400e; }

.museum-empty {
  text-align: center;
  padding: 80px 20px;
  .empty-icon { font-size: 64px; display: block; margin-bottom: 16px; }
  p { color: #94a3b8; font-size: 14px; }
}

@media (max-width: 768px) {
  .museum-header { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .museum-stat { padding: 14px 8px; }
  .museum-stat-num { font-size: 22px; }
  .achievement-grid { grid-template-columns: 1fr; }
}

html.dark-mode & {
  .museum-stat { background: #1e1e2e; border-color: #2d2d4a; }
  .museum-stat-num { color: #f0c060; }
  .museum-section-title { color: #e2dee9; }
  .achievement-card { background: #1e1e2e; border-color: #2d2d4a; }
  .achievement-card.unlocked { background: #2d2a1a; border-color: #f0c060; }
  .ach-name { color: #e2dee9; }
  .ach-icon-wrap { background: #252540; }
  .fragment-chip { background: #252540; border-color: #7c3aed; }
  .card-item { background: #2d2a1a; }
}
</style>

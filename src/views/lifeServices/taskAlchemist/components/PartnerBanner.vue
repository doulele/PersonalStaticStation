<template>
  <div class="partner-banner" :style="{ borderColor: partner.color + '40', background: `linear-gradient(135deg, ${partner.color}08, ${partner.color}15)` }">
    <div class="partner-greeting">
      <span class="partner-emoji">{{ partner.emoji }}</span>
      <div class="greeting-text">
        <p class="greeting-main">{{ greetingText }}</p>
        <p class="greeting-sub">{{ timeTip }}</p>
      </div>
    </div>
    <div class="quick-stats">
      <div class="stat-item">
        <span class="stat-value">{{ stats.completed }}</span>
        <span class="stat-label">已完成</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value gold">{{ stats.freeCoins }}</span>
        <span class="stat-label">自由币</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.aheadCount }}</span>
        <span class="stat-label">提前完成</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  partner: { type: Object, required: true },
  stats: { type: Object, required: true },
  currentHour: { type: Number, default: 0 }
})

const greetingText = computed(() => {
  const h = props.currentHour
  if (h < 6) return '夜深了，炼金术士……'
  if (h < 9) return '早安，新的一天开始了！'
  if (h < 12) return '黄金时段，适合攻坚克难！'
  if (h < 14) return '午间休息，补充精力~'
  if (h < 17) return '下午好，继续炼化任务吧！'
  if (h < 21) return '傍晚了，收拾一下今天的收获~'
  return '晚间时光，适合规划与复盘'
})

const timeTip = computed(() => {
  const h = props.currentHour
  const isGolden = (h >= 9 && h < 11.5) || (h >= 14.5 && h < 17)
  const isSilver = (h >= 12 && h < 14.5) || (h >= 17 && h < 19)
  const isNight = h >= 21 || h < 6
  if (isGolden) return '此时宜做：高能耗任务 🔥'
  if (isSilver) return '此时宜做：低能耗琐事 ☕'
  if (isNight) return '此时宜做：规划与复盘 🌙'
  return '此时宜做：按需安排 ✨'
})
</script>

<style lang="scss" scoped>
.partner-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  border-radius: 16px;
  border: 1px solid;
  margin-bottom: 24px;
  gap: 24px;
}
.partner-greeting {
  display: flex;
  align-items: center;
  gap: 14px;
}
.partner-emoji {
  font-size: 40px;
  line-height: 1;
  animation: bounce 2s infinite;
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.greeting-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.greeting-main {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}
.greeting-sub {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}
.quick-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255,255,255,0.6);
  border-radius: 12px;
  padding: 12px 20px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  &.gold { color: #d4a843; }
}
.stat-label {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
}
.stat-divider {
  width: 1px;
  height: 28px;
  background: #e2e8f0;
}

@media (max-width: 768px) {
  .partner-banner {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
    gap: 12px;
  }
  .partner-emoji { font-size: 32px; }
  .greeting-main { font-size: 14px; }
  .quick-stats {
    width: 100%;
    justify-content: space-around;
    padding: 10px 12px;
  }
  .stat-value { font-size: 18px; }
}

html.dark-mode & {
  .greeting-main { color: #e2dee9; }
  .greeting-sub { color: #94a3b8; }
  .quick-stats { background: rgba(37,37,64,0.6); }
  .stat-value { color: #e2dee9; &.gold { color: #f0c060; } }
  .stat-label { color: #64748b; }
  .stat-divider { background: #2d2d4a; }
}
</style>

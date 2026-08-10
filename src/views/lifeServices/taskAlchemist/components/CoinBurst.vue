<template>
  <div class="coin-burst-overlay" v-if="bursts.length > 0">
    <div
      v-for="b in bursts"
      :key="b.id"
      class="coin-burst"
      :style="{ left: b.x + 'px', top: b.y + 'px' }"
    >
      <div class="burst-coins">
        <span v-for="i in 8" :key="i" class="coin" :style="{ '--angle': (i / 8) * 360 + 'deg' }">🪙</span>
      </div>
      <div class="burst-text">
        <span class="burst-amount">+{{ b.amount }}</span>
        <span v-if="b.label" class="burst-label">{{ b.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const bursts = ref([])
let idCounter = 0

function burst(amount, label = '') {
  const id = ++idCounter
  const x = Math.random() * (window.innerWidth - 200) + 100
  const y = Math.random() * (window.innerHeight - 300) + 150
  bursts.value.push({ id, amount, label, x, y })

  setTimeout(() => {
    bursts.value = bursts.value.filter(b => b.id !== id)
  }, 2000)
}

defineExpose({ burst })
</script>

<style lang="scss" scoped>
.coin-burst-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
}
.coin-burst {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: burstIn 0.5s ease-out, fadeOut 0.5s ease-in 1.5s forwards;
}
.burst-coins {
  position: relative;
  width: 80px;
  height: 80px;
}
.coin {
  position: absolute;
  left: 50%;
  top: 50%;
  font-size: 20px;
  animation: coinFly 1s ease-out forwards;
  transform-origin: center;
}
@keyframes coinFly {
  0% { transform: translate(-50%, -50%) rotate(0deg) scale(0); opacity: 0; }
  30% { opacity: 1; }
  100% {
    transform: translate(
      calc(-50% + cos(var(--angle)) * 60px),
      calc(-50% + sin(var(--angle)) * 60px)
    ) rotate(360deg) scale(0);
    opacity: 0;
  }
}
.burst-text {
  text-align: center;
  margin-top: 4px;
}
.burst-amount {
  font-size: 24px;
  font-weight: 800;
  color: #d4a843;
  text-shadow: 0 2px 8px rgba(212, 168, 67, 0.4);
}
.burst-label {
  display: block;
  font-size: 12px;
  color: #f0c060;
  font-weight: 600;
}
@keyframes burstIn {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes fadeOut {
  to { opacity: 0; transform: translateY(-20px) scale(0.8); }
}
</style>

<template>
  <transition name="float-btn">
    <div
      v-show="visible"
      id="collection-floating-btn"
      class="collection-floating-btn"
      :class="{ 'drag-over': isDragOver, 'has-items': count > 0 }"
      @click.stop="$emit('click')"
    >
      <!-- 拖入涟漪 -->
      <span v-if="collecting" class="ripple"></span>
      <!-- 徽标 -->
      <span v-if="count > 0" class="badge">{{ count }}</span>
      <!-- 图标 -->
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        <polyline v-if="count > 0" points="17 8 10 15 7 12"/>
      </svg>
      <!-- 拖拽提示标签 -->
      <span v-if="count === 0 && !isDragOver" class="drag-hint">拖入此处</span>
      <span v-else-if="isDragOver" class="drag-hint active">松手添加</span>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  count: { type: Number, default: 0 },
  isDragOver: { type: Boolean, default: false },
  visible: { type: Boolean, default: false }
})

defineEmits(['click'])

const collecting = ref(false)

// 数量变化时播放收集动画
watch(() => props.count, (n, o) => {
  if (n > o) {
    collecting.value = true
    setTimeout(() => { collecting.value = false }, 400)
  }
})
</script>

<style lang="scss" scoped>
.collection-floating-btn {
  position: fixed;
  right: 28px;
  top: 100px;
  bottom: auto;
  z-index: 999;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1.5px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 24px rgba(99, 102, 241, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 32px rgba(99, 102, 241, 0.2);
  }
  &:active {
    transform: scale(0.95);
  }

  // 有已选项 → 展开为胶囊
  &.has-items {
    width: auto;
    min-width: 56px;
    height: 48px;
    border-radius: 28px;
    padding: 0 16px;
  }

  // 拖拽悬停态
  &.drag-over {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
    box-shadow: 0 0 0 8px rgba(99, 102, 241, 0.08), 0 8px 36px rgba(99, 102, 241, 0.25);
    transform: scale(1.1);
    animation: btnPulse 0.8s ease-in-out infinite;
  }

  .btn-icon {
    width: 24px;
    height: 24px;
    color: #6366f1;
    flex-shrink: 0;
    transition: all 0.3s;
  }

  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 22px;
    height: 22px;
    border-radius: 11px;
    background: linear-gradient(135deg, #ef4444, #f43f5e);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
    animation: badgePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .drag-hint {
    position: absolute;
    right: 68px;
    white-space: nowrap;
    font-size: 12px;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    padding: 4px 10px;
    border-radius: 8px;
    border: 1px solid rgba(226, 232, 240, 0.6);
    pointer-events: none;
    transition: all 0.3s;

    &.active {
      color: #6366f1;
      border-color: #6366f1;
      background: rgba(99, 102, 241, 0.06);
      font-weight: 600;
    }
  }

  .ripple {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 2px solid #6366f1;
    opacity: 0;
    animation: rippleOut 0.5s ease-out;
  }
}

// 按钮显隐过渡
.float-btn-enter-active { animation: btnSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.float-btn-leave-active { animation: btnSlideUp 0.25s ease-in reverse; }

@keyframes btnSlideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.8); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes btnPulse {
  0%, 100% { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0.08), 0 8px 36px rgba(99, 102, 241, 0.25); }
  50%      { box-shadow: 0 0 0 16px rgba(99, 102, 241, 0.04), 0 8px 40px rgba(99, 102, 241, 0.3); }
}
@keyframes badgePop {
  from { transform: scale(0); }
  to   { transform: scale(1); }
}
@keyframes rippleOut {
  from { opacity: 0.6; transform: scale(1); }
  to   { opacity: 0; transform: scale(1.5); }
}

@media (max-width: 768px) {
  .collection-floating-btn {
    right: 16px;
    top: auto;
    bottom: 24px;
    width: 50px;
    height: 50px;
    &.has-items {
      height: 44px;
      min-width: 50px;
      border-radius: 24px;
      padding: 0 12px;
    }
    .btn-icon { width: 22px; height: 22px; }
    .drag-hint { right: 58px; font-size: 11px; }
  }
}

// ==================== 夜间模式 ====================
:global(html.dark-mode) {
  .collection-floating-btn {
    background: rgba(26, 26, 46, 0.88);
    border-color: rgba(45, 45, 74, 0.8);
    box-shadow: 0 4px 24px rgba(124, 58, 237, 0.15), 0 1px 4px rgba(0, 0, 0, 0.3);

    &.drag-over {
      border-color: #a78bfa;
      background: rgba(124, 58, 237, 0.12);
    }

    .btn-icon { color: #a78bfa; }
    .drag-hint {
      color: #64748b;
      background: rgba(26, 26, 46, 0.9);
      border-color: rgba(45, 45, 74, 0.6);
      &.active { color: #a78bfa; border-color: #a78bfa; background: rgba(124, 58, 237, 0.08); }
    }
  }
}
</style>

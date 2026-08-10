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

<style lang="scss" scoped src="./CollectionFloatingBtn.scss"></style>

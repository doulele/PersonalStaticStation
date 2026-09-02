<template>
  <div class="quote-mask" @click.self="$emit('close')">
    <div class="quote-card-wrap">
      <div class="quote-card" ref="cardEl">
        <div class="quote-cover" :style="coverStyle"></div>
        <div class="quote-body">
          <p class="quote-text">“{{ text }}”</p>
          <p class="quote-book">—— {{ bookTitle || '无名之书' }}<template v-if="chapterTitle"> · {{ chapterTitle }}</template></p>
        </div>
      </div>
      <div class="quote-actions">
        <button class="btn primary" @click="copyCard">复制文字</button>
        <button class="btn ghost" @click="$emit('close')">关闭</button>
      </div>
      <p v-if="copied" class="quote-copied">已复制 ✓</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  bookTitle: { type: String, default: '' },
  chapterTitle: { type: String, default: '' }
})
defineEmits(['close'])

const copied = ref(false)

const coverStyle = computed(() => {
  let h = 0
  for (let i = 0; i < props.bookTitle.length; i++) h = (h * 31 + props.bookTitle.charCodeAt(i)) >>> 0
  const hue = h % 360
  return { background: `linear-gradient(135deg, hsl(${hue}, 60%, 45%), hsl(${(hue + 40) % 360}, 65%, 30%))` }
})

async function copyCard() {
  try {
    await navigator.clipboard.writeText(`“${props.text}”——${props.bookTitle || '无名之书'}`)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    /* ignore */
  }
}
</script>

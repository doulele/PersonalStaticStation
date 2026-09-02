<template>
  <div class="detail-mask" @click.self="$emit('close')">
    <div class="detail-card">
      <div class="detail-cover-wrap">
        <img v-if="book.cover" :src="book.cover" class="detail-cover" alt="" />
        <div v-else class="detail-cover placeholder">{{ (book.title || '书')[0] }}</div>
      </div>
      <div class="detail-info">
        <h2 class="detail-title">{{ book.title }}</h2>
        <p class="detail-author">{{ book.author }}</p>
        <p v-if="book.publisher" class="detail-publisher">{{ book.publisher }}</p>
        <p v-if="book.rating" class="detail-rating">评分 {{ (book.rating / 10).toFixed(1) }}</p>
        <p v-if="book.intro" class="detail-intro">{{ book.intro }}</p>
        <div class="detail-actions">
          <button
            class="btn primary"
            @click="toggleShelf(bookItem)"
          >{{ inShelf ? '已收藏 ✓' : '收藏' }}</button>
          <a
            v-if="book.webId"
            class="btn link"
            :href="`https://weread.qq.com/web/bookDetail/${book.webId}`"
            target="_blank"
            rel="noopener"
          >微信读书中阅读 ↗</a>
          <button class="btn ghost" @click="$emit('close')">关闭</button>
        </div>
        <p class="detail-tip">提示：微信读书书籍受版权保护，需在其站内阅读；公版书籍可在「公版文库」分类免费阅读全文。</p>
      </div>
      <button class="detail-close" @click="$emit('close')">✕</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { isInShelf, toggleShelf } from '../store'

const props = defineProps({
  book: { type: Object, required: true }
})
const emit = defineEmits(['close'])

const bookKey = computed(() => props.book.key || `wr:${props.book.bookId}`)
const bookItem = computed(() => ({ ...props.book, key: bookKey.value }))
const inShelf = computed(() => isInShelf(bookKey.value))
</script>

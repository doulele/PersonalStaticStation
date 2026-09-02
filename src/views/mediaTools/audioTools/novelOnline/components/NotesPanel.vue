<template>
  <PanelBase title="我的摘录" @close="$emit('close')">
    <div v-if="!list.length" class="empty-tip">还没有摘录。阅读时选中文字即可划线摘录。</div>
    <div v-else class="note-list">
      <div v-for="n in list" :key="n.id" class="note-item">
        <p class="note-text">“{{ n.text }}”</p>
        <p class="note-meta">
          {{ n.bookTitle || '未知书' }} · 第 {{ n.chapterIndex + 1 }} 章
          <span class="note-time">{{ fmtTime(n.time) }}</span>
        </p>
        <p v-if="n.comment" class="note-comment">💬 {{ n.comment }}</p>
        <button class="note-del" @click="removeNote(n.id)">删除</button>
      </div>
    </div>
  </PanelBase>
</template>

<script setup>
import { computed } from 'vue'
import PanelBase from './PanelBase.vue'
import { notes, removeNote } from '../store'

defineEmits(['close'])

const list = computed(() => [...notes.items])

function fmtTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<template>
  <div class="question-card">
    <div class="qc-meta">
      <span class="qc-tag" :class="question.type">{{ questionTypeName(question.type) }}</span>
      <span class="qc-level" :style="{ background: levelColor(question.level) }">{{ levelName(question.level) }}</span>
      <span class="qc-cat">{{ catName }}</span>
      <span v-for="t in question.tags" :key="t" class="qc-label">{{ t }}</span>
    </div>

    <h3 class="qc-text markdown-body" v-html="renderedQ"></h3>

    <div class="qc-options">
      <div
        v-for="(opt, oi) in question.options"
        :key="oi"
        class="qc-option"
        :class="{ correct: isCorrectOption(oi) }"
      >
        <span class="qc-letter">{{ String.fromCharCode(65 + oi) }}</span>
        <span class="qc-opt-text">{{ opt }}</span>
        <el-icon v-if="isCorrectOption(oi)" class="qc-check"><CircleCheckFilled /></el-icon>
      </div>
    </div>

    <div class="qc-explain">
      <div class="qc-explain-title">解析</div>
      <div class="qc-explain-text markdown-body" v-html="renderedExplain"></div>
      <a v-if="question.ref" :href="question.ref" target="_blank" rel="noopener" class="qc-ref">
        <el-icon><Link /></el-icon>
        <span>参考文档</span>
      </a>
    </div>

    <div class="qc-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CircleCheckFilled, Link } from '@element-plus/icons-vue'
import { CATEGORIES, getLevel } from '../data/categories'
import { questionTypeName } from '../utils/quiz'
import { renderMarkdown } from '../utils/markdown'

const props = defineProps({
  question: { type: Object, required: true }
})

const catName = computed(() => CATEGORIES.find(c => c.id === props.question.cat)?.name || '')
const renderedQ = computed(() => renderMarkdown(props.question.q || ''))
const renderedExplain = computed(() => renderMarkdown(props.question.explain || ''))
function levelName(l) { return getLevel(l)?.name || '' }
function levelColor(l) { return getLevel(l)?.color || '#94a3b8' }

function isCorrectOption(oi) {
  const q = props.question
  if (q.type === 'multi') return (q.answer || []).includes(oi)
  if (q.type === 'judge') return (oi === 0 ? q.answer === true : q.answer === false)
  return q.answer === oi
}
</script>

<style lang="scss" scoped>
.question-card {
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  margin-bottom: 16px;
}

.qc-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.qc-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  &.single { background: #dbeafe; color: #2563eb; }
  &.multi { background: #fef3c7; color: #d97706; }
  &.judge { background: #dcfce7; color: #16a34a; }
}

.qc-level {
  padding: 2px 8px;
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
}

.qc-cat {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  background: #ede9fe;
  color: #7c3aed;
}

.qc-label {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  background: #f1f5f9;
  color: #475569;
}

.qc-text {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.6;
  margin-bottom: 16px;
}

.qc-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.qc-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;

  &.correct {
    border-color: #86efac;
    background: #f0fdf4;
  }
}

.qc-letter {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
}

.qc-opt-text {
  flex: 1;
  font-size: 14px;
  color: #334155;
}

.qc-check {
  color: #22c55e;
  font-size: 18px;
}

.qc-explain {
  padding: 14px;
  background: #f8fafc;
  border-radius: 8px;
}

.qc-explain-title {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 6px;
}

.qc-explain-text {
  font-size: 13px;
  color: #475569;
  line-height: 1.7;
}

.qc-ref {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  font-size: 12px;
  color: #6366f1;
  text-decoration: none;
  &:hover { text-decoration: underline; }
}

.qc-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 768px) {
  .question-card { padding: 16px; }
  .qc-text { font-size: 15px; }
  .qc-option { padding: 10px 12px; }
}

@media (max-width: 480px) {
  .question-card { padding: 14px; }
  .qc-actions .el-button { flex: 1; }
}
</style>

<style lang="scss">
html.dark-mode .question-card {
  background: #1e1e2e;
  border-color: #2d2d4a;
  .qc-text { color: #e2dee9; }
  .qc-option { background: #232338; border-color: #2d2d4a; }
  .qc-opt-text { color: #cbd5e1; }
  .qc-explain { background: #232338; }
  .qc-explain-title { color: #e2dee9; }
  .qc-explain-text { color: #94a3b8; }
  .qc-label { background: #2d2d4a; }
}
</style>

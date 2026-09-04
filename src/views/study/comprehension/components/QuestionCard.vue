<template>
  <div class="cp-qcard">
    <!-- 材料 -->
    <div v-if="passageMode === 'auto' && question.content" class="cp-passage">
      <div class="cp-passage-meta">
        <span class="cp-pill">{{ dimTag }}</span>
        <span class="cp-pill dim">{{ levelTag }}</span>
      </div>
      <div v-if="question.title" class="cp-passage-title">{{ question.title }}</div>
      <div class="cp-passage-text">{{ question.content }}</div>
      <div v-if="question.source" class="cp-passage-source">— {{ question.source }}</div>
    </div>
    <div v-else-if="passageMode === 'auto' && question.q" class="cp-qline">{{ question.q }}</div>

    <!-- 题干 -->
    <div v-if="stem" class="cp-stem">{{ stem }}</div>

    <!-- 单选题 -->
    <div v-if="mode === 'choice'" class="cp-options">
      <div
        v-for="(opt, i) in question.options"
        :key="i"
        class="cp-option"
        :class="{
          active: local === i,
          right: answered && correct === true && local === i,
          wrong: answered && local === i && correct === false
        }"
        @click="answered ? null : (local = i)"
      >
        <span class="cp-opt-key">{{ 'ABCDEF'[i] }}</span>
        <span class="cp-opt-text">{{ opt }}</span>
        <span v-if="answered && local === i" class="cp-opt-mark">{{ correct ? '✓' : '✗' }}</span>
      </div>
    </div>

    <!-- 排序题 -->
    <div v-else-if="mode === 'order'" class="cp-order">
      <div class="cp-order-tip">↓ 将选项按材料中的逻辑/操作顺序排列（点击选项移动）</div>
      <div class="cp-order-list">
        <div
          v-for="(item, pos) in orderItems"
          :key="item.id"
          class="cp-order-item"
          :class="{ active: selectedIdx === pos }"
          @click="!answered && move(pos)"
        >
          <span class="cp-order-pos">{{ pos + 1 }}</span>
          <span class="cp-order-text">{{ item.text }}</span>
          <span v-if="!answered" class="cp-order-btns">
            <button type="button" :disabled="pos === 0" @click.stop="swap(pos, -1)">↑</button>
            <button type="button" :disabled="pos === orderItems.length - 1" @click.stop="swap(pos, 1)">↓</button>
          </span>
          <span v-if="!answered" class="cp-order-move">点击插入 ↑</span>
        </div>
      </div>
      <div v-if="!answered" class="cp-order-reset">
        <el-button link size="small" @click="reshuffle">重新打乱</el-button>
      </div>
    </div>

    <!-- 术语填空 -->
    <div v-else-if="mode === 'term'" class="cp-input-wrap">
      <el-input v-model="text" type="textarea" :rows="2" :disabled="answered" placeholder="请输入最合适的术语 / 关键词" />
    </div>

    <!-- 判断（P3） -->
    <div v-else-if="mode === 'bool'" class="cp-bool">
      <el-button
        type="primary"
        plain
        class="cp-bool-btn"
        :class="{ chosen: local === true }"
        :disabled="answered"
        @click="local = true"
      >需要背景知识（是）</el-button>
      <el-button
        type="primary"
        plain
        class="cp-bool-btn no"
        :class="{ chosen: local === false }"
        :disabled="answered"
        @click="local = false"
      >不需要背景知识（否）</el-button>
      <div class="cp-bool-note">请判断：真正理解这句话，是否需要材料之外的背景知识？</div>
    </div>

    <!-- 主观题 -->
    <div v-else class="cp-input-wrap">
      <el-input v-model="text" type="textarea" :rows="4" :disabled="answered" placeholder="请结合材料认真作答…" />
    </div>

    <!-- 底部操作 -->
    <div class="cp-actions">
      <el-button v-if="!answered && hintText" link type="primary" class="cp-hint-btn" @click="showHint = !showHint">
        {{ showHint ? '收起提示' : '卡住了？查看提示' }}
      </el-button>
      <div class="cp-actions-right">
        <el-button v-if="!answered && mode === 'order'" link @click="reshuffle">打乱重排</el-button>
        <el-button v-if="!answered" type="primary" :disabled="!canSubmit" @click="submit">提交答案</el-button>
      </div>
    </div>

    <div v-if="showHint && hintText" class="cp-hint">
      <div class="cp-hint-title">提示</div>
      {{ hintText }}
    </div>

    <!-- 判分反馈（由父组件传入） -->
    <div v-if="answered && feedbackText" class="cp-feedback" :class="correct === false ? 'bad' : 'ok'">
      <div class="cp-feedback-title">{{ correct === false ? '✗ 回答有误' : '✓ 回答正确' }}</div>
      <div class="cp-feedback-text">{{ feedbackText }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  question: { type: Object, required: true },
  /** 是否已提交 */
  answered: { type: Boolean, default: false },
  /** 提交后后端判定结果，null=未知 */
  correct: { type: Boolean, default: null },
  /** 判分后的解释/反馈文本 */
  feedbackText: { type: String, default: '' },
  /** 材料展示模式：auto=卡片内展示材料全文；hide=不展示材料（由外层容器统一展示），题干并入 stem */
  passageMode: { type: String, default: 'auto' }
})
const emit = defineEmits(['answer'])

const local = ref(null)
const text = ref('')
const showHint = ref(false)
const orderItems = ref([])
const selectedIdx = ref(-1)

/** 题型归一：choice / order / term / bool / text */
const mode = computed(() => {
  const q = props.question
  if (Array.isArray(q.items) && q.items.length) return 'order'
  if (Array.isArray(q.options) && q.options.length) return 'choice'
  if (q.obstacle === 'P3' || q.qtype === 'bool') return 'bool'
  if (q.qtype === 'term' || q.obstacle === 'P1') return 'term'
  return 'text'
})

const TYPE_NAME = {
  choice: '单选', order: '排序', term: '术语填空', bool: '判断', text: '主观题'
}
const typeName = computed(() => TYPE_NAME[mode.value])
const stem = computed(() => {
  const q = props.question
  if (!q) return ''
  if (q.qtype === 'order') return q.q || ''
  if (q.qtype === 'term' || q.obstacle === 'P1') {
    const line = q.q && q.q !== q.content ? '\n' + q.q : ''
    return '结合材料语境，在划线处填入最合适的术语：' + line
  }
  return q.q && q.q !== q.content ? q.q : ''
})
const hintText = computed(() => props.question.hint || '')
const dimTag = computed(() => (props.question.dim || '').replace('D', '维度D') || '通用')
const levelTag = computed(() => (props.question.level !== undefined ? 'L' + props.question.level : ''))

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
function reshuffle() {
  orderItems.value = shuffle(orderItems.value.map((x, i) => ({ ...x, _k: i })))
}
watch(
  () => props.question,
  (q) => {
    local.value = null
    text.value = ''
    showHint.value = false
    selectedIdx.value = -1
    if (q && Array.isArray(q.items) && q.items.length) {
      orderItems.value = q.items.map((t, i) => ({ id: i, text: t }))
      // 避免刚好落在正确顺序：执行一次 Fisher-Yates（若与原始全等则再洗一次）
      shuffle(orderItems.value)
      const isSorted = orderItems.value.every((x, i) => x.id === i)
      if (isSorted) shuffle(orderItems.value)
    } else {
      orderItems.value = []
    }
  },
  { immediate: true, deep: true }
)

function move(pos) {
  // 点击选中该位置，将选项“移动插入”到点击处：简单起见采用交换式交互——
  // 点击非当前项时将其与目标位置的相邻项交换
  if (selectedIdx.value === -1) {
    selectedIdx.value = pos
    return
  }
  if (selectedIdx.value === pos) {
    selectedIdx.value = -1
    return
  }
  const arr = [...orderItems.value]
  const [sel] = arr.splice(selectedIdx.value, 1)
  const insertAt = selectedIdx.value < pos ? pos : pos
  arr.splice(insertAt, 0, sel)
  orderItems.value = arr
  selectedIdx.value = -1
}
function swap(pos, dir) {
  const arr = [...orderItems.value]
  const t = arr[pos]
  arr[pos] = arr[pos + dir]
  arr[pos + dir] = t
  orderItems.value = arr
}
const canSubmit = computed(() => {
  const t = mode.value
  if (t === 'choice' || t === 'bool') return local.value !== null
  if (t === 'order') return orderItems.value.length > 0
  return text.value.trim().length > 0
})
function submit() {
  const t = mode.value
  let ans = null
  if (t === 'choice') ans = local.value
  else if (t === 'bool') ans = local.value
  else if (t === 'order') ans = orderItems.value.map((x) => x.id)
  else ans = text.value.trim()
  emit('answer', ans)
}
defineExpose({ reset: () => { local.value = null; text.value = ''; showHint.value = false } })
</script>

<style lang="scss" scoped>
.cp-qcard {
  background: var(--cp-card);
  border: 1px solid var(--cp-line);
  border-radius: 16px;
  padding: 20px 22px;
  box-shadow: var(--cp-shadow);
  transition: border-color 0.25s;
}

.cp-passage {
  background: var(--cp-card-2);
  border: 1px dashed var(--cp-line);
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 16px;

  .cp-passage-meta {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
  }
  .cp-pill {
    display: inline-flex;
    align-items: center;
    font-size: 12px;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--cp-badge);
    color: var(--cp-badge-ink);
    &.dim {
      background: var(--cp-accent-soft);
      color: var(--cp-accent);
    }
  }
  .cp-passage-title {
    font-weight: 700;
    font-size: 16px;
    color: var(--cp-ink);
    margin-bottom: 8px;
  }
  .cp-passage-text {
    font-size: 14px;
    line-height: 1.85;
    color: var(--cp-ink);
    white-space: pre-wrap;
  }
  .cp-passage-source {
    margin-top: 10px;
    font-size: 12.5px;
    color: var(--cp-sub);
    text-align: right;
  }
}

.cp-qline {
  font-size: 15px;
  line-height: 1.7;
  color: var(--cp-ink);
  margin-bottom: 12px;
  white-space: pre-wrap;
}
.cp-stem {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.7;
  color: var(--cp-ink);
  margin-bottom: 14px;
  white-space: pre-wrap;
}

/* 单选 */
.cp-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cp-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border: 1px solid var(--cp-line);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.18s;
  color: var(--cp-ink);
  &:hover:not(.active) {
    border-color: var(--cp-accent);
    background: var(--cp-accent-softer);
  }
  &.active {
    border-color: var(--cp-accent);
    background: var(--cp-accent-soft);
  }
  &.right {
    border-color: var(--cp-ok);
    background: rgba(16, 185, 129, 0.1);
  }
  &.wrong {
    border-color: var(--cp-bad);
    background: rgba(239, 68, 68, 0.09);
  }
  .cp-opt-key {
    flex: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12.5px;
    font-weight: 700;
    background: var(--cp-badge);
    color: var(--cp-badge-ink);
  }
  .cp-opt-text { flex: 1; line-height: 1.55; }
  .cp-opt-mark { color: var(--cp-sub); font-weight: 700; }
}

/* 排序 */
.cp-order {
  .cp-order-tip {
    font-size: 13px;
    color: var(--cp-sub);
    margin-bottom: 12px;
  }
  .cp-order-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .cp-order-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--cp-line);
    border-radius: 10px;
    background: var(--cp-card);
    cursor: pointer;
    transition: all 0.18s;
    color: var(--cp-ink);
    &:hover { border-color: var(--cp-accent); }
    &.active {
      border-color: var(--cp-accent);
      background: var(--cp-accent-soft);
      box-shadow: 0 0 0 2px var(--cp-accent-soft);
    }
    .cp-order-pos {
      flex: none;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      background: var(--cp-badge);
      color: var(--cp-badge-ink);
    }
    .cp-order-text { flex: 1; line-height: 1.5; }
    .cp-order-btns {
      display: inline-flex;
      flex-direction: column;
      gap: 2px;
      button {
        width: 20px;
        height: 18px;
        border: none;
        border-radius: 4px;
        background: var(--cp-accent-soft);
        color: var(--cp-accent);
        cursor: pointer;
        font-size: 12px;
        line-height: 1;
        &:hover:not(:disabled) { background: var(--cp-accent); color: #fff; }
        &:disabled { opacity: 0.35; cursor: not-allowed; }
      }
    }
    .cp-order-move { font-size: 11.5px; color: var(--cp-sub); }
  }
  .cp-order-reset { margin-top: 10px; text-align: right; }
}

/* 输入 */
.cp-input-wrap {
  :deep(.el-textarea__inner) {
    background: var(--cp-card-2);
    color: var(--cp-ink);
    border-color: var(--cp-line);
    border-radius: 10px;
  }
}

/* bool */
.cp-bool {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  .cp-bool-btn {
    width: 100%;
    max-width: 320px;
    border-radius: 10px;
    justify-content: center;
    border-color: var(--cp-line);
    color: var(--cp-ink);
    &:hover { border-color: var(--cp-accent); color: var(--cp-accent); }
    &.chosen {
      border-color: var(--cp-accent);
      background: var(--cp-accent-soft);
      color: var(--cp-accent);
      font-weight: 600;
    }
    &.no.chosen {
      border-color: var(--cp-bad);
      color: var(--cp-bad);
      background: rgba(239, 68, 68, 0.08);
    }
  }
  .cp-bool-note { font-size: 12.5px; color: var(--cp-sub); }
}

/* 底部 */
.cp-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  .cp-actions-right { display: inline-flex; align-items: center; gap: 8px; }
}
.cp-hint {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--cp-warn);
  .cp-hint-title { font-weight: 700; margin-bottom: 2px; }
}

/* 判分反馈 */
.cp-feedback {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13.5px;
  line-height: 1.7;
  &.ok {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: var(--cp-ok);
  }
  &.bad {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.28);
    color: var(--cp-bad);
  }
  .cp-feedback-title { font-weight: 700; }
  .cp-feedback-text { margin-top: 2px; white-space: pre-wrap; }
}

/* ========= 移动端适配 ========= */
@media (max-width: 768px) {
  .cp-qcard { padding: 16px; }
  .cp-passage { padding: 14px; }
}
@media (max-width: 480px) {
  .cp-qcard { padding: 14px; border-radius: 14px; }
  .cp-passage-title { font-size: 15px; }
  .cp-option { padding: 10px 12px; }
  .cp-order-item { padding: 8px 10px; }
  .cp-bool-btn { max-width: none; }
  .cp-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    .cp-actions-right { justify-content: flex-end; }
  }
}
</style>

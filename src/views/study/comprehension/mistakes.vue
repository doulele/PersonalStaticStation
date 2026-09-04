<template>
  <div class="cp-page">
    <div class="page-top">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <h1 class="page-title">错题本</h1>
      <span class="page-sub">答对即可自动移出</span>
    </div>

    <div v-if="loading" class="cp-loading">加载错题…</div>
    <template v-else>
      <section class="cp-filter">
        <el-radio-group v-model="dim" @change="load">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button v-for="d in DIM_META" :key="d.id" :label="d.id">{{ d.id }}</el-radio-button>
        </el-radio-group>
        <span class="cp-filter-total">共 {{ list.length }} 道</span>
      </section>

      <el-empty v-if="!list.length" description="错题本空空如也 🎉 继续保持">
        <el-button type="primary" @click="$router.push('/study/comprehension/training')">去做今日训练</el-button>
      </el-empty>

      <div v-else class="cp-mk-list">
        <div v-for="row in list" :key="row.id" class="cp-mk-card">
          <div class="cp-mk-head">
            <span class="cp-mk-dim" :style="{ color: dimOf(row.dim).color, borderColor: dimOf(row.dim).color }">{{ row.dim }}</span>
            <span class="cp-mk-kind">{{ kindLabel(row.kind) }}</span>
            <span class="cp-mk-lv">L{{ row.level }}</span>
            <span class="cp-mk-wrong">错 {{ row.wrongCount }} 次</span>
            <span class="cp-mk-time">{{ (row.lastAt || '').slice(0, 16).replace('T', ' ') }}</span>
            <span class="cp-mk-spacer"></span>
            <button class="cp-mk-action" @click="toggleRetry(row)">{{ retryOf(row) ? '收起' : '再试一次' }}</button>
            <button class="cp-mk-action ghost" @click="toggleAnswer(row)">查看解析</button>
          </div>

          <div class="cp-mk-q">{{ row.q || row.title }}</div>

          <!-- 查看解析 -->
          <div v-if="showAnswerOf(row)" class="cp-mk-answer">
            <div v-if="row.kind === 'choice' && row.options && row.answer != null" class="cp-mk-ans-item">
              <b>正确答案：</b>{{ row.options[row.answer] }}
            </div>
            <div v-else-if="row.kind === 'term'" class="cp-mk-ans-item">
              <b>正确术语：</b>{{ row.standard || '——' }}
            </div>
            <div v-else-if="row.kind === 'retell' || row.kind === 'challenge'" class="cp-mk-ans-item">
              <b>答题要点：</b>{{ row.standard || '用自己的话完整表达，不照抄原文' }}
            </div>
            <div v-else-if="row.kind === 'order' && row.items" class="cp-mk-ans-item">
              <b>正确顺序：</b>
              <ol class="cp-mk-ans-order"><li v-for="(t, i) in row.items" :key="i">{{ i + 1 }}. {{ t }}</li></ol>
            </div>
            <div v-if="row.keywords && row.keywords.length" class="cp-mk-ans-item">
              <b>关键词：</b>{{ row.keywords.join(' · ') }}
            </div>
          </div>

          <!-- 上次错误作答 -->
          <div class="cp-mk-last">
            <span>上次作答：</span>
            <em>{{ lastAnswerText(row) }}</em>
          </div>

          <!-- 重练 -->
          <div v-if="retryOf(row)" class="cp-mk-retry">
            <QuestionCard
              :key="'q' + row.id + retryKey(row)"
              :question="toQuestion(row)"
              :answered="retryOf(row).state !== 'open'"
              :correct="retryOf(row).state === 'done' ? retryOf(row).correct : null"
              @answer="(ans) => onRetryAnswer(row, ans)"
            />
            <div v-if="retryOf(row).state === 'done'" class="cp-mk-retry-result" :class="retryOf(row).correct ? 'ok' : 'bad'">
              <template v-if="retryOf(row).correct">
                <b>✓ 回答正确！已移出错题本</b>
                <el-button size="small" type="primary" @click="load">刷新列表</el-button>
              </template>
              <template v-else>
                <b>✗ 还差一点，可对照上方解析再试</b>
                <el-button size="small" @click="resetRetry(row)">重新作答</el-button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getMistakes, retryMistake } from '@/api/comprehension'
import { DIM_META, KIND_NAME } from './cp-meta'
import QuestionCard from './components/QuestionCard.vue'

const router = useRouter()
const goBack = () => router.push('/study/comprehension')

const loading = ref(true)
const dim = ref('')
const list = ref([])
const retries = reactive({}) // id -> {state, correct, key}
const shows = reactive({}) // id -> bool

const dimOf = (id) => DIM_META.find((d) => d.id === id) || { color: 'var(--cp-accent)' }
const kindLabel = (k) => KIND_NAME[k] || k

async function load() {
  loading.value = true
  try {
    const res = await getMistakes(dim.value)
    if (res.success) {
      list.value = (res.data && res.data.list) || []
      list.value.forEach((r) => { if (!retries[r.id]) retries[r.id] = { state: 'idle', correct: null, key: 0 } })
    }
  } finally {
    loading.value = false
  }
}

const retryOf = (row) => retries[row.id]
const showAnswerOf = (row) => !!shows[row.id]
const toggleRetry = (row) => {
  const s = retries[row.id]
  if (!s) return
  if (s.state === 'done') { s.state = 'idle'; s.correct = null; s.key++ }
  else s.state = s.state === 'idle' ? 'open' : 'idle'
}
const toggleAnswer = (row) => { shows[row.id] = !shows[row.id] }
const resetRetry = (row) => {
  const s = retries[row.id]
  s.state = 'open'
  s.correct = null
  s.key++
}
const retryKey = (row) => retries[row.id].key

function toQuestion(row) {
  return {
    qid: row.qid, qtype: row.kind, kind: row.kind, dim: row.dim, level: row.level,
    q: row.q || row.title, options: row.options, items: row.items
  }
}

async function onRetryAnswer(row, ans) {
  const s = retries[row.id]
  s.state = 'submitting'
  try {
    const res = await retryMistake({ id: row.id, userAnswer: ans })
    if (!res.success) throw new Error(res.error || '提交失败')
    s.state = 'done'
    s.correct = !!res.data.correct
    if (res.data.removed) {
      setTimeout(() => {
        const i = list.value.findIndex((x) => x.id === row.id)
        if (i >= 0) list.value.splice(i, 1)
      }, 1500)
    }
  } catch (e) {
    s.state = 'open'
    console.error(e)
  }
}

function lastAnswerText(row) {
  if (row.userAnswer === null || row.userAnswer === undefined || row.userAnswer === '') return '（空）'
  try {
    if (row.kind === 'choice' && row.options && row.options.length) {
      const i = Number(row.userAnswer)
      if (!Number.isNaN(i) && row.options[i]) return row.options[i]
    }
    if (row.kind === 'order' && row.items && Array.isArray(JSON.parse(row.userAnswer))) {
      const arr = JSON.parse(row.userAnswer)
      return arr.map((i) => row.items[i]).join(' → ')
    }
    const raw = row.userAnswer
    if (typeof raw === 'string' && raw.length > 60) return raw.slice(0, 60) + '…'
    return raw
  } catch (e) {
    return String(row.userAnswer)
  }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.cp-page { min-height: 100vh; padding: 18px 22px 60px; max-width: 860px; margin: 0 auto; color: var(--cp-ink); }
.page-top { display: flex; align-items: center; gap: 12px; margin-bottom: 18px;
  .back-btn { display: inline-flex; align-items: center; gap: 4px; background: var(--cp-card); border: 1px solid var(--cp-line); color: var(--cp-ink); border-radius: 10px; padding: 7px 12px; font-size: 13px; cursor: pointer;
    &:hover { color: var(--cp-accent); border-color: var(--cp-accent); } }
  .page-title { font-size: 20px; margin: 0; }
  .page-sub { font-size: 12.5px; color: var(--cp-sub); }
}
.cp-loading { padding: 60px 0; text-align: center; color: var(--cp-sub); }

.cp-filter { display: flex; align-items: center; gap: 16px; margin-bottom: 16px;
  :deep(.el-radio-button__inner) { background: var(--cp-card); color: var(--cp-sub); border-color: var(--cp-line); box-shadow: none; }
  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) { background: var(--cp-accent); border-color: var(--cp-accent); }
  :deep(.el-radio-button.is-active .el-radio-button__inner) { background: var(--cp-accent); border-color: var(--cp-accent); box-shadow: -1px 0 0 0 var(--cp-accent); }
  .cp-filter-total { font-size: 13px; color: var(--cp-sub); }
}

.cp-mk-list { display: flex; flex-direction: column; gap: 14px; }
.cp-mk-card { background: var(--cp-card); border: 1px solid var(--cp-line); border-radius: 14px; padding: 16px 18px; box-shadow: var(--cp-shadow); }
.cp-mk-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; font-size: 12.5px;
  .cp-mk-dim { font-weight: 800; font-size: 12.5px; border: 1px solid; border-radius: 6px; padding: 1px 8px; }
  .cp-mk-kind { color: var(--cp-accent-strong); background: var(--cp-accent-soft); border-radius: 999px; padding: 2px 10px; }
  .cp-mk-lv { color: var(--cp-sub); }
  .cp-mk-wrong { color: var(--cp-bad); }
  .cp-mk-time { color: var(--cp-sub); font-size: 12px; }
  .cp-mk-spacer { flex: 1; }
  .cp-mk-action { border: 1px solid var(--cp-accent); color: var(--cp-accent); background: transparent; border-radius: 8px; padding: 4px 12px; font-size: 12.5px; cursor: pointer;
    &:hover { background: var(--cp-accent-soft); }
    &.ghost { border-color: var(--cp-line); color: var(--cp-sub);
      &:hover { color: var(--cp-accent); border-color: var(--cp-accent); } } }
}
.cp-mk-q { font-size: 14.5px; line-height: 1.75; font-weight: 600; margin-bottom: 8px; }
.cp-mk-last { font-size: 13px; color: var(--cp-sub); background: rgba(239, 68, 68, 0.05); border-left: 3px solid rgba(239, 68, 68, 0.5); padding: 8px 12px; border-radius: 0 8px 8px 0;
  em { font-style: normal; color: var(--cp-ink); } }
.cp-mk-answer { margin-top: 10px; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 12px 14px; font-size: 13.5px;
  .cp-mk-ans-item { line-height: 1.8; b { color: var(--cp-ok); } }
  .cp-mk-ans-order { margin: 6px 0 0; padding-left: 20px; color: var(--cp-ink); line-height: 1.9; } }
.cp-mk-retry { margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--cp-line); }
.cp-mk-retry-result { margin-top: 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-radius: 10px; padding: 12px 14px;
  &.ok { background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); color: var(--cp-ok); }
  &.bad { background: rgba(239, 68, 68, 0.07); border: 1px solid rgba(239, 68, 68, 0.25); color: var(--cp-bad); } }

/* ========= 移动端适配 ========= */
@media (max-width: 768px) {
  .cp-page { padding: 14px 14px 50px; }
  .page-top {
    flex-wrap: wrap;
    gap: 8px;
    .page-title { font-size: 18px; }
  }
  .cp-filter { align-items: flex-start; flex-direction: column; gap: 10px;
    :deep(.el-radio-group) { max-width: 100%; overflow-x: auto; white-space: nowrap; padding-bottom: 2px; }
  }
  .cp-mk-card { padding: 14px; }
}
@media (max-width: 480px) {
  .cp-page { padding: 12px 12px 46px; }
  .cp-mk-head { gap: 8px; }
  .cp-mk-time { width: 100%; }
  .cp-mk-retry-result { flex-direction: column; align-items: flex-start; }
  .cp-mk-last { font-size: 12.5px; }
}
</style>

<template>
  <div class="cp-page cp-migrate">
    <div class="page-top">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <h1 class="page-title">迁移力测试</h1>
      <span v-if="stage === 'intro' && history.length" class="page-sub">累计 {{ history.length }} 次记录</span>
    </div>

    <!-- 加载 -->
    <div v-if="stage === 'loading'" class="cp-loading">加载迁移测试…</div>

    <!-- ============ 首页 ============ -->
    <template v-else-if="stage === 'intro'">
      <section class="cp-welcome-card">
        <h3>🧪 什么是迁移力测试？</h3>
        <p>训练库里的文章你可能已反复读过，容易形成“熟悉度错觉”。迁移测试每次从<b>全新的文章</b>中抽出 4 道题（D1-D4 各一道），检验你的理解策略是否真正内化——<b>换了领域依然能用</b>。</p>
        <div class="cp-mg-modes">
          <div
            v-for="m in modeCards"
            :key="m.id"
            class="cp-mg-mode"
            :class="{ active: quizType === m.id }"
            @click="quizType = m.id"
          >
            <b>{{ m.icon }} {{ m.name }}</b>
            <span>{{ m.desc }}</span>
          </div>
        </div>
        <el-button type="primary" size="large" class="cp-btn-main" :loading="busy" @click="begin">
          开始测试（约 4 分钟）
        </el-button>
        <div class="cp-mg-rule">判定标准：4 题答对 3 题（≥75 分）即视为通过；不限制时长，但会记录用时。</div>
      </section>

      <!-- 历史成绩 -->
      <section v-if="history.length" class="cp-panel">
        <h4 class="cp-panel-title">历史成绩</h4>
        <div class="cp-mg-history">
          <div v-for="(h, i) in history" :key="h.id" class="cp-mg-hrow">
            <span class="cp-mg-htype" :class="h.type === 'cross' ? 'cross' : 'same'">{{ h.type === 'cross' ? '跨领域' : '同领域' }}</span>
            <span class="cp-mg-hscore" :class="h.score >= 75 ? 'pass' : 'fail'">{{ h.score }}<em>分</em></span>
            <span class="cp-mg-hmeta">用时 {{ fmtTime(h.elapsed) }}</span>
            <span class="cp-mg-hdate">{{ fmtDate(h.createdAt) }}</span>
            <span class="cp-mg-hrank">第 {{ history.length - i }} 次</span>
          </div>
        </div>
      </section>
    </template>

    <!-- ============ 答题 ============ -->
    <template v-else-if="stage === 'quiz'">
      <!-- 计时 -->
      <div class="cp-mg-timer">⏱ {{ timerText }}</div>

      <!-- 阅读材料 -->
      <section class="cp-panel cp-mg-passage">
        <div class="cp-mg-passage-head" @click="foldPassage = !foldPassage">
          <h4 class="cp-panel-title">📖 阅读材料 · {{ quiz.title }}</h4>
          <button class="cp-fold-btn">{{ foldPassage ? '展开' : '收起' }}</button>
        </div>
        <div v-show="!foldPassage">
          <div class="cp-mg-passage-text">{{ quiz.content }}</div>
          <div v-if="quiz.source" class="cp-mg-passage-source">— {{ quiz.source }}</div>
          <div class="cp-mg-passage-tip">{{ quiz.tip }} 本题共 {{ questions.length }} 道，全部作答后即可提交。</div>
        </div>
      </section>

      <!-- 进度 -->
      <div class="cp-mg-progress">
        <span>已作答 {{ answeredCount }} / {{ questions.length }}</span>
        <div class="cp-mg-bar"><i :style="{ width: pct + '%' }"></i></div>
      </div>

      <!-- 题目 -->
      <div v-for="(q, i) in questions" :key="q.qid" class="cp-mg-q">
        <div class="cp-mg-qhead">
          <span class="cp-mg-qdim" :style="{ '--c': dimColor(q.dim) }">{{ q.dim }} · {{ dimName(q.dim) }}</span>
          <span class="cp-mg-qidx">{{ i + 1 }}/{{ questions.length }}</span>
        </div>
        <QuestionCard
          :ref="(el) => setQref(q.qid, el)"
          :question="q"
          :answered="!!answeredMap[q.qid]"
          passage-mode="hide"
          @answer="(ans) => onAnswer(q, ans)"
        />
        <div v-if="answeredMap[q.qid]" class="cp-mg-reanswer">此题已作答 <el-button link type="primary" @click="resetOne(q.qid)">重答此题</el-button></div>
      </div>

      <!-- 提交条 -->
      <div class="cp-mg-submitbar">
        <span>{{ answeredCount === questions.length ? '全部作答完成 ✅' : '还有 ' + (questions.length - answeredCount) + ' 题未作答' }}</span>
        <el-button type="primary" :disabled="answeredCount !== questions.length || submitting" :loading="submitting" @click="submit">提交测试</el-button>
      </div>
    </template>

    <!-- ============ 结果 ============ -->
    <template v-else-if="stage === 'result'">
      <section class="cp-welcome-card cp-mg-result" :class="testPassed ? 'pass' : 'fail'">
        <div class="cp-mg-score-ring" :style="{ '--pct': score }">
          <div class="cp-mg-score-in"><b>{{ score }}</b><span>分</span></div>
        </div>
        <h3>{{ testPassed ? '🎉 通过！理解力成功迁移' : '💪 未通过，回到对应维度补强' }}</h3>
        <p>{{ result.message }}</p>
        <div v-if="result.delta !== null" class="cp-mg-delta" :class="result.delta >= 0 ? 'up' : 'down'">
          相比历史最佳（{{ result.lastScore }} 分）{{ result.delta >= 0 ? '提升 +' : '下降 ' }}{{ result.delta }} 分
        </div>
        <div class="cp-mg-actions">
          <el-button type="primary" :loading="busy" @click="begin">再测一篇</el-button>
          <el-button @click="toIntro">返回选择</el-button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { startMigrate, submitMigrate, getMigrateHistory } from '@/api/comprehension'
import { DIM_META } from './cp-meta'
import QuestionCard from './components/QuestionCard.vue'

const router = useRouter()
const goBack = () => router.push('/study/comprehension')

const stage = ref('loading') // loading | intro | quiz | result
const busy = ref(false)
const submitting = ref(false)
const history = ref([])
const quizType = ref('same')

const quiz = ref(null)
const questions = ref([])
const answers = ref({})
const answeredMap = ref({})
const foldPassage = ref(true)
const result = ref(null)
const testPassed = ref(false)
const score = ref(0)

const qrefs = {}
function setQref(qid, el) { if (el) qrefs[qid] = el }
function resetOne(qid) {
  const el = qrefs[qid]
  if (el && el.reset) el.reset()
  delete answers.value[qid]
  answeredMap.value[qid] = false
  answeredMap.value = { ...answeredMap.value }
}

const modeCards = [
  { id: 'same', icon: '📄', name: '同领域新文', desc: '从训练库之外的同类新文章抽题，检验真实阅读能力' },
  { id: 'cross', icon: '🌍', name: '跨领域盲测', desc: '抽一篇你大概率不熟悉的领域的文章，检验理解力是否真正迁移' }
]
const dimName = (id) => (DIM_META.find((m) => m.id === id) || {}).name || id
const dimColor = (id) => (DIM_META.find((m) => m.id === id) || {}).color || '#4f7df9'

const answeredCount = computed(() => Object.keys(answeredMap.value).filter((k) => answeredMap.value[k]).length)
const pct = computed(() => (questions.value.length ? Math.round((answeredCount.value / questions.value.length) * 100) : 0))

/* 计时 */
const startAt = ref(0)
const nowAt = ref(0)
let timer = null
const timerText = computed(() => {
  const s = Math.max(0, Math.floor((nowAt.value - startAt.value) / 1000))
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')
})

function tickTimer() {
  nowAt.value = Date.now()
  timer = setTimeout(tickTimer, 1000)
}

function loadHistory() {
  return getMigrateHistory().then((res) => {
    if (res.success) history.value = res.data.list || []
  })
}
async function begin() {
  busy.value = true
  try {
    const res = await startMigrate(quizType.value)
    if (!res.success) { ElMessage.error(res.message || '出卷失败'); return }
    quiz.value = res.data
    questions.value = res.data.questions
    answers.value = {}
    answeredMap.value = {}
    foldPassage.value = true
    result.value = null
    testPassed.value = false
    score.value = 0
    stage.value = 'quiz'
    window.scrollTo({ top: 0 })
    startAt.value = Date.now()
    nowAt.value = startAt.value
    tickTimer()
  } finally { busy.value = false }
}

function onAnswer(q, ans) {
  answers.value[q.qid] = ans
  answeredMap.value[q.qid] = true
  answeredMap.value = { ...answeredMap.value }
}

function submit() {
  if (answeredCount.value !== questions.value.length) { ElMessage.info('还有题目未作答'); return }
  submitting.value = true
  const elapsed = Math.max(1, Math.round((Date.now() - startAt.value) / 1000))
  submitMigrate({
    testId: quiz.value.testId,
    elapsed,
    answers: questions.value.map((q) => ({ qid: q.qid, userAnswer: answers.value[q.qid] }))
  }).then((res) => {
    if (!res.success) { ElMessage.error(res.message || '提交失败'); return }
    result.value = res.data
    score.value = res.data.score
    testPassed.value = res.data.passed
    stage.value = 'result'
    window.scrollTo({ top: 0 })
    loadHistory()
  }).finally(() => { submitting.value = false })
}

function toIntro() {
  stage.value = 'intro'
  loadHistory()
  window.scrollTo({ top: 0 })
}

function fmtTime(s) {
  if (!s && s !== 0) return '—'
  return Math.floor(s / 60) + '分' + (s % 60) + '秒'
}
function fmtDate(str) {
  if (!str) return ''
  const d = new Date(str)
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

onMounted(() => {
  loadHistory().finally(() => { stage.value = 'intro' })
})
onBeforeUnmount(() => { clearTimeout(timer) })
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

.cp-migrate {
  .cp-welcome-card {
    background: var(--cp-card);
    border: 1px solid var(--cp-line);
    border-radius: 16px;
    padding: 20px 22px;
    box-shadow: var(--cp-shadow);
    h3 { color: var(--cp-ink); margin-bottom: 8px; }
    p { color: var(--cp-sub); line-height: 1.8; font-size: 14px; }
    b { color: var(--cp-accent); }
  }

  .cp-mg-modes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 12px;
    margin: 16px 0;
    .cp-mg-mode {
      border: 1px solid var(--cp-line);
      border-radius: 12px;
      padding: 12px 14px;
      background: var(--cp-card-2);
      cursor: pointer;
      transition: all 0.18s;
      b { display: block; font-size: 14px; color: var(--cp-ink); margin-bottom: 4px; }
      span { font-size: 12.5px; color: var(--cp-sub); line-height: 1.6; }
      &:hover { border-color: var(--cp-accent); }
      &.active {
        border-color: var(--cp-accent);
        background: var(--cp-accent-soft);
        box-shadow: 0 0 0 2px var(--cp-accent-soft);
        b { color: var(--cp-accent); }
      }
    }
  }
  .cp-btn-main { width: 100%; }
  .cp-mg-rule {
    margin-top: 12px;
    font-size: 12.5px;
    color: var(--cp-sub);
    background: var(--cp-card-2);
    border-radius: 8px;
    padding: 6px 10px;
  }

  /* 历史 */
  .cp-panel {
    background: var(--cp-card);
    border: 1px solid var(--cp-line);
    border-radius: 16px;
    padding: 18px 20px;
    margin-top: 16px;
    box-shadow: var(--cp-shadow);
  }
  .cp-panel-title { color: var(--cp-ink); font-size: 15px; margin-bottom: 14px; }
  .cp-mg-history {
    display: flex;
    flex-direction: column;
    gap: 8px;
    .cp-mg-hrow {
      display: flex;
      align-items: center;
      gap: 12px;
      border: 1px solid var(--cp-line);
      border-radius: 10px;
      padding: 9px 12px;
      background: var(--cp-card-2);
      font-size: 13px;
      .cp-mg-htype {
        flex: none;
        font-size: 11.5px;
        padding: 2px 8px;
        border-radius: 999px;
        background: var(--cp-badge);
        color: var(--cp-badge-ink);
        &.cross { background: rgba(79, 125, 249, 0.15); color: #4f7df9; }
        &.same { background: rgba(20, 184, 166, 0.15); color: #14b8a6; }
      }
      .cp-mg-hscore {
        flex: none;
        font-weight: 800;
        font-size: 16px;
        color: var(--cp-sub);
        em { font-style: normal; font-size: 11px; margin-left: 2px; }
        &.pass { color: var(--cp-ok); }
        &.fail { color: var(--cp-bad); }
      }
      .cp-mg-hmeta { color: var(--cp-sub); flex: 1; }
      .cp-mg-hdate { color: var(--cp-sub); font-size: 12px; }
      .cp-mg-hrank { flex: none; font-size: 12px; color: var(--cp-sub); }
    }
  }

  /* 计时 */
  .cp-mg-timer {
    position: sticky;
    top: 10px;
    z-index: 5;
    text-align: center;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--cp-ink);
    background: var(--cp-card);
    border: 1px solid var(--cp-line);
    box-shadow: var(--cp-shadow);
    border-radius: 999px;
    padding: 6px 16px;
    width: max-content;
    margin: 0 auto 14px;
  }

  /* 材料 */
  .cp-mg-passage {
    .cp-mg-passage-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      .cp-panel-title { margin-bottom: 0; }
      .cp-fold-btn {
        border: 1px solid var(--cp-line);
        background: transparent;
        color: var(--cp-sub);
        font-size: 12px;
        border-radius: 8px;
        padding: 3px 10px;
        cursor: pointer;
      }
    }
    .cp-mg-passage-text {
      font-size: 14px;
      line-height: 1.9;
      color: var(--cp-ink);
      white-space: pre-wrap;
      max-height: 300px;
      overflow-y: auto;
      padding-right: 6px;
      margin-top: 10px;
    }
    .cp-mg-passage-source { margin-top: 10px; font-size: 12.5px; color: var(--cp-sub); text-align: right; }
    .cp-mg-passage-tip {
      margin-top: 8px;
      font-size: 12px;
      color: var(--cp-sub);
      background: var(--cp-card-2);
      border-radius: 8px;
      padding: 6px 10px;
      line-height: 1.6;
    }
  }

  .cp-mg-progress {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 6px 0 18px;
    font-size: 13px;
    color: var(--cp-sub);
    .cp-mg-bar {
      flex: 1;
      height: 6px;
      border-radius: 999px;
      background: var(--cp-card-2);
      overflow: hidden;
      i { display: block; height: 100%; background: var(--cp-ok); border-radius: 999px; transition: width 0.3s; }
    }
  }

  /* 题目 */
  .cp-mg-q {
    margin-bottom: 16px;
    .cp-mg-qhead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      .cp-mg-qdim {
        font-size: 12.5px;
        font-weight: 700;
        color: var(--c);
        background: color-mix(in srgb, var(--c) 12%, transparent);
        padding: 3px 10px;
        border-radius: 999px;
      }
      .cp-mg-qidx { font-size: 12px; color: var(--cp-sub); }
    }
    .cp-mg-reanswer {
      margin-top: 6px;
      font-size: 12.5px;
      color: var(--cp-ok);
      text-align: right;
    }
  }

  /* 提交 */
  .cp-mg-submitbar {
    position: sticky;
    bottom: 12px;
    margin-top: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: var(--cp-card);
    border: 1px solid var(--cp-line);
    border-radius: 14px;
    padding: 12px 16px;
    box-shadow: var(--cp-shadow);
    span { font-size: 13.5px; color: var(--cp-ink); }
  }

  /* 结果 */
  .cp-mg-result {
    text-align: center;
    &.pass { border-color: rgba(16, 185, 129, 0.45); }
    &.fail { border-color: rgba(239, 68, 68, 0.35); }
    .cp-mg-score-ring {
      width: 128px;
      height: 128px;
      margin: 6px auto 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: conic-gradient(var(--cp-ok) calc(var(--pct) * 1%), var(--cp-card-2) 0);
      .cp-mg-score-in {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: var(--cp-card);
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 2px;
        b { font-size: 40px; color: var(--cp-ink); }
        span { font-size: 14px; color: var(--cp-sub); }
      }
    }
    &.fail .cp-mg-score-ring { background: conic-gradient(var(--cp-bad) calc(var(--pct) * 1%), var(--cp-card-2) 0); }
    h3 { color: var(--cp-ink); }
    p { text-align: center; }
    .cp-mg-delta {
      display: inline-block;
      margin: 4px 0 8px;
      font-size: 13px;
      font-weight: 700;
      padding: 5px 12px;
      border-radius: 999px;
      &.up { color: var(--cp-ok); background: rgba(16, 185, 129, 0.1); }
      &.down { color: var(--cp-bad); background: rgba(239, 68, 68, 0.09); }
    }
    .cp-mg-actions {
      margin-top: 14px;
      display: flex;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
    }
  }
}

/* ========= 移动端适配 ========= */
@media (max-width: 768px) {
  .cp-page { padding: 14px 14px 50px; }
  .page-top {
    flex-wrap: wrap;
    gap: 8px;
    .page-title { font-size: 18px; }
  }
  .cp-migrate {
    .cp-welcome-card { padding: 18px 16px; }
    .cp-panel { padding: 16px; }
    .cp-mg-submitbar {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
      .el-button { margin-left: 0; }
    }
  }
}
@media (max-width: 480px) {
  .cp-page { padding: 12px 12px 46px; }
  .cp-migrate {
    .cp-mg-modes { grid-template-columns: 1fr; }
    .cp-mg-hrow { flex-wrap: wrap; gap: 6px 10px; }
    .cp-mg-hmeta { flex: 1 1 100%; order: 1; }
    .cp-mg-hdate { order: 2; }
    .cp-mg-hrank { order: 3; }
    .cp-mg-actions { flex-direction: column; width: 100%; .el-button { margin-left: 0; width: 100%; } }
    .cp-mg-score-ring { width: 108px; height: 108px;
      .cp-mg-score-in { width: 84px; height: 84px; b { font-size: 32px; } }
    }
  }
}
</style>

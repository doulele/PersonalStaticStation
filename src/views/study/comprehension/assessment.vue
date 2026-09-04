<template>
  <div class="cp-page cp-assess">
    <div class="page-top">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <h1 class="page-title">自适应能力测评</h1>
    </div>

    <!-- 维度说明 / 开始 -->
    <section v-if="stage === 'intro'" class="cp-welcome-card">
      <h3>🎯 测评开始前，先了解流程</h3>
      <p>测评会按顺序考察 <b>抓主干 → 拆逻辑 → 译人话 → 追问批判</b> 四个维度。系统会根据你的作答自动调整难度：<b>连对 3 题升一层、连错 2 题结束当前维度</b>，通常 3~5 分钟完成。</p>
      <div class="cp-assess-dims">
        <div v-for="d in dimRows" :key="d.id" class="cp-assess-dim" :style="{ '--dim-c': d.color }">
          <span class="cp-assess-dim-icon">{{ d.icon }}</span>
          <div class="cp-assess-dim-body">
            <b>{{ d.id }} · {{ d.name }}</b>
            <p>{{ d.desc }}</p>
          </div>
        </div>
      </div>
      <el-button type="primary" size="large" class="cp-btn-main" :loading="busy" @click="begin">开始作答</el-button>
      <div class="cp-assess-tip">作答没有时间限制，但请凭第一直觉，尽量不要回头改。</div>
      <div v-if="ovErr" class="cp-quiz-err">{{ ovErr }}</div>
    </section>

    <!-- 答题 -->
    <section v-else-if="stage === 'quizzing'" class="cp-quiz">
      <!-- 头部：维度胶囊 + 计数 -->
      <div class="cp-quiz-top">
        <div class="cp-quiz-dims">
          <span
            v-for="d in dimRows"
            :key="d.id"
            class="cp-qdim"
            :class="{ active: d.id === curDim, done: isDimDone(d.id) }"
            :style="{ '--dim-c': d.color }"
          >
            <i></i>{{ d.id }}
          </span>
        </div>
        <span class="cp-quiz-count">已作答 {{ answered }}{{ needDims > 0 ? ' / 至多 ' + needDims * maxPerDim : '' }}</span>
      </div>

      <!-- 维度切换提示 -->
      <transition name="cp-fade">
        <div v-if="dimBanner" class="cp-dim-banner" :style="{ '--dim-c': dimColorOf(curDim) }">
          <span>{{ dimBanner }}</span>
        </div>
      </transition>

      <!-- 题目 -->
      <QuestionCard
        v-if="q"
        :key="q.qid"
        :question="q"
        :answered="answeredState"
        :correct="lastCorrect"
        :feedback-text="lastFeedback"
        @answer="onAnswer"
      />

      <!-- 正确/错误浮层 -->
      <transition name="cp-pop">
        <div v-if="flash" class="cp-flash" :class="flash === true ? 'ok' : 'bad'">
          {{ flash === true ? '✓ 回答正确' : '✗ 继续加油' }}
        </div>
      </transition>

      <!-- 题目加载失败：给出原因 + 重试，而不是静默卡住 -->
      <div v-if="!q && !busy && loadErr" class="cp-quiz-none">
        <p class="cp-quiz-err">{{ loadErr }}</p>
        <el-button type="primary" class="cp-btn-main" :loading="busy" @click="retryBegin">重新加载题目</el-button>
        <div class="cp-quiz-exit"><el-button link @click="saveExit">保存进度，稍后继续</el-button></div>
      </div>
      <div v-else-if="!q && !busy" class="cp-quiz-none">
        <span class="cp-loading-dot"></span>题目加载中…
      </div>

      <div class="cp-quiz-actions">
        <el-button v-if="!submitting && q" link @click="saveExit">保存进度，稍后继续</el-button>
      </div>
    </section>

    <!-- 结束 -->
    <section v-else-if="stage === 'done'" class="cp-welcome-card cp-done">
      <h3>✅ 测评完成，正在生成报告…</h3>
      <p>AI 正在汇总你的能力画像与训练建议，请稍候。</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { startAssessment, getAssessmentNext, submitAssessmentAnswer, finishAssessment } from '@/api/comprehension'
import { DIM_META } from './cp-meta'
import QuestionCard from './components/QuestionCard.vue'

const router = useRouter()
const goBack = () => router.push('/study/comprehension')

const stage = ref('loading') // intro | quizzing | done
const busy = ref(true)
const submitting = ref(false)
const ovErr = ref('')
const loadErr = ref('')

const session = ref(null)
const assessId = ref('')
const q = ref(null)
const curDim = ref('')
const answered = ref(0)
const answeredState = ref(false)
const lastCorrect = ref(null)
const lastFeedback = ref('')
const flash = ref(null)
const dimBanner = ref('')
let flashTimer = null
// 当前题展示时刻（用于统计答题耗时，而非提交瞬间）
let qShownAt = Date.now()

const dimRows = computed(() => DIM_META.map((m) => {
  const need = session.value ? (session.value.dims || []).some((d) => d.id === m.id && d.need) : false
  return { ...m, need }
}))
const needDims = computed(() => (session.value ? (session.value.dims || []).filter((d) => d.need).length : 0))
const maxPerDim = 8

function isDimDone(dimId) {
  const s = session.value && session.value.sessions && session.value.sessions[dimId]
  return !!(s && s.finished)
}
function dimColorOf(dimId) {
  const d = DIM_META.find((x) => x.id === dimId)
  return d ? d.color : 'var(--cp-accent)'
}

function nextNeedIdx() {
  const dims = session.value.dims || []
  for (let i = 0; i < dims.length; i++) {
    const d = dims[i]
    const s = session.value.sessions[d.id]
    if (d.need && !(s && s.finished)) return i
  }
  return -1
}

async function onAnswer(userAnswer) {
  if (submitting.value) return
  submitting.value = true
  answeredState.value = true
  try {
    const res = await submitAssessmentAnswer({ assessId: assessId.value, qid: q.value.qid, userAnswer, elapsed: Math.max(0, Date.now() - qShownAt) })
    if (!res.success) throw new Error(res.error || '提交失败')
    const d = res.data
    lastCorrect.value = !!d.correct
    lastFeedback.value = ''
    showFlash(d.correct)
    answered.value++
    await new Promise((r) => setTimeout(r, 900))
    if (d.allDone || !d.next) {
      await finishFlow()
    } else {
      setQ(d.next, d.nextDim)
    }
  } catch (e) {
    answeredState.value = false
    console.error(e)
  } finally {
    submitting.value = false
  }
}

function showFlash(correct) {
  flash.value = correct
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { flash.value = null }, 900)
}

function setQ(nq, dim) {
  if (dim && dim !== curDim.value) {
    const meta = DIM_META.find((x) => x.id === dim)
    dimBanner.value = `进入 ${dim} · ${meta ? meta.name : ''}`
    setTimeout(() => { dimBanner.value = '' }, 1400)
  }
  q.value = nq
  qShownAt = Date.now()
  curDim.value = dim || (nq && nq.dim) || ''
  answeredState.value = false
  lastCorrect.value = null
}

async function begin() {
  busy.value = true
  loadErr.value = ''
  try {
    const res = await getAssessmentNext()
    if (!res.success) throw new Error(res.error || '出题失败')
    const d = res.data
    if (!d.q) {
      if (d.allDone) return finishFlow()
      throw new Error(d.empty ? '题库中暂时没有适合你当前能力的题目，请稍后再试' : '暂无可用的测评题目，请先完成画像配置')
    }
    stage.value = 'quizzing'
    setQ(d.q, d.dim)
  } catch (e) {
    console.error(e)
    // 失败也进入答题态，展示错误原因 + 重试按钮，避免界面无响应
    stage.value = 'quizzing'
    loadErr.value = (e && e.message) || '题目加载失败，请重试'
  } finally {
    busy.value = false
  }
}

async function retryBegin() {
  await begin()
}

async function finishFlow() {
  stage.value = 'done'
  try {
    const res = await finishAssessment(assessId.value)
    if (!res.success) throw new Error(res.error || '报告生成失败')
    const id = (res.data && res.data.report && res.data.report.assessId) || assessId.value
    router.replace(`/study/comprehension/report/${id}`)
  } catch (e) {
    stage.value = 'quizzing'
    console.error(e)
  }
}

function saveExit() {
  router.push('/study/comprehension')
}

onMounted(async () => {
  try {
    const res = await startAssessment('all')
    if (!res.success) throw new Error(res.error || '无法开始测评')
    const d = res.data
    assessId.value = d.assessId
    session.value = d.session || {}
    // 恢复/继续：找到第一个未完成且需要测的维度
    const contIdx = nextNeedIdx()
    if (d.continuing && contIdx === -1) {
      stage.value = 'quizzing'
      return finishFlow()
    }
    stage.value = 'intro'
    if (d.continuing) {
      // 继续时静默跳过 intro，直接去下一题
      stage.value = 'quizzing'
      return begin()
    }
  } catch (e) {
    ovErr.value = e.message || '初始化失败'
    stage.value = 'intro'
  } finally {
    busy.value = false
  }
})

onBeforeUnmount(() => clearTimeout(flashTimer))
</script>

<style lang="scss" scoped>
.cp-page { min-height: 100vh; padding: 18px 22px 60px; max-width: 860px; margin: 0 auto; color: var(--cp-ink); }
.page-top { display: flex; align-items: center; gap: 12px; margin-bottom: 18px;
  .back-btn { display: inline-flex; align-items: center; gap: 4px; background: var(--cp-card); border: 1px solid var(--cp-line); color: var(--cp-ink); border-radius: 10px; padding: 7px 12px; font-size: 13px; cursor: pointer;
    &:hover { color: var(--cp-accent); border-color: var(--cp-accent); } }
  .page-title { font-size: 20px; margin: 0; }
}

.cp-welcome-card { background: var(--cp-card); border: 1px solid var(--cp-line); border-radius: 16px; padding: 26px 28px; box-shadow: var(--cp-shadow);
  h3 { margin: 0 0 10px; font-size: 18px; }
  p { color: var(--cp-sub); line-height: 1.85; font-size: 14px; margin: 0 0 20px;
    b { color: var(--cp-accent-strong); } }
}
.cp-btn-main { background: var(--cp-accent); border-color: var(--cp-accent); font-weight: 600; }
.cp-assess-tip { margin-top: 12px; font-size: 12.5px; color: var(--cp-sub); }

.cp-assess-dims { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 20px; }
.cp-assess-dim { display: flex; gap: 12px; align-items: flex-start; background: var(--cp-card-2); border: 1px solid var(--cp-line); border-radius: 12px; padding: 14px;
  .cp-assess-dim-icon { width: 38px; height: 38px; flex: none; border-radius: 10px; background: var(--cp-accent-softer); color: var(--dim-c); display: inline-flex; align-items: center; justify-content: center; font-size: 17px; }
  .cp-assess-dim-body b { font-size: 14px; }
  .cp-assess-dim-body p { margin: 6px 0 0; font-size: 12.5px; line-height: 1.6; color: var(--cp-sub); }
}

/* 答题 */
.cp-quiz-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.cp-quiz-dims { display: flex; gap: 8px; }
.cp-qdim { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 700; color: var(--cp-sub);
  padding: 4px 12px; border: 1px solid var(--cp-line); border-radius: 999px; background: var(--cp-card);
  i { width: 7px; height: 7px; border-radius: 50%; background: var(--cp-sub); }
  &.active { color: var(--dim-c); border-color: var(--dim-c);
    i { background: var(--dim-c); box-shadow: 0 0 0 3px var(--cp-accent-softer); } }
  &.done { color: var(--cp-ok); border-color: rgba(16, 185, 129, 0.5);
    i { background: var(--cp-ok); } }
}
.cp-quiz-count { font-size: 12.5px; color: var(--cp-sub); }

.cp-dim-banner { text-align: center; font-weight: 700; font-size: 15px; color: var(--dim-c); padding: 12px; margin-bottom: 12px;
  background: var(--cp-accent-softer); border: 1px dashed var(--dim-c); border-radius: 10px; }

.cp-flash { position: fixed; top: 44%; left: 50%; transform: translate(-50%, -50%); z-index: 40;
  padding: 26px 40px; border-radius: 16px; font-size: 22px; font-weight: 800; color: #fff; box-shadow: 0 12px 34px rgba(0, 0, 0, 0.18);
  &.ok { background: rgba(16, 185, 129, 0.92); }
  &.bad { background: rgba(239, 68, 68, 0.9); } }
.cp-pop-enter-active, .cp-pop-leave-active { transition: all 0.18s ease; }
.cp-pop-enter-from, .cp-pop-leave-to { opacity: 0; transform: translate(-50%, -46%); }

.cp-fade-enter-active, .cp-fade-leave-active { transition: opacity 0.25s; }
.cp-fade-enter-from, .cp-fade-leave-to { opacity: 0; }

.cp-quiz-none { padding: 40px 16px; text-align: center; color: var(--cp-sub);
  .cp-quiz-exit { margin-top: 12px; }
}
.cp-quiz-err {
  margin: 14px 0 0;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #e5484d;
  font-size: 13px;
  line-height: 1.7;
  text-align: center;
}
.cp-quiz-none .cp-quiz-err { margin: 0 0 16px; display: inline-block; }
.cp-loading-dot {
  display: inline-block;
  width: 8px; height: 8px;
  margin-right: 8px;
  border-radius: 50%;
  background: var(--cp-accent);
  animation: cp-pulse 1s ease-in-out infinite;
}
@keyframes cp-pulse {
  0%, 100% { opacity: 0.25; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.15); }
}
.cp-quiz-actions { display: flex; justify-content: center; margin-top: 16px; }
.cp-done { text-align: center; }

/* ========= 移动端适配 ========= */
@media (max-width: 768px) {
  .cp-page { padding: 14px 14px 50px; }
  .page-top {
    flex-wrap: wrap;
    gap: 8px;
    .page-title { font-size: 18px; }
  }
  .cp-welcome-card { padding: 20px 18px; }
}
@media (max-width: 480px) {
  .cp-page { padding: 12px 12px 46px; }
  .cp-welcome-card h3 { font-size: 16.5px; }
  .cp-assess-dims { grid-template-columns: 1fr; }
  .cp-quiz-top { flex-direction: column; align-items: flex-start; }
  .cp-flash { padding: 18px 26px; font-size: 18px; }
}
</style>

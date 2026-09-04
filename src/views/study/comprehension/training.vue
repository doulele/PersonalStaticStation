<template>
  <div class="cp-page">
    <div class="page-top">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <h1 class="page-title">每日训练</h1>
      <span class="page-sub">{{ todayText }}</span>
    </div>

    <!-- 初始化加载 -->
    <div v-if="loading" class="cp-loading">加载今日训练状态…</div>

    <!-- 休息日 -->
    <section v-else-if="today.rest && !tasks.length" class="cp-welcome-card">
      <h3>😴 今天是休息日</h3>
      <p>{{ today.restMessage || '训练讲究劳逸结合，休息日就好好放松吧。' }} 明天见！</p>
      <div class="cp-welcome-actions">
        <el-button @click="$router.push('/study/comprehension/growth')">看看成长记录</el-button>
        <el-button link type="primary" @click="$router.push('/study/comprehension/mistakes')">巩固错题</el-button>
      </div>
    </section>

    <!-- 开始前 -->
    <section v-else-if="!tasks.length" class="cp-welcome-card">
      <h3>⚡ {{ today.done ? '继续今天的训练' : '开始今天的训练' }}</h3>
      <p>
        今天为你安排了 <b>{{ intensityName }}强度</b> 的组合训练：优先突破最薄弱维度，同时维护已稳定维度。
        主观题作答后会得到 AI 点评，全部完成自动打卡。
      </p>
      <div v-if="today.done" class="cp-done-note">今日已完成 {{ today.done }} 题，连续打卡 {{ today.streak }} 天。</div>
      <div class="cp-welcome-actions">
        <el-button type="primary" size="large" class="cp-btn-main" :loading="genBusy" @click="generate">
          {{ today.done ? '继续训练' : '生成今日任务' }}
        </el-button>
        <el-button link @click="$router.push('/study/comprehension/profile')">调整训练设置</el-button>
      </div>
    </section>

    <!-- 答题中 -->
    <template v-else>
      <!-- 进度 -->
      <section class="cp-progress">
        <div v-for="(t, i) in tasks" :key="t.qid" class="cp-prog-chip"
          :class="{ done: results[i] != null, cur: i === idx && !allDone }">
          <i></i>
          <span>第{{ i + 1 }}题</span>
          <em v-if="results[i] != null">{{ results[i].correct ? '✓' : '✗' }}</em>
        </div>
        <div class="cp-progress-meta">
          <span class="cp-role-tag" v-if="curTask">{{ curTask.role }}</span>
          <span class="cp-streak" v-if="today.streak">🔥 连续 {{ today.streak }} 天</span>
        </div>
      </section>

      <!-- 题目与反馈 -->
      <section v-if="!allDone" class="cp-quiz">
        <QuestionCard
          v-if="curTask && !feedback"
          :key="curTask.qid"
          :question="curTask.q"
          @answer="onAnswer"
        />
        <div v-if="submitting" class="cp-submitting">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>判分中…</span>
        </div>

        <!-- 反馈面板 -->
        <transition name="cp-fade">
          <div v-if="feedback" class="cp-fb" :class="feedback.correct ? 'ok' : 'bad'">
            <div class="cp-fb-head">
              <b>{{ feedback.correct ? '✓ 答对了' : '✗ 答错了' }}</b>
              <span v-if="feedback.feedback && feedback.feedback.type === 'd3'" class="cp-fb-hit">关键词命中 {{ feedback.feedback.hit || 0 }}%</span>
            </div>
            <p v-if="feedback.feedback && feedback.feedback.text" class="cp-fb-text">{{ feedback.feedback.text }}</p>
            <p v-if="feedback.gain" class="cp-fb-gain">🌱 {{ feedback.gain }}</p>

            <div class="cp-fb-vote">
              <span class="cp-fb-vote-label">这题难度：</span>
              <el-button size="small" :disabled="voted" @click="vote('hard')">太难</el-button>
              <el-button size="small" type="primary" plain :disabled="voted" @click="vote('ok')">刚好</el-button>
              <el-button size="small" :disabled="voted" @click="vote('easy')">简单</el-button>
              <span v-if="autoDown" class="cp-auto-down">已连续 3 次「太难」，训练强度自动降低一档</span>
            </div>

            <div class="cp-fb-next">
              <el-button type="primary" class="cp-btn-main" @click="nextTask">
                {{ isLast ? '完成今日训练 🎉' : '下一题 →' }}
              </el-button>
            </div>
          </div>
        </transition>
      </section>

      <!-- 全部完成 -->
      <section v-else class="cp-welcome-card cp-done-view">
        <div class="cp-done-emoji">🎉</div>
        <h3>今日训练完成！</h3>
        <p>
          完成 {{ tasks.length }} 题，
          答对 {{ doneCount }} 题{{ today.checked ? '，已自动打卡' : '' }}。
          <template v-if="today.streak">连续打卡 {{ today.streak }} 天 🔥</template>
        </p>
        <div class="cp-done-summary">
          <div v-for="(t, i) in tasks" :key="t.qid" class="cp-done-item">
            <span class="cp-done-item-mark" :class="results[i] && results[i].correct ? 'ok' : 'bad'">
              {{ results[i] && results[i].correct ? '✓' : '✗' }}
            </span>
            <span class="cp-done-item-dim">{{ t.dim }} {{ t.role }}</span>
            <span class="cp-done-item-lv">L{{ t.level }}</span>
          </div>
        </div>
        <div class="cp-welcome-actions">
          <el-button type="primary" size="large" class="cp-btn-main" @click="$router.push('/study/comprehension')">返回总览</el-button>
          <el-button @click="$router.push('/study/comprehension/mistakes')">查看错题本</el-button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Loading, ArrowLeft } from '@element-plus/icons-vue'
import { getTrainingToday, generateTraining, submitTraining, voteDifficulty } from '@/api/comprehension'
import { dimById } from './cp-meta'
import QuestionCard from './components/QuestionCard.vue'

const router = useRouter()
const goBack = () => router.push('/study/comprehension')

const loading = ref(true)
const genBusy = ref(false)
const submitting = ref(false)
const today = ref({ rest: false, done: 0, checked: false, streak: 0, intensity: 'standard' })
const tasks = ref([])
const results = ref([])
const idx = ref(0)
const feedback = ref(null)
const voted = ref(false)
const autoDown = ref(false)
let lastQid = ''
let lastRole = ''
// 当前题展示时刻（用于统计答题耗时，而非提交瞬间）
let taskShownAt = Date.now()

const INT_NAME = { light: '轻松', standard: '标准', deep: '深度' }
const intensityName = computed(() => INT_NAME[today.value.intensity] || '标准')
const curTask = computed(() => tasks.value[idx.value])
const isLast = computed(() => idx.value >= tasks.value.length - 1)
const allDone = computed(() => tasks.value.length > 0 && idx.value >= tasks.value.length)
const doneCount = computed(() => results.value.filter((r) => r && r.correct).length)
const todayText = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

async function generate() {
  genBusy.value = true
  try {
    const res = await generateTraining()
    if (!res.success) throw new Error(res.error || '生成失败')
    const d = res.data
    if (d.restDay) {
      today.value = { ...today.value, rest: true, restMessage: d.message || '休息日' }
      return
    }
    tasks.value = d.tasks || []
    results.value = new Array(tasks.value.length).fill(null)
    idx.value = 0
    feedback.value = null
    taskShownAt = Date.now()
    // 今日已完成若干题时，直接跳过已答部分，避免重复（correct 取后端真实对错）
    const done = today.value.done || 0
    if (d.already && done > 0 && done <= tasks.value.length) {
      idx.value = done
      for (let i = 0; i < done; i++) results.value[i] = { correct: !!(tasks.value[i] && tasks.value[i].correct) }
    }
  } catch (e) {
    console.error(e)
  } finally {
    genBusy.value = false
  }
}

async function onAnswer(userAnswer) {
  if (submitting.value) return
  submitting.value = true
  feedback.value = null
  lastQid = curTask.value.qid
  lastRole = curTask.value.role
  const elapsed = Math.max(0, Date.now() - taskShownAt)
  try {
    const res = await submitTraining({
      qid: curTask.value.qid,
      userAnswer,
      elapsed,
      role: curTask.value.role
    })
    if (!res.success) throw new Error(res.error || '提交失败')
    const d = res.data
    results.value[idx.value] = { correct: !!d.correct }
    feedback.value = { correct: !!d.correct, feedback: d.feedback, gain: d.gain }
    today.value = { ...today.value, done: d.todayCount ?? (today.value.done + 1), checked: d.checked, streak: d.streak ?? today.value.streak }
    voted.value = false
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

async function vote(v) {
  voted.value = true
  try {
    const res = await voteDifficulty({ qid: lastQid, vote: v })
    if (res.success && res.data && res.data.autoDown) autoDown.value = true
  } catch (e) {
    voted.value = false
    console.error(e)
  }
}

function nextTask() {
  feedback.value = null
  idx.value++
  taskShownAt = Date.now()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  try {
    const res = await getTrainingToday()
    if (res.success) today.value = { rest: false, done: 0, checked: false, streak: 0, intensity: 'standard', ...res.data }
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.cp-page { min-height: 100vh; padding: 18px 22px 60px; max-width: 860px; margin: 0 auto; color: var(--cp-ink); }
.page-top { display: flex; align-items: center; gap: 12px; margin-bottom: 18px;
  .back-btn { display: inline-flex; align-items: center; gap: 4px; background: var(--cp-card); border: 1px solid var(--cp-line); color: var(--cp-ink); border-radius: 10px; padding: 7px 12px; font-size: 13px; cursor: pointer;
    &:hover { color: var(--cp-accent); border-color: var(--cp-accent); } }
  .page-title { font-size: 20px; margin: 0; }
  .page-sub { font-size: 13px; color: var(--cp-sub); }
}
.cp-loading { padding: 60px 0; text-align: center; color: var(--cp-sub); }
.cp-welcome-card { background: var(--cp-card); border: 1px solid var(--cp-line); border-radius: 16px; padding: 26px 28px; box-shadow: var(--cp-shadow);
  h3 { margin: 0 0 10px; font-size: 18px; }
  p { color: var(--cp-sub); line-height: 1.85; font-size: 14px; margin: 0 0 16px;
    b { color: var(--cp-accent-strong); } }
  .cp-welcome-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .cp-done-note { margin-bottom: 14px; font-size: 13px; color: var(--cp-accent-strong); background: var(--cp-accent-softer); border-radius: 10px; padding: 10px 14px; }
}
.cp-btn-main { background: var(--cp-accent); border-color: var(--cp-accent); font-weight: 600; }

/* 进度 */
.cp-progress { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 14px;
  .cp-progress-meta { margin-left: auto; display: inline-flex; align-items: center; gap: 10px; }
}
.cp-prog-chip { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--cp-sub); padding: 5px 11px; border: 1px solid var(--cp-line); border-radius: 999px; background: var(--cp-card);
  i { width: 7px; height: 7px; border-radius: 50%; background: var(--cp-sub); }
  &.cur { border-color: var(--cp-accent); color: var(--cp-accent-strong); font-weight: 700;
    i { background: var(--cp-accent); box-shadow: 0 0 0 3px var(--cp-accent-soft); } }
  &.done { border-color: rgba(16, 185, 129, 0.45); color: var(--cp-ok);
    i { background: var(--cp-ok); }
    em { font-style: normal; font-weight: 800; } }
}
.cp-role-tag { font-size: 12px; background: var(--cp-accent-soft); color: var(--cp-accent-strong); border-radius: 999px; padding: 3px 11px; font-weight: 600; }
.cp-streak { font-size: 12px; color: var(--cp-warn); }

.cp-submitting { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 40px; color: var(--cp-sub); }

/* 反馈 */
.cp-fb { margin-top: 16px; border-radius: 14px; padding: 18px 20px; border: 1px solid;
  &.ok { background: rgba(16, 185, 129, 0.07); border-color: rgba(16, 185, 129, 0.35); }
  &.bad { background: rgba(239, 68, 68, 0.06); border-color: rgba(239, 68, 68, 0.3); }
  .cp-fb-head { display: flex; align-items: center; justify-content: space-between;
    b { font-size: 16px; color: var(--cp-ink); }
    .cp-fb-hit { font-size: 12px; color: var(--cp-sub); } }
  .cp-fb-text { margin: 10px 0 0; font-size: 13.5px; line-height: 1.85; color: var(--cp-ink); white-space: pre-wrap; }
  .cp-fb-gain { margin: 8px 0 0; font-size: 13px; line-height: 1.7; color: var(--cp-accent-strong); }
  .cp-fb-vote { margin-top: 14px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-top: 12px; border-top: 1px dashed var(--cp-line);
    .cp-fb-vote-label { font-size: 12.5px; color: var(--cp-sub); }
    .cp-auto-down { width: 100%; font-size: 12px; color: var(--cp-warn); } }
  .cp-fb-next { margin-top: 14px; text-align: right; }
}
.cp-fade-enter-active, .cp-fade-leave-active { transition: opacity 0.2s; }
.cp-fade-enter-from, .cp-fade-leave-to { opacity: 0; }

/* done */
.cp-done-view { text-align: center;
  .cp-done-emoji { font-size: 52px; }
  h3 { font-size: 22px; }
  p { justify-content: center; }
  .cp-done-summary { max-width: 520px; margin: 0 auto 20px; text-align: left; display: flex; flex-direction: column; gap: 8px; }
}
.cp-done-item { display: flex; align-items: center; gap: 10px; background: var(--cp-card-2); border: 1px solid var(--cp-line); border-radius: 10px; padding: 10px 14px;
  .cp-done-item-mark { width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; color: #fff;
    &.ok { background: var(--cp-ok); }
    &.bad { background: var(--cp-bad); } }
  .cp-done-item-dim { flex: 1; font-size: 13.5px; font-weight: 600; }
  .cp-done-item-lv { font-size: 12px; color: var(--cp-sub); } }
.cp-welcome-actions { justify-content: center; }

/* ========= 移动端适配 ========= */
@media (max-width: 768px) {
  .cp-page { padding: 14px 14px 50px; }
  .page-top {
    flex-wrap: wrap;
    gap: 8px;
    .page-title { font-size: 18px; }
  }
  .cp-welcome-card { padding: 20px 18px; }
  .cp-progress { align-items: flex-start; }
  .cp-progress-meta { margin-left: 0; width: 100%; }
  .cp-fb { padding: 16px; }
}
@media (max-width: 480px) {
  .cp-page { padding: 12px 12px 46px; }
  .cp-prog-chip { padding: 4px 9px; }
  .cp-welcome-card h3 { font-size: 16.5px; }
  .cp-fb-head { flex-direction: column; align-items: flex-start; gap: 4px; }
  .cp-fb-vote { gap: 6px; }
  .cp-fb-next { text-align: center; .cp-btn-main { width: 100%; } }
  .cp-done-item { padding: 8px 12px; }
}
</style>

<template>
  <div class="iv-page">
    <!-- 顶部 -->
    <div class="iv-top">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <h1 class="iv-title">面试模拟</h1>
    </div>

    <!-- Tab 切换 -->
    <div class="iv-tabs">
      <button class="iv-tab" :class="{ active: tab === 'exam' }" @click="switchTab('exam')">模拟面试</button>
      <button class="iv-tab" :class="{ active: tab === 'hot' }" @click="switchTab('hot')">高频题专区</button>
      <button class="iv-tab" :class="{ active: tab === 'history' }" @click="switchTab('history')">考试记录</button>
    </div>

    <!-- ==================== 模拟面试 ==================== -->
    <div v-if="tab === 'exam'" class="iv-exam">
      <!-- 配置页 -->
      <template v-if="step === 'config'">
        <div class="iv-config">
          <div class="config-hero">
            <div class="hero-icon">🎯</div>
            <h2>整卷面试模拟</h2>
            <p>从专属面试题库组卷，交卷后统一评分并生成报告</p>
          </div>

          <div class="config-block">
            <div class="block-label">题库范围</div>
            <div class="scope-grid">
              <button class="scope-card" :class="{ active: scope === 'all' }" @click="scope = 'all'">
                <span class="scope-emoji">📚</span>
                <span class="scope-name">全量题库</span>
                <span class="scope-count">{{ overview.total || '—' }} 题</span>
              </button>
              <button class="scope-card" :class="{ active: scope === 'hot' }" @click="scope = 'hot'">
                <span class="scope-emoji">🔥</span>
                <span class="scope-name">高频冲刺</span>
                <span class="scope-count">{{ overview.hotTotal || '—' }} 题</span>
              </button>
            </div>
            <div v-if="scope === 'all'" class="cat-pick">
              <span class="cat-label">按分类组卷（可选）</span>
              <div class="cat-chips">
                <button class="cat-chip" :class="{ active: !cat }" @click="cat = ''">全部</button>
                <button
                  v-for="c in CATEGORIES"
                  :key="c.id"
                  class="cat-chip"
                  :class="{ active: cat === c.id }"
                  @click="cat = cat === c.id ? '' : c.id"
                >
                  {{ c.name }}<i v-if="overview.qMap && overview.qMap[c.id]"> {{ overview.qMap[c.id] }}</i>
                </button>
              </div>
            </div>
          </div>

          <div class="config-block">
            <div class="block-label">题目数量</div>
            <el-radio-group v-model="count">
              <el-radio-button :value="5">5 题</el-radio-button>
              <el-radio-button :value="10">10 题</el-radio-button>
              <el-radio-button :value="20">20 题</el-radio-button>
            </el-radio-group>
            <div v-if="availableCount && count > availableCount" class="count-tip">
              当前范围仅 {{ availableCount }} 题，将按实际数量组卷
            </div>
          </div>

          <button class="start-btn" :disabled="starting" @click="startExam">
            <el-icon v-if="starting" class="is-loading"><Loading /></el-icon>
            <span>{{ starting ? '正在组卷…' : '开始面试' }}</span>
          </button>
        </div>
      </template>

      <!-- 答题页 -->
      <template v-else-if="step === 'exam'">
        <div class="iv-exam-body">
          <!-- 题号导航 -->
          <div class="answer-nav">
            <div class="nav-head">
              <span>答题卡</span>
              <span class="nav-count">{{ answeredCount }} / {{ questions.length }}</span>
            </div>
            <div class="nav-grid">
              <button
                v-for="(q, qi) in questions"
                :key="q.id"
                class="nav-num"
                :class="{
                  current: qi === currentIndex,
                  done: answers[q.id] !== undefined && qi !== currentIndex,
                  wrong: step === 'report' && reportDetail[q.id] && !reportDetail[q.id].correct
                }"
                @click="goTo(qi)"
              >
                {{ qi + 1 }}
              </button>
            </div>
            <el-button type="primary" class="submit-btn" @click="submitExam">
              交卷（{{ answeredCount }}/{{ questions.length }}）
            </el-button>
          </div>

          <!-- 题目 -->
          <div class="exam-question">
            <div class="q-meta">
              <span class="q-tag" :class="current.type">{{ questionTypeName(current.type) }}</span>
              <span class="q-level" :style="{ background: levelColor(current.level) }">{{ levelName(current.level) }}</span>
              <span class="q-hot" v-if="current.hot">🔥 高频</span>
            </div>
            <h2 class="q-text markdown-body" v-html="renderedQ"></h2>

            <div class="q-options">
              <template v-if="current.type !== 'multi'">
                <button
                  v-for="(opt, oi) in current.options"
                  :key="oi"
                  class="q-option"
                  :class="{ selected: answers[current.id] === oi }"
                  @click="pickSingle(oi)"
                >
                  <span class="opt-letter">{{ String.fromCharCode(65 + oi) }}</span>
                  <span class="opt-text">{{ opt }}</span>
                </button>
              </template>
              <template v-else>
                <button
                  v-for="(opt, oi) in current.options"
                  :key="oi"
                  class="q-option"
                  :class="{ selected: multiPick.includes(oi) }"
                  @click="toggleMulti(oi)"
                >
                  <span class="opt-letter">{{ String.fromCharCode(65 + oi) }}</span>
                  <span class="opt-text">{{ opt }}</span>
                </button>
              </template>
            </div>

            <div v-if="current.type === 'multi'" class="multi-confirm">
              <el-button type="primary" :disabled="!multiPick.length" @click="confirmMulti">确认本题（已选 {{ multiPick.length }}）</el-button>
            </div>

            <div class="exam-actions">
              <el-button @click="prev">上一题</el-button>
              <el-button v-if="currentIndex < questions.length - 1" type="primary" @click="next">下一题</el-button>
              <el-button v-else type="primary" @click="submitExam">交卷</el-button>
            </div>
          </div>
        </div>
      </template>

      <!-- 评分报告 -->
      <template v-else-if="step === 'report'">
        <div class="iv-report">
          <div class="report-hero" :class="{ pass: report.rate >= 60 }">
            <div class="report-score">{{ report.rate }}<span>%</span></div>
            <h2>{{ report.rate >= 80 ? '面试表现优秀' : report.rate >= 60 ? '面试表现良好' : '还需加强' }}</h2>
            <p>共 {{ report.total }} 题，答对 {{ report.correctCount }} 题，答错 {{ report.wrongCount }} 题</p>
          </div>

          <div class="report-grid">
            <div class="report-card">
              <div class="rc-title">分类表现</div>
              <div class="cat-bars">
                <div v-for="(st, cid) in report.catStats" :key="cid" class="cat-bar-row">
                  <span class="cb-name">{{ catName(cid) }}</span>
                  <div class="cb-track">
                    <div class="cb-fill" :style="{ width: (st.correct / st.total) * 100 + '%' }"></div>
                  </div>
                  <span class="cb-num">{{ st.correct }}/{{ st.total }}</span>
                </div>
              </div>
            </div>
            <div class="report-card">
              <div class="rc-title">本次收获</div>
              <div class="gain-list">
                <div class="gain-item"><span class="gain-icon">⚡</span>经验值 <b>+{{ report.gained }}</b></div>
                <div class="gain-item"><span class="gain-icon">🏅</span>当前等级 <b>{{ levelNameByKey(report.levelKey) }}</b></div>
                <div class="gain-item" v-if="report.newAchievements && report.newAchievements.length">
                  <span class="gain-icon">🎉</span>新成就
                  <b>{{ newAchievementNames }}</b>
                </div>
              </div>
            </div>
          </div>

          <!-- 错题回顾 -->
          <div class="report-wrong">
            <div class="rw-head">
              <span>错题回顾（{{ wrongList.length }}）</span>
            </div>
            <div v-for="(d, di) in wrongList" :key="d.qid" class="rw-item">
              <div class="rw-q">
                <span class="rw-idx">{{ di + 1 }}</span>
                <div>
                  <p class="rw-text markdown-body" v-html="renderMarkdown(d.q)"></p>
                  <p class="rw-yours">你的答案：<b class="yours-bad">{{ answerText(d) }}</b></p>
                  <p class="rw-right">正确答案：<b>{{ answerText(d, true) }}</b></p>
                  <a v-if="d.ref" :href="d.ref" target="_blank" rel="noopener" class="iv-ref">
                    <el-icon><Link /></el-icon>
                    <span>参考文档</span>
                  </a>
                </div>
              </div>
              <div class="rw-explain markdown-body" v-html="renderMarkdown(d.explain)"></div>
            </div>
            <el-empty v-if="!wrongList.length" description="全部答对，太棒了" :image-size="80" />
          </div>

          <div class="report-actions">
            <el-button @click="resetExam">再来一次</el-button>
            <el-button @click="switchTab('hot')">去高频题冲刺</el-button>
            <el-button type="primary" @click="goBack">返回总览</el-button>
          </div>
        </div>
      </template>
    </div>

    <!-- ==================== 高频题专区 ==================== -->
    <div v-if="tab === 'hot'" class="iv-hot" v-loading="hotLoading">
      <div class="hot-head">
        <h2>🔥 高频面试题</h2>
        <span class="hot-sub">从专属题库精选 {{ hotList.length }} 道高频题，面试官最爱追问</span>
      </div>
      <div class="hot-filters">
        <el-select v-model="hotCat" placeholder="全部分类" clearable size="default" @change="loadHot">
          <el-option v-for="c in CATEGORIES" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-button :icon="Search" circle @click="loadHot" />
      </div>

      <div class="hot-list">
        <div v-for="q in hotList" :key="q.id" class="hot-item">
          <div class="hi-meta">
            <span class="q-tag" :class="q.type">{{ questionTypeName(q.type) }}</span>
            <span class="q-level" :style="{ background: levelColor(q.level) }">{{ levelName(q.level) }}</span>
            <span class="hi-cat">{{ catName(q.cat) }}</span>
            <button class="fav-btn" :class="{ active: isFav(q.id) }" @click="toggleFav(q.id)">
              <el-icon><StarFilled v-if="isFav(q.id)" /><Star v-else /></el-icon>
            </button>
          </div>
          <p class="hi-q markdown-body" v-html="renderMarkdown(q.q)"></p>
          <button class="hi-toggle" @click="toggleHotDetail(q.id)">
            {{ openedHot[q.id] ? '收起解析' : '查看解析' }}
            <el-icon><ArrowUp v-if="openedHot[q.id]" /><ArrowDown v-else /></el-icon>
          </button>
          <div v-if="openedHot[q.id]" class="hi-detail">
            <div class="hi-answer">
              <span class="hi-label">答案</span>
              <span class="hi-answer-text">{{ answerText(q, true) }}</span>
            </div>
            <div class="hi-explain">
              <span class="hi-label">解析</span>
              <span class="markdown-body" v-html="renderMarkdown(q.explain)"></span>
              <a v-if="q.ref" :href="q.ref" target="_blank" rel="noopener" class="iv-ref">
                <el-icon><Link /></el-icon>
                <span>参考文档</span>
              </a>
            </div>
          </div>
        </div>
        <el-empty v-if="!hotLoading && !hotList.length" description="暂无高频题" />
      </div>
    </div>

    <!-- ==================== 考试记录 ==================== -->
    <div v-if="tab === 'history'" class="iv-history" v-loading="historyLoading">
      <div class="history-head">
        <h2>📋 考试记录</h2>
        <span class="hot-sub">最近 50 次模拟面试</span>
      </div>
      <div class="history-list">
        <div v-for="h in historyList" :key="h.id" class="history-item" @click="viewHistory(h.id)">
          <div class="hi-score" :class="{ pass: h.rate >= 60 }">{{ h.rate }}<span>%</span></div>
          <div class="hi-info">
            <p class="hi-q">{{ h.correct }}/{{ h.total }} 答对</p>
            <p class="hi-time">{{ formatTime(h.time) }}</p>
          </div>
          <el-icon class="hi-arrow"><ArrowRight /></el-icon>
        </div>
        <el-empty v-if="!historyLoading && !historyList.length" description="还没有考试记录，去模拟一次吧" />
      </div>

      <!-- 历史详情抽屉 -->
      <el-drawer v-model="historyDrawer" size="72%" class="history-drawer" :title="'考试详情 ' + (currentHistory ? formatTime(currentHistory.time) : '')">
        <div v-if="currentHistory" class="history-detail">
          <div class="hd-summary">
            <span>得分 <b :class="{ pass: currentHistory.rate >= 60 }">{{ currentHistory.rate }}%</b></span>
            <span>答对 <b>{{ currentHistory.correct }}/{{ currentHistory.total }}</b></span>
          </div>
          <div v-for="(d, di) in currentHistory.detail" :key="d.qid" class="hd-item" :class="{ wrong: !d.correct }">
            <div class="hd-q">
              <span class="hd-idx">{{ di + 1 }}</span>
              <span class="hd-mark">{{ d.correct ? '✓' : '✗' }}</span>
              <p class="hd-text markdown-body" v-html="renderMarkdown(d.q)"></p>
            </div>
            <div v-if="!d.correct" class="hd-answer">
              <p class="rw-yours">你的答案：<b class="yours-bad">{{ answerText(d) }}</b></p>
              <p class="rw-right">正确答案：<b>{{ answerText(d, true) }}</b></p>
              <p class="rw-explain markdown-body" v-html="renderMarkdown(d.explain)"></p>
              <a v-if="d.ref" :href="d.ref" target="_blank" rel="noopener" class="iv-ref">
                <el-icon><Link /></el-icon>
                <span>参考文档</span>
              </a>
            </div>
          </div>
        </div>
      </el-drawer>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import {
  ArrowLeft, ArrowUp, ArrowDown, ArrowRight, Star, StarFilled, Loading, Search, Link
} from '@element-plus/icons-vue'
import { getInterviewQuestions, getInterviewOverview, submitInterview, getInterviewHistory, getInterviewHistoryDetail } from '@/api/knowledgeGraph'
import { CATEGORIES, getLevel } from '../data/categories'
import { ACHIEVEMENTS } from '../data/meta'
import { questionTypeName } from '../utils/quiz'
import { renderMarkdown } from '../utils/markdown'

const router = useRouter()
const store = useStore()

const tab = ref('exam')
const step = ref('config') // config | exam | report

const overview = ref({})
const scope = ref('all')
const cat = ref('')
const count = ref(10)
const starting = ref(false)
const submitting = ref(false)

const questions = ref([])
const currentIndex = ref(0)
const answers = reactive({}) // qid -> userAnswer
const multiPick = ref([])

const report = ref({})
const reportDetail = reactive({})
const wrongList = computed(() => report.value.detail ? report.value.detail.filter(d => !d.correct) : [])

// 高频题
const hotList = ref([])
const hotCat = ref('')
const hotLoading = ref(false)
const openedHot = reactive({})

// 历史
const historyList = ref([])
const historyLoading = ref(false)
const historyDrawer = ref(false)
const currentHistory = ref(null)

const current = computed(() => questions.value[currentIndex.value] || null)
const renderedQ = computed(() => renderMarkdown(current.value?.q || ''))
const answeredCount = computed(() => Object.keys(answers).filter(k => answers[k] !== undefined).length)

const availableCount = computed(() => {
  if (scope.value === 'hot') return overview.value.hotTotal || 0
  if (cat.value) return overview.value.qMap?.[cat.value] || 0
  return overview.value.total || 0
})

const favoriteIds = computed(() => store.getters['frontendDev/favoriteIds'])
function isFav(qid) { return favoriteIds.value.includes(qid) }

function levelName(l) { return getLevel(l)?.name || '' }
function levelColor(l) { return getLevel(l)?.color || '#94a3b8' }
function levelNameByKey(key) {
  const map = { junior: '初级', middle: '中级', senior: '高级', expert: '专家' }
  return map[key] || key
}
function catName(cid) { return CATEGORIES.find(c => c.id === cid)?.name || cid }
const newAchievementNames = computed(() => {
  const ids = report.value.newAchievements || []
  return ids.map(id => ACHIEVEMENTS.find(a => a.id === id)?.name || id).join('、')
})

function switchTab(t) {
  tab.value = t
  if (t === 'hot' && !hotList.value.length) loadHot()
  if (t === 'history' && !historyList.value.length) loadHistory()
}

function pickSingle(oi) {
  answers[current.value.id] = oi
}
function toggleMulti(oi) {
  const idx = multiPick.value.indexOf(oi)
  if (idx >= 0) multiPick.value.splice(idx, 1)
  else multiPick.value.push(oi)
}
function confirmMulti() {
  answers[current.value.id] = [...multiPick.value]
}
function goTo(qi) {
  currentIndex.value = qi
  syncMulti()
}
function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    syncMulti()
  }
}
function next() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    syncMulti()
  }
}
function syncMulti() {
  const q = current.value
  if (q && q.type === 'multi') {
    multiPick.value = answers[q.id] ? [...answers[q.id]] : []
  } else {
    multiPick.value = []
  }
}

async function startExam() {
  starting.value = true
  try {
    const params = {}
    if (scope.value === 'hot') params.hot = '1'
    if (scope.value === 'all' && cat.value) params.cat = cat.value
    params.mode = 'random'
    const res = await getInterviewQuestions(params)
    if (!res.success) return
    let list = res.data || []
    // 组卷：按所选数量截取
    const take = Math.min(count.value, list.length)
    questions.value = list.slice(0, take)
    if (!questions.value.length) return
    step.value = 'exam'
    currentIndex.value = 0
    Object.keys(answers).forEach(k => delete answers[k])
    multiPick.value = []
  } finally {
    starting.value = false
  }
}

async function submitExam() {
  if (submitting.value) return
  submitting.value = true
  try {
    const list = questions.value.map(q => ({
      qid: q.id,
      userAnswer: answers[q.id] !== undefined ? answers[q.id] : null
    }))
    const res = await submitInterview({ answers: list })
    if (!res.success) return
    report.value = res.data
    // 报告详情按 qid 索引
    Object.keys(reportDetail).forEach(k => delete reportDetail[k])
    ;(res.data.detail || []).forEach(d => { reportDetail[d.qid] = d })
    store.dispatch('frontendDev/loadProgress')
    step.value = 'report'
  } finally {
    submitting.value = false
  }
}

function resetExam() {
  step.value = 'config'
  Object.keys(answers).forEach(k => delete answers[k])
  report.value = {}
  Object.keys(reportDetail).forEach(k => delete reportDetail[k])
}

function answerText(d, showRight = false) {
  const q = d
  if (q.type === 'multi') {
    const arr = showRight ? q.answer : (q.userAnswer || [])
    return arr.length ? arr.map(i => String.fromCharCode(65 + i)).join('、') : '未作答'
  }
  if (q.type === 'judge') {
    const val = showRight ? q.answer : q.userAnswer
    if (val === undefined || val === null) return '未作答'
    const bool = typeof val === 'boolean' ? val : val === 0
    return bool ? '正确' : '错误'
  }
  const val = showRight ? q.answer : q.userAnswer
  if (val === undefined || val === null) return '未作答'
  return String.fromCharCode(65 + Number(val))
}

async function loadHot() {
  hotLoading.value = true
  try {
    const params = { hot: '1' }
    if (hotCat.value) params.cat = hotCat.value
    const res = await getInterviewQuestions(params)
    if (res.success) hotList.value = res.data || []
  } finally {
    hotLoading.value = false
  }
}
function toggleHotDetail(qid) {
  openedHot[qid] = !openedHot[qid]
}

async function loadHistory() {
  historyLoading.value = true
  try {
    const res = await getInterviewHistory()
    if (res.success) historyList.value = res.data || []
  } finally {
    historyLoading.value = false
  }
}
async function viewHistory(id) {
  const res = await getInterviewHistoryDetail(id)
  if (res.success) {
    currentHistory.value = res.data
    historyDrawer.value = true
  }
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function toggleFav(qid) {
  await store.dispatch('frontendDev/toggleFavorite', qid)
}

function goBack() {
  router.push('/study/frontend-dev')
}

onMounted(async () => {
  const res = await getInterviewOverview()
  if (res.success) overview.value = res.data
  store.dispatch('frontendDev/loadProgress')
})
</script>

<style lang="scss" src="./index.scss"></style>

<style lang="scss">
html.dark-mode .iv-page {
  .iv-title { color: #e2dee9; }
  .back-btn { color: #94a3b8; &:hover { background: #2d2d4a; color: #e2dee9; } }
  .iv-tab { color: #94a3b8; &.active { color: #6366f1; background: rgba(99, 102, 241, 0.12); } }
  .config-hero h2 { color: #e2dee9; }
  .config-hero p { color: #94a3b8; }
  .block-label { color: #94a3b8; }
  .scope-card { background: #1e1e2e; border-color: #2d2d4a; color: #cbd5e1; &.active { border-color: #6366f1; background: rgba(99, 102, 241, 0.1); } }
  .scope-name { color: #e2dee9; }
  .scope-count { color: #94a3b8; }
  .cat-chip { background: #232338; border-color: #2d2d4a; color: #cbd5e1; &.active { border-color: #6366f1; color: #818cf8; background: rgba(99, 102, 241, 0.1); } }
  .count-tip { color: #f59e0b; }
  .exam-question { background: #1e1e2e; border-color: #2d2d4a; }
  .q-text { color: #e2dee9; }
  .q-option { background: #232338; border-color: #2d2d4a; color: #cbd5e1; }
  .q-option .opt-letter { background: #2d2d4a; color: #94a3b8; }
  .q-option.selected { border-color: #6366f1; background: rgba(99, 102, 241, 0.12); }
  .answer-nav { background: #1e1e2e; border-color: #2d2d4a; }
  .nav-head { color: #94a3b8; }
  .nav-num { background: #232338; border-color: #2d2d4a; color: #94a3b8; &.done { background: rgba(99, 102, 241, 0.15); border-color: #6366f1; color: #818cf8; } &.current { background: #6366f1; color: #fff; } }
  .report-hero { background: #1e1e2e; border-color: #2d2d4a; }
  .report-hero h2 { color: #e2dee9; }
  .report-hero p { color: #94a3b8; }
  .report-card { background: #1e1e2e; border-color: #2d2d4a; }
  .rc-title { color: #e2dee9; }
  .cb-name { color: #94a3b8; }
  .cb-track { background: #2d2d4a; }
  .rw-item { background: #1e1e2e; border-color: #2d2d4a; }
  .rw-text { color: #e2dee9; }
  .rw-explain { color: #94a3b8; background: #232338; }
  .hot-item { background: #1e1e2e; border-color: #2d2d4a; }
  .hi-q { color: #e2dee9; }
  .hi-cat { color: #94a3b8; }
  .hi-toggle { color: #818cf8; }
  .hi-label { color: #94a3b8; }
  .hot-head h2, .history-head h2 { color: #e2dee9; }
  .history-item { background: #1e1e2e; border-color: #2d2d4a; }
  .hi-time { color: #94a3b8; }
  .hd-item { background: #1e1e2e; border-color: #2d2d4a; }
  .hd-text { color: #e2dee9; }
  .rw-yours, .rw-right { color: #94a3b8; }
}

/* 历史详情抽屉：移动端占满屏宽 */
@media (max-width: 768px) {
  html .history-drawer {
    width: 100% !important;
  }
}
</style>

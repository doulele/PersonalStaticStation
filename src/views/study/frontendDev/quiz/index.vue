<template>
  <div class="quiz-page">
    <!-- 顶部 -->
    <div class="quiz-top">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <h1 class="quiz-title">{{ pageTitle }}</h1>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select v-model="filters.cat" placeholder="分类" clearable size="default" class="filter-item" @change="reload">
        <el-option v-for="c in CATEGORIES" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-select v-model="filters.level" placeholder="难度" clearable size="default" class="filter-item" @change="reload">
        <el-option v-for="l in LEVELS" :key="l.id" :label="l.name" :value="l.id" />
      </el-select>
      <el-select v-model="filters.tag" placeholder="标签" clearable size="default" class="filter-item" @change="reload">
        <el-option v-for="t in QUESTION_TAGS" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="filters.type" placeholder="题型" clearable size="default" class="filter-item" @change="reload">
        <el-option label="单选" value="single" />
        <el-option label="多选" value="multi" />
        <el-option label="判断" value="judge" />
      </el-select>
      <el-switch
        v-model="filters.random"
        active-text="随机"
        inactive-text="顺序"
        class="filter-switch"
        @change="reload"
      />
    </div>

    <!-- 答题区 -->
    <div v-loading="loading" class="quiz-main">
      <template v-if="!loading && !finished && questions.length && current">
        <!-- 进度 -->
        <div class="quiz-progress">
          <span>第 {{ currentIndex + 1 }} / {{ questions.length }} 题</span>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: ((currentIndex + 1) / questions.length) * 100 + '%' }"></div>
          </div>
        </div>

        <!-- 题目 -->
        <div class="question-card">
          <div class="q-meta">
            <span class="q-tag" :class="current.type">{{ questionTypeName(current.type) }}</span>
            <span class="q-level" :style="{ background: levelColor(current.level) }">{{ levelName(current.level) }}</span>
            <span v-for="t in current.tags" :key="t" class="q-label">{{ t }}</span>
            <button class="fav-btn" :class="{ active: isFav(current.id) }" @click="toggleFav(current.id)">
              <el-icon><StarFilled v-if="isFav(current.id)" /><Star v-else /></el-icon>
            </button>
          </div>

          <h2 class="q-text markdown-body" v-html="renderedQ"></h2>

          <div class="q-options">
            <!-- 单选/判断 -->
            <template v-if="current.type !== 'multi'">
              <button
                v-for="(opt, oi) in current.options"
                :key="oi"
                class="q-option"
                :class="optionClass(oi)"
                :disabled="answered"
                @click="pickSingle(oi)"
              >
                <span class="opt-letter">{{ String.fromCharCode(65 + oi) }}</span>
                <span class="opt-text">{{ opt }}</span>
              </button>
            </template>
            <!-- 多选 -->
            <template v-else>
              <button
                v-for="(opt, oi) in current.options"
                :key="oi"
                class="q-option"
                :class="{ selected: multiPick.includes(oi) }"
                :disabled="answered"
                @click="toggleMulti(oi)"
              >
                <span class="opt-letter">{{ String.fromCharCode(65 + oi) }}</span>
                <span class="opt-text">{{ opt }}</span>
              </button>
            </template>
          </div>

          <!-- 多选确认 -->
          <div v-if="current.type === 'multi' && !answered" class="q-actions">
            <el-button type="primary" :disabled="!multiPick.length" @click="confirmMulti">确认答案</el-button>
          </div>

          <!-- 解析 -->
          <div v-if="answered" class="q-explain" :class="isCorrect ? 'right' : 'wrong'">
            <div class="explain-head">
              <el-icon><CircleCheckFilled v-if="isCorrect" /><CircleCloseFilled v-else /></el-icon>
              <span>{{ isCorrect ? '回答正确' : '回答错误' }}</span>
            </div>
            <div class="explain-text markdown-body" v-html="renderedExplain"></div>
            <a v-if="current.ref" :href="current.ref" target="_blank" rel="noopener" class="q-ref">
              <el-icon><Link /></el-icon>
              <span>参考文档</span>
            </a>
          </div>

          <!-- 下一题 -->
          <div v-if="answered" class="q-next">
            <el-button type="primary" @click="next">
              {{ currentIndex < questions.length - 1 ? '下一题' : '查看结果' }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- 完成 -->
      <div v-else-if="!loading && finished" class="quiz-done">
        <div class="done-icon">🎉</div>
        <h2>本次刷题完成</h2>
        <p>共 {{ questions.length }} 题，答对 <b>{{ correctCount }}</b> 题（正确率 {{ accuracy }}%）</p>
        <div class="done-actions">
          <el-button @click="reload">再来一组</el-button>
          <el-button type="primary" @click="goBack">返回</el-button>
        </div>
      </div>

      <el-empty v-else-if="!loading && !questions.length" description="暂无符合条件的题目" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ArrowLeft, Star, StarFilled, CircleCheckFilled, CircleCloseFilled, Link } from '@element-plus/icons-vue'
import { getQuestions } from '@/api/knowledgeGraph'
import { CATEGORIES, LEVELS, QUESTION_TAGS, getLevel } from '../data/categories'
import { checkAnswer, questionTypeName } from '../utils/quiz'
import { renderMarkdown } from '../utils/markdown'

const route = useRoute()
const router = useRouter()
const store = useStore()

const filters = reactive({
  cat: '',
  level: '',
  tag: '',
  type: '',
  random: false
})

const questions = ref([])
const currentIndex = ref(0)
const loading = ref(false)
const answered = ref(false)
const isCorrect = ref(false)
const multiPick = ref([])
const correctCount = ref(0)
const finished = ref(false)

const current = computed(() => questions.value[currentIndex.value] || null)
const renderedQ = computed(() => renderMarkdown(current.value?.q || ''))
const renderedExplain = computed(() => renderMarkdown(current.value?.explain || ''))
const pageTitle = computed(() => {
  if (filters.tag) return filters.tag + '刷题'
  if (filters.cat) return CATEGORIES.find(c => c.id === filters.cat)?.name + '刷题'
  return '综合刷题'
})
const accuracy = computed(() => questions.value.length ? Math.round((correctCount.value / questions.value.length) * 100) : 0)

const favoriteIds = computed(() => store.getters['frontendDev/favoriteIds'])
function isFav(qid) { return favoriteIds.value.includes(qid) }

function levelName(l) { return getLevel(l)?.name || '' }
function levelColor(l) { return getLevel(l)?.color || '#94a3b8' }

function optionClass(oi) {
  if (!answered.value) return ''
  const q = current.value
  const correct = q.type === 'multi'
    ? q.answer.includes(oi)
    : (q.type === 'judge' ? (oi === 0 ? q.answer === true : q.answer === false) : q.answer === oi)
  if (correct) return 'correct'
  if (q.type === 'multi') {
    if (multiPick.value.includes(oi)) return 'incorrect'
  } else if (lastPick.value === oi) return 'incorrect'
  return ''
}

const lastPick = ref(-1)

async function pickSingle(oi) {
  if (answered.value) return
  lastPick.value = oi
  const q = current.value
  const correct = checkAnswer(q, oi)
  isCorrect.value = correct
  answered.value = true
  if (correct) correctCount.value++
  await store.dispatch('frontendDev/answer', { qid: q.id, userAnswer: oi, correct })
}

function toggleMulti(oi) {
  if (answered.value) return
  const idx = multiPick.value.indexOf(oi)
  if (idx >= 0) multiPick.value.splice(idx, 1)
  else multiPick.value.push(oi)
}

async function confirmMulti() {
  if (answered.value) return
  const q = current.value
  const ua = [...multiPick.value]
  const correct = checkAnswer(q, ua)
  isCorrect.value = correct
  answered.value = true
  if (correct) correctCount.value++
  await store.dispatch('frontendDev/answer', { qid: q.id, userAnswer: ua, correct })
}

function next() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    answered.value = false
    multiPick.value = []
    lastPick.value = -1
  } else {
    finished.value = true
  }
}

async function toggleFav(qid) {
  await store.dispatch('frontendDev/toggleFavorite', qid)
}

async function reload() {
  loading.value = true
  finished.value = false
  currentIndex.value = 0
  answered.value = false
  multiPick.value = []
  correctCount.value = 0
  lastPick.value = -1
  try {
    const params = { limit: 100 }
    if (filters.cat) params.cat = filters.cat
    if (filters.level) params.level = filters.level
    if (filters.tag) params.tag = filters.tag
    if (filters.type) params.type = filters.type
    if (filters.random) params.mode = 'random'
    const res = await getQuestions(params)
    if (res.success) questions.value = res.data || []
    else questions.value = []
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/study/frontend-dev')
}

onMounted(() => {
  // 从路由 query 读取初始标签
  const tag = route.query.tag
  if (tag) filters.tag = String(tag)
  store.dispatch('frontendDev/loadProgress')
  reload()
})
</script>

<style lang="scss" scoped src="./index.scss"></style>

<style lang="scss">
html.dark-mode .quiz-page {
  .quiz-title { color: #e2dee9; }
  .back-btn { color: #94a3b8; &:hover { background: #2d2d4a; color: #e2dee9; } }
  .question-card { background: #1e1e2e; border-color: #2d2d4a; }
  .q-text { color: #e2dee9; }
  .q-option { background: #232338; border-color: #2d2d4a; color: #cbd5e1; }
  .q-option .opt-letter { background: #2d2d4a; color: #94a3b8; }
  .explain-text { color: #94a3b8; }
  .quiz-done { color: #e2dee9; }
}
</style>

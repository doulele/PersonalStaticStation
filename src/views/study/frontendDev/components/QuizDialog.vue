<template>
  <el-dialog
    :model-value="visible"
    :title="`随堂测验 · ${nodeName}`"
    width="680px"
    top="6vh"
    class="quiz-dialog"
    @update:model-value="close"
  >
    <div v-loading="loading" class="quiz-body">
      <template v-if="!loading && questions.length">
        <!-- 题目列表 -->
        <div v-for="(q, qi) in questions" :key="q.id" class="quiz-item" :class="{ done: submitted }">
          <div class="quiz-q">
            <span class="q-index">{{ qi + 1 }}</span>
            <span class="q-tag" :class="q.type">{{ questionTypeName(q.type) }}</span>
            <span class="q-text">{{ q.q }}</span>
          </div>

          <div class="quiz-options">
            <!-- 单选 / 判断 -->
            <el-radio-group
              v-if="q.type !== 'multi'"
              v-model="answers[q.id]"
              class="opt-group"
              :disabled="submitted"
            >
              <div
                v-for="(opt, oi) in q.options"
                :key="oi"
                class="opt-item"
                :class="optionClass(q, oi)"
              >
                <el-radio :value="oi">{{ opt }}</el-radio>
              </div>
            </el-radio-group>

            <!-- 多选 -->
            <el-checkbox-group
              v-else
              v-model="answers[q.id]"
              class="opt-group"
              :disabled="submitted"
            >
              <div
                v-for="(opt, oi) in q.options"
                :key="oi"
                class="opt-item"
                :class="optionClass(q, oi)"
              >
                <el-checkbox :value="oi">{{ opt }}</el-checkbox>
              </div>
            </el-checkbox-group>
          </div>

          <!-- 提交后解析 -->
          <div v-if="submitted" class="quiz-explain" :class="resultOf(q.id) ? 'right' : 'wrong'">
            <div class="explain-head">
              <el-icon><CircleCheckFilled v-if="resultOf(q.id)" /><CircleCloseFilled v-else /></el-icon>
              <span>{{ resultOf(q.id) ? '回答正确' : '回答错误' }}</span>
            </div>
            <div class="explain-text">{{ q.explain }}</div>
          </div>
        </div>
      </template>

      <el-empty v-else-if="!loading" description="该知识点暂无测验题目" />
    </div>

    <template #footer>
      <div v-if="!submitted" class="quiz-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :disabled="!canSubmit" @click="submit">提交测验</el-button>
      </div>
      <div v-else class="quiz-footer result">
        <span class="result-text">
          答对 <b>{{ correctCount }}</b>/{{ questions.length }} 题（正确率 {{ passRate }}%）
          <span v-if="passed" class="passed-tip">· 节点已点亮 ✨</span>
          <span v-else class="fail-tip">· 答对率达 60% 可点亮节点</span>
        </span>
        <div>
          <el-button v-if="!passed" @click="reset">重新测验</el-button>
          <el-button type="primary" @click="close">完成</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { getNodeQuestions } from '@/api/knowledgeGraph'
import { checkAnswer, questionTypeName } from '../utils/quiz'

const props = defineProps({
  visible: { type: Boolean, default: false },
  nodeId: { type: String, default: '' },
  nodeName: { type: String, default: '' }
})
const emit = defineEmits(['update:visible', 'learned'])

const store = useStore()
const loading = ref(false)
const questions = ref([])
const answers = ref({})
const submitted = ref(false)
const results = ref({}) // qid -> boolean

const correctCount = computed(() => Object.values(results.value).filter(Boolean).length)
const passRate = computed(() => questions.value.length ? Math.round((correctCount.value / questions.value.length) * 100) : 0)
const passed = computed(() => questions.value.length && passRate.value >= 60)
const canSubmit = computed(() => questions.value.every(q => {
  const a = answers.value[q.id]
  if (q.type === 'multi') return Array.isArray(a) && a.length > 0
  return a !== undefined && a !== null
}))

function resultOf(qid) {
  return results.value[qid]
}

function optionClass(q, oi) {
  if (!submitted.value) return ''
  const correct = q.type === 'multi'
    ? q.answer.includes(oi)
    : (q.type === 'judge' ? (oi === 0 ? q.answer === true : q.answer === false) : q.answer === oi)
  if (correct) return 'correct'
  const user = q.type === 'multi' ? (answers.value[q.id] || []).includes(oi) : answers.value[q.id] === oi
  if (user && !correct) return 'incorrect'
  return ''
}

async function load() {
  if (!props.nodeId) return
  loading.value = true
  submitted.value = false
  results.value = {}
  answers.value = {}
  try {
    const res = await getNodeQuestions(props.nodeId)
    if (res.success) questions.value = res.data || []
    else questions.value = []
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!canSubmit.value) return
  const payload = {
    nodeId: props.nodeId,
    results: questions.value.map(q => {
      const ua = answers.value[q.id]
      const correct = checkAnswer(q, ua)
      return { qid: q.id, userAnswer: ua, correct }
    })
  }
  // 本地先计算结果用于展示
  payload.results.forEach(r => { results.value[r.qid] = r.correct })
  submitted.value = true
  // 上报后端
  const res = await store.dispatch('frontendDev/quiz', payload)
  if (res?.success && res.data?.learned) {
    emit('learned', props.nodeId)
  }
}

function reset() {
  submitted.value = false
  results.value = {}
  answers.value = {}
}

function close() {
  emit('update:visible', false)
}

watch(() => props.visible, (v) => {
  if (v) load()
})
</script>

<style lang="scss" scoped>
.quiz-body {
  max-height: 60vh;
  overflow-y: auto;
  min-height: 200px;
}

.quiz-item {
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 16px;
}

.quiz-q {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
}

.q-index {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #6366f1;
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.q-tag {
  flex-shrink: 0;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 11px;
  &.single { background: #dbeafe; color: #2563eb; }
  &.multi { background: #fef3c7; color: #d97706; }
  &.judge { background: #dcfce7; color: #16a34a; }
}

.q-text {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.5;
}

.opt-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.opt-item {
  padding: 8px 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid transparent;
  transition: all 0.2s ease;

  &.correct { background: #dcfce7; border-color: #86efac; }
  &.incorrect { background: #fee2e2; border-color: #fca5a5; }
}

.quiz-explain {
  margin-top: 12px;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;

  &.right { background: #f0fdf4; border-left: 3px solid #22c55e; }
  &.wrong { background: #fef2f2; border-left: 3px solid #ef4444; }
}

.explain-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  margin-bottom: 6px;
  &.right { color: #16a34a; }
  &.wrong { color: #dc2626; }
}

.explain-text {
  color: #475569;
  line-height: 1.6;
}

.quiz-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;

  &.result { align-items: center; }
}

.result-text {
  font-size: 14px;
  color: #0f172a;

  .passed-tip { color: #16a34a; }
  .fail-tip { color: #dc2626; }
}

@media (max-width: 768px) {
  .quiz-body { max-height: 72vh; }
  .quiz-item { padding: 12px; }
  .quiz-footer { flex-direction: column; align-items: stretch; }
  .quiz-footer .el-button { margin-left: 0 !important; }
  .result-text { font-size: 13px; }
}

@media (max-width: 480px) {
  .quiz-footer .el-button { width: 100%; }
}
</style>

<style lang="scss">
html.dark-mode .quiz-dialog {
  .quiz-item { border-color: #2d2d4a; background: #1e1e2e; }
  .q-text { color: #e2dee9; }
  .opt-item { background: #232338; }
  .explain-text { color: #94a3b8; }
  .result-text { color: #e2dee9; }
}

/* 随堂测验弹窗：移动端自适应宽度 */
@media (max-width: 768px) {
  html .quiz-dialog {
    width: 94% !important;
  }
}
</style>

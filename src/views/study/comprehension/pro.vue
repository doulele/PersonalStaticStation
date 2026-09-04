<template>
  <div class="cp-page cp-pro">
    <div class="page-top">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <h1 class="page-title">专业领域挑战</h1>
      <span v-if="stage === 'landing' && status" class="page-sub">已通过 {{ status.passed.length }} 个领域</span>
    </div>

    <!-- 加载 -->
    <div v-if="stage === 'loading'" class="cp-loading">加载挑战数据…</div>

    <!-- ============ 大门页 ============ -->
    <template v-else-if="stage === 'landing'">
      <section class="cp-welcome-card">
        <h3>🧭 专业领域挑战</h3>
        <p>检验你的通用理解力能否迁移到<b>不熟悉的专业文本</b>。每一篇专业材料都要依次闯过三道障碍：</p>
        <div class="cp-obstacle-legend">
          <div class="cp-ob-leg"><b>P1 · 术语网络</b><span>陌生概念扑面而来——把它精准压缩成术语</span></div>
          <div class="cp-ob-leg"><b>P2 · 范式模仿</b><span>专业文章的论证骨架——拆解并重建</span></div>
          <div class="cp-ob-leg"><b>P3 · 背景感知</b><span>哪些话没有背景读不懂——觉察知识缺口</span></div>
        </div>
        <div class="cp-gate-rule">解锁条件：D1-D4 四项能力均达到 <b>L2</b>，且各维度有 <b>3 次稳定记录</b>（成长看板可见）。</div>
      </section>

      <!-- 达标状态 -->
      <section class="cp-panel">
        <h4 class="cp-panel-title">能力达标状态</h4>
        <div class="cp-pro-dims">
          <div v-for="d in dimRows" :key="d.id" class="cp-pro-dim" :class="{ ok: d.ok }">
            <span class="cp-pro-dim-ico" :style="{ '--c': d.color }">{{ d.icon }}</span>
            <div class="cp-pro-dim-body">
              <b>{{ d.id }} · {{ d.name }}</b>
              <p>当前 L{{ d.level }}，稳定记录 {{ d.stableCount }}/3</p>
            </div>
            <span class="cp-pro-dim-flag" :class="d.ok ? 'ok' : ''">{{ d.ok ? '已达标' : '待达标' }}</span>
          </div>
        </div>
      </section>

      <div v-if="!status.allOk" class="cp-pro-blocked">
        继续完成测评与每日训练，把 D1-D4 全部推到 L2 并稳定 3 次后，即可解锁专业文本挑战。
      </div>

      <div v-else-if="!status.unlocked" class="cp-pro-unlock">
        <el-button type="primary" size="large" class="cp-btn-main" :loading="busy" @click="doUnlock">
          满足条件，立即解锁 🎓
        </el-button>
      </div>

      <!-- 领域列表 -->
      <template v-else>
        <section class="cp-panel">
          <h4 class="cp-panel-title">可选专业领域</h4>
          <div v-for="dm in status.domains" :key="dm.id" class="cp-pro-domain">
            <div class="cp-pro-domain-ico">📚</div>
            <div class="cp-pro-domain-body">
              <b>{{ dm.domain }}</b>
              <p>挑战将包含：术语填空 · 范式排序 · 背景判断</p>
            </div>
            <span v-if="status.passed.includes(dm.domain)" class="cp-pro-passed">✓ 已通过</span>
            <el-button v-else type="primary" plain class="cp-pro-start" @click="begin(dm.id)">开始挑战</el-button>
          </div>
        </section>
      </template>
    </template>

    <!-- ============ 答题页 ============ -->
    <template v-else-if="stage === 'quiz'">
      <!-- 阅读材料 -->
      <section class="cp-panel cp-pro-passage">
        <div class="cp-pro-passage-head" @click="foldPassage = !foldPassage">
          <h4 class="cp-panel-title">📖 阅读材料 · {{ corpus.domain }}</h4>
          <button class="cp-fold-btn">{{ foldPassage ? '展开' : '收起' }}</button>
        </div>
        <div v-show="!foldPassage">
          <div class="cp-pro-passage-title">{{ corpus.title }}</div>
          <div class="cp-pro-passage-text">{{ corpus.content }}</div>
          <div class="cp-pro-passage-tip">作答时材料在上方，可随时回看。三道障碍需全部作答后才能提交。</div>
        </div>
      </section>

      <!-- 障碍进度 -->
      <div class="cp-pro-progress">
        <span>已作答 {{ answeredCount }} / {{ questions.length }}</span>
        <div class="cp-pro-bar"><i :style="{ width: pct + '%' }"></i></div>
      </div>

      <!-- 障碍分组 -->
      <template v-for="grp in obstacleGroups" :key="grp.id">
        <div class="cp-ob-header" :style="{ '--c': grp.color }">
          <i></i>
          <div><b>{{ grp.id }} · {{ grp.name }}</b><span>{{ grp.desc }}</span></div>
        </div>
        <div v-for="(q, gi) in grp.items" :key="q.qid" class="cp-pro-q">
          <div class="cp-pro-qno">{{ grp.id }}-{{ gi + 1 }}</div>
          <QuestionCard
            :ref="(el) => setQref(q.qid, el)"
            :question="q"
            :answered="!!answeredMap[q.qid]"
            passage-mode="hide"
            @answer="(ans) => onAnswer(q, ans)"
          />
          <div v-if="answeredMap[q.qid]" class="cp-pro-reanswer">
            此题已作答 <el-button link type="primary" @click="resetOne(q.qid)">重答此题</el-button>
          </div>
        </div>
      </template>

      <!-- 提交条 -->
      <div class="cp-pro-submitbar">
        <span>{{ answeredCount === questions.length ? '全部作答完成 ✅' : '还有 ' + (questions.length - answeredCount) + ' 题未作答' }}</span>
        <el-button type="primary" :disabled="answeredCount !== questions.length || submitting" :loading="submitting" @click="submit">
          提交测评
        </el-button>
      </div>
    </template>

    <!-- ============ 结果页 ============ -->
    <template v-else-if="stage === 'result'">
      <section class="cp-welcome-card cp-pro-result-head" :class="passedAll ? 'pass' : 'fail'">
        <h3>{{ passedAll ? '🎉 挑战通过' : '💪 还差一点' }}</h3>
        <p>{{ result.message || '三道障碍均通过后，将获得该领域的独立阅读能力认证。' }}</p>
        <div class="cp-pro-result-actions">
          <el-button type="primary" plain @click="restart">换一篇 / 再测本领域</el-button>
          <el-button @click="toLanding">返回领域列表</el-button>
        </div>
      </section>

      <!-- 分障碍成绩 -->
      <section class="cp-panel">
        <h4 class="cp-panel-title">障碍成绩</h4>
        <div v-for="obs in obstacleOrder" :key="obs" class="cp-ob-score" :class="result[obs] && result[obs].pass ? 'pass' : 'fail'">
          <div class="cp-ob-score-head">
            <b>{{ obs }} · {{ obstacleMeta[obs].name }}</b>
            <span class="cp-ob-score-mark">{{ result[obs] && result[obs].pass ? '通过' : '未通过' }}</span>
          </div>
          <div class="cp-ob-score-track">
            <i :style="{ width: (result[obs] ? result[obs].score : 0) + '%' }"></i>
          </div>
          <div class="cp-ob-score-nums">
            得分 {{ result[obs] ? result[obs].score : 0 }}%（{{ result[obs] ? result[obs].passCount : 0 }}/{{ result[obs] ? result[obs].total : 0 }} 题）· 通过线 {{ result[obs] ? result[obs].passLine : '' }}
          </div>
        </div>
      </section>

      <!-- 逐题解析 -->
      <section class="cp-panel">
        <h4 class="cp-panel-title">逐题解析</h4>
        <p class="cp-pro-review-note">系统按障碍统计得分；以下为每题的知识点解析，供你复盘术语与背景缺口。</p>
        <div v-for="(q, i) in questions" :key="q.qid" class="cp-pro-review">
          <div class="cp-pro-review-head">
            <span class="cp-pro-review-tag" :style="{ '--c': obstacleMeta[q.obstacle].color }">{{ q.obstacle }}</span>
            <span class="cp-pro-review-idx">{{ i + 1 }}/{{ questions.length }}</span>
          </div>
          <div class="cp-pro-review-q">{{ promptOf(q) }}</div>
          <div v-if="q.obstacle === 'P2'" class="cp-pro-review-mine order">{{ mineOrder(q) }}</div>
          <div v-else class="cp-pro-review-mine">我的答案：{{ mineText(q) }}</div>
          <div v-if="q.explain" class="cp-pro-review-explain">📌 {{ q.explain }}</div>
          <div v-if="q.need" class="cp-pro-review-need">💡 该句依赖的背景知识：{{ q.need }}</div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getProStatus, unlockPro, startPro, submitPro } from '@/api/comprehension'
import { DIM_META } from './cp-meta'
import QuestionCard from './components/QuestionCard.vue'

const router = useRouter()
const goBack = () => router.push('/study/comprehension')

const stage = ref('loading') // loading | landing | quiz | result
const busy = ref(false)
const submitting = ref(false)
const status = ref(null)
const corpus = ref(null)
const questions = ref([])
const answers = ref({})
const answeredMap = ref({})
const result = ref(null)
const passedAll = ref(false)
const foldPassage = ref(false)

const qrefs = {}
function setQref(qid, el) { if (el) qrefs[qid] = el }
function resetOne(qid) {
  const el = qrefs[qid]
  if (el && el.reset) el.reset()
  delete answers.value[qid]
  answeredMap.value[qid] = false
  answeredMap.value = { ...answeredMap.value }
}

const dimRows = computed(() => {
  const s = status.value
  if (!s) return []
  return DIM_META.map((m) => {
    const d = s.dims[m.id] || { level: 0, stableCount: 0, ok: false }
    return { ...m, ...d }
  })
})

const obstacleMeta = {
  P1: { name: '术语网络', color: '#4f7df9', desc: '把陌生概念压缩成领域术语，检验「抓住关键信息」的迁移' },
  P2: { name: '范式模仿', color: '#14b8a6', desc: '还原专业文本的论证骨架，检验「还原结构层次」的迁移' },
  P3: { name: '背景感知', color: '#f59e0b', desc: '觉察哪些话依赖外部背景知识，检验「识别观点意图」的迁移' }
}
const obstacleOrder = ['P1', 'P2', 'P3']

const obstacleGroups = computed(() => {
  return obstacleOrder.map((id) => {
    const items = questions.value.filter((q) => q.obstacle === id)
    return { id, ...obstacleMeta[id], items }
  }).filter((g) => g.items.length)
})

const answeredCount = computed(() => Object.keys(answeredMap.value).filter((k) => answeredMap.value[k]).length)
const pct = computed(() => (questions.value.length ? Math.round((answeredCount.value / questions.value.length) * 100) : 0))

function load() {
  stage.value = 'loading'
  getProStatus().then((res) => {
    if (!res.success) { ElMessage.error(res.message || '加载失败'); stage.value = 'landing'; return }
    status.value = res.data
    stage.value = 'landing'
  })
}
function doUnlock() {
  busy.value = true
  unlockPro().then((res) => {
    if (!res.success) { ElMessage.warning(res.message || '解锁失败'); return }
    ElMessage.success('专业领域挑战已解锁')
    status.value = { ...status.value, unlocked: true }
  }).finally(() => { busy.value = false })
}

async function begin(corpusId) {
  busy.value = true
  try {
    const res = await startPro(corpusId)
    if (!res.success) { ElMessage.error(res.message || '出题失败'); return }
    corpus.value = res.data.corpus
    questions.value = res.data.questions
    answers.value = {}
    answeredMap.value = {}
    foldPassage.value = false
    result.value = null
    passedAll.value = false
    stage.value = 'quiz'
    window.scrollTo({ top: 0 })
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
  const payload = {
    corpusId: corpus.value.id,
    answers: questions.value.map((q) => ({ qid: q.qid, userAnswer: answers.value[q.qid] }))
  }
  submitPro(payload).then((res) => {
    if (!res.success) { ElMessage.error(res.message || '提交失败'); return }
    result.value = res.data.result
    passedAll.value = res.data.passedAll
    stage.value = 'result'
    window.scrollTo({ top: 0 })
  }).finally(() => { submitting.value = false })
}

function promptOf(q) {
  if (q.obstacle === 'P1') return q.q || ''
  if (q.obstacle === 'P3') return '“' + (q.q || '') + '”——这句话是否依赖材料之外的背景知识？'
  return q.q || ''
}
function mineText(q) {
  const a = answers.value[q.qid]
  if (q.obstacle === 'P3') return a === true ? '需要背景知识' : (a === false ? '不需要背景知识' : '未作答')
  return a || '未作答'
}
function mineOrder(q) {
  const ids = answers.value[q.qid]
  const items = q.items || []
  if (!Array.isArray(ids) || !ids.length) return '未作答'
  return '我的排序：' + ids.map((id) => items[id]).join(' → ')
}
function restart() {
  if (corpus.value) begin(corpus.value.id)
}
function toLanding() {
  load()
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

.cp-pro {
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
  .cp-obstacle-legend {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 14px 0 12px;
    .cp-ob-leg {
      display: flex;
      gap: 12px;
      align-items: baseline;
      font-size: 13.5px;
      b { flex: none; color: var(--cp-ink); width: 110px; }
      span { color: var(--cp-sub); }
    }
  }
  .cp-gate-rule {
    font-size: 13px;
    color: var(--cp-warn);
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.22);
    border-radius: 10px;
    padding: 8px 12px;
    b { color: var(--cp-warn); }
  }

  .cp-panel {
    background: var(--cp-card);
    border: 1px solid var(--cp-line);
    border-radius: 16px;
    padding: 18px 20px;
    margin-top: 16px;
    box-shadow: var(--cp-shadow);
  }
  .cp-panel-title { color: var(--cp-ink); font-size: 15px; margin-bottom: 14px; }

  /* 达标 */
  .cp-pro-dims {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(215px, 1fr));
    gap: 12px;
    .cp-pro-dim {
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1px solid var(--cp-line);
      border-radius: 12px;
      padding: 12px 14px;
      background: var(--cp-card-2);
      opacity: 0.72;
      &.ok { opacity: 1; border-color: rgba(16, 185, 129, 0.4); }
      .cp-pro-dim-ico {
        flex: none;
        width: 38px; height: 38px;
        border-radius: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 19px;
        background: color-mix(in srgb, var(--c) 14%, transparent);
      }
      .cp-pro-dim-body {
        flex: 1; min-width: 0;
        b { display: block; font-size: 13.5px; color: var(--cp-ink); }
        p { font-size: 12px; color: var(--cp-sub); margin: 2px 0 0; }
      }
      .cp-pro-dim-flag {
        flex: none;
        font-size: 11.5px;
        color: var(--cp-sub);
        background: var(--cp-badge);
        padding: 3px 8px;
        border-radius: 999px;
        &.ok { color: #fff; background: var(--cp-ok); }
      }
    }
  }
  .cp-pro-blocked {
    margin-top: 16px;
    text-align: center;
    color: var(--cp-sub);
    font-size: 14px;
    background: var(--cp-card-2);
    border: 1px dashed var(--cp-line);
    border-radius: 12px;
    padding: 18px;
    line-height: 1.8;
  }
  .cp-pro-unlock {
    margin-top: 18px;
    text-align: center;
    .cp-btn-main { width: 260px; }
  }

  /* 领域列表 */
  .cp-pro-domain {
    display: flex;
    align-items: center;
    gap: 14px;
    border: 1px solid var(--cp-line);
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 12px;
    background: var(--cp-card-2);
    &:last-child { margin-bottom: 0; }
    .cp-pro-domain-ico {
      flex: none;
      width: 46px; height: 46px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      background: var(--cp-accent-soft);
    }
    .cp-pro-domain-body {
      flex: 1; min-width: 0;
      b { font-size: 15px; color: var(--cp-ink); }
      p { font-size: 12.5px; color: var(--cp-sub); margin: 3px 0 0; }
    }
    .cp-pro-passed {
      flex: none;
      font-size: 12.5px;
      font-weight: 700;
      color: #fff;
      background: var(--cp-ok);
      padding: 5px 12px;
      border-radius: 999px;
    }
  }

  /* 材料 */
  .cp-pro-passage {
    .cp-pro-passage-head {
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
    .cp-pro-passage-title {
      font-weight: 700;
      font-size: 16px;
      color: var(--cp-ink);
      margin: 12px 0 8px;
    }
    .cp-pro-passage-text {
      font-size: 14px;
      line-height: 1.9;
      color: var(--cp-ink);
      white-space: pre-wrap;
      max-height: 320px;
      overflow-y: auto;
      padding-right: 6px;
    }
    .cp-pro-passage-tip {
      margin-top: 10px;
      font-size: 12px;
      color: var(--cp-sub);
      background: var(--cp-card-2);
      border-radius: 8px;
      padding: 6px 10px;
    }
  }

  /* 进度 */
  .cp-pro-progress {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 16px 0 4px;
    font-size: 13px;
    color: var(--cp-sub);
    .cp-pro-bar {
      flex: 1;
      height: 6px;
      border-radius: 999px;
      background: var(--cp-card-2);
      overflow: hidden;
      i { display: block; height: 100%; background: var(--cp-ok); border-radius: 999px; transition: width 0.3s; }
    }
  }

  /* 障碍头 */
  .cp-ob-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 20px 0 12px;
    i {
      flex: none;
      width: 10px; height: 28px;
      border-radius: 4px;
      background: var(--c);
    }
    b { font-size: 15px; color: var(--cp-ink); margin-right: 8px; }
    span { font-size: 12.5px; color: var(--cp-sub); }
  }

  /* 题目卡 */
  .cp-pro-q {
    position: relative;
    .cp-pro-qno {
      position: absolute;
      left: -34px;
      top: 18px;
      width: 26px; height: 26px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11.5px;
      font-weight: 700;
      background: var(--cp-accent-soft);
      color: var(--cp-accent);
    }
    .cp-pro-reanswer {
      margin: 8px 0 0;
      font-size: 12.5px;
      color: var(--cp-ok);
      text-align: right;
    }
  }

  /* 提交条 */
  .cp-pro-submitbar {
    position: sticky;
    bottom: 12px;
    margin-top: 20px;
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
  .cp-pro-result-head {
    border: 1px solid var(--cp-line);
    &.pass { border-color: rgba(16, 185, 129, 0.45); }
    &.fail { border-color: rgba(239, 68, 68, 0.35); }
    .cp-pro-result-actions { margin-top: 14px; display: flex; gap: 10px; flex-wrap: wrap; }
  }
  .cp-ob-score {
    border: 1px solid var(--cp-line);
    border-radius: 12px;
    padding: 12px 14px;
    margin-bottom: 12px;
    background: var(--cp-card-2);
    &:last-child { margin-bottom: 0; }
    &.pass { border-color: rgba(16, 185, 129, 0.4); }
    &.fail { border-color: rgba(239, 68, 68, 0.25); }
    .cp-ob-score-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      b { font-size: 14px; color: var(--cp-ink); }
      .cp-ob-score-mark {
        font-size: 12px;
        font-weight: 700;
        padding: 2px 10px;
        border-radius: 999px;
        &.pass, .pass & { display: none; }
      }
    }
    .cp-ob-score-head .cp-ob-score-mark {
      &.pass { display: inline-block; color: #fff; background: var(--cp-ok); }
    }
    .cp-ob-score-track {
      height: 8px;
      border-radius: 999px;
      background: var(--cp-card);
      margin: 10px 0 6px;
      overflow: hidden;
      i { display: block; height: 100%; background: var(--cp-warn); border-radius: 999px; transition: width 0.4s; }
    }
    &.pass .cp-ob-score-track i { background: var(--cp-ok); }
    .cp-ob-score-nums { font-size: 12px; color: var(--cp-sub); }
  }

  .cp-pro-review-note { font-size: 12.5px; color: var(--cp-sub); margin: -6px 0 14px; }
  .cp-pro-review {
    border: 1px solid var(--cp-line);
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 12px;
    background: var(--cp-card-2);
    &:last-child { margin-bottom: 0; }
    .cp-pro-review-head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      .cp-pro-review-tag {
        font-size: 11.5px;
        font-weight: 700;
        color: var(--c);
        background: color-mix(in srgb, var(--c) 12%, transparent);
        padding: 2px 8px;
        border-radius: 6px;
      }
      .cp-pro-review-idx { font-size: 12px; color: var(--cp-sub); }
    }
    .cp-pro-review-q {
      font-size: 14px;
      line-height: 1.7;
      color: var(--cp-ink);
      white-space: pre-wrap;
    }
    .cp-pro-review-mine {
      margin-top: 8px;
      font-size: 13px;
      color: var(--cp-accent);
      background: var(--cp-accent-softer);
      border-radius: 8px;
      padding: 7px 10px;
      &.order { color: var(--cp-teal, #14b8a6); }
    }
    .cp-pro-review-explain {
      margin-top: 8px;
      font-size: 13px;
      line-height: 1.7;
      color: var(--cp-sub);
    }
    .cp-pro-review-need {
      margin-top: 6px;
      font-size: 12.5px;
      line-height: 1.7;
      color: var(--cp-warn);
      background: rgba(245, 158, 11, 0.08);
      border-radius: 8px;
      padding: 6px 10px;
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
  .cp-pro {
    .cp-welcome-card { padding: 18px 16px; }
    .cp-pro-dim { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
    .cp-pro-q .cp-pro-qno {
      position: static;
      display: inline-flex;
      margin-bottom: 8px;
    }
    .cp-pro-submitbar {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
      .el-button { margin-left: 0; }
    }
  }
}
@media (max-width: 480px) {
  .cp-page { padding: 12px 12px 46px; }
  .cp-pro {
    .cp-pro-dims { grid-template-columns: 1fr; }
    .cp-pro-domain { flex-wrap: wrap; gap: 10px;
      .cp-pro-domain-body { flex: 1 1 100%; }
      .cp-pro-start { width: 100%; margin-left: 0; }
    }
    .cp-ob-header { flex-wrap: wrap; align-items: flex-start; }
    .cp-ob-leg { flex-direction: column; gap: 2px;
      b { width: auto; }
    }
    .cp-pro-result-actions { flex-direction: column; .el-button { margin-left: 0; width: 100%; } }
  }
}
</style>

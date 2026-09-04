<template>
  <div class="cp-page">
    <div class="page-top">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <h1 class="page-title">理解力训练平台</h1>
    </div>

    <!-- Hero -->
    <section class="cp-hero">
      <div class="cp-hero-info">
        <h2>把「读不懂」变成「能说清」</h2>
        <p>
          基于 <b>抓主干 → 拆逻辑 → 译人话 → 追问批判</b> 的四阶能力模型，
          用 3~5 分钟自适应测评定位你的理解力短板，再用每日组合训练持续突破。
        </p>
        <div class="cp-hero-actions">
          <el-button
            v-if="!ov || !ov.configured"
            type="primary"
            class="cp-btn-primary"
            @click="$router.push('/study/comprehension/profile')"
          >先配置我的画像 →</el-button>
          <template v-else-if="!ov.assessedAt || ov.retestDue">
            <el-button type="primary" class="cp-btn-primary" :loading="busy" @click="goAssess">
              {{ ov.assessedAt ? '能力已过期，重新测评' : '开始首次测评' }}
            </el-button>
            <span class="cp-hero-note">约 3~5 分钟 · 共 4 个维度</span>
          </template>
          <template v-else>
            <el-button type="primary" class="cp-btn-primary" @click="$router.push('/study/comprehension/training')">开始今日训练</el-button>
            <el-button class="cp-btn-ghost" @click="goAssess">重新测评</el-button>
          </template>
        </div>
      </div>
      <div class="cp-hero-ladder">
        <div v-for="(lv, i) in levelRows" :key="lv.key" class="cp-ladder-row" :style="{ '--lv-color': LEVEL_COLORS[i] }">
          <span class="cp-lv-key">{{ lv.key }}</span>
          <div class="cp-lv-bar"><i :style="{ width: ((i + 1) / 6) * 100 + '%', background: LEVEL_COLORS[i] }"></i></div>
          <span class="cp-lv-desc">{{ lv.desc }}</span>
        </div>
      </div>
    </section>

    <el-tabs v-model="tab" class="cp-tabs">
      <!-- ============ 总览 ============ -->
      <el-tab-pane label="总览" name="overview">
        <template v-if="loading">
          <div class="cp-loading">加载中…</div>
        </template>
        <template v-else-if="!ov">
          <el-empty description="加载失败" />
        </template>
        <template v-else>
          <!-- 未配置 -->
          <template v-if="!ov.configured">
            <section class="cp-welcome-card">
              <h3>👋 欢迎使用理解力训练</h3>
              <p>开始之前，先花 30 秒告诉我：你的身份、常读的领域和想解决的核心痛点。这会让我为你挑选更合适的材料与训练节奏。</p>
              <div class="cp-step-list">
                <div class="cp-step"><span>1</span>配置画像（身份 / 领域 / 痛点）</div>
                <div class="cp-step"><span>2</span>自适应测评 4 个维度，定位短板</div>
                <div class="cp-step"><span>3</span>每天 2 题组合训练 + 间隔复习</div>
              </div>
              <el-button type="primary" size="large" class="cp-btn-primary" @click="$router.push('/study/comprehension/profile')">立即配置画像</el-button>
            </section>
          </template>

          <!-- 已配置但未测评 -->
          <section v-else-if="!ov.assessedAt" class="cp-welcome-card">
            <h3>🎯 画像已就绪，开始测评吧</h3>
            <p>测评覆盖 <b>抓主干 / 拆逻辑 / 译人话 / 追问批判</b> 四个维度，题目随你的作答自动升降难度，约 3~5 分钟即可完成，随后你会得到一份能力报告与训练建议。</p>
            <div class="cp-welcome-meta">
              <span>身份：{{ ov.profile.identityType }}</span>
              <span>领域：{{ (ov.profile.domains || []).join(' / ') || '未设置' }}</span>
            </div>
            <div class="cp-welcome-actions">
              <el-button type="primary" size="large" class="cp-btn-primary" :loading="busy" @click="goAssess">开始测评 →</el-button>
              <el-button size="large" @click="$router.push('/study/comprehension/profile')">⚙️ 画像与设置</el-button>
            </div>
          </section>

          <!-- 已测评：总览数据 -->
          <template v-else>
            <section v-if="ov.remind" class="cp-remind">
              <span class="cp-remind-dot"></span>
              <span>{{ ov.remind.text }}</span>
              <el-button v-if="ov.remind.level !== 'soft'" link type="primary" @click="$router.push('/study/comprehension/training')">去训练</el-button>
            </section>

            <section v-if="ov.retestDue" class="cp-remind due">
              <span class="cp-remind-dot"></span>
              <span>距上次测评已超过 14 天，建议重新测评校准能力。</span>
              <el-button link type="primary" @click="goAssess">立即测评</el-button>
            </section>

            <!-- 健康指数 + 统计 -->
            <section class="cp-health-row">
              <div class="cp-health-card">
                <div class="cp-health-ring" :style="{ '--pct': ov.health.indexScore }">
                  <div class="cp-health-ring-in">
                    <b>{{ ov.health.indexScore }}</b>
                    <span>理解力指数</span>
                  </div>
                </div>
                <div class="cp-health-text">
                  <div class="cp-health-stab">近 14 天打卡 {{ ov.health.stabilityText }}</div>
                  <div class="cp-health-focus">{{ ov.health.focusText }}</div>
                </div>
              </div>
              <div class="cp-stat" v-for="s in statCards" :key="s.label" @click="s.to && $router.push(s.to)">
                <b>{{ s.value }}</b>
                <span>{{ s.label }}</span>
              </div>
            </section>

            <!-- 四维能力 -->
            <section class="cp-section-title">
              <h3>四维能力</h3>
              <el-button link type="primary" @click="$router.push('/study/comprehension/assessment')">重新测评</el-button>
            </section>
            <section class="cp-dim-grid">
              <div v-for="d in dimsArr" :key="d.id" class="cp-dim-card" :style="{ '--dim-c': d.color }" @click="$router.push('/study/comprehension/growth')">
                <div class="cp-dim-head">
                  <span class="cp-dim-icon">{{ d.icon }}</span>
                  <span class="cp-dim-name">{{ d.id }} · {{ d.name }}</span>
                  <span class="cp-dim-lv" :class="lvClass(d.level)">L{{ d.level }}</span>
                </div>
                <div class="cp-dim-bar"><i :style="{ width: (d.level / 5) * 100 + '%' }"></i></div>
                <div class="cp-dim-desc">{{ d.desc }}</div>
                <div class="cp-dim-stab">
                  <span class="cp-stab-dot" :class="d.tag"></span>
                  {{ d.label }} · 稳定 {{ d.stableCount }}/3
                </div>
              </div>
            </section>

            <!-- 快速入口 -->
            <section class="cp-section-title"><h3>继续提升</h3></section>
            <section class="cp-enter-grid">
              <div class="cp-enter" @click="$router.push('/study/comprehension/training')">
                <span class="cp-enter-icon grad1">⚡</span>
                <b>今日训练</b>
                <p>短板突破 + 维护复习</p>
              </div>
              <div class="cp-enter" @click="$router.push('/study/comprehension/mistakes')">
                <span class="cp-enter-icon grad2">📕</span>
                <b>错题本</b>
                <p>{{ ov.stats.mistakes }} 道待巩固</p>
              </div>
              <div class="cp-enter" @click="$router.push('/study/comprehension/growth')">
                <span class="cp-enter-icon grad3">📈</span>
                <b>成长曲线</b>
                <p>回看每一次进步</p>
              </div>
              <div class="cp-enter" @click="$router.push('/study/comprehension/migrate')">
                <span class="cp-enter-icon grad4">🧩</span>
                <b>迁移测试</b>
                <p>学没学会，换个语境试试</p>
              </div>
              <div class="cp-enter" @click="$router.push('/study/comprehension/pro')">
                <span class="cp-enter-icon grad5">🏛</span>
                <b>专业模块</b>
                <p>真实职业语料挑战</p>
              </div>
              <div class="cp-enter" @click="$router.push('/study/comprehension/profile')">
                <span class="cp-enter-icon grad6">⚙️</span>
                <b>画像与设置</b>
                <p>身份 / 强度 / 频率</p>
              </div>
            </section>
          </template>

          <!-- 方法论常驻底部说明 -->
          <section class="cp-method-teaser" @click="tab = 'method'">
            <span>❓ 想了解训练原理？查看方法论</span>
            <el-icon><ArrowRight /></el-icon>
          </section>
        </template>
      </el-tab-pane>

      <!-- ============ 方法论 ============ -->
      <el-tab-pane label="方法论" name="method">
        <section class="cp-section-title"><h3>四阶理解力模型</h3></section>
        <section class="cp-method-grid">
          <div v-for="d in dimsArr" :key="d.id" class="cp-method-card" :style="{ '--dim-c': d.color }">
            <div class="cp-method-head">
              <span class="cp-method-icon">{{ d.icon }}</span>
              <b>{{ d.id }} {{ d.name }}</b>
            </div>
            <p class="cp-method-desc">{{ d.desc }}</p>
            <div class="cp-method-example">{{ exampleOf(d.id) }}</div>
          </div>
        </section>

        <section class="cp-section-title"><h3>能力等级 L0 → L5</h3></section>
        <section class="cp-level-list">
          <div v-for="(lv, i) in levelRows" :key="lv.key" class="cp-level-row" :style="{ '--lv-color': LEVEL_COLORS[i] }">
            <span class="cp-level-key">{{ lv.key }}</span>
            <span class="cp-level-bar"></span>
            <span class="cp-level-name">{{ lv.name }}</span>
            <span class="cp-level-desc">{{ lv.desc }}</span>
          </div>
        </section>

        <section class="cp-section-title"><h3>每日训练怎么运转</h3></section>
        <section class="cp-how">
          <div class="cp-how-item"><span>①</span><b>出题</b><p>每天按「短板突破 + 维护复习」组合出题，共 1~3 题，3 分钟可完成。</p></div>
          <div class="cp-how-item"><span>②</span><b>反馈</b><p>主观题作答后会得到 AI 逐点点评；对错与解释都会沉淀到成长记录。</p></div>
          <div class="cp-how-item"><span>③</span><b>难度自适应</b><p>连续答对 3 次升阶，连续答错 2 次降阶；连续 3 次「太难」自动降档。</p></div>
          <div class="cp-how-item"><span>④</span><b>间隔复习</b><p>错题进入错题本，按艾宾浩斯节奏在后续训练中复现，答对自动移除。</p></div>
        </section>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { getOverview, startAssessment } from '@/api/comprehension'
import { DIM_META, LEVEL_META } from './cp-meta'

const router = useRouter()
const goBack = () => router.push('/study')

const tab = ref('overview')
const loading = ref(true)
const busy = ref(false)
const ov = ref(null)

const LEVEL_COLORS = ['#9aa0b5', '#5d8be8', '#14b8a6', '#34c77b', '#f59e0b', '#ec4899']

const dimsArr = computed(() => DIM_META.map((m) => {
  const d = (ov.value && ov.value.dims && ov.value.dims[m.id]) || {}
  return { ...m, level: d.level || 0, stableCount: d.stableCount || 0, tag: d.tag || 'unstable', label: d.label || '未激活', text: d.text || '' }
}))

const levelRows = computed(() => {
  if (ov.value && ov.value.levelDesc && ov.value.levelDesc.length) {
    return ov.value.levelDesc.map((x, i) => ({ ...x, name: LEVEL_META[i] ? LEVEL_META[i].name : '' }))
  }
  return LEVEL_META.map((x) => ({ key: x.key, desc: x.desc, name: x.name }))
})

const statCards = computed(() => {
  const s = (ov.value && ov.value.stats) || {}
  return [
    { label: '累计训练', value: s.trainTotal || 0 },
    { label: '平均正确率', value: (s.accuracy || 0) + '%' },
    { label: '错题', value: s.mistakes || 0, to: '/study/comprehension/mistakes' },
    { label: '连续打卡', value: (s.checkinStreak || 0) + ' 天' }
  ]
})

function lvClass(lv) {
  if (lv >= 4) return 'lv-high'
  if (lv >= 2) return 'lv-mid'
  return 'lv-low'
}

function exampleOf(id) {
  return {
    D1: '例：读完一篇科技新闻，用一句话说清它讲了什么',
    D2: '例：把「论点—理由—证据」拆成一张推理图',
    D3: '例：脱离原文，向一个外行完整复述这段内容',
    D4: '例：追问作者默认了什么前提，还能怎样反驳'
  }[id]
}

async function goAssess() {
  busy.value = true
  try {
    const res = await startAssessment('all')
    if (!res.success) throw new Error(res.error || '启动失败')
    const id = (res.data && (res.data.assessId || (res.data.session && res.data.session.assessId))) || ''
    router.push(id ? `/study/comprehension/assessment?assessId=${id}` : '/study/comprehension/assessment')
  } catch (e) {
    // request 层已有错误提示，这里兜底
    console.error(e)
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  try {
    const res = await getOverview()
    if (res.success) ov.value = res.data
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.cp-page {
  min-height: 100vh;
  padding: 18px 22px 40px;
  max-width: 1080px;
  margin: 0 auto;
  color: var(--cp-ink);
}
.page-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--cp-card);
    border: 1px solid var(--cp-line);
    color: var(--cp-ink);
    border-radius: 10px;
    padding: 7px 12px;
    font-size: 13px;
    cursor: pointer;
    &:hover { color: var(--cp-accent); border-color: var(--cp-accent); }
  }
  .page-title { font-size: 20px; margin: 0; }
}

.cp-hero {
  display: flex;
  gap: 26px;
  align-items: center;
  background: var(--cp-grad);
  border-radius: 18px;
  padding: 26px 28px;
  margin-bottom: 18px;
  color: #fff;
  flex-wrap: wrap;
  .cp-hero-info { flex: 1.2; min-width: 300px;
    h2 { margin: 0 0 10px; font-size: 23px; }
    p { margin: 0 0 18px; font-size: 14px; line-height: 1.8; opacity: 0.94;
      b { color: #ffe9a8; }
    }
    .cp-hero-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .cp-hero-note { font-size: 12.5px; opacity: 0.85; }
  }
  .cp-hero-ladder { flex: 1; min-width: 300px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 14px;
    padding: 16px 18px;
    backdrop-filter: blur(4px);
  }
}
.cp-ladder-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  .cp-lv-key { width: 26px; font-weight: 700; opacity: 0.9; }
  .cp-lv-bar { flex: 1; height: 7px; border-radius: 5px; background: rgba(255, 255, 255, 0.25);
    i { display: block; height: 100%; border-radius: 5px; }
  }
  .cp-lv-desc { width: 150px; opacity: 0.9; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

.cp-btn-primary.el-button { background: #fff; border-color: #fff; color: var(--cp-accent-strong); font-weight: 600;
  &:hover { background: #f3efff; border-color: #f3efff; color: var(--cp-accent-strong); }
}
.cp-btn-ghost.el-button { background: transparent; border-color: rgba(255, 255, 255, 0.6); color: #fff;
  &:hover { background: rgba(255, 255, 255, 0.15); color: #fff; }
}

/* ========= 暗黑模式微调 =========
   浅色 hero（亮紫 + 白半透明卡）在浅灰背景上协调；
   放在纯黑背景下会过亮刺眼，改用更深的紫渐变 + 黑色半透明卡，让 hero 与深色页面融合。
   再加一层极淡的内发光描边，避免出现"亮紫块"边界。 */
html.dark-mode .cp-hero {
  background: linear-gradient(135deg, #1f1a5c 0%, #2d2480 100%);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}
html.dark-mode .cp-hero-ladder {
  background: rgba(0, 0, 0, 0.36);
  border-color: rgba(255, 255, 255, 0.12);
}
html.dark-mode .cp-lv-bar { background: rgba(0, 0, 0, 0.42); }

.cp-tabs { margin-top: 6px;
  :deep(.el-tabs__item) { color: var(--cp-sub); font-weight: 600;
    &.is-active { color: var(--cp-accent-strong); }
  }
  :deep(.el-tabs__active-bar) { background: var(--cp-accent); }
  :deep(.el-tabs__nav-wrap::after) { background: var(--cp-line); }
}

.cp-loading { padding: 60px 0; text-align: center; color: var(--cp-sub); }

.cp-welcome-card {
  background: var(--cp-card);
  border: 1px solid var(--cp-line);
  border-radius: 16px;
  padding: 26px 28px;
  box-shadow: var(--cp-shadow);
  h3 { margin: 0 0 10px; font-size: 18px; }
  p { color: var(--cp-sub); line-height: 1.8; font-size: 14px; margin: 0 0 18px;
    b { color: var(--cp-accent-strong); }
  }
  .cp-step-list { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px;
    .cp-step { display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px;
      background: var(--cp-accent-softer); border: 1px dashed var(--cp-line);
      color: var(--cp-ink); border-radius: 999px; padding: 6px 14px;
      span { width: 20px; height: 20px; border-radius: 50%; background: var(--cp-accent);
        color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 11.5px; font-weight: 700; }
    }
  }
  .cp-welcome-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;
    span { font-size: 13px; background: var(--cp-card-2); border: 1px solid var(--cp-line); padding: 5px 12px; border-radius: 8px; color: var(--cp-sub); }
  }
  .cp-welcome-actions { display: flex; flex-wrap: wrap; gap: 10px; }
}

.cp-remind {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.14), rgba(245, 158, 11, 0.05));
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: var(--cp-warn);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13.5px;
  margin-bottom: 14px;
  &.due { background: linear-gradient(90deg, rgba(109, 93, 252, 0.12), rgba(109, 93, 252, 0.05));
    border-color: var(--cp-line); color: var(--cp-accent-strong); }
  .cp-remind-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--cp-warn); flex: none; }
}

.cp-health-row { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 22px; }
.cp-health-card {
  flex: 1.2;
  min-width: 300px;
  display: flex;
  align-items: center;
  gap: 18px;
  background: var(--cp-card);
  border: 1px solid var(--cp-line);
  border-radius: 16px;
  padding: 18px 20px;
  box-shadow: var(--cp-shadow);
  .cp-health-ring {
    --pct: 0;
    width: 92px; height: 92px;
    border-radius: 50%;
    background: conic-gradient(var(--cp-accent) calc(var(--pct) * 1%), var(--cp-accent-softer) 0);
    display: flex; align-items: center; justify-content: center;
    flex: none;
    .cp-health-ring-in {
      width: 70px; height: 70px; border-radius: 50%;
      background: var(--cp-card);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      b { font-size: 20px; color: var(--cp-accent-strong); }
      span { font-size: 10.5px; color: var(--cp-sub); }
    }
  }
  .cp-health-text { font-size: 13px; color: var(--cp-sub); line-height: 1.9;
    .cp-health-stab { font-weight: 600; color: var(--cp-ink); font-size: 14.5px; }
  }
}
.cp-stat {
  flex: 1;
  min-width: 120px;
  background: var(--cp-card);
  border: 1px solid var(--cp-line);
  border-radius: 16px;
  padding: 16px 10px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px;
  cursor: pointer;
  box-shadow: var(--cp-shadow);
  transition: transform 0.15s, border-color 0.15s;
  &:hover { transform: translateY(-2px); border-color: var(--cp-accent); }
  b { font-size: 21px; color: var(--cp-accent-strong); }
  span { font-size: 12px; color: var(--cp-sub); }
}

.cp-section-title {
  display: flex; align-items: center; justify-content: space-between;
  margin: 6px 0 12px;
  h3 { margin: 0; font-size: 16px; }
}

.cp-dim-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(225px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}
.cp-dim-card {
  background: var(--cp-card);
  border: 1px solid var(--cp-line);
  border-top: 3px solid var(--dim-c);
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(80, 60, 200, 0.1); }
  .cp-dim-head { display: flex; align-items: center; gap: 8px;
    .cp-dim-icon { font-size: 17px; }
    .cp-dim-name { font-weight: 700; font-size: 14.5px; flex: 1; }
    .cp-dim-lv { font-size: 12px; font-weight: 800; padding: 2px 9px; border-radius: 999px;
      &.lv-high { background: rgba(236, 72, 153, 0.14); color: var(--cp-d4); }
      &.lv-mid { background: rgba(16, 185, 129, 0.14); color: var(--cp-d2); }
      &.lv-low { background: rgba(148, 163, 184, 0.16); color: var(--cp-sub); }
    }
  }
  .cp-dim-bar { margin: 12px 0 8px; height: 6px; border-radius: 4px; background: var(--cp-card-2);
    i { display: block; height: 100%; border-radius: 4px; background: var(--dim-c); }
  }
  .cp-dim-desc { font-size: 12.5px; color: var(--cp-sub); line-height: 1.6; min-height: 40px; }
  .cp-dim-stab { margin-top: 8px; font-size: 12px; color: var(--cp-sub); display: flex; align-items: center; gap: 6px;
    .cp-stab-dot { width: 7px; height: 7px; border-radius: 50%;
      &.stable { background: #10b981; }
      &.basic { background: #f59e0b; }
      &.unstable { background: #ef4444; }
    }
  }
}

.cp-enter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
  margin-bottom: 10px;
}
.cp-enter {
  background: var(--cp-card);
  border: 1px solid var(--cp-line);
  border-radius: 14px;
  padding: 18px 16px;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
  &:hover { transform: translateY(-2px); border-color: var(--cp-accent); }
  .cp-enter-icon {
    width: 40px; height: 40px; border-radius: 12px;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 19px; margin-bottom: 10px; color: #fff;
  }
  b { display: block; font-size: 15px; margin-bottom: 4px; }
  p { margin: 0; font-size: 12px; color: var(--cp-sub); line-height: 1.5; }
}
.grad1 { background: linear-gradient(135deg, #6d5dfc, #9b7bff); }
.grad2 { background: linear-gradient(135deg, #ec4899, #f973b9); }
.grad3 { background: linear-gradient(135deg, #14b8a6, #2dd4bf); }
.grad4 { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.grad5 { background: linear-gradient(135deg, #4f7df9, #7ea0ff); }
.grad6 { background: linear-gradient(135deg, #64748b, #94a3b8); }

.cp-method-teaser {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 18px;
  padding: 14px 18px;
  border: 1px dashed var(--cp-line);
  border-radius: 12px;
  color: var(--cp-sub);
  font-size: 13.5px;
  cursor: pointer;
  background: var(--cp-card-2);
  &:hover { color: var(--cp-accent); border-color: var(--cp-accent); }
}

/* ========= 方法论 ========= */
.cp-method-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
  margin-bottom: 26px;
}
.cp-method-card {
  background: var(--cp-card);
  border: 1px solid var(--cp-line);
  border-radius: 14px;
  padding: 18px;
  border-top: 3px solid var(--dim-c);
  .cp-method-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
    .cp-method-icon { width: 34px; height: 34px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center;
      background: var(--cp-accent-softer); color: var(--dim-c); font-size: 16px; }
    b { font-size: 15px; }
  }
  .cp-method-desc { font-size: 13.5px; color: var(--cp-sub); line-height: 1.7; margin: 0 0 10px; }
  .cp-method-example { font-size: 12.5px; line-height: 1.7; color: var(--cp-ink); background: var(--cp-card-2);
    border-radius: 10px; padding: 10px 12px; }
}

.cp-level-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 26px; }
.cp-level-row {
  display: flex; align-items: center; gap: 12px;
  background: var(--cp-card);
  border: 1px solid var(--cp-line);
  border-radius: 12px;
  padding: 12px 16px;
  .cp-level-key { width: 40px; font-weight: 800; color: var(--lv-color); font-size: 16px; }
  .cp-level-bar { width: 8px; height: 34px; border-radius: 6px; background: var(--lv-color); opacity: 0.85; }
  .cp-level-name { width: 46px; font-weight: 700; }
  .cp-level-desc { color: var(--cp-sub); font-size: 13.5px; }
}

.cp-how { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 14px; }
.cp-how-item {
  background: var(--cp-card);
  border: 1px solid var(--cp-line);
  border-radius: 14px;
  padding: 16px 18px;
  span { font-size: 20px; }
  b { display: block; margin: 8px 0 6px; font-size: 15px; }
  p { margin: 0; font-size: 13px; color: var(--cp-sub); line-height: 1.75; }
}

/* ========= 移动端适配 ========= */
@media (max-width: 768px) {
  .cp-page { padding: 14px 14px 40px; }
  .page-top {
    flex-wrap: wrap;
    gap: 8px;
    .page-title { font-size: 18px; }
  }
  .cp-hero {
    flex-direction: column;
    align-items: stretch;
    gap: 18px;
    padding: 22px 18px;
    .cp-hero-info { min-width: 0;
      h2 { font-size: 19px; }
    }
    .cp-hero-ladder { min-width: 0; }
  }
  .cp-ladder-row .cp-lv-desc { width: auto; max-width: 46%; }
  .cp-tabs {
    :deep(.el-tabs__nav-wrap) { overflow-x: auto; }
  }
  .cp-welcome-card { padding: 20px 18px; }
  .cp-health-row { gap: 10px; }
  .cp-health-card {
    min-width: 0;
    flex: 1 1 100%;
    align-items: center;
  }
  .cp-stat { min-width: calc(50% - 5px); flex: 1 1 40%; }
  .cp-dim-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
  .cp-method-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  .cp-level-row {
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 12px 14px;
    .cp-level-bar { order: 2; }
    .cp-level-desc { width: 100%; padding-left: 52px; }
  }
}
@media (max-width: 480px) {
  .cp-page { padding: 12px 12px 36px; }
  .cp-hero { padding: 20px 16px;
    .cp-hero-info h2 { font-size: 18px; }
  }
  .cp-ladder-row .cp-lv-desc { max-width: none; width: 100%; }
  .cp-dim-grid, .cp-method-grid, .cp-enter-grid { grid-template-columns: 1fr; }
  .cp-health-card { flex-direction: column; align-items: flex-start; gap: 14px; }
  .cp-stat b { font-size: 19px; }
}
/* 暗色模式细节微调 */
html.dark-mode {
  .cp-dim-card:hover { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4); }
}
</style>

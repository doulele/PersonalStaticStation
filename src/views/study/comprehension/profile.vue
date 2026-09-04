<template>
  <div class="cp-page">
    <div class="page-top">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <h1 class="page-title">画像与设置</h1>
      <span v-if="streak" class="page-sub">🔥 已连续打卡 {{ streak }} 天</span>
    </div>

    <div v-if="loading" class="cp-loading">加载中…</div>
    <template v-else>
      <!-- 打卡条 -->
      <section class="cp-checkin-bar" v-if="profile.configured">
        <div>
          <b>{{ checkedToday ? '今日已打卡 ✅' : '今日训练完成了吗？' }}</b>
          <span v-if="!checkedToday">完成后点击打卡，连续打卡能获得更好的成长提醒。</span>
          <span v-else>连续打卡 {{ streak }} 天，继续保持。</span>
        </div>
        <el-button v-if="!checkedToday" type="primary" class="cp-btn-main" :loading="checkBusy" @click="doCheck">打卡</el-button>
      </section>

      <!-- 画像 -->
      <section class="cp-card">
        <h3 class="cp-card-title">👤 个人画像</h3>
        <p class="cp-card-desc">画像帮助平台挑选更贴合你日常阅读的材料与难度节奏。</p>

        <div class="cp-field">
          <label>你的身份</label>
          <div class="cp-chips">
            <button v-for="o in IDENTITY_OPTS" :key="o.value" type="button" class="cp-chip"
              :class="{ on: form.identityType === o.value }" @click="form.identityType = o.value">
              {{ o.icon }} {{ o.value }}
            </button>
          </div>
          <el-input v-model="form.identityType" placeholder="也可以自定义，如：数据分析师" class="cp-identity-input" />
        </div>

        <div class="cp-field">
          <label>常读领域（可多选）</label>
          <el-select v-model="form.domains" multiple filterable allow-create default-first-option
            placeholder="选择或输入领域关键词" style="width: 100%">
            <el-option v-for="d in DOMAIN_CHIPS" :key="d" :label="d" :value="d" />
          </el-select>
        </div>

        <div class="cp-field">
          <label>核心痛点（可选）</label>
          <div class="cp-chips">
            <button v-for="p in PAIN_CHIPS" :key="p" type="button" class="cp-chip"
              :class="{ on: form.painPoint === p }" @click="form.painPoint = form.painPoint === p ? '' : p">
              {{ p }}
            </button>
          </div>
          <el-input v-model="form.painPoint" type="textarea" :rows="2" placeholder="描述你阅读时最想解决的问题" />
        </div>

        <div class="cp-card-actions">
          <el-button type="primary" class="cp-btn-main" :loading="saveBusy" @click="saveIdentity">保存画像</el-button>
          <span class="cp-saved" v-if="savedAt === 'profile'">已保存 ✓</span>
        </div>
      </section>

      <!-- 训练设置 -->
      <section class="cp-card">
        <h3 class="cp-card-title">⚙️ 训练设置</h3>

        <div class="cp-field">
          <label>训练强度</label>
          <div class="cp-pick-grid">
            <div v-for="o in INTENSITY_OPTS" :key="o.value" class="cp-pick" :class="{ on: form.intensity === o.value }" @click="form.intensity = o.value">
              <b>{{ o.label }}</b>
              <p>{{ o.hint }}</p>
            </div>
          </div>
        </div>

        <div class="cp-field">
          <label>训练频率</label>
          <div class="cp-pick-grid three">
            <div v-for="o in FREQUENCY_OPTS" :key="o.value" class="cp-pick" :class="{ on: form.frequency === o.value }" @click="form.frequency = o.value">
              <b>{{ o.label }}</b>
              <p>{{ o.hint }}</p>
            </div>
          </div>
        </div>

        <div v-if="form.frequency === 'custom'" class="cp-field">
          <label>选择训练日</label>
          <el-checkbox-group v-model="form.trainingDays" class="cp-week">
            <el-checkbox-button v-for="d in WEEK_DAYS" :key="d.v" :value="d.v" :label="d.label" />
          </el-checkbox-group>
        </div>

        <div class="cp-card-actions">
          <el-button type="primary" class="cp-btn-main" :loading="saveBusy2" @click="savePrefs">保存设置</el-button>
          <span class="cp-saved" v-if="savedAt === 'settings'">已保存 ✓</span>
        </div>
      </section>

      <!-- 训练原则 -->
      <section class="cp-card cp-principle">
        <h3 class="cp-card-title">📐 训练如何自动调整</h3>
        <ul>
          <li>平台每天先测你「最薄弱维度」的短板题，再从其他维度抽维护题。</li>
          <li>主观题自动用关键词判分并交给 AI 点评，无需人工批改。</li>
          <li>连续答对 3 次升一层、连错 2 次降一层；连续 3 次选「太难」会为你自动降低强度。</li>
          <li>错题会按间隔复习的节奏回到训练中，答对后自动移出错题本。</li>
        </ul>
      </section>

      <!-- 危险操作 -->
      <section class="cp-card cp-danger" v-if="profile.configured">
        <h3 class="cp-card-title">⚠️ 危险操作</h3>
        <p>将清空你的画像、测评记录、能力等级、训练日志、错题本、打卡与里程碑，且<em>无法恢复</em>。适合想完全重新开始的情况。</p>
        <div class="cp-card-actions">
          <el-button type="danger" plain class="cp-btn-danger" :loading="resetBusy" @click="resetAll">重置画像与全部进度</el-button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProfile, getOverview, saveProfile, saveSettings, doCheckin, resetProgress } from '@/api/comprehension'
import { IDENTITY_OPTS, DOMAIN_CHIPS, INTENSITY_OPTS, FREQUENCY_OPTS, WEEK_DAYS } from './cp-meta'

const router = useRouter()
const goBack = () => router.push('/study/comprehension')
const PAIN_CHIPS = ['读得慢', '读了就忘', '抓不住重点', '逻辑绕不清', '缺乏批判性思考', '无法学以致用']

const loading = ref(true)
const profile = ref({ configured: false })
const form = reactive({ identityType: '', domains: [], painPoint: '', intensity: 'standard', frequency: 'daily', trainingDays: [1, 2, 3, 4, 5] })
const checkedToday = ref(false)
const streak = ref(0)
const saveBusy = ref(false)
const saveBusy2 = ref(false)
const checkBusy = ref(false)
const resetBusy = ref(false)
const savedAt = ref('')

async function saveIdentity() {
  if (!form.identityType.trim()) return
  saveBusy.value = true
  try {
    const res = await saveProfile({
      identityType: form.identityType.trim(),
      domains: form.domains,
      painPoint: form.painPoint.trim()
    })
    if (!res.success) throw new Error(res.error || '保存失败')
    profile.value.configured = true
    savedAt.value = 'profile'
    setTimeout(() => { savedAt.value = '' }, 2000)
  } finally {
    saveBusy.value = false
  }
}

async function savePrefs() {
  saveBusy2.value = true
  try {
    const res = await saveSettings({
      intensity: form.intensity,
      frequency: form.frequency,
      trainingDays: form.frequency === 'custom' ? form.trainingDays : null
    })
    if (!res.success) throw new Error(res.error || '保存失败')
    savedAt.value = 'settings'
    setTimeout(() => { savedAt.value = '' }, 2000)
  } finally {
    saveBusy2.value = false
  }
}

async function doCheck() {
  checkBusy.value = true
  try {
    const res = await doCheckin()
    if (!res.success) throw new Error(res.error || '打卡失败')
    if (res.data.checked) checkedToday.value = true
    streak.value = res.data.streak || 0
  } finally {
    checkBusy.value = false
  }
}

async function resetAll() {
  let confirmed = false
  try {
    const { value } = await ElMessageBox.prompt(
      '将清空：画像（身份/领域/痛点）、测评记录、能力等级、训练日志、错题本、打卡与里程碑，且无法恢复。\n输入「重置」以确认继续：',
      '重置画像与全部进度',
      {
        confirmButtonText: '确认重置',
        cancelButtonText: '取消',
        inputPlaceholder: '输入「重置」',
        inputValidator: (v) => (v === '重置' ? true : '请准确输入「重置」'),
        type: 'warning'
      }
    )
    confirmed = value === '重置'
  } catch {
    return // 用户取消
  }
  if (!confirmed) return
  resetBusy.value = true
  try {
    const res = await resetProgress()
    if (!res.success) throw new Error(res.error || '重置失败')
    ElMessage.success('已重置，欢迎重新开始')
    // 同步本地状态，避免页面残留旧数据
    Object.assign(form, { identityType: '', domains: [], painPoint: '', intensity: 'standard', frequency: 'daily', trainingDays: [1, 2, 3, 4, 5] })
    profile.value = { configured: false }
    checkedToday.value = false
    streak.value = 0
    router.push('/study/comprehension')
  } catch (e) {
    ElMessage.error(e.message || '重置失败，请稍后重试')
  } finally {
    resetBusy.value = false
  }
}

onMounted(async () => {
  try {
    const res = await getProfile()
    if (res.success && res.data) {
      const p = res.data
      profile.value = p
      form.identityType = p.identityType || ''
      form.domains = Array.isArray(p.domains) ? p.domains : []
      form.painPoint = p.painPoint || ''
      form.intensity = p.intensity || 'standard'
      form.frequency = p.frequency || 'daily'
      form.trainingDays = Array.isArray(p.trainingDays) && p.trainingDays.length ? p.trainingDays : [1, 2, 3, 4, 5]
    }
    // 打卡状态来自 overview.stats
    const ov = await getOverview()
    if (ov.success && ov.data && ov.data.stats) {
      checkedToday.value = !!ov.data.stats.checkinToday
      streak.value = ov.data.stats.checkinStreak || 0
    }
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.cp-page { min-height: 100vh; padding: 18px 22px 60px; max-width: 820px; margin: 0 auto; color: var(--cp-ink); }
.page-top { display: flex; align-items: center; gap: 12px; margin-bottom: 18px;
  .back-btn { display: inline-flex; align-items: center; gap: 4px; background: var(--cp-card); border: 1px solid var(--cp-line); color: var(--cp-ink); border-radius: 10px; padding: 7px 12px; font-size: 13px; cursor: pointer;
    &:hover { color: var(--cp-accent); border-color: var(--cp-accent); } }
  .page-title { font-size: 20px; margin: 0; }
  .page-sub { font-size: 12.5px; color: var(--cp-warn); font-weight: 600; }
}
.cp-loading { padding: 60px 0; text-align: center; color: var(--cp-sub); }

.cp-checkin-bar { display: flex; align-items: center; justify-content: space-between; gap: 14px; background: linear-gradient(90deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.04)); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 14px; padding: 16px 20px; margin-bottom: 16px;
  b { font-size: 15px; display: block; margin-bottom: 4px; }
  span { font-size: 13px; color: var(--cp-sub); } }

.cp-card { background: var(--cp-card); border: 1px solid var(--cp-line); border-radius: 16px; padding: 22px 24px; box-shadow: var(--cp-shadow); margin-bottom: 16px; }
.cp-card-title { margin: 0 0 4px; font-size: 16.5px; }
.cp-card-desc { margin: 0 0 18px; font-size: 13px; color: var(--cp-sub); }
.cp-field { margin-bottom: 20px;
  > label { display: block; font-size: 13.5px; font-weight: 700; margin-bottom: 10px; } }
.cp-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.cp-chip { border: 1px solid var(--cp-line); background: var(--cp-card-2); color: var(--cp-sub); border-radius: 999px; padding: 6px 14px; font-size: 13px; cursor: pointer; transition: all 0.15s;
  &:hover { border-color: var(--cp-accent); color: var(--cp-accent); }
  &.on { background: var(--cp-accent-soft); border-color: var(--cp-accent); color: var(--cp-accent-strong); font-weight: 600; } }
.cp-identity-input { margin-top: 2px; }
.cp-pick-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px;
  &.three { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); } }
.cp-pick { border: 1px solid var(--cp-line); background: var(--cp-card-2); border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.15s;
  b { font-size: 14.5px; display: block; margin-bottom: 4px; }
  p { margin: 0; font-size: 12px; color: var(--cp-sub); line-height: 1.5; }
  &:hover { border-color: var(--cp-accent); }
  &.on { background: var(--cp-accent-soft); border-color: var(--cp-accent); box-shadow: 0 0 0 2px var(--cp-accent-softer);
    b { color: var(--cp-accent-strong); } } }
.cp-week { display: flex; flex-wrap: wrap; gap: 8px;
  :deep(.el-checkbox-button__inner) { background: var(--cp-card-2); border-color: var(--cp-line); color: var(--cp-sub); }
  :deep(.el-checkbox-button.is-checked .el-checkbox-button__inner) { background: var(--cp-accent); border-color: var(--cp-accent); } }
.cp-card-actions { display: flex; align-items: center; gap: 12px; padding-top: 4px; }
.cp-saved { color: var(--cp-ok); font-size: 13px; }
.cp-btn-main { background: var(--cp-accent); border-color: var(--cp-accent); font-weight: 600; }

.cp-principle ul { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px;
  li { font-size: 13.5px; line-height: 1.75; color: var(--cp-sub); } }

.cp-danger {
  border-color: rgba(245, 108, 108, 0.38);
  background: linear-gradient(180deg, rgba(245, 108, 108, 0.06), rgba(245, 108, 108, 0.02));
  .cp-card-title { color: #e5484d; }
  p { margin: 0 0 16px; font-size: 13px; line-height: 1.75; color: var(--cp-sub);
    em { color: #e5484d; font-style: normal; font-weight: 600; } }
  .cp-btn-danger { border-radius: 10px; }
}

/* ========= 移动端适配 ========= */
@media (max-width: 768px) {
  .cp-page { padding: 14px 14px 50px; }
  .page-top {
    flex-wrap: wrap;
    gap: 8px;
    .page-title { font-size: 18px; }
    .page-sub { width: 100%; }
  }
  .cp-card { padding: 18px 16px; border-radius: 14px; }
  .cp-card-title { font-size: 15.5px; }
  .cp-pick-grid, .cp-pick-grid.three { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .cp-page { padding: 12px 12px 46px; }
  .cp-checkin-bar {
    align-items: flex-start;
    flex-direction: column;
    padding: 14px 16px;
    .cp-btn-main { width: 100%; }
  }
  .cp-pick-grid, .cp-pick-grid.three { grid-template-columns: 1fr; }
  .cp-pick { padding: 12px 14px; }
  .cp-chip { padding: 5px 12px; font-size: 12.5px; }
  .cp-card-actions { flex-wrap: wrap; }
}
</style>

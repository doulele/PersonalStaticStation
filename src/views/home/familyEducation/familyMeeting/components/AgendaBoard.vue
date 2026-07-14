<template>
  <div class="agenda-board">
    <MeetingSelect v-model="meetingId" />

    <template v-if="meetingId">
    <div class="agenda-cols">
      <!-- 左：议题收集 -->
      <div class="col">
        <el-card shadow="never" class="block">
          <template #header><span class="block-title">📝 提交议题（实名制）</span></template>
          <el-form label-position="top">
            <el-form-item label="标题">
              <el-input v-model="ag.title" placeholder="议题标题" maxlength="40" />
            </el-form-item>
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="分类">
                  <el-select v-model="ag.category" style="width:100%">
                    <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="优先级">
                  <el-rate v-model="ag.priority" :max="3" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="描述">
              <el-input v-model="ag.desc" type="textarea" :rows="2" placeholder="补充说明" />
            </el-form-item>
            <el-form-item label="本议题关联情绪（0-100）">
              <el-slider v-model="ag.emotion" :show-tooltip="false" />
              <span class="emo-val">{{ ag.emotion }}</span>
            </el-form-item>
            <el-button type="primary" :disabled="!ag.title" @click="onSubmit">提交议题</el-button>
          </el-form>
        </el-card>

        <el-card shadow="never" class="block">
          <template #header>
            <span class="block-title">📋 议程（按共鸣数与紧急度自动排序）</span>
            <el-button
              v-if="!meeting.agendaLocked"
              link type="warning" size="small"
              @click="onLock"
            >锁定议程</el-button>
            <el-tag v-else size="small" type="info" effect="plain">已锁定</el-tag>
          </template>

          <div v-if="agenda.length === 0" class="empty">暂无议题，先提交一个吧～</div>
          <div
            v-for="(item, i) in agenda"
            :key="item.id"
            class="agenda-item"
            :class="{ locked: meeting.agendaLocked }"
          >
            <div class="ai-order">{{ i + 1 }}</div>
            <div class="ai-body">
              <div class="ai-head">
                <span class="ai-title">{{ item.title }}</span>
                <el-tag size="small" :type="priType(item.priority)" effect="plain">
                  {{ ['低', '中', '高'][item.priority - 1] }}优先
                </el-tag>
                <el-tag size="small" type="info" effect="plain">{{ item.category }}</el-tag>
              </div>
              <div class="ai-meta">
                提交人：<b>{{ name(item.authorId) }}</b>
                <span v-if="item.emotionLevel != null" class="ai-emo">情绪 {{ item.emotionLevel }}</span>
              </div>
              <div v-if="item.desc" class="ai-desc">{{ item.desc }}</div>
            </div>
            <div class="ai-actions">
              <el-button
                size="small"
                :type="item.resonance.includes(uid) ? 'success' : 'default'"
                @click="onResonate(item.id)"
              >
                <el-icon><CirclePlus /></el-icon> 共鸣 {{ item.resonance.length }}
              </el-button>
              <el-popconfirm title="删除该议题？" @confirm="onRemove(item.id)">
                <template #reference>
                  <el-button size="small" link type="danger">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右：情绪温度计 + 雷达 -->
      <div class="col">
        <el-card shadow="never" class="block">
          <template #header><span class="block-title">🌡️ 情绪温度计</span></template>
          <p class="hint">记录你此刻的情绪值（0=低落，100=愉悦），用于年度情感报告。</p>
          <div class="thermo">
            <el-slider v-model="emotionLevel" :show-tooltip="false" vertical height="180px" />
            <div class="thermo-val" :style="{ color: emoColor }">{{ emotionLevel }}</div>
          </div>
          <el-input v-model="emotionNote" type="textarea" :rows="2" placeholder="今天为什么是这个情绪？（可选）" />
          <el-button type="primary" plain @click="onSaveEmotion">保存我的情绪</el-button>
        </el-card>

        <el-card shadow="never" class="block">
          <template #header><span class="block-title">🧭 家庭情绪雷达</span></template>
          <div ref="radarEl" class="radar"></div>
          <div v-if="!hasEmotion" class="empty small">暂无情绪数据</div>
        </el-card>
      </div>
    </div>
    </template>

    <el-empty v-else description="请先选择或新建一个会议" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import { CirclePlus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import MeetingSelect from './MeetingSelect.vue'

const store = useStore()
const meetingId = ref(store.getters['familyMeeting/visibleMeetings'][0]?.id || '')

const categories = ['家庭事务', '财务', '子女教育', '健康', '出行计划', '情感沟通', '其他']
const ag = ref({ title: '', category: '家庭事务', priority: 2, desc: '', emotion: 50 })
const emotionLevel = ref(50)
const emotionNote = ref('')
const radarEl = ref(null)
let chart = null

const uid = computed(() => store.state.familyMeeting.currentUserId)
const meeting = computed(() => store.getters['familyMeeting/meetingById'](meetingId.value) || {})
const agenda = computed(() => store.getters['familyMeeting/agendaForMeeting'](meetingId.value))
const members = computed(() => store.state.familyMeeting.members)
const emotionLogs = computed(() => store.getters['familyMeeting/emotionForMeeting'](meetingId.value))
const hasEmotion = computed(() => emotionLogs.value.length > 0)

const emoColor = computed(() => {
  const v = emotionLevel.value
  if (v >= 70) return '#10b981'
  if (v >= 40) return '#f59e0b'
  return '#ef4444'
})

function name(id) { return store.getters['familyMeeting/memberName'](id) }
function priType(p) { return ['info', 'warning', 'danger'][p - 1] }

function onSubmit() {
  if (!ag.value.title) return
  store.dispatch('familyMeeting/addAgenda', {
    meetingId: meetingId.value,
    title: ag.value.title,
    category: ag.value.category,
    priority: ag.value.priority,
    desc: ag.value.desc,
    emotionLevel: ag.value.emotion
  })
  ag.value = { title: '', category: '家庭事务', priority: 2, desc: '', emotion: 50 }
  ElMessage.success('议题已提交')
}

function onResonate(id) { store.dispatch('familyMeeting/toggleResonance', id) }
function onRemove(id) { store.dispatch('familyMeeting/removeAgenda', id) }
function onLock() { store.dispatch('familyMeeting/lockAgenda', meetingId.value); ElMessage.success('议程已锁定') }

function onSaveEmotion() {
  store.dispatch('familyMeeting/addEmotion', {
    userId: uid.value,
    meetingId: meetingId.value,
    level: emotionLevel.value,
    note: emotionNote.value
  })
  ElMessage.success('情绪已记录')
}

function renderRadar() {
  if (!radarEl.value) return
  if (!chart) chart = echarts.init(radarEl.value)
  const indicator = members.value.map(m => ({ name: m.name, max: 100 }))
  const values = members.value.map(m => {
    const logs = store.getters['familyMeeting/emotionByUser'](m.id)
      .filter(e => e.meetingId === meetingId.value)
    if (!logs.length) return 0
    return Math.round(logs.reduce((s, e) => s + e.level, 0) / logs.length)
  })
  chart.setOption({
    tooltip: {},
    radar: {
      indicator,
      radius: '65%',
      axisName: { color: '#475569' }
    },
    series: [{
      type: 'radar',
      data: [{ value: values, name: '情绪值', areaStyle: { color: 'rgba(99,102,241,0.25)' }, lineStyle: { color: '#6366f1' } }]
    }]
  })
}

onMounted(() => { nextTick(renderRadar); window.addEventListener('resize', onResize) })
onUnmounted(() => { chart?.dispose(); window.removeEventListener('resize', onResize) })
watch([meetingId, emotionLogs, members], () => nextTick(renderRadar))

function onResize() { chart?.resize() }
</script>

<style lang="scss" scoped>
.agenda-board { display: flex; flex-direction: column; gap: 14px; }
.agenda-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.col { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.block { border-radius: 14px; }
.block-title { font-weight: 700; color: #0f172a; }
.hint { font-size: 13px; color: #64748b; margin: 0 0 12px; }
.empty { color: #94a3b8; text-align: center; padding: 24px 0; &.small { padding: 8px 0; } }
.agenda-item {
  display: flex; gap: 10px; padding: 12px; border: 1px solid #e2e8f0;
  border-radius: 12px; margin-bottom: 10px; background: #fff;
  &.locked { opacity: 0.85; }
}
.ai-order {
  width: 24px; height: 24px; min-width: 24px; border-radius: 50%;
  background: #6366f1; color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 12px; flex-shrink: 0;
}
.ai-body { flex: 1; min-width: 0; }
.ai-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.ai-title { font-weight: 600; color: #0f172a; font-size: 14px; }
.ai-meta { font-size: 12px; color: #64748b; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px; }
.ai-emo { margin-left: 8px; color: #f59e0b; }
.ai-desc { font-size: 13px; color: #475569; margin-top: 6px; word-break: break-word; }
.ai-actions {
  display: flex; flex-direction: column; gap: 6px; align-items: flex-end; flex-shrink: 0;
}
.thermo { display: flex; align-items: center; gap: 20px; justify-content: center; margin: 10px 0; }
.thermo-val { font-size: 40px; font-weight: 800; }
.emo-val { margin-left: 10px; font-weight: 700; color: #6366f1; }
.radar { width: 100%; height: 260px; }

// ===== 响应式 =====
@media (max-width: 1024px) {
  .agenda-cols { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .agenda-cols { grid-template-columns: 1fr; gap: 12px; }
  .agenda-item {
    flex-direction: column; gap: 8px;
    .ai-actions { flex-direction: row; align-items: center; gap: 8px; }
  }
  .thermo-val { font-size: 32px; }
  .radar { height: 220px; }
}

@media (max-width: 480px) {
  .agenda-board { gap: 10px; }
  .agenda-item { padding: 10px; border-radius: 10px; }
  .block { border-radius: 12px; }
  .ai-head { gap: 4px; }
}
</style>

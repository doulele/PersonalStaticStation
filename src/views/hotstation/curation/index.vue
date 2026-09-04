<template>
  <div class="hs-page" data-hs-page>
    <!-- 头部 -->
    <div class="hs-hero">
      <div class="hs-hero-text">
        <h1 class="hs-title">信息策展与二创工作台</h1>
        <p class="hs-subtitle">AI 驱动的信息策展与二次创作 · 减少上网时间，不遗漏重大事件</p>
      </div>
      <div class="hs-hero-actions">
        <button class="hs-admin-btn" :disabled="parsing" @click="openDeepAnalyze">
          <el-icon :size="16"><DataAnalysis /></el-icon>
          <span>深度解析</span>
        </button>
        <button v-if="isAdmin" class="hs-admin-btn" @click="router.push('/hotstation/curation/admin')">
          <el-icon :size="16"><Setting /></el-icon>
          <span>后台管理</span>
        </button>
      </div>
    </div>

    <!-- 时空穿梭机 -->
    <div v-if="historyLoading" class="hs-time-machine tm-loading">
      <div class="loading-tip"><el-icon class="is-loading"><Loading /></el-icon><span>正在加载时空穿梭机…</span></div>
    </div>
    <div v-else-if="todayHistory.length" class="hs-time-machine">
      <div class="tm-head">
        <span class="tm-title"><el-icon><Timer /></el-icon>时空穿梭机 · 今日十年对比</span>
        <button class="tm-head-btn" @click="showTimeMachine = !showTimeMachine">
          <span>{{ showTimeMachine ? '收起' : '展开' }}</span>
          <el-icon :class="{ rotated: showTimeMachine }"><ArrowDown /></el-icon>
        </button>
      </div>
      <div v-if="showTimeMachine" class="tm-body">
        <div class="tm-desc">今天历史上发生过什么？选择一条历史事件，与当前热点对照生成文章。</div>
        <div class="tm-list">
          <div v-for="h in todayHistory" :key="h.id" class="tm-item">
            <span class="tm-date">{{ h.event_date }}</span>
            <span class="tm-name">{{ h.title }}</span>
            <span class="tm-tags">{{ (h.tags || []).join(' / ') }}</span>
            <button class="hs-parse-btn" :disabled="comparingId === h.id" @click="doCompare(h)">
              {{ comparingId === h.id ? '生成中…' : '生成穿越对比' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 标签页 -->
    <div class="hs-tabs">
      <div class="hs-tab-list">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          class="hs-tab"
          :class="{ active: statusFilter === tab.value }"
          @click="statusFilter = tab.value; loadEvents(1)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- 主区 -->
    <div class="hs-main">
      <!-- 信息流 -->
      <div class="hs-feed">
        <div class="feed-toolbar">
          <span class="feed-count">{{ total }} 个事件</span>
        </div>

        <div v-if="eventsLoading" class="feed-loading">
          <div class="loading-tip"><el-icon class="is-loading"><Loading /></el-icon><span>正在加载事件…</span></div>
          <el-skeleton :rows="5" animated />
        </div>
        <template v-else>
          <EventCard
            v-for="ev in events"
            :key="ev.id"
            :event="ev"
            @view="goDetail"
            @track="doTrack"
            @generate="openGenerate"
          />
          <el-empty v-if="!events.length" description="暂无事件，试试粘贴一条链接解析入库" />
          <div v-if="events.length && total > events.length" class="feed-more">
            <button :disabled="eventsLoading" @click="loadMore">
              <el-icon v-if="eventsLoading" class="is-loading"><Loading /></el-icon>
              <span>{{ eventsLoading ? '加载中…' : `加载更多（${events.length}/${total}）` }}</span>
            </button>
          </div>
        </template>
      </div>

      <!-- 右侧策展推荐卡 -->
      <aside class="hs-cards">
        <div class="cards-head">
          <span class="cards-title">策展推荐</span>
          <span class="cards-desc">主编精选</span>
        </div>
        <div v-if="cardsLoading" class="cards-loading">
          <div class="loading-tip"><el-icon class="is-loading"><Loading /></el-icon><span>正在加载策展推荐…</span></div>
        </div>
        <template v-else>
          <div v-for="card in cards" :key="card.id" class="curated-card">
            <div class="cc-head">
              <div class="cc-avatar">{{ (card.name || '?')[0] }}</div>
              <div class="cc-info">
                <div class="cc-name">{{ card.name }}</div>
                <div class="cc-type">{{ typeName(card.type) }} · {{ (card.tags || []).join(' / ') }}</div>
              </div>
            </div>
            <div class="cc-profile">{{ card.profile }}</div>
            <div v-if="card.achievement" class="cc-achievement"><el-icon><Trophy /></el-icon><span>{{ card.achievement }}</span></div>
            <div v-if="card.editor_note" class="cc-note"><el-icon><EditPen /></el-icon><span>主编按语：{{ card.editor_note }}</span></div>
            <div class="cc-audience">{{ (card.audience_tags || []).map(t => '#' + t).join(' ') }}</div>
          </div>
          <el-empty v-if="!cards.length" description="策展卡暂未录入" :image-size="60" />
        </template>
      </aside>
    </div>

    <!-- 链接深度解析弹窗 -->
    <el-dialog v-model="analyzeDialogVisible" title="深度解析" width="min(560px, 92vw)" destroy-on-close class="hs-parse-dialog">
      <div class="hs-input-panel hs-input-panel--plain">
        <div class="hs-input-row">
          <div class="hs-search-box">
            <el-icon class="hs-link-icon"><Link /></el-icon>
            <input
              ref="linkInputRef"
              v-model="linkUrl"
              class="hs-link-input"
              placeholder="粘贴公开链接（B站 / YouTube / 知乎 / 公众号 / 微博 / 抖音 / 小红书）"
              @keyup.enter="doParseLink"
            />
            <button class="hs-parse-btn" :disabled="parsing" @click="doParseLink">
              <el-icon v-if="parsing" class="is-loading"><Loading /></el-icon>
              <span>解析</span>
            </button>
          </div>
          <el-upload
            class="hs-upload"
            :show-file-list="false"
            :auto-upload="false"
            accept="image/*,audio/*"
            :on-change="handleFileChange"
          >
            <div class="hs-upload-btn">
              <el-icon><Paperclip /></el-icon>
              <span>图片/语音投喂</span>
            </div>
          </el-upload>
        </div>
        <div class="hs-input-hint">
          <span v-if="linkUrl && linkCapability" :class="`cap-badge cap-${linkCapability.level}`">
            {{ linkCapability.icon }} {{ linkCapability.name }} · {{ linkCapability.desc }}
          </span>
          <span v-else>视频深度解析仅支持 B站/YouTube；抖音/小红书仅标题/简介</span>
          <span v-if="!isAdmin" class="guest-tip">未登录：仅可查看已缓存解析结果</span>
        </div>
      </div>
    </el-dialog>

    <!-- 解析结果弹窗 -->
    <el-dialog v-model="resultVisible" title="解析结果" width="min(680px, 92vw)" destroy-on-close>
      <div v-if="parseResult" class="parse-result">
        <div class="pr-title-row">
          <h3>{{ parseResult.clean.summary || parseResult.parsed.title }}</h3>
          <el-tag v-if="parseResult.cacheHit" size="small" type="info">缓存命中</el-tag>
        </div>
        <div class="pr-section">
          <div class="pr-label"><el-icon><DataAnalysis /></el-icon>数据事实</div>
          <ul><li v-for="(f, i) in parseResult.clean.facts || []" :key="i">{{ f }}</li></ul>
        </div>
        <div class="pr-section">
          <div class="pr-label"><el-icon><ChatDotRound /></el-icon>媒体观点</div>
          <ul><li v-for="(o, i) in parseResult.clean.opinions || []" :key="i">{{ o.content }}<span v-if="o.source" class="pr-src">—— {{ o.source }}</span></li></ul>
        </div>
        <div v-if="(parseResult.clean.emotions || []).length" class="pr-section">
          <div class="pr-label"><el-icon><ChatLineSquare /></el-icon>网民情绪</div>
          <ul><li v-for="(e, i) in parseResult.clean.emotions" :key="i">{{ e }}</li></ul>
        </div>
        <el-alert
          v-if="parseResult.relatedEvent"
          type="warning"
          :closable="false"
          class="pr-related"
          :title="`检测到此链接与「${parseResult.relatedEvent.title}」高度相关`"
        >
          <div class="related-actions">
            <el-button size="small" type="warning" :loading="associating" @click="confirmAssociate(true)">并入该事件</el-button>
            <el-button size="small" :loading="associating" @click="confirmAssociate(false)">创建新事件</el-button>
          </div>
        </el-alert>
        <el-alert v-else type="info" :closable="false" title="未匹配到相近事件">
          <div class="related-actions">
            <el-button size="small" type="primary" :loading="associating" @click="confirmAssociate(false)">创建新事件入库</el-button>
          </div>
        </el-alert>
      </div>
    </el-dialog>

    <!-- 时空对比结果 -->
    <el-dialog v-model="compareVisible" title="穿越对比 · 生成结果" width="min(680px, 92vw)" destroy-on-close>
      <pre class="compare-content">{{ compareContent }}</pre>
      <div class="compare-copy"><el-button type="primary" plain size="small" @click="copyCompare"><el-icon><CopyDocument /></el-icon><span>复制</span></el-button></div>
    </el-dialog>

    <!-- 生成抽屉 -->
    <GenerateDrawer v-model="drawerVisible" :event="activeEvent" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { Link, Paperclip, Setting, Loading, ArrowDown, Timer, Trophy, EditPen, DataAnalysis, ChatDotRound, ChatLineSquare, CopyDocument } from '@element-plus/icons-vue'
import EventCard from '../components/EventCard.vue'
import GenerateDrawer from '../components/GenerateDrawer.vue'
import {
  getEvents, parseLink, associateEvent, getCards, getTodayHistory,
  generateHistoryCompare, getReminders, dismissReminder, toggleTrack
} from '@/api/hotstation'
import { detectPlatform, PLATFORM_CAPABILITY } from '@/services/hotstationMeta'

const router = useRouter()
const store = useStore()
const isAdmin = computed(() => store.getters['auth/isLoggedIn'])

const linkUrl = ref('')
const linkInputRef = ref(null)
const parsing = ref(false)
const aiCostTipShown = ref(false)
const events = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const eventsLoading = ref(false)
const statusFilter = ref('')
const statusTabs = [
  { label: '全部', value: '' },
  { label: '孕育中', value: 'pending' },
  { label: '追踪中', value: 'tracking' },
  { label: '已归档', value: 'archived' }
]
const cards = ref([])
const cardsLoading = ref(false)
const todayHistory = ref([])
const historyLoading = ref(false)
const showTimeMachine = ref(false)
const drawerVisible = ref(false)
const activeEvent = ref(null)
const analyzeDialogVisible = ref(false)
const resultVisible = ref(false)
const parseResult = ref(null)
const associating = ref(false)
const compareVisible = ref(false)
const compareContent = ref('')
const comparingId = ref('')
let reminderTimer = null

const linkCapability = computed(() => {
  if (!linkUrl.value) return null
  const p = detectPlatform(linkUrl.value)
  return PLATFORM_CAPABILITY[p] || null
})

function typeName(t) {
  return { blogger: '博主', book: '书籍', product: '产品' }[t] || t
}

async function loadEvents(p = 1) {
  eventsLoading.value = true
  try {
    const res = await getEvents({ page: p, pageSize, status: statusFilter.value })
    const data = res.data
    events.value = p === 1 ? data.list : [...events.value, ...data.list]
    total.value = data.total
    page.value = p
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    eventsLoading.value = false
  }
}

function loadMore() { loadEvents(page.value + 1) }

function openDeepAnalyze() {
  analyzeDialogVisible.value = true
  nextTick(() => {
    setTimeout(() => linkInputRef.value?.focus(), 50)
  })
}

async function doParseLink() {
  const url = linkUrl.value.trim()
  if (!url) return ElMessage.warning('请先粘贴链接')
  if (!aiCostTipShown.value) {
    aiCostTipShown.value = true
    ElMessage.info('提示：链接若未命中缓存，将调用 AI 清洗正文并消耗 Token', { duration: 4000 })
  }
  parsing.value = true
  try {
    const res = await parseLink(url)
    parseResult.value = res.data
    resultVisible.value = true
    analyzeDialogVisible.value = false
  } catch (e) {
    ElMessage.error(e.message || '解析失败')
  } finally {
    parsing.value = false
  }
}

async function confirmAssociate(merge) {
  const pr = parseResult.value
  if (!pr) return
  associating.value = true
  try {
    const payload = {
      eventId: merge && pr.relatedEvent ? pr.relatedEvent.id : '',
      title: pr.parsed.title || pr.clean.summary,
      content: pr.parsed.content || '',
      sourceName: pr.parsed.upName || '用户投喂',
      sourceDomain: pr.parsed.url ? new URL(pr.parsed.url).hostname : '',
      url: pr.parsed.url,
      comments: pr.parsed.comments || [],
      danmaku: pr.parsed.danmaku || []
    }
    const res = await associateEvent(payload)
    ElMessage.success(merge ? '已并入事件' : '新事件已入库')
    resultVisible.value = false
    loadEvents(1)
    // 若并入的是追踪中事件，跳详情
    if (res.data.event) router.push(`/hotstation/curation/event/${res.data.event.id}`)
  } catch (e) {
    ElMessage.error(e.message || '入库失败')
  } finally {
    associating.value = false
  }
}

function handleFileChange(file) {
  const isImage = file.raw.type.startsWith('image/')
  const isAudio = file.raw.type.startsWith('audio/')
  if (!isImage && !isAudio) return ElMessage.warning('仅支持图片或音频文件')
  uploadFile(file.raw, isImage ? 'image' : 'audio')
}

async function uploadFile(file, kind) {
  const fd = new FormData()
  fd.append(kind, file)
  const loading = ElMessage({ type: 'info', message: `${kind === 'image' ? 'OCR 识别中' : '语音转写中'}…`, duration: 0 })
  try {
    const res = await import('@/api/hotstation').then(m => m.uploadMultimedia(fd))
    ElMessage.success('投喂成功，已入库')
    loadEvents(1)
  } catch (e) {
    ElMessage.error(e.message || '投喂失败')
  } finally {
    loading.close()
  }
}

function openGenerate(event) {
  activeEvent.value = event
  drawerVisible.value = true
}

function goDetail(event) {
  router.push(`/hotstation/curation/event/${event.id}`)
}

async function doTrack(event) {
  try {
    const res = await toggleTrack(event.id, true)
    ElMessage.success('已开启追踪，后续相关报道将自动归入')
    loadEvents(page.value)
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function loadCards() {
  cardsLoading.value = true
  try {
    const res = await getCards()
    cards.value = res.data
  } catch {
    cards.value = []
  } finally {
    cardsLoading.value = false
  }
}

async function loadTimeMachine() {
  historyLoading.value = true
  try {
    const res = await getTodayHistory()
    todayHistory.value = res.data
  } catch {
    todayHistory.value = []
  } finally {
    historyLoading.value = false
  }
}

async function doCompare(h) {
  if (!events.value.length) {
    ElMessage.warning('信息流暂无热点事件，请先解析内容入库后再生成穿越对比')
    return
  }
  try {
    await ElMessageBox.confirm(
      `将调用 DeepSeek 大模型对比当前热点与「${h.title}」并生成穿越文案，消耗 Token 配额，是否继续？`,
      '今昔对比 · 消耗 Token',
      { type: 'warning', confirmButtonText: '生成', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  comparingId.value = h.id
  try {
    const res = await generateHistoryCompare({ eventId: events.value[0].id, historyId: h.id })
    compareContent.value = res.data.content
    compareVisible.value = true
  } catch (e) {
    ElMessage.error(e.message || '生成失败')
  } finally {
    comparingId.value = ''
  }
}

function copyCompare() {
  navigator.clipboard.writeText(compareContent.value).then(() => ElMessage.success('已复制'))
}

/* 热度提醒轮询（30s） */
async function pollReminders() {
  try {
    const res = await getReminders()
    const list = res.data || []
    list.forEach(r => {
      if (r.type === 'heat') {
        ElNotification({
          title: '热度骤升',
          message: `「${r.title}」1小时内新增 ${r.hour_count || 0} 家报道，是否开启追踪？`,
          duration: 8000,
          onClick: () => { router.push(`/hotstation/curation/event/${r.event_id}`); dismissReminder(r.event_id) }
        })
      } else if (r.type === 'quiet') {
        ElNotification({
          title: '事件静默',
          message: `「${r.title}」已连续3天无新报道，可考虑结束追踪归档`,
          duration: 8000,
          onClick: () => { router.push(`/hotstation/curation/event/${r.event_id}`); dismissReminder(r.event_id) }
        })
      }
      dismissReminder(r.event_id)
    })
  } catch { /* 静默 */ }
}

onMounted(() => {
  loadEvents(1)
  loadCards()
  loadTimeMachine()
  pollReminders()
  reminderTimer = setInterval(pollReminders, 30000)
})

onBeforeUnmount(() => {
  if (reminderTimer) clearInterval(reminderTimer)
})
</script>

<style lang="scss" scoped src="./index.scss"></style>

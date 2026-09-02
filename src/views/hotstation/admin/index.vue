<template>
  <div class="hs-admin" data-hs-admin>
    <div class="adm-hero">
      <div class="adm-hero-text">
        <h1 class="adm-title">信息策展与二创工作台 · 后台管理</h1>
        <p class="adm-sub">策展卡 / 白皮书 / 历史事件库 / 信源池</p>
      </div>
      <button class="adm-back-btn" @click="router.push('/hotstation/curation')">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回信息流</span>
      </button>
    </div>

    <div class="adm-tabs">
      <div class="adm-tab-list">
        <button
          v-for="t in adminTabs"
          :key="t.name"
          class="adm-tab"
          :class="{ active: tab === t.name }"
          @click="tab = t.name"
        >
          <el-icon :size="15"><component :is="t.icon" /></el-icon>
          <span>{{ t.label }}</span>
        </button>
      </div>
    </div>

    <div class="adm-panel">
      <!-- 策展卡管理 -->
      <div v-if="tab === 'cards'" class="adm-tab-pane">
        <div class="adm-toolbar">
          <button class="adm-btn-primary" @click="openCard()">
            <el-icon><Plus /></el-icon>
            <span>新增策展卡</span>
          </button>
        </div>
        <el-table :data="cards" class="adm-table">
          <el-table-column label="名称" min-width="120">
            <template #default="{ row }">{{ row.name }}</template>
          </el-table-column>
          <el-table-column label="类型" width="90">
            <template #default="{ row }">{{ typeName(row.type) }}</template>
          </el-table-column>
          <el-table-column label="标签" min-width="140">
            <template #default="{ row }">
              <el-tag v-for="t in row.tags" :key="t" size="small" style="margin-right: 4px">{{ t }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="profile" label="简介" min-width="180" show-overflow-tooltip />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-switch :model-value="row.enabled" @change="v => toggleCard(row, v)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <button class="adm-action" @click="openCard(row)">编辑</button>
              <button class="adm-action adm-action-danger" @click="removeCard(row)">删除</button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="!cards.length" class="adm-empty">
          <el-icon class="adm-empty-icon"><FolderOpened /></el-icon>
          <div>暂无策展卡，点击上方按钮新增</div>
        </div>
      </div>

      <!-- 白皮书审阅 -->
      <div v-if="tab === 'whitepapers'" class="adm-tab-pane">
        <el-table :data="whitepapers" class="adm-table">
          <el-table-column prop="event_title" label="事件" min-width="180" show-overflow-tooltip />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="wpType(row.status)">{{ wpName(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="内容概览" min-width="260">
            <template #default="{ row }">
              <div class="wp-preview">
                <div>时间节点 {{ row.content.timeline?.length || 0 }} · 核实事实 {{ row.content.verifiedFacts?.length || 0 }}</div>
                <div v-if="row.content.stats">报道 {{ row.content.stats.totalReports }} · 确定性 {{ row.content.stats.verified ? '已核实' : '未核实' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="生成时间" width="160">
            <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <button v-if="row.status === 'draft'" class="adm-action" @click="actWhitepaper(row, 'publish')">发布</button>
              <button v-if="row.status === 'draft'" class="adm-action" @click="actWhitepaper(row, 'archive')">存档</button>
              <button class="adm-action" @click="viewWp(row)">查看</button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="!whitepapers.length" class="adm-empty">
          <el-icon class="adm-empty-icon"><Document /></el-icon>
          <div>暂无白皮书审阅</div>
        </div>
      </div>

      <!-- 历史事件库 -->
      <div v-if="tab === 'history'" class="adm-tab-pane">
        <div class="adm-toolbar">
          <button class="adm-btn-primary" @click="openHistory()">
            <el-icon><Plus /></el-icon>
            <span>录入历史事件</span>
          </button>
        </div>
        <el-table :data="historyEvents" class="adm-table">
          <el-table-column prop="event_date" label="日期" width="120" />
          <el-table-column prop="title" label="事件" min-width="200" />
          <el-table-column label="标签" min-width="140">
            <template #default="{ row }">
              <el-tag v-for="t in row.tags" :key="t" size="small" style="margin-right: 4px">{{ t }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <button class="adm-action" @click="openHistory(row)">编辑</button>
              <button class="adm-action adm-action-danger" @click="removeHistory(row)">删除</button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="!historyEvents.length" class="adm-empty">
          <el-icon class="adm-empty-icon"><Calendar /></el-icon>
          <div>暂无历史事件，点击上方按钮录入</div>
        </div>
      </div>

      <!-- 信源池 -->
      <div v-if="tab === 'sources'" class="adm-tab-pane">
        <div class="adm-toolbar">
          <span class="adm-summary">共 {{ sources.length }} 个信源，启用 {{ sources.filter(s => s.enabled).length }} 个</span>
          <button class="adm-btn-ghost" :disabled="refreshing" @click="manualRefresh">
            <el-icon v-if="refreshing" class="is-loading"><Refresh /></el-icon>
            <el-icon v-else><Refresh /></el-icon>
            <span>手动抓取</span>
          </button>
        </div>
        <el-table :data="sources" class="adm-table" size="small">
          <el-table-column prop="name" label="信源" min-width="150" />
          <el-table-column prop="domain" label="域名" min-width="130" />
          <el-table-column label="类型" width="80">
            <template #default="{ row }">{{ row.type === 'rss' ? 'RSS' : '页面' }}</template>
          </el-table-column>
          <el-table-column label="高权重" width="90">
            <template #default="{ row }">
              <el-tag v-if="row.is_high_weight" size="small" type="primary">高权重</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tooltip :content="row.last_error || ''" placement="top">
                <span>
                  <el-tag size="small" :type="row.last_status === 'ok' ? 'success' : row.last_status === 'fail' ? 'danger' : 'info'">
                    {{ row.last_status === 'ok' ? '正常' : row.last_status === 'fail' ? '失败' : '未抓取' }}
                  </el-tag>
                </span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="启用" width="90">
            <template #default="{ row }">
              <el-switch :model-value="row.enabled" @change="v => toggleSourceRow(row, v)" />
            </template>
          </el-table-column>
        </el-table>
        <div v-if="!sources.length" class="adm-empty">
          <el-icon class="adm-empty-icon"><Link /></el-icon>
          <div>暂无信源配置</div>
        </div>
      </div>
    </div>

    <!-- 策展卡编辑弹窗 -->
    <el-dialog v-model="cardDialog" :title="cardForm.id ? '编辑策展卡' : '新增策展卡'" width="min(560px, 92vw)">
      <el-form :model="cardForm" label-width="88px">
        <el-form-item label="名称" required><el-input v-model="cardForm.name" /></el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="cardForm.type">
            <el-radio-button value="blogger">博主</el-radio-button>
            <el-radio-button value="book">书籍</el-radio-button>
            <el-radio-button value="product">产品</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标签"><el-input v-model="cardForm.tagsText" placeholder="逗号分隔，如 AI,科普" /></el-form-item>
        <el-form-item label="简介"><el-input v-model="cardForm.profile" type="textarea" :rows="2" placeholder="粉丝量级、核心成就（1句话）、适合人群" /></el-form-item>
        <el-form-item label="核心成就"><el-input v-model="cardForm.achievement" /></el-form-item>
        <el-form-item label="适合人群"><el-input v-model="cardForm.audienceText" placeholder="逗号分隔，如 通勤听" /></el-form-item>
        <el-form-item label="主编按语"><el-input v-model="cardForm.editor_note" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="风格预设"><el-input v-model="cardForm.style_preset" placeholder="生成时的风格关键词" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cardDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCard">保存</el-button>
      </template>
    </el-dialog>

    <!-- 历史事件编辑弹窗 -->
    <el-dialog v-model="historyDialog" :title="historyForm.id ? '编辑历史事件' : '录入历史事件'" width="min(560px, 92vw)">
      <el-form :model="historyForm" label-width="88px">
        <el-form-item label="事件标题" required><el-input v-model="historyForm.title" /></el-form-item>
        <el-form-item label="日期" required>
          <el-date-picker v-model="historyForm.event_date" type="date" value-format="YYYY-MM-DD" placeholder="历史上的这一天" />
        </el-form-item>
        <el-form-item label="标签"><el-input v-model="historyForm.tagsText" placeholder="逗号分隔，用于与今日热点匹配" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="historyForm.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="来源"><el-input v-model="historyForm.source" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="historyDialog = false">取消</el-button>
        <el-button type="primary" @click="saveHistory">保存</el-button>
      </template>
    </el-dialog>

    <!-- 白皮书查看 -->
    <el-dialog v-model="wpVisible" title="白皮书" width="min(760px, 94vw)" destroy-on-close>
      <div v-if="activeWp" class="wp-detail">
        <h3>{{ activeWp.event_title }}</h3>
        <div class="wp-section" v-if="activeWp.content.timeline?.length">
          <div class="wp-sec-title"><el-icon style="margin-right: 4px"><Timer /></el-icon>时间线全景</div>
          <div v-for="(n, i) in activeWp.content.timeline" :key="i" class="wp-node">
            <span class="wp-node-time">{{ n.time?.slice(0, 16) }}</span>
            <span class="wp-node-src">[{{ n.source }}]</span>
            <span class="wp-node-title">{{ n.title }}</span>
            <el-tag v-if="n.nodeType === 'rumor_refute'" size="small" type="danger">辟谣</el-tag>
          </div>
        </div>
        <div class="wp-section">
          <div class="wp-sec-title"><el-icon style="margin-right: 4px"><CircleCheck /></el-icon>最终核实事实清单</div>
          <ul><li v-for="(f, i) in activeWp.content.verifiedFacts" :key="i">{{ f }}</li></ul>
        </div>
        <div class="wp-section">
          <div class="wp-sec-title"><el-icon style="margin-right: 4px"><Microphone /></el-icon>各方最终立场</div>
          <div v-for="(o, i) in activeWp.content.finalStances" :key="i" class="wp-node">
            <span class="wp-node-src">[{{ o.source }}]</span>
            <span>{{ o.content }}</span>
          </div>
        </div>
        <div v-if="activeWp.content.dataConflicts?.length" class="wp-section">
          <div class="wp-sec-title"><el-icon style="margin-right: 4px"><Warning /></el-icon>数据冲突解决记录（辟谣）</div>
          <div v-for="(c, i) in activeWp.content.dataConflicts" :key="i" class="wp-node">
            <span class="wp-node-src">[{{ c.source }}]</span>
            <span>{{ c.title }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus, Refresh, Collection, Document, Clock, Link, FolderOpened, Calendar, Timer, CircleCheck, Microphone, Warning } from '@element-plus/icons-vue'
import {
  getCards, createCard, updateCard, deleteCard,
  getWhitepapers, publishWhitepaper,
  getHistoryEvents, createHistoryEvent, updateHistoryEvent, deleteHistoryEvent,
  getSources, toggleSource, refreshSources
} from '@/api/hotstation'

const router = useRouter()
const tab = ref('cards')
const adminTabs = [
  { name: 'cards', label: '策展卡管理', icon: Collection },
  { name: 'whitepapers', label: '白皮书审阅', icon: Document },
  { name: 'history', label: '历史事件库', icon: Clock },
  { name: 'sources', label: '信源池', icon: Link }
]

/* 策展卡 */
const cards = ref([])
const cardDialog = ref(false)
const cardForm = ref({})
function emptyCard() {
  return { id: '', name: '', type: 'blogger', tagsText: '', profile: '', achievement: '', audienceText: '', editor_note: '', style_preset: '' }
}
function openCard(row) {
  cardForm.value = row ? {
    ...emptyCard(), id: row.id, name: row.name, type: row.type,
    tagsText: (row.tags || []).join(','), profile: row.profile,
    achievement: row.achievement, audienceText: (row.audience_tags || []).join(','),
    editor_note: row.editor_note, style_preset: row.style_preset
  } : emptyCard()
  cardDialog.value = true
}
async function saveCard() {
  if (!cardForm.value.name) return ElMessage.warning('名称必填')
  const payload = {
    name: cardForm.value.name,
    type: cardForm.value.type,
    tags: cardForm.value.tagsText.split(',').map(s => s.trim()).filter(Boolean),
    profile: cardForm.value.profile,
    achievement: cardForm.value.achievement,
    audience_tags: cardForm.value.audienceText.split(',').map(s => s.trim()).filter(Boolean),
    editor_note: cardForm.value.editor_note,
    style_preset: cardForm.value.style_preset
  }
  try {
    if (cardForm.value.id) await updateCard(cardForm.value.id, payload)
    else await createCard(payload)
    ElMessage.success('保存成功')
    cardDialog.value = false
    loadCards()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  }
}
async function toggleCard(row, v) {
  try { await updateCard(row.id, { enabled: v }); row.enabled = v } catch (e) { ElMessage.error(e.message) }
}
async function removeCard(row) {
  await ElMessageBox.confirm(`确定删除「${row.name}」？`, '提示', { type: 'warning' })
  try { await deleteCard(row.id); ElMessage.success('已删除'); loadCards() } catch (e) { ElMessage.error(e.message) }
}
async function loadCards() {
  try { const res = await getCards(); cards.value = res.data } catch (e) { ElMessage.error(e.message) }
}

/* 白皮书 */
const whitepapers = ref([])
const wpVisible = ref(false)
const activeWp = ref(null)
async function loadWp() {
  try { const res = await getWhitepapers(); whitepapers.value = res.data } catch { whitepapers.value = [] }
}
function wpName(s) { return { draft: '草稿·待审阅', published: '已发布', archived: '已存档' }[s] || s }
function wpType(s) { return { draft: 'warning', published: 'success', archived: 'info' }[s] || 'info' }
async function actWhitepaper(row, action) {
  try {
    await publishWhitepaper(row.id, action)
    ElMessage.success(action === 'publish' ? '已发布，普通用户可见' : '已存档')
    loadWp()
  } catch (e) { ElMessage.error(e.message) }
}
function viewWp(row) { activeWp.value = row; wpVisible.value = true }

/* 历史事件库 */
const historyEvents = ref([])
const historyDialog = ref(false)
const historyForm = ref({})
function emptyHistory() {
  return { id: '', title: '', event_date: '', tagsText: '', description: '', source: '' }
}
function openHistory(row) {
  historyForm.value = row ? {
    ...emptyHistory(), id: row.id, title: row.title, event_date: row.event_date,
    tagsText: (row.tags || []).join(','), description: row.description, source: row.source
  } : emptyHistory()
  historyDialog.value = true
}
async function saveHistory() {
  if (!historyForm.value.title || !historyForm.value.event_date) return ElMessage.warning('标题和日期必填')
  const payload = {
    title: historyForm.value.title,
    event_date: historyForm.value.event_date,
    tags: historyForm.value.tagsText.split(',').map(s => s.trim()).filter(Boolean),
    description: historyForm.value.description,
    source: historyForm.value.source
  }
  try {
    if (historyForm.value.id) await updateHistoryEvent(historyForm.value.id, payload)
    else await createHistoryEvent(payload)
    ElMessage.success('保存成功')
    historyDialog.value = false
    loadHistory()
  } catch (e) { ElMessage.error(e.message) }
}
async function removeHistory(row) {
  await ElMessageBox.confirm(`确定删除「${row.title}」？`, '提示', { type: 'warning' })
  try { await deleteHistoryEvent(row.id); ElMessage.success('已删除'); loadHistory() } catch (e) { ElMessage.error(e.message) }
}
async function loadHistory() {
  try { const res = await getHistoryEvents(); historyEvents.value = res.data } catch { historyEvents.value = [] }
}

/* 信源池 */
const sources = ref([])
const refreshing = ref(false)
async function loadSources() {
  try { const res = await getSources(); sources.value = res.data } catch { sources.value = [] }
}
async function toggleSourceRow(row, v) {
  try { await toggleSource(row.id, v); row.enabled = v } catch (e) { ElMessage.error(e.message) }
}
async function manualRefresh() {
  refreshing.value = true
  try {
    const res = await refreshSources()
    ElMessage.success('抓取已在后台启动，稍后刷新查看状态')
  } catch (e) { ElMessage.error(e.message) }
  finally { refreshing.value = false }
}

function typeName(t) { return { blogger: '博主', book: '书籍', product: '产品' }[t] || t }
function formatTime(t) { return t ? new Date(t).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '' }

onMounted(() => {
  loadCards()
  loadWp()
  loadHistory()
  loadSources()
})
</script>

<style lang="scss" scoped src="./index.scss"></style>

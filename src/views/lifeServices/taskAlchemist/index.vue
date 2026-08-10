<template>
  <div class="ta-page">
    <!-- 返回按钮 -->
    <div class="back-bar">
      <el-button text @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
    </div>

    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">第二人生·任务炼金术士</h1>
      <p class="page-desc">将每一个任务炼化为成长的黄金，用精力和时间锻造属于你的第二人生</p>
    </div>

    <!-- 伙伴问候横幅 -->
    <PartnerBanner :partner="partner" :stats="todayStats" :current-hour="currentHour" />

    <!-- Tab 导航 -->
    <div class="ta-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="ta-tab"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        <span>{{ tab.label }}</span>
        <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="ta-content">
      <!-- 任务列表 Tab -->
      <TaskList
        v-if="activeTab === 'tasks'"
        :tasks="sortedTasks"
        :current-hour="currentHour"
        @add="showTaskForm = true"
        @edit="openEditTask"
        @delete="handleDeleteTask"
        @focus="startFocus"
        @complete="handleCompleteTask"
        @delay="handleDelayTask"
      />

      <!-- 心流工坊 Tab -->
      <FlowWorkshop
        v-if="activeTab === 'focus'"
        :active-session="activeFocusSession"
        :sessions="focusSessions"
        @start="startFocusFromWorkshop"
        @stop="stopFocus"
        @complete="completeFocus"
      />

      <!-- 博物志 Tab -->
      <Museum
        v-if="activeTab === 'museum'"
        :achievements="achievements"
        :fragments="fragments"
        :cards="cards"
      />

      <!-- 日报 Tab -->
      <DailyReport
        v-if="activeTab === 'report'"
        :stats="todayStats"
        :history="reportHistory"
        :heatmap="weeklyHeatmap"
      />
    </div>

    <!-- 任务表单弹窗 -->
    <TaskForm
      v-model:visible="showTaskForm"
      :edit-task="editingTask"
      @save="handleSaveTask"
    />

    <!-- 心流专注弹窗 -->
    <FocusTimer
      v-model:visible="showFocusTimer"
      :session="activeFocusSession"
      @complete="handleFocusComplete"
      @cancel="handleFocusCancel"
    />

    <!-- 时间税赎罪弹窗 -->
    <PenanceDialog
      v-model:visible="showPenance"
      :task="penanceTask"
      @complete="handlePenanceComplete"
    />

    <!-- AI伙伴对话框 -->
    <PartnerChat
      ref="partnerChatRef"
      :partner="partner"
      :stats="todayStats"
      @command="handlePartnerCommand"
    />

    <!-- 右下角悬浮伙伴按钮 -->
    <div class="partner-fab" @click="togglePartnerChat">
      <div class="partner-avatar">{{ partnerEmoji }}</div>
      <span v-if="partnerNotification" class="partner-notification-dot"></span>
    </div>

    <!-- 每日盲盒提示（5秒后自动消失） -->
    <transition name="blind-fade">
      <div v-if="showBlindBox" class="blind-box-toast">
        <span class="blind-icon">🎁</span>
        <span>今日盲盒已就位，去完成隐藏任务赢3倍自由币吧！</span>
        <el-button text size="small" @click="dismissBlindBox">知道了</el-button>
      </div>
    </transition>

    <!-- 全局动效：自由币爆裂 -->
    <CoinBurst ref="coinBurstRef" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ArrowLeft, List, Timer, Collection, DataAnalysis, MagicStick } from '@element-plus/icons-vue'
import PartnerBanner from './components/PartnerBanner.vue'
import TaskList from './components/TaskList.vue'
import TaskForm from './components/TaskForm.vue'
import FlowWorkshop from './components/FlowWorkshop.vue'
import FocusTimer from './components/FocusTimer.vue'
import Museum from './components/Museum.vue'
import DailyReport from './components/DailyReport.vue'
import PenanceDialog from './components/PenanceDialog.vue'
import PartnerChat from './components/PartnerChat.vue'
import CoinBurst from './components/CoinBurst.vue'
import * as taApi from '@/api/taskAlchemist'

const router = useRouter()
const store = useStore()

// 是否已登录
const isLoggedIn = computed(() => store.getters['auth/isLoggedIn'])

// 后端同步开关：已登录时启用
const useBackend = computed(() => isLoggedIn.value)

// ==================== 伙伴系统 ====================
const partnerTypes = {
  tsundere: { name: '毒舌傲娇狐', emoji: '🦊', color: '#f59e0b' },
  gentle: { name: '温柔治愈猫', emoji: '🐱', color: '#a78bfa' },
  hotblood: { name: '燃系热血龙', emoji: '🐉', color: '#ef4444' }
}

const partner = ref(loadPartner())
const partnerEmoji = computed(() => partner.value.emoji || '🦊')
const partnerChatRef = ref(null)
const partnerNotification = ref(false)

function loadPartner() {
  const saved = localStorage.getItem('ta_partner')
  if (saved) {
    try { return JSON.parse(saved) } catch { }
  }
  // 默认毒舌傲娇狐
  const defaultPartner = { type: 'tsundere', ...partnerTypes.tsundere }
  localStorage.setItem('ta_partner', JSON.stringify(defaultPartner))
  return defaultPartner
}

function togglePartnerChat() {
  partnerNotification.value = false
  partnerChatRef.value?.toggle()
}

function handlePartnerCommand(cmd) {
  switch (cmd) {
    case 'snooze':
      // 再睡5分钟 - 每日限3次
      const snoozeCount = parseInt(localStorage.getItem('ta_snooze_today') || '0')
      if (snoozeCount >= 3) {
        partnerChatRef.value?.addMessage('partner', getPartnerLine('snooze_limit'))
        return
      }
      localStorage.setItem('ta_snooze_today', String(snoozeCount + 1))
      partnerChatRef.value?.addMessage('partner', getPartnerLine('snooze_ok'))
      break
    case 'silence':
      // 别烦我 - 30分钟免打扰
      localStorage.setItem('ta_silence_until', String(Date.now() + 30 * 60 * 1000))
      partnerChatRef.value?.addMessage('partner', getPartnerLine('silence'))
      showPartnerChat.value = false
      break
    case 'proud':
      // 我飘了
      const count = todayStats.value.completed
      partnerChatRef.value?.addMessage('partner', getPartnerLine('proud', count))
      break
  }
}

function getPartnerLine(key, extra) {
  const lines = {
    tsundere: {
      snooze_limit: '喂喂喂！今天已经给你三次机会了，别太得寸进尺啊！',
      snooze_ok: '哼，就5分钟，多一秒都不行！',
      silence: '……行吧，我闭嘴。30分钟后再来烦你。',
      proud: `哟，才完成${extra}个任务就飘了？不过…干得还行。`,
      morning: '太阳晒屁股了！赶紧看看今天要炼化哪些任务吧！',
      afternoon: '午后了，别摸鱼了，挑个简单的收收尾。',
      evening: '晚上就别折腾高能耗了，规划一下明天吧。',
      complete: '不错嘛，居然提前搞定了？赏你点自由币！',
      overdue: '啧，又拖延了吧？快去完成赎罪任务，别让我等太久！'
    },
    gentle: {
      snooze_limit: '今天已经休息够多了呢，我们一起开始吧？',
      snooze_ok: '好的，再休息5分钟，我等你~',
      silence: '好的，我先安静一会儿，你需要我的时候随时叫我。',
      proud: `你已经完成了${extra}个任务，真的很棒呢！`,
      morning: '早安！今天也是充满希望的一天，来看看有什么可以完成的吧~',
      afternoon: '午后时光，做点轻松的事情吧，我陪着你。',
      evening: '晚上好，今天辛苦了，整理一下明天要做的事吧。',
      complete: '太厉害了！提前完成的感觉真好，自由币收好哦~',
      overdue: '没关系，每个人都会有拖延的时候。做个赎罪小任务，然后继续前进吧。'
    },
    hotblood: {
      snooze_limit: '三次了！勇士可不能一直赖床！燃起来吧！',
      snooze_ok: '好！5分钟后，让我们一鼓作气冲上去！',
      silence: '明白了！我会保持安静，但内心的火焰不会熄灭！',
      proud: `🔥 完成了${extra}个任务！这就是炼金术士的实力！继续燃烧吧！`,
      morning: '燃烧吧！黄金时段已到，去征服那些高能耗任务！',
      afternoon: '午后战斗继续！低能耗任务也是通往胜利的一步！',
      evening: '夜晚属于复盘和规划，为明天的战斗做好准备！',
      complete: '漂亮！提前交付！你是最强的炼金术士！金币爆裂！！',
      overdue: '居然超时了？！别灰心，完成赎罪任务，我们重新来过！'
    }
  }
  return lines[partner.value.type]?.[key] || lines.tsundere[key] || '……'
}

// ==================== 时间和统计 ====================
const currentHour = ref(new Date().getHours())
let hourTimer = null

const todayStats = ref({
  total: 0,
  completed: 0,
  overdue: 0,
  aheadCount: 0,
  freeCoins: parseInt(localStorage.getItem('ta_freeCoins') || '0'),
  partnerMinutes: parseInt(localStorage.getItem('ta_partnerMinutes') || '0')
})

// ==================== 任务管理 ====================
const tasks = ref(loadTasks())
const activeTab = ref('tasks')
const showTaskForm = ref(false)
const editingTask = ref(null)
const showBlindBox = ref(calcBlindBoxVisible())

const tabs = [
  { key: 'tasks', label: '炼金任务', icon: List, badge: computed(() => tasks.value.filter(t => t.status === 'active').length) },
  { key: 'focus', label: '心流工坊', icon: Timer },
  { key: 'museum', label: '博物志', icon: Collection },
  { key: 'report', label: '炼金日报', icon: DataAnalysis }
]

// 精力时钟排序
const sortedTasks = computed(() => {
  const h = currentHour.value
  let list = [...tasks.value].filter(t => t.status !== 'deleted')

  // 排序权重
  list.sort((a, b) => {
    let scoreA = getTimeScore(a, h)
    let scoreB = getTimeScore(b, h)
    return scoreB - scoreA
  })

  return list
})

function getTimeScore(task, hour) {
  let score = 0
  // 黄金时段 9:00-11:30, 14:30-17:00 → 高能耗加分
  const isGolden = (hour >= 9 && hour < 11.5) || (hour >= 14.5 && hour < 17)
  // 碎片时段 12:00-14:30 → 低能耗加分
  const isSilver = (hour >= 12 && hour < 14.5)
  // 深夜 21:00后 → 仅低能耗规划类
  const isNight = hour >= 21

  if (task.energy === 'high' && isGolden) score += 100
  if (task.energy === 'low' && isSilver) score += 100
  if (isNight && task.energy === 'high') score -= 200

  // 逾期任务优先提醒
  if (task.status === 'overdue') score += 50
  // 有截止日期的加权
  if (task.deadline) {
    const dl = new Date(task.deadline)
    const now = new Date()
    const hoursLeft = (dl - now) / (1000 * 60 * 60)
    if (hoursLeft < 2) score += 30
    if (hoursLeft < 0) score += 20
  }

  return score
}

function loadTasks() {
  const saved = localStorage.getItem('ta_tasks')
  if (saved) {
    try { return JSON.parse(saved) } catch { }
  }
  return []
}

function saveTasks() {
  localStorage.setItem('ta_tasks', JSON.stringify(tasks.value))
  updateStats()
  // 同步到后端
  syncToBackend()
}

// 后端同步（节流防抖）
let syncTimer = null
function syncToBackend() {
  if (!useBackend.value) return
  clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    try {
      await taApi.syncAllToServer({
        tasks: tasks.value,
        focusSessions: focusSessions.value,
        achievements: achievements.value,
        fragments: fragments.value,
        cards: cards.value,
        reports: reportHistory.value,
        settings: {
          partnerType: partner.value.type,
          partnerName: partner.value.name,
          partnerEmoji: partner.value.emoji,
          freeCoins: parseInt(localStorage.getItem('ta_freeCoins') || '0'),
          snoozeCountToday: parseInt(localStorage.getItem('ta_snooze_today') || '0'),
          silenceUntil: localStorage.getItem('ta_silence_until') || null,
          blindBoxDate: localStorage.getItem('ta_blindbox_task') || null,
          partnerMinutes: parseInt(localStorage.getItem('ta_partnerMinutes') || '0'),
          dailyResetDate: localStorage.getItem('ta_daily_reset') || ''
        }
      })
    } catch (err) {
      console.warn('[TaskAlchemist] 后端同步失败:', err.message)
    }
  }, 2000)
}

// 从后端拉取数据
async function loadFromBackend() {
  if (!useBackend.value) return
  try {
    const res = await taApi.syncAllFromServer()
    if (res.success && res.data) {
      const { tasks: srvTasks, focusSessions: srvSessions, achievements: srvAch, fragments: srvFrag, cards: srvCards, reports: srvReports, settings: srvSettings } = res.data
      if (srvTasks && srvTasks.length > 0) {
        tasks.value = srvTasks
        localStorage.setItem('ta_tasks', JSON.stringify(srvTasks))
      }
      if (srvSessions && srvSessions.length > 0) {
        focusSessions.value = srvSessions
        localStorage.setItem('ta_focusSessions', JSON.stringify(srvSessions))
      }
      if (srvAch && srvAch.length > 0) {
        achievements.value = srvAch
        localStorage.setItem('ta_achievements', JSON.stringify(srvAch))
      }
      if (srvFrag) {
        fragments.value = srvFrag
        localStorage.setItem('ta_fragments', JSON.stringify(srvFrag))
      }
      if (srvCards) {
        cards.value = srvCards
        localStorage.setItem('ta_cards', JSON.stringify(srvCards))
      }
      if (srvReports) {
        reportHistory.value = srvReports
        localStorage.setItem('ta_reportHistory', JSON.stringify(srvReports))
      }
      if (srvSettings) {
        partner.value = {
          type: srvSettings.partnerType || 'tsundere',
          name: srvSettings.partnerName || '毒舌傲娇狐',
          emoji: srvSettings.partnerEmoji || '🦊',
          color: partnerTypes[srvSettings.partnerType]?.color || '#f59e0b'
        }
        if (srvSettings.freeCoins !== undefined) localStorage.setItem('ta_freeCoins', String(srvSettings.freeCoins))
        if (srvSettings.partnerMinutes !== undefined) localStorage.setItem('ta_partnerMinutes', String(srvSettings.partnerMinutes))
        if (srvSettings.dailyResetDate) localStorage.setItem('ta_daily_reset', srvSettings.dailyResetDate)
      }
    }
  } catch (err) {
    console.warn('[TaskAlchemist] 后端加载失败，使用本地数据:', err.message)
  }
}

function updateStats() {
  const now = new Date()
  let completed = 0, overdue = 0, aheadCount = 0
  tasks.value.forEach(t => {
    if (t.status === 'completed') completed++
    if (t.status === 'overdue') overdue++
    if (t.status === 'completed' && t.deadline && new Date(t.completedAt) < new Date(t.deadline)) {
      aheadCount++
    }
  })
  todayStats.value = {
    ...todayStats.value,
    total: tasks.value.filter(t => t.status !== 'deleted').length,
    completed,
    overdue,
    aheadCount,
    freeCoins: parseInt(localStorage.getItem('ta_freeCoins') || '0'),
    partnerMinutes: parseInt(localStorage.getItem('ta_partnerMinutes') || '0')
  }
}

function handleSaveTask(taskData) {
  if (editingTask.value) {
    const idx = tasks.value.findIndex(t => t.id === editingTask.value.id)
    if (idx >= 0) {
      tasks.value[idx] = { ...tasks.value[idx], ...taskData, updatedAt: new Date().toISOString() }
    }
    editingTask.value = null
  } else {
    tasks.value.push({
      id: 'ta_' + Date.now(),
      ...taskData,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      penanceTask: null
    })
  }
  showTaskForm.value = false
  saveTasks()
  // 检查盲盒
  checkBlindBox(taskData)
}

function openEditTask(task) {
  editingTask.value = task
  showTaskForm.value = true
}

function handleDeleteTask(task) {
  tasks.value = tasks.value.filter(t => t.id !== task.id)
  saveTasks()
}

function handleCompleteTask(task) {
  const idx = tasks.value.findIndex(t => t.id === task.id)
  if (idx < 0) return

  const t = tasks.value[idx]

  // 检查是否有未完成的赎罪任务
  if (t.penanceTask && t.penanceTask.status === 'pending') {
    penanceTask.value = t
    showPenance.value = true
    return
  }

  // 计算自由币奖励
  let coinReward = 0
  if (t.deadline) {
    const dl = new Date(t.deadline)
    const now = new Date()
    const hoursAhead = (dl - now) / (1000 * 60 * 60)
    if (hoursAhead > 0) {
      // 阶梯奖励：越早完成奖励越多
      if (hoursAhead > 48) coinReward = 50
      else if (hoursAhead > 24) coinReward = 30
      else if (hoursAhead > 12) coinReward = 20
      else if (hoursAhead > 2) coinReward = 10
      else coinReward = 5
    }
  } else {
    coinReward = t.energy === 'high' ? 15 : 5
  }

  t.status = 'completed'
  t.completedAt = new Date().toISOString()
  tasks.value[idx] = t

  // 自由币到账
  addFreeCoins(coinReward)
  saveTasks()
  checkAchievements()

  // 金币爆裂动效
  if (coinReward > 0) {
    coinBurstRef.value?.burst(coinReward)
  }

  // 伙伴反馈
  if (coinReward >= 20) {
    partnerChatRef.value?.addMessage('partner', getPartnerLine('complete'))
    partnerNotification.value = true
  }

  // 顺手牵羊推荐：完成后推荐低能耗任务
  if (t.energy === 'high') {
    const lowTask = tasks.value.find(lt => lt.status === 'active' && lt.energy === 'low')
    if (lowTask) {
      setTimeout(() => {
        partnerChatRef.value?.addMessage('partner', `趁热打铁！要不要顺手把「${lowTask.title}」也做了？只需${lowTask.duration}分钟~`)
        partnerNotification.value = true
      }, 1500)
    }
  }
}

function handleDelayTask(task) {
  const idx = tasks.value.findIndex(t => t.id === task.id)
  if (idx < 0) return

  // 触发时间税：超时 → 生成赎罪子任务
  if (task.deadline && new Date() > new Date(task.deadline)) {
    const penanceTasks = [
      '原地高抬腿 20 次',
      '给至少 3 位同事/好友发送一句鼓励的话',
      '整理手机相册删除 50 张截图',
      '冥想 5 分钟',
      '做 10 个俯卧撑',
      '整理桌面/工作区',
      '喝一杯水并记录',
      '写下今天最感恩的 3 件事'
    ]
    const randomPenance = penanceTasks[Math.floor(Math.random() * penanceTasks.length)]
    tasks.value[idx].status = 'overdue'
    tasks.value[idx].penanceTask = {
      id: 'penance_' + Date.now(),
      title: randomPenance,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    saveTasks()
    partnerChatRef.value?.addMessage('partner', getPartnerLine('overdue'))
    partnerNotification.value = true
    return
  }

  // 正常延期
  const newDate = prompt('延期到什么时候？(YYYY-MM-DD)', task.deadline?.slice(0, 10) || '')
  if (newDate) {
    tasks.value[idx].deadline = newDate
    saveTasks()
  }
}

function addFreeCoins(amount) {
  const current = parseInt(localStorage.getItem('ta_freeCoins') || '0')
  const newAmount = current + amount
  localStorage.setItem('ta_freeCoins', String(newAmount))
  todayStats.value.freeCoins = newAmount
}

// ==================== 心流专注 ====================
const showFocusTimer = ref(false)
const activeFocusSession = ref(null)
const focusSessions = ref(loadFocusSessions())

function loadFocusSessions() {
  const saved = localStorage.getItem('ta_focusSessions')
  if (saved) {
    try { return JSON.parse(saved) } catch { }
  }
  return []
}

function saveFocusSessions() {
  localStorage.setItem('ta_focusSessions', JSON.stringify(focusSessions.value))
}

function startFocus(task) {
  activeFocusSession.value = {
    taskId: task.id,
    taskTitle: task.title,
    energy: task.energy,
    duration: task.duration || 25,
    startTime: new Date().toISOString(),
    status: 'running'
  }
  showFocusTimer.value = true
}

function startFocusFromWorkshop(taskId) {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) startFocus(task)
}

function stopFocus() {
  showFocusTimer.value = false
  activeFocusSession.value = null
}

function handleFocusComplete(actualMinutes) {
  const session = { ...activeFocusSession.value }
  session.actualMinutes = actualMinutes
  session.completedAt = new Date().toISOString()
  session.status = 'completed'

  focusSessions.value.unshift(session)
  saveFocusSessions()

  // 高效红利：实际耗时低于预估
  const estimated = session.duration || 25
  if (actualMinutes < estimated * 0.8) {
    const bonus = Math.floor((estimated - actualMinutes) * 2)
    addFreeCoins(bonus)
    coinBurstRef.value?.burst(bonus, '高效红利')
  }

  // 更新伙伴陪伴时长
  const minutes = parseInt(localStorage.getItem('ta_partnerMinutes') || '0')
  localStorage.setItem('ta_partnerMinutes', String(minutes + actualMinutes))
  todayStats.value.partnerMinutes = minutes + actualMinutes

  showFocusTimer.value = false
  activeFocusSession.value = null
}

function handleFocusCancel() {
  showFocusTimer.value = false
  activeFocusSession.value = null
}

function completeFocus() {
  // 从心流工坊页完成
}

// ==================== 赎罪系统 ====================
const showPenance = ref(false)
const penanceTask = ref(null)

function handlePenanceComplete() {
  if (penanceTask.value) {
    const idx = tasks.value.findIndex(t => t.id === penanceTask.value.id)
    if (idx >= 0) {
      tasks.value[idx].penanceTask.status = 'completed'
      tasks.value[idx].status = 'active'
    }
    penanceTask.value = null
    showPenance.value = false
    saveTasks()
  }
}

// ==================== 博物志 ====================
const achievements = ref(loadAchievements())
const fragments = ref(loadFragments())
const cards = ref(loadCards())

function loadAchievements() {
  const saved = localStorage.getItem('ta_achievements')
  if (saved) {
    try { return JSON.parse(saved) } catch { }
  }
  return initAchievements()
}

function initAchievements() {
  return [
    { id: 'early_bird', name: '早起鸟儿', desc: '连续7天在8:00前完成第一个任务', icon: '🌅', unlocked: false, progress: 0, target: 7 },
    { id: 'decathlon', name: '十项全能', desc: '单日完成10个任务', icon: '🏆', unlocked: false, progress: 0, target: 10 },
    { id: 'first_penance', name: '赎罪之路', desc: '首次使用"时间税"赎罪', icon: '⚖️', unlocked: false, progress: 0, target: 1 },
    { id: 'time_master', name: '时间大师', desc: '累计提前50小时完成任务', icon: '⏰', unlocked: false, progress: 0, target: 50 },
    { id: 'focus_novice', name: '专注新手', desc: '完成10次心流专注', icon: '🧘', unlocked: false, progress: 0, target: 10 },
    { id: 'clean_master', name: '清理大师', desc: '单日完成5个低能耗任务', icon: '🧹', unlocked: false, progress: 0, target: 5 },
    { id: 'dragon_slayer', name: '屠龙勇士', desc: '完成10个高能耗任务', icon: '⚔️', unlocked: false, progress: 0, target: 10 },
    { id: 'collector', name: '碎片收集者', desc: '集齐任意3块记忆碎片', icon: '🧩', unlocked: false, progress: 0, target: 3 },
    { id: 'quarter_master', name: '季度大师', desc: '季度内完成100个任务', icon: '👑', unlocked: false, progress: 0, target: 100, isLegendary: true, fragments: 5 }
  ]
}

function loadFragments() {
  const saved = localStorage.getItem('ta_fragments')
  if (saved) {
    try { return JSON.parse(saved) } catch { }
  }
  return []
}

function loadCards() {
  const saved = localStorage.getItem('ta_cards')
  if (saved) {
    try { return JSON.parse(saved) } catch { }
  }
  return []
}

function checkAchievements() {
  const completed = tasks.value.filter(t => t.status === 'completed').length
  const highCompleted = tasks.value.filter(t => t.status === 'completed' && t.energy === 'high').length
  const lowCompletedToday = tasks.value.filter(t => {
    return t.status === 'completed' && t.energy === 'low' &&
      new Date(t.completedAt).toDateString() === new Date().toDateString()
  }).length
  const penanceDone = tasks.value.some(t => t.penanceTask?.status === 'completed')
  const focusCount = focusSessions.value.filter(s => s.status === 'completed').length

  const updates = {}
  updates['decathlon'] = Math.min(completed, 10)
  updates['dragon_slayer'] = Math.min(highCompleted, 10)
  updates['clean_master'] = Math.min(lowCompletedToday, 5)
  updates['first_penance'] = penanceDone ? 1 : 0
  updates['focus_novice'] = Math.min(focusCount, 10)

  // 检查解锁
  let changed = false
  achievements.value.forEach(a => {
    if (updates[a.id] !== undefined && updates[a.id] >= a.target && !a.unlocked) {
      a.unlocked = true
      a.unlockedAt = new Date().toISOString()
      changed = true
      // 掉落碎片
      if (Math.random() < 0.5) {
        dropFragment(a.id)
      }
    }
    if (updates[a.id] !== undefined) {
      a.progress = updates[a.id]
    }
  })

  if (changed) {
    saveAchievements()
  }
}

function dropFragment(achievementId) {
  const fragment = {
    id: 'frag_' + Date.now(),
    achievementId,
    name: '记忆碎片',
    icon: '✨',
    createdAt: new Date().toISOString()
  }
  fragments.value.push(fragment)
  localStorage.setItem('ta_fragments', JSON.stringify(fragments.value))

  // 检查传奇成就碎片集齐
  const legendary = achievements.value.find(a => a.isLegendary && a.id === achievementId)
  if (legendary) {
    const count = fragments.value.filter(f => f.achievementId === achievementId).length
    if (count >= legendary.fragments) {
      // 合成
      cards.value.push({
        id: 'card_' + Date.now(),
        achievementId,
        name: legendary.name,
        icon: legendary.icon,
        createdAt: new Date().toISOString()
      })
      localStorage.setItem('ta_cards', JSON.stringify(cards.value))
      // 双倍自由币卡
      addFreeCoins(100)
      coinBurstRef.value?.burst(100, '传奇合成')
    }
  }
}

function saveAchievements() {
  localStorage.setItem('ta_achievements', JSON.stringify(achievements.value))
}

// ==================== 日报 ====================
const reportHistory = ref(loadReportHistory())
const weeklyHeatmap = ref(calcWeeklyHeatmap())

function loadReportHistory() {
  const saved = localStorage.getItem('ta_reportHistory')
  if (saved) {
    try { return JSON.parse(saved) } catch { }
  }
  return []
}

function calcWeeklyHeatmap() {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  const now = new Date()
  const data = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayTasks = tasks.value.filter(t => {
      return t.status === 'completed' && t.completedAt?.slice(0, 10) === dateStr
    })
    data.push({
      date: dateStr,
      day: days[d.getDay()],
      count: dayTasks.length,
      level: Math.min(dayTasks.length, 4)
    })
  }
  return data
}

function generateDailyReport() {
  const today = new Date().toISOString().slice(0, 10)
  const existing = reportHistory.value.find(r => r.date === today)
  if (existing) return

  const report = {
    date: today,
    total: todayStats.value.total,
    completed: todayStats.value.completed,
    aheadCount: todayStats.value.aheadCount,
    overdue: todayStats.value.overdue,
    partnerMinutes: todayStats.value.partnerMinutes,
    freeCoins: todayStats.value.freeCoins,
    summary: getPartnerLine('proud', todayStats.value.completed)
  }
  reportHistory.value.unshift(report)
  if (reportHistory.value.length > 30) reportHistory.value.pop()
  localStorage.setItem('ta_reportHistory', JSON.stringify(reportHistory.value))
  weeklyHeatmap.value = calcWeeklyHeatmap()
}

// ==================== 盲盒系统 ====================
function calcBlindBoxVisible() {
  const today = new Date().toISOString().slice(0, 10)
  const shown = localStorage.getItem('ta_blindbox_shown')
  return shown !== today
}

function dismissBlindBox() {
  showBlindBox.value = false
  const today = new Date().toISOString().slice(0, 10)
  localStorage.setItem('ta_blindbox_shown', today)
}

function checkBlindBox(taskData) {
  const today = new Date().toISOString().slice(0, 10)
  const blindTask = localStorage.getItem('ta_blindbox_task')
  if (blindTask) {
    try {
      const bt = JSON.parse(blindTask)
      if (bt.date === today && taskData.title?.toLowerCase().includes(bt.keyword.toLowerCase())) {
        addFreeCoins(30)
        coinBurstRef.value?.burst(30, '盲盒爆破·3倍奖励')
        dismissBlindBox()
        setTimeout(() => {
          partnerChatRef.value?.addMessage('partner', '天哪！你居然完成了今天的盲盒任务！3倍自由币已到账！🎉')
          partnerNotification.value = true
        }, 1000)
      }
    } catch { }
  }
}

// ==================== 生命周期 ====================
const coinBurstRef = ref(null)

function switchTab(key) {
  activeTab.value = key
}

function goBack() {
  router.push('/lifeServices')
}

// 每日盲盒生成
function generateDailyBlindBox() {
  const today = new Date().toISOString().slice(0, 10)
  const saved = localStorage.getItem('ta_blindbox_task')
  if (saved) {
    try {
      const bt = JSON.parse(saved)
      if (bt.date === today) return
    } catch { }
  }
  const keywords = ['喝水', '阅读', '运动', '冥想', '整理', '散步', '拉伸', '写日记', '深呼吸', '微笑']
  const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)]
  const blindTask = { date: today, keyword: randomKeyword }
  localStorage.setItem('ta_blindbox_task', JSON.stringify(blindTask))
}

// 重置每日计数
function resetDailyCounters() {
  const today = new Date().toISOString().slice(0, 10)
  const lastReset = localStorage.getItem('ta_daily_reset')
  if (lastReset !== today) {
    localStorage.setItem('ta_snooze_today', '0')
    localStorage.setItem('ta_daily_reset', today)
    localStorage.setItem('ta_blindbox_shown', '')
    showBlindBox.value = true
    generateDailyBlindBox()
  }
}

// 检查逾期任务
function checkOverdueTasks() {
  const now = new Date()
  let changed = false
  tasks.value.forEach((t, i) => {
    if (t.status === 'active' && t.deadline && new Date(t.deadline) < now) {
      tasks.value[i].status = 'overdue'
      // 自动生成赎罪任务
      if (!tasks.value[i].penanceTask) {
        const penanceTasks = [
          '原地高抬腿 20 次',
          '给至少 3 位同事/好友发送一句鼓励的话',
          '整理手机相册删除 50 张截图',
          '冥想 5 分钟',
          '做 10 个俯卧撑',
          '整理桌面/工作区',
          '喝一杯水并记录',
          '写下今天最感恩的 3 件事'
        ]
        tasks.value[i].penanceTask = {
          id: 'penance_' + Date.now(),
          title: penanceTasks[Math.floor(Math.random() * penanceTasks.length)],
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      }
      changed = true
    }
  })
  if (changed) saveTasks()
}

onMounted(async () => {
  resetDailyCounters()

  // 盲盒提示5秒后自动消失
  if (showBlindBox.value) {
    setTimeout(() => {
      showBlindBox.value = false
    }, 5000)
  }

  // 从后端加载数据（已登录时）
  await loadFromBackend()

  checkOverdueTasks()
  updateStats()

  // 每小时更新
  hourTimer = setInterval(() => {
    currentHour.value = new Date().getHours()
    checkOverdueTasks()
  }, 60000)

  // 晚间22:00生成日报
  const now = new Date()
  const reportTime = new Date(now)
  reportTime.setHours(22, 0, 0, 0)
  if (now > reportTime) {
    reportTime.setDate(reportTime.getDate() + 1)
  }
  const msUntilReport = reportTime - now
  setTimeout(() => {
    generateDailyReport()
    setInterval(generateDailyReport, 24 * 60 * 60 * 1000)
  }, msUntilReport)

  // 伙伴早间问候
  if (currentHour.value >= 6 && currentHour.value < 10) {
    setTimeout(() => {
      partnerChatRef.value?.addMessage('partner', getPartnerLine('morning'))
      partnerNotification.value = true
    }, 2000)
  }
})

onUnmounted(() => {
  if (hourTimer) clearInterval(hourTimer)
})
</script>

<style lang="scss" scoped src="./index.scss"></style>

<style lang="scss">
html.dark-mode {
  .ta-page { background: transparent; }
  .back-btn {
    color: #94a3b8;
    &:hover { color: #f0c060; background: #252540; }
  }
  .page-title {
    background: linear-gradient(135deg, #f0c060, #f5d080, #f0c060);
    -webkit-background-clip: text;
    background-clip: text;
  }
  .page-desc { color: #94a3b8; }
  .ta-tabs { background: #252540; }
  .ta-tab {
    color: #94a3b8;
    &:hover { color: #e2dee9; }
    &.active {
      background: #2d2d4a;
      color: #f0c060;
    }
  }
  .tab-badge { background: #f0c060; color: #1e1e2e; }
  .blind-box-toast {
    background: #252540;
    border-color: #f0c060;
    color: #e2dee9;
  }
}
</style>

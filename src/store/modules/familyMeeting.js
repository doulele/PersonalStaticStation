/**
 * 家庭会议 数据状态管理
 * --------------------------------------------------------------
 * 🔒 数据隔离机制（v2.0）：
 *   1. 路由层面：requiresAuth = true，未登录用户无法访问
 *   2. 身份绑定：currentUserId 自动与站点 auth.user.userId 绑定，不可手动切换
 *   3. 可见性过滤：visibleMeetings getter 基于 rootState.auth.user.userId 过滤
 *   4. 加密会议：需输入正确密码解锁，state.unlockedMeetings 记录已解锁的会议
 *   5. 后端隔离：所有 API 请求携带 auth_token，后端按用户隔离数据
 *   6. 本地缓存：localStorage key 不再使用固定 key（前端仅做缓存，后端为主存储）
 *
 * 数据模型（对应需求文档第 8 节）：
 *   families      : { id, name, adminId }
 *   members(users): { id, name, role: 'admin' | 'member' }   // id 必须与 auth.user.userId 一致（管理员）
 *   meetings      : { id, familyId, title, date, status, participants, visibility, encrypted, encryptPass, agendaLocked }
 *   agenda_items  : { id, meetingId, authorId, title, category, desc, priority, resonance:[uid], emotionLevel, createdAt }
 *   meeting_records:{ id, meetingId, seq, timestamp, speakerId, content, autoTags, manualTags, createdAt }
 *   patches       : { id, targetType, targetId, meetingId, content, patchType, authorId, createdAt }
 *   tasks         : { id, recordId, meetingId, title, assignee, dueDate, status, createdAt }
 *   emotionLogs   : { id, userId, meetingId, level, note, createdAt }
 */
import * as fmApi from '@/api/familyMeeting'

const STORAGE_KEY = 'fm_state_v1'

// ---- ID / 时间工具 ----
function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

function nowISO() {
  return new Date().toISOString()
}

// ---- 本地缓存 ----
function cacheSet(state) {
  try {
    const snapshot = {
      family: state.family,
      members: state.members,
      currentUserId: state.currentUserId,
      meetings: state.meetings,
      agendaItems: state.agendaItems,
      records: state.records,
      patches: state.patches,
      tasks: state.tasks,
      emotionLogs: state.emotionLogs,
      unlockedMeetings: state.unlockedMeetings,
      settings: state.settings
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch (e) {
    console.warn('[familyMeeting] 本地缓存写入失败:', e)
  }
}

function cacheGet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// ---- 后台同步（即时同步 + 失败重试队列）----
let _syncPending = false
let _retryTimer = null
let _retryDelay = 2000        // 初始重试间隔 2s
const MAX_RETRY_DELAY = 60000 // 最大重试间隔 60s

function getSnapshot(state) {
  return {
    family: state.family,
    members: state.members,
    currentUserId: state.currentUserId,
    meetings: state.meetings,
    agendaItems: state.agendaItems,
    records: state.records,
    patches: state.patches,
    tasks: state.tasks,
    emotionLogs: state.emotionLogs,
    unlockedMeetings: state.unlockedMeetings,
    settings: state.settings
  }
}

/**
 * 立即同步到后端（带自动重试）
 * state 参数是 Vuex state 对象的引用，每次重试会重新读取最新数据
 */
function scheduleSync(state) {
  // 1. 先写本地缓存（瞬时，保证刷新不丢）
  cacheSet(state)

  // 2. 标记同步中
  state._syncStatus = 'syncing'

  // 3. 清除之前的重试定时器（新的变更到来，以最新数据为准）
  if (_retryTimer) { clearTimeout(_retryTimer); _retryTimer = null }
  _retryDelay = 2000

  // 4. 如果已有同步在进行中，只标记 pending，等它完成后自动重试
  if (_syncPending) {
    state._hasPendingSync = true
    return
  }

  doSync(state)
}

async function doSync(state) {
  _syncPending = true
  state._hasPendingSync = false

  try {
    const snapshot = getSnapshot(state)
    await fmApi.saveState(snapshot)
    // 同步成功
    state._syncStatus = 'saved'
    _retryDelay = 2000 // 重置重试间隔
    _syncPending = false

    // 如果同步期间有新的变更，立即再次同步
    if (state._hasPendingSync) {
      doSync(state)
    }
  } catch (e) {
    console.warn(`[familyMeeting] 同步失败 (${_retryDelay / 1000}s 后重试):`, e.message)
    state._syncStatus = 'error'
    _syncPending = false

    // 递增重试延迟
    _retryTimer = setTimeout(() => {
      _retryTimer = null
      _retryDelay = Math.min(_retryDelay * 2, MAX_RETRY_DELAY)
      doSync(state)
    }, _retryDelay)
  }
}

// ---- 初始状态加载 ----
let _initPromise = null

async function loadInitialState() {
  if (_initPromise) return _initPromise

  _initPromise = (async () => {
    // 1. 尝试从后端加载
    try {
      const res = await fmApi.fetchState()
      if (res.success && res.data) {
        console.log('[familyMeeting] 从后端加载状态成功')
        cacheSet(res.data)
        return res.data
      }
    } catch (e) {
      console.warn('[familyMeeting] 从后端加载失败, 回退到本地缓存:', e.message)
    }

    // 2. 回退到 localStorage
    const cached = cacheGet()
    if (cached) {
      console.log('[familyMeeting] 使用本地缓存')
      // 后台尝试上传本地数据到后端
      try {
        await fmApi.saveState(cached)
        console.log('[familyMeeting] 本地缓存已同步到后端')
      } catch (e) {
        console.warn('[familyMeeting] 本地缓存上传失败:', e.message)
      }
    }
    return cached
  })()

  return _initPromise
}

// 议事排序：共鸣数降序 → 优先级降序 → 创建时间早优先
function sortAgenda(a, b) {
  const aRes = Array.isArray(a.resonance) ? a.resonance.length : 0
  const bRes = Array.isArray(b.resonance) ? b.resonance.length : 0
  if (bRes !== aRes) return bRes - aRes
  if (b.priority !== a.priority) return b.priority - a.priority
  return new Date(a.createdAt) - new Date(b.createdAt)
}

export default {
  namespaced: true,

  state: () => {
    // 先尝试同步读取缓存（用于 Vuex 初始化）
    const cached = cacheGet()
    return {
      family: cached?.family || null,
      members: cached?.members || [],
      currentUserId: cached?.currentUserId || null,
      meetings: cached?.meetings || [],
      agendaItems: cached?.agendaItems || [],
      records: cached?.records || [],
      patches: cached?.patches || [],
      tasks: cached?.tasks || [],
      emotionLogs: cached?.emotionLogs || [],
      unlockedMeetings: cached?.unlockedMeetings || [],  // 🔒 已解锁的加密会议 ID 列表
      settings: cached?.settings || {
        autoDeleteAudio: true,
        hotwords: '决定,结论,先搁置,行动项,待定',
        transcribeMode: 'mock',
        backendUrl: ''
      },
      _syncStatus: 'idle',    // idle | syncing | saved | error
      _hasPendingSync: false
    }
  },

  getters: {
    /** 🔒 当前站点登录用户 ID（来自 auth 模块） */
    authUserId: (state, getters, rootState) => rootState.auth?.user?.userId || null,

    /** 🔒 当前站点登录用户的家庭成员身份 */
    currentUser: (state, getters) => {
      const authUid = getters.authUserId
      if (!authUid) return null
      return state.members.find(m => m.id === authUid) || null
    },
    isAdmin: (state, getters) => {
      const authUid = getters.authUserId
      if (!authUid) return false
      const u = state.members.find(m => m.id === authUid)
      return u?.role === 'admin'
    },
    hasFamily: (state) => !!state.family,
    memberById: (state) => (id) => state.members.find(m => m.id === id) || null,
    memberName: (state) => (id) => state.members.find(m => m.id === id)?.name || '未知成员',

    /**
     * 🔒 当前登录用户可见的会议列表（数据隔离核心）
     *   - 未登录 → 返回空
     *   - 非参与者 → 不可见
     *   - 加密会议 + 未解锁 → 不可见（需先输入密码）
     */
    visibleMeetings: (state, getters) => {
      const uid = getters.authUserId
      if (!uid) return []
      return state.meetings.filter(m => {
        // 非参与者 → 完全不可见
        if (!m.participants.includes(uid)) return false
        // 加密会议 → 需要已解锁
        if (m.encrypted && !state.unlockedMeetings.includes(m.id)) return false
        return true
      })
    },

    meetingById: (state) => (id) => state.meetings.find(m => m.id === id) || null,
    agendaForMeeting: (state) => (meetingId) =>
      state.agendaItems.filter(a => a.meetingId === meetingId).sort(sortAgenda),
    recordsForMeeting: (state) => (meetingId) =>
      state.records.filter(r => r.meetingId === meetingId).sort((a, b) => a.seq - b.seq),
    tasksForMeeting: (state) => (meetingId) =>
      state.tasks.filter(t => t.meetingId === meetingId),
    patchesForTarget: (state) => (targetType, targetId) =>
      state.patches
        .filter(p => p.targetType === targetType && p.targetId === targetId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    emotionForMeeting: (state) => (meetingId) =>
      state.emotionLogs.filter(e => e.meetingId === meetingId),
    emotionByUser: (state) => (userId) =>
      state.emotionLogs.filter(e => e.userId === userId),

    /** 同步状态：idle | syncing | saved | error */
    syncStatus: (state) => state._syncStatus
  },

  mutations: {
    _sync(state) { scheduleSync(state) },

    SET_STATE(state, remoteState) {
      Object.assign(state, remoteState)
      state._syncStatus = 'saved'
    },

    SET_FAMILY(state, family) {
      state.family = family
      scheduleSync(state)
    },
    ADD_MEMBER(state, member) {
      state.members.push(member)
      scheduleSync(state)
    },
    REMOVE_MEMBER(state, id) {
      state.members = state.members.filter(m => m.id !== id)
      state.meetings.forEach(m => {
        m.participants = m.participants.filter(p => p !== id)
      })
      scheduleSync(state)
    },
    SET_CURRENT_USER(state, id) {
      state.currentUserId = id
      scheduleSync(state)
    },

    ADD_MEETING(state, meeting) {
      state.meetings.push(meeting)
      scheduleSync(state)
    },
    UPDATE_MEETING(state, { id, patch }) {
      const m = state.meetings.find(x => x.id === id)
      if (m) Object.assign(m, patch)
      scheduleSync(state)
    },
    REMOVE_MEETING(state, id) {
      state.meetings = state.meetings.filter(m => m.id !== id)
      state.agendaItems = state.agendaItems.filter(a => a.meetingId !== id)
      state.records = state.records.filter(r => r.meetingId !== id)
      state.tasks = state.tasks.filter(t => t.meetingId !== id)
      state.patches = state.patches.filter(p => p.meetingId !== id)
      state.emotionLogs = state.emotionLogs.filter(e => e.meetingId !== id)
      scheduleSync(state)
    },

    ADD_AGENDA(state, item) {
      state.agendaItems.push(item)
      scheduleSync(state)
    },
    UPDATE_AGENDA(state, { id, patch }) {
      const a = state.agendaItems.find(x => x.id === id)
      if (a) Object.assign(a, patch)
      scheduleSync(state)
    },
    REMOVE_AGENDA(state, id) {
      state.agendaItems = state.agendaItems.filter(a => a.id !== id)
      state.patches = state.patches.filter(p => !(p.targetType === 'agenda' && p.targetId === id))
      scheduleSync(state)
    },
    TOGGLE_RESONANCE(state, { id, userId }) {
      const a = state.agendaItems.find(x => x.id === id)
      if (!a) return
      const i = a.resonance.indexOf(userId)
      if (i >= 0) a.resonance.splice(i, 1)
      else a.resonance.push(userId)
      scheduleSync(state)
    },

    ADD_RECORD(state, record) {
      state.records.push(record)
      scheduleSync(state)
    },
    UPDATE_RECORD(state, { id, patch }) {
      const r = state.records.find(x => x.id === id)
      if (r) Object.assign(r, patch)
      scheduleSync(state)
    },
    REMOVE_RECORD(state, id) {
      state.records = state.records.filter(r => r.id !== id)
      state.tasks = state.tasks.filter(t => t.recordId !== id)
      state.patches = state.patches.filter(p => !(p.targetType === 'record' && p.targetId === id))
      scheduleSync(state)
    },

    ADD_PATCH(state, patch) {
      state.patches.push(patch)
      scheduleSync(state)
    },

    ADD_TASK(state, task) {
      state.tasks.push(task)
      scheduleSync(state)
    },
    UPDATE_TASK(state, { id, patch }) {
      const t = state.tasks.find(x => x.id === id)
      if (t) Object.assign(t, patch)
      scheduleSync(state)
    },
    REMOVE_TASK(state, id) {
      state.tasks = state.tasks.filter(t => t.id !== id)
      scheduleSync(state)
    },

    ADD_EMOTION(state, log) {
      state.emotionLogs.push(log)
      scheduleSync(state)
    },

    UPDATE_SETTINGS(state, patch) {
      Object.assign(state.settings, patch)
      scheduleSync(state)
    },

    /** 🔒 记录已解锁的加密会议（密码验证通过） */
    UNLOCK_MEETING(state, meetingId) {
      if (!state.unlockedMeetings.includes(meetingId)) {
        state.unlockedMeetings.push(meetingId)
      }
      scheduleSync(state)
    },

    RESET_ALL(state) {
      state.family = null
      state.members = []
      state.currentUserId = null
      state.meetings = []
      state.agendaItems = []
      state.records = []
      state.patches = []
      state.tasks = []
      state.emotionLogs = []
      state.unlockedMeetings = []
      scheduleSync(state)
    }
  },

  actions: {
    // ---- 初始化：从后端加载状态 ----
    async initFromBackend({ commit }) {
      try {
        const remote = await loadInitialState()
        if (remote) {
          commit('SET_STATE', remote)
        }
      } catch (e) {
        console.warn('[familyMeeting] 初始化加载失败:', e.message)
      }
    },

    // ===== 家庭空间 / 成员 =====
    /** 🔒 创建家庭空间，管理员自动绑定当前站点登录用户 */
    initFamily({ commit, state, rootState }, { name, adminName }) {
      const authUser = rootState.auth?.user
      if (!authUser) {
        console.warn('[familyMeeting] 未登录，无法创建家庭空间')
        return
      }
      // 管理员 ID 使用站点用户的 userId，确保身份绑定
      const adminId = authUser.userId
      const family = { id: uid('f'), name, adminId }
      commit('SET_FAMILY', family)
      commit('ADD_MEMBER', { id: adminId, name: adminName || authUser.nickname || '管理员', role: 'admin' })
      commit('SET_CURRENT_USER', adminId)
    },
    addMember({ commit }, { name, role }) {
      commit('ADD_MEMBER', { id: uid('u'), name, role: role || 'member' })
    },
    removeMember({ commit }, id) {
      commit('REMOVE_MEMBER', id)
    },
    /** 🔒 用户身份强制绑定站点登录用户，不可随意切换 */
    switchUser({ commit, rootState }, id) {
      const authUserId = rootState.auth?.user?.userId
      if (!authUserId) {
        console.warn('[familyMeeting] 未登录，不允许切换用户')
        return
      }
      // 只允许切换到与站点用户匹配的成员
      if (id !== authUserId) {
        console.warn('[familyMeeting] 不允许切换到非本站点登录用户的身份')
        return
      }
      commit('SET_CURRENT_USER', id)
    },

    // ===== 会议 =====
    /** 🔒 创建会议，参与者必须包含当前登录用户 */
    createMeeting({ commit, state, rootState }, payload) {
      const authUserId = rootState.auth?.user?.userId
      const parts = payload.participants || []
      if (authUserId && !parts.includes(authUserId)) {
        parts.push(authUserId)
      }
      const meeting = {
        id: uid('m'),
        familyId: state.family?.id || null,
        title: payload.title,
        date: payload.date || nowISO().slice(0, 10),
        status: 'pre',
        participants: parts,
        visibility: payload.visibility || 'normal',
        encrypted: !!payload.encrypted,
        encryptPass: payload.encryptPass || '',
        agendaLocked: false,
        createdAt: nowISO()
      }
      commit('ADD_MEETING', meeting)
      return meeting
    },
    updateMeeting({ commit }, { id, patch }) {
      commit('UPDATE_MEETING', { id, patch })
    },
    removeMeeting({ commit }, id) {
      commit('REMOVE_MEETING', id)
    },
    startMeeting({ commit }, id) {
      commit('UPDATE_MEETING', { id, patch: { status: 'active' } })
    },
    closeMeeting({ commit }, id) {
      commit('UPDATE_MEETING', { id, patch: { status: 'closed' } })
    },
    lockAgenda({ commit }, id) {
      commit('UPDATE_MEETING', { id, patch: { agendaLocked: true } })
    },

    // ===== 议题 =====
    addAgenda({ commit, state, rootState }, payload) {
      const authUserId = rootState.auth?.user?.userId
      const item = {
        id: uid('a'),
        meetingId: payload.meetingId,
        authorId: payload.authorId || authUserId || state.currentUserId,
        title: payload.title,
        category: payload.category || '其他',
        desc: payload.desc || '',
        priority: payload.priority || 2,
        resonance: [],
        emotionLevel: payload.emotionLevel ?? null,
        createdAt: nowISO()
      }
      commit('ADD_AGENDA', item)
      return item
    },
    updateAgenda({ commit }, { id, patch }) {
      commit('UPDATE_AGENDA', { id, patch })
    },
    removeAgenda({ commit }, id) {
      commit('REMOVE_AGENDA', id)
    },
    toggleResonance({ commit, rootState }, agendaId) {
      const authUserId = rootState.auth?.user?.userId
      if (!authUserId) return
      commit('TOGGLE_RESONANCE', { id: agendaId, userId: authUserId })
    },

    // ===== 会议记录 / 转写 =====
    addRecord({ commit, state, rootState }, payload) {
      const authUserId = rootState.auth?.user?.userId
      const meetingRecords = state.records.filter(r => r.meetingId === payload.meetingId)
      const record = {
        id: uid('r'),
        meetingId: payload.meetingId,
        seq: meetingRecords.length + 1,
        timestamp: payload.timestamp || new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        speakerId: payload.speakerId || authUserId || state.currentUserId,
        content: payload.content || '',
        autoTags: payload.autoTags || [],
        manualTags: payload.manualTags || [],
        createdAt: nowISO()
      }
      commit('ADD_RECORD', record)
      return record
    },
    updateRecord({ commit }, { id, patch }) {
      commit('UPDATE_RECORD', { id, patch })
    },
    removeRecord({ commit }, id) {
      commit('REMOVE_RECORD', id)
    },

    // ===== 补丁 =====
    addPatch({ commit, state, rootState }, payload) {
      const authUserId = rootState.auth?.user?.userId
      const patch = {
        id: uid('p'),
        targetType: payload.targetType,
        targetId: payload.targetId,
        meetingId: payload.meetingId,
        content: payload.content,
        patchType: payload.patchType || '补充',
        authorId: payload.authorId || authUserId || state.currentUserId,
        createdAt: nowISO()
      }
      commit('ADD_PATCH', patch)
      return patch
    },

    // ===== 决策 / 任务 =====
    addTask({ commit, state }, payload) {
      const task = {
        id: uid('t'),
        recordId: payload.recordId || null,
        meetingId: payload.meetingId,
        title: payload.title,
        assignee: payload.assignee || null,
        dueDate: payload.dueDate || null,
        status: payload.status || 'todo',
        createdAt: nowISO()
      }
      commit('ADD_TASK', task)
      return task
    },
    updateTask({ commit }, { id, patch }) {
      commit('UPDATE_TASK', { id, patch })
    },
    removeTask({ commit }, id) {
      commit('REMOVE_TASK', id)
    },

    // ===== 情绪 =====
    addEmotion({ commit, state, rootState }, payload) {
      const authUserId = rootState.auth?.user?.userId
      const log = {
        id: uid('e'),
        userId: payload.userId || authUserId || state.currentUserId,
        meetingId: payload.meetingId || null,
        level: payload.level,
        note: payload.note || '',
        createdAt: nowISO()
      }
      commit('ADD_EMOTION', log)
      return log
    },

    /** 🔒 解锁加密会议（密码验证通过后调用） */
    unlockMeeting({ commit, state }, { meetingId, password }) {
      const meeting = state.meetings.find(m => m.id === meetingId)
      if (!meeting || !meeting.encrypted) return false
      if (meeting.encryptPass === password) {
        commit('UNLOCK_MEETING', meetingId)
        return true
      }
      return false
    },

    updateSettings({ commit }, patch) {
      commit('UPDATE_SETTINGS', patch)
    },

    resetAll({ commit }) {
      commit('RESET_ALL')
      // 同时清除本地缓存
      try { localStorage.removeItem(STORAGE_KEY) } catch {}
    }
  }
}

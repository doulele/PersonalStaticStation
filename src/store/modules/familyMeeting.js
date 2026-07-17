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

/** 🔒 按用户隔离的 localStorage key */
function getStorageKey() {
  try {
    const token = localStorage.getItem('auth_token')
    if (token) {
      // 取 token 后 8 位做简单标识，避免 key 中包含敏感信息
      return `fm_state_v1_${token.slice(-8)}`
    }
  } catch { /* ignore */ }
  return 'fm_state_v1'
}

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
    localStorage.setItem(getStorageKey(), JSON.stringify(snapshot))
  } catch (e) {
    console.warn('[familyMeeting] 本地缓存写入失败:', e)
  }
}

function cacheGet() {
  try {
    const raw = localStorage.getItem(getStorageKey())
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
  // 🔒 如果没有认证 token（用户已登出），跳过同步并重置状态，
  // 防止登出后因缺少 token 导致请求失败 → 重试 → 无限循环调用接口
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      state._syncStatus = 'idle'
      _syncPending = false
      _retryDelay = 2000
      return
    }
  } catch {
    state._syncStatus = 'idle'
    _syncPending = false
    _retryDelay = 2000
    return
  }

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

/** 按指定 familyId 加载家庭状态 */
let _initPromises = {}
async function loadInitialStateForFamily(familyId) {
  if (_initPromises[familyId]) return _initPromises[familyId]

  _initPromises[familyId] = (async () => {
    try {
      const res = await fmApi.fetchState(familyId)
      if (res.success && res.data) {
        console.log(`[familyMeeting] 加载家庭 ${familyId} 状态成功`)
        cacheSet(res.data)
        return res.data
      }
    } catch (e) {
      console.warn(`[familyMeeting] 加载家庭 ${familyId} 失败:`, e.message)
    }
    return null
  })()
  return _initPromises[familyId]
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
        autoDeleteAudio: false,
        hotwords: '',
        defaultSegmentDuration: 600,
        defaultMode: 'text'
      },
      // ===== 多家庭支持 =====
      myFamilies: [],          // 用户参与的所有家庭列表 [{ familyId, familyName, role, memberCount, meetingCount, joinedAt }]
      familiesLoading: false,  // 家庭列表加载中
      _initialized: false,     // 🔒 防止 initFromBackend 被重复调用覆盖数据
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
     *   - 🔧 v2.1: 同时匹配 authUserId 和 member.id（兼容旧数据）
     */
    visibleMeetings: (state, getters) => {
      // authUserId 可能因初始化时序问题暂时为 null，退回到 currentUserId
      const uid = getters.authUserId || state.currentUserId
      if (!uid) {
        console.log('[familyMeeting] visibleMeetings: uid为空, authUserId=', getters.authUserId, 'currentUserId=', state.currentUserId)
        return []
      }
      // 🔧 构建该用户的所有可能身份 ID（authUserId + 对应成员的 member.id）
      const myMemberIds = new Set([uid])
      const myMember = state.members.find(m => m.id === uid)
      if (myMember) {
        myMemberIds.add(myMember.id)
      }
      // 也尝试通过 members.name 匹配（auth user nickname 作为 fallback）
      const result = state.meetings.filter(m => {
        // 检查参与者列表中是否包含该用户的任一身份 ID
        const isParticipant = m.participants.some(p => myMemberIds.has(p))
        if (!isParticipant) return false
        // 加密会议 → 需要已解锁
        if (m.encrypted && !state.unlockedMeetings.includes(m.id)) return false
        return true
      })
      if (result.length !== state.meetings.length) {
        console.log(`[familyMeeting] visibleMeetings: ${result.length}/${state.meetings.length} 个可见, uid=${uid}, memberIds=[${[...myMemberIds].join(',')}]`)
      }
      return result
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
    syncStatus: (state) => state._syncStatus,

    /** 📋 当前用户的所有家庭（多家庭支持） */
    myFamilies: (state) => state.myFamilies,
    /** 当前用户在活跃家庭中的角色 */
    myRoleInActiveFamily: (state) => {
      return state.myFamilies.find(f => f.familyId === state.family?.id)?.role || null
    }
  },

  mutations: {
    _sync(state) { scheduleSync(state) },

    SET_STATE(state, remoteState) {
      // 保留本地可能更新的 currentUserId / unlockedMeetings，避免远端旧数据覆盖
      const preserve = {
        currentUserId: state.currentUserId,
        unlockedMeetings: state.unlockedMeetings,
        settings: state.settings
      }
      Object.assign(state, remoteState)
      // 恢复保护字段（若远端未传入有效值）
      if (!state.currentUserId) state.currentUserId = preserve.currentUserId
      if (!state.unlockedMeetings || state.unlockedMeetings.length === 0) {
        state.unlockedMeetings = preserve.unlockedMeetings || []
      }
      if (Object.keys(state.settings || {}).length === 0) {
        state.settings = preserve.settings
      }
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
    UPDATE_MEMBER(state, { id, patch }) {
      const m = state.members.find(x => x.id === id)
      if (m) Object.assign(m, patch)
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
      // 清除后台同步重试定时器，防止登出后仍持续调用后端接口
      if (_retryTimer) { clearTimeout(_retryTimer); _retryTimer = null }
      _retryDelay = 2000
      _syncPending = false

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
      state._initialized = false  // 重置后允许重新初始化
      state._syncStatus = 'idle'
      state._hasPendingSync = false
      // 注意：RESET_ALL 不再调用 scheduleSync，
      // 因为登出时 token 已被清除，空数据同步没有任何意义，
      // 且会因请求失败触发新的重试定时器，导致登出后接口被反复调用。
    },

    RESET_ALL_MEMBERS(state) {
      state.members = []
    }
  },

  actions: {
    // ---- 初始化：从后端加载状态 ----
    async initFromBackend({ commit, state, dispatch, rootState }) {
      const authUserId = rootState.auth?.user?.userId

      // 用户切换检测：如果当前用户变了，强制重置并重新初始化
      if (state.currentUserId && authUserId && state.currentUserId !== authUserId) {
        console.warn(`[familyMeeting] 用户切换 ${state.currentUserId} → ${authUserId}，重置状态`)
        commit('RESET_ALL')
        try { localStorage.removeItem(getStorageKey()) } catch {}
        try { localStorage.removeItem('fm_last_active_family') } catch {}
      }

      // 防止重复初始化覆盖用户已创建的数据
      if (state._initialized) {
        console.log('[familyMeeting] 已初始化，跳过重复加载')
        return
      }
      try {
        // 先加载家庭列表
        await dispatch('loadMyFamilies')

        // 选择要加载的家庭：优先上次活跃的，或者第一个
        let targetFamilyId = null
        try {
          targetFamilyId = localStorage.getItem('fm_last_active_family')
        } catch { }
        if (targetFamilyId && !state.myFamilies.find(f => f.familyId === targetFamilyId)) {
          targetFamilyId = null
        }
        if (!targetFamilyId && state.myFamilies.length > 0) {
          targetFamilyId = state.myFamilies[0].familyId
        }

        if (targetFamilyId) {
          const remote = await loadInitialStateForFamily(targetFamilyId)
          if (remote) {
            const authUserId = rootState.auth?.user?.userId
            if (remote.family && authUserId) {
              const isMember = remote.members?.some(m => m.id === authUserId)
              if (!isMember) {
                console.warn(`[familyMeeting] 数据隔离异常：后端返回的家庭 ${remote.family.id} 不包含当前用户 ${authUserId}，拒绝加载`)
                try { localStorage.removeItem(getStorageKey()) } catch {}
                commit('RESET_ALL')
                state._initialized = true
                return
              }
            }
            console.log('[familyMeeting] 从后端加载状态成功，家庭:', remote.family?.name, '成员数:', remote.members?.length)
            commit('SET_STATE', remote)
            if (authUserId) {
              state.currentUserId = authUserId
            }
            try { localStorage.setItem('fm_last_active_family', targetFamilyId) } catch { }
          }
        }
        state._initialized = true
      } catch (e) {
        console.warn('[familyMeeting] 初始化加载失败:', e.message)
        state._initialized = true
      }
    },

    // ===== 家庭空间 / 成员 =====
    /** 🔒 创建家庭空间，管理员自动绑定当前站点登录用户 */
    async initFamily({ commit, state, rootState, dispatch }, { name, adminName }) {
      const authUser = rootState.auth?.user
      if (!authUser) {
        console.warn('[familyMeeting] 未登录，无法创建家庭空间')
        return { success: false, error: '未登录' }
      }
      // 管理员 ID 使用站点用户的 userId，确保身份绑定
      const adminId = authUser.userId
      try {
        // 通过后端 API 创建家庭
        const res = await fmApi.createFamily(name, adminName)
        if (res.success && res.data) {
          // 切换到新创建的家庭
          commit('SET_FAMILY', res.data.family || { id: res.data.family?.id, name, adminId })
          commit('RESET_ALL_MEMBERS')
          state.members = res.data.members || [{ id: adminId, name: adminName || authUser.nickname || '管理员', role: 'admin' }]
          commit('SET_CURRENT_USER', adminId)
          try { localStorage.setItem('fm_last_active_family', res.data.family?.id) } catch { }
          // 刷新家庭列表
          await dispatch('loadMyFamilies')
          return { success: true }
        }
        // 降级：本地创建
        const family = { id: uid('f'), name, adminId }
        commit('SET_FAMILY', family)
        commit('ADD_MEMBER', { id: adminId, name: adminName || authUser.nickname || '管理员', role: 'admin' })
        commit('SET_CURRENT_USER', adminId)
        return { success: true }
      } catch (e) {
        console.warn('[familyMeeting] 后端创建家庭失败，使用本地降级:', e.message)
        const family = { id: uid('f'), name, adminId }
        commit('SET_FAMILY', family)
        commit('ADD_MEMBER', { id: adminId, name: adminName || authUser.nickname || '管理员', role: 'admin' })
        commit('SET_CURRENT_USER', adminId)
        return { success: true }
      }
    },
    addMember({ commit }, { userId, name, role }) {
      commit('ADD_MEMBER', { id: userId || uid('u'), name, role: role || 'member' })
    },
    updateMember({ commit }, { id, patch }) {
      commit('UPDATE_MEMBER', { id, patch })
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
      // 🔧 避免变异外部传入的数组
      const parts = [...(payload.participants || [])]
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
        visibility: payload.visibility || 'all', // 已废弃，仅保留兼容旧数据
        encrypted: !!payload.encrypted,
        encryptPass: payload.encryptPass || '',
        agendaLocked: false,
        createdAt: nowISO()
      }
      console.log('[familyMeeting] 创建会议:', { id: meeting.id, title: meeting.title, participants: meeting.participants, currentUserId: state.currentUserId, authUserId })
      commit('ADD_MEETING', meeting)
      // 🔒 加密会议创建后自动解锁给创建者
      if (meeting.encrypted) {
        commit('UNLOCK_MEETING', meeting.id)
      }
      console.log('[familyMeeting] 当前会议总数:', state.meetings.length)
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
        priority: payload.priority || 3,
        resonance: [],
        emotionLevel: payload.emotionLevel ?? null,
        status: 'pending',
        resolution: '',
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
      try { localStorage.removeItem(getStorageKey()) } catch {}
      try { localStorage.removeItem('fm_last_active_family') } catch {}
    },

    // ===== 🔗 邀请 =====
    /** 生成/刷新邀请码 */
    async generateInviteCode({ commit, state }) {
      try {
        const res = await fmApi.generateInviteCode()
        if (res.success && res.data) {
          // 更新本地 family 对象，确保界面可用
          if (state.family) {
            state.family.inviteCode = res.data.inviteCode
            state.family.inviteCreatedAt = new Date().toISOString()
          }
          scheduleSync(state)
          return { success: true, data: res.data }
        }
        return { success: false, error: res.error || '生成失败' }
      } catch (e) {
        console.error('[familyMeeting] 生成邀请码失败:', e)
        return { success: false, error: e.message }
      }
    },

    /** 通过邀请码加入家庭（返回 { success, data, error, message, needConfirm, existingFamily }） */
    async joinFamily({ commit, state, dispatch }, { inviteCode, userName, deleteExisting = false }) {
      try {
        const res = await fmApi.joinFamily(inviteCode, userName, deleteExisting)
        if (res.success && res.data) {
          if (deleteExisting) {
            commit('RESET_ALL')
          }
          commit('SET_FAMILY', res.data.family)
          if (res.data.members) {
            state.members = res.data.members
          }
          // 刷新家庭列表
          await dispatch('loadMyFamilies')
          try { localStorage.setItem('fm_last_active_family', res.data.family?.id) } catch { }
          if (res.data.existingMember) {
            return { success: true, data: res.data, message: '你已经是该家庭的成员' }
          }
          return { success: true, data: res.data }
        }
        if (res.needConfirm) {
          return {
            success: false,
            needConfirm: true,
            existingFamily: res.existingFamily,
            error: res.error || '你已有家庭空间'
          }
        }
        return { success: false, error: res.error || '加入失败' }
      } catch (e) {
        console.error('[familyMeeting] 加入家庭失败:', e)
        return { success: false, error: e.message }
      }
    },

    /** 🚪 退出家庭空间 */
    async leaveFamily({ commit, dispatch }) {
      try {
        const res = await fmApi.leaveFamily()
        if (res.success) {
          commit('RESET_ALL')
          try { localStorage.removeItem(getStorageKey()) } catch {}
          try { localStorage.removeItem('fm_last_active_family') } catch {}
          await dispatch('loadMyFamilies')
          // 如果还有其他家庭，自动加载第一个
          await dispatch('autoSwitchToFirstFamily')
          return { success: true, message: res.message || '已退出家庭空间' }
        }
        return { success: false, error: res.error || '退出失败' }
      } catch (e) {
        console.error('[familyMeeting] 退出家庭失败:', e)
        return { success: false, error: e.message }
      }
    },

    // ===== 📋 多家庭支持 =====

    /** 加载用户参与的所有家庭 */
    async loadMyFamilies({ state }) {
      try {
        state.familiesLoading = true
        const res = await fmApi.fetchMyFamilies()
        if (res.success && res.data) {
          state.myFamilies = res.data
        }
      } catch (e) {
        console.warn('[familyMeeting] 加载家庭列表失败:', e.message)
      } finally {
        state.familiesLoading = false
      }
    },

    /** 切换到指定家庭 */
    async switchFamily({ state, commit, rootState }, familyId) {
      try {
        // 先保存当前状态
        scheduleSync(state)
        // 加载目标家庭
        const remote = await loadInitialStateForFamily(familyId)
        if (remote && remote.family) {
          const authUserId = rootState.auth?.user?.userId
          const isMember = remote.members?.some(m => m.id === authUserId)
          if (!isMember) {
            console.warn(`[familyMeeting] 切换到家庭 ${familyId} 失败：当前用户不在成员列表`)
            return { success: false, error: '你不是该家庭的成员' }
          }
          commit('SET_STATE', remote)
          if (authUserId) state.currentUserId = authUserId
          try { localStorage.setItem('fm_last_active_family', familyId) } catch { }
          console.log('[familyMeeting] 已切换家庭:', remote.family.name)
          return { success: true }
        }
        return { success: false, error: '家庭数据不存在' }
      } catch (e) {
        console.error('[familyMeeting] 切换家庭失败:', e.message)
        return { success: false, error: e.message }
      }
    },

    /** 自动切换到第一个可用家庭 */
    async autoSwitchToFirstFamily({ state, dispatch }) {
      if (state.myFamilies.length === 0) return
      const first = state.myFamilies[0]
      await dispatch('switchFamily', first.familyId)
    },

    /** 💣 解散家庭空间（仅管理员） */
    async dissolveFamily({ state, commit, dispatch }, familyId) {
      try {
        // 直接传 familyId 给后端，由后端校验权限
        const res = await fmApi.dissolveFamily(familyId)
        if (res.success) {
          // 清空当前状态
          commit('RESET_ALL')
          try { localStorage.removeItem(getStorageKey()) } catch {}
          try { localStorage.removeItem('fm_last_active_family') } catch {}
          // 刷新列表
          await dispatch('loadMyFamilies')
          // 自动切到第一个其他家庭
          await dispatch('autoSwitchToFirstFamily')
          return { success: true, message: res.message }
        }
        return { success: false, error: res.error || '解散失败' }
      } catch (e) {
        console.error('[familyMeeting] 解散家庭失败:', e)
        return { success: false, error: e.message }
      }
    },

    /** 🚪 退出指定家庭空间（支持多家庭） */
    async leaveSpecificFamily({ state, commit, dispatch }, familyId) {
      try {
        const isCurrentFamily = state.family?.id === familyId
        const res = await fmApi.leaveSpecificFamily(familyId)
        if (res.success) {
          if (isCurrentFamily) {
            commit('RESET_ALL')
            try { localStorage.removeItem(getStorageKey()) } catch {}
            try { localStorage.removeItem('fm_last_active_family') } catch {}
          }
          await dispatch('loadMyFamilies')
          if (isCurrentFamily) {
            await dispatch('autoSwitchToFirstFamily')
          }
          return { success: true, message: res.message }
        }
        return { success: false, error: res.error || '退出失败' }
      } catch (e) {
        console.error('[familyMeeting] 退出家庭失败:', e)
        return { success: false, error: e.message }
      }
    },

    /** 🚫 踢出成员（仅管理员） */
    async kickMember({ state, dispatch }, memberId) {
      try {
        const res = await fmApi.kickMember(memberId)
        if (res.success) {
          // 从本地 state 移除该成员
          const idx = state.members.findIndex(m => m.id === memberId)
          if (idx >= 1) state.members.splice(idx, 1)
          state.meetings.forEach(m => {
            m.participants = m.participants.filter(p => p !== memberId)
          })
          scheduleSync(state)
          await dispatch('loadMyFamilies')
          return { success: true, message: res.message }
        }
        return { success: false, error: res.error || '踢出失败' }
      } catch (e) {
        console.error('[familyMeeting] 踢出成员失败:', e)
        return { success: false, error: e.message }
      }
    }
  }
}


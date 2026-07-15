/**
 * 家庭愿望清单 & 树洞 数据状态管理
 * --------------------------------------------------------------
 * 🏠 家庭空间与家庭会议统一共享（family 和 members 从 familyMeeting store 读取）
 * 数据隔离：所有数据按 userId + familyId 隔离，后端自动绑定当前登录用户
 */
import * as api from '@/api/wishTreeHole'

export default {
  namespaced: true,

  state: () => ({
    // 愿望
    wishes: [],
    currentWish: null,

    // 树洞
    moods: [],

    // 通知
    notifications: [],
    unreadCount: 0,

    // 统计
    stats: null,
    ranking: null,

    // UI状态
    activeTab: 'wishes',
    wishFilter: { status: '', category: 'all' },
    loading: false
  }),

  getters: {
    authUserId: (state, getters, rootState) => rootState.auth?.user?.userId || null,
    // 🏠 从共享家庭空间读取
    hasFamily: (state, getters, rootState) => rootState.familyMeeting?.family != null,
    family: (state, getters, rootState) => rootState.familyMeeting?.family || null,
    members: (state, getters, rootState) => rootState.familyMeeting?.members || [],
    isAdmin: (state, getters, rootState) => {
      const fam = rootState.familyMeeting?.family
      const myUserId = rootState.auth?.user?.userId
      return fam?.adminId === myUserId
    },
    // 分类筛选后的愿望
    filteredWishes: state => {
      let list = state.wishes
      if (state.wishFilter.status) {
        list = list.filter(w => w.status === state.wishFilter.status)
      }
      if (state.wishFilter.category && state.wishFilter.category !== 'all') {
        list = list.filter(w => w.category === state.wishFilter.category)
      }
      return list
    },
    // 进行中的愿望
    activeWishes: state => state.wishes.filter(w => w.status === '进行中'),
    // 已完成的愿望
    completedWishes: state => state.wishes.filter(w => w.status === '已完成'),
    // 逾期的愿望
    overdueWishes: state => state.wishes.filter(w => w.status === '逾期'),
    // 归档的愿望
    archivedWishes: state => state.wishes.filter(w => w.archivedAt)
  },

  mutations: {
    SET_WISHES(state, wishes) { state.wishes = wishes },
    ADD_WISH(state, wish) { state.wishes.unshift(wish) },
    UPDATE_WISH(state, { id, data }) {
      const idx = state.wishes.findIndex(w => w.id === id)
      if (idx >= 0) Object.assign(state.wishes[idx], data)
      if (state.currentWish?.id === id) Object.assign(state.currentWish, data)
    },
    REMOVE_WISH(state, id) {
      state.wishes = state.wishes.filter(w => w.id !== id)
      if (state.currentWish?.id === id) state.currentWish = null
    },
    SET_CURRENT_WISH(state, wish) { state.currentWish = wish },
    SET_MOODS(state, moods) { state.moods = moods },
    ADD_MOOD(state, mood) { state.moods.unshift(mood) },
    REMOVE_MOOD(state, id) { state.moods = state.moods.filter(m => m.id !== id) },
    SET_NOTIFICATIONS(state, data) {
      state.notifications = data || []
      state.unreadCount = (data || []).filter(n => !n.isRead).length
    },
    SET_UNREAD_COUNT(state, count) { state.unreadCount = count },
    SET_STATS(state, stats) { state.stats = stats },
    SET_RANKING(state, ranking) { state.ranking = ranking },
    SET_ACTIVE_TAB(state, tab) { state.activeTab = tab },
    SET_WISH_FILTER(state, filter) { state.wishFilter = { ...state.wishFilter, ...filter } },
    SET_LOADING(state, v) { state.loading = v },
    RESET_ALL(state) {
      state.wishes = []
      state.currentWish = null; state.moods = []
      state.notifications = []; state.unreadCount = 0
      state.stats = null; state.ranking = null
    }
  },

  actions: {
    // ==================== 初始化 ====================
    async init({ dispatch, getters }) {
      // 🏠 家庭空间来自共享的 familyMeeting store
      if (!getters.hasFamily) return
      await Promise.all([
        dispatch('loadWishes'),
        dispatch('loadMoods'),
        dispatch('loadNotifications'),
        dispatch('loadStats')
      ])
    },

    // ==================== 愿望 ====================
    async loadWishes({ commit, state }) {
      const res = await api.getWishes(state.wishFilter)
      if (res.success) commit('SET_WISHES', res.data)
    },

    async createWish({ commit }, data) {
      const res = await api.createWish(data)
      if (res.success) {
        commit('ADD_WISH', { id: res.data.id, ...data, status: '进行中', progress: 0, createdAt: res.data.createdAt })
      }
      return res
    },

    async updateWish({ commit }, { id, data }) {
      const res = await api.updateWish(id, data)
      if (res.success) commit('UPDATE_WISH', { id, data })
      return res
    },

    async deleteWish({ commit }, id) {
      const res = await api.deleteWish(id)
      if (res.success) commit('REMOVE_WISH', id)
      return res
    },

    async archiveWish({ commit }, id) {
      const res = await api.archiveWish(id)
      if (res.success) commit('UPDATE_WISH', { id, data: { archivedAt: new Date().toISOString(), status: '已完成' } })
      return res
    },

    async checkinWish({ commit }, { id, note, progress }) {
      const res = await api.checkinWish(id, { note, progress })
      if (res.success) {
        commit('UPDATE_WISH', { id, data: { progress: res.data.progress, status: res.data.status } })
      }
      return res
    },

    async updateSubTasks({ commit }, { id, subTasks }) {
      const res = await api.updateSubTasks(id, subTasks)
      return res
    },

    async delayWish({ commit }, { id, newDate }) {
      const res = await api.delayWish(id, newDate)
      if (res.success) commit('UPDATE_WISH', { id, data: { targetDate: newDate, status: '进行中' } })
      return res
    },

    async loadWishDetail({ commit }, id) {
      const res = await api.getWishDetail(id)
      if (res.success) commit('SET_CURRENT_WISH', res.data)
      return res
    },

    // ==================== 树洞 ====================
    async loadMoods({ commit }) {
      const res = await api.getMoods()
      if (res.success) commit('SET_MOODS', res.data)
    },

    async postMood({ commit }, data) {
      const res = await api.postMood(data)
      if (res.success) commit('ADD_MOOD', res.data)
      return res
    },

    async deleteMood({ commit }, id) {
      const res = await api.deleteMood(id)
      if (res.success) commit('REMOVE_MOOD', id)
      return res
    },

    async convertMoodToWish({ commit }, id) {
      const res = await api.convertMoodToWish(id)
      if (res.success) {
        commit('ADD_WISH', { ...res.data, status: '进行中', progress: 0 })
      }
      return res
    },

    // ==================== 互动 ====================
    async patUser({ commit }, data) {
      return await api.patUser(data)
    },

    // ==================== 通知 ====================
    async loadNotifications({ commit }) {
      const res = await api.getNotifications()
      if (res.success) commit('SET_NOTIFICATIONS', res.data)
      if (res.unreadCount !== undefined) commit('SET_UNREAD_COUNT', res.unreadCount)
    },

    async markRead({ commit, dispatch }, id) {
      await api.markNotificationRead(id)
      dispatch('loadNotifications')
    },

    async markAllRead({ commit, dispatch }) {
      await api.markAllNotificationsRead()
      dispatch('loadNotifications')
    },

    // ==================== 统计 ====================
    async loadStats({ commit }) {
      const [statsRes, rankRes] = await Promise.all([api.getPersonalStats(), api.getFamilyRanking()])
      if (statsRes.success) commit('SET_STATS', statsRes.data)
      if (rankRes.success) commit('SET_RANKING', rankRes.data)
    }
  }
}

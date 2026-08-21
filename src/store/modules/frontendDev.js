/**
 * 前端知识图谱（技能成长平台）状态管理
 * 学习进度数据来自后端，通过 API 同步
 */
import {
  getProgress, learnNode, submitAnswer, submitQuiz, checkin,
  addFavorite, removeFavorite, removeWrong
} from '@/api/knowledgeGraph'

export default {
  namespaced: true,

  state: {
    progress: null, // 用户学习进度（后端返回）
    loading: false
  },

  getters: {
    progress: s => s.progress,
    loading: s => s.loading,
    xp: s => s.progress?.xp || 0,
    levelKey: s => s.progress?.levelKey || 'junior',
    learnedIds: s => s.progress?.learned || [],
    favoriteIds: s => s.progress?.favorites || [],
    wrongIds: s => s.progress?.wrong || [],
    achievementIds: s => (s.progress?.achievements || []).map(a => a.achId),
    checkinStreak: s => s.progress?.checkinStreak || 0,
    checkinDates: s => (s.progress?.checkins || []).map(c => c.date),
    categoryPercent: s => s.progress?.categoryPercent || {},
    isLearned: s => nodeId => (s.progress?.learned || []).includes(nodeId)
  },

  mutations: {
    SET_PROGRESS(state, payload) {
      state.progress = payload
    },
    SET_LOADING(state, payload) {
      state.loading = payload
    }
  },

  actions: {
    /** 加载用户学习进度 */
    async loadProgress({ commit }) {
      commit('SET_LOADING', true)
      try {
        const res = await getProgress()
        if (res.success) commit('SET_PROGRESS', res.data)
        return res
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /** 标记已掌握（点亮节点） */
    async learn({ dispatch }, nodeId) {
      const res = await learnNode(nodeId)
      if (res.success) await dispatch('loadProgress')
      return res
    },

    /** 提交单题答案 */
    async answer({ dispatch }, payload) {
      const res = await submitAnswer(payload)
      if (res.success) await dispatch('loadProgress')
      return res
    },

    /** 随堂测验批量提交 */
    async quiz({ dispatch }, payload) {
      const res = await submitQuiz(payload)
      if (res.success) await dispatch('loadProgress')
      return res
    },

    /** 手动打卡 */
    async checkin({ dispatch }) {
      const res = await checkin()
      if (res.success) await dispatch('loadProgress')
      return res
    },

    /** 切换收藏状态 */
    async toggleFavorite({ dispatch, state }, qid) {
      const isFav = (state.progress?.favorites || []).includes(qid)
      const res = isFav ? await removeFavorite(qid) : await addFavorite(qid)
      if (res.success) await dispatch('loadProgress')
      return res
    },

    /** 移除错题（确认掌握） */
    async removeWrong({ dispatch }, qid) {
      const res = await removeWrong(qid)
      if (res.success) await dispatch('loadProgress')
      return res
    }
  }
}

import { createStore } from 'vuex'

export default createStore({
  state: {
    // 全局加载状态
    loading: false,
    // 用户信息
    userInfo: null,
    // 主题
    theme: 'light'
  },
  getters: {
    isLoading: state => state.loading,
    getUserInfo: state => state.userInfo,
    isDark: state => state.theme === 'dark'
  },
  mutations: {
    SET_LOADING(state, payload) {
      state.loading = payload
    },
    SET_USER_INFO(state, payload) {
      state.userInfo = payload
    },
    SET_THEME(state, payload) {
      state.theme = payload
    }
  },
  actions: {
    setLoading({ commit }, payload) {
      commit('SET_LOADING', payload)
    },
    setUserInfo({ commit }, payload) {
      commit('SET_USER_INFO', payload)
    },
    toggleTheme({ commit, state }) {
      commit('SET_THEME', state.theme === 'light' ? 'dark' : 'light')
    }
  },
  modules: {}
})

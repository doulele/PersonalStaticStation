import { createStore } from 'vuex'
import plan from './modules/plan'
import auth from './modules/auth'

const THEME_MODE_KEY = 'theme_mode'

// 从 localStorage 恢复主题模式，默认为 auto
function loadThemeMode() {
  try {
    const saved = localStorage.getItem(THEME_MODE_KEY)
    if (saved === 'auto' || saved === 'light' || saved === 'dark') return saved
  } catch {}
  return 'auto'
}

// 根据时间和用户模式计算初始 theme
function resolveInitialTheme() {
  const mode = loadThemeMode()
  if (mode === 'light') return 'light'
  if (mode === 'dark') return 'dark'
  // auto: 时间规则
  const hour = new Date().getHours()
  return (hour >= 20 || hour < 7) ? 'dark' : 'light'
}

export default createStore({
  state: {
    // 全局加载状态
    loading: false,
    // 用户信息
    userInfo: null,
    // 主题: 'light' | 'dark'
    theme: resolveInitialTheme(),
    // 主题模式: 'auto' | 'light' | 'dark'  —— 'auto' 跟随时间，其他为手动
    themeMode: loadThemeMode()
  },
  getters: {
    isLoading: state => state.loading,
    getUserInfo: state => state.userInfo,
    isDark: state => state.theme === 'dark',
    isThemeManual: state => state.themeMode !== 'auto'
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
    },
    SET_THEME_MODE(state, payload) {
      state.themeMode = payload
    }
  },
  actions: {
    setLoading({ commit }, payload) {
      commit('SET_LOADING', payload)
    },
    setUserInfo({ commit }, payload) {
      commit('SET_USER_INFO', payload)
    },
    // 点击切换：黑暗 → 白天 → 自动 → 黑暗（循环，持久化）
    toggleTheme({ commit, state, dispatch }) {
      if (state.themeMode === 'dark') {
        // 黑暗 → 白天
        commit('SET_THEME', 'light')
        commit('SET_THEME_MODE', 'light')
      } else if (state.themeMode === 'light') {
        // 白天 → 自动
        commit('SET_THEME_MODE', 'auto')
        const hour = new Date().getHours()
        const timeTheme = (hour >= 20 || hour < 7) ? 'dark' : 'light'
        commit('SET_THEME', timeTheme)
      } else {
        // 自动 → 黑暗
        commit('SET_THEME', 'dark')
        commit('SET_THEME_MODE', 'dark')
      }
      dispatch('_persistThemeMode')
    },
    // 重置为自动模式（跟随时间）
    resetToAuto({ commit, dispatch }) {
      commit('SET_THEME_MODE', 'auto')
      const hour = new Date().getHours()
      const timeTheme = (hour >= 20 || hour < 7) ? 'dark' : 'light'
      commit('SET_THEME', timeTheme)
      dispatch('_persistThemeMode')
    },
    // 持久化 themeMode 到 localStorage
    _persistThemeMode({ state }) {
      try { localStorage.setItem(THEME_MODE_KEY, state.themeMode) } catch {}
    }
  },
  modules: {
    plan,
    auth
  }
})

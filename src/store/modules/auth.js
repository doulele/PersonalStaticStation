/**
 * 用户认证状态管理
 * 管理登录/注册/登出/个人信息
 */
import { loginApi, registerApi, fetchProfileApi } from '@/api/auth'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

// 从 localStorage 恢复认证状态
function loadAuthState() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const userStr = localStorage.getItem(USER_KEY)
    if (token && userStr) {
      return {
        token,
        user: JSON.parse(userStr),
        isAuthenticated: true
      }
    }
  } catch { /* ignore */ }
  return {
    token: null,
    user: null,
    isAuthenticated: false
  }
}

// 保存认证状态到 localStorage
function saveAuthState(token, user) {
  if (token && user) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
}

const initialState = loadAuthState()

export default {
  namespaced: true,

  state: {
    token: initialState.token,
    user: initialState.user,
    isAuthenticated: initialState.isAuthenticated,
    loading: false,
    error: null
  },

  getters: {
    isLoggedIn: state => state.isAuthenticated,
    currentUser: state => state.user,
    authToken: state => state.token,
    isLoading: state => state.loading,
    authError: state => state.error
  },

  mutations: {
    SET_AUTH(state, { token, user }) {
      state.token = token
      state.user = user
      state.isAuthenticated = true
      state.error = null
      saveAuthState(token, user)
    },
    SET_USER(state, user) {
      state.user = user
      saveAuthState(state.token, user)
    },
    CLEAR_AUTH(state) {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      state.error = null
      saveAuthState(null, null)
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    }
  },

  actions: {
    /**
     * 登录
     */
    async login({ commit }, { email, password }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const res = await loginApi(email, password)
        if (res.success) {
          const { token, userId, email: userEmail, nickname, createdAt } = res.data
          const user = { userId, email: userEmail, nickname, createdAt }
          commit('SET_AUTH', { token, user })
          return { success: true }
        }
        commit('SET_ERROR', res.error || '登录失败')
        return { success: false, error: res.error }
      } catch (err) {
        const msg = err.message || '登录失败，请稍后重试'
        commit('SET_ERROR', msg)
        return { success: false, error: msg }
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 注册
     */
    async register({ commit }, { email, password, nickname, inviteCode }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const res = await registerApi(email, password, nickname, inviteCode)
        if (res.success) {
          const { token, userId, email: userEmail, nickname: name, createdAt } = res.data
          const user = { userId, email: userEmail, nickname: name, createdAt }
          commit('SET_AUTH', { token, user })
          return { success: true }
        }
        commit('SET_ERROR', res.error || '注册失败')
        return { success: false, error: res.error }
      } catch (err) {
        const msg = err.message || '注册失败，请稍后重试'
        commit('SET_ERROR', msg)
        return { success: false, error: msg }
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 登出
     */
    logout({ commit }) {
      commit('CLEAR_AUTH')
    },

    /**
     * 刷新用户信息
     */
    async fetchProfile({ commit, state }) {
      if (!state.token) return
      try {
        const res = await fetchProfileApi(state.token)
        if (res.success) {
          commit('SET_USER', res.data)
        }
      } catch { /* ignore */ }
    },

    /**
     * 应用初始化时恢复认证状态（验证 token 是否有效）
     */
    async initAuth({ state, dispatch }) {
      if (state.isAuthenticated && state.token) {
        // 尝试验证 token 是否有效
        await dispatch('fetchProfile')
      }
    }
  }
}

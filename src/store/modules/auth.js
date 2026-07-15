/**
 * 用户认证状态管理
 * 管理登录/注册/登出/个人信息
 */
import { loginApi, registerApi, registerByUsernameApi, fetchProfileApi, updateProfileApi, changePasswordApi } from '@/api/auth'

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
     * 登录（支持邮箱或用户名）
     */
    async login({ commit }, { account, password, isUsername = false }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const res = await loginApi(account, password, isUsername)
        if (res.success) {
          const { token, userId, email, username, nickname, createdAt } = res.data
          const user = { userId, email: email || null, username: username || null, nickname, createdAt }
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
     * 邮箱注册
     */
    async registerEmail({ commit }, { email, password, nickname, inviteCode }) {
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
     * 用户名注册
     */
    async registerUsername({ commit }, { username, password, nickname, securityQuestion, securityAnswer, inviteCode }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const res = await registerByUsernameApi(username, password, nickname, securityQuestion, securityAnswer, inviteCode)
        if (res.success) {
          const { token, userId, username: name, nickname: nick, createdAt } = res.data
          const user = { userId, email: null, username: name, nickname: nick, createdAt }
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
    },

    /**
     * 更新个人资料（昵称）
     */
    async updateProfile({ commit, state }, { nickname }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const res = await updateProfileApi(nickname)
        if (res.success) {
          commit('SET_USER', { ...state.user, nickname: res.data.nickname })
          return { success: true, message: res.message || '更新成功' }
        }
        commit('SET_ERROR', res.error || '更新失败')
        return { success: false, error: res.error }
      } catch (err) {
        const msg = err.message || '更新失败，请稍后重试'
        commit('SET_ERROR', msg)
        return { success: false, error: msg }
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 修改密码
     */
    async changePassword({ commit }, { oldPassword, newPassword }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const res = await changePasswordApi(oldPassword, newPassword)
        if (res.success) {
          return { success: true, message: res.message || '密码修改成功' }
        }
        return { success: false, error: res.error || '修改密码失败' }
      } catch (err) {
        const msg = err.message || '修改密码失败，请稍后重试'
        commit('SET_ERROR', msg)
        return { success: false, error: msg }
      } finally {
        commit('SET_LOADING', false)
      }
    }
  }
}

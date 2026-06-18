import { getAttractionPlan, generatePlan as apiGeneratePlan } from '@/views/home/lifeServices/travelGuide/mock/data.js'

const API_BASE = '/staticTool/api/travel'

export default {
  namespaced: true,

  state: {
    // 当前主景点信息
    currentAttraction: null,
    // 所有子路线景点
    allSpots: [],
    // 已选子路线景点 ID（数组顺序 = 路线顺序）
    selectedSpotIds: [],
    // 所有美食
    allFoods: [],
    // 已选美食 ID
    selectedFoodIds: [],
    // 所有酒店
    allHotels: [],
    // 已选酒店 ID（'custom' 表示用户自定义）
    selectedHotelId: null,
    // 用户自定义酒店名
    customHotelName: '',
    // 生成结果
    planResult: null,
    // 结果页各条目状态: { 'spot_0': 'checked'|'ignored', 'food_1': 'pending', ... }
    resultItemStates: {},
    // 加载状态
    loading: false,
    // ===== AI 推荐 =====
    aiAdvice: '',
    aiTimePlan: '',
    aiSpotNotes: {},
    aiFoodNotes: {},
    aiHotelNote: '',
    aiRecommended: false,
    aiLoading: false,

    // ===== 多景点串联选择 =====
    // 用户从卡片页长按拖拽选中的多个景点
    multiPlanAttractions: []
  },

  getters: {
    // 按顺序获取已选路线景点
    selectedSpots: (state) => {
      const spotMap = {}
      state.allSpots.forEach(s => { spotMap[s.id] = s })
      return state.selectedSpotIds.map(id => spotMap[id]).filter(Boolean)
    },
    // 获取已选美食
    selectedFoods: (state) => {
      const foodMap = {}
      state.allFoods.forEach(f => { foodMap[f.id] = f })
      return state.selectedFoodIds.map(id => foodMap[id]).filter(Boolean)
    },
    // 获取已选酒店
    selectedHotel: (state) => {
      if (state.selectedHotelId === 'custom') return null
      return state.allHotels.find(h => h.id === state.selectedHotelId) || null
    },
    // 可选子景点（不在已选路线中的）
    availableSpots: (state) => {
      const selectedSet = new Set(state.selectedSpotIds)
      return state.allSpots.filter(s => !selectedSet.has(s.id))
    },
    // 已选数量统计
    selectedCounts: (state, getters) => ({
      spots: getters.selectedSpots.length,
      foods: getters.selectedFoods.length,
      hotel: state.selectedHotelId === 'custom'
        ? (state.customHotelName ? 1 : 0)
        : (state.selectedHotelId ? 1 : 0)
    }),
    // 多景点串联是否激活
    isMultiPlan: (state) => state.multiPlanAttractions.length > 0,
    // 多景点数量
    multiPlanCount: (state) => state.multiPlanAttractions.length
  },

  mutations: {
    SET_LOADING(state, payload) {
      state.loading = payload
    },

    INIT_PLAN_DATA(state, { attraction, spots, foods, hotels }) {
      state.currentAttraction = attraction
      state.allSpots = spots
      state.allFoods = foods
      state.allHotels = hotels
      // 默认选中全部路线并按 default_order 排序
      state.selectedSpotIds = [...spots]
        .sort((a, b) => a.default_order - b.default_order)
        .map(s => s.id)
      // 清空之前的选择
      state.selectedFoodIds = []
      state.selectedHotelId = null
      state.customHotelName = ''
      state.planResult = null
    },

    UPDATE_SPOT_ORDER(state, newOrder) {
      state.selectedSpotIds = newOrder
    },

    ADD_SPOT(state, spotId) {
      if (!state.selectedSpotIds.includes(spotId)) {
        state.selectedSpotIds.push(spotId)
      }
    },

    REMOVE_SPOT(state, spotId) {
      state.selectedSpotIds = state.selectedSpotIds.filter(id => id !== spotId)
    },

    REPLACE_SPOT(state, { oldId, newId }) {
      const idx = state.selectedSpotIds.indexOf(oldId)
      if (idx > -1) {
        state.selectedSpotIds.splice(idx, 1, newId)
      }
    },

    TOGGLE_FOOD(state, foodId) {
      const index = state.selectedFoodIds.indexOf(foodId)
      if (index > -1) {
        state.selectedFoodIds.splice(index, 1)
      } else {
        state.selectedFoodIds.push(foodId)
      }
    },

    ADD_FOOD(state, foodId) {
      if (!state.selectedFoodIds.includes(foodId)) {
        state.selectedFoodIds.push(foodId)
      }
    },

    REMOVE_FOOD(state, foodId) {
      state.selectedFoodIds = state.selectedFoodIds.filter(id => id !== foodId)
    },

    UPDATE_FOOD_ORDER(state, newOrder) {
      state.selectedFoodIds = newOrder
    },

    SELECT_HOTEL(state, hotelId) {
      state.selectedHotelId = hotelId
      if (hotelId !== 'custom') {
        state.customHotelName = ''
      }
    },

    SET_CUSTOM_HOTEL_NAME(state, name) {
      state.customHotelName = name
    },

    SET_PLAN_RESULT(state, result) {
      state.planResult = result
    },

    SET_ITEM_STATE(state, { key, status }) {
      state.resultItemStates = { ...state.resultItemStates, [key]: status }
    },

    SET_ITEM_STATES(state, states) {
      state.resultItemStates = { ...states }
    },

    // ===== 多景点串联操作 =====
    TOGGLE_MULTI_ATTRACTION(state, attraction) {
      const idx = state.multiPlanAttractions.findIndex(a => a.id === attraction.id)
      if (idx > -1) {
        state.multiPlanAttractions.splice(idx, 1)
      } else {
        state.multiPlanAttractions.push(attraction)
      }
    },
    REMOVE_MULTI_ATTRACTION(state, attractionId) {
      state.multiPlanAttractions = state.multiPlanAttractions.filter(a => a.id !== attractionId)
    },
    CLEAR_MULTI_ATTRACTIONS(state) {
      state.multiPlanAttractions = []
    },
    REORDER_MULTI_ATTRACTIONS(state, newOrder) {
      state.multiPlanAttractions = newOrder
    },
    SET_MULTI_ATTRACTIONS(state, attractions) {
      state.multiPlanAttractions = attractions
    },

    // ===== AI 推荐 =====
    APPLY_AI_RECOMMEND(state, { spotIds, foodIds, hotelId, spotNotes, foodNotes, hotelNote, advice, timePlan }) {
      state.selectedSpotIds = [...spotIds]
      state.selectedFoodIds = [...foodIds]
      state.selectedHotelId = hotelId || null
      state.customHotelName = ''
      state.aiAdvice = advice || ''
      state.aiTimePlan = timePlan || ''
      state.aiSpotNotes = spotNotes || {}
      state.aiFoodNotes = foodNotes || {}
      state.aiHotelNote = hotelNote || ''
      state.aiRecommended = true
    },

    CLEAR_AI_RECOMMEND(state) {
      state.aiAdvice = ''
      state.aiTimePlan = ''
      state.aiSpotNotes = {}
      state.aiFoodNotes = {}
      state.aiHotelNote = ''
      state.aiRecommended = false
    },

    RESET_PLAN(state) {
      state.currentAttraction = null
      state.allSpots = []
      state.selectedSpotIds = []
      state.allFoods = []
      state.selectedFoodIds = []
      state.allHotels = []
      state.selectedHotelId = null
      state.customHotelName = ''
      state.planResult = null
      state.resultItemStates = {}
      state.loading = false
      state.multiPlanAttractions = []
    }
  },

  actions: {
    /**
     * 获取景点全量规划数据
     */
    async fetchPlan({ commit }, id) {
      commit('SET_LOADING', true)
      try {
        const data = await getAttractionPlan(Number(id))
        commit('INIT_PLAN_DATA', data)
      } catch (err) {
        console.error('获取规划数据失败:', err)
        throw err
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 动态获取规划数据（通过后端高德 API）
     */
    async fetchDynamicPlan({ commit }, { name, lat, lng }) {
      commit('SET_LOADING', true)
      try {
        const res = await fetch(`${API_BASE}/plan-dynamic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, lat, lng })
        })
        const json = await res.json()
        if (!json.success || !json.data) {
          throw new Error('动态规划数据获取失败')
        }
        commit('INIT_PLAN_DATA', json.data)
      } catch (err) {
        console.error('动态规划数据获取失败:', err)
        throw err
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * AI 智能推荐
     */
    async aiRecommend({ commit, state }) {
      commit('SET_LOADING', true)
      try {
        const res = await fetch(`${API_BASE}/ai-recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attraction: state.currentAttraction,
            spots: state.allSpots,
            foods: state.allFoods,
            hotels: state.allHotels
          })
        })
        const json = await res.json()
        if (!json.success || !json.data) {
          throw new Error(json.message || 'AI 推荐失败')
        }
        commit('APPLY_AI_RECOMMEND', json.data)
        return json.data
      } catch (err) {
        console.error('AI 推荐失败:', err)
        throw err
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 生成完整攻略
     */
    async generatePlan({ commit, state }) {
      commit('SET_LOADING', true)
      try {
        const result = await apiGeneratePlan({
          attractionId: state.currentAttraction?.id,
          selectedSpotIds: state.selectedSpotIds,
          selectedFoodIds: state.selectedFoodIds,
          hotelId: state.selectedHotelId === 'custom' ? 0 : state.selectedHotelId,
          customHotelName: state.customHotelName
        })
        commit('SET_PLAN_RESULT', result)
        return result
      } catch (err) {
        console.error('生成攻略失败:', err)
        throw err
      } finally {
        commit('SET_LOADING', false)
      }
    }
  }
}

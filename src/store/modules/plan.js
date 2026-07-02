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
    // ===== 统一时间线（Phase 1 核心） =====
    // 酒店→景点→美食→景点→美食→酒店 的统一有序节点列表
    timelineNodes: [],
    // 当前查看的天数
    currentDay: 1,
    // 加载状态
    loading: false,
    // ===== 推荐模式切换 =====
    // 'basic' = 基础推荐（启发式规则）| 'ai' = DeepSeek 智能推荐
    recommendMode: 'basic',
    // ===== 交通方式 =====
    // 'drive' = 自驾 | 'transit' = 公共交通
    transportMode: 'drive',
    // 潮汐数据 { date, highTides: [{time, height}], lowTides: [{time, height}] }
    tideData: null,
    // 潮汐加载状态
    tideLoading: false,
    // 推荐结果横幅
    recommendAdvice: '',
    recommendTimePlan: '',
    recommendSpotNotes: {},
    recommendFoodNotes: {},
    recommendHotelNote: '',
    recommendActive: false,

    // ===== 自定义节点（用户手动添加） =====
    customSpots: [],
    customFoods: [],

    // ===== 多景点串联选择 =====
    // 用户从卡片页长按拖拽选中的多个景点
    multiPlanAttractions: [],

    // ===== Phase 2: 多天行程 & 基础增强 =====
    // 规划天数（默认1天）
    planDays: 1,
    // 天气数据 { date, weather, temperature, wind, forecast: [...] }
    weatherData: null,
    // 天气加载状态
    weatherLoading: false,
    // 节点备注: { [nodeId]: '用户自由文本' }
    nodeNotes: {},
    // 游客人数（用于人均预算计算）
    travelerCount: 1,
    // 离线缓存标识
    isOfflineCached: false,

    // ===== Phase 3: 打卡动态调整 & 分享导出 =====
    // 备选方案: { [nodeId]: [{ id, name, reason }] }
    alternatives: {},
    // 用户标识
    userIdentity: null,   // { token, userId, nickname }
    // 打卡时间记录: { [nodeId]: { plannedStart, plannedEnd, actualStart, actualEnd } }
    checkinTimes: {},
    // 调整警告
    adjustWarnings: [],
    // 是否需要调整
    needAdjust: false,

    // ===== Phase 4: AI 深度优化 & 数据沉淀 =====
    // 行程历史列表
    planHistory: [],
    // 用户偏好
    userPreferences: {
      preferredTypes: [],
      budgetLevel: 'medium',
      preferredFoodTypes: [],
      stayCorrectionFactor: 1.0
    },
    // 行李清单
    luggageChecklist: []
  },

  getters: {
    // 按顺序获取已选路线景点（含自定义节点）
    selectedSpots: (state) => {
      const spotMap = {}
      state.allSpots.forEach(s => { spotMap[s.id] = s })
      state.customSpots.forEach(s => { spotMap[s.id] = s })
      return state.selectedSpotIds.map(id => spotMap[id]).filter(Boolean)
    },
    // 获取已选美食（含自定义）
    selectedFoods: (state) => {
      const foodMap = {}
      state.allFoods.forEach(f => { foodMap[f.id] = f })
      state.customFoods.forEach(f => { foodMap[f.id] = f })
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
    multiPlanCount: (state) => state.multiPlanAttractions.length,
    // 按天分组的时间线
    timelineByDay: (state) => {
      const groups = {}
      state.timelineNodes.forEach(node => {
        const d = node.day || 1
        if (!groups[d]) groups[d] = []
        groups[d].push(node)
      })
      return groups
    },
    // 总天数
    totalDays: (state) => {
      if (state.planResult?.summary?.totalDays) return state.planResult.summary.totalDays
      const days = new Set(state.timelineNodes.map(n => n.day || 1))
      return Math.max(1, ...days)
    },
    // 当日节点备注
    dayNodeNotes: (state) => (day) => {
      const notes = {}
      state.timelineNodes
        .filter(n => (n.day || 1) === day)
        .forEach(n => {
          if (state.nodeNotes[n.id]) notes[n.id] = state.nodeNotes[n.id]
        })
      return notes
    },
    // 预算明细
    budgetDetail: (state) => {
      const spots = state.timelineNodes.filter(n => n.type === 'spot')
      const foods = state.timelineNodes.filter(n => n.type === 'food')
      // 🎫 主门票（从 currentAttraction.cost 解析，如 "¥90" → 90）
      const parseCost = (c) => {
        if (!c || c === '免费') return 0
        const m = String(c).match(/(\d+)/)
        return m ? Number(m[1]) : 0
      }
      const mainTicket = parseCost(state.currentAttraction?.cost || '')
      // 优先用 summary.mainTicket（mock/后端已计算），否则回退到 currentAttraction
      const mainTicketFinal = state.planResult?.summary?.mainTicket ?? mainTicket
      // 门票和餐饮价格均为"每人"单价，需乘以人数得到总价
      const travCount = Math.max(1, state.travelerCount)
      const spotBudgetPerPerson = spots.reduce((s, n) => s + (Number(n.data?.ticket_price) || 0), 0) + mainTicketFinal
      const foodBudgetPerPerson = foods.reduce((s, n) => s + (Number(n.data?.price_per_person) || Number(n.data?.avgPrice) || 0), 0)
      // 根据实际交通距离动态估算（步行免费，公交2元/次/人，驾车按距离开销按车计）
      let transportBudget = 0
      state.timelineNodes.forEach(node => {
        const t = node.transportFromPrev
        if (!t || !t.distance || t.distance <= 0) return
        if (t.mode === 'transit') transportBudget += 2 * travCount  // 公交每人2元，乘人数
        else if (t.mode === 'drive') transportBudget += Math.round(t.distance / 1000 * 1.5) // 自驾 ~1.5元/km（油费按车计）
        // walk = 免费
      })
      if (transportBudget === 0) transportBudget = 20 // 最低预估
      const spotBudget = spotBudgetPerPerson * travCount
      const foodBudget = foodBudgetPerPerson * travCount
      const totalBudget = spotBudget + foodBudget + transportBudget
      return {
        spotBudget,
        foodBudget,
        transportBudget,
        transportLabel: state.transportMode === 'drive' ? '自驾' : '公共交通',
        totalBudget,
        perPerson: Math.round(totalBudget / travCount)
      }
    },
    // 是否有打卡偏差需要调整
    hasCheckinDeviation: (state) => {
      return state.needAdjust && state.adjustWarnings.length > 0
    }
  },

  mutations: {
    SET_LOADING(state, payload) {
      state.loading = payload
    },

    SET_CURRENT_ATTRACTION(state, attraction) {
      state.currentAttraction = attraction
    },

    INIT_PLAN_DATA(state, { attraction, spots, foods, hotels }) {
      state.currentAttraction = attraction
      state.allSpots = spots
      state.allFoods = foods
      state.allHotels = hotels
      // 判断是否为 mock 精选数据（id 为纯数字）vs 动态搜索数据（id 以 dyn_ 开头）
      const isMockData = spots.length > 0 && spots.every(s => typeof s.id === 'number')
      // mock 精选路线自动全选；动态搜索数据让用户从推荐中自行选择
      state.selectedSpotIds = isMockData
        ? [...spots].sort((a, b) => a.default_order - b.default_order).map(s => s.id)
        : []
      // 清空之前的选择
      state.selectedFoodIds = []
      state.selectedHotelId = null
      state.customHotelName = ''
      state.planResult = null
      // 重置推荐和自定义节点
      state.recommendActive = false
      state.recommendAdvice = ''
      state.recommendTimePlan = ''
      state.recommendSpotNotes = {}
      state.recommendFoodNotes = {}
      state.recommendHotelNote = ''
      state.customSpots = []
      state.customFoods = []
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

    UPDATE_SPOT(state, { id, name, highlight, ticket_price }) {
      // 更新 allSpots 或 customSpots 中的节点
      const spot = state.allSpots.find(s => s.id === id)
      if (spot) {
        if (name !== undefined) spot.name = name
        if (highlight !== undefined) spot.highlight = highlight
        if (ticket_price !== undefined) spot.ticket_price = ticket_price
      }
      const customSpot = state.customSpots.find(s => s.id === id)
      if (customSpot) {
        if (name !== undefined) customSpot.name = name
        if (highlight !== undefined) customSpot.highlight = highlight
        if (ticket_price !== undefined) customSpot.ticket_price = ticket_price
      }
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

    UPDATE_FOOD(state, { id, name, recommend_dish, price_per_person, highlight }) {
      const food = state.allFoods.find(f => f.id === id)
      if (food) {
        if (name !== undefined) food.name = name
        if (recommend_dish !== undefined) food.recommend_dish = recommend_dish
        if (price_per_person !== undefined) food.price_per_person = price_per_person
        if (highlight !== undefined) food.highlight = highlight
      }
      const customFood = state.customFoods.find(f => f.id === id)
      if (customFood) {
        if (name !== undefined) customFood.name = name
        if (recommend_dish !== undefined) customFood.recommend_dish = recommend_dish
        if (price_per_person !== undefined) customFood.price_per_person = price_per_person
        if (highlight !== undefined) customFood.highlight = highlight
      }
    },

    ADD_CUSTOM_FOOD(state, food) {
      state.customFoods.push(food)
      if (!state.selectedFoodIds.includes(food.id)) {
        state.selectedFoodIds.push(food.id)
      }
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

    UPDATE_HOTEL(state, { id, name, price_range, highlight, rating }) {
      const hotel = state.allHotels.find(h => h.id === id)
      if (hotel) {
        if (name !== undefined) hotel.name = name
        if (price_range !== undefined) hotel.price_range = price_range
        if (highlight !== undefined) hotel.highlight = highlight
        if (rating !== undefined) hotel.rating = rating
      }
    },

    SET_PLAN_RESULT(state, result) {
      state.planResult = result
    },

    // ===== 统一时间线操作 =====
    SET_TIMELINE_NODES(state, nodes) {
      state.timelineNodes = [...nodes]
    },

    UPDATE_TIMELINE_ORDER(state, newNodes) {
      state.timelineNodes = [...newNodes]
    },

    REORDER_TIMELINE_NODE(state, { oldIndex, newIndex }) {
      const nodes = [...state.timelineNodes]
      const [moved] = nodes.splice(oldIndex, 1)
      nodes.splice(newIndex, 0, moved)
      state.timelineNodes = nodes
    },

    REMOVE_TIMELINE_NODE(state, nodeId) {
      state.timelineNodes = state.timelineNodes.filter(n => n.id !== nodeId)
    },

    SET_CURRENT_DAY(state, day) {
      state.currentDay = day
    },

    UPDATE_TIMELINE_NODE_STATE(state, { nodeId, status }) {
      const node = state.timelineNodes.find(n => n.id === nodeId)
      if (node) {
        node.state = status
        if (status === 'checked') {
          node.actualEndTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        }
      }
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

    // ===== 推荐模式切换 =====
    SET_RECOMMEND_MODE(state, mode) {
      state.recommendMode = mode
    },

    // ===== 交通方式切换 =====
    SET_TRANSPORT_MODE(state, mode) {
      state.transportMode = mode
    },

    APPLY_RECOMMEND(state, { spotIds, foodIds, hotelId, spotNotes, foodNotes, hotelNote, advice, timePlan, spotDurations, mealAssignments }) {
      state.selectedSpotIds = [...spotIds]
      state.selectedFoodIds = [...foodIds]
      state.selectedHotelId = hotelId || null
      state.customHotelName = ''
      state.recommendAdvice = advice || ''
      state.recommendTimePlan = timePlan || ''
      state.recommendSpotNotes = spotNotes || {}
      state.recommendFoodNotes = foodNotes || {}
      state.recommendHotelNote = hotelNote || ''
      state.recommendActive = true
      // AI 推荐的停留时长
      if (spotDurations) {
        state.allSpots.forEach(s => {
          if (spotDurations[s.id]) s.stay_duration = spotDurations[s.id]
        })
      }
      // AI 推荐的餐食分配
      if (mealAssignments) {
        state._mealAssignments = { ...mealAssignments }
      }
    },

    CLEAR_RECOMMEND(state) {
      state.recommendAdvice = ''
      state.recommendTimePlan = ''
      state.recommendSpotNotes = {}
      state.recommendFoodNotes = {}
      state.recommendHotelNote = ''
      state.recommendActive = false
    },

    // ===== 自定义节点 =====
    ADD_CUSTOM_SPOT(state, spot) {
      state.customSpots.push(spot)
      if (!state.selectedSpotIds.includes(spot.id)) {
        state.selectedSpotIds.push(spot.id)
      }
    },

    REMOVE_CUSTOM_SPOT(state, spotId) {
      state.customSpots = state.customSpots.filter(s => s.id !== spotId)
      state.selectedSpotIds = state.selectedSpotIds.filter(id => id !== spotId)
    },

    // ===== Phase 2: 多天/天气/备注/预算 =====
    SET_PLAN_DAYS(state, days) {
      state.planDays = Math.max(1, Math.min(7, days))
    },
    SET_WEATHER_DATA(state, data) {
      state.weatherData = data
    },
    SET_WEATHER_LOADING(state, val) {
      state.weatherLoading = val
    },
    // ===== 潮汐数据 =====
    SET_TIDE_DATA(state, data) {
      state.tideData = data
    },
    SET_TIDE_LOADING(state, val) {
      state.tideLoading = val
    },
    SET_NODE_NOTE(state, { nodeId, note }) {
      state.nodeNotes = { ...state.nodeNotes, [nodeId]: note }
    },
    DELETE_NODE_NOTE(state, nodeId) {
      const notes = { ...state.nodeNotes }
      delete notes[nodeId]
      state.nodeNotes = notes
    },
    SET_TRAVELER_COUNT(state, count) {
      state.travelerCount = Math.max(1, Math.min(20, count))
    },
    SET_OFFLINE_CACHED(state, val) {
      state.isOfflineCached = val
    },

    // ===== Phase 3: 打卡调整/导出/备选方案 =====
    SET_ALTERNATIVES(state, { nodeId, alternatives }) {
      state.alternatives = { ...state.alternatives, [nodeId]: alternatives }
    },
    SET_USER_IDENTITY(state, identity) {
      state.userIdentity = identity
    },
    CLEAR_USER_IDENTITY(state) {
      state.userIdentity = null
    },
    RECORD_CHECKIN(state, { nodeId, field, value }) {
      if (!state.checkinTimes[nodeId]) {
        state.checkinTimes[nodeId] = {}
      }
      state.checkinTimes[nodeId] = { ...state.checkinTimes[nodeId], [field]: value }
    },
    SET_ADJUST_WARNINGS(state, warnings) {
      state.adjustWarnings = warnings
    },
    SET_NEED_ADJUST(state, val) {
      state.needAdjust = val
    },

    // ===== Phase 4: 历史/偏好/行李清单 =====
    SET_PLAN_HISTORY(state, history) {
      state.planHistory = history
    },
    SET_USER_PREFERENCES(state, prefs) {
      state.userPreferences = { ...state.userPreferences, ...prefs }
    },
    SET_LUGGAGE_CHECKLIST(state, list) {
      state.luggageChecklist = list
    },
    TOGGLE_LUGGAGE_ITEM(state, index) {
      if (state.luggageChecklist[index]) {
        state.luggageChecklist[index].checked = !state.luggageChecklist[index].checked
      }
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
      state.timelineNodes = []
      state.currentDay = 1
      state.loading = false
      state.multiPlanAttractions = []
      state.recommendMode = 'basic'
      state.recommendActive = false
      state.recommendAdvice = ''
      state.recommendTimePlan = ''
      state.recommendSpotNotes = {}
      state.recommendFoodNotes = {}
      state.customSpots = []
      state.customFoods = []
      state.recommendHotelNote = ''
      // Phase 2-4 重置
      state.planDays = 1
      state.weatherData = null
      state.weatherLoading = false
      state.nodeNotes = {}
      state.travelerCount = 1
      state.alternatives = {}
      state.needAdjust = false
      state.adjustWarnings = []
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
    async fetchDynamicPlan({ commit }, { name, lat, lng, address, city }) {
      commit('SET_LOADING', true)
      try {
        const res = await fetch(`${API_BASE}/plan-dynamic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, lat, lng, address: address || '', city: city || '' })
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
     * AI 智能推荐（DeepSeek）
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
        commit('APPLY_RECOMMEND', json.data)
        return json.data
      } catch (err) {
        console.error('AI 推荐失败:', err)
        throw err
      } finally {
        commit('SET_LOADING', false)
      }
    },

    /**
     * 基础推荐（本地启发式规则，不调后端）
     * 按评分→评级→距离排序后，展示全部可用景点供用户自由选择
     */
    basicRecommend({ commit, state }) {
      const spots = state.allSpots
      const foods = state.allFoods
      const hotels = state.allHotels

      if (spots.length === 0 && foods.length === 0 && hotels.length === 0) {
        throw new Error('暂无可用数据，请等待加载完成')
      }

      // 路线：展示全部景点（后端已按可信度+评分排序），不再限制前5个
      const spotIds = spots.map(s => s.id)

      // 美食：选取前 3 个
      const topFoods = foods.slice(0, 3)
      const foodIds = topFoods.map(f => f.id)

      // 住宿：选取前 2 个（让用户有对比选择的空间）
      const hotelId = hotels.length > 0 ? hotels[0].id : null

      // 理由笔记
      const spotNotes = {}
      spots.forEach(s => {
        const parts = []
        if (s.highlight) parts.push(s.highlight.slice(0, 12))
        spotNotes[s.id] = parts.join(' · ') || '推荐游览'
      })

      const foodNotes = {}
      topFoods.forEach(f => {
        foodNotes[f.id] = f.highlight?.slice(0, 12) || f.recommend_dish?.slice(0, 12) || '值得一试'
      })

      const result = {
        spotIds,
        foodIds,
        hotelId,
        spotNotes,
        foodNotes,
        hotelNote: hotelId ? '距离景区最近' : null,
        advice: `已为你展示全部 ${spotIds.length} 个景点、${foodIds.length} 家特色美食和1家便捷住宿，拖拽排序或增删节点即可定制属于你的路线。`,
        timePlan: '按顺序游览即可，每个节点建议停留 30 分钟。'
      }

      commit('APPLY_RECOMMEND', result)
      return result
    },

    /**
     * 手动添加自定义节点（通过后端地理编码获取坐标）
     */
    async geocodeCustomSpot({ commit }, { name, address }) {
      try {
        const res = await fetch(`${API_BASE}/geocode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: address || name })
        })
        const json = await res.json()
        let lat, lng
        if (json.success && json.data) {
          lat = json.data.lat
          lng = json.data.lng
        }
        const spot = {
          id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: name,
          lat: lat || 0,
          lng: lng || 0,
          stay_duration: 30,
          default_order: 999,
          ticket_price: 0,
          highlight: address || '自定义节点',
          desc: address || ''
        }
        commit('ADD_CUSTOM_SPOT', spot)
        return spot
      } catch (err) {
        // 地理编码失败也添加节点（只是没坐标）
        const spot = {
          id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: name,
          lat: 0,
          lng: 0,
          stay_duration: 30,
          default_order: 999,
          ticket_price: 0,
          highlight: address || '自定义节点',
          desc: address || ''
        }
        commit('ADD_CUSTOM_SPOT', spot)
        return spot
      }
    },

    /**
     * 生成完整攻略（Phase 1：调后端时间规划引擎）
     */
    async generatePlan({ commit, state, getters, dispatch }) {
      commit('SET_LOADING', true)
      try {
        const selectedHotel = getters.selectedHotel
        const res = await fetch(`${API_BASE}/plan-timeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attraction: state.currentAttraction,
            selectedSpots: getters.selectedSpots,
            selectedFoods: getters.selectedFoods,
            selectedHotel,
            customHotelName: state.customHotelName,
            totalDays: state.planDays || 1,
            startTime: '08:00',
            transportMode: state.transportMode || 'drive'
          })
        })
        const json = await res.json()
        if (!json.success || !json.data) {
          throw new Error(json.error || '攻略生成失败')
        }
        commit('SET_PLAN_RESULT', json.data)
        commit('SET_TIMELINE_NODES', json.data.timelineNodes || [])
        commit('SET_CURRENT_DAY', 1)
        // 🔑 持久化到 localStorage，刷新不丢数据
        dispatch('cachePlanOffline')
        return json.data
      } catch (err) {
        console.error('生成攻略失败:', err)
        // 降级：使用旧的 mock generate（如果后端不可用）
        try {
          const result = await apiGeneratePlan({
            attractionId: state.currentAttraction?.id,
            selectedSpotIds: state.selectedSpotIds,
            selectedFoodIds: state.selectedFoodIds,
            hotelId: state.selectedHotelId === 'custom' ? 0 : state.selectedHotelId,
            customHotelName: state.customHotelName,
            transportMode: state.transportMode || 'drive'
          })
          if (!result) {
            throw new Error('动态景点无本地缓存，降级生成失败')
          }
          commit('SET_PLAN_RESULT', result)
          // 🔑 mock 降级路径也持久化
          dispatch('cachePlanOffline')
          return result
        } catch (fallbackErr) {
          throw err
        }
      } finally {
        commit('SET_LOADING', false)
      }
    },

    // ===== Phase 2: 天气查询 =====
    async fetchWeather({ commit, state, getters }) {
      commit('SET_WEATHER_LOADING', true)
      try {
        // 多来源降级获取坐标
        let lat, lng, source = ''

        // 1) 优先从 timelineNodes（行程节点，最可靠）
        const nodes = state.timelineNodes || []
        const firstNode = nodes.find(n => n.data?.lat && n.data?.lng)
        if (firstNode) {
          lat = firstNode.data.lat; lng = firstNode.data.lng; source = 'timelineNodes'
        }

        // 2) 降级：planResult.summary（后端/模拟均已包含坐标）
        if (!lat && state.planResult?.summary?.lat) {
          lat = state.planResult.summary.lat; lng = state.planResult.summary.lng; source = 'summary'
        }

        // 3) 降级：currentAttraction（plan 页带入的当前景点）
        if (!lat) {
          const attr = state.currentAttraction
          if (attr?.lat && attr?.lng) {
            lat = attr.lat; lng = attr.lng; source = 'currentAttraction'
          }
        }

        // 4) 降级：已选景点首个坐标
        if (!lat) {
          const spots = getters.selectedSpots || []
          const firstWithCoord = spots.find(s => s.lat && s.lng)
          if (firstWithCoord) {
            lat = firstWithCoord.lat; lng = firstWithCoord.lng; source = 'selectedSpots'
          }
        }

        if (!lat || !lng) {
          console.warn('[Weather] 无法获取坐标，tlNodes=' + state.timelineNodes.length +
            ' summary=' + JSON.stringify(state.planResult?.summary),
            ' attr=' + JSON.stringify(state.currentAttraction) +
            ' spots=' + (getters.selectedSpots || []).length)
          return null
        }

        const res = await fetch(`${API_BASE}/plan-weather`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng })
        })
        const json = await res.json()
        if (json.success && json.data) {
          commit('SET_WEATHER_DATA', json.data)
          return json.data
        }
        return null
      } catch (err) {
        console.error('天气查询失败:', err)
        return null
      } finally {
        commit('SET_WEATHER_LOADING', false)
      }
    },

    // ===== 潮汐数据查询（海滨城市专用） =====
    async fetchTide({ commit }, { lat, lng }) {
      commit('SET_TIDE_LOADING', true)
      try {
        const res = await fetch(`${API_BASE}/tide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng })
        })
        const json = await res.json()
        if (json.success && json.data) {
          commit('SET_TIDE_DATA', json.data)
          return json.data
        }
        return null
      } catch (err) {
        console.error('潮汐查询失败:', err)
        return null
      } finally {
        commit('SET_TIDE_LOADING', false)
      }
    },

    // ===== Phase 2: 离线缓存 =====
    cachePlanOffline({ state, commit }) {
      try {
        const data = {
          timelineNodes: state.timelineNodes,
          planResult: state.planResult,
          weatherData: state.weatherData,
          tideData: state.tideData,
          nodeNotes: state.nodeNotes,
          cachedAt: new Date().toISOString()
        }
        localStorage.setItem('travel_plan_cache', JSON.stringify(data))
        commit('SET_OFFLINE_CACHED', true)
      } catch { /* ignore */ }
    },
    loadOfflineCache({ commit }) {
      try {
        const raw = localStorage.getItem('travel_plan_cache')
        if (raw) {
          const data = JSON.parse(raw)
          commit('SET_TIMELINE_NODES', data.timelineNodes || [])
          if (data.planResult) commit('SET_PLAN_RESULT', data.planResult)
          if (data.weatherData) commit('SET_WEATHER_DATA', data.weatherData)
          if (data.tideData) commit('SET_TIDE_DATA', data.tideData)
          if (data.nodeNotes) {
            for (const [key, val] of Object.entries(data.nodeNotes)) {
              commit('SET_NODE_NOTE', { nodeId: key, note: val })
            }
          }
          commit('SET_OFFLINE_CACHED', true)
          return data
        }
      } catch { /* ignore */ }
      return null
    },

    // ===== Phase 3: 打卡后动态调整 =====
    async adjustTimeline({ commit, state, getters }, { lastCheckedNodeIndex, actualTimeOffset }) {
      commit('SET_LOADING', true)
      try {
        const res = await fetch(`${API_BASE}/plan-adjust`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timelineNodes: state.timelineNodes,
            currentDay: state.currentDay,
            lastCheckedNodeIndex,
            actualTimeOffset
          })
        })
        const json = await res.json()
        if (json.success && json.data) {
          commit('SET_TIMELINE_NODES', json.data.adjustedNodes)
          commit('SET_ADJUST_WARNINGS', json.data.warnings || [])
          commit('SET_NEED_ADJUST', false)
          return json.data
        }
        throw new Error(json.message || '调整失败')
      } catch (err) {
        console.error('行程调整失败:', err)
        throw err
      } finally {
        commit('SET_LOADING', false)
      }
    },

    // ===== Phase 3: 保存行程 =====
    async savePlan({ state, commit }, planName) {
      try {
        const res = await fetch(`${API_BASE}/plan-save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planName: planName || (state.planResult?.summary?.attractionName || '未命名行程'),
            planData: {
              timelineNodes: state.timelineNodes,
              summary: state.planResult?.summary,
              weatherData: state.weatherData,
              nodeNotes: state.nodeNotes,
              currentAttraction: state.currentAttraction
            },
            userId: state.userIdentity?.userId
          })
        })
        const json = await res.json()
        if (json.success) {
          // 同时缓存到本地
          localStorage.setItem(`travel_plan_${json.data.planId}`, JSON.stringify({
            planName, planData: { timelineNodes: state.timelineNodes, summary: state.planResult?.summary }
          }))
          return json.data
        }
        throw new Error(json.error || '保存失败')
      } catch (err) {
        console.error('保存行程失败:', err)
        throw err
      }
    },

    // ===== Phase 3: 用户标识 =====
    async identifyUser({ commit }, { nickname, pin }) {
      try {
        const res = await fetch('/staticTool/api/user/identify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname, pin })
        })
        const json = await res.json()
        if (json.success && json.data) {
          commit('SET_USER_IDENTITY', json.data)
          localStorage.setItem('travel_user_identity', JSON.stringify(json.data))
          return json.data
        }
        throw new Error(json.error || '身份标识失败')
      } catch (err) {
        console.error('用户标识失败:', err)
        throw err
      }
    },

    // ===== Phase 3: 获取外部攻略 =====
    async fetchExternalGuide({ commit }, url) {
      try {
        const res = await fetch(`${API_BASE}/fetch-guide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })
        const json = await res.json()
        if (json.success && json.data) {
          return json.data
        }
        throw new Error(json.message || '获取失败')
      } catch (err) {
        console.error('获取外部攻略失败:', err)
        throw err
      }
    },

    // ===== Phase 4: 获取行程历史 =====
    async fetchPlanHistory({ state, commit }) {
      try {
        const userId = state.userIdentity?.userId
        const url = userId ? `${API_BASE}/plan-history?userId=${userId}` : `${API_BASE}/plan-history`
        const res = await fetch(url)
        const json = await res.json()
        if (json.success) {
          commit('SET_PLAN_HISTORY', json.data || [])
          return json.data
        }
        return []
      } catch (err) {
        console.error('获取行程历史失败:', err)
        return []
      }
    },

    // ===== Phase 4: 用户偏好 =====
    async loadUserPreferences({ state, commit }) {
      try {
        const identity = state.userIdentity || JSON.parse(localStorage.getItem('travel_user_identity') || 'null')
        if (!identity?.token) {
          // 从localStorage加载本地偏好
          const local = localStorage.getItem('travel_user_preferences')
          if (local) {
            commit('SET_USER_PREFERENCES', JSON.parse(local))
          }
          return
        }
        const res = await fetch('/staticTool/api/user/preferences', {
          headers: { 'x-auth-token': identity.token }
        })
        const json = await res.json()
        if (json.success && json.data) {
          commit('SET_USER_PREFERENCES', json.data)
        }
      } catch { /* ignore */ }
    },

    async saveUserPreferences({ state, commit }, prefs) {
      try {
        commit('SET_USER_PREFERENCES', prefs)
        localStorage.setItem('travel_user_preferences', JSON.stringify(prefs))
        const identity = state.userIdentity
        if (identity?.token) {
          await fetch('/staticTool/api/user/preferences', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': identity.token
            },
            body: JSON.stringify(prefs)
          })
        }
      } catch (err) {
        console.error('保存偏好失败:', err)
      }
    },

    // ===== Phase 4: 生成行李清单 =====
    generateLuggageChecklist({ commit, state }) {
      const weather = state.weatherData
      const isRainy = weather?.rainWarning || (weather?.weather || '').includes('雨')
      const temp = parseInt(String(weather?.temperature || '20').replace(/[^0-9-]/g, '')) || 20

      const checklist = [
        { name: '身份证/护照', category: '证件', checked: false },
        { name: '手机 + 充电器', category: '电子设备', checked: false },
        { name: '充电宝', category: '电子设备', checked: false },
        { name: '现金/银行卡', category: '证件', checked: false },
        { name: '换洗衣物', category: '衣物', checked: false },
        { name: '洗漱用品', category: '日用品', checked: false },
        { name: '常用药品', category: '药品', checked: false },
        { name: '防晒霜', category: '日用品', checked: false },
        { name: '水杯', category: '日用品', checked: false },
        { name: '舒适运动鞋', category: '衣物', checked: false }
      ]

      if (temp < 15) {
        checklist.push({ name: '外套/夹克', category: '衣物', checked: false })
        checklist.push({ name: '围巾/手套', category: '衣物', checked: false })
      }
      if (temp > 28) {
        checklist.push({ name: '遮阳帽', category: '日用品', checked: false })
        checklist.push({ name: '墨镜', category: '日用品', checked: false })
        checklist.push({ name: '小风扇', category: '电子设备', checked: false })
      }
      if (isRainy) {
        checklist.push({ name: '雨伞/雨衣', category: '日用品', checked: false })
        checklist.push({ name: '防水鞋套', category: '衣物', checked: false })
      }

      commit('SET_LUGGAGE_CHECKLIST', checklist)
      return checklist
    }
  }
}

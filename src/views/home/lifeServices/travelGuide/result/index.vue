<template>
  <div class="result-page">
    <!-- 固定顶栏 -->
    <div class="result-topbar">
      <el-button :icon="ArrowLeft" text @click="$router.back()">返回规划</el-button>
      <div class="topbar-title">
        <MapLocation class="title-icon" />
        <span>{{ planResult?.attractionName || '' }}</span>
        <el-tag type="success" size="small">攻略已生成</el-tag>
      </div>
      <div class="topbar-spacer"></div>
    </div>

    <div v-if="planResult" class="result-content">
      <!-- 概览卡片 -->
      <div class="overview-card">
        <div class="overview-grid">
          <div class="overview-item">
            <div class="overview-icon spot-bg"><el-icon :size="20"><Flag /></el-icon></div>
            <div class="overview-label">游览景点</div>
            <div class="overview-value">{{ planResult.summary.spotsCount }} 个</div>
          </div>
          <div class="overview-item">
            <div class="overview-icon food-bg"><el-icon :size="20"><KnifeFork /></el-icon></div>
            <div class="overview-label">美食推荐</div>
            <div class="overview-value">{{ planResult.summary.foodsCount }} 个</div>
          </div>
          <div class="overview-item">
            <div class="overview-icon hotel-bg"><el-icon :size="20"><HomeFilled /></el-icon></div>
            <div class="overview-label">住宿安排</div>
            <div class="overview-value truncate-text">{{ planResult.summary.hotelName }}</div>
          </div>
          <div class="overview-item total">
            <div class="overview-icon total-bg"><el-icon :size="20"><Coin /></el-icon></div>
            <div class="overview-label">预估总预算</div>
            <div class="overview-value price">¥{{ planResult.summary.totalBudget }}</div>
          </div>
        </div>
      </div>

      <!-- 时间线攻略 -->
      <div class="timeline-section">
        <h2 class="section-title">📋 详细行程</h2>
        <div v-if="planResult.timeline.length" class="timeline">
          <template v-for="(item, index) in planResult.timeline" :key="index">
            <!-- 时间段标题 -->
            <div v-if="item.type === 'section'" class="timeline-section-header">
              <div class="section-dot"></div>
              <h3>{{ item.title }}</h3>
            </div>

            <!-- 景点 -->
            <div v-else-if="item.type === 'spot'" class="timeline-item" :class="itemClass('spot', index)">
              <div class="timeline-time">
                <span class="time-badge spot-badge">{{ item.time }}</span>
              </div>
              <div class="timeline-card">
                <div class="card-left-line spot-line"></div>
                <div class="card-body">
                  <div class="card-header">
                    <span class="card-type-badge spot-type">景点</span>
                    <span class="card-name" :class="{ 'text-line-through': getItemState('spot', index) === 'ignored' }">{{ item.data.name }}</span>
                    <el-tag v-if="getItemState('spot', index) === 'checked'" size="small" type="success">已打卡</el-tag>
                    <el-tag v-else-if="getItemState('spot', index) === 'ignored'" size="small" type="info">已忽略</el-tag>
                  </div>
                  <p class="card-desc" v-if="item.data.desc">{{ item.data.desc }}</p>
                  <div class="card-actions">
                    <div class="card-meta">
                      <span><el-icon :size="12"><Clock /></el-icon> 建议停留 {{ item.data.stay_duration }} 分钟</span>
                      <span v-if="item.data.ticket_price"> · 门票 ¥{{ item.data.ticket_price }}</span>
                    </div>
                    <div class="state-btns">
                      <el-button
                        size="small"
                        :type="getItemState('spot', index) === 'checked' ? 'success' : 'default'"
                        :icon="CircleCheckFilled"
                        round
                        @click="toggleItemState('spot', index)"
                      >打卡</el-button>
                      <el-button
                        size="small"
                        :type="getItemState('spot', index) === 'ignored' ? 'info' : 'default'"
                        :icon="RemoveFilled"
                        round
                        @click="toggleIgnore('spot', index)"
                      >忽略</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 美食 -->
            <div v-else-if="item.type === 'food'" class="timeline-item" :class="itemClass('food', index)">
              <div class="timeline-time">
                <span class="time-badge food-badge">{{ item.time }}</span>
              </div>
              <div class="timeline-card">
                <div class="card-left-line food-line"></div>
                <div class="card-body">
                  <div class="card-header">
                    <span class="card-type-badge food-type">美食</span>
                    <span class="card-name" :class="{ 'text-line-through': getItemState('food', index) === 'ignored' }">{{ item.data.name }}</span>
                    <el-tag v-if="getItemState('food', index) === 'checked'" size="small" type="success">已打卡</el-tag>
                    <el-tag v-else-if="getItemState('food', index) === 'ignored'" size="small" type="info">已忽略</el-tag>
                  </div>
                  <p class="card-desc">🍽️ 推荐菜品：{{ item.data.recommend_dish }}</p>
                  <div class="card-actions">
                    <div class="card-meta">
                      <span class="price-tag">人均 ¥{{ item.data.price_per_person }}</span>
                    </div>
                    <div class="state-btns">
                      <el-button
                        size="small"
                        :type="getItemState('food', index) === 'checked' ? 'success' : 'default'"
                        :icon="CircleCheckFilled"
                        round
                        @click="toggleItemState('food', index)"
                      >打卡</el-button>
                      <el-button
                        size="small"
                        :type="getItemState('food', index) === 'ignored' ? 'info' : 'default'"
                        :icon="RemoveFilled"
                        round
                        @click="toggleIgnore('food', index)"
                      >忽略</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 酒店 -->
            <div v-else-if="item.type === 'hotel'" class="timeline-item" :class="itemClass('hotel', index)">
              <div class="timeline-time">
                <span class="time-badge hotel-badge">{{ item.time }}</span>
              </div>
              <div class="timeline-card">
                <div class="card-left-line hotel-line"></div>
                <div class="card-body">
                  <div class="card-header">
                    <span class="card-type-badge hotel-type">住宿</span>
                    <span class="card-name" :class="{ 'text-line-through': getItemState('hotel', index) === 'ignored' }">{{ item.data.name }}</span>
                    <el-tag v-if="getItemState('hotel', index) === 'checked'" size="small" type="success">已入住</el-tag>
                    <el-tag v-else-if="getItemState('hotel', index) === 'ignored'" size="small" type="info">已忽略</el-tag>
                  </div>
                  <p class="card-desc">🏨 结束一天的旅程，好好休息吧！</p>
                  <div class="card-actions">
                    <div></div>
                    <div class="state-btns">
                      <el-button
                        size="small"
                        :type="getItemState('hotel', index) === 'checked' ? 'success' : 'default'"
                        :icon="CircleCheckFilled"
                        round
                        @click="toggleItemState('hotel', index)"
                      >入住</el-button>
                      <el-button
                        size="small"
                        :type="getItemState('hotel', index) === 'ignored' ? 'info' : 'default'"
                        :icon="RemoveFilled"
                        round
                        @click="toggleIgnore('hotel', index)"
                      >忽略</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <el-empty v-else description="暂无时间线数据" :image-size="60" />
      </div>

      <!-- 底部操作 -->
      <div class="result-actions">
        <el-button :icon="RefreshRight" @click="handleReplan">重新规划</el-button>
        <el-button type="primary" @click="$router.push('/home/lifeServices/travelGuide')">回到首页</el-button>
      </div>
    </div>

    <!-- 无数据 -->
    <div v-else class="empty-result">
      <el-empty description="暂无攻略数据，请先规划行程">
        <el-button type="primary" @click="$router.push('/home/lifeServices/travelGuide')">去规划</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

const router = useRouter()
const store = useStore()

const planResult = computed(() => store.state.plan.planResult)
const attractionName = computed(() => planResult.value?.attractionName || '')

// localStorage key
const storageKey = computed(() => `travel_plan_states_${attractionName.value}`)

// 加载持久化状态
onMounted(() => {
  loadStates()
})

watch(attractionName, () => {
  loadStates()
})

function loadStates() {
  if (!attractionName.value) return
  try {
    const saved = localStorage.getItem(storageKey.value)
    if (saved) {
      store.commit('plan/SET_ITEM_STATES', JSON.parse(saved))
    }
  } catch { /* ignore */ }
}

function saveStates() {
  if (!attractionName.value) return
  try {
    localStorage.setItem(storageKey.value, JSON.stringify(store.state.plan.resultItemStates))
  } catch { /* ignore */ }
}

function makeKey(type, index) {
  return `${type}_${index}`
}

function getItemState(type, index) {
  const key = makeKey(type, index)
  return store.state.plan.resultItemStates[key] || 'pending'
}

function toggleItemState(type, index) {
  const key = makeKey(type, index)
  const current = getItemState(type, index)
  const next = current === 'checked' ? 'pending' : 'checked'
  store.commit('plan/SET_ITEM_STATE', { key, status: next })
  saveStates()
}

function toggleIgnore(type, index) {
  const key = makeKey(type, index)
  const current = getItemState(type, index)
  const next = current === 'ignored' ? 'pending' : 'ignored'
  store.commit('plan/SET_ITEM_STATE', { key, status: next })
  saveStates()
}

function itemClass(type, index) {
  const state = getItemState(type, index)
  return {
    'state-checked': state === 'checked',
    'state-ignored': state === 'ignored'
  }
}

function handleReplan() {
  const id = store.state.plan.currentAttraction?.id
  if (id) {
    router.push(`/home/lifeServices/travelGuide/plan/${id}`)
  } else {
    router.push('/home/lifeServices/travelGuide')
  }
}
</script>

<style lang="scss" scoped>
.result-page { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.result-topbar {
  display: flex; align-items: center; padding: 12px 24px; background: #fff;
  border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10;
}
.topbar-title {
  display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 600;
  color: #0f172a; margin-left: 16px;
  .title-icon { color: #6366f1; }
}
.topbar-spacer { flex: 1; }

.result-content { max-width: 800px; margin: 0 auto; padding: 24px 20px; }

// 概览卡片
.overview-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
  padding: 24px; margin-bottom: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.overview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.overview-item { text-align: center;
  &.total { border-left: 1px solid #e2e8f0; padding-left: 16px; }
}
.overview-icon {
  width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center;
  justify-content: center; margin: 0 auto 8px;
  &.spot-bg { background: #fef2f2; color: #ef4444; }
  &.food-bg { background: #f0fdf4; color: #10b981; }
  &.hotel-bg { background: #eff6ff; color: #3b82f6; }
  &.total-bg { background: #eef2ff; color: #6366f1; }
}
.overview-label { font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
.overview-value { font-size: 16px; font-weight: 600; color: #0f172a;
  &.price { color: #6366f1; }
}
.truncate-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px; margin: 0 auto; }

// 时间线
.timeline-section { margin-bottom: 32px; }
.section-title { font-size: 20px; font-weight: 600; color: #0f172a; margin-bottom: 24px; }
.timeline { position: relative; }

.timeline-section-header {
  display: flex; align-items: center; gap: 12px; margin: 24px 0 16px;
  &:first-child { margin-top: 0; }
  h3 { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0; }
}
.section-dot { width: 10px; height: 10px; border-radius: 50%; background: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }

.timeline-item { display: flex; gap: 16px; margin-bottom: 16px; transition: all 0.3s;
  &.state-checked .timeline-card { background: #f0fdf4; border-color: #86efac; }
  &.state-ignored .timeline-card { opacity: 0.55; }
}
.timeline-time { width: 56px; flex-shrink: 0; padding-top: 2px; }
.time-badge {
  display: inline-block; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 6px; white-space: nowrap;
  &.spot-badge { background: #fef2f2; color: #ef4444; }
  &.food-badge { background: #f0fdf4; color: #10b981; }
  &.hotel-badge { background: #eff6ff; color: #3b82f6; }
}

.timeline-card {
  flex: 1; display: flex; background: #fff; border: 1px solid #e2e8f0;
  border-radius: 12px; overflow: hidden; transition: all 0.2s;
}
.card-left-line { width: 4px; flex-shrink: 0;
  &.spot-line { background: #ef4444; }
  &.food-line { background: #10b981; }
  &.hotel-line { background: #3b82f6; }
}
.card-body { flex: 1; padding: 16px; min-width: 0; }

.card-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;
}
.card-type-badge {
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px;
  &.spot-type { background: #fef2f2; color: #dc2626; }
  &.food-type { background: #f0fdf4; color: #059669; }
  &.hotel-type { background: #eff6ff; color: #2563eb; }
}
.card-name { font-size: 15px; font-weight: 600; color: #0f172a; }
.text-line-through { text-decoration: line-through; color: #94a3b8; }
.card-desc { font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 8px; }

.card-actions {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
}
.card-meta { font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 4px;
  .price-tag { color: #10b981; font-weight: 600; }
}
.state-btns { display: flex; gap: 6px; }

// 底部操作
.result-actions { display: flex; justify-content: center; gap: 12px; margin-top: 24px; }
.empty-result { padding: 80px 20px; }

@media (max-width: 768px) {
  .overview-grid { grid-template-columns: repeat(2, 1fr); }
  .overview-item.total { border-left: none; padding-left: 0; }
  .timeline-item { flex-direction: column; gap: 8px; }
  .timeline-time { width: auto; }
  .card-actions { flex-direction: column; align-items: flex-start; }
}
</style>

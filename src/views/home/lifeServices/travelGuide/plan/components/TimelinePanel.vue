<template>
  <div class="timeline-panel">
    <!-- 面板标题 -->
    <div class="panel-header">
      <div class="panel-title-row">
        <span class="panel-icon timeline-icon">
          <el-icon :size="20"><Clock /></el-icon>
        </span>
        <h3 class="panel-title">行程总览</h3>
        <span class="panel-badge">{{ totalCount }} 个节点</span>
      </div>
      <span class="panel-hint">拖拽卡片调整游览顺序 · 实时预览时间</span>
    </div>

    <!-- 空状态 -->
    <div v-if="previewNodes.length === 0" class="empty-state">
      <el-icon :size="36"><Sunset /></el-icon>
      <p>选择景点、美食和酒店后，这里会显示行程预览</p>
    </div>

    <!-- 时间线预览（可拖拽排序） -->
    <draggable
      v-else
      v-model="localNodes"
      item-key="id"
      handle=".preview-drag-handle"
      ghost-class="preview-ghost"
      :animation="250"
      @change="onOrderChange"
      class="preview-list"
    >
      <template #item="{ element, index }">
        <div class="preview-item" :class="`preview-${element.type}`">
          <!-- 拖拽手柄 -->
          <div class="preview-drag-handle" title="拖拽排序">
            <el-icon :size="16"><Rank /></el-icon>
          </div>

          <!-- 序号 -->
          <div class="preview-index" :class="`index-${element.type}`">{{ index + 1 }}</div>

          <!-- 节点信息 -->
          <div class="preview-info">
            <div class="preview-name">
              <span class="preview-type-tag" :class="`tag-${element.type}`">
                {{ typeLabel(element) }}
              </span>
              {{ element.data?.name || element.title || '' }}
            </div>
            <div v-if="element.startTime" class="preview-time">
              <el-icon :size="12"><Clock /></el-icon>
              {{ element.startTime }}
              <template v-if="element.endTime && element.endTime !== element.startTime">
                - {{ element.endTime }}
                <span v-if="element.stayDuration" class="preview-duration">({{ formatDuration(element.stayDuration) }})</span>
              </template>
            </div>
            <div v-if="hasMealTag(element)" class="preview-meal-tag" :class="`meal-${element.mealTag}`">
              {{ mealTagText(element) }}
            </div>
          </div>

          <!-- 删除按钮 -->
          <el-button
            class="preview-remove-btn"
            :icon="Close"
            size="small"
            circle
            text
            @click.stop="handleRemove(element)"
          />
        </div>
      </template>
    </draggable>

    <!-- 预估总结 -->
    <div v-if="previewNodes.length > 0" class="preview-summary">
      <div class="summary-row">
        <span class="summary-label">预计结束</span>
        <span class="summary-value">{{ estimatedEndTime }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">总游览时长</span>
        <span class="summary-value">{{ formatDuration(totalDuration) }}</span>
      </div>
      <div class="summary-row" v-if="totalBudget > 0">
        <span class="summary-label">预估花费</span>
        <span class="summary-value price">¥{{ totalBudget }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import draggable from 'vuedraggable'
import { Clock, Rank, Close, Sunset } from '@element-plus/icons-vue'

const store = useStore()

// ===== 合成预览节点 =====
// 从 store 取已选的景点/美食/酒店，合成为统一有序列表
const previewNodes = computed(() => {
  const nodes = []
  const selectedSpots = store.getters['plan/selectedSpots']
  const selectedFoods = store.getters['plan/selectedFoods']
  const selectedHotel = store.getters['plan/selectedHotel']
  const { selectedHotelId, customHotelName } = store.state.plan

  // 酒店起点
  let hotelData = null
  if (customHotelName) {
    hotelData = { id: 'custom', name: customHotelName }
  } else if (selectedHotel) {
    hotelData = selectedHotel
  }

  if (hotelData) {
    nodes.push({
      id: 'preview_hotel_start',
      type: 'hotel',
      role: 'start',
      data: hotelData,
      order: 0
    })
  }

  // 景点 + 美食混合（先景点后美食再景点的默认模式）
  // 但用户拖拽可以改变顺序
  const spotCount = selectedSpots.length
  const foodCount = selectedFoods.length

  if (spotCount > 0) {
    const morningCount = Math.ceil(spotCount / 2)
    // 上午景点
    for (let i = 0; i < morningCount; i++) {
      nodes.push({
        id: `preview_spot_${i}`,
        type: 'spot',
        data: selectedSpots[i],
        order: nodes.length,
        stayDuration: selectedSpots[i].stay_duration || 30
      })
    }
  }

  // 午餐（第1个美食）
  if (foodCount > 0 && selectedFoods[0]) {
    nodes.push({
      id: 'preview_food_lunch',
      type: 'food',
      data: selectedFoods[0],
      mealType: 'lunch',
      order: nodes.length
    })
  }

  // 下午景点
  if (spotCount > 1) {
    const morningCount = Math.ceil(spotCount / 2)
    for (let i = morningCount; i < spotCount; i++) {
      nodes.push({
        id: `preview_spot_${i}`,
        type: 'spot',
        data: selectedSpots[i],
        order: nodes.length,
        stayDuration: selectedSpots[i].stay_duration || 30
      })
    }
  }

  // 晚餐（第2个美食）
  if (foodCount > 1 && selectedFoods[1]) {
    nodes.push({
      id: 'preview_food_dinner',
      type: 'food',
      data: selectedFoods[1],
      mealType: 'dinner',
      order: nodes.length
    })
  }

  // 酒店终点
  if (hotelData) {
    nodes.push({
      id: 'preview_hotel_end',
      type: 'hotel',
      role: 'end',
      data: hotelData,
      order: nodes.length
    })
  }

  // 预估时间（简单版，精确计算在后端）
  let currentMinutes = 480 // 8:00
  for (const node of nodes) {
    if (node.type === 'hotel') {
      node.startTime = formatTimeMinutes(currentMinutes)
      node.endTime = formatTimeMinutes(currentMinutes)
    } else if (node.type === 'spot') {
      const dur = node.stayDuration || 30
      currentMinutes += 10 // 交通缓冲
      node.startTime = formatTimeMinutes(currentMinutes)
      node.endTime = formatTimeMinutes(currentMinutes + dur)
      currentMinutes += dur
    } else if (node.type === 'food') {
      currentMinutes += 10
      node.startTime = formatTimeMinutes(currentMinutes)
      node.endTime = formatTimeMinutes(currentMinutes + 60)
      currentMinutes += 60
    }
  }

  return nodes
})

const localNodes = ref([])
watch(previewNodes, (val) => {
  const existingIds = new Set(localNodes.value.map(n => n.id))
  const newIds = new Set(val.map(n => n.id))
  // 仅当节点集合真正变化时才更新（避免拖拽中被覆盖）
  if (existingIds.size !== newIds.size || ![...existingIds].every(id => newIds.has(id))) {
    localNodes.value = [...val]
  }
}, { immediate: true, deep: true })

// ===== 计算属性 =====
const totalCount = computed(() => previewNodes.value.length)
const totalDuration = computed(() => {
  return previewNodes.value
    .filter(n => n.type === 'spot')
    .reduce((s, n) => s + (n.stayDuration || 30), 0)
})

const estimatedEndTime = computed(() => {
  const endHotel = previewNodes.value.find(n => n.type === 'hotel' && n.role === 'end')
  return endHotel?.startTime || '--:--'
})

const totalBudget = computed(() => {
  let total = 0
  previewNodes.value.forEach(n => {
    if (n.type === 'spot' && n.data?.ticket_price) total += Number(n.data.ticket_price)
    if (n.type === 'food' && n.data?.price_per_person) total += Number(n.data.price_per_person)
  })
  return total
})

// ===== 工具函数 =====
function formatTimeMinutes(m) {
  const h = Math.floor(m / 60) % 24
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
}

function typeLabel(node) {
  if (node.type === 'hotel') return node.role === 'start' ? '出发' : '住宿'
  if (node.type === 'food') return node.mealType === 'lunch' ? '午餐' : '晚餐'
  return '景点'
}

function hasMealTag(node) {
  return node.type === 'food' && node.mealTag && node.mealTag !== 'on_time'
}

function mealTagText(node) {
  if (node.mealTag === 'early') return '🕐 有点早哦'
  if (node.mealTag === 'late') return '⚠️ 该吃饭啦'
  return ''
}

// ===== 拖拽排序 =====
function onOrderChange() {
  // 只处理 spot 和 food 类型的排序
  // hotel 节点保持不变
  const newOrder = localNodes.value
    .filter(n => n.type === 'spot' || n.type === 'food')
    .map(n => {
      if (n.type === 'spot') {
        const spot = store.getters['plan/selectedSpots'].find(s => s.id === n.data.id || `preview_spot_${store.getters['plan/selectedSpots'].indexOf(s)}` === n.id)
        return spot?.id
      }
      if (n.type === 'food') {
        const food = store.getters['plan/selectedFoods'].find(f => f.id === n.data.id)
        return food?.id
      }
      return null
    })
    .filter(Boolean)

  // 同步回 store
  const spotIds = []
  const foodIds = []
  const seenSpots = new Set()
  const seenFoods = new Set()

  newOrder.forEach(id => {
    const isSpot = store.state.plan.allSpots.some(s => s.id === id) ||
      store.state.plan.customSpots.some(s => s.id === id)
    if (isSpot && !seenSpots.has(id)) {
      spotIds.push(id)
      seenSpots.add(id)
    } else if (!seenFoods.has(id)) {
      foodIds.push(id)
      seenFoods.add(id)
    }
  })

  if (spotIds.length > 0) store.commit('plan/UPDATE_SPOT_ORDER', spotIds)
  if (foodIds.length > 0) store.commit('plan/UPDATE_FOOD_ORDER', foodIds)
}

function handleRemove(node) {
  if (node.type === 'spot') {
    store.commit('plan/REMOVE_SPOT', node.data.id)
  } else if (node.type === 'food') {
    store.commit('plan/REMOVE_FOOD', node.data.id)
  } else if (node.type === 'hotel') {
    store.commit('plan/SELECT_HOTEL', null)
  }
}
</script>

<style lang="scss" scoped>
.timeline-panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

// ===== 面板头部 =====
.panel-header { margin-bottom: 20px; }

.panel-title-row {
  display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
}

.panel-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  &.timeline-icon { background: #eef2ff; color: #6366f1; }
}

.panel-title { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0; }

.panel-badge {
  font-size: 12px; font-weight: 500; color: #64748b;
  background: #f1f5f9; padding: 3px 10px; border-radius: 20px;
}

.panel-hint {
  font-size: 12px; color: #94a3b8; margin-left: 46px;
}

// ===== 空状态 =====
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 32px 20px; color: #94a3b8; gap: 8px;
  border: 2px dashed #e2e8f0; border-radius: 12px;
}

// ===== 预览列表 =====
.preview-list {
  display: flex; flex-direction: column; gap: 6px;
  touch-action: pan-y; /* 移动端：覆盖 vuedraggable 的 touch-action:none，允许垂直滚动 */
}

.preview-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 10px; transition: all 0.2s;

  &.preview-hotel { background: #eff6ff; border: 1px solid #bfdbfe; }
  &.preview-spot  { background: #fef2f2; border: 1px solid #fecaca; }
  &.preview-food  { background: #f0fdf4; border: 1px solid #bbf7d0; }
}

.preview-ghost { opacity: 0.4; border: 2px dashed #6366f1 !important; }

.preview-drag-handle {
  color: #94a3b8; cursor: grab; padding: 4px; flex-shrink: 0;
  border-radius: 6px; transition: all 0.15s;
  &:hover { color: #6366f1; background: #eef2ff; }
  &:active { cursor: grabbing; }
}

.preview-index {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0;
  &.index-hotel { background: #3b82f6; }
  &.index-spot  { background: #ef4444; }
  &.index-food  { background: #10b981; }
}

.preview-info {
  flex: 1; min-width: 0;
}

.preview-name {
  font-size: 14px; font-weight: 600; color: #0f172a;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.preview-type-tag {
  font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px;
  margin-right: 4px; vertical-align: middle;
  &.tag-hotel { background: #dbeafe; color: #2563eb; }
  &.tag-spot  { background: #fee2e2; color: #dc2626; }
  &.tag-food  { background: #dcfce7; color: #059669; }
}

.preview-time {
  font-size: 11px; color: #64748b; display: flex; align-items: center;
  gap: 3px; margin-top: 2px;
}

.preview-duration {
  color: #94a3b8; font-size: 10px;
}

.preview-meal-tag {
  font-size: 10px; font-weight: 500; padding: 1px 6px; border-radius: 8px;
  margin-top: 2px; display: inline-block;
  &.meal-early { background: #fef3c7; color: #92400e; }
  &.meal-late  { background: #fee2e2; color: #dc2626; }
}

.preview-remove-btn {
  flex-shrink: 0; color: #94a3b8; opacity: 0.5;
  &:hover { opacity: 1; color: #ef4444; }
}

// ===== 预估总结 =====
.preview-summary {
  margin-top: 16px; padding: 14px 16px;
  background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;
}

.summary-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 4px 0;
  &:not(:last-child) { border-bottom: 1px dashed #e2e8f0; padding-bottom: 6px; }
}

.summary-label { font-size: 12px; color: #94a3b8; }

.summary-value { font-size: 13px; font-weight: 600; color: #0f172a;
  &.price { color: #6366f1; }
}

@media (max-width: 768px) {
  .timeline-panel { padding: 14px; border-radius: 12px; }
}
</style>


<style lang="scss">
// ==================== 夜间模式 ====================
html.dark-mode {
  .timeline-panel {
    background: rgba(19, 19, 42, 0.8); border-color: rgba(45, 45, 74, 0.8);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  .panel-title { color: #e2dee9; }
  .panel-badge { background: rgba(30, 30, 60, 0.8); color: #94a3b8; }
  .panel-hint { color: #64748b; }
  .empty-state { border-color: rgba(45, 45, 74, 0.7); color: #64748b; }
  .preview-item {
    &.preview-hotel { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.2); }
    &.preview-spot  { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); }
    &.preview-food  { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); }
  }
  .preview-name { color: #e2dee9; }
  .preview-time { color: #94a3b8; }
  .preview-duration { color: #64748b; }
  .preview-drag-handle { color: #4a4a6a; &:hover { color: #a78bfa; background: rgba(99, 102, 241, 0.12); } }
  .preview-remove-btn { color: #64748b; &:hover { color: #f87171; } }
  .preview-summary { background: rgba(26, 26, 46, 0.8); border-color: rgba(45, 45, 74, 0.7); }
  .summary-label { color: #64748b; }
  .summary-value { color: #e2dee9; &.price { color: #a78bfa; } }
  .summary-row:not(:last-child) { border-bottom-color: rgba(45, 45, 74, 0.5); }
  .preview-ghost { border-color: rgba(99, 102, 241, 0.5) !important; }
}
</style>

<template>
  <div class="route-panel">
    <!-- 面板标题 -->
    <div class="panel-header">
      <div class="panel-title-row">
        <span class="panel-icon route-icon">
          <el-icon :size="20"><Flag /></el-icon>
        </span>
        <h3 class="panel-title">路线节点</h3>
        <span class="panel-badge">{{ selectedSpots.length }} 个已选</span>
      </div>
      <span class="panel-hint">拖拽推荐卡片到上方已选区域，或拖拽排序</span>
    </div>

    <!-- ===== 已选路线（可拖拽排序 + 左滑删除） ===== -->
    <div class="selected-area">
      <div v-if="selectedSpots.length === 0" class="empty-drop-zone">
        <el-icon :size="28"><Plus /></el-icon>
        <span>从下方推荐拖拽路线节点到此处</span>
      </div>

      <draggable
        v-else
        v-model="localSelected"
        :group="{ name: 'routeSpots', pull: true, put: true }"
        item-key="id"
        handle=".drag-handle"
        ghost-class="ghost-card"
        :animation="250"
        @change="onSelectedChange"
        class="selected-draggable"
      >
        <template #item="{ element, index }">
          <div
            class="swipe-container"
            @touchstart.prevent="swipe.onTouchStart($event, element.id)"
            @touchmove="swipe.onTouchMove($event, element.id)"
            @touchend="swipe.onTouchEnd($event, element.id)"
            @touchcancel="swipe.onTouchCancel($event, element.id)"
          >
            <!-- 删除背景 -->
            <div class="swipe-delete-bg" @click.stop="handleRemove(element.id)">
              <el-icon :size="20"><Delete /></el-icon>
              <span>删除</span>
            </div>
            <!-- 卡片主体 -->
            <div
              class="spot-card"
              :class="{ 'swiped': (swipe.offsets[element.id] || 0) < -10 }"
              :style="{ transform: `translateX(${swipe.offsets[element.id] || 0}px)` }"
            >
              <div class="drag-handle" title="拖拽排序">
                <el-icon :size="18"><Rank /></el-icon>
              </div>
              <div class="spot-index">{{ index + 1 }}</div>
              <div class="spot-info">
                <div class="spot-name">
                  {{ element.name }}
                  <span v-if="aiRecommended && aiSpotNotes[element.id]" class="ai-badge" :title="aiSpotNotes[element.id]">
                    🤖 {{ aiSpotNotes[element.id] }}
                  </span>
                </div>
                <div class="spot-highlight" v-if="element.highlight">✨ {{ element.highlight }}</div>
                <div class="spot-meta">
                  <el-icon :size="12"><Clock /></el-icon>
                  {{ element.stay_duration }}分钟
                  <template v-if="element.ticket_price"> · ¥{{ element.ticket_price }}</template>
                </div>
              </div>
              <el-button
                class="spot-remove-btn"
                :icon="Close"
                circle
                size="small"
                text
                @click.stop="handleRemove(element.id)"
                title="移除"
              />
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- ===== 推荐路线（可拖拽到已选区域） ===== -->
    <div v-if="availableSpots.length > 0" class="recommend-section">
      <div class="recommend-header">
        <span class="recommend-label">推荐节点</span>
        <span class="recommend-count">{{ availableSpots.length }} 个可选</span>
      </div>

      <draggable
        v-model="localRecommended"
        :group="{ name: 'routeSpots', pull: 'clone', put: false }"
        item-key="id"
        :sort="false"
        :animation="200"
        ghost-class="recommend-ghost"
        class="recommend-draggable"
      >
        <template #item="{ element }">
          <div class="recommend-card">
            <div class="rec-drag-icon">
              <el-icon :size="14"><Plus /></el-icon>
            </div>
            <div class="rec-info">
              <div class="rec-name">{{ element.name }}</div>
              <div class="rec-highlight" v-if="element.highlight">✨ {{ element.highlight }}</div>
              <div class="rec-meta">
                <el-icon :size="12"><Clock /></el-icon> {{ element.stay_duration }}分钟
                <template v-if="element.ticket_price"> · ¥{{ element.ticket_price }}</template>
              </div>
            </div>
            <el-button
              :icon="Plus"
              size="small"
              circle
              type="primary"
              @click.stop="handleAdd(element.id)"
              title="添加"
            />
          </div>
        </template>
      </draggable>
    </div>

    <el-empty v-else description="暂无更多推荐节点" :image-size="40" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import draggable from 'vuedraggable'
import { useSwipeDelete } from '../../composables/useSwipeDelete.js'

const store = useStore()

// ===== 数据 =====
const selectedSpots = computed(() => store.getters['plan/selectedSpots'])
const availableSpots = computed(() => store.getters['plan/availableSpots'])
const aiSpotNotes = computed(() => store.state.plan.aiSpotNotes || {})
const aiRecommended = computed(() => store.state.plan.aiRecommended)

const localSelected = ref([])
const localRecommended = ref([])

watch(selectedSpots, (val) => { localSelected.value = [...val] }, { immediate: true, deep: true })
watch(availableSpots, (val) => { localRecommended.value = [...val] }, { immediate: true, deep: true })

// ===== 左滑删除 =====
const swipe = useSwipeDelete({
  threshold: 70,
  deleteWidth: 72,
  onDelete: (id) => {
    store.commit('plan/REMOVE_SPOT', id)
  }
})

// ===== 操作 =====
function handleRemove(id) {
  swipe.resetCard(id)
  store.commit('plan/REMOVE_SPOT', id)
}

function handleAdd(id) {
  if (selectedSpots.value.find(s => s.id === id)) return
  store.commit('plan/ADD_SPOT', id)
}

// vuedraggable change 事件
function onSelectedChange(evt) {
  swipe.closeAll()

  if (evt.added) {
    // 从推荐列表拖入（clone 模式）
    const newItem = evt.added.element
    // 检查是否已在已选列表中
    if (!store.state.plan.selectedSpotIds.includes(newItem.id)) {
      store.commit('plan/ADD_SPOT', newItem.id)
    }
    // 同步到 store 的顺序
    const order = localSelected.value.map(s => s.id)
    store.commit('plan/UPDATE_SPOT_ORDER', order)
  } else if (evt.moved) {
    // 已选列表内排序
    const order = localSelected.value.map(s => s.id)
    store.commit('plan/UPDATE_SPOT_ORDER', order)
  } else if (evt.removed) {
    // 从已选列表拖出
    handleRemove(evt.removed.element.id)
  }
}
</script>

<style lang="scss" scoped>
.route-panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}

// ===== 面板头部 =====
.panel-header {
  margin-bottom: 20px;
}

.panel-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.panel-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.route-icon {
    background: #fef2f2;
    color: #ef4444;
  }
}

.panel-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.panel-badge {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  background: #f1f5f9;
  padding: 3px 10px;
  border-radius: 20px;
}

.panel-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-left: 46px;
}

// ===== 已选区域 =====
.selected-area {
  margin-bottom: 20px;
  min-height: 48px;
}

.empty-drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 28px;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  color: #94a3b8;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    border-color: #6366f1;
    color: #6366f1;
    background: #f8faff;
  }
}

.selected-draggable {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// ===== 滑动删除容器 =====
.swipe-container {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
}

.swipe-delete-bg {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 72px;
  background: linear-gradient(135deg, #ef4444, #f97316);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  border-radius: 0 12px 12px 0;
  cursor: pointer;
  transition: opacity 0.2s;

  .el-icon {
    font-size: 18px;
  }
}

// ===== 已选卡片 =====
.spot-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              box-shadow 0.2s;
  will-change: transform;
  z-index: 1;

  &:hover {
    background: #fff7ed;
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.1);
  }

  &.swiped {
    border-radius: 12px 0 0 12px;
  }
}

.ghost-card {
  opacity: 0.4;
  background: #fef3c7 !important;
  border: 2px dashed #f59e0b !important;
  border-radius: 12px;
}

.drag-handle {
  color: #94a3b8;
  cursor: grab;
  padding: 4px;
  flex-shrink: 0;
  border-radius: 6px;
  transition: all 0.15s;

  &:hover {
    color: #6366f1;
    background: #eef2ff;
  }

  &:active {
    cursor: grabbing;
    color: #4f46e5;
  }
}

.spot-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ef4444, #f97316);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
}

.spot-info {
  flex: 1;
  min-width: 0;
}

.spot-name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-badge {
  font-size: 11px;
  font-weight: 500;
  color: #92400e;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1px solid #fcd34d;
  padding: 1px 8px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

.spot-highlight {
  font-size: 12px;
  color: #f59e0b;
  margin: 3px 0;
}

.spot-meta {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #94a3b8;
}

.spot-remove-btn {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;

  .spot-card:hover & {
    opacity: 1;
  }
}

// ===== 推荐区域 =====
.recommend-section {
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

.recommend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.recommend-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recommend-count {
  font-size: 12px;
  color: #94a3b8;
  background: #f8fafc;
  padding: 2px 10px;
  border-radius: 10px;
}

.recommend-draggable {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recommend-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: grab;
  transition: all 0.2s;

  &:hover {
    background: #eef2ff;
    border-color: #6366f1;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
    transform: translateY(-1px);
  }

  &:active {
    cursor: grabbing;
    transform: scale(0.98);
  }
}

.recommend-ghost {
  opacity: 0.5;
  background: #eef2ff !important;
  border: 2px dashed #6366f1 !important;
}

.rec-drag-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #eef2ff;
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rec-info {
  flex: 1;
  min-width: 0;
}

.rec-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.rec-highlight {
  font-size: 12px;
  color: #f59e0b;
  margin: 2px 0;
}

.rec-meta {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 3px;
}

// 响应式
@media (max-width: 768px) {
  .route-panel {
    padding: 16px;
    border-radius: 12px;
  }

  .spot-remove-btn {
    opacity: 0.5;
  }

  .panel-hint {
    margin-left: 0;
    display: block;
    margin-top: 4px;
  }
}
</style>

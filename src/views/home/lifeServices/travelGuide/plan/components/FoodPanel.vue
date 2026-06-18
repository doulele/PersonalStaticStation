<template>
  <div class="food-panel">
    <!-- 面板标题 -->
    <div class="panel-header">
      <div class="panel-title-row">
        <span class="panel-icon food-icon">
          <el-icon :size="20"><KnifeFork /></el-icon>
        </span>
        <h3 class="panel-title">特色美食</h3>
        <span class="panel-badge">{{ selectedFoods.length }} / {{ allFoods.length }} 已选</span>
      </div>
      <span class="panel-hint">拖拽推荐卡片到上方已选区域，或拖拽排序</span>
    </div>

    <!-- ===== 已选美食（可拖拽排序 + 左滑删除） ===== -->
    <div class="selected-area">
      <div v-if="selectedFoods.length === 0" class="empty-drop-zone">
        <el-icon :size="28"><Plus /></el-icon>
        <span>从下方推荐拖拽美食到此处</span>
      </div>

      <draggable
        v-else
        v-model="localSelected"
        :group="{ name: 'foods', pull: true, put: true }"
        item-key="id"
        handle=".drag-handle"
        ghost-class="ghost-card"
        :animation="250"
        @change="onSelectedChange"
        class="selected-draggable"
      >
        <template #item="{ element }">
          <div
            class="swipe-container"
            @touchstart.prevent="swipe.onTouchStart($event, element.id)"
            @touchmove="swipe.onTouchMove($event, element.id)"
            @touchend="swipe.onTouchEnd($event, element.id)"
            @touchcancel="swipe.onTouchCancel($event, element.id)"
          >
            <div class="swipe-delete-bg" @click.stop="handleRemove(element.id)">
              <el-icon :size="20"><Delete /></el-icon>
              <span>删除</span>
            </div>
            <div
              class="food-card selected"
              :style="{ transform: `translateX(${swipe.offsets[element.id] || 0}px)` }"
            >
              <div class="drag-handle" title="拖拽排序">
                <el-icon :size="18"><Rank /></el-icon>
              </div>
              <div class="food-check">
                <div class="check-circle checked">
                  <el-icon :size="14"><Check /></el-icon>
                </div>
              </div>
              <div class="food-info">
                <div class="food-name">
                  {{ element.name }}
                  <span v-if="aiRecommended && aiFoodNotes[element.id]" class="ai-badge" :title="aiFoodNotes[element.id]">
                    🤖 {{ aiFoodNotes[element.id] }}
                  </span>
                </div>
                <div class="food-highlight" v-if="element.highlight">✨ {{ element.highlight }}</div>
                <div class="food-dish">推荐：{{ element.recommend_dish }}</div>
              </div>
              <div class="food-price">¥{{ element.price_per_person }}/人</div>
              <el-button
                class="food-remove-btn"
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

    <!-- ===== 推荐美食（可拖拽到已选区域） ===== -->
    <div v-if="availableFoods.length > 0" class="recommend-section">
      <div class="recommend-header">
        <span class="recommend-label">推荐美食</span>
        <span class="recommend-count">{{ availableFoods.length }} 个可选</span>
      </div>

      <draggable
        v-model="localRecommended"
        :group="{ name: 'foods', pull: 'clone', put: false }"
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
            <div class="food-check">
              <div class="check-circle">
                <el-icon :size="12"><Plus /></el-icon>
              </div>
            </div>
            <div class="food-info">
              <div class="food-name">{{ element.name }}</div>
              <div class="food-highlight" v-if="element.highlight">✨ {{ element.highlight }}</div>
              <div class="food-dish">推荐：{{ element.recommend_dish }}</div>
            </div>
            <div class="food-price">¥{{ element.price_per_person }}/人</div>
            <el-button
              :icon="Plus"
              size="small"
              circle
              type="primary"
              @click.stop="handleToggle(element.id)"
              title="添加"
            />
          </div>
        </template>
      </draggable>
    </div>

    <el-empty v-else-if="allFoods.length === 0" description="暂无美食推荐" :image-size="40" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import draggable from 'vuedraggable'
import { useSwipeDelete } from '../../composables/useSwipeDelete.js'

const store = useStore()

const allFoods = computed(() => store.state.plan.allFoods)
const selectedFoodIds = computed(() => store.state.plan.selectedFoodIds)
const aiFoodNotes = computed(() => store.state.plan.aiFoodNotes || {})
const aiRecommended = computed(() => store.state.plan.aiRecommended)

const selectedFoods = computed(() =>
  allFoods.value.filter(f => selectedFoodIds.value.includes(f.id))
)
const availableFoods = computed(() =>
  allFoods.value.filter(f => !selectedFoodIds.value.includes(f.id))
)

const localSelected = ref([])
const localRecommended = ref([])

watch(selectedFoods, (val) => { localSelected.value = [...val] }, { immediate: true, deep: true })
watch(availableFoods, (val) => { localRecommended.value = [...val] }, { immediate: true, deep: true })

// 左滑删除
const swipe = useSwipeDelete({
  threshold: 70,
  deleteWidth: 72,
  onDelete: (id) => {
    store.commit('plan/REMOVE_FOOD', id)
  }
})

function handleRemove(id) {
  swipe.resetCard(id)
  store.commit('plan/REMOVE_FOOD', id)
}

function handleToggle(id) {
  if (selectedFoodIds.value.includes(id)) {
    handleRemove(id)
  } else {
    store.commit('plan/ADD_FOOD', id)
  }
}

function onSelectedChange(evt) {
  swipe.closeAll()

  if (evt.added) {
    const newItem = evt.added.element
    if (!store.state.plan.selectedFoodIds.includes(newItem.id)) {
      store.commit('plan/ADD_FOOD', newItem.id)
    }
    const order = localSelected.value.map(f => f.id)
    store.commit('plan/UPDATE_FOOD_ORDER', order)
  } else if (evt.moved) {
    const order = localSelected.value.map(f => f.id)
    store.commit('plan/UPDATE_FOOD_ORDER', order)
  } else if (evt.removed) {
    handleRemove(evt.removed.element.id)
  }
}
</script>

<style lang="scss" scoped>
.food-panel {
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

  &.food-icon {
    background: #ecfdf5;
    color: #10b981;
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
    border-color: #10b981;
    color: #10b981;
    background: #f0fdf4;
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
.food-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              box-shadow 0.2s;
  will-change: transform;
  z-index: 1;

  &:hover {
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
  }

  &.selected {
    background: #f0fdf4;
    border-color: #86efac;
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
    color: #10b981;
    background: #ecfdf5;
  }

  &:active {
    cursor: grabbing;
    color: #059669;
  }
}

.food-check { flex-shrink: 0; }

.check-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &.checked {
    background: #10b981;
    border-color: #10b981;
    color: #fff;
  }

  .el-icon {
    color: #94a3b8;
  }
}

.food-info { flex: 1; min-width: 0; }

.food-name {
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

.food-highlight {
  font-size: 12px;
  color: #f59e0b;
  margin: 2px 0;
}

.food-dish {
  font-size: 12px;
  color: #64748b;
}

.food-price {
  font-size: 15px;
  font-weight: 700;
  color: #10b981;
  flex-shrink: 0;
}

.food-remove-btn {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;

  .food-card:hover & {
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
    background: #f0fdf4;
    border-color: #86efac;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
    transform: translateY(-1px);
  }

  &:active {
    cursor: grabbing;
    transform: scale(0.98);
  }
}

.recommend-ghost {
  opacity: 0.5;
  background: #ecfdf5 !important;
  border: 2px dashed #10b981 !important;
}

.rec-drag-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ecfdf5;
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// 响应式
@media (max-width: 768px) {
  .food-panel {
    padding: 16px;
    border-radius: 12px;
  }

  .food-remove-btn {
    opacity: 0.5;
  }

  .panel-hint {
    margin-left: 0;
    display: block;
    margin-top: 4px;
  }
}
</style>

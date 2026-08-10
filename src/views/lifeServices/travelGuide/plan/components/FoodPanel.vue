<template>
  <div class="food-panel">
    <!-- 面板标题 -->
    <div class="panel-header">
      <div class="panel-title-row">
        <span class="panel-icon food-icon">
          <el-icon :size="20"><KnifeFork /></el-icon>
        </span>
        <h3 class="panel-title">特色美食</h3>
        <span class="panel-badge">{{ selectedFoods.length }} 个已选</span>
      </div>
    </div>

    <!-- ===== 搜索添加美食（下拉建议） ===== -->
    <div class="food-search-section">
      <el-autocomplete
        v-model="searchKeyword"
        :fetch-suggestions="fetchFoodSuggestions"
        :trigger-on-focus="false"
        :highlight-first-item="true"
        placeholder="搜索附近美食..."
        class="food-search-input"
        popper-class="food-search-dropdown"
        :debounce="400"
        @select="onSearchSelect"
        @keyup.enter.prevent="handleAddCustomName"
      >
        <template #prefix>
          <el-icon :size="16"><Search /></el-icon>
        </template>
        <template #default="{ item }">
          <div v-if="item.noResult" class="search-empty-tip">
            😕 未找到"{{ item.value }}"的匹配结果，按回车直接添加
          </div>
          <div v-else class="search-suggestion-item">
            <span class="sug-name">{{ item.value }}</span>
            <span class="sug-type">{{ item.typeStr }}</span>
            <span v-if="item.distance" class="sug-dist">{{ item.distance }}</span>
          </div>
        </template>
      </el-autocomplete>
      <el-button
        class="search-add-btn"
        type="primary"
        :icon="Plus"
        :disabled="!searchKeyword.trim()"
        @click="handleAddCustomName"
        title="直接添加输入的名称"
      >添加</el-button>
    </div>

    <!-- ===== 已选美食（可拖拽排序 + 左滑删除） ===== -->
    <div class="selected-area">
      <div v-if="selectedFoods.length === 0" class="empty-drop-zone">
        <div class="empty-icon-wrap">
          <el-icon :size="32"><Plus /></el-icon>
        </div>
        <span class="empty-title">尚未选择美食</span>
        <span class="empty-hint">搜索上方或点击下方推荐美食添加到此处</span>
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
        <template #item="{ element, index }">
          <div
            class="swipe-container"
            @touchstart="swipe.onTouchStart($event, element.id)"
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
              <div class="food-index">{{ index + 1 }}</div>
              <div class="food-info">
                <div class="food-name">
                  {{ element.name }}
                  <span v-if="recommendActive && recommendFoodNotes[element.id]" class="ai-badge" :title="recommendFoodNotes[element.id]">
                    💡 {{ recommendFoodNotes[element.id] }}
                  </span>
                </div>
                <div class="food-highlight" v-if="element.highlight">✨ {{ element.highlight }}</div>
                <div class="food-dish" v-if="element.recommend_dish">推荐：{{ element.recommend_dish }}</div>
              </div>
              <div class="food-price" v-if="element.price_per_person">¥{{ element.price_per_person }}/人</div>
              <div class="food-actions">
                <el-button
                  class="food-edit-btn"
                  :icon="Edit"
                  size="small"
                  round
                  @click.stop="openEditDialog(element)"
                >编辑</el-button>
                <el-button
                  class="food-remove-btn"
                  :icon="Close"
                  size="small"
                  round
                  @click.stop="handleRemove(element.id)"
                >删除</el-button>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- ===== 推荐美食（点击选中/取消） ===== -->
    <div v-if="allFoods.length > 0" class="recommend-section">
      <div class="recommend-header">
        <span class="recommend-label">推荐美食</span>
        <span class="recommend-count">{{ availableFoods.length }} 个可选</span>
      </div>

      <div v-if="availableFoods.length > 0" class="recommend-list">
        <div
          v-for="element in availableFoods"
          :key="element.id"
          class="recommend-card"
          @click="handleToggle(element.id)"
          @touchend.prevent="handleToggle(element.id)"
        >
          <div class="rec-info">
            <div class="rec-name">
              <span class="rec-name-text">{{ element.name }}</span>
              <span class="rec-price">¥{{ element.price_per_person }}/人</span>
            </div>
            <div class="rec-desc" v-if="element.highlight || element.recommend_dish">{{ element.highlight || `推荐：${element.recommend_dish}` }}</div>
          </div>
        </div>
      </div>

      <div v-else class="recommend-all-selected">
        🎉 已全部选中！取消已选可重新挑选
      </div>
    </div>

    <el-empty v-else description="暂无美食推荐" :image-size="40" />

    <!-- ===== 编辑美食对话框 ===== -->
    <el-dialog v-model="editDialogVisible" title="编辑美食" width="420px" :close-on-click-modal="false" destroy-on-close>
      <el-form :model="editForm" label-position="top" size="small">
        <el-form-item label="餐厅名称">
          <el-input v-model="editForm.name" placeholder="请输入餐厅名称" />
        </el-form-item>
        <el-form-item label="推荐菜品">
          <el-input v-model="editForm.recommend_dish" placeholder="推荐菜品（选填）" />
        </el-form-item>
        <el-form-item label="人均价格 (¥)">
          <el-input-number v-model="editForm.price_per_person" :min="0" :step="1" :precision="0" controls-position="right" style="width:100%" placeholder="人均价格（选填）" />
        </el-form-item>
        <el-form-item label="亮点">
          <el-input v-model="editForm.highlight" type="textarea" :rows="2" placeholder="亮点描述（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { useStore } from 'vuex'
import draggable from 'vuedraggable'
import { useSwipeDelete } from '../../composables/useSwipeDelete.js'
import { ElMessage } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

const store = useStore()
const API_BASE = '/staticTool/api/travel'

const allFoods = computed(() => store.state.plan.allFoods)
const selectedFoodIds = computed(() => store.state.plan.selectedFoodIds)
const recommendFoodNotes = computed(() => store.state.plan.recommendFoodNotes || {})
const recommendActive = computed(() => store.state.plan.recommendActive)

const selectedFoods = computed(() =>
  allFoods.value.filter(f => selectedFoodIds.value.includes(f.id))
)
const availableFoods = computed(() =>
  allFoods.value.filter(f => !selectedFoodIds.value.includes(f.id))
)

const localSelected = ref([])

watch(selectedFoods, (val) => { localSelected.value = [...val] }, { immediate: true, deep: true })

// 左滑删除
const swipe = useSwipeDelete({
  threshold: 70,
  deleteWidth: 72,
  onDelete: (id) => {
    store.commit('plan/REMOVE_FOOD', id)
  }
})

// ===== 搜索添加美食 =====
const searchKeyword = ref('')

async function fetchFoodSuggestions(keyword, callback) {
  if (!keyword || keyword.trim().length < 1) {
    callback([])
    return
  }
  const attraction = store.state.plan.currentAttraction
  const city = attraction?.city || ''
  const lng = attraction?.lng
  const lat = attraction?.lat
  try {
    const res = await fetch(`${API_BASE}/food-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: keyword.trim(), city, lng, lat })
    })
    const json = await res.json()
    if (json.success && json.data && json.data.length > 0) {
      const suggestions = json.data.map(p => {
        const distKm = p.distance >= 1000 ? `${(p.distance / 1000).toFixed(1)}km` : `${p.distance}m`
        return {
          value: p.name,
          address: p.address || '',
          typeStr: p.type?.split(';').pop() || '',
          distance: distKm,
          lat: p.lat,
          lng: p.lng
        }
      })
      callback(suggestions)
    } else {
      callback([{ value: keyword.trim(), noResult: true }])
    }
  } catch {
    callback([])
  }
}

function onSearchSelect(item) {
  if (item.noResult) return
  const food = {
    id: `custom_food_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: item.value,
    lat: item.lat || 0,
    lng: item.lng || 0,
    recommend_dish: '',
    price_per_person: 0,
    highlight: item.address || ''
  }
  store.commit('plan/ADD_CUSTOM_FOOD', food)
  searchKeyword.value = ''
  ElMessage.success(`已添加"${item.value}"到美食列表`)
}

function handleAddCustomName() {
  const name = searchKeyword.value.trim()
  if (!name) return
  const food = {
    id: `custom_food_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    lat: 0,
    lng: 0,
    recommend_dish: '',
    price_per_person: 0,
    highlight: '自定义添加'
  }
  store.commit('plan/ADD_CUSTOM_FOOD', food)
  searchKeyword.value = ''
  ElMessage.success(`已添加"${name}"到美食列表`)
}

// ===== 编辑美食 =====
const editDialogVisible = ref(false)
const editingFoodId = ref(null)
const editForm = reactive({ name: '', recommend_dish: '', price_per_person: 0, highlight: '' })

function openEditDialog(food) {
  editingFoodId.value = food.id
  editForm.name = food.name
  editForm.recommend_dish = food.recommend_dish || ''
  editForm.price_per_person = food.price_per_person || 0
  editForm.highlight = food.highlight || ''
  editDialogVisible.value = true
}

function saveEdit() {
  if (!editForm.name.trim()) {
    ElMessage.warning('名称不能为空')
    return
  }
  store.commit('plan/UPDATE_FOOD', {
    id: editingFoodId.value,
    name: editForm.name.trim(),
    recommend_dish: editForm.recommend_dish.trim(),
    price_per_person: editForm.price_per_person,
    highlight: editForm.highlight.trim()
  })
  editDialogVisible.value = false
  ElMessage.success('保存成功')
}

// ===== 操作 =====
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

<style lang="scss" scoped src="./FoodPanel.scss"></style>

<style lang="scss">
// 搜索建议下拉（popper 渲染在 body 层，不能 scoped）
.food-search-dropdown {
  .search-suggestion-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 0;
    .sug-name {
      font-weight: 600;
      color: #0f172a;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sug-type {
      font-size: 11px;
      color: #10b981;
      background: #ecfdf5;
      padding: 1px 6px;
      border-radius: 4px;
      flex-shrink: 0;
    }
    .sug-dist {
      font-size: 11px;
      color: #94a3b8;
      flex-shrink: 0;
    }
  }

  .search-empty-tip {
    padding: 12px 16px;
    text-align: center;
    font-size: 13px;
    color: #94a3b8;
  }
}
</style>


<style lang="scss">
// ==================== 夜间模式 ====================
html.dark-mode {
  .food-panel {
    background: rgba(19, 19, 42, 0.8); border-color: rgba(45, 45, 74, 0.8);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    &:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
  }
  .panel-title { color: #e2dee9; }
  .panel-badge { background: rgba(30, 30, 60, 0.8); color: #94a3b8; }
  .food-search-section { border-top-color: rgba(45, 45, 74, 0.6); }
  .empty-drop-zone {
    border-color: rgba(45, 45, 74, 0.7); color: #64748b;
    &:hover { border-color: #4ade80; color: #4ade80; background: rgba(16, 185, 129, 0.06); }
    .empty-icon-wrap { background: rgba(26, 26, 46, 0.8); color: #64748b; }
    &:hover .empty-icon-wrap { background: rgba(16, 185, 129, 0.12); color: #4ade80; }
    .empty-title { color: #94a3b8; }
    .empty-hint { color: #64748b; }
  }
  .food-card {
    background: rgba(26, 26, 46, 0.8); border-color: rgba(45, 45, 74, 0.7);
    &.selected { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); }
  }
  .food-name { color: #e2dee9; }
  .food-dish { color: #64748b; }
  .food-price { color: #4ade80; }
  .food-edit-btn { color: #a78bfa; background: rgba(99, 102, 241, 0.15); border-color: rgba(99, 102, 241, 0.25); }
  .food-remove-btn { color: #f87171; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); }
  .drag-handle { color: #4a4a6a; &:hover { color: #4ade80; background: rgba(16, 185, 129, 0.12); } }
  .ghost-card { background: rgba(251, 191, 36, 0.1) !important; border-color: rgba(251, 191, 36, 0.3) !important; }
  .recommend-section { border-top-color: rgba(45, 45, 74, 0.6); }
  .recommend-label { color: #94a3b8; }
  .recommend-count { background: rgba(26, 26, 46, 0.6); color: #64748b; }
  .recommend-card {
    background: rgba(26, 26, 46, 0.8); border-color: rgba(45, 45, 74, 0.7);
    &:hover { background: rgba(16, 185, 129, 0.08); border-color: #4ade80; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.12); }
  }
  .rec-name-text { color: #e2dee9; }
  .rec-price { color: #4ade80; }
  .rec-desc { color: #64748b; }
  .recommend-all-selected { color: #64748b; }
  .recommend-list::-webkit-scrollbar-thumb { background: #3d3d5c; }
  .ai-badge { color: #fcd34d; background: rgba(251, 191, 36, 0.15); border-color: rgba(251, 191, 36, 0.3); }
}
</style>

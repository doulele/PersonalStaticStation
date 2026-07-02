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
      <!-- <span class="panel-hint">拖拽推荐卡片到上方已选区域，或拖拽排序</span> -->
    </div>

    <!-- ===== 搜索添加景点（下拉建议） ===== -->
    <div class="spot-search-section">
      <el-autocomplete
        v-model="searchKeyword"
        :fetch-suggestions="fetchSpotSuggestions"
        :trigger-on-focus="false"
        :highlight-first-item="true"
        placeholder="搜索当前景点周边的子景点..."
        class="spot-search-input"
        popper-class="spot-search-dropdown"
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

    <!-- ===== 已选路线（可拖拽排序 + 左滑删除） ===== -->
    <div class="selected-area">
      <div v-if="selectedSpots.length === 0" class="empty-drop-zone">
        <div class="empty-icon-wrap">
          <el-icon :size="32"><Plus /></el-icon>
        </div>
        <span class="empty-title">尚未选择路线节点</span>
        <span class="empty-hint">拖拽或点击下方推荐节点添加到此处</span>
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
                  <span v-if="recommendActive && recommendSpotNotes[element.id]" class="ai-badge" :title="recommendSpotNotes[element.id]">
                    💡 {{ recommendSpotNotes[element.id] }}
                  </span>
                </div>
                <div class="spot-highlight" v-if="element.highlight">✨ {{ element.highlight }}</div>
                <div v-if="element.ticket_price" class="spot-meta">
                  ¥{{ element.ticket_price }}
                </div>
              </div>
              <div class="spot-actions">
                <el-button
                  class="spot-edit-btn"
                  :icon="Edit"
                  size="small"
                  round
                  @click.stop="openEditDialog(element)"
                >编辑</el-button>
                <el-button
                  class="spot-remove-btn"
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

    <!-- ===== 推荐路线（可拖拽到已选区域，点击直接添加） ===== -->
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
          <div class="recommend-card" @click="handleAdd(element.id)">
            <div class="rec-info">
              <div class="rec-name">
                <span class="rec-name-text">{{ element.name }}</span>
                <span v-if="element.ticket_price" class="rec-ticket">¥{{ element.ticket_price }}</span>
              </div>
              <div class="rec-desc" v-if="element.desc || element.highlight">{{ element.desc || element.highlight }}</div>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <el-empty v-else description="暂无更多推荐节点" :image-size="40" />

    <!-- ===== 编辑节点对话框 ===== -->
    <el-dialog v-model="editDialogVisible" title="编辑路线节点" width="420px" :close-on-click-modal="false" destroy-on-close>
      <el-form :model="editForm" label-position="top" size="small">
        <el-form-item label="节点名称">
          <el-input v-model="editForm.name" placeholder="请输入节点名称" />
        </el-form-item>
        <el-form-item label="简介 / 亮点">
          <el-input v-model="editForm.highlight" type="textarea" :rows="2" placeholder="简介或亮点（选填）" />
        </el-form-item>
        <el-form-item label="票价 (¥)">
          <el-input-number v-model="editForm.ticket_price" :min="0" :step="1" :precision="0" controls-position="right" style="width:100%" placeholder="票价（选填）" />
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

const store = useStore()

// ===== 数据 =====
const selectedSpots = computed(() => store.getters['plan/selectedSpots'])
const availableSpots = computed(() => store.getters['plan/availableSpots'])
const recommendSpotNotes = computed(() => store.state.plan.recommendSpotNotes || {})
const recommendActive = computed(() => store.state.plan.recommendActive)

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

// ===== 搜索添加景点（下拉建议 + 直接添加） =====
const searchKeyword = ref('')
let searchTimer = null

async function fetchSpotSuggestions(keyword, callback) {
  if (!keyword || keyword.trim().length < 1) {
    callback([])
    return
  }
  const attraction = store.state.plan.currentAttraction
  const city = attraction?.city || ''
  const lng = attraction?.lng
  const lat = attraction?.lat
  try {
    const res = await fetch(`${API_BASE}/spot-search`, {
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
      // 返回一个标记项以保持下拉框打开，显示空状态提示
      callback([{ value: keyword.trim(), noResult: true }])
    }
  } catch {
    callback([])
  }
}

// 用户从下拉列表中选择
function onSearchSelect(item) {
  if (item.noResult) return  // 忽略空结果占位条目
  const spot = {
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: item.value,
    lat: item.lat || 0,
    lng: item.lng || 0,
    stay_duration: 30,
    default_order: 999,
    ticket_price: 0,
    highlight: item.address || '',
    desc: item.address || ''
  }
  store.commit('plan/ADD_CUSTOM_SPOT', spot)
  searchKeyword.value = ''
  ElMessage.success(`已添加"${item.value}"到路线`)
}

// 用户直接输入名称添加（不下拉选择）
function handleAddCustomName() {
  const name = searchKeyword.value.trim()
  if (!name) return
  store.dispatch('plan/geocodeCustomSpot', { name, address: '' })
  searchKeyword.value = ''
  ElMessage.success(`已添加"${name}"到路线`)
}

const API_BASE = '/staticTool/api/travel'

// ===== 编辑节点 =====
const editDialogVisible = ref(false)
const editingSpotId = ref(null)
const editForm = reactive({ name: '', highlight: '', ticket_price: 0 })

function openEditDialog(spot) {
  editingSpotId.value = spot.id
  editForm.name = spot.name
  editForm.highlight = spot.highlight || ''
  editForm.ticket_price = spot.ticket_price || 0
  editDialogVisible.value = true
}

function saveEdit() {
  if (!editForm.name.trim()) {
    ElMessage.warning('节点名称不能为空')
    return
  }
  const spot = selectedSpots.value.find(s => s.id === editingSpotId.value)
  if (spot) {
    store.commit('plan/UPDATE_SPOT', {
      id: editingSpotId.value,
      name: editForm.name.trim(),
      highlight: editForm.highlight.trim(),
      ticket_price: editForm.ticket_price
    })
  }
  editDialogVisible.value = false
  ElMessage.success('保存成功')
}

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
  gap: 6px;
  padding: 32px 28px;
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

  .empty-icon-wrap {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    margin-bottom: 4px;
    transition: all 0.2s;
  }

  &:hover .empty-icon-wrap {
    background: #eef2ff;
    color: #6366f1;
  }

  .empty-title {
    font-size: 14px;
    font-weight: 600;
    color: #64748b;
  }

  .empty-hint {
    font-size: 12px;
    color: #94a3b8;
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

.spot-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.spot-edit-btn {
  flex-shrink: 0;
  font-size: 12px;
  height: 28px;
  padding: 0 10px;
  color: #6366f1;
  background: #eef2ff;
  border-color: #c7d2fe;
  transition: all 0.2s;

  &:hover {
    color: #fff;
    background: #6366f1;
    border-color: #6366f1;
  }
}

.spot-remove-btn {
  flex-shrink: 0;
  font-size: 12px;
  height: 28px;
  padding: 0 10px;
  color: #ef4444;
  background: #fef2f2;
  border-color: #fecaca;
  transition: all 0.2s;

  &:hover {
    color: #fff;
    background: #ef4444;
    border-color: #ef4444;
  }
}

// ===== 搜索添加景点（下拉建议） =====
.spot-search-section {
  display: flex;
  gap: 10px;
  padding: 14px 0;
  border-top: 1px solid #f1f5f9;
}

.spot-search-input {
  flex: 1;
}

.search-add-btn {
  flex-shrink: 0;
  height: auto; // 撑满容器高度与输入框一致
}

// ===== 推荐区域 =====
.recommend-section {
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.recommend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
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
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

.recommend-card {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #eef2ff;
    border-color: #6366f1;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }
}

.recommend-ghost {
  opacity: 0.5;
  background: #eef2ff !important;
  border: 2px dashed #6366f1 !important;
}

.rec-info {
  flex: 1;
  min-width: 0;
}

.rec-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rec-name-text {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rec-ticket {
  font-size: 11px;
  color: #ef4444;
  font-weight: 600;
  background: #fef2f2;
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.rec-desc {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rec-meta {
  font-size: 11px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 1px;
}

// 响应式
@media (max-width: 768px) {
  .route-panel {
    padding: 14px;
    border-radius: 12px;
  }

  .panel-header {
    margin-bottom: 14px;
  }

  .panel-title {
    font-size: 15px;
  }

  .panel-hint {
    margin-left: 0;
    display: block;
    margin-top: 4px;
    font-size: 11px;
  }

  .spot-card {
    padding: 12px 14px;
  }

  .spot-name {
    font-size: 14px;
  }

  .spot-meta {
    font-size: 11px;
  }

  .recommend-card {
    padding: 8px 12px;
  }

  .rec-name-text {
    font-size: 12px;
  }

  .rec-desc {
    font-size: 10px;
  }

  .rec-meta {
    font-size: 10px;
  }
}
</style>

<style lang="scss">
// 搜索建议下拉（popper 渲染在 body 层，不能 scoped）
.spot-search-dropdown {
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
      color: #6366f1;
      background: #eef2ff;
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

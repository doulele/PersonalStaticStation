<template>
  <div class="hotel-panel">
    <!-- 面板标题 -->
    <div class="panel-header">
      <div class="panel-title-row">
        <span class="panel-icon hotel-icon">
          <el-icon :size="20"><HomeFilled /></el-icon>
        </span>
        <h3 class="panel-title">住宿安排</h3>
        <span class="panel-badge">{{ allHotels.length }} 家可选</span>
      </div>
    </div>

    <!-- ===== 搜索添加酒店（下拉建议） ===== -->
    <div class="hotel-search-section">
      <el-autocomplete
        v-model="searchKeyword"
        :fetch-suggestions="fetchHotelSuggestions"
        :trigger-on-focus="false"
        :highlight-first-item="true"
        placeholder="搜索附近酒店..."
        class="hotel-search-input"
        popper-class="hotel-search-dropdown"
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

    <!-- ===== 已选住宿（可左滑删除） ===== -->
    <div class="selected-area">
      <!-- 已选推荐酒店 -->
      <div v-if="selectedHotel" class="selected-item">
        <div
          class="swipe-container"
          @touchstart="swipe.onTouchStart($event, 'selected')"
          @touchmove="swipe.onTouchMove($event, 'selected')"
          @touchend="swipe.onTouchEnd($event, 'selected')"
          @touchcancel="swipe.onTouchCancel($event, 'selected')"
        >
          <div class="swipe-delete-bg" @click.stop="handleClear">
            <el-icon :size="20"><Delete /></el-icon>
            <span>取消</span>
          </div>
          <div
            class="hotel-card selected"
            :style="{ transform: `translateX(${swipe.offsets['selected'] || 0}px)` }"
          >
            <div class="hotel-check">
              <div class="check-dot checked">
                <el-icon :size="14"><Check /></el-icon>
              </div>
            </div>
            <div class="hotel-info">
              <div class="hotel-name">
                {{ selectedHotel.name }}
                <span v-if="recommendActive && recommendHotelNote" class="ai-badge" :title="recommendHotelNote">
                    💡 {{ recommendHotelNote }}
                </span>
              </div>
              <div class="hotel-highlight" v-if="selectedHotel.highlight">✨ {{ selectedHotel.highlight }}</div>
              <div class="hotel-meta">
                <span>{{ selectedHotel.price_range }}</span>
                <span v-if="selectedHotel.rating"> · ⭐ {{ selectedHotel.rating }}</span>
              </div>
            </div>
            <div class="hotel-actions">
              <el-button
                class="hotel-edit-btn"
                :icon="Edit"
                size="small"
                round
                @click.stop="openEditDialog(selectedHotel)"
              >编辑</el-button>
              <el-button
                class="hotel-remove-btn"
                :icon="Close"
                size="small"
                round
                @click.stop="handleClear"
              >取消</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 已选自定义酒店 -->
      <div v-else-if="selectedHotelId === 'custom'" class="selected-item">
        <div
          class="swipe-container"
          @touchstart="swipe.onTouchStart($event, 'selected')"
          @touchmove="swipe.onTouchMove($event, 'selected')"
          @touchend="swipe.onTouchEnd($event, 'selected')"
          @touchcancel="swipe.onTouchCancel($event, 'selected')"
        >
          <div class="swipe-delete-bg" @click.stop="handleClear">
            <el-icon :size="20"><Delete /></el-icon>
            <span>取消</span>
          </div>
          <div
            class="hotel-card custom-selected"
            :style="{ transform: `translateX(${swipe.offsets['selected'] || 0}px)` }"
          >
            <div class="hotel-check">
              <div class="check-dot checked custom-check">
                <el-icon :size="14"><Check /></el-icon>
              </div>
            </div>
            <div class="hotel-info">
              <div class="hotel-name custom-text">{{ customHotelName || '用户自定义' }}</div>
            </div>
            <div class="hotel-actions">
              <el-button
                class="hotel-remove-btn"
                :icon="Close"
                size="small"
                round
                @click.stop="handleClear"
              >取消</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 未选择 -->
      <div v-else class="empty-drop-zone">
        <div class="empty-icon-wrap">
          <el-icon :size="32"><Plus /></el-icon>
        </div>
        <span class="empty-title">尚未选择住宿</span>
        <span class="empty-hint">搜索酒店或点击下方推荐酒店</span>
      </div>
    </div>

    <!-- ===== 推荐住宿（点击直接选择） ===== -->
    <div v-if="allHotels.length > 0" class="recommend-section">
      <div class="recommend-header">
        <span class="recommend-label">推荐住宿</span>
        <span class="recommend-count">{{ availableHotels.length }} 个可选</span>
      </div>

      <div v-if="availableHotels.length > 0" class="recommend-list">
        <div
          v-for="hotel in availableHotels"
          :key="hotel.id"
          class="recommend-card"
          @click="handleSelect(hotel.id)"
          @touchend.prevent="handleSelect(hotel.id)"
        >
          <div class="rec-info">
            <div class="rec-name">
              <span class="rec-name-text">{{ hotel.name }}</span>
              <span v-if="hotel.rating" class="rec-rating">⭐ {{ hotel.rating }}</span>
            </div>
            <div class="rec-desc" v-if="hotel.highlight || hotel.desc">{{ hotel.highlight || hotel.desc }}</div>
            <div class="rec-meta">
              <span v-if="hotel.price_range" class="rec-price-range">{{ hotel.price_range }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="recommend-all-selected">
        🎉 已选中！取消选择可重新挑选
      </div>


    </div>

    <el-empty v-else description="暂无酒店推荐" :image-size="40" />

    <!-- ===== 编辑酒店对话框 ===== -->
    <el-dialog v-model="editDialogVisible" title="编辑酒店" width="420px" :close-on-click-modal="false" destroy-on-close>
      <el-form :model="editForm" label-position="top" size="small">
        <el-form-item label="酒店名称">
          <el-input v-model="editForm.name" placeholder="请输入酒店名称" />
        </el-form-item>
        <el-form-item label="价格范围">
          <el-input v-model="editForm.price_range" placeholder="如：300-500元/晚" />
        </el-form-item>
        <el-form-item label="评分">
          <el-input-number v-model="editForm.rating" :min="0" :max="5" :step="0.1" :precision="2" controls-position="right" style="width:100%" placeholder="评分（选填）" />
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
import { ref, computed, reactive } from 'vue'
import { useStore } from 'vuex'
import { useSwipeDelete } from '../../composables/useSwipeDelete.js'
import { ElMessage } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

const store = useStore()
const API_BASE = '/staticTool/api/travel'

const allHotels = computed(() => store.state.plan.allHotels)
const selectedHotelId = computed(() => store.state.plan.selectedHotelId)
const customHotelName = computed(() => store.state.plan.customHotelName)
const selectedHotel = computed(() => store.getters['plan/selectedHotel'])
const recommendHotelNote = computed(() => store.state.plan.recommendHotelNote || '')
const recommendActive = computed(() => store.state.plan.recommendActive)

const availableHotels = computed(() =>
  allHotels.value.filter(h => h.id !== selectedHotelId.value)
)



// 左滑取消选择
const swipe = useSwipeDelete({
  threshold: 70,
  deleteWidth: 72,
  onDelete: () => {
    store.commit('plan/SELECT_HOTEL', null)
  }
})

// ===== 搜索添加酒店 =====
const searchKeyword = ref('')

async function fetchHotelSuggestions(keyword, callback) {
  if (!keyword || keyword.trim().length < 1) {
    callback([])
    return
  }
  const attraction = store.state.plan.currentAttraction
  const city = attraction?.city || ''
  const lng = attraction?.lng
  const lat = attraction?.lat
  try {
    const res = await fetch(`${API_BASE}/hotel-search`, {
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
  // 清除原有选择，设置为自定义酒店
  store.commit('plan/SET_CUSTOM_HOTEL_NAME', item.value)
  store.commit('plan/SELECT_HOTEL', 'custom')
  searchKeyword.value = ''
  ElMessage.success(`已选择"${item.value}"作为住宿`)
}

function handleAddCustomName() {
  const name = searchKeyword.value.trim()
  if (!name) return
  store.commit('plan/SET_CUSTOM_HOTEL_NAME', name)
  store.commit('plan/SELECT_HOTEL', 'custom')
  searchKeyword.value = ''
  ElMessage.success(`已选择"${name}"作为住宿`)
}

// ===== 编辑酒店 =====
const editDialogVisible = ref(false)
const editingHotelId = ref(null)
const editForm = reactive({ name: '', price_range: '', rating: 0, highlight: '' })

function openEditDialog(hotel) {
  editingHotelId.value = hotel.id
  editForm.name = hotel.name
  editForm.price_range = hotel.price_range || ''
  editForm.rating = parseFloat(hotel.rating) || 0
  editForm.highlight = hotel.highlight || ''
  editDialogVisible.value = true
}

function saveEdit() {
  if (!editForm.name.trim()) {
    ElMessage.warning('酒店名称不能为空')
    return
  }
  store.commit('plan/UPDATE_HOTEL', {
    id: editingHotelId.value,
    name: editForm.name.trim(),
    price_range: editForm.price_range.trim(),
    rating: editForm.rating,
    highlight: editForm.highlight.trim()
  })
  editDialogVisible.value = false
  ElMessage.success('保存成功')
}

// ===== 操作 =====
function handleSelect(id) {
  swipe.resetCard('selected')
  store.commit('plan/SELECT_HOTEL', id)
}

function handleClear() {
  swipe.resetCard('selected')
  store.commit('plan/SELECT_HOTEL', null)
}
</script>

<style lang="scss" scoped>
.hotel-panel {
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
  margin-bottom: 16px;
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

  &.hotel-icon {
    background: #eff6ff;
    color: #3b82f6;
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

// ===== 搜索添加酒店 =====
.hotel-search-section {
  display: flex;
  gap: 10px;
  padding: 14px 0;
  border-top: 1px solid #f1f5f9;
}

.hotel-search-input {
  flex: 1;
}

.search-add-btn {
  flex-shrink: 0;
  height: auto;
}

// ===== 已选区域 =====
.selected-area {
  margin-bottom: 20px;
  min-height: 48px;
}

.selected-item {
  // 单项已选
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
    border-color: #3b82f6;
    color: #3b82f6;
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
    background: #eff6ff;
    color: #3b82f6;
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

// ===== 滑动删除容器 =====
.swipe-container {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  touch-action: pan-y; /* 允许垂直滚动，水平滑动留给 JS 处理 */
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

// ===== 酒店卡片 =====
.hotel-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              box-shadow 0.2s;
  will-change: transform;
  z-index: 1;

  &.selected {
    background: #eff6ff;
    border-color: #93c5fd;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  }

  &.custom-selected {
    background: #eef2ff;
    border-color: #a5b4fc;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
  }
}

.hotel-check { flex-shrink: 0; }

.check-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &.checked {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #fff;
  }

  &.custom-check {
    background: #6366f1;
    border-color: #6366f1;
  }
}

.hotel-info { flex: 1; min-width: 0; }

.hotel-name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;

  &.custom-text {
    color: #6366f1;
  }
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

.hotel-highlight {
  font-size: 12px;
  color: #f59e0b;
  margin: 2px 0;
}

.hotel-meta {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.hotel-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.hotel-edit-btn {
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

.hotel-remove-btn {
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

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 4px;
  touch-action: pan-y; /* 移动端：允许垂直滚动 */

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
  touch-action: manipulation; /* 移动端：允许点击 */
  transition: all 0.2s;

  &:hover {
    background: #eff6ff;
    border-color: #93c5fd;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }


}

.recommend-all-selected {
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
  padding: 12px 0;
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
  flex: 1;
  min-width: 0;
}

.rec-rating {
  font-size: 11px;
  color: #f59e0b;
  font-weight: 600;
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
  color: #64748b;
  margin-top: 1px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rec-price-range {
  font-size: 11px;
  color: #3b82f6;
  font-weight: 500;
  background: #eff6ff;
  padding: 1px 6px;
  border-radius: 4px;
}

// 响应式
@media (max-width: 768px) {
  .hotel-panel {
    padding: 14px;
    border-radius: 12px;
  }

  .panel-header {
    margin-bottom: 14px;
  }

  .panel-title {
    font-size: 15px;
  }

  .hotel-card {
    padding: 14px;
  }

  .hotel-name {
    font-size: 14px;
  }

  .hotel-meta {
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
.hotel-search-dropdown {
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
      color: #3b82f6;
      background: #eff6ff;
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
  .hotel-panel {
    background: rgba(19, 19, 42, 0.8); border-color: rgba(45, 45, 74, 0.8);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    &:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
  }
  .panel-title { color: #e2dee9; }
  .panel-badge { background: rgba(30, 30, 60, 0.8); color: #94a3b8; }
  .hotel-search-section { border-top-color: rgba(45, 45, 74, 0.6); }
  .empty-drop-zone {
    border-color: rgba(45, 45, 74, 0.7); color: #64748b;
    &:hover { border-color: #60a5fa; color: #60a5fa; background: rgba(59, 130, 246, 0.06); }
    .empty-icon-wrap { background: rgba(26, 26, 46, 0.8); color: #64748b; }
    &:hover .empty-icon-wrap { background: rgba(59, 130, 246, 0.12); color: #60a5fa; }
    .empty-title { color: #94a3b8; }
    .empty-hint { color: #64748b; }
  }
  .hotel-card {
    background: rgba(26, 26, 46, 0.8); border-color: rgba(45, 45, 74, 0.7);
    &.selected { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3); box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08); }
    &.custom-selected { background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.3); box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08); }
  }
  .hotel-name { color: #e2dee9; }
  .hotel-meta { color: #94a3b8; }
  .hotel-edit-btn { color: #a78bfa; background: rgba(99, 102, 241, 0.15); border-color: rgba(99, 102, 241, 0.25); }
  .hotel-remove-btn { color: #f87171; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); }
  .recommend-section { border-top-color: rgba(45, 45, 74, 0.6); }
  .recommend-label { color: #94a3b8; }
  .recommend-count { background: rgba(26, 26, 46, 0.6); color: #64748b; }
  .recommend-card {
    background: rgba(26, 26, 46, 0.8); border-color: rgba(45, 45, 74, 0.7);
    &:hover { background: rgba(59, 130, 246, 0.08); border-color: #60a5fa; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12); }
  }
  .rec-name-text { color: #e2dee9; }
  .rec-rating { color: #fbbf24; }
  .rec-desc { color: #64748b; }
  .rec-meta { color: #94a3b8; }
  .rec-price-range { background: rgba(59, 130, 246, 0.12); color: #60a5fa; }
  .recommend-all-selected { color: #64748b; }
  .recommend-list::-webkit-scrollbar-thumb { background: #3d3d5c; }
  .ai-badge { color: #fcd34d; background: rgba(251, 191, 36, 0.15); border-color: rgba(251, 191, 36, 0.3); }
}
</style>

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

<style lang="scss" scoped src="./HotelPanel.scss"></style>

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

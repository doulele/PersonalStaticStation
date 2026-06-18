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
      <span class="panel-hint">单选住宿，从推荐拖拽或点击替换</span>
    </div>

    <!-- ===== 已选住宿（可左滑删除） ===== -->
    <div class="selected-area">
      <!-- 已选推荐酒店 -->
      <div v-if="selectedHotel" class="selected-item">
        <div
          class="swipe-container"
          @touchstart.prevent="swipe.onTouchStart($event, 'selected')"
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
                <span v-if="aiRecommended && aiHotelNote" class="ai-badge" :title="aiHotelNote">
                  🤖 {{ aiHotelNote }}
                </span>
              </div>
              <div class="hotel-highlight" v-if="selectedHotel.highlight">✨ {{ selectedHotel.highlight }}</div>
              <div class="hotel-meta">
                <span>{{ selectedHotel.price_range }}</span>
                <span v-if="selectedHotel.rating"> · ⭐ {{ selectedHotel.rating }}</span>
              </div>
            </div>
            <el-button
              class="hotel-remove-btn"
              :icon="Close"
              circle
              size="small"
              text
              @click.stop="handleClear"
              title="取消选择"
            />
          </div>
        </div>
      </div>

      <!-- 已选自定义酒店 -->
      <div v-else-if="selectedHotelId === 'custom'" class="selected-item">
        <div
          class="swipe-container"
          @touchstart.prevent="swipe.onTouchStart($event, 'selected')"
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
            <el-button
              class="hotel-remove-btn"
              :icon="Close"
              circle
              size="small"
              text
              @click.stop="handleClear"
              title="取消选择"
            />
          </div>
        </div>
      </div>

      <!-- 未选择 -->
      <div v-else class="empty-drop-zone">
        <el-icon :size="28"><Plus /></el-icon>
        <span>从下方推荐拖拽或选择住宿</span>
      </div>
    </div>

    <!-- ===== 推荐住宿 ===== -->
    <div class="recommend-section">
      <div class="recommend-header">
        <span class="recommend-label">推荐住宿</span>
        <span class="recommend-count">{{ availableHotels.length }} 个可选</span>
      </div>

      <div class="recommend-list">
        <div
          v-for="hotel in availableHotels"
          :key="hotel.id"
          class="recommend-card"
          draggable="true"
          @dragstart="onDragStart($event, hotel)"
          @click="handleSelect(hotel.id)"
        >
          <div class="hotel-check">
            <div class="check-dot"></div>
          </div>
          <div class="hotel-info">
            <div class="hotel-name">{{ hotel.name }}</div>
            <div class="hotel-highlight" v-if="hotel.highlight">✨ {{ hotel.highlight }}</div>
            <div class="hotel-meta">
              <span>{{ hotel.price_range }}</span>
              <span v-if="hotel.rating"> · ⭐ {{ hotel.rating }}</span>
            </div>
          </div>
          <el-button
            :icon="Plus"
            size="small"
            circle
            type="primary"
            @click.stop="handleSelect(hotel.id)"
            title="选择"
          />
        </div>
      </div>

      <!-- 自定义选项 -->
      <div class="custom-divider"><span>或</span></div>
      <div
        class="recommend-card custom-card"
        :class="{ active: selectedHotelId === 'custom' }"
        @click="handleSelect('custom')"
      >
        <div class="hotel-check">
          <div class="check-dot" :class="{ checked: selectedHotelId === 'custom' }">
            <el-icon v-if="selectedHotelId === 'custom'" :size="12"><Check /></el-icon>
          </div>
        </div>
        <div class="hotel-info">
          <div class="hotel-name custom-text">用户自定义</div>
          <div class="hotel-meta">手动输入酒店名称</div>
        </div>
        <el-icon v-if="selectedHotelId === 'custom'" color="#6366f1" :size="18"><Check /></el-icon>
        <el-icon v-else :size="18"><Plus /></el-icon>
      </div>

      <transition name="el-fade-in">
        <div v-if="selectedHotelId === 'custom'" class="custom-input-row">
          <el-input
            v-model="customName"
            placeholder="输入酒店名称..."
            size="default"
            clearable
            @input="handleCustomInput"
          />
        </div>
      </transition>
    </div>

    <el-empty v-if="allHotels.length === 0 && selectedHotelId !== 'custom'" description="暂无酒店推荐" :image-size="40" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useSwipeDelete } from '../../composables/useSwipeDelete.js'

const store = useStore()

const allHotels = computed(() => store.state.plan.allHotels)
const selectedHotelId = computed(() => store.state.plan.selectedHotelId)
const customHotelName = computed(() => store.state.plan.customHotelName)
const selectedHotel = computed(() => store.getters['plan/selectedHotel'])
const aiHotelNote = computed(() => store.state.plan.aiHotelNote || '')
const aiRecommended = computed(() => store.state.plan.aiRecommended)

const availableHotels = computed(() =>
  allHotels.value.filter(h => h.id !== selectedHotelId.value)
)

const customName = ref(store.state.plan.customHotelName || '')
watch(() => store.state.plan.customHotelName, (val) => { customName.value = val || '' })

// 左滑取消选择
const swipe = useSwipeDelete({
  threshold: 70,
  deleteWidth: 72,
  onDelete: () => {
    store.commit('plan/SELECT_HOTEL', null)
  }
})

function handleSelect(id) {
  swipe.resetCard('selected')
  store.commit('plan/SELECT_HOTEL', id)
}

function handleClear() {
  swipe.resetCard('selected')
  store.commit('plan/SELECT_HOTEL', null)
}

function handleCustomInput(val) {
  store.commit('plan/SET_CUSTOM_HOTEL_NAME', val)
}

// 拖拽到已选区域
function onDragStart(e, hotel) {
  e.dataTransfer.effectAllowed = 'copy'
  e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'hotel', id: hotel.id }))
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

.selected-item {
  // 单项已选
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
    border-color: #3b82f6;
    color: #3b82f6;
    background: #f8faff;
  }
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

.hotel-remove-btn {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;

  .hotel-card:hover & {
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

.recommend-list {
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
  cursor: pointer;
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

  &.custom-card {
    border-style: dashed;

    .hotel-name {
      color: #6366f1;
    }

    &:hover {
      background: #eef2ff;
      border-color: #a5b4fc;
    }
  }
}

.custom-divider {
  text-align: center;
  margin: 8px 0;

  span {
    font-size: 12px;
    color: #94a3b8;
    background: #fff;
    padding: 0 12px;
  }
}

.custom-input-row {
  margin-top: 12px;
}

// 响应式
@media (max-width: 768px) {
  .hotel-panel {
    padding: 16px;
    border-radius: 12px;
  }

  .hotel-remove-btn {
    opacity: 0.5;
  }

  .panel-hint {
    margin-left: 0;
    display: block;
    margin-top: 4px;
  }
}
</style>

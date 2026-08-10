<template>
  <teleport to="body">
    <transition name="dialog-fade">
      <div v-if="visible" class="dialog-overlay" @click.self="handleCancel">
        <div class="dialog-panel">
          <!-- 头部 -->
          <div class="dialog-header">
            <div class="dialog-title-row">
              <svg class="dialog-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span>已选景点 ({{ attractions.length }})</span>
            </div>
            <button class="dialog-close" @click="handleCancel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- 空状态 -->
          <div v-if="!attractions.length" class="dialog-empty">
            <span class="empty-icon">📋</span>
            <span>暂未选择景点，长按卡片拖入右下角按钮即可添加</span>
          </div>

          <!-- 景点列表 -->
          <div v-else class="dialog-list" ref="listRef">
            <div
              v-for="(item, idx) in displayList"
              :key="item.id"
              class="dialog-item"
              :class="{
                'dragging': dragIdx === idx,
                'drag-over-before': dragIdx !== null && dragIdx !== idx && dragOverIdx === idx,
                'drag-over-after': dragIdx !== null && dragIdx !== idx && dragOverIdx === displayList.length && idx === displayList.length - 1
              }"
              :style="{
                '--card-color': item.color || '#6366f1',
                transform: dragIdx === idx ? `translateY(${dragOffsetY}px)` : '',
                opacity: dragIdx === idx ? 0.6 : 1,
                transition: dragIdx === idx ? 'none' : 'all 0.2s'
              }"
            >
              <!-- 拖拽排序手柄 -->
              <span
                class="drag-handle"
                :class="{ active: dragIdx === idx }"
                @pointerdown.stop="onDragHandleDown($event, idx)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/>
                </svg>
              </span>

              <!-- 序号 -->
              <span class="item-index">{{ idx + 1 }}</span>

              <!-- 内容 -->
              <div class="item-content">
                <span class="item-emoji">{{ item.emoji || '📍' }}</span>
                <div class="item-info">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-sub">
                    <template v-if="item.region">{{ item.region }}</template>
                    <template v-if="item.city"> · {{ item.city }}</template>
                    <template v-if="item.rating"> · ⭐{{ item.rating }}</template>
                  </span>
                </div>
              </div>

              <!-- 操作 -->
              <button class="item-remove" @click.stop="handleRemove(idx)" title="移除">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </button>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div class="dialog-footer">
            <button class="footer-btn secondary" @click="handleClear">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              清空
            </button>
            <button
              v-if="attractions.length > 1"
              class="footer-btn secondary"
              @click="handleAutoSort"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              地理位置排序
            </button>
            <div class="footer-spacer"></div>
            <button class="footer-btn cancel" @click="handleCancel">取消</button>
            <button class="footer-btn confirm" :disabled="!attractions.length" @click="handleConfirm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              确定规划
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  attractions: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'confirm', 'remove', 'reorder', 'clear', 'auto-sort'])

const listRef = ref(null)

// ===== 拖拽排序状态 =====
const dragIdx = ref(null)       // 正在拖拽的项索引
const dragOverIdx = ref(null)   // 拖拽悬停目标索引（插入到该项之前）
const dragStartY = ref(0)
const dragOffsetY = ref(0)
const itemHeights = ref([])     // 各列表项的 top 位置缓存

// 使用 computed 显示列表（实际数据来自 props.attractions）
const displayList = computed(() => props.attractions)

// 缓存各列表项的 Y 位置
function cacheItemPositions() {
  if (!listRef.value) return
  const items = listRef.value.querySelectorAll('.dialog-item')
  itemHeights.value = []
  items.forEach(el => {
    const rect = el.getBoundingClientRect()
    itemHeights.value.push({ top: rect.top, bottom: rect.bottom, height: rect.height })
  })
}

function getTargetIndex(clientY) {
  const positions = itemHeights.value
  for (let i = 0; i < positions.length; i++) {
    const mid = positions[i].top + positions[i].height / 2
    if (clientY < mid) return i
  }
  return positions.length
}

// ===== 拖拽手柄事件 =====
function onDragHandleDown(e, idx) {
  e.preventDefault()
  const touch = e.touches?.[0]
  const clientY = touch ? touch.clientY : e.clientY

  dragIdx.value = idx
  dragStartY.value = clientY
  dragOffsetY.value = 0
  dragOverIdx.value = idx
  cacheItemPositions()

  document.addEventListener('pointermove', onPointerMove)
  document.addEventListener('pointerup', onPointerUp)
  document.addEventListener('pointercancel', onPointerUp)
  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('touchend', onPointerUp)
  document.addEventListener('touchcancel', onPointerUp)
  document.body.style.userSelect = 'none'
  document.body.style.webkitUserSelect = 'none'
}

function onTouchMove(e) {
  e.preventDefault()
  const clientY = e.touches?.[0]?.clientY
  if (clientY == null) return
  onPointerMove({ clientY })
}

function onPointerMove(e) {
  if (dragIdx.value === null) return
  const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0
  dragOffsetY.value = clientY - dragStartY.value
  dragOverIdx.value = getTargetIndex(clientY)
}

function onPointerUp() {
  if (dragIdx.value === null) return
  cleanupListeners()

  const from = dragIdx.value
  const to = dragOverIdx.value

  if (from !== to && to !== null && to >= 0 && to <= displayList.value.length) {
    const arr = [...displayList.value]
    const [item] = arr.splice(from, 1)
    // adjustedTo：如果目标在 from 之后，splice 后索引会偏移
    const adjustedTo = to > from ? to - 1 : to
    arr.splice(adjustedTo, 0, item)
    emit('reorder', arr)
  }

  dragIdx.value = null
  dragOverIdx.value = null
  dragOffsetY.value = 0
}

function cleanupListeners() {
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
  document.removeEventListener('pointercancel', onPointerUp)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onPointerUp)
  document.removeEventListener('touchcancel', onPointerUp)
  document.body.style.userSelect = ''
  document.body.style.webkitUserSelect = ''
}

onUnmounted(() => cleanupListeners())

function handleConfirm() {
  if (props.attractions.length) {
    emit('confirm', [...props.attractions])
  }
}

function handleCancel() {
  emit('close')
}

function handleRemove(idx) {
  emit('remove', idx)
}

function handleClear() {
  emit('clear')
}

function handleAutoSort() {
  emit('auto-sort')
}
</script>

<style lang="scss" scoped src="./SelectionDialog.scss"></style>

<style lang="scss">
// ==================== 夜间模式 ====================
html.dark-mode {
  .dialog-overlay {
    background: rgba(0, 0, 0, 0.6);
  }

  .dialog-panel {
    background: rgba(19, 19, 42, 0.97);
    border-color: rgba(45, 45, 74, 0.9);
  }

  .dialog-header {
    border-bottom-color: rgba(45, 45, 74, 0.8);
  }
  .dialog-title-row {
    color: #e2dee9;
  }
  .dialog-close {
    background: rgba(26, 26, 46, 0.8);
    svg { color: #64748b; }
    &:hover { background: rgba(45, 45, 74, 0.8); svg { color: #e2dee9; } }
  }

  .dialog-empty { color: #64748b; }

  .dialog-list {
    &::-webkit-scrollbar-thumb { background: #3d3d5c; }
  }

  .dialog-item {
    background: rgba(26, 26, 46, 0.8);
    border-color: rgba(45, 45, 74, 0.7);
    &:hover {
      border-color: var(--card-color);
      box-shadow: 0 4px 16px rgba(124, 58, 237, 0.15);
    }
  }
  .drag-handle { color: #4a4a6a; &:active, &.active { color: #a78bfa; } }
  .item-name { color: #e2dee9; }
  .item-sub { color: #64748b; }
  .item-remove {
    svg { color: #64748b; }
    &:hover { background: #3b1010; svg { color: #f87171; } }
  }

  .dialog-footer {
    border-top-color: rgba(45, 45, 74, 0.8);
  }

  .footer-btn {
    &.secondary {
      background: rgba(26, 26, 46, 0.8);
      color: #94a3b8;
      border-color: rgba(45, 45, 74, 0.6);
      &:hover { background: rgba(45, 45, 74, 0.6); color: #e2dee9; }
    }
    &.cancel {
      background: rgba(26, 26, 46, 0.8);
      color: #94a3b8;
      border-color: rgba(45, 45, 74, 0.8);
      &:hover { border-color: #64748b; color: #e2dee9; }
    }
  }
}
</style>

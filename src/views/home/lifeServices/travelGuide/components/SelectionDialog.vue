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

<style lang="scss" scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.dialog-panel {
  width: 100%;
  max-width: 460px;
  max-height: 75vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 头部
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(241, 245, 249, 0.8);
  flex-shrink: 0;
}
.dialog-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}
.dialog-title-icon {
  width: 22px;
  height: 22px;
  color: #ef4444;
  fill: rgba(239, 68, 68, 0.1);
}
.dialog-close {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: none;
  background: rgba(241, 245, 249, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  svg { width: 18px; height: 18px; color: #64748b; }
  &:hover { background: rgba(226, 232, 240, 0.8); color: #0f172a; }
}

// 空状态
.dialog-empty {
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  .empty-icon { font-size: 36px; }
}

// 列表
.dialog-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 42vh;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
}

.dialog-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(226, 232, 240, 0.7);
  border-radius: 12px;
  transition: all 0.2s;
  position: relative;
  &:hover {
    border-color: var(--card-color);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
  }
  // 正在被拖拽
  &.dragging {
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.18);
    z-index: 10;
  }
  // 拖入指示线（上方）
  &.drag-over-before::before {
    content: '';
    position: absolute;
    top: -4px;
    left: 12px;
    right: 12px;
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #a855f7);
    border-radius: 2px;
  }
  // 拖入指示线（下方——在最后一个元素时使用）
  &.drag-over-after::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 12px;
    right: 12px;
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #a855f7);
    border-radius: 2px;
  }
}

.drag-handle {
  flex-shrink: 0;
  width: 20px;
  cursor: grab;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  transition: color 0.2s;
  &:active, &.active { cursor: grabbing; color: #6366f1; }
  svg { width: 16px; height: 16px; pointer-events: none; }
}

.item-index {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.item-emoji { font-size: 22px; flex-shrink: 0; }
.item-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-sub {
  font-size: 11px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-remove {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  svg { width: 16px; height: 16px; color: #94a3b8; }
  &:hover {
    background: #fef2f2;
    svg { color: #ef4444; }
  }
}

// 底部
.dialog-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid rgba(241, 245, 249, 0.8);
  flex-shrink: 0;
  flex-wrap: wrap;
}
.footer-spacer { flex: 1; }

.footer-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 9px 16px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  white-space: nowrap;
  svg { width: 16px; height: 16px; }

  &.secondary {
    background: rgba(241, 245, 249, 0.8);
    color: #64748b;
    border-color: rgba(226, 232, 240, 0.6);
    &:hover { background: rgba(226, 232, 240, 0.6); color: #475569; }
  }
  &.cancel {
    background: rgba(255, 255, 255, 0.8);
    color: #64748b;
    border-color: rgba(226, 232, 240, 0.8);
    &:hover { border-color: #94a3b8; color: #0f172a; }
  }
  &.confirm {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    &:hover:not(:disabled) {
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
      transform: translateY(-1px);
    }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }
}

// 过渡动画
.dialog-fade-enter-active {
  animation: dialogOverlayIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  .dialog-panel { animation: dialogPanelIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
}
.dialog-fade-leave-active {
  animation: dialogOverlayIn 0.2s ease-in reverse;
  .dialog-panel { animation: dialogPanelIn 0.2s ease-in reverse; }
}
@keyframes dialogOverlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes dialogPanelIn {
  from { transform: scale(0.92) translateY(20px); }
  to   { transform: scale(1) translateY(0); }
}

@media (max-width: 480px) {
  .dialog-panel { max-width: 100%; border-radius: 16px; }
  .dialog-header { padding: 14px 16px; }
  .dialog-list { padding: 8px 10px; max-height: 36vh; }
  .dialog-footer { padding: 10px 14px; gap: 6px; }
  .footer-btn { padding: 8px 12px; font-size: 12px; }
}
</style>

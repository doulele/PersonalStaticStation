import { ref, reactive, onUnmounted } from 'vue'

/**
 * 卡片左滑删除组合式函数
 * 用法：在列表项上绑定 touch 事件
 */
export function useSwipeDelete(options = {}) {
  const { onDelete, threshold = 80, deleteWidth = 72 } = options

  // 每个卡片的偏移量 { [id]: offset }
  const offsets = reactive({})
  // 正在操作中的临时状态
  const dragging = ref(false)

  let startX = 0
  let startY = 0
  let currentId = null
  let currentOffset = 0
  let isSwiping = false
  let directionLocked = null // 'horizontal' | 'vertical' | null

  function resetCard(id) {
    offsets[id] = 0
  }

  function openCard(id) {
    offsets[id] = -deleteWidth
  }

  function onTouchStart(e, id) {
    // 多指触摸忽略
    if (e.touches.length > 1) return

    // 如果已有其他卡片打开，先关闭
    Object.keys(offsets).forEach(key => {
      if (key !== String(id) && offsets[key] !== 0) {
        offsets[key] = 0
      }
    })

    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    currentId = id
    currentOffset = offsets[id] || 0
    isSwiping = true
    directionLocked = null
  }

  function onTouchMove(e, id) {
    if (!isSwiping || currentId !== id) return

    const dx = e.touches[0].clientX - startX
    const dy = e.touches[0].clientY - startY

    // 锁定方向
    if (directionLocked === null) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        directionLocked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
      }
    }

    // 如果是垂直滑动，不处理（让给滚动/拖拽）
    if (directionLocked === 'vertical') return

    // 只处理左滑（dx < 0）
    if (directionLocked === 'horizontal') {
      e.preventDefault()
      let newOffset = currentOffset + dx
      // 限制范围：最多滑出 deleteWidth，最少回到 0
      newOffset = Math.max(-deleteWidth - 20, Math.min(10, newOffset))
      offsets[id] = newOffset
    }
  }

  function onTouchEnd(e, id) {
    if (!isSwiping || currentId !== id) return

    const dx = e.changedTouches[0].clientX - startX
    const currentVal = offsets[id] || 0

    // 判断是否触发删除：左滑超过阈值
    if (currentVal < -threshold) {
      // 触发删除动画：先滑出再删除
      offsets[id] = -200
      setTimeout(() => {
        if (onDelete) {
          onDelete(id)
        }
        offsets[id] = 0
      }, 200)
    } else if (currentVal < -deleteWidth / 2) {
      // 打开删除按钮
      offsets[id] = -deleteWidth
    } else {
      // 关闭
      offsets[id] = 0
    }

    isSwiping = false
    currentId = null
    directionLocked = null
  }

  function onTouchCancel(e, id) {
    if (currentId === id) {
      offsets[id] = 0
      isSwiping = false
      currentId = null
      directionLocked = null
    }
  }

  function closeAll() {
    Object.keys(offsets).forEach(key => {
      offsets[key] = 0
    })
  }

  return {
    offsets,
    dragging,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    resetCard,
    openCard,
    closeAll
  }
}

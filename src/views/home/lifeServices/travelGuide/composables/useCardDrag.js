import { ref, onUnmounted } from 'vue'

/**
 * 卡片长按拖拽到收集按钮的组合式函数
 *
 * 策略：卡片 CSS touch-action: none → 浏览器完全不管触摸手势
 *   - 轻划：JS 手动 scrollBy 模拟页面滚动
 *   - 长按：进入拖拽模式
 *
 * @param {Object} options
 * @param {Function} options.onCollect - 拖入收集区回调 (attraction)
 */
export function useCardDrag(options = {}) {
  const { onCollect } = options

  const isDragging = ref(false)
  const isDragOverBtn = ref(false)
  const justDragged = ref(false)
  const ghostStyle = ref({ display: 'none', left: '0px', top: '0px' })
  const ghostContent = ref({ emoji: '', name: '' })
  const currentDragAttraction = ref(null)

  let longPressTimer = null
  let dragFlagTimer = null
  let startX = 0
  let startY = 0
  let hasMoved = false
  let isScrollSim = false      // 是否在模拟滚动
  let lastClientY = 0          // 上一帧 clientY（用于计算滚动增量）
  let currentAttraction = null // 当前操作的景点数据
  const DRAG_THRESHOLD = 8
  const LONG_PRESS_MS = 500

  // 清理全部状态
  function cleanup(blockClick = true) {
    clearTimeout(longPressTimer)
    longPressTimer = null
    clearTimeout(dragFlagTimer)
    removeGlobalListeners()
    isDragging.value = false
    isDragOverBtn.value = false
    ghostStyle.value = { display: 'none', left: '0px', top: '0px' }
    currentDragAttraction.value = null
    currentAttraction = null
    hasMoved = false
    isScrollSim = false
    if (blockClick) {
      justDragged.value = true
      dragFlagTimer = setTimeout(() => { justDragged.value = false }, 100)
    }
    document.body.style.userSelect = ''
    document.body.style.webkitUserSelect = ''
  }

  // ===== 全局监听（pointerdown 时挂载 → pointerup 时移除）=====
  let _globalMove = null
  let _globalUp = null
  let _globalCancel = null

  function addGlobalListeners() {
    _globalMove = (e) => handleGlobalMove(e)
    _globalUp = (e) => handleGlobalUp(e)
    _globalCancel = () => cleanup()
    document.addEventListener('pointermove', _globalMove, { passive: false })
    // 额外注册 touchmove（移动端某些浏览器 pointermove 的 preventDefault 不可靠）
    document.addEventListener('touchmove', _globalMove, { passive: false })
    document.addEventListener('pointerup', _globalUp)
    document.addEventListener('pointercancel', _globalCancel)
    document.addEventListener('touchend', _globalUp)
    document.addEventListener('touchcancel', _globalCancel)
  }

  function removeGlobalListeners() {
    if (_globalMove) {
      document.removeEventListener('pointermove', _globalMove)
      document.removeEventListener('touchmove', _globalMove)
      _globalMove = null
    }
    if (_globalUp) {
      document.removeEventListener('pointerup', _globalUp)
      document.removeEventListener('touchend', _globalUp)
      _globalUp = null
    }
    if (_globalCancel) {
      document.removeEventListener('pointercancel', _globalCancel)
      document.removeEventListener('touchcancel', _globalCancel)
      _globalCancel = null
    }
  }

  // 全局 pointermove
  function handleGlobalMove(e) {
    // 拖拽模式：移动幽灵 + 碰撞检测
    if (isDragging.value) {
      e.preventDefault()
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0
      ghostStyle.value = {
        display: 'block',
        left: `${x - 40}px`,
        top: `${y - 40}px`
      }
      checkDropTarget(x, y)
      return
    }

    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    const dx = x - startX
    const dy = y - startY

    // 长按计时器运行中 → 检测是否超过滑动阈值
    if (longPressTimer && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      clearTimeout(longPressTimer)
      longPressTimer = null
      hasMoved = true
      // 进入滚动模拟模式
      isScrollSim = true
      lastClientY = y
      currentAttraction = null
    }

    // 滚动模拟模式：手动滚动页面
    if (isScrollSim) {
      e.preventDefault()
      const delta = lastClientY - y
      window.scrollBy(0, delta)
      lastClientY = y
    }
  }

  // 全局 pointerup
  function handleGlobalUp(e) {
    if (isDragging.value) {
      const x = e.clientX ?? e.changedTouches?.[0]?.clientX ?? 0
      const y = e.clientY ?? e.changedTouches?.[0]?.clientY ?? 0
      const dropped = checkDropTarget(x, y)
      if (dropped && currentDragAttraction.value && onCollect) {
        onCollect(currentDragAttraction.value)
      }
      cleanup(true) // 拖拽结束 → 阻止 click
      return
    }

    // 滚动模拟结束 → 阻止 click
    if (isScrollSim) {
      cleanup(true)
      return
    }

    // 短按（未触发长按，未滑动）→ 放行 click
    cleanup(false)
  }

  // ===== 卡片上的事件（仅用于发起拖拽）=====
  function onPointerDown(e, attraction) {
    if (e.pointerType === 'mouse' && e.button !== 0) return

    startX = e.clientX
    startY = e.clientY
    lastClientY = e.clientY
    hasMoved = false
    isScrollSim = false
    currentAttraction = attraction
    currentDragAttraction.value = attraction

    // 全局监听（确保手指移出卡片后仍能跟踪）
    addGlobalListeners()
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'

    clearTimeout(longPressTimer)
    longPressTimer = setTimeout(() => {
      if (!hasMoved && currentAttraction) {
        startDrag(currentAttraction)
      }
    }, LONG_PRESS_MS)
  }

  // 卡片上的 pointermove / pointerup / pointercancel
  // （全局监听已处理实际逻辑，这里仅做占位防止事件冒泡问题）
  function onPointerMove() {}
  function onPointerUp() {}
  function onPointerCancel() {}

  // 开始拖拽
  function startDrag(attraction) {
    isDragging.value = true
    ghostContent.value = {
      emoji: attraction.emoji || '📍',
      name: attraction.name || '未知景点'
    }
    ghostStyle.value = {
      display: 'block',
      left: `${lastClientY ? lastClientY : 0}px`, // 会被下一次 handleGlobalMove 覆盖
      top: '0px'
    }
  }

  // 检测指针是否在收集按钮区域内
  function checkDropTarget(clientX, clientY) {
    const btn = document.getElementById('collection-floating-btn')
    if (!btn) {
      isDragOverBtn.value = false
      return false
    }
    const rect = btn.getBoundingClientRect()
    const padding = 20
    const hit =
      clientX >= rect.left - padding &&
      clientX <= rect.right + padding &&
      clientY >= rect.top - padding &&
      clientY <= rect.bottom + padding
    isDragOverBtn.value = hit
    return hit
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    isDragging,
    isDragOverBtn,
    justDragged,
    ghostStyle,
    ghostContent,
    currentDragAttraction,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    cleanup
  }
}

<template>
  <div class="map-container">
    <div v-if="!loaded" class="map-placeholder">
      <el-icon :size="48"><MapLocation /></el-icon>
      <p>地图加载中...</p>
    </div>
    <div ref="mapRef" class="map-view" :class="{ hidden: !loaded }"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { MapLocation } from '@element-plus/icons-vue'

const props = defineProps({
  center: { type: Array, default: () => [116.397155, 39.916345] },
  markers: { type: Array, default: () => [] },
  polylinePath: { type: Array, default: () => [] },
  dayNodes: { type: Array, default: () => [] }
})

const emit = defineEmits(['marker-click'])

const mapRef = ref(null)
const loaded = ref(false)
const hasKey = ref(!!import.meta.env.VITE_AMAP_KEY && import.meta.env.VITE_AMAP_KEY !== 'your_amap_key_here')

let mapInstance = null
let markerInstances = []
let polylineInstance = null
let infoWindowInstance = null
let darkModeObserver = null

function isDarkMode() {
  return document.documentElement.classList.contains('dark-mode')
}

function applyMapStyle() {
  if (!mapInstance) return
  mapInstance.setMapStyle(isDarkMode() ? 'amap://styles/dark' : 'amap://styles/light')
}

function watchDarkMode() {
  // MutationObserver 监听 html.dark-mode 类的变化
  darkModeObserver = new MutationObserver(() => {
    applyMapStyle()
  })
  darkModeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
}

// 编号图标 (1-9, 10+)
const NUMBER_ICONS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
  '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳']

// 状态颜色
const stateColors = {
  pending: { fill: '#eff6ff', border: '#3b82f6', text: '#2563eb' },
  checked: { fill: '#f0fdf4', border: '#22c55e', text: '#16a34a' },
  ignored: { fill: '#f8fafc', border: '#cbd5e1', text: '#94a3b8' }
}

const typeIcons = {
  spot: '📍',
  food: '🍽️',
  hotel: '🏨'
}

function getNumberIcon(index) {
  return NUMBER_ICONS[index] || String(index + 1)
}

function createMarkerContent(marker, index) {
  const colors = stateColors[marker.state] || stateColors.pending
  const icon = typeIcons[marker.type] || '📍'
  const num = getNumberIcon(index)
  const name = (marker.name || '').length > 6
    ? (marker.name || '').slice(0, 6) + '...'
    : (marker.name || '')

  // 已忽略的节点：删除线样式
  const nameStyle = marker.state === 'ignored'
    ? 'text-decoration:line-through;color:#94a3b8'
    : ''

  return `
    <div style="
      display:flex;align-items:center;gap:4px;
      background:${colors.fill};padding:3px 8px 3px 3px;
      border-radius:18px;box-shadow:0 2px 8px rgba(0,0,0,0.1);
      border:1.5px solid ${colors.border};white-space:nowrap;
      font-size:11px;font-weight:600;color:${colors.text};
      cursor:pointer;transition:transform 0.2s;
    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      <span style="
        width:20px;height:20px;border-radius:50%;
        background:${colors.border};color:#fff;
        display:flex;align-items:center;justify-content:center;
        font-size:10px;font-weight:700;line-height:1;
      ">${num}</span>
      ${icon}${name}
    </div>
  `
}

function createInfoWindowContent(node) {
  const data = node.data || node
  const timeRange = node.startTime && node.endTime && node.startTime !== node.endTime
    ? `${node.startTime} - ${node.endTime}`
    : (node.startTime || '')

  let details = ''
  if (node.type === 'spot') {
    details = `
      <div style="font-size:12px;color:#64748b;margin-top:4px;">
        ${node.stayDuration ? `⏱ 停留 ${node.stayDuration}分钟<br>` : ''}
        ${data.ticket_price ? `🎫 门票 ¥${data.ticket_price}` : ''}
      </div>
    `
  } else if (node.type === 'food') {
    details = `
      <div style="font-size:12px;color:#64748b;margin-top:4px;">
        ${data.recommend_dish ? `🍽️ ${data.recommend_dish}<br>` : ''}
        ${data.price_per_person ? `💰 人均 ¥${data.price_per_person}` : ''}
      </div>
    `
  }

  const stateText = node.state === 'checked' ? '✅ 已打卡' :
    node.state === 'ignored' ? '⛔ 已忽略' : '⏳ 待游览'

  return `
    <div style="padding:4px 2px;min-width:140px;max-width:220px;">
      <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:4px;">
        ${typeIcons[node.type] || ''} ${data.name || ''}
      </div>
      <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">
        ${timeRange ? '🕐 ' + timeRange : ''}
      </div>
      ${details}
      <div style="font-size:11px;margin-top:4px;color:${stateColors[node.state]?.text || '#64748b'};">
        ${stateText}
      </div>
    </div>
  `
}

function clearAll() {
  markerInstances.forEach(m => m.setMap(null))
  markerInstances = []
  if (polylineInstance) {
    polylineInstance.setMap(null)
    polylineInstance = null
  }
  if (infoWindowInstance) {
    infoWindowInstance.close()
    infoWindowInstance = null
  }
}

function renderMarkers() {
  if (!mapInstance) return

  clearAll()

  // 渲染标记点（按 order 排序避免乱序）
  const sortedMarkers = [...props.markers]
    .filter(m => m.lat && m.lng)
    .sort((a, b) => (a.order || 0) - (b.order || 0))

  sortedMarkers.forEach((item, index) => {
    const content = createMarkerContent(item, index)

    const marker = new window.AMap.Marker({
      position: [item.lng, item.lat],
      content,
      offset: new window.AMap.Pixel(0, -22),
      zIndex: 100 + index
    })

    // 点击弹窗
    marker.on('click', () => {
      if (infoWindowInstance) infoWindowInstance.close()
      infoWindowInstance = new window.AMap.InfoWindow({
        content: createInfoWindowContent(item),
        offset: new window.AMap.Pixel(0, -30)
      })
      infoWindowInstance.open(mapInstance, [item.lng, item.lat])
      emit('marker-click', item.id)
    })

    marker.setMap(mapInstance)
    markerInstances.push(marker)
  })

  // 渲染折线（所有节点按 order 连线）
  if (sortedMarkers.length > 1) {
    const path = sortedMarkers.map(m => [m.lng, m.lat])
    polylineInstance = new window.AMap.Polyline({
      path,
      strokeColor: '#6366f1',
      strokeWeight: 3,
      strokeOpacity: 0.6,
      strokeStyle: 'dashed',
      lineJoin: 'round',
      showDir: true
    })
    polylineInstance.setMap(mapInstance)
  }
}

function loadAmap() {
  if (!hasKey.value) return

  if (window.AMap) {
    initMap()
    return
  }

  const key = import.meta.env.VITE_AMAP_KEY
  const securityCode = import.meta.env.VITE_AMAP_SECURITY_CODE

  if (securityCode && securityCode !== 'your_security_code_here') {
    window._AMapSecurityConfig = { securityJsCode: securityCode }
  }

  const script = document.createElement('script')
  script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Polyline,AMap.InfoWindow`
  script.onload = () => initMap()
  document.head.appendChild(script)
}

function initMap() {
  if (!mapRef.value || !window.AMap) return

  mapInstance = new window.AMap.Map(mapRef.value, {
    center: props.center,
    zoom: 15,
    resizeEnable: true,
    mapStyle: isDarkMode() ? 'amap://styles/dark' : 'amap://styles/light'
  })

  loaded.value = true

  nextTick(() => {
    renderMarkers()
  })

  watchDarkMode()
}

// 监听数据变化
let lastMarkerKeys = ''
watch(
  () => [props.markers, props.polylinePath, props.dayNodes],
  () => {
    if (!loaded.value || !mapInstance) return
    const currentKeys = props.markers
      .filter(m => m.lat && m.lng)
      .map(m => `${m.lng},${m.lat}|${m.type}|${m.state}`)
      .join(';')
    if (currentKeys === lastMarkerKeys) {
      // 仅更新视野
      const allPoints = props.markers.filter(m => m.lat && m.lng).map(m => [m.lng, m.lat])
      if (allPoints.length > 0) mapInstance.setFitView(null, false, [24, 24, 24, 24])
      return
    }
    lastMarkerKeys = currentKeys
    renderMarkers()
    const allPoints = props.markers.filter(m => m.lat && m.lng).map(m => [m.lng, m.lat])
    if (allPoints.length > 0) mapInstance.setFitView(null, false, [24, 24, 24, 24])
  },
  { deep: true }
)

onMounted(() => {
  loadAmap()
})

onUnmounted(() => {
  if (darkModeObserver) {
    darkModeObserver.disconnect()
    darkModeObserver = null
  }
  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
  }
})
</script>

<style lang="scss" scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #f1f5f9;
}

.map-view {
  width: 100%;
  height: 100%;
  &.hidden { display: none; }
}

.map-placeholder {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  color: #94a3b8; font-size: 14px; gap: 8px;
}
</style>

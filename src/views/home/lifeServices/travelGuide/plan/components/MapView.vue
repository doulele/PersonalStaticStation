<template>
  <div class="map-container">
    <div v-if="!loaded" class="map-placeholder">
      <el-icon :size="48"><MapLocation /></el-icon>
      <p>地图加载中...</p>
      <p v-if="!hasKey" class="map-note">
        🔑 请在 <code>.env</code> 中配置 <code>VITE_AMAP_KEY</code> 以加载高德地图
      </p>
    </div>
    <div ref="mapRef" class="map-view" :class="{ hidden: !loaded }"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  center: { type: Array, default: () => [116.397155, 39.916345] },
  markers: { type: Array, default: () => [] },
  polylinePath: { type: Array, default: () => [] }
})

const mapRef = ref(null)
const loaded = ref(false)
const hasKey = ref(!!import.meta.env.VITE_AMAP_KEY && import.meta.env.VITE_AMAP_KEY !== 'your_amap_key_here')

let mapInstance = null
let markerInstances = []
let polylineInstance = null

// 标记颜色：路线=红, 美食=绿, 酒店=蓝
const markerColors = {
  spot: '#ef4444',
  food: '#10b981',
  hotel: '#3b82f6'
}

const markerLabels = {
  spot: '📍',
  food: '🍽️',
  hotel: '🏨'
}

function createMarkerContent(item) {
  const color = markerColors[item.type] || '#ef4444'
  const label = markerLabels[item.type] || '📍'
  const name = item.name.length > 8 ? item.name.slice(0, 8) + '...' : item.name
  return `
    <div style="display:flex;align-items:center;gap:4px;background:#fff;padding:4px 10px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,0.15);border:2px solid ${color};white-space:nowrap;font-size:12px;font-weight:600;color:#0f172a;">
      <span>${label}</span>${name}
    </div>
  `
}

function clearMarkers() {
  if (mapInstance) {
    mapInstance.clearMap()
    markerInstances = []
    polylineInstance = null
  }
}

function renderMarkers() {
  if (!mapInstance) return
  clearMarkers()

  // 渲染标记点
  props.markers.forEach(item => {
    const content = createMarkerContent(item)
    const marker = new window.AMap.Marker({
      position: [item.lng, item.lat],
      content,
      offset: new window.AMap.Pixel(0, -25),
      zIndex: 100
    })
    marker.setMap(mapInstance)
    markerInstances.push(marker)
  })

  // 渲染折线（路线节点之间的连线）
  const routeMarkers = props.markers.filter(m => m.type === 'spot')
  if (routeMarkers.length > 1) {
    const path = routeMarkers.map(m => [m.lng, m.lat])
    polylineInstance = new window.AMap.Polyline({
      path,
      strokeColor: '#6366f1',
      strokeWeight: 4,
      strokeOpacity: 0.7,
      lineJoin: 'round',
      showDir: true,
      dirColor: '#fff'
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

  // 高德 JS API 2.0 安全密钥配置（必须在加载 SDK 之前设置）
  if (securityCode && securityCode !== 'your_security_code_here') {
    window._AMapSecurityConfig = { securityJsCode: securityCode }
  }

  const script = document.createElement('script')
  script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Polyline`
  script.onload = () => initMap()
  document.head.appendChild(script)
}

function initMap() {
  if (!mapRef.value || !window.AMap) return

  mapInstance = new window.AMap.Map(mapRef.value, {
    center: props.center,
    zoom: 15,
    resizeEnable: true
  })

  loaded.value = true

  nextTick(() => {
    renderMarkers()
  })
}

// 监听数据变化，重新渲染
watch(
  () => [props.markers, props.polylinePath, props.center],
  () => {
    if (loaded.value && mapInstance) {
      renderMarkers()
      // 自适应视野
      const allPoints = props.markers.map(m => [m.lng, m.lat])
      if (allPoints.length > 0) {
        mapInstance.setFitView(null, false, [60, 60, 60, 60])
      }
    }
  },
  { deep: true }
)

onMounted(() => {
  loadAmap()
})

onUnmounted(() => {
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
  border-radius: 12px;
  overflow: hidden;
  background: #f1f5f9;
}

.map-view {
  width: 100%;
  height: 100%;

  &.hidden {
    display: none;
  }
}

.map-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 14px;
  gap: 8px;

  .map-note {
    font-size: 12px;
    margin-top: 8px;
    padding: 8px 16px;
    background: #fef3c7;
    border-radius: 8px;
    color: #92400e;

    code {
      background: #fde68a;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
    }
  }
}
</style>

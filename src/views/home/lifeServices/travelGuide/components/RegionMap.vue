<template>
  <teleport to="body" :disabled="!isFloating">
    <!-- PC 悬浮遮罩层 -->
    <transition name="float-fade">
      <div v-if="isFloating && !panelCollapsed" class="float-backdrop" @click="panelCollapsed = true"></div>
    </transition>

    <div
      class="region-map-container"
      :class="{
        floating: isFloating,
        'panel-open': isFloating && !panelCollapsed,
        collapsed: isFloating && panelCollapsed,
        mobile: !isFloating,
        'mobile-collapsed': !isFloating && mobileCollapsed
      }"
    >
      <!-- ===== PC 折叠态：右下角圆形悬浮按钮 ===== -->
      <transition name="float-btn-pop">
        <button
          v-if="isFloating && panelCollapsed"
          class="float-toggle-btn"
          @click="panelCollapsed = false"
          title="区域导航"
        >
          <span class="float-btn-icon">🗺️</span>
          <span class="float-btn-label">区域</span>
        </button>
      </transition>

      <!-- ===== 移动端折叠态 ===== -->
      <button v-if="!isFloating && mobileCollapsed" class="mobile-toggle-bar" @click="mobileCollapsed = false">
        <span>🗺️ 区域导航</span><span class="toggle-arrow">▼</span>
      </button>

      <!-- ===== PC 展开态：右下角悬浮面板 ===== -->
      <transition name="float-panel-slide">
        <div v-if="isFloating && !panelCollapsed" class="map-panel floating-panel">
          <div class="panel-header">
            <span class="panel-title"><span class="title-icon">🗺️</span> 区域导航</span>
            <button class="panel-close-btn" @click="panelCollapsed = true" title="收起">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>
          <div class="map-body">
            <div class="map-legend">
              <button class="legend-item all-item" :class="{ active: activeRegion === '全部' }" @click="$emit('select-region', '全部')">
                <span class="legend-dot all-dot"></span>
                <span class="legend-text">全部</span>
              </button>
              <button
                v-for="r in legendItems" :key="r.name"
                class="legend-item" :class="{ active: activeRegion === r.name }"
                @click="$emit('select-region', r.name)"
              >
                <span class="legend-dot" :style="{ background: r.color }"></span>
                <span class="legend-text">{{ r.name }}</span>
              </button>
            </div>
            <div v-if="mapLoadError" class="map-error-tip">
              <span class="error-icon">⚠️</span>
              <span>地图数据加载失败，请刷新页面重试</span>
            </div>
            <div ref="chartRef" class="echarts-map" v-show="!mapLoadError"></div>
          </div>
        </div>
      </transition>

      <!-- ===== 移动端面板 ===== -->
      <div v-if="!isFloating && !mobileCollapsed" class="map-panel">
        <div class="panel-header">
          <span class="panel-title"><span class="title-icon">🗺️</span> 区域导航</span>
          <button class="action-btn" @click="mobileCollapsed = true" title="收起">▲</button>
        </div>
        <div class="map-body">
          <div class="map-legend">
            <button class="legend-item all-item" :class="{ active: activeRegion === '全部' }" @click="$emit('select-region', '全部')">
              <span class="legend-dot all-dot"></span>
              <span class="legend-text">全部</span>
            </button>
            <button
              v-for="r in legendItems" :key="r.name"
              class="legend-item" :class="{ active: activeRegion === r.name }"
              @click="$emit('select-region', r.name)"
            >
              <span class="legend-dot" :style="{ background: r.color }"></span>
              <span class="legend-text">{{ r.name }}</span>
            </button>
          </div>
          <div v-if="mapLoadError" class="map-error-tip">
            <span class="error-icon">⚠️</span>
            <span>地图数据加载失败，请刷新页面重试</span>
          </div>
          <div ref="chartRefMobile" class="echarts-map" v-show="!mapLoadError"></div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({ activeRegion: { type: String, default: '全部' }, activeProvince: { type: String, default: '' } })
const emit = defineEmits(['select-region', 'select-province'])

// ========== 响应式 & 面板状态 ==========
const windowWidth = ref(window.innerWidth)
const isFloating = computed(() => windowWidth.value >= 1024)
const panelCollapsed = ref(true)
const mobileCollapsed = ref(true)

function onResize() {
  windowWidth.value = window.innerWidth
  pcChartInstance?.resize()
  mobileChartInstance?.resize()
}
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

// ========== 区域配置 ==========
const regionColors = {
  '华北': '#e74c3c', '东北': '#3b82f6', '西北': '#eab308',
  '西南': '#22c55e', '华东': '#8b5cf6', '华中': '#ec4899', '华南': '#06b6d4'
}

const provinceRegionMap = {
  '黑龙江': '东北','吉林': '东北','辽宁': '东北',
  '内蒙古': '华北','河北': '华北','北京': '华北','天津': '华北','山西': '华北',
  '新疆': '西北','甘肃': '西北','青海': '西北','宁夏': '西北','陕西': '西北',
  '西藏': '西南','四川': '西南','重庆': '西南','云南': '西南','贵州': '西南',
  '山东': '华东','江苏': '华东','上海': '华东','安徽': '华东',
  '浙江': '华东','江西': '华东','福建': '华东','台湾': '华东',
  '河南': '华中','湖北': '华中','湖南': '华中',
  '广东': '华南','广西': '华南','海南': '华南',
  '香港': '华南','澳门': '华南'
}

const legendItems = computed(() =>
  Object.entries(regionColors).map(([name, color]) => ({ name, color }))
)

/**
 * GeoJSON 返回的省名（全称）→ provinceRegionMap 中的简称 映射表
 * DataV GeoJSON 格式: "北京市"/"内蒙古自治区"/"新疆维吾尔自治区"
 * provinceRegionMap key 格式:   "北京"/"内蒙古"/"新疆"
 */
const GEO_NAME_TO_SHORT = {
  '北京市': '北京', '天津市': '天津', '上海市': '上海', '重庆市': '重庆',
  '黑龙江省': '黑龙江', '吉林省': '吉林', '辽宁省': '辽宁',
  '河北省': '河北', '山西省': '山西', '山东省': '山东', '河南省': '河南',
  '江苏省': '江苏', '安徽省': '安徽', '浙江省': '浙江', '江西省': '江西',
  '福建省': '福建', '湖北省': '湖北', '湖南省': '湖南', '广东省': '广东',
  '海南省': '海南', '四川省': '四川', '贵州省': '贵州', '云南省': '云南',
  '陕西省': '陕西', '甘肃省': '甘肃', '青海省': '青海', '台湾省': '台湾',
  '内蒙古自治区': '内蒙古', '广西壮族自治区': '广西', '西藏自治区': '西藏',
  '宁夏回族自治区': '宁夏', '新疆维吾尔自治区': '新疆',
  '香港特别行政区': '香港', '澳门特别行政区': '澳门',
  // 无后缀的简称（兜底）
  '北京': '北京', '天津': '天津', '上海': '上海', '重庆': '重庆',
  '黑龙江': '黑龙江', '吉林': '吉林', '辽宁': '辽宁',
  '河北': '河北', '山西': '山西', '山东': '山东', '河南': '河南',
  '江苏': '江苏', '安徽': '安徽', '浙江': '浙江', '江西': '江西',
  '福建': '福建', '湖北': '湖北', '湖南': '湖南', '广东': '广东',
  '海南': '海南', '四川': '四川', '贵州': '贵州', '云南': '云南',
  '陕西': '陕西', '甘肃': '甘肃', '青海': '青海', '台湾': '台湾',
  '内蒙古': '内蒙古', '广西': '广西', '西藏': '西藏',
  '宁夏': '宁夏', '新疆': '新疆', '香港': '香港', '澳门': '澳门'
}

/** 将 GeoJSON 省名转为简称 */
function geoNameToShort(name) {
  return GEO_NAME_TO_SHORT[name] || name
}

/** 各区域文字标注位置 [lng, lat]，靠近区域但放在空白处 */
const REGION_LABELS = {
  '华北': [112, 42.5],
  '东北': [126, 48],
  '西北': [96, 39],
  '西南': [100, 27],
  '华东': [119, 29.5],
  '华中': [110, 28.5],
  '华南': [109, 21],
}

// ========== ECharts 地图 ==========
const chartRef = ref(null)
const chartRefMobile = ref(null)
let pcChartInstance = null
let mobileChartInstance = null
let geoJsonData = null
const mapLoadError = ref(false) // 地图数据加载失败时的错误状态
let labelScheduleId = 0 // 递增 ID，用于取消过时的 setTimeout
let labelTimerPc = null
let labelTimerMobile = null

async function loadChinaMap() {
  if (geoJsonData) return geoJsonData
  const base = import.meta.env.BASE_URL
  const res = await fetch(`${base}data/china-geo.json`)
  if (!res.ok) throw new Error(`GeoJSON 加载失败: ${res.status}`)
  geoJsonData = await res.json()
  echarts.registerMap('china', geoJsonData)
  return geoJsonData
}

/**
 * 区域色 → 对应淡化色（浅色 hex，避免 ECharts map 对 rgba 的不兼容问题）
 * 用于"区域选中"模式下非选中区域；极淡，强对比
 */
const DIM_COLOR_MAP = {
  '#e74c3c': '#fce4e4', '#3b82f6': '#e3eefd', '#eab308': '#fdf7d0',
  '#22c55e': '#daf5e3', '#8b5cf6': '#ebe3fd', '#ec4899': '#fde4f0', '#06b6d4': '#d4f5fa'
}

/**
 * 区域色 → 半柔和色（比 DIM 更深，比原色浅）
 * 用于"省份选中"模式下非选中省份：保留区域辨识度，方便切换点击
 */
const SOFT_COLOR_MAP = {
  '#e74c3c': '#efb0b0', '#3b82f6': '#a0c4f7', '#eab308': '#e0ca60',
  '#22c55e': '#8ed4a5', '#8b5cf6': '#b4a3f5', '#ec4899': '#f0a0c3', '#06b6d4': '#8ed7e6'
}

function buildColoredData(activeRegionVal, activeProvinceVal) {
  const features = geoJsonData.features || []
  const defaultDim = '#eceef2'  // 无区域匹配的淡化色

  return features.map(f => {
    const pname = f.properties.name
    const shortName = geoNameToShort(pname)
    const preg = provinceRegionMap[shortName] || ''
    const rc = regionColors[preg]

    // 省份优先：如果指定了省份，只有该省份高亮
    if (activeProvinceVal) {
      if (shortName === activeProvinceVal) {
        return {
          name: pname, value: 3,
          itemStyle: {
            areaColor: rc, borderColor: '#1e1e20', borderWidth: 2.5,
            shadowBlur: 12, shadowOffsetX: 2, shadowOffsetY: 2,
            shadowColor: 'rgba(0,0,0,0.25)'
          },
          label: { show: true, fontSize: 14, fontWeight: 800, color: '#0f172a' }
        }
      }
      // 非选中省份：用柔和色，保留区域辨识度，方便点击切换
      return {
        name: pname, value: 0,
        itemStyle: {
          areaColor: (rc && SOFT_COLOR_MAP[rc]) ? SOFT_COLOR_MAP[rc] : defaultDim,
          borderColor: '#c8d2dc', borderWidth: 0.6
        },
        label: { show: false }
      }
    }

    // 全部模式
    if (activeRegionVal === '全部') {
      return {
        name: pname, value: 1,
        itemStyle: rc
          ? { areaColor: rc, borderColor: '#bcc6d4', borderWidth: 0.8, shadowBlur: 0 }
          : { areaColor: '#f1f3f6', borderColor: '#d0d7e0', borderWidth: 0.5 }
      }
    }

    // 选中区域高亮
    if (preg === activeRegionVal) {
      return {
        name: pname, value: 2,
        itemStyle: {
          areaColor: rc, borderColor: '#3d3d40', borderWidth: 2,
          shadowBlur: 8, shadowOffsetX: 1, shadowOffsetY: 1,
          shadowColor: 'rgba(0,0,0,0.18)'
        },
        label: { show: true, fontSize: 14, fontWeight: 800, color: '#0f172a' }
      }
    }

    // 非选中区域：用柔和色，保留辨识度
    return {
      name: pname, value: 0,
      itemStyle: {
        areaColor: (rc && SOFT_COLOR_MAP[rc]) ? SOFT_COLOR_MAP[rc] : defaultDim,
        borderColor: '#c8d2dc', borderWidth: 0.6
      },
      label: { show: false }
    }
  })
}

function getBaseOption(region, province) {
  const isAll = region === '全部' && !province
  return {
    backgroundColor: '#eeeff1',
    tooltip: {
      trigger: 'item',
      formatter: p => {
        const shortName = geoNameToShort(p.name)
        const preg = provinceRegionMap[shortName]
        return preg ? `<b>${p.name}</b><br/>所属区域：${preg}` : p.name
      },
      textStyle: { fontSize: 13 },
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: [8, 14],
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.1);border-radius:8px;'
    },
    series: [{
      name: 'china',
      type: 'map',
      map: 'china',
      roam: false,
      center: [104, 36],
      zoom: 1.25,
      aspectScale: 1.0,
      label: {
        show: isAll,
        color: '#475569',
        fontSize: isAll ? 11 : 10,
        fontWeight: 600
      },
      itemStyle: {
        borderColor: '#c8d2dc',
        borderWidth: 0.8
      },
      emphasis: {
        label: { show: true, color: '#0f172a', fontSize: 15, fontWeight: 800 },
        itemStyle: {
          areaColor: isAll ? '#d0d7e0' : undefined,
          borderColor: '#475569',
          borderWidth: 2,
          shadowBlur: isAll ? 0 : 12,
          shadowColor: isAll ? 'transparent' : 'rgba(0,0,0,0.25)',
          shadowOffsetX: isAll ? 0 : 2,
          shadowOffsetY: isAll ? 0 : 3
        }
      },
      data: buildColoredData(region, province)
    }]
  }
}

function initChart(domRef, isPC) {
  if (!domRef) return
  const inst = echarts.init(domRef)
  if (isPC) pcChartInstance = inst
  else mobileChartInstance = inst

  // 一次性设置完整 option（含着色数据）
  inst.setOption(getBaseOption(props.activeRegion, props.activeProvince))

  // 注册点击事件：点击省份 → 以省份筛选
  inst.on('click', params => {
    const name = params.name || (params.data && params.data.name)
    if (!name) return
    const shortName = geoNameToShort(name)
    const preg = provinceRegionMap[shortName]
    if (preg && shortName) {
      emit('select-province', { province: shortName, region: preg })
    }
  })
}

function updateRegion(region, province) {
  const data = buildColoredData(region, province)
  const isAll = region === '全部' && !province
  // 必须包含 type/map 等完整 series 定义，否则 replaceMerge 会丢失坐标系
  const opt = {
    series: [{
      name: 'china',
      type: 'map',
      map: 'china',
      roam: false,
      center: [104, 36],
      zoom: 1.25,
      aspectScale: 1.0,
      data,
      label: {
        show: isAll, color: '#475569',
        fontSize: isAll ? 11 : 10, fontWeight: 600
      },
      itemStyle: {
        borderColor: '#c8d2dc',
        borderWidth: 0.8
      },
      emphasis: {
        label: { show: true, color: '#0f172a', fontSize: 15, fontWeight: 800 },
        itemStyle: {
          areaColor: isAll ? '#d0d7e0' : undefined,
          borderColor: '#475569', borderWidth: 2,
          shadowBlur: isAll ? 0 : 12,
          shadowColor: isAll ? 'transparent' : 'rgba(0,0,0,0.25)',
          shadowOffsetX: isAll ? 0 : 2,
          shadowOffsetY: isAll ? 0 : 3
        }
      }
    }]
  }

  function applyTo(inst) {
    if (!inst || inst.isDisposed()) return
    // 取消旧标签定时器
    labelScheduleId++
    clearTimeout(labelTimerPc)
    clearTimeout(labelTimerMobile)

    // 使用 replaceMerge: ['series'] 强制替换整个 series，
    // 确保省份高亮 → 区域高亮切换时，旧样式彻底清除
    inst.setOption(opt, { replaceMerge: ['series'] })

    // 区域选中模式：叠加区域名称标签
    if (region && region !== '全部' && !province) {
      const isPc = inst === pcChartInstance
      const timer = addRegionLabel(inst, region, labelScheduleId)
      if (isPc) labelTimerPc = timer
      else labelTimerMobile = timer
    } else {
      inst.setOption({ graphic: [] }, { replaceMerge: ['graphic'] })
    }
    inst.resize()
  }

  applyTo(pcChartInstance)
  applyTo(mobileChartInstance)
}

/** 在地图上叠加区域名称文字 */
function addRegionLabel(inst, region, scheduleId) {
  const pos = REGION_LABELS[region]
  if (!pos) return null

  return setTimeout(() => {
    // 如果在这期间有新调度，跳过
    if (labelScheduleId !== scheduleId) return
    if (inst.isDisposed()) return
    try {
      const pixel = inst.convertToPixel({ seriesIndex: 0 }, pos)
      if (!pixel || isNaN(pixel[0]) || isNaN(pixel[1])) return
      const [lx, ly] = pixel

      inst.setOption({
        graphic: [{
          type: 'text',
          style: {
            text: region,
            fill: '#fff',
            fontSize: 15,
            fontWeight: 900,
            fontFamily: 'system-ui, "PingFang SC", "Microsoft YaHei", sans-serif',
            textAlign: 'center',
            textVerticalAlign: 'middle',
            textShadowColor: 'rgba(0,0,0,0.35)',
            textShadowBlur: 4
          },
          left: lx,
          top: ly - 10,
          z: 100
        }]
      })
    } catch {
      inst.setOption({ graphic: [] })
    }
  }, 120)
}

watch([() => props.activeRegion, () => props.activeProvince], async ([region, province]) => {
  await nextTick()
  updateRegion(region, province)
})

// 面板折叠/展开变化时初始化或 resize
// 收起时必须销毁实例，因为 v-if 会移除 DOM，旧实例持有失效 DOM 引用
let mapDataLoaded = false
watch(panelCollapsed, async (collapsed) => {
  if (collapsed) {
    clearTimeout(labelTimerPc)
    pcChartInstance?.dispose()
    pcChartInstance = null
    return
  }
  await nextTick()
  await ensureMapLoaded()
  if (mapLoadError.value) return
  setTimeout(async () => {
    await nextTick()
    if (!pcChartInstance && chartRef.value) {
      initChart(chartRef.value, true)
    } else {
      pcChartInstance?.resize()
    }
  }, 350)
})
watch(mobileCollapsed, async (collapsed) => {
  if (collapsed) {
    clearTimeout(labelTimerMobile)
    mobileChartInstance?.dispose()
    mobileChartInstance = null
    return
  }
  await nextTick()
  await ensureMapLoaded()
  if (mapLoadError.value) return
  setTimeout(async () => {
    await nextTick()
    if (!mobileChartInstance && chartRefMobile.value) {
      initChart(chartRefMobile.value, false)
    } else {
      mobileChartInstance?.resize()
    }
  }, 350)
})

async function ensureMapLoaded() {
  if (mapDataLoaded) return
  try {
    await loadChinaMap()
    mapDataLoaded = true
    mapLoadError.value = false
  } catch (e) {
    console.error('加载中国地图失败:', e)
    mapLoadError.value = true
  }
}

onMounted(() => {
  // 预加载地图数据，不初始化图表（面板折叠时 DOM 不存在）
  ensureMapLoaded()
})

onUnmounted(() => {
  pcChartInstance?.dispose()
  pcChartInstance = null
  mobileChartInstance?.dispose()
  mobileChartInstance = null
})
</script>

<style lang="scss" scoped>
// ===== 遮罩层 =====
.float-backdrop {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.12);
  backdrop-filter: blur(2px);
}
.float-fade-enter-active { transition: opacity 0.3s ease; }
.float-fade-leave-active { transition: opacity 0.25s ease; }
.float-fade-enter-from,
.float-fade-leave-to { opacity: 0; }

// ===== 容器 =====
.region-map-container {
  z-index: 1000; user-select: none;
  &.floating {
    position: fixed; bottom: 20px; right: 20px;
    &.collapsed { width: auto; height: auto; }
  }
  &.mobile { margin-bottom: 24px; }
}

// ===== PC 悬浮按钮 =====
.float-toggle-btn {
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: #fff;
  border: 2px solid rgba(255,255,255,0.2);
  cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-shadow: 0 6px 30px rgba(99,102,241,0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 1px;
  .float-btn-icon { font-size: 22px; line-height: 1; }
  .float-btn-label { font-size: 10px; font-weight: 600; line-height: 1; opacity: 0.9; letter-spacing: 1px; }
  &:hover {
    transform: scale(1.1) translateY(-2px);
    box-shadow: 0 10px 36px rgba(99,102,241,0.5);
  }
  &:active { transform: scale(0.95); }
}

.float-btn-pop-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.float-btn-pop-leave-active { transition: all 0.2s ease-in; }
.float-btn-pop-enter-from { opacity: 0; transform: scale(0.3) translateY(20px); }
.float-btn-pop-leave-to { opacity: 0; transform: scale(0.5) translateY(20px); }

// ===== 移动端折叠 =====
.mobile-toggle-bar {
  width: 100%; display: flex; align-items: center; justify-content: center;
  gap: 8px; padding: 12px 16px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 1px dashed #cbd5e1; border-radius: 12px; cursor: pointer;
  font-size: 14px; font-weight: 600; color: #6366f1;
  transition: all 0.25s;
  &:hover { background: #eef2ff; border-color: #a5b4fc; }
  .toggle-arrow { font-size: 10px; transition: transform 0.3s; }
}

// ===== 面板 =====
.map-panel {
  background: rgba(255,255,255,0.98);
  backdrop-filter: blur(20px);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 12px 50px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
  width: 720px;
  .mobile & { width: 100%; border-radius: 14px; box-shadow: 0 2px 16px rgba(0,0,0,0.06); }
}

.floating-panel {
  max-height: calc(100vh - 40px);
  display: flex; flex-direction: column;
  .map-body {
    flex: 1; overflow-y: auto; min-height: 0;
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  }
}

.float-panel-slide-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.float-panel-slide-leave-active { transition: all 0.25s ease-in; }
.float-panel-slide-enter-from { opacity: 0; transform: translateY(30px) scale(0.9); }
.float-panel-slide-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }

// ===== Header =====
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 18px; border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(135deg, #fafbff, #f8fafc);
  flex-shrink: 0;
}
.panel-title {
  font-size: 14px; font-weight: 700; color: #1e293b;
  display: flex; align-items: center; gap: 6px;
  .title-icon { font-size: 16px; }
}
.panel-close-btn {
  width: 28px; height: 28px; border-radius: 8px;
  border: 1px solid #e2e8f0; background: #fff;
  color: #94a3b8; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  &:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }
}
.action-btn {
  width: 28px; height: 28px; border-radius: 8px; border: 1px solid #e2e8f0;
  background: #fff; color: #64748b; font-size: 16px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  &:hover { background: #f1f5f9; color: #334155; }
}

// ===== Map Body =====
.map-body { padding: 6px 10px 8px; }
.echarts-map {
  width: 100%;
  height: 580px;
  border-radius: 8px;
  overflow: hidden;
  .mobile & { height: 420px; }
}

// ===== 图例 =====
.map-legend {
  display: flex; flex-wrap: wrap; gap: 6px;
  margin-bottom: 6px; padding-top: 8px; border-top: 1px solid #f1f5f9;
}
.legend-item {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 6px;
  border: 1.5px solid transparent; background: transparent;
  cursor: pointer; transition: all 0.2s;
  font-size: 12px; font-weight: 500; color: #64748b; white-space: nowrap;
  &:hover { background: #f8fafc; border-color: #e2e8f0; }
  &.active { background: #eef2ff; border-color: #c7d2fe; color: #4338ca; font-weight: 700; }
}
.all-item {
  &.active { background: #f1f5f9; border-color: #cbd5e1; color: #334155; }
}
.legend-dot {
  width: 11px; height: 11px; border-radius: 3px; flex-shrink: 0; transition: all 0.2s;
}
.all-dot {
  background: conic-gradient(#e74c3c, #eab308, #22c55e, #06b6d4, #8b5cf6, #ec4899, #3b82f6) !important;
}
.legend-text { line-height: 1; }

// ===== 错误提示 =====
.map-error-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  .error-icon { font-size: 20px; }
}

// ===== 响应式 =====
@media (max-width: 1023px) and (min-width: 769px) {
  .map-panel { width: 100%; }
}
@media (max-width: 768px) {
  .map-panel { width: 100%; }
  .echarts-map { height: 380px; }
  .map-legend { gap: 3px; }
  .legend-item { padding: 3px 8px; font-size: 11px; }
}
</style>

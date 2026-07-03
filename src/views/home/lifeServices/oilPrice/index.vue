<template>
  <div class="oil-price-page">

    <!-- ==================== 头部 ==================== -->
    <div class="page-hero">
      <button class="hero-back" @click="$router.back()" title="返回生活服务">
        <el-icon :size="18"><ArrowLeft /></el-icon>
      </button>
      <div class="hero-content">
        <!-- <span class="hero-icon">⛽</span> -->
        <h1 class="hero-title">今日油价</h1>
      </div>
      <p class="hero-sub">全国各省市实时油价 · 历史走势 · 调价窗口</p>
    </div>

    <!-- ==================== 核心信息栏：调价窗口 + 均价 ==================== -->
    <div class="info-strip">
      <!-- 调价窗口 -->
      <div class="info-item adjustment-info">
        <div class="info-label">下次调价</div>
        <div class="info-highlight">{{ forecast.nextDate }}</div>
        <div class="info-meta">距今 <b>{{ forecast.daysLeft }}</b> 天</div>
        <span class="info-badge" :class="forecast.direction">
          <template v-if="forecast.direction === 'up'">↗ 预计上调 {{ forecast.changeAmount }}</template>
          <template v-else-if="forecast.direction === 'down'">↘ 预计下调 {{ forecast.changeAmount }}</template>
          <template v-else-if="forecast.direction === 'flat'">⚡ {{ forecast.changeAmount }}</template>
          <template v-else>📡 {{ forecast.changeAmount }}</template>
        </span>
      </div>
      <!-- 全国均价 -->
      <div class="info-divider"></div>
      <div class="info-item avg-info">
        <div class="info-label">全国均价参考</div>
        <div class="avg-row">
          <span v-for="item in nationalAvg" :key="item.type" class="avg-chip">
            <em>{{ item.type }}</em>
            <strong>{{ item.value }}</strong>
          </span>
        </div>
        <div class="info-meta">数据来源于各省市加油站挂牌价</div>
      </div>
    </div>

    <!-- ==================== 省份选择 ==================== -->
    <div class="province-bar">
      <el-select
        v-model="activeProvince"
        filterable clearable
        placeholder="搜索省份..."
        :popper-append-to-body="false"
        class="province-select"
        :disabled="loading"
        @change="onProvinceChange"
      >
        <el-option v-for="p in provinces" :key="p" :label="p" :value="p">
          <span>{{ p }}</span>
          <span class="opt-count">{{ allCityPrices[p]?.length || 0 }}个城市</span>
        </el-option>
      </el-select>
      <div class="hot-tags">
        <el-tag
          v-for="p in hotProvinces" :key="p"
          :type="activeProvince === p ? 'primary' : 'info'"
          :effect="activeProvince === p ? 'dark' : 'plain'"
          class="hot-tag" @click="selectProvince(p)"
        >{{ p }}</el-tag>
      </div>
      <div class="bar-actions">
        <div v-if="userCity" class="loc-tag" title="已定位">
          <el-icon :size="12"><LocationFilled /></el-icon>{{ userCity.name }}
        </div>
        <div v-else-if="locating" class="loc-tag dim">
          <el-icon :size="12" class="is-loading"><Loading /></el-icon>定位中
        </div>
        <el-button text size="small" :icon="Refresh" @click="refreshData" :loading="loading" />
      </div>
    </div>

    <!-- ==================== 更新时间 ==================== -->
    <div v-if="updateTime && !loading" class="update-tip">
      <el-icon :size="13"><Clock /></el-icon> 更新于 {{ updateTime }}
    </div>

    <!-- ==================== 加载 ==================== -->
    <div v-if="loading" class="loading-state">
      <div class="loading-icon-pulse">⛽</div>
      <p>正在获取油价数据...</p>
    </div>

    <!-- ==================== 错误 ==================== -->
    <div v-else-if="initError" class="error-state">
      <span class="error-icon">⚠️</span>
      <p class="error-title">数据加载失败</p>
      <p class="error-detail">{{ initError }}</p>
      <el-button type="primary" size="small" @click="retryInit">重新加载</el-button>
    </div>

    <template v-else>
      <!-- ==================== PC 表格 / 移动端卡片 ==================== -->
      <!-- PC 横向表格 -->
      <div class="price-table-wrap hide-mobile">
        <table class="price-table" v-if="cityPrices.length">
          <thead>
            <tr>
              <th class="col-city">城市</th>
              <th v-for="t in oilTypes" :key="t.key" :style="{ color: t.color }">
                <span class="th-dot" :style="{ background: t.color }"></span>{{ t.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="city in cityPrices" :key="city.name"
              :class="{ 'row-user': userCity && userCity.name === city.name && userCity.province === activeProvince }"
            >
              <td class="col-city">
                <el-icon :size="14"><LocationFilled /></el-icon>
                {{ city.name }}
                <span v-if="userCity && userCity.name === city.name && userCity.province === activeProvince" class="u-badge">当前</span>
              </td>
              <td v-for="t in oilTypes" :key="t.key" class="col-price">
                <span class="pr-val">{{ city.prices[t.key] }}</span>
                <span class="pr-unit">元/升</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state"><span class="empty-icon">🚗</span><p>该省份暂无油价数据</p></div>
      </div>

      <!-- 移动端卡片 -->
      <div class="oil-grid show-mobile">
        <div
          v-for="city in cityPrices" :key="city.name"
          class="oil-card"
          :class="{ 'is-user-city': userCity && userCity.name === city.name && userCity.province === activeProvince }"
        >
          <div class="card-header">
            <h3 class="card-city">
              <el-icon :size="16"><LocationFilled /></el-icon>{{ city.name }}
              <span v-if="userCity && userCity.name === city.name && userCity.province === activeProvince" class="u-badge">当前</span>
            </h3>
          </div>
          <div class="card-prices">
            <div v-for="t in oilTypes" :key="t.key" class="card-price-row">
              <span class="c-type" :style="{ color: t.color }">{{ t.label }}</span>
              <span class="c-bar">
                <span class="c-bar-fill" :style="{ width: barPercent(city.prices[t.key]), background: t.color }"></span>
              </span>
              <span class="c-val">{{ city.prices[t.key] }}</span>
            </div>
          </div>
        </div>
        <div v-if="cityPrices.length === 0" class="empty-state"><span class="empty-icon">🚗</span><p>该省份暂无油价数据</p></div>
      </div>

      <!-- ==================== 历史走势（四线合一） ==================== -->
      <div class="chart-section" v-if="history92.length">
        <div class="chart-legend">
          <span class="legend-title">📈 {{ activeProvince }} · 近半年全油品走势</span>
          <span class="legend-range" v-if="chartRange.min">¥{{ chartRange.min }} ~ ¥{{ chartRange.max }}</span>
        </div>
        <div class="legend-lines">
          <span v-for="(t, idx) in oilTypes" :key="t.key" class="legend-item" @mouseenter="hoverLine = idx" @mouseleave="hoverLine = -1">
            <span class="legend-dot" :style="{ background: t.color }"></span>
            {{ t.label }}
          </span>
        </div>
        <div class="chart-wrapper">
          <svg class="chart-svg" :viewBox="`0 0 ${svgW} ${svgH}`" preserveAspectRatio="xMidYMid meet">
            <!-- 网格线 -->
            <line v-for="(_, i) in 5" :key="'h'+i" :x1="padL" :y1="padT + i * rowH" :x2="svgW - padR" :y2="padT + i * rowH" stroke="#e2e8f0" stroke-width="0.5" />
            <text v-for="(v, i) in 5" :key="'y'+i" :x="padL - 8" :y="padT + i * rowH + 4" text-anchor="end" fill="#94a3b8" font-size="10">{{ yLabels[i] }}</text>
            <text v-for="(d, i) in history92" :key="'x'+i" :x="getX(i)" :y="svgH - 6" text-anchor="middle" fill="#94a3b8" font-size="9">{{ d.date }}</text>

            <!-- 四条线 -->
            <template v-for="(t, li) in oilTypes" :key="t.key">
              <path :d="areaPaths[li]" :fill="`url(#grad${li})`" :opacity="hoverLine === -1 || hoverLine === li ? 1 : 0.15" />
              <polyline :points="linePointsArr[li]" fill="none" :stroke="t.color" :stroke-width="hoverLine === li ? 3 : 2" stroke-linejoin="round" stroke-linecap="round" :opacity="hoverLine === -1 || hoverLine === li ? 1 : 0.25" />
              <!-- 数据点 -->
              <circle
                v-for="(d, i) in historyArr[li]" :key="'d'+i"
                :cx="getX(i)" :cy="getY(d.value)" r="2.5"
                :fill="hoverLine === li || hoverLine === -1 ? '#fff' : 'transparent'"
                :stroke="t.color" stroke-width="1.5"
                :opacity="hoverLine === -1 || hoverLine === li ? 1 : 0"
              />
              <!-- 数据标签：始终显示，92#/95#/98# 标注在上方，柴油标注在下方 -->
              <text
                v-for="(d, i) in historyArr[li]" :key="'l'+i"
                :x="getX(i)"
                :y="li < 3 ? getY(d.value) - 7 : getY(d.value) + 12"
                text-anchor="middle" :fill="t.color" font-size="9" font-weight="600"
                paint-order="stroke" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
              >{{ d.value }}</text>
            </template>

            <!-- 渐变定义 -->
            <defs>
              <linearGradient v-for="(t, i) in oilTypes" :key="'g'+i" :id="`grad${i}`" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="t.color" stop-opacity="0.2" />
                <stop offset="100%" :stop-color="t.color" stop-opacity="0.01" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, Clock, Loading, LocationFilled, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { cities } from '@/views/home/lifeServices/weather/cities'
import { fetchProvinces, fetchCurrentPrices, fetchHistory, fetchNationalAvg, fetchForecast, fetchIPLocate } from '@/api/oilPrice'

// ===================== 油品类型 =====================
const oilTypes = [
  { key: '92号汽油', label: '92#', color: '#f59e0b' },
  { key: '95号汽油', label: '95#', color: '#ef4444' },
  { key: '98号汽油', label: '98#', color: '#8b5cf6' },
  { key: '0号柴油', label: '柴油', color: '#06b6d4' },
]

// ===================== 响应式数据 =====================
const provinces = ref([])
const hotProvinces = ['广东', '北京', '上海', '浙江', '江苏', '四川', '山东', '湖北', '福建', '河南']
const activeProvince = ref('北京')
const loading = ref(false)
const updateTime = ref('')
const locating = ref(false)
const userCity = ref(null)
const hoverLine = ref(-1)

const initError = ref('')
const forecast = ref({ nextDate: '', daysLeft: 0, direction: 'flat', changeAmount: '' })
const nationalAvg = ref([])
const allCityPrices = ref({})           // { '北京': [{name, prices}], ... }
const historyByProvince = ref({})       // { '北京': { history: [...], minMax: {...} } }

// 当前省份的城市价格列表
const cityPrices = computed(() => allCityPrices.value[activeProvince.value] || [])

// 当前省份的四条油品历史数据
const currentHistory = computed(() => historyByProvince.value[activeProvince.value])
const history92 = computed(() => {
  const h = currentHistory.value
  if (!h?.history) return []
  return h.history.map(d => ({ date: d.date, value: d.values['92号汽油'] }))
})
const history95 = computed(() => {
  const h = currentHistory.value
  if (!h?.history) return []
  return h.history.map(d => ({ date: d.date, value: d.values['95号汽油'] }))
})
const history98 = computed(() => {
  const h = currentHistory.value
  if (!h?.history) return []
  return h.history.map(d => ({ date: d.date, value: d.values['98号汽油'] }))
})
const historyDiesel = computed(() => {
  const h = currentHistory.value
  if (!h?.history) return []
  return h.history.map(d => ({ date: d.date, value: d.values['0号柴油'] }))
})
const historyArr = computed(() => [history92.value, history95.value, history98.value, historyDiesel.value])

const chartRange = computed(() => {
  let allVals = []
  for (const arr of historyArr.value) {
    allVals = allVals.concat(arr.map(d => d.value))
  }
  if (!allVals.length) return { min: 0, max: 0 }
  return {
    min: (Math.floor(Math.min(...allVals) * 100 - 5) / 100).toFixed(2),
    max: (Math.ceil(Math.max(...allVals) * 100 + 5) / 100).toFixed(2)
  }
})

// ===================== SVG 图表常量 =====================
const svgW = 600
const svgH = 240
const padL = 48
const padR = 16
const padT = 24
const padB = 30
const chartW = svgW - padL - padR
const chartH = svgH - padT - padB
const rowH = chartH / 4

const chartMin = computed(() => {
  let all = []; historyArr.value.forEach(a => a.forEach(d => all.push(d.value)))
  return all.length ? Math.floor(Math.min(...all) - 0.08) : 7
})
const chartMax = computed(() => {
  let all = []; historyArr.value.forEach(a => a.forEach(d => all.push(d.value)))
  return all.length ? Math.ceil(Math.max(...all) + 0.08) : 11
})
const yLabels = computed(() => {
  const range = chartMax.value - chartMin.value
  return [4, 3, 2, 1, 0].map(i => (chartMin.value + range * (i / 4)).toFixed(2))
})

function getX(index) {
  const len = history92.value.length
  return len <= 1 ? padL : padL + (index / (len - 1)) * chartW
}
function getY(value) {
  const range = chartMax.value - chartMin.value
  if (range === 0) return padT + chartH / 2
  return padT + chartH - ((value - chartMin.value) / range) * chartH
}

function buildLinePoints(data) {
  return data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ')
}
function buildAreaPath(data) {
  if (!data.length) return ''
  const firstX = getX(0)
  const lastX = getX(data.length - 1)
  const bottomY = svgH - padB
  const pts = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ')
  return `M${firstX},${bottomY} L${pts} L${lastX},${bottomY} Z`
}

const linePointsArr = computed(() => [
  buildLinePoints(history92.value),
  buildLinePoints(history95.value),
  buildLinePoints(history98.value),
  buildLinePoints(historyDiesel.value),
])
const areaPaths = computed(() => [
  buildAreaPath(history92.value),
  buildAreaPath(history95.value),
  buildAreaPath(history98.value),
  buildAreaPath(historyDiesel.value),
])

// 移动端条形比例
const maxPrice = computed(() => {
  let all = []
  cityPrices.value.forEach(c => oilTypes.forEach(t => all.push(parseFloat(c.prices[t.key]))))
  return all.length ? Math.max(...all) : 10
})
function barPercent(val) {
  return (parseFloat(val) / maxPrice.value * 100).toFixed(0) + '%'
}

// ===================== 方法 =====================
async function loadProvinceData(province) {
  try {
    // 已缓存则跳过
    if (allCityPrices.value[province]) return
    const data = await fetchCurrentPrices(province)
    if (data?.cities) {
      allCityPrices.value = { ...allCityPrices.value, [province]: data.cities }
    }
  } catch { /* 静默失败，稍后重试 */ }
}

async function loadHistoryData(province) {
  try {
    if (historyByProvince.value[province]) return
    const data = await fetchHistory(province)
    if (data?.history) {
      historyByProvince.value = { ...historyByProvince.value, [province]: data }
    }
  } catch { /* 静默失败 */ }
}

function selectProvince(province) {
  if (loading.value) return
  activeProvince.value = province
  loading.value = true
  // 并行加载省油价 + 历史走势
  Promise.all([
    loadProvinceData(province),
    loadHistoryData(province),
  ]).finally(() => {
    loading.value = false
    updateTime.value = new Date().toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  })
}

function onProvinceChange(val) { if (val) selectProvince(val) }
async function refreshData() {
  // 清除当前省份缓存，强制重新加载
  const prov = activeProvince.value
  const newPrices = { ...allCityPrices.value }
  delete newPrices[prov]
  allCityPrices.value = newPrices
  const newHistory = { ...historyByProvince.value }
  delete newHistory[prov]
  historyByProvince.value = newHistory
  selectProvince(prov)
  ElMessage.success('数据已刷新')
}

// ===================== 定位逻辑 =====================
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
function findNearestCity(lat, lng) {
  let nearest = cities[0], minDist = Infinity
  for (const city of cities) {
    const dist = haversineDistance(lat, lng, city.lat, city.lng)
    if (dist < minDist) { minDist = dist; nearest = city }
  }
  return nearest
}
async function tryIPLocate() {
  try {
    const result = await fetchIPLocate()
    if (result?.lat && result?.lng) {
      return { lat: result.lat, lng: result.lng }
    }
  } catch { /* 后端也无法定位，走默认 */ }
  return null
}
function setProvinceByCity(cityName, provinceName) {
  const targetProvince = provinces.value.includes(provinceName) ? provinceName : '北京'
  const targetCity = provinces.value.includes(provinceName) ? cityName : '北京'

  activeProvince.value = targetProvince
  userCity.value = { name: targetCity, province: targetProvince }

  // 定位成功后加载对应省份的油价数据
  loadProvinceData(targetProvince)
  loadHistoryData(targetProvince)
}
async function fallbackToIPOrDefault() {
  const ipResult = await tryIPLocate()
  if (ipResult) {
    const nearestCity = findNearestCity(ipResult.lat, ipResult.lng)
    setProvinceByCity(nearestCity.name, nearestCity.province)
  } else {
    activeProvince.value = '北京'
    userCity.value = { name: '北京', province: '北京' }
  }
}
function tryLocateUser() {
  if (!navigator.geolocation) { fallbackToIPOrDefault(); return }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const nearestCity = findNearestCity(position.coords.latitude, position.coords.longitude)
      locating.value = false
      setProvinceByCity(nearestCity.name, nearestCity.province)
    },
    () => { locating.value = false; fallbackToIPOrDefault() },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
  )
}

async function initData() {
  initError.value = ''
  loading.value = true
  try {
    // 并行加载所有初始化数据
    const [provList, avgData, forecastData] = await Promise.all([
      fetchProvinces(),
      fetchNationalAvg(),
      fetchForecast(),
    ])
    provinces.value = provList
    nationalAvg.value = avgData.map(d => ({
      type: d.type === '0号柴油' ? '0#柴油' : d.type.replace('汽油', '#'),
      value: d.value
    }))
    forecast.value = forecastData
  } catch (err) {
    initError.value = err.message || '无法连接后端服务，请确认后端已启动（端口3001）'
    loading.value = false
    return
  }

  // 加载默认省份数据
  try {
    await Promise.all([
      loadProvinceData(activeProvince.value),
      loadHistoryData(activeProvince.value),
    ])
  } catch (err) {
    console.error('[油价页] 省份数据加载失败:', err.message)
    // 省份数据失败不阻塞页面，基础信息已加载
  }

  updateTime.value = new Date().toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
  loading.value = false
}

function retryInit() {
  initData()
  tryLocateUser()
}

onMounted(() => {
  initData()
  tryLocateUser()
})
</script>

<style lang="scss" scoped>
.oil-price-page {
  padding: 0 24px 40px;
  max-width: 1000px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

// ==================== 头部 ====================
.page-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px 0 8px;
  margin-bottom: 16px;
}
.hero-back {
  position: absolute;
  left: 0; top: 50%;
  transform: translateY(-50%);
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  border: 1px solid #e2e8f0; border-radius: 8px;
  background: #fff; color: #64748b; cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }
}
.hero-content {
  display: flex; align-items: center; gap: 8px;
}
.hero-icon { font-size: 24px; line-height: 1; }
.hero-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; line-height: 1.3; }
.hero-sub {
  font-size: 12px; color: #94a3b8; margin: 4px 0 0;
  max-width: 300px;
}

// ==================== 核心信息栏 ====================
.info-strip {
  display: flex; align-items: stretch;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 18px 24px; margin-bottom: 16px; gap: 0;
}
.info-item { flex: 1; }
.info-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.info-highlight { font-size: 20px; font-weight: 700; color: #0f172a; }
.info-meta { font-size: 12px; color: #94a3b8; margin-top: 2px; b { color: #64748b; } }
.info-badge {
  display: inline-block; margin-top: 6px; padding: 3px 10px;
  border-radius: 6px; font-size: 12px; font-weight: 600;
  &.up { background: #fef2f2; color: #dc2626; }
  &.down { background: #f0fdf4; color: #16a34a; }
  &.flat { background: #f8fafc; color: #64748b; }
  &.unknown { background: #fffbeb; color: #d97706; }
}
.info-divider { width: 1px; background: #e2e8f0; margin: 0 20px; flex-shrink: 0; align-self: stretch; }
.avg-row { display: flex; gap: 18px; flex-wrap: wrap; }
.avg-chip {
  display: flex; flex-direction: column;
  em { font-style: normal; font-size: 11px; color: #94a3b8; }
  strong { font-size: 18px; font-weight: 700; color: #0f172a; font-variant-numeric: tabular-nums; }
}

// ==================== 省份选择栏 ====================
.province-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; margin-bottom: 12px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
  flex-wrap: wrap;
}
.province-select { width: 160px; flex-shrink: 0; :deep(.el-input__wrapper) { border-radius: 8px; } }
.opt-count { color: #94a3b8; font-size: 11px; margin-left: auto; padding-left: 12px; }
.hot-tags { display: flex; gap: 6px; flex: 1; flex-wrap: wrap; align-items: center; }
.hot-tag { cursor: pointer; transition: transform 0.15s; &:hover { transform: scale(1.05); } }
.bar-actions { display: flex; align-items: center; gap: 6px; margin-left: auto; flex-shrink: 0; }
.loc-tag {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 9px; background: #dbeafe; border: 1px solid #93c5fd;
  border-radius: 6px; font-size: 12px; color: #2563eb; font-weight: 500;
  &.dim { color: #94a3b8; background: #f1f5f9; border-color: #e2e8f0; }
}

// ==================== 更新提示 ====================
.update-tip {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  margin-bottom: 16px; font-size: 11px; color: #94a3b8;
}

// ==================== 加载 ====================
.loading-state {
  display: flex; flex-direction: column; align-items: center; padding: 60px 20px; gap: 12px;
  p { font-size: 14px; color: #64748b; }
}
.loading-icon-pulse { font-size: 40px; animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.12); opacity: 0.5; } }

// ==================== 错误 ====================
.error-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 20px; gap: 8px;
  .error-icon { font-size: 40px; }
  .error-title { font-size: 16px; font-weight: 600; color: #dc2626; margin: 0; }
  .error-detail { font-size: 13px; color: #94a3b8; margin: 0; text-align: center; max-width: 360px; line-height: 1.5; }
}

// ==================== PC 表格 ====================
.price-table-wrap {
  margin-bottom: 24px;
  overflow-x: auto;
}
.price-table {
  width: 100%; border-collapse: collapse;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  overflow: hidden; font-size: 14px;
  th, td { padding: 12px 16px; text-align: center; border-bottom: 1px solid #f1f5f9; }
  thead {
    th {
      background: #f8fafc; font-size: 13px; font-weight: 600; color: #64748b;
      border-bottom: 2px solid #e2e8f0;
    }
    .th-dot {
      display: inline-block; width: 7px; height: 7px; border-radius: 50%;
      margin-right: 5px; vertical-align: middle; margin-top: -1px;
    }
  }
  .col-city { text-align: left; font-weight: 600; color: #0f172a; display: flex; align-items: center; gap: 5px; }
  .col-price {
    .pr-val { font-size: 18px; font-weight: 700; color: #0f172a; font-variant-numeric: tabular-nums; }
    .pr-unit { font-size: 11px; color: #94a3b8; margin-left: 2px; }
  }
  .row-user {
    background: #eff6ff;
    .col-city { color: #2563eb; }
  }
}
.u-badge {
  font-size: 10px; font-weight: 600; color: #fff; background: #3b82f6;
  padding: 1px 6px; border-radius: 3px;
}

// ==================== 移动端卡片 ====================
.show-mobile { display: none; }
.oil-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 24px; }
.oil-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;
  &.is-user-city { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.12); }
}
.card-header {
  padding: 12px 16px;
  background: linear-gradient(135deg, #fffbeb, #fff7ed);
  border-bottom: 1px solid #fed7aa;
}
.card-city {
  font-size: 15px; font-weight: 600; color: #0f172a; margin: 0;
  display: flex; align-items: center; gap: 6px;
}
.card-prices { padding: 4px 16px 12px; }
.card-price-row {
  display: flex; align-items: center; gap: 10px; padding: 8px 0;
  &:not(:last-child) { border-bottom: 1px solid #f1f5f9; }
}
.c-type { font-size: 13px; font-weight: 600; width: 36px; flex-shrink: 0; }
.c-bar { flex: 1; height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
.c-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.c-val { font-size: 16px; font-weight: 700; color: #0f172a; min-width: 44px; text-align: right; font-variant-numeric: tabular-nums; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; padding: 36px 20px; gap: 6px;
  .empty-icon { font-size: 40px; }
  p { font-size: 14px; color: #64748b; }
}

// ==================== 走势图 ====================
.chart-section {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 20px; margin-bottom: 24px;
}
.chart-legend {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
}
.legend-title { font-size: 14px; font-weight: 600; color: #0f172a; }
.legend-range { font-size: 11px; color: #94a3b8; }
.legend-lines { display: flex; gap: 16px; margin-bottom: 12px; }
.legend-item {
  display: flex; align-items: center; gap: 5px; font-size: 12px; color: #64748b;
  cursor: pointer; padding: 2px 8px; border-radius: 4px; transition: background 0.15s;
  &:hover { background: #f1f5f9; }
}
.legend-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.chart-wrapper { width: 100%; }
.chart-svg { display: block; width: 100%; height: auto; }

// ==================== 响应式 ====================
@media (max-width: 899px) {
  .oil-price-page { padding: 0 14px 28px; }
  .page-hero { padding: 14px 0 6px; margin-bottom: 12px; }

  .info-strip { flex-direction: column; gap: 14px; padding: 16px; }
  .info-divider { width: 100%; height: 1px; margin: 0; }
  .info-highlight { font-size: 18px; }
  .avg-row { gap: 12px; }
  .avg-chip strong { font-size: 16px; }

  .province-bar { flex-direction: column; align-items: stretch; padding: 10px 12px; }
  .province-select { width: 100%; }
  .hot-tags { justify-content: flex-start; }
  .bar-actions { margin-left: 0; justify-content: space-between; width: 100%; }

  .hide-mobile { display: none; }
  .show-mobile { display: block; }

  .chart-section { padding: 14px; }
  .legend-lines { gap: 10px; flex-wrap: wrap; }
}

@media (max-width: 480px) {
  .hero-back { width: 30px; height: 30px; }
}
</style>

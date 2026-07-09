<template>
  <div class="weather-page">
    <div class="page-header">
      <div class="header-left" @click="goBack" title="返回生活服务">
        <el-icon :size="20"><ArrowLeft /></el-icon>
        <span>返回</span>
      </div>
      <h1 class="page-title">天气预报</h1>
      <p class="page-desc">全国城市实时天气与多日预报查询</p>
    </div>

    <!-- 城市选择 -->
    <div class="city-selector">
      <div class="city-search-bar">
        <el-select
          v-model="selectedCity"
          filterable
          clearable
          placeholder="搜索城市名称..."
          :popper-append-to-body="false"
          class="city-select"
          @change="onCityChange"
        >
          <el-option
            v-for="city in cities"
            :key="city.name"
            :label="city.name"
            :value="city.name"
          >
            <span>{{ city.name }}</span>
            <span class="city-province">{{ city.province }}</span>
          </el-option>
        </el-select>
        <el-button
          type="primary"
          :loading="weatherLoading"
          :disabled="!selectedCity"
          @click="fetchCurrentWeather"
        >
          {{ weatherLoading ? '查询中...' : '查询天气' }}
        </el-button>
      </div>

      <!-- 快捷城市 -->
      <div class="hot-cities">
        <span class="hot-label">热门城市：</span>
        <el-tag
          v-for="city in hotCities"
          :key="city"
          :type="selectedCity === city ? 'primary' : 'info'"
          class="hot-tag"
          @click="quickSelect(city)"
        >
          {{ city }}
        </el-tag>
      </div>
    </div>

    <!-- 天气展示区域 -->
    <div class="weather-content">
      <!-- 定位中 -->
      <template v-if="locating">
        <div class="weather-loading-state">
          <div class="loading-icon">📍</div>
          <div class="loading-text">正在获取您的位置...</div>
          <div class="loading-sub">需要位置权限来展示当地天气</div>
        </div>
      </template>
      <!-- 天气数据展示（Direct 模式，无弹窗） -->
      <template v-else-if="weatherData">
        <WeatherPanel
          :weather-data="weatherData"
          :loading="false"
          :location-name="selectedCity"
          :direct="true"
        />
      </template>
      <!-- 加载中 -->
      <template v-else-if="weatherLoading">
        <div class="weather-loading-state">
          <div class="loading-icon">🌤️</div>
          <div class="loading-text">正在获取天气数据...</div>
        </div>
      </template>
      <!-- 错误 -->
      <template v-else-if="weatherError">
        <div class="weather-error-state">
          <div class="error-icon">😵</div>
          <div class="error-text">{{ weatherError }}</div>
          <el-button type="primary" size="small" @click="fetchCurrentWeather">重试</el-button>
        </div>
      </template>
      <!-- 空状态 -->
      <template v-else>
        <div class="weather-empty-state">
          <div class="empty-icon">🏙️</div>
          <div class="empty-text">请选择城市查询天气</div>
          <div class="empty-sub">支持全国主要城市的实时天气与未来多日预报</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Sunny } from '@element-plus/icons-vue'
import WeatherPanel from '@/views/home/lifeServices/travelGuide/components/WeatherPanel.vue'
import { cities } from './cities'

const router = useRouter()

const selectedCity = ref('')
const weatherData = ref(null)
const weatherLoading = ref(false)
const weatherError = ref('')
const locating = ref(false) // 定位中状态

// 热门城市快捷选择
const hotCities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '重庆', '南京']

const API_BASE = '/staticTool/api/travel'

function goBack() {
  router.push('/home/lifeServices')
}

function quickSelect(cityName) {
  selectedCity.value = cityName
  fetchCurrentWeather()
}

function onCityChange(val) {
  if (val) {
    fetchCurrentWeather()
  } else {
    weatherData.value = null
    weatherError.value = ''
  }
}

async function fetchCurrentWeather() {
  if (!selectedCity.value) return

  const city = cities.find(c => c.name === selectedCity.value)
  if (!city) {
    weatherError.value = '未找到该城市数据，请选择其他城市'
    return
  }

  weatherLoading.value = true
  weatherError.value = ''
  weatherData.value = null

  try {
    const res = await fetch(`${API_BASE}/plan-weather`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: city.lat, lng: city.lng })
    })
    const json = await res.json()
    if (json.success && json.data) {
      weatherData.value = json.data
    } else {
      weatherError.value = json.message || '天气数据获取失败，请稍后重试'
    }
  } catch (err) {
    console.error('天气查询失败:', err)
    weatherError.value = '网络请求失败，请检查网络后重试'
  } finally {
    weatherLoading.value = false
  }
}

// Haversine 公式计算两点间距离（km）
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// 根据坐标找到最近城市
function findNearestCity(lat, lng) {
  let nearest = cities[0]
  let minDist = Infinity
  for (const city of cities) {
    const dist = haversineDistance(lat, lng, city.lat, city.lng)
    if (dist < minDist) {
      minDist = dist
      nearest = city
    }
  }
  return nearest
}

// 带超时的 fetch 封装
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

// 通过 IP 定位（浏览器定位失败的 fallback），尝试多个服务
async function tryIPLocate() {
  // 多个免费 IP 定位服务，按优先级尝试
  const services = [
    async () => {
      // ipapi.co（国际）
      const res = await fetchWithTimeout('https://ipapi.co/json/', 5000)
      if (!res.ok) return null
      const data = await res.json()
      if (data.latitude && data.longitude) {
        return { lat: data.latitude, lng: data.longitude, city: data.city }
      }
      return null
    },
    async () => {
      // ip-api.com（有国内节点，响应更快）
      const res = await fetchWithTimeout('http://ip-api.com/json/?lang=zh-CN', 5000)
      if (!res.ok) return null
      const data = await res.json()
      if (data.status === 'success' && data.lat && data.lon) {
        return { lat: data.lat, lng: data.lon, city: data.city }
      }
      return null
    },
    async () => {
      // ip.sb（国内可用）
      const res = await fetchWithTimeout('https://api.ip.sb/geoip/', 5000)
      if (!res.ok) return null
      const data = await res.json()
      if (data.latitude && data.longitude) {
        return { lat: data.latitude, lng: data.longitude, city: data.city }
      }
      return null
    }
  ]

  for (const tryService of services) {
    try {
      const result = await tryService()
      if (result) return result
    } catch (err) {
      // 该服务失败，尝试下一个
      continue
    }
  }
  return null
}

// 尝试获取用户位置
function tryLocateUser() {
  if (!navigator.geolocation) {
    console.warn('浏览器不支持 Geolocation API，尝试 IP 定位...')
    fallbackToIPOrDefault()
    return
  }

  locating.value = true

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      console.log('浏览器定位成功:', latitude, longitude)
      const nearestCity = findNearestCity(latitude, longitude)
      locating.value = false
      selectedCity.value = nearestCity.name
      fetchCurrentWeather()
    },
    (err) => {
      // 定位失败/被拒绝，打印错误并回退到 IP 定位
      console.error('浏览器定位失败 (code=' + err.code + '): ' + err.message)
      locating.value = false
      // PERMISSION_DENIED(1) / POSITION_UNAVAILABLE(2) / TIMEOUT(3)
      if (err.code === 1) {
        console.warn('用户拒绝了定位权限，尝试 IP 定位...')
      } else {
        console.warn('定位不可用或超时，尝试 IP 定位...')
      }
      fallbackToIPOrDefault()
    },
    {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 300000 // 缓存5分钟
    }
  )
}

// IP 定位 fallback，失败则用北京
async function fallbackToIPOrDefault() {
  const ipResult = await tryIPLocate()
  if (ipResult) {
    console.log('IP定位成功:', ipResult.lat, ipResult.lng, ipResult.city)
    const nearestCity = findNearestCity(ipResult.lat, ipResult.lng)
    selectedCity.value = nearestCity.name
  } else {
    console.warn('IP定位也失败了，使用默认城市北京')
    selectedCity.value = '北京'
  }
  fetchCurrentWeather()
}

onMounted(() => {
  tryLocateUser()
})
</script>

<style lang="scss" scoped>
.weather-page {
  padding: 28px 24px 40px;
  max-width: 900px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-header {
  text-align: center;
  margin-bottom: 28px;
  position: relative;
}

.header-left {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
  &:hover { color: #3b82f6; }
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
}

.page-desc {
  font-size: 14px;
  color: #64748b;
}

// 城市选择
.city-selector {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 20px;
}

.city-search-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.city-select {
  flex: 1;
  min-width: 0;

  :deep(.el-input__wrapper) {
    border-radius: 10px;
  }
}

.city-province {
  color: #94a3b8;
  font-size: 12px;
  margin-left: auto;
}

.hot-cities {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #e2e8f0;
}

.hot-label {
  font-size: 13px;
  color: #64748b;
  flex-shrink: 0;
}

.hot-tag {
  cursor: pointer;
  transition: all 0.2s;
  &:hover { transform: scale(1.05); }
}

// 天气内容
.weather-content {
  min-height: 200px;
}

// 加载态
.weather-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
}

.loading-icon {
  font-size: 48px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
}

.loading-text {
  font-size: 14px;
  color: #64748b;
}

.loading-sub {
  font-size: 12px;
  color: #94a3b8;
}

// 错误态
.weather-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
}

.error-icon { font-size: 48px; }

.error-text {
  font-size: 14px;
  color: #ef4444;
}

// 空状态
.weather-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 8px;
}

.empty-icon { font-size: 56px; }

.empty-text {
  font-size: 16px;
  font-weight: 600;
  color: #475569;
}

.empty-sub {
  font-size: 13px;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .weather-page {
    padding: 20px 14px 32px;
  }

  .page-title {
    font-size: 24px;
  }

  .header-left {
    position: static;
    transform: none;
    margin-bottom: 12px;
  }

  .city-selector {
    padding: 14px;
    border-radius: 12px;
  }

  .city-search-bar {
    flex-direction: column;
  }

  .city-select {
    width: 100%;
  }
}

</style>

<style lang="scss">
// ==================== 夜间模式（独立非 scoped 块） ====================
html.dark-mode .weather-page {
  background: #0f0f1a !important;
  color: #e2dee9 !important;

  .page-title { color: #e2dee9 !important; }
  .page-desc { color: #94a3b8 !important; }

  .header-left {
    color: #94a3b8 !important;
    svg { color: #94a3b8 !important; }
    &:hover { color: #93c5fd !important; }
  }

  .city-selector {
    background: #1a1a2e !important;
    border-color: #2d2d4a !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) !important;
  }

  .city-province { color: #64748b !important; }
  .hot-cities { border-top-color: #2d2d4a !important; }
  .hot-label { color: #94a3b8 !important; }

  .loading-icon, .error-icon, .empty-icon { filter: brightness(0.8) !important; }
  .loading-text { color: #94a3b8 !important; }
  .loading-sub { color: #64748b !important; }
  .empty-text { color: #94a3b8 !important; }
  .empty-sub { color: #64748b !important; }
  .error-text { color: #f87171 !important; }

  .city-select {
    .el-input__wrapper {
      background: #252540 !important;
      border-color: #2d2d4a !important;
      box-shadow: none !important;
    }
    .el-input__inner {
      color: #e2dee9 !important;
      &::placeholder { color: #64748b !important; }
    }
    .el-input__suffix, .el-input__suffix-inner, .el-icon {
      color: #94a3b8 !important;
    }
    .el-select__caret { color: #94a3b8 !important; }
  }

  .el-button--primary {
    background: #6366f1 !important;
    border-color: #6366f1 !important;
    &:hover { background: #818cf8 !important; border-color: #818cf8 !important; }
  }
  .el-tag--info {
    background: #1e1e3c !important;
    border-color: #2d2d4a !important;
    color: #94a3b8 !important;
  }
  .el-tag--primary {
    background: #6366f1 !important;
    border-color: #6366f1 !important;
    color: #fff !important;
  }

  .el-select-dropdown {
    background: #1a1a2e !important;
    border: 1px solid #2d2d4a !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5) !important;
  }
  .el-select-dropdown__item {
    color: #e2dee9 !important;
    &.hover, &:hover { background: #252540 !important; }
    &.selected {
      color: #a78bfa !important;
      background: #1e1e3c !important;
      font-weight: 600;
    }
  }
  .el-popper__arrow::before {
    background: #1a1a2e !important;
    border-color: #2d2d4a !important;
  }
}
</style>

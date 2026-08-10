<template>
  <div v-if="weather" class="weather-bar" :class="{ rainy: weather.rainWarning, 'dialog-mode': dialogMode }">
    <!-- ===== 当前天气概览 ===== -->
    <div class="weather-hero" v-if="dialogMode">
      <div class="weather-hero-icon">{{ weatherIcon }}</div>
      <div class="weather-hero-info">
        <div class="weather-hero-temp">{{ weather.temperature }}</div>
        <div class="weather-hero-desc">{{ weather.weather }}</div>
      </div>
      <div class="weather-hero-extras">
        <div class="weather-extra-item">
          <span class="extra-label">💧 湿度</span>
          <span class="extra-value">{{ weather.humidity || '--' }}</span>
        </div>
        <div class="weather-extra-item">
          <span class="extra-label">🌬️ 风力</span>
          <span class="extra-value">{{ weather.wind || '--' }}</span>
        </div>
        <div class="weather-extra-item">
          <span class="extra-label">👁️ 能见度</span>
          <span class="extra-value">{{ weather.visibility || '--' }}</span>
        </div>
        <div class="weather-extra-item">
          <span class="extra-label">☀️ 紫外线</span>
          <span class="extra-value">{{ weather.uvIndex || '--' }}</span>
        </div>
      </div>
    </div>

    <!-- 紧凑模式（入口卡片对应的数据已经在外层显示，这里留空） -->
    <div v-if="!dialogMode" class="weather-main">
      <span class="weather-icon">{{ weatherIcon }}</span>
      <span class="weather-temp">{{ weather.temperature }}</span>
      <span class="weather-desc">{{ weather.weather }}</span>
      <span class="weather-wind">🌬️ {{ weather.wind }}</span>
    </div>

    <!-- ===== 降雨警示 ===== -->
    <div v-if="weather.rainWarning" class="weather-warning">
      <span class="warning-icon">⚠️</span>
      <div class="warning-body">
        <div class="warning-title">降雨提醒</div>
        <div class="warning-text">预计有雨，建议携带雨具，户外景点注意调整时间安排</div>
      </div>
    </div>

    <!-- ===== 出行建议 ===== -->
    <div v-if="dialogMode" class="weather-advice">
      <div class="advice-item" :class="weather.rainWarning ? 'caution' : 'good'">
        <span class="advice-icon">{{ weather.rainWarning ? '🧥' : '✅' }}</span>
        <span>{{ weather.rainWarning ? '建议带伞/雨衣，优先安排室内景点' : '天气良好，适合户外游玩' }}</span>
      </div>
      <div class="advice-item neutral">
        <span class="advice-icon">🧴</span>
        <span>{{ weather.weather?.includes('晴') ? '日晒较强，注意防晒补水' : '注意适时增减衣物' }}</span>
      </div>
    </div>

    <!-- ===== 未来天气预报（可点击展开） ===== -->
    <div v-if="weather.forecast?.length" class="weather-forecast">
      <div class="forecast-title">
        <span class="forecast-title-icon">📅</span>
        <span>未来{{ weather.forecast.length }}天预报</span>
        <span class="forecast-hint">点击展开</span>
      </div>
      <div class="forecast-list">
        <template v-for="(f, idx) in weather.forecast" :key="f.date">
          <div
            class="forecast-item"
            :class="{ today: idx === 0, expanded: expandedDay === f.date }"
            @click="toggleDay(f.date)"
          >
            <span class="forecast-date">{{ formatDate(f.date) }}<span v-if="idx===0" class="today-badge">今天</span></span>
            <span class="forecast-icon">{{ forecastIcon(f.dayWeather) }}</span>
            <span class="forecast-weather">{{ f.dayWeather }}</span>
            <div class="forecast-temp-bar">
              <span class="temp-low">{{ f.nightTemp }}°</span>
              <div class="temp-track"><div class="temp-fill" :style="{ width: tempPercent(f) + '%' }"></div></div>
              <span class="temp-high">{{ f.dayTemp }}°</span>
            </div>
            <span class="forecast-expand-icon" :class="{ rotated: expandedDay === f.date }">▾</span>
          </div>
          <transition name="expand">
            <div v-if="expandedDay === f.date" class="forecast-detail">
              <div v-if="getDayHourly(f.date).length" class="forecast-detail-hourly">
                <div class="detail-subtitle">逐小时预报</div>
                <div class="detail-hourly-grid">
                  <div v-for="h in getDayHourly(f.date)" :key="h.time" class="detail-hourly-chip">
                    <span class="chip-time">{{ h.hour }}</span>
                    <span class="chip-icon">{{ hourlyWeatherIcon(h.weather) }}</span>
                    <span class="chip-temp">{{ h.temp }}°</span>
                  </div>
                </div>
              </div>
              <div v-else class="forecast-detail-cards">
                <div class="detail-card day">
                  <div class="detail-card-header">☀️ 白天</div>
                  <div class="detail-card-body">
                    <div class="detail-card-temp">{{ f.dayTemp }}°C</div>
                    <div class="detail-card-desc">{{ f.dayWeather }}</div>
                    <div class="detail-card-wind" v-if="f.wind">🌬️ {{ f.wind }}{{ f.windScale }}</div>
                  </div>
                </div>
                <div class="detail-card night">
                  <div class="detail-card-header">🌙 夜间</div>
                  <div class="detail-card-body">
                    <div class="detail-card-temp">{{ f.nightTemp }}°C</div>
                    <div class="detail-card-desc">{{ f.nightWeather }}</div>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </template>
      </div>
    </div>

    <!-- ===== 底部来源 ===== -->
    <div v-if="dialogMode" class="weather-footer">
      <span>数据来源：中国气象局 · 仅供参考</span>
    </div>
  </div>
  <div v-else-if="loading" class="weather-bar loading" :class="{ 'dialog-mode': dialogMode }">
    <span>🌤️ 天气加载中...</span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'

defineProps({
  dialogMode: {
    type: Boolean,
    default: false
  }
})

const store = useStore()
const weather = computed(() => store.state.plan.weatherData)
const loading = computed(() => store.state.plan.weatherLoading)

const expandedDay = ref(null)

function toggleDay(dateStr) {
  expandedDay.value = expandedDay.value === dateStr ? null : dateStr
}

const weatherIcon = computed(() => {
  const w = weather.value?.weather || ''
  if (w.includes('晴')) return '☀️'
  if (w.includes('云') || w.includes('阴')) return '⛅'
  if (w.includes('雨')) return '🌧️'
  if (w.includes('雪')) return '❄️'
  if (w.includes('风')) return '💨'
  return '🌤️'
})

function forecastIcon(desc) {
  if (!desc) return '🌤️'
  if (desc.includes('晴')) return '☀️'
  if (desc.includes('云') || desc.includes('阴')) return '⛅'
  if (desc.includes('雨')) return '🌧️'
  if (desc.includes('雪')) return '❄️'
  return '🌤️'
}

function hourlyWeatherIcon(desc) {
  if (!desc) return '🌤️'
  if (desc.includes('晴')) return '☀️'
  if (desc.includes('多云')) return '⛅'
  if (desc.includes('阴')) return '☁️'
  if (desc.includes('雨') || desc.includes('雷')) return '🌧️'
  if (desc.includes('雪')) return '❄️'
  if (desc.includes('风')) return '💨'
  if (desc.includes('雾') || desc.includes('霾')) return '🌫️'
  return '🌤️'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  return `${parts[1]}/${parts[2]}`
}

function tempPercent(f) {
  const low = parseFloat(f.nightTemp) || 0
  const high = parseFloat(f.dayTemp) || 30
  const range = Math.max(high - low, 1)
  const totalRange = 40
  return Math.min(100, Math.max(5, (range / totalRange) * 100))
}

function getDayHourly(dateStr) {
  const hourly = weather.value?.hourly || []
  return hourly.filter(h => (h.time || '').startsWith(dateStr))
}
</script>

<style lang="scss" scoped src="./WeatherBar.scss"></style>

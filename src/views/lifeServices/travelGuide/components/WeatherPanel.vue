<template>
  <!-- =============================================================== -->
  <!-- Direct 模式：天气预报内容直接展示（无入口卡片和弹窗）       -->
  <!-- =============================================================== -->
  <div v-if="direct" class="weather-direct-panel">
    <div class="weather-direct-header">
      <span class="weather-direct-header-icon">{{ weatherIcon }}</span>
      <span class="weather-direct-header-title">天气预报</span>
      <el-tag v-if="locationName" size="small" type="primary" effect="plain" round>{{ locationName }}</el-tag>
    </div>

    <!-- ===== 天气主内容 ===== -->
    <div v-if="weather" class="weather-panel-body">
      <!-- 大号天气概览 -->
      <div class="weather-hero">
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

      <!-- 降雨警示 -->
      <div v-if="weather.rainWarning" class="weather-warning">
        <span class="warning-icon">⚠️</span>
        <div class="warning-body">
          <div class="warning-title">降雨提醒</div>
          <div class="warning-text">预计有雨，建议携带雨具，户外景点注意调整时间安排</div>
        </div>
      </div>

      <!-- 出行建议 -->
      <div class="weather-advice">
        <div class="advice-item" :class="weather.rainWarning ? 'caution' : 'good'">
          <span class="advice-icon">{{ weather.rainWarning ? '🧥' : '✅' }}</span>
          <span>{{ weather.rainWarning ? '建议带伞/雨衣，优先安排室内景点' : '天气良好，适合户外游玩' }}</span>
        </div>
        <div class="advice-item neutral">
          <span class="advice-icon">🧴</span>
          <span>{{ weather.weather?.includes('晴') ? '日晒较强，注意防晒补水' : '注意适时增减衣物' }}</span>
        </div>
      </div>

      <!-- ★★★ 逐小时预报（横向滚动） ★★★ -->
      <div v-if="weather.hourly?.length" class="weather-hourly">
        <div class="hourly-title">
          <span class="hourly-title-icon">🕐</span>
          <span>逐小时预报</span>
        </div>
        <div class="hourly-scroll">
          <div
            v-for="h in weather.hourly"
            :key="h.time"
            class="hourly-item"
            :class="{ now: isCurrentHour(h) }"
          >
            <span class="hourly-time">{{ isCurrentHour(h) ? '现在' : h.hour }}</span>
            <span class="hourly-weather-icon">{{ hourlyWeatherIcon(h.weather) }}</span>
            <span class="hourly-temp">{{ h.temp }}°</span>
            <span class="hourly-wind" v-if="h.wind">{{ h.wind }}{{ h.windScale || '' }}</span>
          </div>
        </div>
      </div>

      <!-- 未来预报（可点击展开） -->
      <div v-if="weather.forecast?.length" class="weather-forecast">
        <div class="forecast-title">
          <span class="forecast-title-icon">📅</span>
          <span>未来{{ weather.forecast.length }}天预报</span>
          <span class="forecast-hint">点击展开详情</span>
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
                <div class="temp-track">
                  <div class="temp-fill" :style="{ width: tempPercent(f) + '%' }"></div>
                </div>
                <span class="temp-high">{{ f.dayTemp }}°</span>
              </div>
              <span class="forecast-expand-icon" :class="{ rotated: expandedDay === f.date }">
                <el-icon :size="14"><ArrowDown /></el-icon>
              </span>
            </div>
            <!-- 展开内容 -->
            <transition name="expand">
              <div v-if="expandedDay === f.date" class="forecast-detail">
                <!-- 有逐小时数据 → 显示该日的小时卡片 -->
                <div v-if="getDayHourly(f.date).length" class="forecast-detail-hourly">
                  <div class="detail-subtitle">逐小时预报</div>
                  <div class="detail-hourly-grid">
                    <div
                      v-for="h in getDayHourly(f.date)"
                      :key="h.time"
                      class="detail-hourly-chip"
                    >
                      <span class="chip-time">{{ h.hour }}</span>
                      <span class="chip-icon">{{ hourlyWeatherIcon(h.weather) }}</span>
                      <span class="chip-temp">{{ h.temp }}°</span>
                    </div>
                  </div>
                </div>
                <!-- 无逐小时 → 显示日夜详情卡片 -->
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
                  <div class="detail-meta" v-if="f.sunrise || f.sunset || f.humidity || f.uvIndex">
                    <span v-if="f.sunrise">🌅 {{ f.sunrise }}</span>
                    <span v-if="f.sunset">🌇 {{ f.sunset }}</span>
                    <span v-if="f.humidity">💧 {{ f.humidity }}%</span>
                    <span v-if="f.uvIndex">☀️ 紫外线{{ f.uvIndex }}</span>
                  </div>
                </div>
              </div>
            </transition>
          </template>
        </div>
      </div>

      <!-- 底部来源 -->
      <div class="weather-footer">
        <span>数据来源：中国气象局 · 仅供参考</span>
      </div>
    </div>

    <div v-else class="weather-panel-body loading">
      <span>🌤️ 天气加载中...</span>
    </div>
  </div>

  <!-- =============================================================== -->
  <!-- 默认模式：入口卡片 + 弹窗（用于旅游攻略等场景）           -->
  <!-- =============================================================== -->
  <template v-else>
    <!-- 入口卡片（有数据时） -->
    <div v-if="weather" class="weather-entry-card" @click="showDialog = true">
      <div class="weather-entry-left">
        <span class="weather-entry-icon">{{ weatherIcon }}</span>
      </div>
      <div class="weather-entry-body">
        <div class="weather-entry-title">{{ weather.weather }}</div>
        <div class="weather-entry-desc">{{ weather.temperature }} &nbsp; 🌬️ {{ weather.wind }}</div>
      </div>
      <div v-if="weather.rainWarning" class="weather-entry-warn">🌧️</div>
      <div class="weather-entry-arrow">
        <el-icon :size="16"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 入口卡片（加载中） -->
    <div v-else-if="loading" class="weather-entry-card loading" @click="showDialog = true">
      <div class="weather-entry-left"><span class="weather-entry-icon">🌤️</span></div>
      <div class="weather-entry-body">
        <div class="weather-entry-title">天气加载中...</div>
        <div class="weather-entry-desc">点击查看详情</div>
      </div>
      <div class="weather-entry-arrow">
        <el-icon :size="16"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 弹窗 -->
    <el-dialog
      v-model="showDialog"
      :width="dialogWidth"
      :close-on-click-modal="false"
      destroy-on-close
      class="weather-dialog"
    >
      <template #header>
        <div class="weather-dialog-header">
          <span class="weather-dialog-header-icon">{{ weatherIcon }}</span>
          <span class="weather-dialog-header-title">天气预报</span>
          <el-tag v-if="locationName" size="small" type="primary" effect="plain" round>{{ locationName }}</el-tag>
        </div>
      </template>

      <div v-if="weather" class="weather-panel-body">
        <!-- 大号天气概览 -->
        <div class="weather-hero">
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

        <!-- 降雨警示 -->
        <div v-if="weather.rainWarning" class="weather-warning">
          <span class="warning-icon">⚠️</span>
          <div class="warning-body">
            <div class="warning-title">降雨提醒</div>
            <div class="warning-text">预计有雨，建议携带雨具，户外景点注意调整时间安排</div>
          </div>
        </div>

        <!-- 出行建议 -->
        <div class="weather-advice">
          <div class="advice-item" :class="weather.rainWarning ? 'caution' : 'good'">
            <span class="advice-icon">{{ weather.rainWarning ? '🧥' : '✅' }}</span>
            <span>{{ weather.rainWarning ? '建议带伞/雨衣，优先安排室内景点' : '天气良好，适合户外游玩' }}</span>
          </div>
          <div class="advice-item neutral">
            <span class="advice-icon">🧴</span>
            <span>{{ weather.weather?.includes('晴') ? '日晒较强，注意防晒补水' : '注意适时增减衣物' }}</span>
          </div>
        </div>

        <!-- 逐小时预报 -->
        <div v-if="weather.hourly?.length" class="weather-hourly">
          <div class="hourly-title">
            <span class="hourly-title-icon">🕐</span>
            <span>逐小时预报</span>
          </div>
          <div class="hourly-scroll">
            <div
              v-for="h in weather.hourly"
              :key="h.time"
              class="hourly-item"
              :class="{ now: isCurrentHour(h) }"
            >
              <span class="hourly-time">{{ isCurrentHour(h) ? '现在' : h.hour }}</span>
              <span class="hourly-weather-icon">{{ hourlyWeatherIcon(h.weather) }}</span>
              <span class="hourly-temp">{{ h.temp }}°</span>
              <span class="hourly-wind" v-if="h.wind">{{ h.wind }}{{ h.windScale || '' }}</span>
            </div>
          </div>
        </div>

        <!-- 未来预报 -->
        <div v-if="weather.forecast?.length" class="weather-forecast">
          <div class="forecast-title">
            <span class="forecast-title-icon">📅</span>
            <span>未来{{ weather.forecast.length }}天预报</span>
            <span class="forecast-hint">点击展开详情</span>
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
                  <div class="temp-track">
                    <div class="temp-fill" :style="{ width: tempPercent(f) + '%' }"></div>
                  </div>
                  <span class="temp-high">{{ f.dayTemp }}°</span>
                </div>
                <span class="forecast-expand-icon" :class="{ rotated: expandedDay === f.date }">
                  <el-icon :size="14"><ArrowDown /></el-icon>
                </span>
              </div>
              <transition name="expand">
                <div v-if="expandedDay === f.date" class="forecast-detail">
                  <div v-if="getDayHourly(f.date).length" class="forecast-detail-hourly">
                    <div class="detail-subtitle">逐小时预报</div>
                    <div class="detail-hourly-grid">
                      <div
                        v-for="h in getDayHourly(f.date)"
                        :key="h.time"
                        class="detail-hourly-chip"
                      >
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
                    <div class="detail-meta" v-if="f.sunrise || f.sunset || f.humidity || f.uvIndex">
                      <span v-if="f.sunrise">🌅 {{ f.sunrise }}</span>
                      <span v-if="f.sunset">🌇 {{ f.sunset }}</span>
                      <span v-if="f.humidity">💧 {{ f.humidity }}%</span>
                      <span v-if="f.uvIndex">☀️ 紫外线{{ f.uvIndex }}</span>
                    </div>
                  </div>
                </div>
              </transition>
            </template>
          </div>
        </div>

        <!-- 底部来源 -->
        <div class="weather-footer">
          <span>数据来源：中国气象局 · 仅供参考</span>
        </div>
      </div>

      <div v-else class="weather-panel-body loading">
        <span>🌤️ 天气加载中...</span>
      </div>
    </el-dialog>
  </template>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowRight, ArrowDown } from '@element-plus/icons-vue'

const props = defineProps({
  weatherData: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  locationName: {
    type: String,
    default: ''
  },
  // direct=true 时直接展示天气内容，跳过入口卡片+弹窗模式
  direct: {
    type: Boolean,
    default: false
  }
})

const showDialog = ref(false)
const expandedDay = ref(null) // 当前展开的未来某天

const weather = computed(() => props.weatherData)

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

function isCurrentHour(h) {
  const now = new Date()
  const hourTime = new Date(h.time)
  return Math.abs(now - hourTime) < 60 * 60 * 1000
}

// 根据日期筛选逐小时数据
function getDayHourly(dateStr) {
  const hourly = weather.value?.hourly || []
  return hourly.filter(h => (h.time || '').startsWith(dateStr))
}

const dialogWidth = computed(() => {
  if (typeof window === 'undefined') return '680px'
  return window.innerWidth < 768 ? '92%' : '680px'
})
</script>

<style lang="scss" scoped src="./WeatherPanel.scss"></style>
<style lang="scss" src="./WeatherPanel-global.scss"></style>

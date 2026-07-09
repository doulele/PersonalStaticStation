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

<style lang="scss" scoped>
// ========== 入口卡片 ==========
.weather-entry-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #eff6ff, #f0f9ff);
  border: 1px solid #bfdbfe;
  border-radius: 14px;
  padding: 12px 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;

  &.loading { opacity: 0.65; cursor: default; }

  &:hover:not(.loading) {
    border-color: #60a5fa;
    box-shadow: 0 4px 18px rgba(59,130,246,0.1);
    transform: translateY(-1px);
  }
  &:active:not(.loading) { transform: translateY(0); }
}

.weather-entry-left {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: rgba(59,130,246,0.08);
  border-radius: 12px;
}
.weather-entry-icon { font-size: 24px; }

.weather-entry-body {
  flex: 1; min-width: 0;
}
.weather-entry-title {
  font-size: 15px; font-weight: 700; color: #1e40af; margin-bottom: 2px;
}
.weather-entry-desc {
  font-size: 12px; color: #64748b;
}

.weather-entry-warn {
  font-size: 18px; flex-shrink: 0;
  animation: shake-warn 2s ease-in-out infinite;
}
@keyframes shake-warn {
  0%, 80%, 100% { transform: rotate(0); }
  85% { transform: rotate(10deg); }
  90% { transform: rotate(-10deg); }
  95% { transform: rotate(5deg); }
}

.weather-entry-arrow {
  color: #93c5fd; flex-shrink: 0;
  transition: transform 0.3s;
  .weather-entry-card:hover & { transform: translateX(3px); color: #3b82f6; }
}

// ========== 弹窗 ==========
.weather-dialog {
  :deep(.el-dialog) {
    border-radius: 20px;
    max-height: 90vh;
  }
  :deep(.el-dialog__header) {
    padding: 18px 24px 14px;
    margin: 0;
    border-bottom: 1px solid #f1f5f9;
  }
  :deep(.el-dialog__body) {
    padding: 0;
    overflow-y: auto;
    max-height: calc(90vh - 70px);
  }
  :deep(.el-dialog__close) {
    top: 18px; right: 20px;
    font-size: 20px; color: #94a3b8;
    &:hover { color: #64748b; background: #f1f5f9; border-radius: 8px; }
  }
}

.weather-dialog-header {
  display: flex; align-items: center; gap: 10px;
}
.weather-dialog-header-icon { font-size: 22px; }
.weather-dialog-header-title {
  font-size: 18px; font-weight: 700; color: #0f172a;
}

// ========== 弹窗内容体 ==========
.weather-panel-body {
  padding: 20px 28px 28px;
  &.loading { opacity: 0.7; font-size: 13px; color: #64748b; text-align: center; padding: 40px 20px; }
}

// 大号概览
.weather-hero {
  display: flex; align-items: center; gap: 20px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-radius: 16px;
  margin-bottom: 18px;
}
.weather-hero-icon { font-size: 56px; flex-shrink: 0; }
.weather-hero-info { flex-shrink: 0; }
.weather-hero-temp {
  font-size: 48px; font-weight: 800; color: #1e40af;
  line-height: 1; margin-bottom: 4px;
}
.weather-hero-desc {
  font-size: 16px; font-weight: 600; color: #475569;
}
.weather-hero-extras {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 8px 16px; margin-left: auto;
}
.weather-extra-item {
  display: flex; flex-direction: column; gap: 1px;
  text-align: right;
}
.extra-label { font-size: 11px; color: #64748b; }
.extra-value { font-size: 13px; font-weight: 600; color: #0f172a; }

// 降雨警示
.weather-warning {
  display: flex; gap: 10px;
  margin-bottom: 14px; padding: 12px 14px;
  background: #fee2e2; border-radius: 10px;
  border: 1px solid #fecaca;
}
.warning-icon { font-size: 20px; flex-shrink: 0; }
.warning-body { min-width: 0; }
.warning-title { font-size: 13px; font-weight: 700; color: #dc2626; margin-bottom: 2px; }
.warning-text { font-size: 12px; color: #b91c1c; line-height: 1.5; }

// 出行建议
.weather-advice {
  display: flex; flex-direction: column; gap: 6px;
  margin-bottom: 14px;
}
.advice-item {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 10px;
  font-size: 12px; color: #475569; line-height: 1.5;
  &.good { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
  &.caution { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
  &.neutral { background: #f8fafc; border: 1px solid #e2e8f0; }
}
.advice-icon { font-size: 16px; flex-shrink: 0; }

// 未来预报
.weather-forecast {
  padding-top: 18px;
  border-top: 1px solid #f1f5f9;
}
.forecast-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: #475569;
  margin-bottom: 10px;
}
.forecast-title-icon { font-size: 15px; }
.forecast-hint {
  font-size: 11px; font-weight: 400; color: #94a3b8;
  margin-left: auto;
}

.forecast-list {
  display: flex; flex-direction: column; gap: 6px;
}
.forecast-item {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #f8fafc;
  transition: background 0.2s;
  cursor: pointer;
  user-select: none;

  &.today {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
  }
  &.expanded {
    background: #f0f9ff;
    border: 1px solid #93c5fd;
    border-radius: 10px 10px 0 0;
  }
  &:hover { background: #f0f9ff; }
  &.today:hover { background: #e0f2fe; }
}
.forecast-date {
  font-size: 12px; font-weight: 500; color: #475569;
  min-width: 50px; flex-shrink: 0;
  .today-badge {
    font-size: 9px; color: #2563eb; background: #dbeafe;
    padding: 1px 5px; border-radius: 4px; margin-left: 4px;
    font-weight: 600;
  }
}
.forecast-icon { font-size: 22px; flex-shrink: 0; }
.forecast-weather {
  font-size: 13px; font-weight: 500; color: #0f172a;
  flex-shrink: 0; min-width: 48px;
}
.forecast-expand-icon {
  flex-shrink: 0; color: #94a3b8;
  transition: transform 0.3s;
  &.rotated { transform: rotate(180deg); color: #2563eb; }
}

.forecast-temp-bar {
  display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0;
}
.temp-low { font-size: 11px; color: #60a5fa; font-weight: 600; }
.temp-high { font-size: 11px; color: #f87171; font-weight: 600; }
.temp-track {
  flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px;
  overflow: hidden;
}
.temp-fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, #60a5fa, #fbbf24, #f87171);
  min-width: 4px; transition: width 0.5s ease;
}

// ★★★ 逐小时预报（横向滚动） ★★★
.weather-hourly {
  margin-bottom: 14px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
}
.hourly-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: #475569;
  margin-bottom: 10px;
}
.hourly-title-icon { font-size: 15px; }

.hourly-scroll {
  display: flex; gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 2px; }
  &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
}

.hourly-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  flex-shrink: 0;
  width: 62px; padding: 8px 4px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid transparent;
  transition: all 0.2s;

  &.now {
    background: #eff6ff;
    border-color: #93c5fd;
    .hourly-time { font-weight: 700; color: #2563eb; }
    .hourly-temp { font-weight: 700; color: #1e40af; }
  }
}
.hourly-time { font-size: 11px; color: #64748b; white-space: nowrap; }
.hourly-weather-icon { font-size: 20px; }
.hourly-temp { font-size: 14px; font-weight: 600; color: #0f172a; }
.hourly-wind { font-size: 9px; color: #94a3b8; white-space: nowrap; }

// ★★★ 展开详情 ★★★
.forecast-detail {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 10px 10px;
  padding: 12px 14px;
  margin-top: -6px;
}

// 展开过渡动画
.expand-enter-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  border-width: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 600px;
}

.forecast-detail-hourly {
  .detail-subtitle {
    font-size: 12px; font-weight: 600; color: #475569;
    margin-bottom: 8px;
  }
}
.detail-hourly-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 6px;
}
.detail-hourly-chip {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 6px 4px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}
.chip-time { font-size: 10px; color: #64748b; }
.chip-icon { font-size: 18px; }
.chip-temp { font-size: 12px; font-weight: 600; color: #0f172a; }

.forecast-detail-cards {
  display: grid; gap: 8px;
}
.detail-card {
  display: flex; gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  &.day {
    background: linear-gradient(135deg, #fff7ed, #fffbeb);
    border: 1px solid #fde68a;
  }
  &.night {
    background: linear-gradient(135deg, #eff6ff, #f0f9ff);
    border: 1px solid #bfdbfe;
  }
}
.detail-card-header {
  font-size: 13px; font-weight: 600; color: #475569;
  flex-shrink: 0; min-width: 50px;
}
.detail-card-body { flex: 1; min-width: 0; }
.detail-card-temp { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.2; }
.detail-card-desc { font-size: 13px; color: #475569; margin-top: 2px; }
.detail-card-wind { font-size: 11px; color: #64748b; margin-top: 2px; }
.detail-meta {
  display: flex; flex-wrap: wrap; gap: 10px;
  margin-top: 8px;
  font-size: 11px; color: #64748b;
}

// 底部来源
.weather-footer {
  margin-top: 16px; padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  text-align: center;
  font-size: 11px; color: #94a3b8;
}

// ========== 响应式 ==========
@media (max-width: 768px) {
  .weather-entry-card {
    padding: 10px 12px; gap: 8px;
    border-radius: 12px;
  }
  .weather-entry-left { width: 36px; height: 36px; border-radius: 10px; }
  .weather-entry-icon { font-size: 20px; }
  .weather-entry-title { font-size: 13px; }
  .weather-entry-desc { font-size: 11px; }

  .weather-dialog {
    :deep(.el-dialog) { border-radius: 16px; margin: 0 8px !important; }
    :deep(.el-dialog__header) { padding: 14px 16px 10px; }
    :deep(.el-dialog__body) { max-height: calc(85vh - 60px); }
    :deep(.el-dialog__close) { top: 14px; right: 14px; }
  }
  .weather-dialog-header-title { font-size: 16px; }

  .weather-panel-body { padding: 12px 14px 20px; }
  .weather-hero {
    flex-wrap: wrap; padding: 14px 16px; gap: 12px;
  }
  .weather-hero-icon { font-size: 40px; }
  .weather-hero-temp { font-size: 36px; }
  .weather-hero-desc { font-size: 14px; }
  .weather-hero-extras { width: 100%; margin-left: 0; }
  .weather-extra-item { text-align: left; }
  .forecast-item { flex-wrap: wrap; gap: 8px; }
  .forecast-weather { min-width: auto; }
  .forecast-temp-bar { flex: 1 1 100%; }
  .forecast-expand-icon { margin-left: auto; }

  .hourly-scroll { gap: 6px; }
  .hourly-item { width: 54px; padding: 6px 2px; }
  .hourly-temp { font-size: 12px; }
  .hourly-weather-icon { font-size: 18px; }

  .detail-hourly-grid { grid-template-columns: repeat(4, 1fr); }
  .forecast-detail-cards { grid-template-columns: 1fr; }
}

// ========== Direct 模式（直显，无弹窗） ==========
.weather-direct-panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
}

.weather-direct-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-bottom: 1px solid #bfdbfe;
}

.weather-direct-header-icon {
  font-size: 22px;
}

.weather-direct-header-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

@media (max-width: 768px) {
  .weather-direct-header {
    padding: 12px 16px;
  }
  .weather-direct-header-title {
    font-size: 15px;
  }
}

</style>

<style lang="scss">
// ==================== 夜间模式（独立非 scoped 块） ====================
html.dark-mode {
  // 入口卡片
  .weather-entry-card {
    background: linear-gradient(135deg, #14142e, #13132e);
    border-color: #2d3f8c;
    &:hover:not(.loading) {
      border-color: #4a6bd4;
      box-shadow: 0 4px 18px rgba(59,130,246,0.15);
    }
  }
  .weather-entry-left { background: rgba(59,130,246,0.12); }
  .weather-entry-title { color: #93c5fd; }
  .weather-entry-desc { color: #94a3b8; }
  .weather-entry-arrow { color: #4a6bd4; }
  .weather-entry-warn { }

  // 弹窗
  .weather-dialog {
    .el-dialog__header { border-bottom-color: #2d2d4a; }
    .el-dialog__close { color: #64748b; &:hover { background: #252540; } }
  }
  .weather-dialog-header-title { color: #e2dee9; }
  .weather-panel-body {
    &.loading { color: #94a3b8; }
  }

  // 大号概览
  .weather-hero {
    background: linear-gradient(135deg, #14142e, #1a1a3e);
  }
  .weather-hero-temp { color: #93c5fd; }
  .weather-hero-desc { color: #94a3b8; }
  .extra-label { color: #94a3b8; }
  .extra-value { color: #e2dee9; }

  // 降雨警示
  .weather-warning { background: #3b1010; border-color: #5c2020; }
  .warning-title { color: #f87171; }
  .warning-text { color: #fca5a5; }

  // 出行建议
  .advice-item {
    &.good { background: #0a2e1a; border-color: #1a5c3a; color: #4ade80; }
    &.caution { background: #2e1f0a; border-color: #5c3d1a; color: #fbbf24; }
    &.neutral { background: #1a1a2e; border-color: #2d2d4a; color: #94a3b8; }
  }

  // 未来预报
  .weather-forecast { border-top-color: #2d2d4a; }
  .forecast-title { color: #94a3b8; }
  .forecast-hint { color: #64748b; }
  .forecast-item {
    background: #1a1a2e;
    &.today { background: #14142e; border-color: #2d3f8c; }
    &.expanded { background: #1a1a3e; border-color: #4a6bd4; }
    &:hover { background: #1e1e3c; }
    &.today:hover { background: #1a2040; }
  }
  .forecast-date { color: #94a3b8; }
  .today-badge { background: #1a2050; color: #93c5fd; }
  .forecast-weather { color: #e2dee9; }
  .forecast-expand-icon { color: #64748b; &.rotated { color: #93c5fd; } }
  .temp-track { background: #2d2d4a; }
  .temp-low { color: #93c5fd; }
  .temp-high { color: #f87171; }

  // 逐小时
  .weather-hourly { border-top-color: #2d2d4a; }
  .hourly-title { color: #94a3b8; }
  .hourly-scroll {
    &::-webkit-scrollbar-track { background: #1a1a2e; }
    &::-webkit-scrollbar-thumb { background: #3d3d5c; }
  }
  .hourly-item {
    background: #1a1a2e;
    &.now { background: #14142e; border-color: #4a6bd4; .hourly-time { color: #93c5fd; } .hourly-temp { color: #93c5fd; } }
  }
  .hourly-time { color: #94a3b8; }
  .hourly-temp { color: #e2dee9; }
  .hourly-wind { color: #64748b; }

  // 展开详情
  .forecast-detail { background: #1a1a2e; border-color: #2d2d4a; }
  .detail-subtitle { color: #94a3b8; }
  .detail-hourly-chip { background: #13132a; border-color: #252540; }
  .chip-time { color: #94a3b8; }
  .chip-temp { color: #e2dee9; }
  .detail-card {
    &.day { background: linear-gradient(135deg, #1a1a0e, #1f1a0e); border-color: #5c3d1a; }
    &.night { background: linear-gradient(135deg, #14142e, #13132e); border-color: #2d3f8c; }
  }
  .detail-card-header { color: #94a3b8; }
  .detail-card-temp { color: #e2dee9; }
  .detail-card-desc { color: #94a3b8; }
  .detail-card-wind { color: #64748b; }
  .detail-meta { color: #64748b; }

  // 底部
  .weather-footer { border-top-color: #2d2d4a; color: #64748b; }

  // Direct 模式
  .weather-direct-panel {
    background: #1a1a2e;
    border-color: #2d2d4a;
  }
  .weather-direct-header {
    background: linear-gradient(135deg, #14142e, #13132e);
    border-bottom-color: #2d3f8c;
  }
  .weather-direct-header-title { color: #e2dee9; }
}
</style>

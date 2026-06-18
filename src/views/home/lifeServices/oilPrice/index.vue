<template>
  <div class="oil-price-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text class="back-btn" @click="$router.back()">返回</el-button>
      <div class="header-center">
        <h1 class="page-title">⛽ 今日油价</h1>
        <p class="page-desc">全国各地实时油价查询</p>
      </div>
      <div class="header-spacer"></div>
    </div>

    <!-- 省份选择 -->
    <div class="filter-section">
      <div class="province-tabs">
        <button
          v-for="p in provinces"
          :key="p"
          class="province-btn"
          :class="{ active: activeProvince === p }"
          :disabled="loading"
          @click="selectProvince(p)"
        >
          {{ p }}
        </button>
      </div>
    </div>

    <!-- 数据更新提示 -->
    <div v-if="updateTime" class="update-bar">
      <el-icon :size="14"><Clock /></el-icon>
      <span>数据更新时间：{{ updateTime }}</span>
      <el-button text size="small" @click="refreshData">刷新</el-button>
    </div>

    <!-- 油价卡片 -->
    <div v-if="loading" class="loading-area">
      <el-icon class="is-loading" :size="28"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <div v-else class="oil-grid">
      <div v-for="city in cityPrices" :key="city.name" class="oil-card">
        <div class="card-header">
          <h3 class="city-name">
            <el-icon :size="16"><LocationFilled /></el-icon>
            {{ city.name }}
          </h3>
          <el-tag size="small" type="info">{{ activeProvince }}</el-tag>
        </div>
        <div class="price-list">
          <div v-for="(price, type) in city.prices" :key="type" class="price-item">
            <span class="price-type">{{ type }}</span>
            <span class="price-value">{{ price }}</span>
            <span class="price-unit">元/升</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 全国均价 -->
    <div class="national-avg" v-if="!loading && nationalAvg.length">
      <h3 class="avg-title">📊 全国平均油价参考</h3>
      <div class="avg-grid">
        <div v-for="item in nationalAvg" :key="item.type" class="avg-item">
          <span class="avg-type">{{ item.type }}</span>
          <span class="avg-value">{{ item.value }}</span>
          <span class="avg-unit">元/升</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, Clock, Loading, LocationFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// Mock 数据 - 全国各省份城市油价
const allPrices = {
  '北京': [
    { name: '北京', prices: { '92号汽油': '7.88', '95号汽油': '8.39', '98号汽油': '9.89', '0号柴油': '7.60' } }
  ],
  '上海': [
    { name: '上海', prices: { '92号汽油': '7.85', '95号汽油': '8.35', '98号汽油': '9.85', '0号柴油': '7.54' } }
  ],
  '广东': [
    { name: '广州', prices: { '92号汽油': '7.91', '95号汽油': '8.57', '98号汽油': '10.57', '0号柴油': '7.57' } },
    { name: '深圳', prices: { '92号汽油': '7.91', '95号汽油': '8.57', '98号汽油': '10.57', '0号柴油': '7.57' } },
    { name: '珠海', prices: { '92号汽油': '7.91', '95号汽油': '8.57', '98号汽油': '10.57', '0号柴油': '7.57' } }
  ],
  '浙江': [
    { name: '杭州', prices: { '92号汽油': '7.86', '95号汽油': '8.36', '98号汽油': '9.86', '0号柴油': '7.55' } },
    { name: '宁波', prices: { '92号汽油': '7.86', '95号汽油': '8.36', '98号汽油': '9.86', '0号柴油': '7.55' } }
  ],
  '江苏': [
    { name: '南京', prices: { '92号汽油': '7.86', '95号汽油': '8.36', '98号汽油': '9.86', '0号柴油': '7.53' } },
    { name: '苏州', prices: { '92号汽油': '7.86', '95号汽油': '8.36', '98号汽油': '9.86', '0号柴油': '7.53' } }
  ],
  '四川': [
    { name: '成都', prices: { '92号汽油': '7.99', '95号汽油': '8.54', '98号汽油': '9.28', '0号柴油': '7.61' } }
  ],
  '湖北': [
    { name: '武汉', prices: { '92号汽油': '7.89', '95号汽油': '8.45', '98号汽油': '9.95', '0号柴油': '7.55' } }
  ],
  '山东': [
    { name: '济南', prices: { '92号汽油': '7.86', '95号汽油': '8.43', '98号汽油': '9.15', '0号柴油': '7.48' } },
    { name: '青岛', prices: { '92号汽油': '7.86', '95号汽油': '8.43', '98号汽油': '9.15', '0号柴油': '7.48' } }
  ],
  '湖南': [
    { name: '长沙', prices: { '92号汽油': '7.84', '95号汽油': '8.33', '98号汽油': '9.33', '0号柴油': '7.62' } }
  ],
  '河南': [
    { name: '郑州', prices: { '92号汽油': '7.89', '95号汽油': '8.43', '98号汽油': '9.28', '0号柴油': '7.54' } }
  ],
  '福建': [
    { name: '福州', prices: { '92号汽油': '7.85', '95号汽油': '8.38', '98号汽油': '9.88', '0号柴油': '7.55' } },
    { name: '厦门', prices: { '92号汽油': '7.85', '95号汽油': '8.38', '98号汽油': '9.88', '0号柴油': '7.55' } }
  ],
  '安徽': [
    { name: '合肥', prices: { '92号汽油': '7.85', '95号汽油': '8.40', '98号汽油': '9.60', '0号柴油': '7.60' } }
  ],
  '河北': [
    { name: '石家庄', prices: { '92号汽油': '7.88', '95号汽油': '8.32', '98号汽油': '9.14', '0号柴油': '7.56' } }
  ],
  '重庆': [
    { name: '重庆', prices: { '92号汽油': '7.96', '95号汽油': '8.41', '98号汽油': '9.48', '0号柴油': '7.63' } }
  ],
  '陕西': [
    { name: '西安', prices: { '92号汽油': '7.78', '95号汽油': '8.22', '98号汽油': '9.72', '0号柴油': '7.45' } }
  ],
  '云南': [
    { name: '昆明', prices: { '92号汽油': '8.04', '95号汽油': '8.63', '98号汽油': '9.31', '0号柴油': '7.63' } }
  ],
  '贵州': [
    { name: '贵阳', prices: { '92号汽油': '8.02', '95号汽油': '8.47', '98号汽油': '9.37', '0号柴油': '7.67' } }
  ],
  '广西': [
    { name: '南宁', prices: { '92号汽油': '7.95', '95号汽油': '8.59', '98号汽油': '9.73', '0号柴油': '7.62' } }
  ],
  '海南': [
    { name: '海口', prices: { '92号汽油': '9.00', '95号汽油': '9.56', '98号汽油': '10.82', '0号柴油': '7.65' } }
  ],
  '江西': [
    { name: '南昌', prices: { '92号汽油': '7.85', '95号汽油': '8.43', '98号汽油': '9.93', '0号柴油': '7.61' } }
  ]
}

const provinces = Object.keys(allPrices)
const activeProvince = ref('北京')
const loading = ref(false)
const updateTime = ref('')

// 全国平均油价
const nationalAvg = [
  { type: '92号汽油', value: '7.90' },
  { type: '95号汽油', value: '8.42' },
  { type: '98号汽油', value: '9.65' },
  { type: '0号柴油', value: '7.57' }
]

const cityPrices = computed(() => {
  return allPrices[activeProvince.value] || []
})

function selectProvince(province) {
  if (loading.value) return
  activeProvince.value = province
  loading.value = true
  setTimeout(() => { loading.value = false }, 300)
}

function refreshData() {
  selectProvince(activeProvince.value)
  ElMessage.success('数据已更新')
}

onMounted(() => {
  const now = new Date()
  updateTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
})
</script>

<style lang="scss" scoped>
.oil-price-page {
  padding: 40px 24px;
  max-width: 1100px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 28px;
}
.back-btn { flex-shrink: 0; }
.header-center { flex: 1; text-align: center; }
.header-spacer { flex-shrink: 0; width: 60px; }

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
  letter-spacing: -0.02em;
}
.page-desc { font-size: 16px; color: #64748b; }

// Filter
.filter-section { margin-bottom: 24px; }
.province-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}
.province-btn {
  padding: 6px 14px;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 8px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  &:hover { border-color: #10b981; color: #10b981; }
  &.active { background: linear-gradient(135deg, #10b981, #059669); color: #fff; border-color: #10b981; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

// Update bar
.update-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  margin-bottom: 24px;
  font-size: 13px;
  color: #059669;
}

// Loading
.loading-area {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 60px 0; color: #10b981; font-size: 15px;
}

// Oil grid
.oil-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 40px;
}

.oil-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.25s;
  &:hover {
    border-color: #10b981;
    box-shadow: 0 6px 20px rgba(16,185,129,0.08);
    transform: translateY(-2px);
  }
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border-bottom: 1px solid #d1fae5;
}
.city-name {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.price-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  background: #f1f5f9;
}
.price-item {
  background: #fff;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.price-type {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}
.price-value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}
.price-unit {
  font-size: 11px;
  color: #94a3b8;
}

// National average
.national-avg { margin-bottom: 40px; }
.avg-title { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; text-align: center; }
.avg-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border: 1px solid #bbf7d0;
  border-radius: 14px;
  padding: 24px;
}
.avg-item {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.avg-type { font-size: 13px; color: #059669; font-weight: 500; }
.avg-value { font-size: 28px; font-weight: 700; color: #0f172a; }
.avg-unit { font-size: 11px; color: #94a3b8; }

// Responsive
@media (max-width: 768px) {
  .oil-price-page { padding: 24px 16px; }
  .page-title { font-size: 28px; }
  .oil-grid { grid-template-columns: 1fr; }
  .avg-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; padding: 16px; }
  .price-value { font-size: 20px; }
}

@media (max-width: 480px) {
  .province-btn { padding: 5px 10px; font-size: 12px; }
  .avg-grid { gap: 12px; padding: 14px; }
  .avg-value { font-size: 22px; }
}
</style>

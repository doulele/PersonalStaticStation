<template>
  <div class="budget-overview">
    <div class="budget-header">
      <h3 class="budget-title">💰 预算概览</h3>
      <div class="traveler-input">
        <span class="traveler-label">人数</span>
        <el-input-number
          :model-value="travelerCount"
          :min="1"
          :max="20"
          size="small"
          controls-position="right"
          @change="count => $emit('update:travelerCount', count)"
        />
      </div>
    </div>
    <div class="budget-grid">
      <div class="budget-item">
        <div class="budget-icon spot-icon">🎫</div>
        <div class="budget-info">
          <span class="budget-label">景点门票</span>
          <span class="budget-value">¥{{ detail.spotBudget }}</span>
        </div>
      </div>
      <div class="budget-item">
        <div class="budget-icon food-icon">🍽️</div>
        <div class="budget-info">
          <span class="budget-label">美食餐饮</span>
          <span class="budget-value">¥{{ detail.foodBudget }}</span>
        </div>
      </div>
      <div class="budget-item">
        <div class="budget-icon transport-icon">🚗</div>
        <div class="budget-info">
          <span class="budget-label">交通预估{{ detail.transportLabel ? ` (${detail.transportLabel})` : '' }}</span>
          <span class="budget-value">¥{{ detail.transportBudget }}</span>
        </div>
      </div>
      <div class="budget-item total-item">
        <div class="budget-info">
          <span class="budget-label">总预算 / 人均</span>
          <span class="budget-value price">
            ¥{{ detail.totalBudget }}
            <span class="per-person">/ ¥{{ detail.perPerson }}/人</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

defineProps({
  travelerCount: { type: Number, default: 1 }
})

defineEmits(['update:travelerCount'])

const detail = computed(() => store.getters['plan/budgetDetail'])
</script>

<style lang="scss" scoped>
.budget-overview {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.03);
}
.budget-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.budget-title { font-size: 14px; font-weight: 600; color: #0f172a; margin: 0; }
.traveler-input { display: flex; align-items: center; gap: 8px; }
.traveler-label { font-size: 12px; color: #64748b; }
.budget-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.budget-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; background: #f8fafc; border-radius: 10px;
}
.budget-icon { font-size: 18px; line-height: 1; }
.budget-info { display: flex; flex-direction: column; gap: 2px; }
.budget-label { font-size: 10px; color: #94a3b8; }
.budget-value { font-size: 15px; font-weight: 700; color: #0f172a; }
.price { color: #6366f1; }
.per-person { font-size: 11px; color: #94a3b8; font-weight: 400; }
.total-item {
  background: linear-gradient(135deg, #eef2ff, #faf5ff);
  .budget-value { font-size: 18px; }
}

@media (max-width: 768px) {
  .budget-grid { grid-template-columns: repeat(2, 1fr); }
  .budget-item { padding: 8px 10px; gap: 6px; }
}
</style>

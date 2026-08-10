<template>
  <div class="item-row" :class="{ checked: item.checked }">
    <!-- 勾选 -->
    <span
      class="item-check"
      :class="{ done: item.checked }"
      @click="$emit('toggle', item.id)"
    >
      <span class="check-icon" :class="{ empty: !item.checked }"></span>
    </span>

    <!-- 名称 -->
    <span class="item-name" :title="item.note || item.name" @click="$emit('edit', item)">
      {{ item.name }}
      <span v-if="item.note" class="item-note-dot" title="有备注">💬</span>
    </span>

    <!-- 数量 -->
    <span class="item-qty">
      <span class="qty-btn" @click.stop="$emit('qtyChange', item.id, -1)">−</span>
      <span class="qty-val">{{ item.quantity }}</span>
      <span class="qty-btn" @click.stop="$emit('qtyChange', item.id, 1)">+</span>
    </span>

    <!-- 删除 -->
    <span class="item-action del" @click.stop="$emit('delete', item.id)" title="删除">
      <el-icon><Close /></el-icon>
    </span>
  </div>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue'

defineProps({
  item: { type: Object, required: true }
})

defineEmits(['toggle', 'edit', 'delete', 'qtyChange'])
</script>

<style lang="scss" scoped src="./ItemRow.scss"></style>

<style lang="scss">
// ==================== 夜间模式（独立非 scoped 块） ====================
html.dark-mode .item-row {
  + .item-row {
    border-top-color: #252540;
  }

  &:hover {
    background: #1e1e3c;
  }

  &.checked {
    .item-name {
      color: #64748b;
    }
  }

  .item-check {
    border-color: #3d3d5c;
    background: transparent;

    &:not(.done):hover {
      border-color: #7c3aed;
      background: #1e1e3c;
    }
  }

  .item-name {
    color: #e2dee9;

    &:hover {
      color: #a78bfa;
    }
  }

  .item-qty {
    background: #252540;
  }

  .qty-btn {
    color: #94a3b8;

    &:hover {
      background: #3d3d5c;
      color: #e2dee9;
    }

    &:active {
      background: #4a4a6a;
    }
  }

  .qty-val {
    color: #e2dee9;
  }

  .item-action {
    color: #64748b;

    &.del:hover {
      background: #3b1010;
      color: #f87171;
    }
  }
}
</style>

<style lang="scss">
// Element Plus 全局弹窗适配
html.dark-mode .el-message-box {
  background: #1a1a2e !important;
  border-color: #2d2d4a !important;
  .el-message-box__title { color: #e2dee9 !important; }
  .el-message-box__content { color: #94a3b8 !important; }
}
</style>

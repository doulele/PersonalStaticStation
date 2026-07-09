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

<style lang="scss" scoped>
$brand: #6366f1;
$text-primary: #0f172a;
$text-secondary: #64748b;
$text-muted: #94a3b8;

.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  transition: background 0.15s;

  + .item-row {
    border-top: 1px solid #f1f5f9;
  }

  &:hover {
    background: #f8f7ff;

    .item-action {
      opacity: 1;
    }
  }

  &.checked {
    .item-name {
      color: $text-muted;
    }
  }
}

// 勾选框
.item-check {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
  border: 2px solid #e2e8f0;

  .check-icon {
    display: block;
    width: 5px;
    height: 9px;
    border: solid transparent;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    margin-top: -2px;
    transition: all 0.2s;
  }

  &.done {
    background: $brand;
    border-color: $brand;

    .check-icon {
      border-color: #fff;
    }
  }

  &:not(.done):hover {
    border-color: $brand;
    background: #f0f0ff;
  }
}

// 名称
.item-name {
  flex: 1;
  font-size: 14px;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
  cursor: pointer;
  min-width: 0;

  &:hover {
    color: $brand;
  }
}

.item-note-dot {
  font-size: 10px;
  margin-left: 4px;
  opacity: 0.5;
  vertical-align: middle;
  flex-shrink: 0;
}

// 数量
.item-qty {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 8px;
  flex-shrink: 0;
  overflow: hidden;
}

.qty-btn {
  width: 24px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  color: $text-secondary;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s;

  &:hover {
    background: #e2e8f0;
    color: $text-primary;
  }

  &:active {
    background: #cbd5e1;
  }
}

.qty-val {
  min-width: 20px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: $text-primary;
  padding: 2px 4px;
}

// 删除按钮
.item-action {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
  opacity: 0;
  color: $text-muted;
  font-size: 14px;

  &.del:hover {
    background: #fef2f2;
    color: #ef4444;
  }
}

// 移动端始终显示操作按钮
@media (hover: none) {
  .item-action {
    opacity: 1;
  }
}
</style>

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

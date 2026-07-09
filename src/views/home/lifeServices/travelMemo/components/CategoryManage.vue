<template>
  <el-dialog
    :model-value="visible"
    title="管理分类"
    width="420px"
    destroy-on-close
    @close="$emit('close')"
  >
    <div class="cat-list">
      <div v-for="(cat, idx) in localCategories" :key="cat.id" class="cat-row">
        <span class="cat-grip">⠿</span>
        <span class="cat-icon">{{ cat.icon }}</span>
        <el-input
          v-model="cat.name"
          size="small"
          class="cat-name-input"
          maxlength="10"
        />
        <span class="cat-arrow up" :class="{ disabled: idx === 0 }" @click="move(idx, -1)">▲</span>
        <span class="cat-arrow down" :class="{ disabled: idx === localCategories.length - 1 }" @click="move(idx, 1)">▼</span>
        <span class="cat-delete" @click="remove(idx)" title="删除">✕</span>
      </div>
    </div>

    <el-button class="add-cat-btn" @click="add" style="width: 100%; margin-top: 12px;">
      + 添加分类
    </el-button>

    <template #footer>
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  categories: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'save'])

const localCategories = ref([])

watch(() => props.visible, (val) => {
  if (val) {
    localCategories.value = props.categories.map(c => ({ ...c }))
  }
})

let nextId = Date.now()
function genId() { return 'cat_' + (nextId++) }

function add() {
  localCategories.value.push({
    id: genId(),
    name: '新分类',
    icon: '📦',
    sortOrder: localCategories.value.length
  })
}

function remove(idx) {
  if (localCategories.value.length <= 1) {
    // 使用消息提示
    return
  }
  localCategories.value.splice(idx, 1)
}

function move(idx, dir) {
  const newIdx = idx + dir
  if (newIdx < 0 || newIdx >= localCategories.value.length) return
  const temp = localCategories.value[idx]
  localCategories.value[idx] = localCategories.value[newIdx]
  localCategories.value[newIdx] = temp
  localCategories.value.forEach((c, i) => c.sortOrder = i)
}

function save() {
  // 过滤空名称
  const valid = localCategories.value.filter(c => c.name.trim())
  if (valid.length === 0) return
  valid.forEach((c, i) => { c.sortOrder = i; c.name = c.name.trim() })
  emit('save', valid)
}
</script>

<style lang="scss" scoped>
.cat-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
}

.cat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #f9fafb;
  border-radius: 8px;
}

.cat-grip {
  color: #d1d5db;
  cursor: grab;
  font-size: 18px;
  user-select: none;
}

.cat-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.cat-name-input {
  flex: 1;
}

.cat-arrow {
  font-size: 12px;
  cursor: pointer;
  color: #6b7280;
  padding: 2px 4px;
  border-radius: 3px;
  user-select: none;

  &:hover:not(.disabled) { background: #e5e7eb; }
  &.disabled { color: #d1d5db; cursor: not-allowed; }
}

.cat-delete {
  color: #d1d5db;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 3px;
  user-select: none;

  &:hover { color: #ef4444; background: #fef2f2; }
}

.add-cat-btn {
  border-style: dashed;
}
</style>

<style lang="scss">
// ==================== 夜间模式（独立非 scoped 块） ====================
html.dark-mode .cat-row {
  background: #1a1a2e;
}

html.dark-mode .cat-grip {
  color: #3d3d5c;
}

html.dark-mode .cat-arrow {
  color: #94a3b8;
  &:hover:not(.disabled) { background: #252540; }
  &.disabled { color: #3d3d5c; }
}

html.dark-mode .cat-delete {
  color: #3d3d5c;
  &:hover { color: #f87171; background: #3b1010; }
}

html.dark-mode .el-dialog {
  background: #1a1a2e !important;
  .el-dialog__title { color: #e2dee9 !important; }
  .el-dialog__header { border-bottom-color: #2d2d4a !important; }
  .el-dialog__close { color: #64748b !important; &:hover { color: #e2dee9 !important; } }
  .el-dialog__body { color: #94a3b8 !important; }
}
html.dark-mode .el-form-item__label { color: #94a3b8 !important; }
html.dark-mode .el-input__wrapper {
  background: #252540 !important;
  border-color: #2d2d4a !important;
  box-shadow: none !important;
}
html.dark-mode .el-input__inner {
  color: #e2dee9 !important;
  &::placeholder { color: #64748b !important; }
}
html.dark-mode .el-button--default {
  background: #1e1e3c !important;
  border-color: #2d2d4a !important;
  color: #e2dee9 !important;
  &:hover { background: #252540 !important; border-color: #3d3d6c !important; }
}
html.dark-mode .el-button--primary {
  background: #6366f1 !important;
  border-color: #6366f1 !important;
  color: #fff !important;
  &:hover { background: #818cf8 !important; border-color: #818cf8 !important; }
}
</style>

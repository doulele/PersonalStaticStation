<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑物品' : '添加新物品'"
    width="420px"
    :close-on-click-modal="false"
    destroy-on-close
    @close="$emit('close')"
  >
    <el-form :model="form" label-position="top" @submit.prevent>
      <el-form-item label="物品名称" required>
        <el-input
          v-model="form.name"
          placeholder="例如：充电器、防晒霜"
          maxlength="20"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="所属分类">
        <el-select v-model="form.categoryId" style="width: 100%">
          <el-option
            v-for="cat in categories"
            :key="cat.id"
            :label="cat.name"
            :value="cat.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="数量">
        <el-input-number
          v-model="form.quantity"
          :min="1"
          :max="99"
          style="width: 120px"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" @click="handleSave" :disabled="!form.name.trim()">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  item: { type: Object, default: null },       // null = 新增, 有值 = 编辑
  categories: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'save'])

const isEdit = computed(() => !!props.item?.id)

const defaultForm = () => ({
  name: '',
  categoryId: props.categories[0]?.id || '',
  quantity: 1,
  note: '',
  icon: '📦',
  assigneeId: null
})

const form = ref(defaultForm())

watch(() => props.visible, (val) => {
  if (val) {
    if (props.item) {
      form.value = {
        name: props.item.name || '',
        categoryId: props.item.categoryId || props.categories[0]?.id || '',
        quantity: props.item.quantity || 1,
        note: props.item.note || '',
        icon: props.item.icon || '📦',
        assigneeId: props.item.assigneeId || null
      }
    } else {
      form.value = defaultForm()
    }
  }
})

function handleSave() {
  if (!form.value.name.trim()) return
  emit('save', { ...form.value, name: form.value.name.trim() })
}
</script>

<style lang="scss" scoped>
</style>

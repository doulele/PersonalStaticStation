<template>
  <el-dialog
    :model-value="visible"
    title="新增分类"
    width="400px"
    :close-on-click-modal="false"
    destroy-on-close
    @close="$emit('close')"
  >
    <el-form :model="form" label-position="top" @submit.prevent>
      <el-form-item label="分类名称" required>
        <el-input
          v-model="form.name"
          placeholder="例如：洗漱用品、露营野餐装备"
          maxlength="12"
          show-word-limit
          @keyup.enter="handleSave"
        />
      </el-form-item>

      <el-form-item label="备注说明">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="2"
          placeholder="例如：电器、充电类，每人必备"
          maxlength="40"
          show-word-limit
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
import { ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'save'])

const form = ref({ name: '', note: '' })

watch(() => props.visible, (val) => {
  if (val) {
    form.value = { name: '', note: '' }
  }
})

function handleSave() {
  if (!form.value.name.trim()) return
  emit('save', {
    name: form.value.name.trim(),
    note: form.value.note.trim()
  })
}
</script>

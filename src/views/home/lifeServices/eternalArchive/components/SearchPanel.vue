<template>
  <div class="search-panel">
    <div class="search-main">
      <el-input
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        placeholder="搜索档案名称、标签、内容...  输入 # 查看标签"
        clearable
        @keyup.enter="doSearch"
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>
    <div class="search-filters" v-if="showFilters">
      <div class="filter-row">
        <span class="filter-label">安全等级：</span>
        <el-radio-group v-model="localFilters.level" size="small" @change="doSearch">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="S">S级</el-radio-button>
          <el-radio-button value="A">A级</el-radio-button>
          <el-radio-button value="B">B级</el-radio-button>
        </el-radio-group>
      </div>
      <div class="filter-row">
        <span class="filter-label">分类：</span>
        <el-select v-model="localFilters.category" size="small" placeholder="选择分类" @change="doSearch" clearable style="width:160px;">
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
      </div>
      <div class="filter-row" v-if="tags.length > 0">
        <span class="filter-label">标签：</span>
        <div class="tag-chips">
          <span
            v-for="tag in tags.slice(0, 12)"
            :key="tag"
            class="tag-chip"
            :class="{ active: localFilters.tag === tag }"
            @click="localFilters.tag = localFilters.tag === tag ? '' : tag; doSearch()"
          >
            #{{ tag }}
            <span class="tag-count">({{ tagCount(tag) }})</span>
          </span>
        </div>
      </div>
    </div>
    <el-button text size="small" @click="showFilters = !showFilters" class="filter-toggle">
      {{ showFilters ? '收起筛选' : '展开筛选' }}
      <el-icon><component :is="showFilters ? ArrowUp : ArrowDown" /></el-icon>
    </el-button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, ArrowUp, ArrowDown } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  files: { type: Array, default: () => [] },
  tags: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'search'])

const showFilters = ref(false)
const localFilters = ref({ level: '', category: '', tag: '' })

const categories = computed(() => {
  const set = new Set(props.files.map(f => f.category).filter(Boolean))
  return [...set]
})

function tagCount(tag) {
  return props.files.filter(f => f.tags?.includes(tag)).length
}

function doSearch() {
  emit('search', props.modelValue, { ...localFilters.value })
}
</script>

<style lang="scss" scoped>
.search-panel {
  margin-bottom: 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px 20px;
}
.search-main { }
.search-input {
  :deep(.el-input__wrapper) {
    box-shadow: none;
    background: #f8fafc;
    border-radius: 10px;
    padding: 8px 14px;
  }
}

.search-filters {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.filter-label {
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
  min-width: 60px;
}
.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag-chip {
  padding: 3px 10px;
  background: #f1f5f9;
  border-radius: 12px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #e2e8f0; }
  &.active { background: #0d9488; color: #fff; }
}
.tag-count { font-size: 10px; opacity: 0.7; }

.filter-toggle {
  margin-top: 6px;
  color: #0d9488;
  font-size: 12px;
}

html.dark-mode & {
  .search-panel { background: #1e1e2e; border-color: #2d2d4a; }
  .search-input :deep(.el-input__wrapper) { background: #252540; }
  .search-filters { border-color: #2d2d4a; }
  .filter-label { color: #94a3b8; }
  .tag-chip { background: #252540; &:hover { background: #2d2d4a; } }
}
</style>

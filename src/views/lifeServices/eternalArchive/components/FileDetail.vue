<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="'📋 ' + (file?.name || '文件详情')"
    :width="isMobile ? '92vw' : '650px'"
    class="detail-dialog"
  >
    <div v-if="file" class="detail-container">
      <!-- 基本信息 -->
      <div class="detail-section">
        <h4 class="section-title">基本信息</h4>
        <el-form label-position="left" label-width="80px" size="small">
          <el-form-item label="文件名">
            <el-input v-model="editData.name" />
          </el-form-item>
          <el-form-item label="安全等级">
            <el-radio-group v-model="editData.securityLevel">
              <el-radio-button value="S">S级</el-radio-button>
              <el-radio-button value="A">A级</el-radio-button>
              <el-radio-button value="B">B级</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="分类">
            <el-select v-model="editData.category" filterable allow-create style="width:100%;">
              <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item label="标签">
            <el-select v-model="editData.tags" multiple filterable allow-create placeholder="添加标签" style="width:100%;">
              <el-option v-for="t in presetTags" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="editData.description" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="保鲜期">
            <el-date-picker v-model="editData.freshUntil" type="date" placeholder="选择日期" style="width:100%;" />
          </el-form-item>
        </el-form>
        <el-button type="primary" size="small" @click="saveChanges" :disabled="!hasChanges">保存修改</el-button>
      </div>

      <!-- 版本链 -->
      <div class="detail-section" v-if="file.versions && file.versions.length > 1">
        <h4 class="section-title">📜 版本链</h4>
        <div class="version-chain">
          <div v-for="(v, i) in file.versions" :key="v.id" class="version-node" :class="{ current: i === 0 }">
            <span class="v-dot"></span>
            <div class="v-info">
              <span class="v-name">{{ v.name || `版本${i + 1}` }}</span>
              <span class="v-date">{{ formatDate(v.date) }}</span>
              <span v-if="v.note" class="v-note">{{ v.note }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 关联任务 -->
      <div class="detail-section">
        <h4 class="section-title">🧷 关联任务</h4>
        <div v-if="file.relatedTasks && file.relatedTasks.length > 0" class="related-tasks">
          <div v-for="tid in file.relatedTasks" :key="tid" class="task-chip">
            📋 {{ tid }}
          </div>
        </div>
        <p v-else class="no-data">暂无关联任务</p>
        <el-button size="small" type="primary" text @click="$emit('create-task', file)">
          ⏳ 以此文件创建任务
        </el-button>
      </div>

      <!-- 操作记录 -->
      <div class="detail-section">
        <h4 class="section-title">📋 操作记录</h4>
        <div class="audit-log">
          <div class="log-item">
            <span>📤 {{ formatDate(file.uploadDate) }}</span>
            <span>上传档案</span>
          </div>
          <div v-if="file.viewCount" class="log-item">
            <span>👁️ 预览 {{ file.viewCount }} 次</span>
          </div>
          <div v-if="file.downloadCount" class="log-item">
            <span>⬇️ 下载 {{ file.downloadCount }} 次</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
      <el-button type="danger" @click="$emit('delete', file)">删除</el-button>
      <el-button @click="$emit('share', file)">分享</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const isMobile = ref(window.innerWidth < 768)
function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const props = defineProps({
  visible: { type: Boolean, default: false },
  file: { type: Object, default: null },
  files: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:visible', 'update', 'delete', 'share', 'create-task'])

const categories = ['证件', '合同', '财务', '教育', '医疗', '房产', '工作', '个人', '其他']
const presetTags = ['重要', '紧急', '待处理', '已完成', '年度', '个人', '家庭']

const editData = ref({})

const hasChanges = computed(() => {
  if (!props.file) return false
  return JSON.stringify(editData.value) !== JSON.stringify({
    name: props.file.name,
    securityLevel: props.file.securityLevel,
    category: props.file.category,
    tags: props.file.tags,
    description: props.file.description,
    freshUntil: props.file.freshUntil
  })
})

watch(() => props.file, (f) => {
  if (f) {
    editData.value = {
      name: f.name || '',
      securityLevel: f.securityLevel || 'B',
      category: f.category || '',
      tags: f.tags || [],
      description: f.description || '',
      freshUntil: f.freshUntil || null
    }
  }
}, { immediate: true })

function saveChanges() {
  emit('update', { ...props.file, ...editData.value })
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('zh-CN') : ''
}
</script>

<style lang="scss" scoped>
.detail-container { }
.detail-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
  &:last-child { border-bottom: none; margin-bottom: 0; }
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 12px;
}

.version-chain {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-left: 16px;
  border-left: 2px solid #0d9488;
}
.version-node {
  position: relative;
  padding: 8px 0 8px 20px;
  &::before {
    content: '';
    position: absolute;
    left: -23px;
    top: 14px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #cbd5e1;
  }
  &.current::before { background: #0d9488; }
}
.v-info { display: flex; flex-direction: column; gap: 2px; }
.v-name { font-size: 13px; font-weight: 500; color: #0f172a; }
.v-date { font-size: 11px; color: #94a3b8; }
.v-note { font-size: 11px; color: #64748b; font-style: italic; }

.related-tasks { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.task-chip {
  padding: 4px 10px;
  background: #f1f5f9;
  border-radius: 8px;
  font-size: 12px;
  color: #64748b;
}

.no-data { font-size: 13px; color: #94a3b8; margin: 0 0 8px; }

.audit-log { display: flex; flex-direction: column; gap: 6px; }
.log-item {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #64748b;
}

html.dark-mode & {
  .detail-section { border-color: #2d2d4a; }
  .section-title { color: #e2dee9; }
  .version-chain { border-color: #14b8a6; }
  .v-name { color: #e2dee9; }
  .task-chip { background: #252540; }
}
</style>

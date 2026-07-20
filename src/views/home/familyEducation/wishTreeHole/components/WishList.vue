<template>
  <div class="wish-list">
    <!-- 分类筛选 -->
    <div class="filter-card">
      <div class="filter-bar">
        <div class="filter-status">
          <el-radio-group v-model="filterStatus" size="" @change="onFilterChange">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="进行中">进行中</el-radio-button>
            <el-radio-button value="已完成">已完成</el-radio-button>
            <el-radio-button value="逾期">逾期</el-radio-button>
          </el-radio-group>
        </div>
        <div class="filter-category">
          <el-select v-model="filterCategory" size="" placeholder="分类" @change="onFilterChange" style="width: 120px;">
            <el-option label="全部" value="all" />
            <el-option label="生活" value="生活" />
            <el-option label="学习" value="学习" />
            <el-option label="旅行" value="旅行" />
            <el-option label="体验" value="体验" />
          </el-select>
        </div>
      </div>
    </div>

    <!-- 愿望列表 -->
    <div v-if="wishes.length > 0" class="wish-cards">
      <WishCard
        v-for="wish in wishes"
        :key="wish.id"
        :wish="wish"
        @click="emit('detail', wish.id)"
        @checkin="handleCheckin(wish)"
        @delete="handleDelete(wish)"
        @archive="handleArchive(wish)"
        @delay="handleDelay(wish)"
        @pat="handlePat(wish)"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-icon class="empty-icon"><Document /></el-icon>
      <p class="empty-text">还没有愿望</p>
      <p class="empty-hint">点击右下角按钮创建第一个愿望吧</p>
    </div>

    <!-- 延期弹窗 -->
    <el-dialog v-model="delayVisible" title="延期愿望" width="360px" :close-on-click-modal="true">
      <div style="text-align: center;">
        <p style="color: #64748b; margin-bottom: 16px;">将「{{ delayTarget?.title }}」延期到：</p>
        <el-date-picker
          v-model="delayDate"
          type="date"
          placeholder="选择新日期"
          style="width: 100%;"
          :disabled-date="disabledDate"
        />
      </div>
      <template #footer>
        <el-button @click="delayVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDelay" :disabled="!delayDate">确认延期</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import WishCard from './WishCard.vue'

const emit = defineEmits(['detail', 'pat'])
const store = useStore()

const wishes = computed(() => store.getters['wishTreeHole/filteredWishes'])

const filterStatus = ref('')
const filterCategory = ref('all')

// 延期相关
const delayVisible = ref(false)
const delayTarget = ref(null)
const delayDate = ref(null)

function disabledDate(time) {
  return time.getTime() < Date.now() - 86400000
}

function onFilterChange() {
  store.commit('wishTreeHole/SET_WISH_FILTER', {
    status: filterStatus.value,
    category: filterCategory.value
  })
  store.dispatch('wishTreeHole/loadWishes')
}

async function handleCheckin(wish) {
  const newProgress = Math.min(wish.progress + 20, 100)
  const res = await store.dispatch('wishTreeHole/checkinWish', { id: wish.id, note: '', progress: newProgress })
  if (res.success) {
    ElMessage.success(newProgress >= 100 ? '🎉 愿望达成！' : '打卡成功！当前进度 ' + newProgress + '%')
    if (newProgress >= 100) {
      emit('detail', wish.id)
    }
  }
}

async function handleDelete(wish) {
  try {
    await ElMessageBox.confirm(`确定要删除「${wish.title}」吗？此操作不可恢复。`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await store.dispatch('wishTreeHole/deleteWish', wish.id)
    ElMessage.success('已删除')
  } catch { /* 取消 */ }
}

async function handleArchive(wish) {
  await store.dispatch('wishTreeHole/archiveWish', wish.id)
  ElMessage.success('已归档')
}

function handleDelay(wish) {
  delayTarget.value = wish
  delayDate.value = wish.targetDate ? new Date(wish.targetDate) : null
  delayVisible.value = true
}

async function confirmDelay() {
  if (!delayDate.value) return
  const dateStr = delayDate.value instanceof Date
    ? delayDate.value.toISOString().slice(0, 10)
    : delayDate.value
  await store.dispatch('wishTreeHole/delayWish', { id: delayTarget.value.id, newDate: dateStr })
  ElMessage.success('已延期')
  delayVisible.value = false
  delayTarget.value = null
}

function handlePat(wish) {
  emit('pat', { userId: wish.userId, targetType: 'wish', targetId: wish.id, message: `拍了拍「${wish.title}」的进度条` })
}
</script>

<style lang="scss" scoped>
.wish-list { }

.filter-card {
  background: #f8fafc;
  // border: 1px solid #e2e8f0;
  // border-radius: 16px;
  // padding: 16px 28px;
  margin-bottom: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    // border-color: #6366f1;
    // background: #ffffff;
    // box-shadow: 0 8px 30px rgba(99, 102, 241, 0.1);
    // transform: translateY(-2px);
  }
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.wish-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  .empty-icon {
    font-size: 64px;
    color: #cbd5e1;
    margin-bottom: 16px;
  }
  .empty-text {
    font-size: 18px;
    color: #64748b;
    margin: 0 0 8px;
  }
  .empty-hint {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
  }
}

@media (max-width: 768px) {
  .filter-card {
    padding: 12px;
  }
  .filter-status :deep(.el-radio-button__inner) {
    padding: 5px 10px;
    font-size: 13px;
  }
  .filter-status :deep(.el-radio-button) {
    height: 32px;
  }
  .filter-status :deep(.el-radio-button__inner) {
    line-height: 20px;
  }
  .filter-category :deep(.el-select) {
    width: 90px !important;
  }
  .filter-category :deep(.el-input__wrapper) {
    height: 32px;
  }
  .filter-category :deep(.el-input__inner) {
    height: 30px;
  }
}
</style>

<style lang="scss">
html.dark-mode {
  .filter-card {
    background: #1e1e2e;
    border-color: #2d2d4a;
    &:hover {
      border-color: #a78bfa;
      background: #252540;
      box-shadow: 0 8px 30px rgba(167, 139, 250, 0.12);
    }
  }
  .empty-icon { color: #475569; }
  .empty-text { color: #94a3b8; }
  .empty-hint { color: #64748b; }
  .el-select .el-input__wrapper { background: #252540; }
}
</style>

<template>
  <div class="wish-list">
    <!-- 分类筛选 -->
    <div class="filter-bar">
      <div class="filter-status">
        <el-radio-group v-model="filterStatus" size="small" @change="onFilterChange">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="进行中">进行中</el-radio-button>
          <el-radio-button value="已完成">已完成</el-radio-button>
          <el-radio-button value="逾期">逾期</el-radio-button>
        </el-radio-group>
      </div>
      <div class="filter-category">
        <el-select v-model="filterCategory" size="small" placeholder="分类" @change="onFilterChange" style="width: 120px;">
          <el-option label="全部分类" value="all" />
          <el-option label="生活" value="生活" />
          <el-option label="学习" value="学习" />
          <el-option label="旅行" value="旅行" />
          <el-option label="体验" value="体验" />
        </el-select>
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
      <div class="empty-icon">📝</div>
      <p class="empty-text">还没有愿望，点击右下角按钮创建第一个愿望吧！</p>
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

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 8px;
}

.wish-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  .empty-icon { font-size: 48px; margin-bottom: 16px; }
  .empty-text { font-size: 15px; color: #94a3b8; }
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-category {
    display: flex;
    justify-content: flex-end;
  }
}
</style>

<style lang="scss">
html.dark-mode {
  .empty-text { color: #64748b; }
  .filter-bar {
    .el-radio-group { /* covered by global */ }
  }
  .el-select .el-input__wrapper { background: #252540; }
}
</style>

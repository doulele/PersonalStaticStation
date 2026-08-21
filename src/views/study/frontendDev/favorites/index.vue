<template>
  <div class="fav-page">
    <div class="page-top">
      <button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </button>
      <h1 class="page-title">收藏夹</h1>
      <span class="page-count">{{ list.length }} 道收藏</span>
    </div>

    <div v-loading="loading" class="fav-list">
      <QuestionCard v-for="q in list" :key="q.id" :question="q">
        <template #actions>
          <el-button @click="doSameType(q)">做同类题</el-button>
          <el-button type="warning" @click="unfavorite(q)">取消收藏</el-button>
        </template>
      </QuestionCard>

      <el-empty v-if="!loading && !list.length" description="暂无收藏题目" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getFavorites } from '@/api/knowledgeGraph'
import QuestionCard from '../components/QuestionCard.vue'

const router = useRouter()
const store = useStore()
const list = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await getFavorites()
    if (res.success) list.value = res.data || []
  } finally {
    loading.value = false
  }
}

async function unfavorite(q) {
  const res = await store.dispatch('frontendDev/toggleFavorite', q.id)
  if (res.success) {
    ElMessage.success('已取消收藏')
    list.value = list.value.filter(x => x.id !== q.id)
  }
}

function doSameType(q) {
  router.push({ path: '/study/frontend-dev/quiz', query: { cat: q.cat } })
}

function goBack() {
  router.push('/study/frontend-dev')
}

onMounted(load)
</script>

<style lang="scss" scoped>
.fav-page {
  padding: 32px 24px 60px;
  max-width: 860px;
  margin: 0 auto;
}

.page-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  border-radius: 8px;
  font-size: 14px;
  &:hover { background: #f1f5f9; color: #0f172a; }
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.page-count {
  margin-left: auto;
  font-size: 14px;
  color: #64748b;
}

.fav-list {
  min-height: 300px;
}
</style>

<style lang="scss">
html.dark-mode .fav-page {
  .page-title { color: #e2dee9; }
  .back-btn { color: #94a3b8; &:hover { background: #2d2d4a; color: #e2dee9; } }
  .page-count { color: #94a3b8; }
}
</style>

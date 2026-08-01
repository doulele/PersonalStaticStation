<template>
  <div class="rl-page">
    <div class="back-bar">
      <el-button text @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon><span>返回</span>
      </el-button>
    </div>

    <div class="page-header">
      <h1 class="page-title">🍳 食验室 · 灵感灶</h1>
      <p class="page-desc">输入食材，AI 帮你变出一桌好菜</p>
    </div>

    <!-- 食材输入区 -->
    <div class="input-card">
      <div class="input-row">
        <el-input
          v-model="inputText"
          placeholder="输入食材，如：半颗白菜、两个鸡蛋和一点剩饭..."
          @keyup.enter="parseIngredients"
          clearable
          class="ingredient-input"
        >
          <template #prefix><el-icon><EditPen /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="parseIngredients" :disabled="!inputText.trim()" class="add-btn">
          识别食材
        </el-button>
        <el-button v-if="tags.length > 0" text @click="clearAll" class="clear-btn">清空</el-button>
      </div>

      <!-- 食材标签 -->
      <div v-if="tags.length > 0" class="tag-area">
        <span v-for="t in tags" :key="t" class="ing-tag" @click="removeTag(t)">
          {{ t }} <span class="tag-x">×</span>
        </span>
      </div>

      <!-- 快捷冰箱贴 -->
      <div class="quick-fridge">
        <span class="fridge-label">快捷冰箱贴：</span>
        <span v-for="item in quickItems" :key="item.name" class="fridge-chip" @click="addTag(item.name)" :title="item.partner ? '搭档：' + item.partner : ''">
          {{ item.icon }} {{ item.name }}
        </span>
      </div>

      <!-- 联想下拉 -->
      <div v-if="suggestions.length > 0 && inputText.trim()" class="suggestions-drop">
        <div v-for="s in suggestions" :key="s.name" class="sug-item" @click="addTag(s.name); suggestions = []">
          <span>{{ s.icon }} {{ s.name }}</span>
          <span v-if="s.partner" class="sug-partner">搭档：{{ s.partner }}</span>
        </div>
      </div>
    </div>

    <!-- 筛选条 -->
    <div class="filter-bar">
      <span class="filter-label">⏱️ 用时</span>
      <el-radio-group v-model="filterTime" size="small">
        <el-radio-button value="all">不限</el-radio-button>
        <el-radio-button value="5">5分钟</el-radio-button>
        <el-radio-button value="15">15分钟</el-radio-button>
        <el-radio-button value="30">30分钟</el-radio-button>
      </el-radio-group>
      <span class="filter-label">👅 口味</span>
      <el-radio-group v-model="filterTaste" size="small">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="light">清淡</el-radio-button>
        <el-radio-button value="heavy">重口</el-radio-button>
        <el-radio-button value="sweet">酸甜</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 操作按钮 -->
    <div class="action-row">
      <el-button type="primary" size="large" @click="doRecommend" :loading="loading" :disabled="tags.length === 0" class="act-recommend">
        🔍 有材有料·推荐
      </el-button>
      <el-button size="large" @click="doRandom" :loading="randomLoading" class="act-random">
        🥄 命运之勺
      </el-button>
    </div>

    <!-- 随机模式选择 -->
    <div class="random-modes">
      <el-radio-group v-model="randomMode" size="small">
        <el-radio-button value="safe">安全区（匹配≥30%）</el-radio-button>
        <el-radio-button value="blind">纯盲盒</el-radio-button>
        <el-radio-button value="consume">极限消耗</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-area">
      <span class="loader-icon">🍳</span>
      <p>正在翻动灵感灶...</p>
    </div>

    <!-- 推荐结果 -->
    <div v-if="results.length > 0 && !loading" class="results-section">
      <h3 class="section-title">📋 推荐结果（{{ results.length }}道）</h3>
      <div class="recipe-grid">
        <div v-for="(r, i) in results" :key="r.id" class="recipe-card" :style="{ animationDelay: i * 0.08 + 's' }" @click="openDetail(r)">
          <div class="card-top">
            <span class="card-icon">{{ r.icon || '🍽️' }}</span>
            <div class="card-info">
              <h4 class="card-name">{{ r.name }}</h4>
              <div class="card-tags">
                <span class="card-tag time">{{ r.time }}分钟</span>
                <span class="card-tag level">{{ r.difficulty }}</span>
                <span class="card-tag taste">{{ r.taste }}</span>
              </div>
            </div>
          </div>
          <div class="match-bar">
            <span class="match-label">匹配度</span>
            <el-progress :percentage="r.matchPercent" :color="matchColor(r.matchPercent)" :stroke-width="6" />
          </div>
          <div v-if="r.missing.length > 0" class="missing-hint">
            <span class="missing-icon">⚠️</span> 还缺：{{ r.missing.join('、') }}
          </div>
        </div>
      </div>
    </div>

    <!-- 随机结果动画弹窗 -->
    <transition name="slot-fade">
      <div v-if="randomResult" class="random-overlay" @click="randomResult = null">
        <div class="random-card">
          <span class="random-emoji">🎰</span>
          <h2 class="random-name">{{ randomResult.name }}</h2>
          <p class="random-quote">{{ randomQuote }}</p>
          <div class="random-detail">
            <span>⏱️ {{ randomResult.time }}分钟</span>
            <span>📊 {{ randomResult.difficulty }}</span>
            <span>🍴 {{ randomResult.taste }}</span>
          </div>
          <div class="random-actions">
            <el-button type="primary" @click.stop="openDetail(randomResult); randomResult = null">查看做法</el-button>
            <el-button @click.stop="doRandom">再来一次</el-button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 详情弹窗 -->
    <el-dialog :model-value="!!detailRecipe" @update:model-value="detailRecipe = null" :title="detailRecipe?.name" :width="isMobile ? '92vw' : '560px'" class="detail-dialog">
      <div v-if="detailRecipe" class="detail-body">
        <div class="detail-meta">
          <span>⏱️ {{ detailRecipe.time }}分钟</span>
          <span>📊 {{ detailRecipe.difficulty }}</span>
          <span>🍴 {{ detailRecipe.taste }}</span>
        </div>
        <div class="detail-section">
          <h4>🥬 所需食材</h4>
          <div class="ing-list">
            <span v-for="ing in detailRecipe.ingredients" :key="ing" class="ing-chip" :class="{ missing: isMissing(ing) }">
              {{ ing }} {{ isMissing(ing) ? '(缺)' : '✅' }}
            </span>
          </div>
          <p v-if="detailRecipe.substitutes" class="sub-hint">💡 替代方案：{{ detailRecipe.substitutes }}</p>
        </div>
        <div class="detail-section">
          <h4>📝 做法步骤</h4>
          <div v-for="(step, i) in detailRecipe.steps" :key="i" class="step-item">
            <span class="step-num">{{ i + 1 }}</span>
            <span>{{ step }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 最近看过 -->
    <div v-if="history.length > 0" class="history-bar">
      <h4 class="section-title">🕐 最近看过</h4>
      <div class="history-list">
        <span v-for="h in history" :key="h.id" class="history-chip" @click="openDetail(h)">{{ h.icon || '🍽️' }} {{ h.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, EditPen } from '@element-plus/icons-vue'
import * as rlApi from '@/api/recipeLab'

const router = useRouter()

// 前端兜底菜谱（后端不可用时使用）
const DEFAULT_RECIPES = [
  { id: 1, name: '番茄炒蛋', icon: '🍳', ingredients: ['番茄', '鸡蛋', '葱', '盐', '糖', '油'], seasonings: ['盐', '糖', '油'], steps: ['番茄切块，鸡蛋打散', '热锅凉油，炒鸡蛋盛出', '炒番茄出汁，加入鸡蛋', '加盐糖调味，撒葱花'], time: 10, difficulty: '简单', taste: 'light' },
  { id: 2, name: '蛋炒饭', icon: '🍚', ingredients: ['米饭', '鸡蛋', '火腿', '葱', '盐', '油'], seasonings: ['盐', '油'], steps: ['鸡蛋打散炒熟', '炒米饭至松散', '加火腿鸡蛋翻炒', '加盐葱花出锅'], time: 10, difficulty: '简单', taste: 'light' },
  { id: 3, name: '麻婆豆腐', icon: '🫘', ingredients: ['豆腐', '猪肉末', '豆瓣酱', '花椒', '大蒜', '葱', '酱油', '油'], seasonings: ['豆瓣酱', '花椒', '酱油', '油'], steps: ['豆腐焯水', '炒肉末加豆瓣酱', '加水放豆腐煮3分钟', '勾芡撒葱花'], time: 20, difficulty: '中等', taste: 'heavy' },
  { id: 4, name: '清炒时蔬', icon: '🥬', ingredients: ['青菜', '大蒜', '盐', '油'], seasonings: ['盐', '油'], steps: ['青菜洗净切段', '爆香蒜片', '大火快炒青菜', '加盐出锅'], time: 5, difficulty: '简单', taste: 'light' },
  { id: 5, name: '宫保鸡丁', icon: '🍗', ingredients: ['鸡肉', '花生', '辣椒', '大蒜', '酱油', '醋', '糖', '油'], seasonings: ['酱油', '醋', '糖', '油'], steps: ['鸡丁腌制滑炒', '炒辣椒蒜末', '加碗汁翻炒', '加花生出锅'], time: 20, difficulty: '中等', taste: 'sweet' },
  { id: 6, name: '可乐鸡翅', icon: '🍗', ingredients: ['鸡翅', '可乐', '酱油', '姜', '油'], seasonings: ['酱油', '油'], steps: ['鸡翅煎至金黄', '倒入可乐酱油', '中火煮15分钟', '大火收汁'], time: 25, difficulty: '简单', taste: 'sweet' },
  { id: 7, name: '酸辣土豆丝', icon: '🥔', ingredients: ['土豆', '辣椒', '醋', '大蒜', '盐', '油'], seasonings: ['醋', '盐', '油'], steps: ['土豆切丝泡水', '爆香蒜辣椒', '大火炒土豆丝', '加醋盐出锅'], time: 10, difficulty: '简单', taste: 'sweet' },
  { id: 8, name: '青椒肉丝', icon: '🫑', ingredients: ['猪肉', '青椒', '大蒜', '酱油', '盐', '油'], seasonings: ['酱油', '盐', '油'], steps: ['肉丝腌制滑炒', '炒青椒蒜片', '加入肉丝翻炒', '加盐出锅'], time: 15, difficulty: '简单', taste: 'heavy' },
  { id: 9, name: '蚝油生菜', icon: '🥬', ingredients: ['生菜', '大蒜', '蚝油', '酱油', '油'], seasonings: ['蚝油', '酱油', '油'], steps: ['生菜焯水摆盘', '炒蒜末加蚝油', '勾芡淋在生菜上'], time: 8, difficulty: '简单', taste: 'light' },
  { id: 10, name: '拍黄瓜', icon: '🥒', ingredients: ['黄瓜', '大蒜', '醋', '酱油', '辣椒油', '盐', '香油'], seasonings: ['醋', '酱油', '辣椒油', '盐', '香油'], steps: ['黄瓜拍碎切段', '蒜末加调料拌匀', '淋在黄瓜上'], time: 5, difficulty: '简单', taste: 'heavy' }
]

// ==================== 数据 ====================
const inputText = ref('')
const tags = ref([])
const suggestions = ref([])
const loading = ref(false)
const randomLoading = ref(false)
const results = ref([])
const randomResult = ref(null)
const randomQuote = ref('')
const detailRecipe = ref(null)
const history = ref(loadHistory())
const randomMode = ref('safe')
const filterTime = ref('all')
const filterTaste = ref('all')
const isMobile = ref(window.innerWidth < 768)
const allRecipes = ref([])

function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(async () => {
  window.addEventListener('resize', onResize)
  try {
    const res = await rlApi.getAllRecipes()
    if (res.success) allRecipes.value = res.data
  } catch { }
})
onUnmounted(() => window.removeEventListener('resize', onResize))

// ==================== 快捷冰箱贴 ====================
const quickItems = [
  { name: '猪肉', icon: '🥩', partner: '青椒、蒜苗' },
  { name: '鸡肉', icon: '🍗', partner: '香菇、土豆' },
  { name: '鸡蛋', icon: '🥚', partner: '番茄、韭菜' },
  { name: '番茄', icon: '🍅', partner: '鸡蛋、牛腩' },
  { name: '土豆', icon: '🥔', partner: '牛肉、青椒' },
  { name: '青菜', icon: '🥬', partner: '香菇、蒜末' },
  { name: '洋葱', icon: '🧅', partner: '牛肉、鸡蛋' },
  { name: '辣椒', icon: '🌶️', partner: '肉丝、鸡蛋' },
  { name: '大蒜', icon: '🧄', partner: '任何荤菜' },
  { name: '米饭', icon: '🍚', partner: '鸡蛋、火腿' },
  { name: '面条', icon: '🍜', partner: '肉末、青菜' },
  { name: '豆腐', icon: '🫘', partner: '肉末、葱' },
  { name: '牛肉', icon: '🥩', partner: '土豆、番茄' },
  { name: '虾', icon: '🦐', partner: '豆腐、蒜蓉' },
  { name: '胡萝卜', icon: '🥕', partner: '牛肉、玉米' },
  { name: '玉米', icon: '🌽', partner: '排骨、胡萝卜' },
  { name: '蘑菇', icon: '🍄', partner: '鸡肉、青菜' },
  { name: '火腿', icon: '🥓', partner: '鸡蛋、米饭' },
  { name: '茄子', icon: '🍆', partner: '肉末、蒜' },
  { name: '青椒', icon: '🫑', partner: '肉丝、土豆' }
]

// ==================== 食材联想 ====================
const allIngredientNames = computed(() => {
  const set = new Set()
  allRecipes.value.forEach(r => r.ingredients?.forEach(i => set.add(i)))
  quickItems.forEach(q => set.add(q.name))
  return [...set]
})

function updateSuggestions() {
  const text = inputText.value.trim()
  if (!text) { suggestions.value = []; return }
  const match = allIngredientNames.value.filter(n => n.includes(text)).slice(0, 5)
  suggestions.value = match.map(name => {
    const found = quickItems.find(q => q.name === name)
    return { name, icon: found?.icon || '🥬', partner: found?.partner || '' }
  })
}

// ==================== 食材操作 ====================
function parseIngredients() {
  const text = inputText.value.trim()
  if (!text) { ElMessage.warning('至少输入一种食材'); return }

  // 用常见分隔符拆分 + 同义词替换
  const raw = text.split(/[，,、\s和与及跟还有还有]+/).filter(Boolean)
  const parsed = raw.map(w => normalizeIngredient(w)).filter(Boolean)
  const newTags = [...new Set([...tags.value, ...parsed])]
  tags.value = newTags
  inputText.value = ''
  suggestions.value = []
}

function normalizeIngredient(word) {
  // 同义词映射
  const alias = {
    '土豆': '土豆', '洋芋': '土豆', '马铃薯': '土豆',
    '番茄': '番茄', '西红柿': '番茄',
    '包菜': '包菜', '卷心菜': '包菜', '圆白菜': '包菜',
    '鸡蛋': '鸡蛋', '蛋': '鸡蛋',
    '猪肉': '猪肉', '猪': '猪肉',
    '牛肉': '牛肉', '牛': '牛肉',
    '鸡肉': '鸡肉', '鸡': '鸡肉',
    '米饭': '米饭', '剩饭': '米饭', '饭': '米饭',
    '面条': '面条', '面': '面条',
    '白菜': '白菜', '大白菜': '白菜',
    '蒜': '大蒜', '大蒜': '大蒜', '蒜头': '大蒜',
    '葱': '葱', '小葱': '葱', '大葱': '葱',
    '姜': '姜', '生姜': '姜',
    '辣椒': '辣椒', '辣': '辣椒',
    '豆腐': '豆腐',
    '鱼': '鱼', '鱼片': '鱼',
    '虾': '虾', '虾仁': '虾',
    '蘑菇': '蘑菇', '香菇': '蘑菇',
    '胡萝卜': '胡萝卜', '红萝卜': '胡萝卜',
    '青椒': '青椒', '菜椒': '青椒',
  }
  // 去除量词前缀
  const clean = word.replace(/^[半两几一些少许\d]+[个颗根片块只条份碗盘锅勺]/g, '')
    .replace(/^[的]/g, '').trim()
  return alias[clean] || clean
}

function addTag(name) {
  if (!tags.value.includes(name)) {
    tags.value.push(name)
  }
}

function removeTag(name) {
  tags.value = tags.value.filter(t => t !== name)
}

function clearAll() {
  tags.value = []
  results.value = []
}

// ==================== 推荐逻辑 ====================
function matchColor(pct) {
  if (pct >= 70) return '#16a34a'
  if (pct >= 40) return '#d4a843'
  return '#94a3b8'
}

function calcMatch(recipe, userTags) {
  const recipeIngs = (recipe.ingredients || []).map(i => normalizeIngredient(i))
  let matchCount = 0
  let totalWeight = recipeIngs.length || 1

  userTags.forEach(tag => {
    if (recipeIngs.some(ri => ri === tag || ri.includes(tag) || tag.includes(ri))) {
      // 调味料权重更高
      const isSeasoning = recipe.seasonings?.some(s => s === tag || tag.includes(s))
      matchCount += isSeasoning ? 2 : 1
    }
  })

  const pct = Math.min(100, Math.round((matchCount / totalWeight) * 100))
  const missing = recipeIngs.filter(ri => !userTags.some(t => ri === t || ri.includes(t) || t.includes(ri)))
  return { pct, missing }
}

async function doRecommend() {
  if (tags.value.length === 0) { ElMessage.warning('至少输入一种食材'); return }
  loading.value = true
  results.value = []

  try {
    const res = await rlApi.recommend({ ingredients: tags.value, time: filterTime.value, taste: filterTaste.value })
    if (res.success) {
      results.value = res.data
      if (results.value.length === 0) {
        ElMessage.info('换些食材试试，或者试试下方的「命运之勺」')
      }
    }
  } catch {
    // 离线模式：使用本地数据
    results.value = calcLocalResults()
    if (results.value.length === 0) {
      ElMessage.info('换些食材试试，或者试试下方的「命运之勺」')
    }
  } finally {
    loading.value = false
  }
}

function calcLocalResults() {
  const userTags = tags.value.map(normalizeIngredient)
  let list = allRecipes.value.map(r => {
    const { pct, missing } = calcMatch(r, userTags)
    return { ...r, matchPercent: pct, missing }
  }).filter(r => {
    if (filterTime.value !== 'all' && r.time > parseInt(filterTime.value)) return false
    if (filterTaste.value !== 'all' && r.taste !== filterTaste.value) return false
    return true
  })
  list.sort((a, b) => b.matchPercent - a.matchPercent)
  return list.slice(0, 6)
}

// ==================== 命运之勺 ====================
const randomQuotes = [
  '命运说：今天你的鸡胸肉想穿一件照烧外套！',
  '灵感灶翻了翻食谱：这道菜在等你很久了~',
  '随机之神选择了这道菜，拒绝反驳！',
  '冰箱里的食材们投票选出了今天的赢家！',
  '锅铲已经迫不及待了，就做这道吧！'
]

async function doRandom() {
  randomLoading.value = true
  try {
    const res = await rlApi.randomRecipe({ mode: randomMode.value, ingredients: tags.value })
    if (res.success && res.data) {
      randomResult.value = res.data
      randomQuote.value = randomQuotes[Math.floor(Math.random() * randomQuotes.length)]
      addToHistory(res.data)
    } else {
      // 后端返回 null（如安全区无匹配），回退本地
      doLocalRandom()
    }
  } catch {
    // 网络失败，使用本地数据
    doLocalRandom()
  } finally {
    randomLoading.value = false
  }
}

function doLocalRandom() {
  const pool = getRandomPool()
  if (pool.length > 0) {
    const picked = pool[Math.floor(Math.random() * pool.length)]
    randomResult.value = { ...picked, matchPercent: picked.matchPercent || 30 }
    randomQuote.value = randomQuotes[Math.floor(Math.random() * randomQuotes.length)]
    addToHistory(picked)
  } else {
    ElMessage.info('没有可推荐的菜谱，试试先添加一些食材')
  }
}

function getRandomPool() {
  const pool = allRecipes.value.length > 0 ? allRecipes.value : DEFAULT_RECIPES
  const userTags = tags.value.map(normalizeIngredient)
  if (randomMode.value === 'blind') {
    return pool
  }
  const scored = pool.map(r => {
    const { pct } = calcMatch(r, userTags)
    return { ...r, matchPercent: pct }
  })
  if (randomMode.value === 'safe') {
    // 安全区：至少匹配30%，如果没有输入食材则返回全部（避免空池）
    const filtered = scored.filter(r => r.matchPercent >= 30)
    return filtered.length > 0 ? filtered : pool
  }
  // 极限消耗：按匹配度排序取最高
  return scored.sort((a, b) => b.matchPercent - a.matchPercent).slice(0, 10)
}

// ==================== 详情 ====================
function openDetail(recipe) {
  detailRecipe.value = recipe
  addToHistory(recipe)
}

function isMissing(ing) {
  if (!detailRecipe.value) return false
  const normalized = normalizeIngredient(ing)
  return !tags.value.some(t => normalizeIngredient(t) === normalized || t.includes(normalized) || normalized.includes(t))
}

// ==================== 历史记录 ====================
function loadHistory() {
  try { return JSON.parse(localStorage.getItem('rl_history') || '[]') } catch { return [] }
}
function addToHistory(recipe) {
  history.value = [recipe, ...history.value.filter(h => h.id !== recipe.id)].slice(0, 5)
  localStorage.setItem('rl_history', JSON.stringify(history.value))
}

function goBack() { router.push('/home/lifeServices') }
</script>

<style lang="scss" scoped>
.rl-page {
  padding: 40px 32px;
  max-width: 900px;
  width: 80%;
  margin: 0 auto;
  box-sizing: border-box;
  animation: fadeIn 0.4s ease-out;
  min-height: 100vh;
  padding-bottom: 60px;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.back-bar { margin-bottom: 16px; }
.back-btn { display: inline-flex; align-items: center; gap: 4px; font-size: 14px; color: #64748b; padding: 4px 8px; border-radius: 8px; &:hover { color: #ef4444; background: #fef2f2; } }

.page-header { text-align: center; margin-bottom: 28px; }
.page-title { font-size: 32px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
.page-desc { font-size: 15px; color: #64748b; margin: 0; }

// 输入卡片
.input-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; margin-bottom: 16px; }
.input-row { display: flex; gap: 8px; align-items: center; }
.ingredient-input { flex: 1; :deep(.el-input__wrapper) { border-radius: 10px; background: #f8fafc; } }
.add-btn { background: linear-gradient(135deg, #ef4444, #f97316); border: none; white-space: nowrap; &:hover { background: linear-gradient(135deg, #dc2626, #ea580c); } }
.clear-btn { color: #94a3b8; white-space: nowrap; }

.tag-area { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.ing-tag {
  padding: 4px 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 20px; font-size: 13px; color: #dc2626;
  cursor: pointer; transition: all 0.2s; &:hover { background: #fee2e2; }
}
.tag-x { margin-left: 4px; font-weight: 700; }

.quick-fridge { margin-top: 12px; padding-top: 10px; border-top: 1px solid #f1f5f9; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.fridge-label { font-size: 12px; color: #94a3b8; white-space: nowrap; }
.fridge-chip {
  padding: 3px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; font-size: 12px; color: #64748b;
  cursor: pointer; transition: all 0.2s; white-space: nowrap; &:hover { border-color: #f97316; color: #f97316; background: #fff7ed; }
}

.suggestions-drop {
  position: absolute; z-index: 10; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.1); margin-top: 4px; overflow: hidden; width: calc(100% - 40px);
}
.sug-item { padding: 10px 14px; cursor: pointer; display: flex; justify-content: space-between; font-size: 13px; color: #0f172a; &:hover { background: #f8fafc; } }
.sug-partner { font-size: 11px; color: #94a3b8; }

// 筛选条
.filter-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.filter-label { font-size: 13px; color: #64748b; white-space: nowrap; }

// 操作按钮
.action-row { display: flex; gap: 12px; margin-bottom: 14px; }
.act-recommend { background: linear-gradient(135deg, #ef4444, #f97316); border: none; &:hover { background: linear-gradient(135deg, #dc2626, #ea580c); } }
.act-random { border: 2px dashed #f97316; color: #f97316; &:hover { background: #fff7ed; } }

.random-modes { margin-bottom: 18px; }

// 加载
.loading-area { text-align: center; padding: 60px 20px; }
.loader-icon { font-size: 48px; display: block; margin-bottom: 12px; animation: bounce 1s infinite; }
@keyframes bounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)} }

// 结果
.results-section { margin-top: 20px; }
.section-title { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 12px; }
.recipe-grid { display: flex; flex-direction: column; gap: 10px; }
.recipe-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; cursor: pointer;
  transition: all 0.25s; animation: cardIn 0.4s ease-out both;
  &:hover { border-color: #f97316; box-shadow: 0 4px 16px rgba(249,115,22,0.1); transform: translateY(-1px); }
}
@keyframes cardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.card-icon { font-size: 32px; }
.card-info { flex: 1; }
.card-name { font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 4px; }
.card-tags { display: flex; gap: 6px; }
.card-tag { font-size: 11px; padding: 2px 8px; border-radius: 6px; background: #f1f5f9; color: #64748b; }
.match-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.match-label { font-size: 12px; color: #94a3b8; white-space: nowrap; }
.missing-hint { font-size: 12px; color: #f59e0b; display: flex; align-items: center; gap: 4px; }
.missing-icon { font-size: 14px; }

// 随机结果弹窗
.random-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; }
.random-card { background: #fff; border-radius: 20px; padding: 32px; text-align: center; max-width: 400px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: popIn 0.4s ease-out; }
@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.random-emoji { font-size: 56px; display: block; margin-bottom: 12px; }
.random-name { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
.random-quote { font-size: 13px; color: #64748b; margin: 0 0 14px; font-style: italic; }
.random-detail { display: flex; justify-content: center; gap: 16px; font-size: 13px; color: #94a3b8; margin-bottom: 18px; }
.random-actions { display: flex; gap: 10px; justify-content: center; }

// 详情弹窗
.detail-body { }
.detail-meta { display: flex; gap: 16px; font-size: 13px; color: #94a3b8; margin-bottom: 18px; }
.detail-section { margin-bottom: 18px; h4 { font-size: 14px; font-weight: 600; color: #0f172a; margin: 0 0 8px; } }
.ing-list { display: flex; flex-wrap: wrap; gap: 6px; }
.ing-chip { padding: 3px 10px; border-radius: 14px; font-size: 12px; background: #f0fdf4; color: #16a34a; &.missing { background: #fef2f2; color: #dc2626; } }
.sub-hint { font-size: 12px; color: #f59e0b; margin: 8px 0 0; }
.step-item { display: flex; gap: 10px; padding: 8px 0; font-size: 13px; color: #0f172a; line-height: 1.6; border-bottom: 1px solid #f1f5f9; &:last-child { border: none; } }
.step-num { width: 22px; height: 22px; border-radius: 50%; background: #f97316; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }

// 历史
.history-bar { margin-top: 28px; }
.history-list { display: flex; flex-wrap: wrap; gap: 8px; }
.history-chip { padding: 6px 14px; background: #f1f5f9; border-radius: 18px; font-size: 13px; color: #64748b; cursor: pointer; &:hover { background: #e2e8f0; } }

.slot-fade-enter-active { transition: all 0.3s ease-out; }
.slot-fade-leave-active { transition: all 0.2s ease-in; }
.slot-fade-enter-from, .slot-fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .rl-page { padding: 16px 12px 60px; width: 100%; max-width: 100%; }
  .page-title { font-size: 24px; }
  .input-row { flex-wrap: wrap; }
  .add-btn, .clear-btn { font-size: 13px; }
  .action-row { flex-direction: column; }
  .filter-bar { gap: 4px; }
  .recipe-card { padding: 12px 14px; }
  .random-modes :deep(.el-radio-button__inner) { padding: 5px 8px; font-size: 12px; }
}

html.dark-mode & {
  .page-title { color: #e2dee9; }
  .page-desc { color: #94a3b8; }
  .input-card { background: #1e1e2e; border-color: #2d2d4a; }
  .ingredient-input :deep(.el-input__wrapper) { background: #252540; }
  .quick-fridge { border-color: #2d2d4a; }
  .fridge-chip { background: #252540; border-color: #2d2d4a; }
  .recipe-card { background: #1e1e2e; border-color: #2d2d4a; }
  .card-name { color: #e2dee9; }
  .card-tag { background: #252540; }
  .section-title { color: #e2dee9; }
  .random-card { background: #1e1e2e; }
  .random-name { color: #e2dee9; }
  .ing-chip { background: #1a2d1a; &.missing { background: #2d1a1a; } }
  .step-item { border-color: #2d2d4a; color: #e2dee9; }
  .history-chip { background: #252540; }
  .suggestions-drop { background: #1e1e2e; border-color: #2d2d4a; }
  .sug-item { color: #e2dee9; &:hover { background: #252540; } }
}
</style>

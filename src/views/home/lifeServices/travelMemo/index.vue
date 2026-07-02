<template>
  <div class="memo-page">
    <div class="memo-container">
      <!-- ========== 顶部导航栏 ========== -->
      <div class="nav-bar">
      <span class="nav-back" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </span>
      <span class="nav-title">{{ memo.title || '出行备忘' }}</span>
      <span class="nav-right">
        <span class="nav-members">
          <el-icon><User /></el-icon>{{ memo.members?.length || 0 }}
        </span>
        <span class="nav-edit-btn" @click="showMemoEdit = true">
          <el-icon><EditPen /></el-icon>
        </span>
      </span>
      </div>

      <!-- ========== 进度摘要卡片 ========== -->
      <div class="progress-card" :class="{ collapsed: progressCollapsed }">
        <div class="progress-toggle" @click="progressCollapsed = !progressCollapsed">
          <span class="toggle-icon" :class="{ open: !progressCollapsed }">
            <el-icon><ArrowRight /></el-icon>
          </span>
          <span class="toggle-label">进度概览</span>
          <span class="toggle-badge">{{ displayCheckedCount }}/{{ displayTotalCount }}</span>
        </div>
        <div class="progress-card-body" v-show="!progressCollapsed">
        <!-- 整体进度 -->
        <div class="total-progress">
          <div class="total-progress-header">
            <span class="total-label">整体进度</span>
            <span class="total-count-num">
              <strong>{{ displayCheckedCount }}</strong>
              <span class="total-sep">/</span>
              {{ displayTotalCount }}
              <span class="total-pct">· {{ displayPercent }}%</span>
            </span>
          </div>
          <div class="progress-bar-wrap total-bar-wrap">
            <div
              class="progress-bar-fill"
              :class="pctClass(displayPercent)"
              :style="{ width: displayPercent + '%' }"
            ></div>

          </div>
        </div>

        <!-- 分割线 -->
        <div class="progress-divider"></div>

        <!-- 公共/个人进度 -->
        <div class="member-progress-list">
          <div v-for="m in displayMembers" :key="m.id" class="member-progress-row">
            <!-- <span class="mp-avatar" :class="memberAvatarClass(m)"></span> -->
            <span class="mp-name" :class="{ 'mp-name-public': m.id === 'public' }">
              {{ m.name }}
            </span>
            <span class="mp-count">{{ m.checked }}/{{ m.total }}</span>
            <div class="mp-bar-wrap">
              <div
                class="mp-bar-fill"
                :class="pctClass(m.percent)"
                :style="{ width: m.percent + '%' }"
              ></div>

            </div>
            <span class="mp-pct" :class="pctTextClass(m.percent)">
              {{ m.percent }}%
              <span v-if="m.percent === 100" class="mp-check">完成</span>
            </span>
          </div>
        </div>
        </div>
      </div>

      <!-- ========== 搜索框 ========== -->
      <div class="search-wrap">
        <el-icon class="search-icon"><Search /></el-icon>
        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="搜索物品或备注..."
          clearable
        />
        <span v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
          <el-icon><Close /></el-icon>
        </span>
      </div>

      <!-- ========== 筛选标签栏 ========== -->
      <div class="filter-card">
        <div class="filter-row member-row">
          <div class="filter-tabs">
            <span
              class="filter-tab member"
              :class="{ active: activeMemberFilter === 'public' }"
              @click="activeMemberFilter = 'public'"
            >
              公共
            </span>
              <span
                v-for="m in (memo.members || [])"
                :key="m.id"
                class="filter-tab member"
                :class="{ active: activeMemberFilter === m.id, 'filter-tab-baby': m.type === 'baby' }"
                @click="activeMemberFilter = m.id"
              >
                {{ m.name }}
              </span>
              <span class="filter-tab add-member-tab" @click="showMemberManage = true" title="添加成员">
                <el-icon><Plus /></el-icon>
              </span>
          </div>
        </div>
        <div class="filter-row status-row">
          <div class="filter-tabs">
            <span
              v-for="tab in statusFilterTabs"
              :key="tab.key"
              class="filter-tab status"
              :class="{ active: activeStatusFilter === tab.key }"
              @click="activeStatusFilter = tab.key"
            >{{ tab.label }}</span>
          </div>
        </div>
      </div>

      <!-- ========== 新增分类按钮 ========== -->
      <div class="add-category-wrap">
      <span class="add-category-btn" @click="addNewCategory">
        <el-icon><Plus /></el-icon>新增分类
      </span>
      </div>

      <!-- ========== 分类手风琴面板 ========== -->
      <div class="category-list" v-if="filteredCategories.length > 0">
        <div
          v-for="cat in filteredCategories"
          :key="cat.id"
          class="cat-card"
          :class="{ expanded: activeCategories.includes(cat.id) }"
        >
          <!-- 分类标题行 -->
          <div class="cat-header" @click="toggleCategory(cat.id)">
            <span class="cat-arrow" :class="{ open: activeCategories.includes(cat.id) }">
              <el-icon><ArrowRight /></el-icon>
            </span>
            <div class="cat-title" @click.stop>
              <input v-if="editingCatId === cat.id"
                v-model="editCatName"
                class="cat-name-input-inline"
                @keyup.enter="saveCatName(cat)"
                @blur="saveCatName(cat)"
              />
              <span v-else class="cat-name">{{ cat.name }}</span>
            </div>
            <span class="cat-count-badge">{{ getCatChecked(cat.id) }}/{{ getCatTotal(cat.id) }}</span>
            <span class="cat-actions" @click.stop>
              <span class="cat-action-btn" @click="startEditCat(cat)" title="编辑名称">
                <el-icon><Edit /></el-icon>
              </span>
              <span class="cat-action-btn cat-action-del" @click="deleteCategory(cat)" title="删除分类">
                <el-icon><Delete /></el-icon>
              </span>
            </span>
          </div>
          <div class="cat-body">
            <!-- 快捷添加标签 -->
            <div v-if="getPresetsForCat(cat).length > 0" class="quick-add-row">
              <div class="qa-toggle" @click.stop="togglePresets(cat.id)">
                <span class="qa-toggle-arrow" :class="{ open: activePresets.includes(cat.id) }">
                  <el-icon><ArrowRight /></el-icon>
                </span>
                推荐添加（{{ getPresetsForCat(cat).length }}项）
              </div>
              <div v-show="activePresets.includes(cat.id)" class="qa-chips">
                <span
                  v-for="name in getPresetsForCat(cat)"
                  :key="name"
                  class="qa-chip"
                  @click="openQuickAdd(cat.id, name)"
                >{{ name }}</span>
              </div>
            </div>

            <!-- 物品列表 -->
            <div class="cat-items" v-if="getCatItems(cat.id).length > 0">
              <ItemRow
                v-for="item in getCatItems(cat.id)"
                :key="item.id"
                :item="item"
                @toggle="toggleItem"
                @edit="openEditItem"
                @delete="deleteItem"
                @qtyChange="handleQtyChange"
              />
            </div>

            <!-- 空状态 -->
            <div v-if="getCatItems(cat.id).length === 0" class="cat-empty">
              <span>暂无物品，点击上方标签快速添加</span>
            </div>

            <!-- 添加物品按钮 -->
            <div class="cat-add-item-wrap">
              <span class="cat-add-item-btn" @click="openAddItemForCat(cat.id)">
                <el-icon><Plus /></el-icon>添加物品
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 无分类空状态 -->
      <div v-if="filteredCategories.length === 0" class="no-results">
        <div v-if="(memo.items?.length || 0) === 0" class="empty-guide">
          <div class="empty-icon">🎒</div>
          <div class="empty-title">准备出发吧！</div>
          <div class="empty-desc">添加分类和物品，轻松管理出行清单</div>
          <div class="empty-actions">
            <span class="empty-action-btn" @click="addNewCategory">
              <el-icon><Plus /></el-icon>新增分类
            </span>
            <span class="empty-action-btn secondary" @click="openTemplateDialog" v-if="loadTemplates().length > 0">
              <el-icon><FolderOpened /></el-icon>加载模板
            </span>
          </div>
        </div>
        <div v-else class="empty-guide">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">没有匹配的物品</div>
          <div class="empty-desc">试试切换筛选条件或清除搜索</div>
        </div>
      </div>

      <!-- 底部留白 -->
      <div class="bottom-spacer"></div>

      <!-- ========== 底部固定操作栏 ========== -->
      <div class="bottom-bar">
        <el-button class="bottom-btn check-all-btn" @click="toggleAll">
          <el-icon><component :is="allChecked ? 'Close' : 'Select'" /></el-icon>
          {{ allChecked ? '取消' : '全选' }}
        </el-button>
        <el-button class="bottom-btn reset-btn" @click="clearAllItems">
          <el-icon><Delete /></el-icon>清空
        </el-button>
        <el-button class="bottom-btn copy-btn" @click="copyList">
          <el-icon><CopyDocument /></el-icon>复制
        </el-button>
        <el-dropdown trigger="click" @command="handleMore">
          <el-button class="bottom-btn more-btn">
            <el-icon><MoreFilled /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="save">
                <el-icon><FolderAdd /></el-icon>保存模板
              </el-dropdown-item>
              <el-dropdown-item command="load">
                <el-icon><FolderOpened /></el-icon>加载模板
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- ========== 弹窗 ========== -->
    <AddItemDialog
      :visible="showItemDialog"
      :item="editTarget"
      :categories="availableCategories"
      @close="closeItemDialog"
      @save="saveItem"
    />

    <AddCategoryDialog
      :visible="showAddCategoryDialog"
      @close="showAddCategoryDialog = false"
      @save="saveNewCategory"
    />

    <CategoryManage
      :visible="showCategoryManage"
      :categories="memo.categories"
      @close="showCategoryManage = false"
      @save="saveCategories"
    />

    <MemberManage
      :visible="showMemberManage"
      :members="memo.members"
      @close="showMemberManage = false"
      @save="saveMembers"
    />

    <!-- 模板选择弹窗 -->
    <el-dialog v-model="showTemplateDialog" title="加载模板" width="400px" destroy-on-close>
      <div v-if="templates.length === 0" class="template-empty">
        <span>暂无保存的模板，点击底部「保存模板」创建</span>
      </div>
      <div v-else class="template-list">
        <div v-for="tpl in templates" :key="tpl.id" class="template-item" @click="loadTemplate(tpl)">
          <div class="tpl-info">
            <span class="tpl-name">{{ tpl.name }}</span>
            <span class="tpl-meta">{{ tpl.items.length }} 项物品 · {{ formatTplDate(tpl.createdAt) }}</span>
          </div>
          <span class="tpl-del" @click.stop="deleteTemplate(tpl.id)" title="删除模板">
            <el-icon><Delete /></el-icon>
          </span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showTemplateDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 备忘信息编辑弹窗 -->
    <el-dialog
      :model-value="showMemoEdit"
      title="编辑备忘信息"
      width="400px"
      destroy-on-close
      @close="showMemoEdit = false"
    >
      <el-form :model="memoEditForm" label-position="top" @submit.prevent>
        <el-form-item label="备忘标题" required>
          <el-input v-model="memoEditForm.title" placeholder="例如：三亚亲子游" maxlength="30" />
        </el-form-item>
        <el-form-item label="目的地">
          <el-input v-model="memoEditForm.destination" placeholder="例如：三亚" maxlength="20" />
        </el-form-item>
        <el-form-item label="出行日期">
          <el-date-picker
            v-model="memoEditForm.tripDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="default" @click="showMemberManage = true; showMemoEdit = false">
            管理成员
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMemoEdit = false">取消</el-button>
        <el-button
          type="primary"
          @click="saveMemoInfo"
          :disabled="!memoEditForm.title.trim()"
        >保存</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Plus, Edit, Delete, EditPen, User, Select, Close, CopyDocument, Search, FolderAdd, FolderOpened, MoreFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ItemRow from './components/ItemRow.vue'
import AddItemDialog from './components/AddItemDialog.vue'
import AddCategoryDialog from './components/AddCategoryDialog.vue'
import CategoryManage from './components/CategoryManage.vue'
import MemberManage from './components/MemberManage.vue'

const router = useRouter()
const STORAGE_KEY = 'travel_memo'

// ===================== 默认值 =====================
const DEFAULT_CATEGORIES = [
  { id: 'c7', name: '证件', icon: '', sortOrder: 0, scope: 'personal', note: '' },
  { id: 'c3', name: '药品', icon: '', sortOrder: 1, scope: 'public', note: '' },
  { id: 'c5', name: '电子设备', icon: '', sortOrder: 2, scope: 'personal', note: '' },
  { id: 'c6', name: '衣物', icon: '', sortOrder: 3, scope: 'personal', note: '' },
  { id: 'c8', name: '日用品', icon: '', sortOrder: 4, scope: 'personal', note: '' },
  { id: 'c2', name: '食品', icon: '', sortOrder: 5, scope: 'public', note: '' },
  { id: 'c1', name: '露营野餐装备', icon: '', sortOrder: 6, scope: 'public', note: '' },
  { id: 'c4', name: '其他', icon: '', sortOrder: 7, scope: 'public', note: '' },
  { id: 'c9', name: '其他', icon: '', sortOrder: 8, scope: 'personal', note: '' }
]

const CATEGORY_PRESETS = {
  '电子设备': ['手机', '充电器', '充电宝', '耳机', '平板', '笔记本', '相机', '智能手表', '数据线', '自拍杆', '蓝牙音箱', '转换插头'],
  '衣物': ['内衣', '内裤', '袜子', 'T恤', '衬衫', '裤子', '外套', '连衣裙', '泳衣', '睡衣', '拖鞋', '运动鞋', '帽子', '太阳镜', '围巾'],
  '证件': ['身份证', '护照', '驾驶证', '银行卡', '现金', '机票/车票', '酒店预订单', '保险单', '学生证', '户口本', '签证'],
  '日用品': ['牙刷', '牙膏', '毛巾', '洗发水', '沐浴露', '防晒霜', '护肤品', '梳子', '剃须刀', '纸巾', '湿巾', '洗衣液', '衣架'],
  '药品': ['感冒药', '退烧药', '止痛药', '晕车药', '创可贴', '止泻药', '抗过敏药', '体温计', '驱蚊液', '口罩', '碘伏', '棉签'],
  '食品': ['矿泉水', '零食', '方便面', '面包', '水果', '茶叶/咖啡', '奶粉', '糖果', '饼干', '坚果'],
  '露营野餐装备': ['帐篷', '睡袋', '防潮垫', '充气床垫', '充气泵', '露营灯', '天幕', '地钉', '防风绳', '折叠椅', '折叠桌', '吊床', '营地车', '野餐垫', '野餐篮', '烧烤架', '木炭', '点火器', '卡式炉', '气罐', '锅具', '炊具套装', '刀具', '切菜板', '锡纸', '一次性餐具', '冰包', '水桶', '折叠水盆', '垃圾袋', '保鲜袋', '调味料', '风筝', '飞盘', '急救包'],
  '其他': ['雨伞', '背包', '颈枕', '眼罩', '耳塞', '书籍', '保温杯', '购物袋', '钥匙']
}

const DEFAULT_MEMBERS = [
  { id: 'member_me_default', name: '我' },
  { id: 'member_baby_default', name: '宝宝', type: 'baby', age: '1岁半' }
]

const BABY_PRESETS = {
  '食品': ['奶粉', '奶瓶', '保温壶(冲奶)', '奶瓶刷', '婴儿米粉', '辅食泥', '磨牙棒', '溶豆', '婴儿零食', '维生素D滴剂'],
  '日用品': ['纸尿裤', '拉拉裤', '婴儿湿巾', '棉柔巾', '隔尿垫', '口水巾', '围兜', '婴儿餐具(碗勺)', '安抚奶嘴', '婴儿沐浴露', '婴儿润肤乳', '护臀膏', '指甲剪', '便携尿壶'],
  '衣物': ['连体衣×2', 'T恤×2', '裤子×2', '外套/马甲', '袜子×3', '帽子', '小方巾×3', '睡袋/抱被', '婴儿毯'],
  '药品': ['退热贴', '婴儿退烧药', '耳温枪', '益生菌', '婴儿驱蚊液', '婴儿防晒霜', '碘伏棉签', '创可贴(婴儿)', '氧化锌软膏'],
  '其他': ['婴儿推车', '背带/腰凳', '小玩具×2', '绘本', '保温杯', '密封袋', '垃圾袋'],
  '证件': ['户口本', '出生证明', '疫苗本'],
  '电子设备': ['耳温枪', '辅食机(便携)']
}

function getEmptyMemo() {
  return {
    id: 'memo_' + Date.now(),
    title: '',
    destination: '',
    tripDate: '',
    members: DEFAULT_MEMBERS.map(m => ({ ...m })),
    categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

// ===================== 主数据 =====================
const memo = reactive(getEmptyMemo())

// ===================== UI 状态 =====================
const activeCategories = ref([])
const activePresets = ref([])
const activeMemberFilter = ref('public')
const activeStatusFilter = ref('all')
const searchQuery = ref('')
const progressCollapsed = ref(false)
const showItemDialog = ref(false)
const showAddCategoryDialog = ref(false)
const showCategoryManage = ref(false)
const showMemberManage = ref(false)
const showMemoEdit = ref(false)
const editTarget = ref(null)

const editingCatId = ref(null)
const editCatName = ref('')

const statusFilterTabs = [
  { key: 'all', label: '全部' },
  { key: 'unchecked', label: '未带' },
  { key: 'checked', label: '已带' }
]

const memoEditForm = ref({ title: '', destination: '', tripDate: '' })

// ===================== 辅助函数 =====================
function memberAvatarClass(m) {
  if (m.id === 'public') return 'avatar-public'
  if (m.type === 'baby') return 'avatar-baby'
  return 'avatar-me'
}


const checkedCount = computed(() =>
  (memo.items || []).filter(it => it.checked).length
)

const totalCount = computed(() => (memo.items || []).length)

const displayCheckedCount = computed(() => checkedCount.value)
const displayTotalCount = computed(() => totalCount.value)

const displayPercent = computed(() =>
  displayTotalCount.value > 0 ? Math.round((displayCheckedCount.value / displayTotalCount.value) * 100) : 0
)

const displayMembers = computed(() => {
  const items = memo.items || []
  const pubCatIds = new Set((memo.categories || []).filter(c => c.scope === 'public').map(c => c.id))
  const personalCatIds = new Set((memo.categories || []).filter(c => c.scope === 'personal').map(c => c.id))

  const pubItems = items.filter(it => pubCatIds.has(it.categoryId))
  const pubChecked = pubItems.filter(it => it.checked).length

  const list = [
    {
      id: 'public',
      name: '公共',
      checked: pubChecked,
      total: pubItems.length,
      percent: pubItems.length > 0 ? Math.round((pubChecked / pubItems.length) * 100) : 0
    }
  ]

  // 每个成员独立进度
  ;(memo.members || []).forEach(m => {
    const memberItems = items.filter(it => personalCatIds.has(it.categoryId) && it.assigneeId === m.id)
    const checked = memberItems.filter(it => it.checked).length
    const total = memberItems.length
    list.push({
      id: m.id,
      name: m.name,
      type: m.type || null,
      checked,
      total,
      percent: total > 0 ? Math.round((checked / total) * 100) : 0
    })
  })

  return list
})

function pctClass(pct) {
  if (pct === 0) return 'pct-0'
  if (pct < 50) return 'pct-low'
  if (pct < 100) return 'pct-high'
  return 'pct-full'
}

function pctTextClass(pct) {
  if (pct === 0) return 'pct-text-0'
  if (pct === 100) return 'pct-text-full'
  return ''
}

const filteredItems = computed(() => {
  let list = memo.items || []
  if (activeMemberFilter.value === 'public') {
    const pubCatIds = new Set((memo.categories || []).filter(c => c.scope === 'public').map(c => c.id))
    list = list.filter(it => pubCatIds.has(it.categoryId))
  } else if (activeMemberFilter.value) {
    const personalCatIds = new Set((memo.categories || []).filter(c => c.scope === 'personal').map(c => c.id))
    list = list.filter(it => personalCatIds.has(it.categoryId) && it.assigneeId === activeMemberFilter.value)
  }
  if (activeStatusFilter.value === 'checked') list = list.filter(it => it.checked)
  if (activeStatusFilter.value === 'unchecked') list = list.filter(it => !it.checked)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(it => it.name.toLowerCase().includes(q) || (it.note || '').toLowerCase().includes(q))
  }
  return list
})

const availableCategories = computed(() => {
  let list = memo.categories || []
  if (activeMemberFilter.value === 'public') {
    list = list.filter(c => c.scope === 'public')
  } else if (activeMemberFilter.value) {
    list = list.filter(c => c.scope === 'personal')
  }
  return list.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
})

const filteredCategories = computed(() => {
  let list = memo.categories || []
  if (activeMemberFilter.value === 'public') {
    list = list.filter(c => c.scope === 'public')
  } else if (activeMemberFilter.value) {
    list = list.filter(c => c.scope === 'personal')
  }
  return list.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
})

function getCatItems(catId) {
  return [...filteredItems.value.filter(it => it.categoryId === catId)]
    .sort((a, b) => (a.checked ? 1 : 0) - (b.checked ? 1 : 0))
}

function getCatChecked(catId) {
  return getCatItems(catId).filter(it => it.checked).length
}

function getCatTotal(catId) {
  return getCatItems(catId).length
}

function getPresetsForCat(cat) {
  const activeMember = (memo.members || []).find(m => m.id === activeMemberFilter.value)
  const isBabyView = activeMember && activeMember.type === 'baby'
  const sourcePresets = isBabyView ? BABY_PRESETS : CATEGORY_PRESETS
  const presets = sourcePresets[cat.name] || []
  if (presets.length === 0) return []
  const existing = new Set(
    (memo.items || [])
      .filter(it => it.categoryId === cat.id)
      .map(it => it.name)
  )
  return presets.filter(n => !existing.has(n))
}

function openQuickAdd(catId, name) {
  const assigneeId =
    activeMemberFilter.value && activeMemberFilter.value !== 'public'
      ? activeMemberFilter.value
      : null
  memo.items.push({
    id: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    name,
    categoryId: catId,
    quantity: 1,
    checked: false,
    icon: '',
    note: '',
    assigneeId,
    sortOrder: memo.items.length
  })
  persist()
}

// 手风琴切换
function toggleCategory(catId) {
  const idx = activeCategories.value.indexOf(catId)
  if (idx > -1) {
    activeCategories.value = activeCategories.value.filter(id => id !== catId)
  } else {
    activeCategories.value = [...activeCategories.value, catId]
  }
}

function togglePresets(catId) {
  const idx = activePresets.value.indexOf(catId)
  if (idx > -1) {
    activePresets.value = activePresets.value.filter(id => id !== catId)
  } else {
    activePresets.value = [...activePresets.value, catId]
  }
}

// ===================== 持久化 =====================
onMounted(() => {
  loadMemo()
})

function loadMemo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data.categories && Array.isArray(data.categories)) {
        data.categories = data.categories.map(c => ({
          ...c,
          scope: c.scope || 'public',
          note: c.note || ''
        }))
      }
      if (!data.members || data.members.length === 0) {
        data.members = DEFAULT_MEMBERS.map(m => ({ ...m }))
      }
      data.members = data.members.map(m => {
        if (m.name === '宝宝' || m.id === 'member_baby_default') {
          return { ...m, type: m.type || 'baby', age: m.age || '1岁半' }
        }
        return m
      })
      Object.assign(memo, data)
      activeCategories.value = (memo.categories || []).map(c => c.id)
    } else {
      activeCategories.value = DEFAULT_CATEGORIES.map(c => c.id)
    }
  } catch {
    activeCategories.value = DEFAULT_CATEGORIES.map(c => c.id)
  }
}

function persist() {
  memo.updatedAt = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memo))
}

watch(
  () => memo.items,
  () => persist(),
  { deep: true }
)

watch(
  () => memo.members,
  (members) => {
    if (activeMemberFilter.value && activeMemberFilter.value !== 'public') {
      if (!(members || []).find(m => m.id === activeMemberFilter.value)) {
        activeMemberFilter.value = 'public'
      }
    }
  },
  { deep: true }
)

// ===================== 物品操作 =====================
function toggleItem(itemId) {
  const item = (memo.items || []).find(it => it.id === itemId)
  if (item) {
    item.checked = !item.checked
    persist()
  }
}

function handleQtyChange(itemId, delta) {
  const item = (memo.items || []).find(it => it.id === itemId)
  if (item) {
    item.quantity = Math.max(1, Math.min(99, (item.quantity || 1) + delta))
    persist()
  }
}

function openAddItemForCat(catId) {
  const assigneeId =
    activeMemberFilter.value && activeMemberFilter.value !== 'public'
      ? activeMemberFilter.value
      : null
  editTarget.value = { categoryId: catId, assigneeId }
  showItemDialog.value = true
}

function openEditItem(item) {
  editTarget.value = item
  showItemDialog.value = true
}

function closeItemDialog() {
  showItemDialog.value = false
  editTarget.value = null
}

function saveItem(formData) {
  if (editTarget.value?.id) {
    const idx = memo.items.findIndex(it => it.id === editTarget.value.id)
    if (idx !== -1) {
      memo.items[idx] = { ...memo.items[idx], ...formData }
    }
  } else {
    memo.items.push({
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      ...formData,
      checked: false,
      sortOrder: memo.items.length
    })
  }
  persist()
  closeItemDialog()
}

function deleteItem(itemId) {
  ElMessageBox.confirm('确定删除这个物品吗？', '确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    memo.items = memo.items.filter(it => it.id !== itemId)
    persist()
    ElMessage.success('已删除')
  }).catch(() => {})
}

const allChecked = computed(() =>
  filteredItems.value.length > 0 && filteredItems.value.every(it => it.checked)
)

function toggleAll() {
  const list = filteredItems.value
  if (list.length === 0) {
    ElMessage.info('当前视图暂无物品')
    return
  }
  const target = !allChecked.value
  list.forEach(it => { it.checked = target })
  persist()
  const label = getFilterLabel()
  ElMessage.success(target ? (label ? `「${label}」已全部勾选` : '已全部勾选') : (label ? `「${label}」已全部取消` : '已全部取消'))
}

function clearAllItems() {
  if (!memo.items || memo.items.length === 0) {
    ElMessage.info('暂无物品')
    return
  }
  const count = memo.items.length
  ElMessageBox.confirm(
    `确定要删除全部 ${count} 项物品吗？此操作不可恢复。`,
    '清空清单',
    { confirmButtonText: '确认清空', cancelButtonText: '取消', type: 'error' }
  ).then(() => {
    memo.items = []
    persist()
    ElMessage.success(`已清空 ${count} 项物品`)
  }).catch(() => {})
}

function handleMore(cmd) {
  if (cmd === 'save') saveAsTemplate()
  else if (cmd === 'load') openTemplateDialog()
}

function copyList() {
  const list = filteredItems.value
  if (list.length === 0) {
    ElMessage.info('当前视图暂无物品可复制')
    return
  }
  const cats = filteredCategories.value
  const checked = list.filter(it => it.checked).length
  const lines = []

  // 头部信息
  const filterLabel = getFilterLabel()
  lines.push(memo.title ? `📋 ${memo.title}` : '📋 出行清单')
  if (filterLabel) lines.push(`👤 ${filterLabel}`)
  if (memo.destination) lines.push(`📍 目的地：${memo.destination}`)
  if (memo.tripDate) lines.push(`📅 出行日期：${memo.tripDate}`)
  lines.push(`📊 进度：${checked}/${list.length}（${Math.round((checked / list.length) * 100)}%）`)

  // 按分类输出（只看当前视图中有物品的分类）
  cats.forEach(cat => {
    const catItems = list.filter(it => it.categoryId === cat.id)
    if (catItems.length === 0) return
    const catChecked = catItems.filter(it => it.checked).length
    lines.push('')
    lines.push(`── ${cat.name}（${catChecked}/${catItems.length}）──`)
    catItems.forEach(it => {
      const status = it.checked ? '✅' : '⬜'
      const qty = it.quantity > 1 ? ` ×${it.quantity}` : ''
      const note = it.note ? ` — ${it.note}` : ''
      lines.push(`  ${status} ${it.name}${qty}${note}`)
    })
  })

  const text = lines.join('\n')
  copyToClipboard(text)
}

function getFilterLabel() {
  const parts = []
  if (activeMemberFilter.value === 'public') {
    parts.push('公共物品')
  } else if (activeMemberFilter.value) {
    const m = (memo.members || []).find(mb => mb.id === activeMemberFilter.value)
    parts.push(m ? m.name : '个人')
  }
  if (activeStatusFilter.value === 'checked') parts.push('已勾选')
  if (activeStatusFilter.value === 'unchecked') parts.push('未勾选')
  return parts.join(' · ')
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('清单已复制到剪贴板')
  }).catch(() => {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    ElMessage.success('清单已复制到剪贴板')
  })
}

// ===================== 模板保存/加载 =====================
const TEMPLATES_KEY = 'travel_memo_templates'
const showTemplateDialog = ref(false)
const templates = ref([])

function openTemplateDialog() {
  templates.value = loadTemplates()
  showTemplateDialog.value = true
}

function saveAsTemplate() {
  if (!memo.items || memo.items.length === 0) {
    ElMessage.info('暂无物品可保存为模板')
    return
  }
  const tpls = loadTemplates()
  const name = memo.title || `模板_${new Date().toLocaleDateString()}`
  let finalName = name
  let idx = 1
  while (tpls.find(t => t.name === finalName)) {
    finalName = `${name}(${idx})`
    idx++
  }
  tpls.push({
    id: 'tpl_' + Date.now(),
    name: finalName,
    categories: JSON.parse(JSON.stringify(memo.categories || [])),
    items: JSON.parse(JSON.stringify(memo.items || [])).map(it => ({ ...it, checked: false })),
    createdAt: new Date().toISOString()
  })
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(tpls))
  ElMessage.success(`已保存模板「${finalName}」`)
}

function loadTemplate(tpl) {
  ElMessageBox.confirm(
    `确定加载模板「${tpl.name}」吗？当前所有物品将被替换。`,
    '加载模板',
    { confirmButtonText: '确认加载', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    memo.categories = JSON.parse(JSON.stringify(tpl.categories))
    memo.items = JSON.parse(JSON.stringify(tpl.items))
    memo.updatedAt = new Date().toISOString()
    activeCategories.value = (memo.categories || []).map(c => c.id)
    persist()
    ElMessage.success(`已加载模板「${tpl.name}」`)
  }).catch(() => {})
}

function deleteTemplate(tplId) {
  const tpls = loadTemplates()
  const updated = tpls.filter(t => t.id !== tplId)
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated))
  templates.value = updated
  ElMessage.success('模板已删除')
}

function loadTemplates() {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]')
  } catch { return [] }
}

function formatTplDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ===================== 分类管理 =====================
function startEditCat(cat) {
  editingCatId.value = cat.id
  editCatName.value = cat.name
}

function saveCatName(cat) {
  if (editCatName.value.trim() && editCatName.value.trim() !== cat.name) {
    cat.name = editCatName.value.trim()
    persist()
  }
  editingCatId.value = null
  editCatName.value = ''
}

function deleteCategory(cat) {
  if ((memo.categories || []).length <= 1) {
    ElMessage.warning('至少保留一个分类')
    return
  }
  ElMessageBox.confirm(`确定删除「${cat.name}」分类吗？其下的物品将移到第一个分类。`, '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const firstCatId = (memo.categories || []).find(c => c.id !== cat.id)?.id
    ;(memo.items || []).forEach(item => {
      if (item.categoryId === cat.id) item.categoryId = firstCatId
    })
    memo.categories = (memo.categories || []).filter(c => c.id !== cat.id)
    activeCategories.value = activeCategories.value.filter(id => id !== cat.id)
    persist()
    ElMessage.success('已删除')
  }).catch(() => {})
}

function addNewCategory() {
  showAddCategoryDialog.value = true
}

function saveNewCategory(formData) {
  const scope = activeMemberFilter.value === 'public' ? 'public' : 'personal'
  const newCat = {
    id: 'cat_' + Date.now(),
    name: formData.name,
    icon: '',
    note: formData.note || '',
    sortOrder: (memo.categories || []).length,
    scope
  }
  memo.categories = [...(memo.categories || []), newCat]
  showAddCategoryDialog.value = false
  persist()
  nextTick(() => {
    activeCategories.value = [...activeCategories.value, newCat.id]
  })
}

function saveCategories(categories) {
  const newIds = new Set(categories.map(c => c.id))
  ;(memo.items || []).forEach(item => {
    if (!newIds.has(item.categoryId)) {
      item.categoryId = categories[0]?.id || ''
    }
  })
  memo.categories = categories
  persist()
  showCategoryManage.value = false
  ElMessage.success('分类已更新')
}

// ===================== 成员管理 =====================
function saveMembers(members) {
  memo.members = members
  persist()
  showMemberManage.value = false
  ElMessage.success('成员已更新')
}

// ===================== 备忘信息编辑 =====================
watch(showMemoEdit, (val) => {
  if (val) {
    memoEditForm.value = {
      title: memo.title || '',
      destination: memo.destination || '',
      tripDate: memo.tripDate || ''
    }
  }
})

function saveMemoInfo() {
  if (!memoEditForm.value.title.trim()) return
  memo.title = memoEditForm.value.title.trim()
  memo.destination = memoEditForm.value.destination.trim()
  memo.tripDate = memoEditForm.value.tripDate || ''
  persist()
  showMemoEdit.value = false
  ElMessage.success('已保存')
}

function goBack() {
  router.push('/home/lifeServices')
}
</script>

<style lang="scss" scoped>
// ============================================================
//  出行备忘 — 重构样式（品牌靛蓝紫系 + 毛玻璃卡片）
// ============================================================

// 品牌色
$brand: #6366f1;
$brand-light: #818cf8;
$brand-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
$bg-page: #f5f7fa;
$bg-card: rgba(255, 255, 255, 0.75);
$border-card: rgba(226, 232, 240, 0.8);
$text-primary: #0f172a;
$text-secondary: #64748b;
$text-muted: #94a3b8;

// ===================== 页面 =====================
.memo-page {
  min-height: 100vh;
  background: $bg-page;
  display: flex;
  justify-content: center;
}

.memo-container {
  width: 100%;
  max-width: 520px;
  min-height: 100vh;
  background: #fff;
  position: relative;
  box-shadow: 0 0 60px rgba(0, 0, 0, 0.05);
}

// ===================== 导航栏 =====================
.nav-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  height: 52px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.nav-back {
  font-size: 18px;
  cursor: pointer;
  color: $text-secondary;
  padding: 6px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  margin-right: 2px;

  &:hover {
    background: #f1f5f9;
    color: $brand;
  }
}

.nav-title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  background: $brand-gradient;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.nav-members {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: $brand;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 16px;
  background: #f0f0ff;
  transition: all 0.2s;
  user-select: none;

  .el-icon { font-size: 15px; }

  &:hover {
    background: #e4e4ff;
  }
}

.nav-edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;

  &:hover {
    background: #f1f5f9;
    color: $brand;
  }
}

// ===================== 进度卡片 =====================
.progress-card {
  margin: 12px 12px 0;
  background: $bg-card;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid $border-card;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: all 0.3s ease;

  &.collapsed {
    .progress-toggle {
      padding-bottom: 12px;
    }
  }
}

.progress-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;

  &:hover {
    background: rgba(99, 102, 241, 0.04);
  }
}

.toggle-icon {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: $text-muted;
  transition: transform 0.3s;
  flex-shrink: 0;

  &.open {
    transform: rotate(90deg);
  }
}

.toggle-label {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: $text-primary;
}

.toggle-badge {
  font-size: 12px;
  font-weight: 600;
  color: $brand;
  background: #f0f0ff;
  padding: 2px 10px;
  border-radius: 10px;
}

.progress-card-body {
  padding: 0 20px 20px;
}

// 整体进度
.total-progress {
  margin-bottom: 16px;
}

.total-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.total-label {
  font-size: 14px;
  font-weight: 700;
  color: $text-primary;
}

.total-count-num {
  font-size: 13px;
  color: $text-muted;
  font-weight: 500;

  strong {
    font-size: 22px;
    font-weight: 800;
    background: $brand-gradient;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.total-sep {
  color: #cbd5e1;
  margin: 0 2px;
}

.total-pct {
  font-size: 12px;
  margin-left: 4px;
}

// 进度条
.progress-bar-wrap {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.total-bar-wrap {
  height: 8px;
  border-radius: 4px;
  background: #e2e8f0;
}

.progress-bar-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);

  &.pct-0 { background: #e2e8f0; }
  &.pct-low { background: #f59e0b; }
  &.pct-high { background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%); }
  &.pct-full {
    background: $brand-gradient;
    position: relative;
    &::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
      animation: shimmer 2s infinite;
    }
  }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

// 分割线
.progress-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
  margin-bottom: 14px;
}

// 各角色进度
.member-progress-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mp-avatar {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.avatar-public {
    background: #4f46e5;
  }

  &.avatar-me {
    background: #6366f1;
  }

  &.avatar-baby {
    background: #f59e0b;
  }
}

.mp-name {
  font-size: 13px;
  font-weight: 500;
  color: $text-primary;
  flex-shrink: 0;
  width: 42px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.mp-name-public {
    color: #4f46e5;
    font-weight: 600;
  }
}

.mp-count {
  font-size: 11px;
  color: $text-muted;
  flex-shrink: 0;
  width: 30px;
  text-align: right;
  font-weight: 500;
}

.mp-bar-wrap {
  flex: 1;
  height: 5px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  min-width: 40px;
  position: relative;
}

.mp-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);

  &.pct-0 { background: #e2e8f0; }
  &.pct-low { background: #f59e0b; }
  &.pct-high { background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%); }
  &.pct-full { background: $brand-gradient; }
}

.mp-pct {
  font-size: 11px;
  font-weight: 600;
  color: $text-muted;
  flex-shrink: 0;
  width: 36px;
  text-align: right;

  &.pct-text-0 { color: #cbd5e1; }
  &.pct-text-full { color: $brand; }
}

.mp-check {
  color: #10b981;
  margin-left: 4px;
  font-size: 10px;
  font-weight: 600;
}

// ===================== 搜索框 =====================
.search-wrap {
  margin: 10px 12px 0;
  padding: 0 14px;
  height: 42px;
  display: flex;
  align-items: center;
  background: $bg-card;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid $border-card;
  border-radius: 14px;
  gap: 8px;
  transition: border-color 0.25s;

  &:focus-within {
    border-color: $brand;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
}

.search-icon {
  font-size: 16px;
  color: $text-muted;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: $text-primary;
  min-width: 0;

  &::placeholder {
    color: $text-muted;
  }
}

.search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  color: $text-muted;
  font-size: 12px;
  flex-shrink: 0;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    color: $text-secondary;
  }
}

// ===================== 筛选卡片 =====================
.filter-card {
  margin: 10px 12px 0;
  padding: 12px 14px 8px;
  background: $bg-card;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid $border-card;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.filter-row {
  display: flex;
  align-items: center;

  + .filter-row {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #f1f5f9;
  }
}

.filter-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.filter-tab {
  font-size: 12px;
  padding: 5px 14px;
  border-radius: 20px;
  cursor: pointer;
  color: $text-secondary;
  background: #f1f5f9;
  transition: all 0.2s;
  user-select: none;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 5px;

  &:hover { background: #e2e8f0; color: $text-primary; }

  .tab-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #cbd5e1;
    transition: all 0.2s;
    display: none;
  }

  // 成员标签
  &.member {
    .tab-dot { display: block; }
    &.active {
      background: $brand-gradient;
      color: #fff;
      box-shadow: 0 2px 10px rgba(99, 102, 241, 0.35);
      .tab-dot { background: rgba(255,255,255,0.6); }
    }
    &:not(.active) {
      background: #f0f0ff;
      color: $brand;
      .tab-dot { background: $brand-light; }
      &:hover {
        background: #e4e4ff;
        color: #4f46e5;
      }
    }
  }

  // 宝宝
  &.filter-tab-baby:not(.active) {
    background: #fef3e2;
    color: #e88b2d;
    .tab-dot { background: #f59e0b; }
    &:hover { background: #fde8c8; color: #d4771c; }
  }
  &.filter-tab-baby.active {
    background: linear-gradient(135deg, #f59e0b, #f97316);
  }

  // 状态标签
  &.status {
    color: $text-secondary;
    &.active {
      background: #fef3c7;
      color: #d97706;
      font-weight: 600;
      box-shadow: 0 1px 4px rgba(245, 158, 11, 0.15);
    }
  }
}

.baby-badge {
  margin-left: 1px;
  font-size: 13px;
}

.add-member-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  padding: 4px 8px;
  min-width: 28px;
  font-weight: 700;
  color: $text-muted;
  background: transparent;
  border: 1.5px dashed #dde;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: $brand;
    border-color: $brand;
    background: #f0f0ff;
  }
}

// ===================== 新增分类 =====================
.add-category-wrap {
  margin: 12px 12px 0;
}

.add-category-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 40px;
  border: 1.5px dashed #dde;
  border-radius: 12px;
  color: $brand;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.6);
  user-select: none;

  &:hover {
    border-color: $brand;
    background: #f0f0ff;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
  }

  .el-icon { font-size: 15px; }
}

// ===================== 分类手风琴卡片 =====================
.category-list {
  margin: 10px 12px 0;
}

.cat-card {
  background: $bg-card;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid $border-card;
  border-radius: 14px;
  margin-bottom: 8px;
  overflow: hidden;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

  &.expanded {
    box-shadow: 0 2px 12px rgba(99, 102, 241, 0.08);
    border-color: rgba(99, 102, 241, 0.15);
  }

  &:last-child { margin-bottom: 0; }
}

.cat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 14px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }
}

.cat-arrow {
  font-size: 14px;
  color: $text-muted;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;

  &.open {
    transform: rotate(90deg);
    color: $brand;
  }
}

.cat-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.cat-title {
  flex: 1;
  min-width: 0;
}

.cat-name {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.cat-name-input-inline {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  border: 2px solid $brand;
  border-radius: 8px;
  padding: 4px 10px;
  outline: none;
  background: #fff;
  width: 120px;
  line-height: 1.4;
  transition: box-shadow 0.2s;

  &:focus {
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  }
}

.cat-count-badge {
  font-size: 11px;
  font-weight: 600;
  color: $brand;
  background: #f0f0ff;
  padding: 3px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}

.cat-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.cat-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: $text-muted;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 14px;

  &:hover {
    background: #f1f5f9;
    color: $brand;
  }

  &.cat-action-del:hover {
    background: #fef2f2;
    color: #ef4444;
  }
}

// 展开体
.cat-body {
  border-top: 1px solid #f1f5f9;
  overflow: hidden;
  max-height: 2000px;
  opacity: 1;
  transition: max-height 0.35s ease, opacity 0.25s ease, border-top-color 0.35s;
}

.cat-card:not(.expanded) .cat-body {
  max-height: 0;
  opacity: 0;
  border-top-color: transparent;
}

// 快捷添加标签
.quick-add-row {
  padding: 8px 14px 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qa-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: $text-muted;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  transition: color 0.15s;

  &:hover {
    color: $brand;
  }
}

.qa-toggle-arrow {
  font-size: 10px;
  color: $text-muted;
  transition: transform 0.2s, color 0.15s;
  display: inline-block;

  &.open {
    transform: rotate(90deg);
    color: $brand;
  }
}

.qa-label {
  font-size: 11px;
  color: $text-muted;
  padding-top: 3px;
  flex-shrink: 0;
  font-weight: 500;
}

.qa-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.qa-chip {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 10px;
  cursor: pointer;
  color: $brand;
  background: #f0f0ff;
  border: 1px solid transparent;
  transition: all 0.15s;
  user-select: none;
  white-space: nowrap;
  font-weight: 500;

  &:hover {
    background: $brand;
    color: #fff;
    border-color: $brand;
    box-shadow: 0 2px 6px rgba(99, 102, 241, 0.25);
  }

  &:active {
    transform: scale(0.95);
  }
}

// 物品区
.cat-items {
  // ItemRow 占主要样式
}

// 空状态
.cat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  gap: 6px;
  color: $text-muted;
  font-size: 13px;
}

// 添加物品按钮
.cat-add-item-wrap {
  padding: 4px 14px 10px;
}

.cat-add-item-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 34px;
  border: 1.5px dashed #e2e8f0;
  border-radius: 10px;
  color: $text-muted;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;

  &:hover {
    border-color: $brand-light;
    color: $brand;
    background: #f8f7ff;
  }

  .el-icon { font-size: 14px; }
}

// 无结果
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
  color: $text-muted;
  font-size: 14px;
  text-align: center;
}

// ===================== 底部操作栏 =====================
.bottom-spacer {
  height: 80px;
}

.bottom-bar {
  position: sticky;
  bottom: 0;
  z-index: 50;
  display: flex;
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.bottom-btn {
  flex: 1;
  height: 46px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.check-all-btn {
  background: $brand-gradient !important;
  border: none !important;
  color: #fff !important;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  transition: all 0.25s;

  &:hover {
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
    transform: translateY(-1px);
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
  }

  &:active {
    transform: translateY(0);
  }
}

.reset-btn {
  background: #fff !important;
  border: 1.5px solid #e2e8f0 !important;
  color: $text-primary !important;
  transition: all 0.25s;

  &:hover {
    border-color: #f59e0b !important;
    color: #f59e0b !important;
    background: #fffbeb !important;
  }
}

.copy-btn {
  background: #fff !important;
  border: 1.5px solid #e2e8f0 !important;
  color: $text-primary !important;
  transition: all 0.25s;

  &:hover {
    border-color: $brand !important;
    color: $brand !important;
    background: #f0f0ff !important;
  }
}

.more-btn {
  flex: 0 0 42px !important;
  min-width: 42px !important;
  background: #fff !important;
  border: 1.5px solid #e2e8f0 !important;
  color: $text-secondary !important;
  transition: all 0.25s;
  font-size: 14px !important;
  padding: 0 !important;

  &:hover {
    border-color: #a78bfa !important;
    color: #7c3aed !important;
    background: #f5f3ff !important;
  }
}

// ===================== 模板弹窗 =====================
.template-empty {
  text-align: center;
  padding: 32px 16px;
  color: $text-muted;
  font-size: 14px;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
}

.template-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f8f7ff;
    border-color: #e0e0ff;
  }
}

.tpl-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.tpl-name {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
}

.tpl-meta {
  font-size: 12px;
  color: $text-muted;
}

.tpl-del {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: $text-muted;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fef2f2;
    color: #ef4444;
  }
}

// ===================== 空状态引导 =====================
.empty-guide {
  text-align: center;
  padding: 48px 24px;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 18px;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 8px;
  }

  .empty-desc {
    font-size: 14px;
    color: $text-muted;
    margin-bottom: 24px;
  }
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.empty-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: $brand-gradient;
  color: #fff;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
  }

  &.secondary {
    background: #fff;
    color: $brand;
    border: 1.5px solid #e0e0ff;
    box-shadow: none;

    &:hover {
      background: #f8f7ff;
      border-color: $brand;
    }
  }
}

// ===================== 响应式 =====================
@media (min-width: 769px) {
  .memo-page {
    padding: 24px 0;
  }

  .memo-container {
    border-radius: 20px;
    min-height: auto;
    margin: 0 16px;
  }

  .nav-bar {
    border-radius: 20px 20px 0 0;
  }

  .bottom-bar {
    border-radius: 0 0 20px 20px;
  }
}

@media (max-width: 768px) {
  .memo-page {
    background: $bg-page;
  }

  .memo-container {
    max-width: 100%;
    box-shadow: none;
  }

  .progress-card {
    margin: 10px 10px 0;
    padding: 16px;
  }

  .filter-card {
    margin: 8px 10px 0;
  }

  .add-category-wrap {
    margin: 10px 10px 0;
  }

  .category-list {
    margin: 8px 10px 0;
  }

  .total-count-num strong {
    font-size: 20px;
  }
}

@media (max-width: 380px) {
  .progress-card {
    padding: 14px;
    border-radius: 12px;
  }

  .filter-card {
    border-radius: 12px;
  }

  .filter-tab {
    padding: 4px 10px;
    font-size: 11px;
  }
}
</style>

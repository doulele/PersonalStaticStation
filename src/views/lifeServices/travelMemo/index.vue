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
  router.push('/lifeServices')
}
</script>

<style lang="scss" scoped src="./index.scss"></style>
<style lang="scss" src="./index-global.scss"></style>

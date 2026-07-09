<template>
  <div class="lottery-selector">
    <!-- 头部 Hero -->
    <div class="hero" :class="{ 'hero-dlt': activeLottery === 'dlt' }">
      <!-- 背景装饰 -->
      <div class="hero-bg-decor">
        <div class="hero-circle c1"></div>
        <div class="hero-circle c2"></div>
        <div class="hero-circle c3"></div>
      </div>

      <div class="hero-inner">
        <!-- 顶部标签 + 标题 -->
        <div class="hero-top">
          <div class="hero-tag" :class="{ 'tag-dlt': activeLottery === 'dlt', 'tag-query': activeLottery === 'query' }">
            <span class="tag-dot"></span>
            <template v-if="activeLottery === 'query'">中奖查询 · 核验工具</template>
            <template v-else>{{ activeLottery === 'ssq' ? '双色球' : '大乐透' }} · 数据分析工具</template>
          </div>
          <h1 class="hero-title">
            <template v-if="activeLottery === 'ssq'">
              <span class="title-icon">🔴</span>
              双色球分析
              <span class="title-icon">🔵</span>
            </template>
            <template v-else-if="activeLottery === 'dlt'">
              <span class="title-icon">🟡</span>
              大乐透分析
              <span class="title-icon">🟣</span>
            </template>
            <template v-else>
              <span class="title-icon">🎫</span>
              中奖查询
              <span class="title-icon">🏆</span>
            </template>
          </h1>
          <p class="hero-subtitle" v-if="activeLottery === 'ssq'">
            多维度概率分析 + <strong>三大分析模型</strong>：整体频率 · 位置概率矩阵 · 时间衰减加权
          </p>
          <p class="hero-subtitle" v-else-if="activeLottery === 'dlt'">
            <strong>5+2</strong> 选号规则下的多模型分析：整体频率 · 位置概率矩阵 · 时间衰减加权
          </p>
          <p class="hero-subtitle" v-else>
            支持<strong>手动选号</strong>和<strong>拍照识别</strong>两种方式，快速核验双色球 / 大乐透中奖结果
          </p>
        </div>

        <!-- 中间统计行 -->
        <div class="hero-meta" v-if="activeLottery === 'ssq'">
          <div class="meta-item">
            <span class="meta-value">6+1</span>
            <span class="meta-label">玩法</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-value">1–33</span>
            <span class="meta-label">红球</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-value">1–16</span>
            <span class="meta-label">蓝球</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-value">×3</span>
            <span class="meta-label">算法模型</span>
          </div>
        </div>
        <div class="hero-meta" v-else-if="activeLottery === 'dlt'">
          <div class="meta-item">
            <span class="meta-value">5+2</span>
            <span class="meta-label">玩法</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-value">1–35</span>
            <span class="meta-label">前区</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-value">1–12</span>
            <span class="meta-label">后区</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-value">×3</span>
            <span class="meta-label">算法模型</span>
          </div>
        </div>
        <div class="hero-meta hero-meta-query" v-else>
          <div class="meta-item">
            <span class="meta-value">双色球</span>
            <span class="meta-label">6+1</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-value">大乐透</span>
            <span class="meta-label">5+2</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-value">📷</span>
            <span class="meta-label">拍照识别</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-value">✋</span>
            <span class="meta-label">手动选号</span>
          </div>
        </div>

        <!-- 提示条 -->
        <div class="hero-tip" :class="{ 'tip-dlt': activeLottery === 'dlt', 'tip-query': activeLottery === 'query' }">
          <el-icon><InfoFilled /></el-icon>
          <span v-if="activeLottery === 'ssq'">加权概率模式为近期开奖数据赋予更高权重，更准确地反映当前走势。</span>
          <span v-else-if="activeLottery === 'dlt'">核心算法框架与双色球共用，已完整适配 5+2 大乐透选号规则。</span>
          <span v-else>支持双色球和大乐透的中奖核验。可拍照上传彩票自动识别号码，也可手动选号逐一比对。</span>
        </div>

        <!-- 彩种切换 Tab -->
        <div class="hero-tabs">
          <button
            class="hero-tab tab-ssq"
            :class="{ active: activeLottery === 'ssq' }"
            @click="activeLottery = 'ssq'"
          >
            <span class="tab-ball red"></span>
            <span class="tab-ball blue"></span>
            <span class="tab-text">双色球</span>
            <span class="tab-badge">6+1</span>
          </button>
          <button
            class="hero-tab tab-dlt"
            :class="{ active: activeLottery === 'dlt' }"
            @click="activeLottery = 'dlt'"
          >
            <span class="tab-ball yellow"></span>
            <span class="tab-ball purple"></span>
            <span class="tab-text">大乐透</span>
            <span class="tab-badge">5+2</span>
          </button>
          <button
            class="hero-tab tab-query"
            :class="{ active: activeLottery === 'query' }"
            @click="activeLottery = 'query'"
          >
            <el-icon class="search-icon"><Search /></el-icon>
            <span class="tab-text">中奖查询</span>
            <span class="tab-badge">验奖</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 可买入小提示 -->
    <p class="purchase-tip" v-if="purchaseTip">{{ purchaseTip }}</p>

    <!-- 子面板 -->
    <SSQPanel v-if="activeLottery === 'ssq'" />
    <DLTPanel v-else-if="activeLottery === 'dlt'" />
    <WinQueryPanel v-else-if="activeLottery === 'query'" />

    <!-- 底部提示 -->
    <div class="footer-note">
      <el-icon><WarningFilled /></el-icon>
      分析结果仅供娱乐参考，历史数据不代表未来开奖结果。请理性购彩，量力而行。
    </div>

    <!-- 隐蔽数据管理入口 -->
    <div class="data-mgmt-area" @mouseenter="showMgmtHint = true" @mouseleave="showMgmtHint = false">
      <transition name="hint-fade">
        <span v-if="showMgmtHint && !mgmtDialogVisible" class="mgmt-hint">数据管理</span>
      </transition>
      <button
        class="data-mgmt-trigger"
        :class="{ 'trigger-visible': mgmtDialogVisible }"
        @click="openMgmtDialog"
        title="数据管理"
      >
        <el-icon :size="14"><Setting /></el-icon>
      </button>
    </div>

    <!-- 数据管理弹窗 -->
    <el-dialog
      v-model="mgmtDialogVisible"
      title="数据管理"
      width="520px"
      destroy-on-close
      class="mgmt-dialog"
    >
      <!-- 缓存状态 -->
      <div class="mgmt-section">
        <h4>📊 数据缓存状态</h4>
        <div class="mgmt-stats" v-if="lotteryStats">
          <div class="stat-row">
            <span class="stat-label">双色球:</span>
            <el-tag :type="lotteryStats.ssq?.count > 0 ? 'success' : 'info'" size="small">
              {{ lotteryStats.ssq?.count > 0 ? `${lotteryStats.ssq.count} 期` : '无数据' }}
            </el-tag>
            <span class="stat-date" v-if="lotteryStats.ssq?.firstDate">
              {{ lotteryStats.ssq.firstDate }} ~ {{ lotteryStats.ssq.lastDate }}
            </span>
          </div>
          <div class="stat-row">
            <span class="stat-label">大乐透:</span>
            <el-tag :type="lotteryStats.dlt?.count > 0 ? 'success' : 'info'" size="small">
              {{ lotteryStats.dlt?.count > 0 ? `${lotteryStats.dlt.count} 期` : '无数据' }}
            </el-tag>
            <span class="stat-date" v-if="lotteryStats.dlt?.firstDate">
              {{ lotteryStats.dlt.firstDate }} ~ {{ lotteryStats.dlt.lastDate }}
            </span>
          </div>
        </div>
        <el-button size="small" @click="refreshStats" :loading="statsLoading">
          <el-icon><Refresh /></el-icon> 刷新状态
        </el-button>
      </div>

      <el-divider />

      <!-- 日常同步 -->
      <div class="mgmt-section">
        <h4>🔄 同步近期数据（RollToolsApi）</h4>
        <p class="mgmt-desc">从第三方 API 获取最近开奖数据，合并到本地缓存。推荐定期同步。</p>
        <div class="mgmt-actions">
          <el-select v-model="syncType" size="small" style="width: 110px">
            <el-option label="双色球" value="ssq" />
            <el-option label="大乐透" value="dlt" />
          </el-select>
          <el-input-number v-model="syncCount" :min="50" :max="300" :step="50" size="small" style="width: 130px" />
          <span class="count-unit">期</span>
          <el-button type="primary" size="small" @click="doSyncData" :loading="syncing">
            <el-icon><Refresh /></el-icon> 开始同步
          </el-button>
        </div>
        <p class="mgmt-result" v-if="syncResult">{{ syncResult }}</p>
      </div>

      <el-divider />

      <!-- 全量爬取（需密码） -->
      <div class="mgmt-section mgmt-danger">
        <h4>
          ⚠️ 全量重新爬取（紧急恢复）
          <span class="last-crawl-time" v-if="lastFullCrawlTime">
            上次全量爬取：{{ lastFullCrawlTime }}
          </span>
        </h4>
        <p class="mgmt-desc">
          从公开数据源重新爬取全部历史数据。仅在数据丢失或损坏时使用。
          <strong>需要密码 + 两次确认。爬取过程约需 30-60 秒，请耐心等待。</strong>
        </p>

        <!-- 密码输入 -->
        <div class="mgmt-password" v-if="!passwordVerified">
          <el-input
            v-model="crawlPassword"
            type="password"
            placeholder="请输入数据管理密码"
            size="small"
            show-password
            @keyup.enter="doVerifyPassword"
          />
          <el-button size="small" type="warning" @click="doVerifyPassword" :loading="verifyingPwd">
            验证密码
          </el-button>
        </div>

        <!-- 密码验证通过后显示操作区 -->
        <div v-else class="mgmt-crawl">
          <p class="verify-ok">✅ 密码验证通过</p>
          <el-select v-model="fullCrawlType" size="small" style="width: 110px">
            <el-option label="全部" value="all" />
            <el-option label="双色球" value="ssq" />
            <el-option label="大乐透" value="dlt" />
          </el-select>
          <el-button
            size="small"
            type="danger"
            @click="doFullCrawl"
            :loading="crawling"
            :disabled="confirmCount >= 3"
          >
            {{ crawlBtnText }}
          </el-button>
          <p class="confirm-hint" v-if="confirmCount > 0">
            已确认 {{ confirmCount }} / 3 次 (共需 3 次确认)
          </p>
        </div>

        <p class="mgmt-result" :class="{ 'result-error': crawlError }" v-if="crawlResult">
          {{ crawlResult }}
        </p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { InfoFilled, WarningFilled, Search, Setting, Refresh } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import SSQPanel from './SSQPanel.vue'
import DLTPanel from './DLTPanel.vue'
import WinQueryPanel from './WinQueryPanel.vue'
import { useLotteryData } from '@/composables/useLotteryData'
import { fetchStats, syncRecentData, syncFullData, verifyPassword } from '@/api/lottery'

const activeLottery = ref('ssq')

/**
 * 根据当前日期+时间自动判断应跳入的彩种 Tab
 * 双色球：开奖日 周二/周四/周日，截止 20:00
 * 大乐透：开奖日 周一/周三/周六，截止 21:00
 */
function getAutoTab() {
  const now = new Date()
  const day = now.getDay()           // 0=周日 1=周一 ... 6=周六
  const minutes = now.getHours() * 60 + now.getMinutes()

  const ssqDays = [0, 2, 4]          // 日、二、四
  const dltDays = [1, 3, 6]          // 一、三、六

  if (ssqDays.includes(day) && minutes < 20 * 60) return 'ssq'
  if (dltDays.includes(day) && minutes < 21 * 60) return 'dlt'

  // 非买入窗口默认双色球
  return 'ssq'
}

/** 当前选中彩种的买入小提示 */
const purchaseTip = computed(() => {
  const now = new Date()
  const day = now.getDay()
  const minutes = now.getHours() * 60 + now.getMinutes()
  const dayNames = ['日', '一', '二', '三', '四', '五', '六']
  const todayName = dayNames[day]

  if (activeLottery.value === 'ssq') {
    const isToday = [0, 2, 4].includes(day)
    if (isToday && minutes < 20 * 60) return `今日周${todayName}，双色球 20:00 前可买入当前期`
    const next = [0, 2, 4].find(d => d > day)
    const nextDay = next !== undefined ? next : 0  // 周日兜底
    return `双色球每二/四/日开奖，下次周${dayNames[nextDay]} 20:00 前可买入`
  }
  if (activeLottery.value === 'dlt') {
    const isToday = [1, 3, 6].includes(day)
    if (isToday && minutes < 21 * 60) return `今日周${todayName}，大乐透 21:00 前可买入当前期`
    const next = [1, 3, 6].find(d => d > day)
    const nextDay = next !== undefined ? next : 1  // 周一兜底
    return `大乐透每一/三/六开奖，下次周${dayNames[nextDay]} 21:00 前可买入`
  }
  return null  // 中奖查询不展示
})

// ==================== 数据管理 ====================
const { loadBaseData, stats: lotteryStats } = useLotteryData()

const showMgmtHint = ref(false)
const mgmtDialogVisible = ref(false)

// 状态刷新
const statsLoading = ref(false)

// 日常同步
const syncType = ref('ssq')
const syncCount = ref(200)
const syncing = ref(false)
const syncResult = ref('')

// 全量爬取
const crawlPassword = ref('')
const passwordVerified = ref(false)
const verifyingPwd = ref(false)
const fullCrawlType = ref('all')
const crawling = ref(false)
const crawlResult = ref('')
const crawlError = ref(false)
const confirmCount = ref(0)

const crawlBtnText = ref('开始全量爬取')
const lastFullCrawlTime = ref('')

function openMgmtDialog() {
  mgmtDialogVisible.value = true
  refreshStats()

  // 尝试从后端 stats 获取上次全量爬取时间
  if (lotteryStats.value?.lastFullSync) {
    lastFullCrawlTime.value = new Date(lotteryStats.value.lastFullSync).toLocaleString()
  }

  // 如果已有缓存数据，不需要密码就能看状态和同步
  // 全量爬取才需要密码
}

async function refreshStats() {
  statsLoading.value = true
  await loadBaseData()
  statsLoading.value = false
}

async function doSyncData() {
  syncing.value = true
  syncResult.value = ''
  try {
    const result = await syncRecentData(syncType.value, syncCount.value)
    if (result?.code === 1) {
      syncResult.value = `✅ ${result.msg}`
      // 更新前端共享数据
      await loadBaseData()
    } else {
      syncResult.value = `❌ 同步失败: ${result?.msg || '未知错误'}`
    }
  } catch (e) {
    syncResult.value = `❌ 请求失败: ${e.message}`
  } finally {
    syncing.value = false
  }
}

async function doVerifyPassword() {
  if (!crawlPassword.value) {
    syncResult.value = '❌ 请输入密码'
    return
  }
  verifyingPwd.value = true
  try {
    const result = await verifyPassword(crawlPassword.value)
    if (result?.data?.valid) {
      passwordVerified.value = true
      syncResult.value = ''
    } else {
      syncResult.value = '❌ 密码错误'
    }
  } catch (e) {
    syncResult.value = `❌ 验证失败: ${e.message}`
  } finally {
    verifyingPwd.value = false
  }
}

async function doFullCrawl() {
  confirmCount.value++

  if (confirmCount.value === 1) {
    // 第一次：提示确认
    crawlBtnText.value = '再次确认爬取'
    try {
      await ElMessageBox.confirm(
        `确定要从公开数据源重新爬取 ${fullCrawlType.value === 'all' ? '全部' : fullCrawlType.value} 历史数据吗？\n\n此操作会覆盖现有缓存数据，需要约 30-60 秒。`,
        '⚠️ 第一次确认',
        { confirmButtonText: '我确定', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      confirmCount.value = 0
      crawlBtnText.value = '开始全量爬取'
      return
    }
  } else if (confirmCount.value === 2) {
    // 第二次：再次确认
    crawlBtnText.value = '最终确认 (不可撤销)'
    try {
      await ElMessageBox.confirm(
        '二次确认：此操作将触发服务器端爬虫，可能会对目标网站造成请求压力。\n\n请三思后确认。',
        '⚠️ 第二次确认',
        { confirmButtonText: '我已三思', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      confirmCount.value = 0
      crawlBtnText.value = '开始全量爬取'
      return
    }
  } else if (confirmCount.value >= 3) {
    // 第三次：执行
    crawling.value = true
    crawlBtnText.value = '爬取中...'
    crawlResult.value = ''
    crawlError.value = false

    try {
      const result = await syncFullData(fullCrawlType.value, crawlPassword.value)
      if (result?.code === 1) {
        const details = []
        for (const [t, r] of Object.entries(result.data.results)) {
          if (r.success) {
            details.push(`${t}: ${r.count} 期`)
          } else {
            details.push(`${t}: 失败 - ${r.error}`)
          }
        }
        crawlResult.value = `✅ 爬取完成！${details.join(' | ')}`
        lastFullCrawlTime.value = new Date().toLocaleString()
        await loadBaseData() // 刷新状态
      } else {
        crawlResult.value = `❌ 爬取失败: ${result?.msg || '未知错误'}`
        crawlError.value = true
      }
    } catch (e) {
      crawlResult.value = `❌ 请求失败: ${e.message}`
      crawlError.value = true
    } finally {
      crawling.value = false
      confirmCount.value = 0
      crawlBtnText.value = '开始全量爬取'
    }
  }
}

// 关闭弹窗时重置状态
import { watch } from 'vue'
watch(mgmtDialogVisible, (val) => {
  if (!val) {
    passwordVerified.value = false
    crawlPassword.value = ''
    confirmCount.value = 0
    crawlBtnText.value = '开始全量爬取'
    syncResult.value = ''
    crawlResult.value = ''
  }
})

// 页面加载时尝试加载基础数据，并自动跳转当天可买入彩种
onMounted(() => {
  activeLottery.value = getAutoTab()
  loadBaseData()
})
</script>

<style lang="scss" scoped>
// ========== 全局变量 ==========
$bg: #f1f5f9;
$card-bg: #ffffff;
$text-primary: #0f172a;
$text-secondary: #475569;
$text-muted: #94a3b8;
$border: #e2e8f0;
$radius-sm: 12px;
$radius-md: 20px;
$radius-lg: 28px;

.lottery-selector {
  padding: 0;
  max-width: 1520px;
  margin: 0 auto;
  min-height: 100vh;
  background: $bg;

  @media (min-width: 768px) {
    padding: 20px 28px;
  }
}

// ========== Hero ==========
.hero {
  position: relative;
  background: linear-gradient(160deg, #1a0a2e 0%, #2d1045 30%, #4a1942 60%, #7f1d1d 100%);
  overflow: hidden;
  border-radius: 0;
  color: #fff;
  transition: background 0.5s ease;

  @media (min-width: 768px) {
    border-radius: $radius-lg;
  }

  &.hero-dlt {
    background: linear-gradient(160deg, #0c0a2e 0%, #1e1b4b 30%, #312e81 60%, #4338ca 100%);
  }
}

// 背景装饰圆
.hero-bg-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  .hero-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.08;
    &.c1 {
      width: 500px; height: 500px;
      background: #ef4444;
      top: -200px; right: -150px;
    }
    &.c2 {
      width: 300px; height: 300px;
      background: #8b5cf6;
      bottom: -100px; left: -80px;
    }
    &.c3 {
      width: 200px; height: 200px;
      background: #f59e0b;
      top: 40%; right: 10%;
    }
  }
}

.hero-inner {
  position: relative;
  z-index: 1;
  padding: 28px 20px 24px;

  @media (min-width: 768px) {
    padding: 44px 44px 36px;
  }
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 16px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: #fca5a5;
  margin-bottom: 18px;
  backdrop-filter: blur(6px);

  @media (min-width: 768px) {
    font-size: 12px;
    padding: 6px 20px;
  }

  &.tag-dlt {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.35);
    color: #a5b4fc;
  }

  &.tag-query {
    background: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.35);
    color: #6ee7b7;
  }

  .tag-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #ef4444;
    .hero-tag.tag-dlt & { background: #818cf8; }
    .hero-tag.tag-query & { background: #34d399; }
  }
}

.hero-title {
  font-size: clamp(26px, 5vw, 44px);
  font-weight: 800;
  margin: 0 0 14px;
  line-height: 1.15;
  letter-spacing: -0.03em;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  .title-icon {
    font-size: clamp(22px, 4vw, 36px);
    line-height: 1;
  }
}

.hero-subtitle {
  font-size: 13px;
  opacity: 0.72;
  line-height: 1.7;
  margin: 0 0 20px;
  max-width: 640px;
  font-weight: 400;

  @media (min-width: 768px) {
    font-size: 15px;
    margin-bottom: 24px;
  }

  strong {
    opacity: 1;
    color: #fff;
    font-weight: 700;
  }
}

// 统计行
.hero-meta {
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: wrap;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: $radius-md;
  padding: 12px 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);

  @media (min-width: 768px) {
    padding: 16px 28px;
    gap: 0;
  }
}

.meta-item {
  flex: 1;
  min-width: 70px;
  text-align: center;
  padding: 4px 8px;
}

.meta-value {
  display: block;
  font-size: clamp(16px, 3vw, 24px);
  font-weight: 800;
  line-height: 1.2;
}

.meta-label {
  display: block;
  font-size: 10px;
  opacity: 0.55;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;

  @media (min-width: 768px) {
    font-size: 11px;
  }
}

.meta-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
}

// 提示条
.hero-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: $radius-sm;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
  backdrop-filter: blur(4px);

  @media (min-width: 768px) {
    padding: 12px 20px;
    font-size: 13px;
    border-radius: 16px;
  }

  &.tip-dlt {
    background: rgba(167, 139, 250, 0.12);
    border-color: rgba(167, 139, 250, 0.2);
  }

  &.tip-query {
    background: rgba(52, 211, 153, 0.12);
    border-color: rgba(52, 211, 153, 0.2);
  }
}

// 可买入小提示
.purchase-tip {
  font-size: 12px;
  color: #475569;
  text-align: center;
  margin: 8px auto 16px;
  padding: 6px 16px;
  background: #e2e8f0;
  border-radius: 20px;
  width: fit-content;
  max-width: 92vw;
  line-height: 1.5;

  @media (min-width: 768px) {
    font-size: 13px;
    padding: 6px 20px;
  }
}

// 切换按钮
.hero-tabs {
  display: flex;
  gap: 6px;

  @media (min-width: 768px) {
    gap: 14px;
  }
}

.hero-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 6px;
  border: 1.5px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.75);
  border-radius: 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  backdrop-filter: blur(4px);
  position: relative;
  overflow: hidden;

  @media (min-width: 768px) {
    flex: none;
    min-width: 240px;
    gap: 8px;
    padding: 14px 24px;
    font-size: 14px;
    border-radius: 18px;
  }

  // 双色球 — 红色系
  &.tab-ssq {
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.35), rgba(185, 28, 28, 0.3));
    border-color: rgba(239, 68, 68, 0.25);
    color: rgba(255, 255, 255, 0.85);
    &:hover {
      border-color: rgba(239, 68, 68, 0.55);
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.45), rgba(220, 38, 38, 0.4));
      color: #fca5a5;
    }
    &.active {
      background: linear-gradient(135deg, rgba(220, 38, 38, 0.9), rgba(185, 28, 28, 0.85));
      border-color: #dc2626;
      color: #fff;
      box-shadow: 0 8px 30px rgba(220, 38, 38, 0.4);
    }
  }

  // 大乐透 — 紫色系
  &.tab-dlt {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(79, 70, 229, 0.28));
    border-color: rgba(99, 102, 241, 0.3);
    color: rgba(255, 255, 255, 0.85);
    &:hover {
      border-color: rgba(99, 102, 241, 0.55);
      background: linear-gradient(135deg, rgba(129, 140, 248, 0.45), rgba(99, 102, 241, 0.4));
      color: #a5b4fc;
    }
    &.active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(79, 70, 229, 0.85));
      border-color: #6366f1;
      color: #fff;
      box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4);
    }
  }

  // 中奖查询 — 绿色系
  &.tab-query {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.28));
    border-color: rgba(16, 185, 129, 0.3);
    color: rgba(255, 255, 255, 0.85);
    &:hover {
      border-color: rgba(16, 185, 129, 0.55);
      background: linear-gradient(135deg, rgba(52, 211, 153, 0.45), rgba(16, 185, 129, 0.4));
      color: #6ee7b7;
    }
    &.active {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.85));
      border-color: #10b981;
      color: #fff;
      box-shadow: 0 8px 30px rgba(16, 185, 129, 0.4);
    }
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  &.active {
    transform: translateY(-2px);
  }

  .tab-ball {
    display: none;
    @media (min-width: 768px) {
      display: inline-block;
      width: 12px; height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
      &.red { background: #ef4444; }
      &.blue { background: #3b82f6; }
      &.yellow { background: #f59e0b; }
      &.purple { background: #8b5cf6; }
    }
  }

  .search-icon {
    display: none;
    @media (min-width: 768px) {
      display: inline-flex;
    }
  }

  .tab-text {
    white-space: nowrap;
  }

  .tab-badge {
    display: none;
    @media (min-width: 768px) {
      display: inline-block;
      font-size: 11px;
      padding: 3px 10px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 100px;
      font-weight: 500;
      white-space: nowrap;
    }
  }
}

// ========== Footer ==========
.footer-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 24px 12px;
  text-align: center;
  font-size: 11px;
  color: $text-muted;
  background: $card-bg;
  padding: 14px 18px;
  border-radius: 16px;
  border: 1px solid $border;
  line-height: 1.5;

  @media (min-width: 768px) {
    margin: 36px 0;
    font-size: 12px;
    padding: 16px 28px;
    border-radius: 20px;
  }
}

// ========== 隐蔽数据管理入口 ==========
.data-mgmt-area {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mgmt-hint {
  font-size: 11px;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 10px;
  border-radius: 12px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.2s ease;
}
.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
}

.data-mgmt-trigger {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.6);
  color: #cbd5e1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(6px);

  &:hover,
  &.trigger-visible {
    color: #64748b;
    background: rgba(255, 255, 255, 0.95);
    border-color: #e2e8f0;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  }
}

// ========== 数据管理弹窗 ==========
.mgmt-dialog {
  :deep(.el-dialog__header) {
    padding: 20px 24px 12px;
  }
  :deep(.el-dialog__body) {
    padding: 8px 24px 24px;
  }
}

.mgmt-section {
  h4 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
  }
}

.mgmt-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 12px;
  line-height: 1.6;

  strong {
    color: #dc2626;
  }
}

.mgmt-stats {
  margin-bottom: 12px;
  .stat-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 13px;
  }
  .stat-label {
    min-width: 60px;
    color: #475569;
    font-weight: 500;
  }
  .stat-date {
    font-size: 11px;
    color: #94a3b8;
  }
}

.mgmt-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  .count-unit {
    font-size: 12px;
    color: #64748b;
  }
}

.mgmt-result {
  margin: 10px 0 0;
  font-size: 12px;
  color: #16a34a;
  &.result-error {
    color: #dc2626;
  }
}

.mgmt-danger {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 16px;
  margin-top: 8px;
}

.last-crawl-time {
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
  margin-left: 12px;
  white-space: nowrap;
}

.mgmt-password {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  .el-input {
    flex: 1;
  }
}

.mgmt-crawl {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.verify-ok {
  font-size: 12px;
  color: #16a34a;
  margin: 0;
  font-weight: 500;
}

.confirm-hint {
  font-size: 11px;
  color: #f59e0b;
  margin: 4px 0 0;
  width: 100%;
}

// ========== 深色模式 ==========
:global(html.dark-mode .lottery-selector) {
    background: var(--bg-color, #0f0f1a);
    transition: background 0.4s ease;

    // Hero — 深色模式下微调渐变使其融入暗色背景
    .hero {
      &.hero-dlt {
        background: linear-gradient(160deg, #0a081a 0%, #141230 30%, #1e1b4b 60%, #2d2472 100%);
      }
    }

    // 提示条
    .hero-tip {
      color: rgba(255, 255, 255, 0.7);
      &.tip-dlt { color: rgba(255, 255, 255, 0.7); }
    }

    // 可买入小提示
    .purchase-tip {
      background: #252540 !important;
      color: #94a3b8;
      transition: background 0.4s ease, color 0.4s ease;
    }

    // 底部提示
    .footer-note {
      background: #1e1e2e !important;
      border-color: #2d2d4a;
      color: #94a3b8 !important;
      transition: background 0.4s ease, border-color 0.4s ease, color 0.4s ease;
    }

    // 隐蔽数据管理入口
    .mgmt-hint {
      color: var(--text-regular, #94a3b8);
      background: rgba(30, 30, 46, 0.95);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    .data-mgmt-trigger {
      background: rgba(30, 30, 46, 0.7);
      color: #4a4a6a;
      &:hover, &.trigger-visible {
        color: var(--text-regular, #94a3b8);
        background: rgba(30, 30, 46, 0.95);
        border-color: var(--border-color, #2d2d4a);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      }
    }

    // 数据管理弹窗内容
    .mgmt-section h4 { color: var(--heading-color, #e2dee9); }
    .mgmt-desc {
      color: var(--text-regular, #94a3b8);
      strong { color: #f87171; }
    }
    .mgmt-stats .stat-label { color: var(--text-regular, #94a3b8); }
    .mgmt-stats .stat-date { color: var(--text-secondary, #64748b); }
    .mgmt-actions .count-unit { color: var(--text-regular, #94a3b8); }
    .mgmt-result { color: #34d399;
      &.result-error { color: #f87171; }
    }
    .mgmt-danger {
      background: rgba(254, 68, 68, 0.06);
      border-color: rgba(254, 68, 68, 0.15);
    }
    .last-crawl-time { color: var(--text-secondary, #64748b); }
    .verify-ok { color: #34d399; }
    .confirm-hint { color: #fbbf24; }
}

// ========== 移动端适配 ==========
// 注意：el-dialog 通过 teleport 渲染到 body，必须用 :global() 才能命中
@media (max-width: 768px) {
  :global(.mgmt-dialog.el-dialog) {
    width: 92vw !important;
    max-width: 92vw !important;
    margin-top: 10vh !important;
  }
  :global(.mgmt-dialog .el-dialog__header) {
    padding: 16px 16px 10px;
  }
  :global(.mgmt-dialog .el-dialog__body) {
    padding: 6px 16px 16px;
  }

  .mgmt-section h4 {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .mgmt-desc {
    font-size: 11px;
  }

  .mgmt-stats .stat-row {
    flex-wrap: wrap;
    font-size: 12px;
  }

  .mgmt-stats .stat-label {
    min-width: 50px;
  }

  .mgmt-stats .stat-date {
    width: 100%;
    margin-top: 2px;
  }

  .mgmt-actions {
    gap: 6px;
  }

  .last-crawl-time {
    display: block;
    margin-left: 0;
    margin-top: 4px;
    font-size: 11px;
  }

  .mgmt-password {
    flex-direction: column;
    gap: 6px;
    .el-input {
      width: 100%;
    }
  }

  .mgmt-crawl {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .mgmt-danger {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  :global(.mgmt-dialog.el-dialog) {
    width: 96vw !important;
    max-width: 96vw !important;
    margin-top: 4vh !important;
  }
  :global(.mgmt-dialog .el-dialog__header) {
    padding: 12px 12px 8px;
  }
  :global(.mgmt-dialog .el-dialog__body) {
    padding: 4px 12px 12px;
  }

  .mgmt-section h4 {
    font-size: 12px;
  }

  .mgmt-danger {
    padding: 10px;
    border-radius: 8px;
  }
}
</style>

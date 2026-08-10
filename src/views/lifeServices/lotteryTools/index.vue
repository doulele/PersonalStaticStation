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

<style lang="scss" scoped src="./index.scss"></style>

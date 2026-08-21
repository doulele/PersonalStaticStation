import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'
import { setCurrentRoute, abortRouteRequests } from '@/api/request'

const routes = [
  // ==================== 认证页面（独立布局，不带 Header/Footer） ====================
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { title: '登录', guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { title: '注册', guest: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/auth/ForgotPassword.vue'),
    meta: { title: '忘记密码', guest: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { title: '个人设置', requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@/views/auth/Profile.vue'),
        meta: { title: '个人设置', requiresAuth: true }
      }
    ]
  },
  // ==================== 主应用（AppLayout 统一布局） ====================
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/home'
      },
      // ==================== 首页 ====================
      {
        path: 'home',
        component: () => import('@/views/home/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      // ==================== 基金/股票 ====================
      {
        path: 'fund',
        component: () => import('@/views/fund/fundStockToolsList.vue'),
        meta: { title: '基金/股票', icon: 'DataLine' }
      },
      {
        path: 'fund/fund-search',
        component: () => import('@/views/fund/fundInformationSearch.vue'),
        meta: { title: '基金信息查询', icon: 'DataLine' }
      },
      {
        path: 'fund/fund-filter',
        component: () => import('@/views/fund/fundFilter/index.vue'),
        meta: { title: '基金筛选', icon: 'DataLine' }
      },
      {
        path: 'fund/stock-filter',
        component: () => import('@/views/fund/stockFilter/index.vue'),
        meta: { title: '股票筛选', icon: 'DataLine' }
      },
      {
        path: 'fund/stock-detail',
        component: () => import('@/views/fund/stockFilter/stockDetail.vue'),
        meta: { title: '妖股详情', icon: 'DataLine' }
      },
      {
        path: 'fund/stock-recommend-detail/:code',
        name: 'stockRecommendDetail',
        component: () => import('@/views/fund/stockFilter/stockRecommendDetail.vue'),
        meta: { title: '股票测评详情', icon: 'DataLine' }
      },
      {
        path: 'fund/stock-recommend-guide',
        name: 'stockRecommendGuide',
        component: () => import('@/views/fund/stockFilter/stockRecommendGuide.vue'),
        meta: { title: '评分说明', icon: 'DataLine' }
      },
      {
        path: 'fund/dadao-detail',
        name: 'dadaoDetail',
        component: () => import('@/views/fund/stockFilter/DaDaoQiXianDetail.vue'),
        meta: { title: '大道七线详情', icon: 'DataLine' }
      },
      {
        path: 'fund/national-team',
        component: () => import('@/views/fund/nationalTeam/index.vue'),
        meta: { title: '跟党走·国家队动向监测', icon: 'DataLine' }
      },
      // ==================== 音视频图像 ====================
      {
        path: 'mediaTools',
        component: () => import('@/views/mediaTools/index.vue'),
        meta: { title: '视频音频图像在线工具', icon: 'Present' }
      },
      {
        path: 'mediaTools/novelOnline',
        component: () => import('@/views/mediaTools/audioTools/novelOnline/index.vue'),
        meta: { title: '在线音频', icon: 'Present' }
      },
      {
        path: 'mediaTools/vipVideoParse',
        component: () => import('@/views/mediaTools/videoToolls/vipVideoParse/index.vue'),
        meta: { title: '在线视频', icon: 'Present' }
      },
      {
        path: 'mediaTools/imageTools',
        component: () => import('@/views/mediaTools/imageTools/index.vue'),
        meta: { title: '图片处理', icon: 'Picture' }
      },
      // ==================== 生活服务 ====================
      {
        path: 'lifeServices',
        component: () => import('@/views/lifeServices/index.vue'),
        meta: { title: '生活服务', icon: 'Service' }
      },
      {
        path: 'lifeServices/lottery',
        component: () => import('@/views/lifeServices/lotteryTools/index.vue'),
        meta: { title: '双色球/大乐透分析', icon: 'Present' }
      },
      {
        path: 'lifeServices/travelGuide',
        component: () => import('@/views/lifeServices/travelGuide/index.vue'),
        meta: { title: '旅游攻略', icon: 'MapLocation' }
      },
      {
        path: 'lifeServices/travelGuide/plan/:id',
        component: () => import('@/views/lifeServices/travelGuide/plan/index.vue'),
        meta: { title: '规划行程', icon: 'MapLocation' }
      },
      {
        path: 'lifeServices/travelGuide/plan-multi',
        component: () => import('@/views/lifeServices/travelGuide/plan-multi/index.vue'),
        meta: { title: '多景点串联规划', icon: 'MapLocation' }
      },
      {
        path: 'lifeServices/travelGuide/result',
        component: () => import('@/views/lifeServices/travelGuide/result/index.vue'),
        meta: { title: '攻略结果', icon: 'MapLocation' }
      },
      {
        path: 'lifeServices/oilPrice',
        component: () => import('@/views/lifeServices/oilPrice/index.vue'),
        meta: { title: '今日油价', icon: 'Coin' }
      },
      {
        path: 'lifeServices/weather',
        component: () => import('@/views/lifeServices/weather/index.vue'),
        meta: { title: '天气预报', icon: 'Sunny' }
      },
      {
        path: 'lifeServices/travelMemo',
        component: () => import('@/views/lifeServices/travelMemo/index.vue'),
        meta: { title: '出行备忘', icon: 'Memo' }
      },
      {
        path: 'lifeServices/taskAlchemist',
        component: () => import('@/views/lifeServices/taskAlchemist/index.vue'),
        meta: { title: '第二人生·任务炼金术士', icon: 'MagicStick' }
      },
      {
        path: 'lifeServices/eternalArchive',
        component: () => import('@/views/lifeServices/eternalArchive/index.vue'),
        meta: { title: '永恒档案', icon: 'FolderOpened' }
      },
      {
        path: 'lifeServices/recipeLab',
        component: () => import('@/views/lifeServices/recipeLab/index.vue'),
        meta: { title: '食验室 · 灵感灶', icon: 'Dish' }
      },
      // ==================== 家庭/教育 ====================
      {
        path: 'familyEducation',
        component: () => import('@/views/familyEducation/index.vue'),
        meta: { title: '家庭/教育', icon: 'School' }
      },
      {
        path: 'familyEducation/babySleep',
        component: () => import('@/views/familyEducation/babySleep/index.vue'),
        meta: { title: '宝宝哄睡', icon: 'Moon' }
      },
      {
        path: 'familyEducation/familyMeeting',
        component: () => import('@/views/familyEducation/familyMeeting/index.vue'),
        meta: { title: '家庭会议', icon: 'ChatDotRound', requiresAuth: true }
      },
      {
        path: 'familyEducation/members',
        component: () => import('@/views/familyEducation/members/index.vue'),
        meta: { title: '家庭成员管理', icon: 'UserFilled', requiresAuth: true }
      },
      {
        path: 'familyEducation/wishTreeHole',
        component: () => import('@/views/familyEducation/wishTreeHole/index.vue'),
        meta: { title: '愿望清单 & 家庭树洞', icon: 'MagicStick', requiresAuth: true }
      },
      // ==================== 技能学习 ====================
      {
        path: 'study',
        component: () => import('@/views/study/index.vue'),
        meta: { title: '技能学习', icon: 'Reading', requiresAuth: true }
      },
      {
        path: 'study/frontend-dev',
        component: () => import('@/views/study/frontendDev/index.vue'),
        meta: { title: '前端开发', icon: 'Monitor', requiresAuth: true }
      },
      {
        path: 'study/frontend-dev/map/:cat',
        component: () => import('@/views/study/frontendDev/map/index.vue'),
        meta: { title: '知识地图', icon: 'Monitor', requiresAuth: true }
      },
      {
        path: 'study/frontend-dev/quiz',
        component: () => import('@/views/study/frontendDev/quiz/index.vue'),
        meta: { title: '专项刷题', icon: 'EditPen', requiresAuth: true }
      },
      {
        path: 'study/frontend-dev/interview',
        component: () => import('@/views/study/frontendDev/interview/index.vue'),
        meta: { title: '面试模拟', icon: 'Aim', requiresAuth: true }
      },
      {
        path: 'study/frontend-dev/wrong',
        component: () => import('@/views/study/frontendDev/wrong/index.vue'),
        meta: { title: '错题本', icon: 'Warning', requiresAuth: true }
      },
      {
        path: 'study/frontend-dev/favorites',
        component: () => import('@/views/study/frontendDev/favorites/index.vue'),
        meta: { title: '收藏夹', icon: 'Star', requiresAuth: true }
      },
      {
        path: 'study/frontend-dev/skills',
        component: () => import('@/views/study/frontendDev/skills/index.vue'),
        meta: { title: '技能雷达', icon: 'TrendCharts', requiresAuth: true }
      },
      {
        path: 'study/frontend-dev/profile',
        component: () => import('@/views/study/frontendDev/profile/index.vue'),
        meta: { title: '学习中心', icon: 'User', requiresAuth: true }
      },
    ]
  },
  // ==================== 其他 ====================
  {
    path: '/other',
    name: 'Other',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: {
      title: '其他',
      icon: 'Grid'
    },
    children: [
      {
        path: '',
        name: 'OtherIndex',
        component: () => import('@/views/other/index.vue'),
        meta: {
          title: '其他',
          icon: 'Grid'
        }
      }
    ]
  },
  // ==================== 404 ====================
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/notFound/index.vue'),
    meta: {
      title: '404'
    }
  }
]

const router = createRouter({
  history: createWebHistory('/staticTool/'),
  routes
})

router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - ToolHub`
  }

  // 获取认证状态
  const token = localStorage.getItem('auth_token')
  const isAuthenticated = !!token

  // 已登录用户访问登录/注册页 → 重定向到首页
  if (to.meta.guest && isAuthenticated) {
    return next('/home')
  }

  // 需要认证的页面，未登录 → 重定向到登录页
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  next()
})

// 路由跳转 loading：点击卡片立即显示，给用户明确的「正在跳转」反馈
// 最小显示 300ms，避免快速跳转时 loading 一闪而过
const MIN_LOADING_DURATION = 300
let routeLoadingTimer = null
let loadingStartTime = 0

router.beforeEach((to, from) => {
  // 同一路径重复跳转（如点击当前页对应卡片）不触发 loading
  if (to.path === from.path) return

  // 中止上一个页面未完成的请求，避免请求堆积阻塞路由切换
  abortRouteRequests(from.path)
  // 更新当前路由，使新页面的请求绑定到 to.path（离开时统一清理）
  setCurrentRoute(to.path)

  clearTimeout(routeLoadingTimer)
  loadingStartTime = Date.now()
  store.dispatch('setLoading', true)
})

router.afterEach(() => {
  clearTimeout(routeLoadingTimer)
  routeLoadingTimer = null
  // 保证 loading 至少显示 MIN_LOADING_DURATION，避免快速跳转闪烁
  const elapsed = Date.now() - loadingStartTime
  const remain = Math.max(0, MIN_LOADING_DURATION - elapsed)
  routeLoadingTimer = setTimeout(() => {
    store.dispatch('setLoading', false)
  }, remain)
  // 导航成功，清除上一次失败的重试标记（下次失败可再次重试）
  sessionStorage.removeItem('__route_chunk_retry')
})

// 导航失败（如懒加载 chunk 下载失败）时兜底：关闭 loading，避免一直转圈
router.onError((error) => {
  clearTimeout(routeLoadingTimer)
  routeLoadingTimer = null
  store.dispatch('setLoading', false)

  // 动态 import 失败（chunk 加载失败）→ 自动刷新重试一次
  const msg = String(error?.message || error || '')
  if (/Failed to fetch dynamically imported module|dynamically imported module|Loading chunk|error loading dynamically imported module/i.test(msg)) {
    const key = '__route_chunk_retry'
    const retried = sessionStorage.getItem(key)
    if (!retried) {
      sessionStorage.setItem(key, '1')
      console.warn('[router] 页面模块加载失败，自动刷新重试...', msg)
      window.location.reload()
      return
    }
    // 已重试过仍失败，清标记并提示用户
    sessionStorage.removeItem(key)
    console.error('[router] 页面模块加载失败，重试后仍失败:', msg)
  }
})

export default router

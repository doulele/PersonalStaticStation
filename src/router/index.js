import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    component: () => import('@/components/layout/AppLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('@/views/home/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      /**股票基金start */
      {
        path: 'fund',
        component: () => import('@/views/home/fundStockTools/fundStockToolsList.vue'),
        meta: { title: '基金/股票', icon: 'DataLine' }
      },
      {
        path: 'fund/fund-search',
        component: () => import('@/views/home/fundStockTools/fundInformationSearch.vue'),
        meta: { title: '基金信息查询', icon: 'DataLine' }
      },
      {
        path: 'fund/fund-filter',
        component: () => import('@/views/home/fundStockTools/fundFilter/index.vue'),
        meta: { title: '基金筛选', icon: 'DataLine' }
      },
      {
        path: 'fund/stock-filter',
        component: () => import('@/views/home/fundStockTools/stockFilter/index.vue'),
        meta: { title: '妖股筛选', icon: 'DataLine' }
      },
      {
        path: 'fund/stock-detail',
        component: () => import('@/views/home/fundStockTools/stockFilter/stockDetail.vue'),
        meta: { title: '妖股详情', icon: 'DataLine' }
      },
      {
        path: 'fund/dadao-detail',
        component: () => import('@/views/home/fundStockTools/stockFilter/DaDaoQiXianDetail.vue'),
        meta: { title: '大道七线股诊', icon: 'DataLine' }
      },
      /**股票及基金end */
      /**彩票start */
      {
        path: 'lottery',
        component: () => import('@/views/home/lotteryTools/index.vue'),
        meta: { title: '双色球/大乐透分析', icon: 'Present' }
      },
      /**彩票end */
      /**音视频图像start */
      {
        path: 'audioVideoImagesTools',
        component: () => import('@/views/home/audioVideoImagesTools/index.vue'),
        meta: { title: '视频音频图像在线工具', icon: 'Present' }
      },
      {
        path: 'audioVideoImagesTools/novelOnline',
        component: () => import('@/views/home/audioVideoImagesTools/audioTools/novelOnline/index.vue'),
        meta: { title: '在线音频', icon: 'Present' }
      },
      {
        path: 'audioVideoImagesTools/vipVideoParse',
        component: () => import('@/views/home/audioVideoImagesTools/videoToolls/vipVideoParse/index.vue'),
        meta: { title: '在线视频', icon: 'Present' }
      },
      {
        path: 'audioVideoImagesTools/imageTools',
        component: () => import('@/views/home/audioVideoImagesTools/imageTools/index.vue'),
        meta: { title: '图片处理', icon: 'Picture' }
      },
      /**音视频图像end */
      /**生活服务start */
      {
        path: 'lifeServices',
        component: () => import('@/views/home/lifeServices/index.vue'),
        meta: { title: '生活服务', icon: 'Service' }
      },
      {
        path: 'lifeServices/travelGuide',
        component: () => import('@/views/home/lifeServices/travelGuide/index.vue'),
        meta: { title: '旅游攻略', icon: 'MapLocation' }
      },
      {
        path: 'lifeServices/travelGuide/plan/:id',
        component: () => import('@/views/home/lifeServices/travelGuide/plan/index.vue'),
        meta: { title: '规划行程', icon: 'MapLocation' }
      },
      {
        path: 'lifeServices/travelGuide/plan-multi',
        component: () => import('@/views/home/lifeServices/travelGuide/plan-multi/index.vue'),
        meta: { title: '多景点串联规划', icon: 'MapLocation' }
      },
      {
        path: 'lifeServices/travelGuide/result',
        component: () => import('@/views/home/lifeServices/travelGuide/result/index.vue'),
        meta: { title: '攻略结果', icon: 'MapLocation' }
      },
      {
        path: 'lifeServices/oilPrice',
        component: () => import('@/views/home/lifeServices/oilPrice/index.vue'),
        meta: { title: '今日油价', icon: 'Coin' }
      },
      {
        path: 'lifeServices/travelMemo',
        component: () => import('@/views/home/lifeServices/travelMemo/index.vue'),
        meta: { title: '出行备忘', icon: 'Memo' }
      },
      /**生活服务end */
    ]
  },
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
  if (to.meta.title) {
    document.title = `${to.meta.title} - ToolHub`
  }
  next()
})

export default router

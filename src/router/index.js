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
      // stock-search 路由已移除（对应文件已删除）
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
        path: 'lottery',
        component: () => import('@/views/home/lotteryTools/index.vue'),
        meta: { title: '双色球/大乐透分析', icon: 'Present' }
      }
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

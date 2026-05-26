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
        component: () => import('@/views/home/fundTools/fundToolsList.vue'),
        meta: { title: '基金/股票', icon: 'DataLine' }
      },
      {
        path: 'fund/fund-search',
        component: () => import('@/views/home/fundTools/fundInformationSearch.vue'),
        meta: { title: '基金信息查询', icon: 'DataLine' }
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

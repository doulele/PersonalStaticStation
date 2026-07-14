/**
 * 工具注册表 —— 集中管理所有工具页面的元数据
 *
 * 字段说明：
 *   id       - 唯一标识
 *   name     - 工具名称
 *   desc     - 简短描述
 *   category - 所属分类 id: fund | media | life
 *   path     - 路由路径
 *   icon     - Element Plus 图标名称（字符串，需在使用处映射为组件）
 *   color    - 图标卡片颜色主题: default | blue | green | orange | purple | red | yellow
 */

export const TOOL_CATEGORIES = [
  {
    id: 'fund',
    name: '基金/股票',
    icon: 'DataLine',
    path: '/home/fund',
    desc: '基金查询、股票筛选与投资分析'
  },
  {
    id: 'media',
    name: '影音图像',
    icon: 'VideoCamera',
    path: '/home/audioVideoImagesTools',
    desc: '视频解析、在线音频、图片处理'
  },
  {
    id: 'life',
    name: '生活服务',
    icon: 'Service',
    path: '/home/lifeServices',
    desc: '天气、油价、旅游攻略、出行备忘等生活助手'
  },
  {
    id: 'family',
    name: '家庭/教育',
    icon: 'School',
    path: '/home/familyEducation',
    desc: '宝宝哄睡、育儿工具与教育资源'
  }
]

export const ALL_TOOLS = [
  // ========== 基金/股票 ==========
  {
    id: 'fund-search',
    name: '基金信息查询',
    desc: '实时查询基金净值、涨跌幅与历史走势',
    category: 'fund',
    path: '/home/fund/fund-search',
    icon: 'DataLine',
    color: 'default'
  },
  {
    id: 'fund-filter',
    name: '基金筛选',
    desc: '按业绩、规模、费率多维度筛选优质基金',
    category: 'fund',
    path: '/home/fund/fund-filter',
    icon: 'Filter',
    color: 'purple'
  },
  {
    id: 'stock-filter',
    name: '妖股筛选',
    desc: '多因子量化筛选潜力标的，实时行情评估',
    category: 'fund',
    path: '/home/fund/stock-filter',
    icon: 'TrendCharts',
    color: 'green'
  },
  // 注意：以下两个是详情页，不在首页热门工具展示，不参与点击统计
  // stock-detail: 妖股详情 (/home/fund/stock-detail)
  // dadao-detail: 大道七线股诊 (/home/fund/dadao-detail)

  // ========== 影音图像 ==========
  {
    id: 'vip-video',
    name: 'VIP视频解析',
    desc: '免费观看全网VIP视频，多线路解析',
    category: 'media',
    path: '/home/audioVideoImagesTools/vipVideoParse',
    icon: 'VideoPlay',
    color: 'default'
  },
  {
    id: 'online-audio',
    name: '在线音频',
    desc: '海量书籍小说在线搜索与收听',
    category: 'media',
    path: '/home/audioVideoImagesTools/novelOnline',
    icon: 'Headset',
    color: 'purple'
  },
  {
    id: 'image-tools',
    name: '图片处理',
    desc: '图片裁剪、压缩、格式转换一站式处理',
    category: 'media',
    path: '/home/audioVideoImagesTools/imageTools',
    icon: 'Picture',
    color: 'blue'
  },

  // ========== 生活服务（含双色球/大乐透分析） ==========
  {
    id: 'lottery',
    name: '双色球/大乐透分析',
    desc: '历史开奖数据智能分析，辅助选号参考',
    category: 'life',
    path: '/home/lifeServices/lottery',
    icon: 'Present',
    color: 'yellow'
  },
  {
    id: 'travel-guide',
    name: '旅游攻略',
    desc: '热门目的地攻略 + 智能行程规划',
    category: 'life',
    path: '/home/lifeServices/travelGuide',
    icon: 'MapLocation',
    color: 'default'
  },
  {
    id: 'oil-price',
    name: '今日油价',
    desc: '全国各省市实时油价一键查询',
    category: 'life',
    path: '/home/lifeServices/oilPrice',
    icon: 'Coin',
    color: 'green'
  },
  {
    id: 'weather',
    name: '天气预报',
    desc: '全国城市实时天气与多日预报查询',
    category: 'life',
    path: '/home/lifeServices/weather',
    icon: 'Sunny',
    color: 'blue'
  },
  {
    id: 'travel-memo',
    name: '出行备忘',
    desc: '出行物品清单管理，打包不遗漏',
    category: 'life',
    path: '/home/lifeServices/travelMemo',
    icon: 'Memo',
    color: 'orange'
  },

  // ========== 家庭/教育 ==========
  {
    id: 'baby-sleep',
    name: '宝宝哄睡',
    desc: '白噪音、摇篮曲、自然音效，帮助宝宝安心入睡',
    category: 'family',
    path: '/home/familyEducation/babySleep',
    icon: 'Moon',
    color: 'purple'
  },
  {
    id: 'family-meeting',
    name: '家庭会议',
    desc: '私密安全的家庭会议：议题收集、语音转写、记忆墙与决策追踪',
    category: 'family',
    path: '/home/familyEducation/familyMeeting',
    icon: 'ChatDotRound',
    color: 'green'
  }
]

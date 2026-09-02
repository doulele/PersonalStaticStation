/**
 * 工具注册表 —— 集中管理所有工具页面的元数据
 *
 * 字段说明：
 *   id       - 唯一标识
 *   name     - 工具名称
 *   desc     - 简短描述
 *   category - 所属分类 id: fund | media | life | family
 *   path     - 路由路径
 *   icon     - Element Plus 图标名称（字符串，需在使用处映射为组件）
 *   color    - 图标卡片颜色主题: default | blue | green | orange | purple | red | yellow
 */

export const TOOL_CATEGORIES = [
  {
    id: 'fund',
    name: '基金/股票',
    icon: 'DataLine',
    path: '/fund',
    desc: '基金查询、股票筛选与投资分析'
  },
  {
    id: 'media',
    name: '影音图像',
    icon: 'VideoCamera',
    path: '/mediaTools',
    desc: '视频解析、在线音频、图片处理'
  },
  {
    id: 'life',
    name: '生活服务',
    icon: 'Service',
    path: '/lifeServices',
    desc: '天气、油价、彩票分析、旅游攻略、出行备忘等生活助手'
  },
  {
    id: 'family',
    name: '家庭/教育',
    icon: 'School',
    path: '/familyEducation',
    desc: '宝宝哄睡、育儿工具与教育资源'
  },
  {
    id: 'news',
    name: '信息工作台',
    icon: 'News',
    path: '/hotstation',
    desc: 'AI 驱动的信息策展与二次创作辅助'
  },
  {
    id: 'study',
    name: '技能学习',
    icon: 'Reading',
    path: '/study',
    desc: '前端开发等技能学习与练习'
  }
]

export const ALL_TOOLS = [
  // ========== 基金/股票 ==========
  {
    id: 'fund-search',
    name: '基金信息查询',
    desc: '实时查询基金净值、涨跌幅与历史走势',
    category: 'fund',
    path: '/fund/fund-search',
    icon: 'DataLine',
    color: 'default'
  },
  {
    id: 'fund-filter',
    name: '基金筛选',
    desc: '按业绩、规模、费率多维度筛选优质基金',
    category: 'fund',
    path: '/fund/fund-filter',
    icon: 'Filter',
    color: 'purple'
  },
  {
    id: 'stock-filter',
    name: '股票筛选',
    desc: '多因子量化筛选潜力标的，实时行情评估',
    category: 'fund',
    path: '/fund/stock-filter',
    icon: 'TrendCharts',
    color: 'green'
  },
  {
    id: 'national-team',
    name: '跟党走·国家队动向',
    desc: '监测宽基ETF份额变化，倒推国家队进出场时机',
    category: 'fund',
    path: '/fund/national-team',
    icon: 'Flag',
    color: 'red'
  },
  // 注意：以下两个是详情页，不在首页热门工具展示，不参与点击统计
  // stock-detail: 妖股详情 (/fund/stock-detail)
  // dadao-detail: 大道七线股诊 (/fund/dadao-detail)

  // ========== 信息策展与二创工作台 ==========
  {
    id: 'hotstation',
    name: '信息策展与二创工作台',
    desc: 'AI 信息策展与二创：热点追踪、事实核实、一键生成文章/脚本',
    category: 'news',
    path: '/hotstation/curation',
    icon: 'News',
    color: 'yellow'
  },
  // 注意：以下两个是子页面，不在首页热门工具展示
  // hotstation-event: 事件详情 (/hotstation/curation/event/:id)
  // hotstation-admin: 管理后台 (/hotstation/curation/admin)

  // ========== 影音图像 ==========
  {
    id: 'vip-video',
    name: 'VIP视频解析',
    desc: '免费观看全网VIP视频，多线路解析',
    category: 'media',
    path: '/mediaTools/vipVideoParse',
    icon: 'VideoPlay',
    color: 'default'
  },
  {
    id: 'online-audio',
    name: '在线音频',
    desc: '海量书籍小说在线搜索与收听',
    category: 'media',
    path: '/mediaTools/novelOnline',
    icon: 'Headset',
    color: 'purple'
  },
  {
    id: 'image-tools',
    name: '图片处理',
    desc: '图片裁剪、压缩、格式转换一站式处理',
    category: 'media',
    path: '/mediaTools/imageTools',
    icon: 'Picture',
    color: 'blue'
  },

  // ========== 生活服务（含双色球/大乐透分析） ==========
  {
    id: 'lottery',
    name: '双色球/大乐透分析',
    desc: '历史开奖数据智能分析，辅助选号参考',
    category: 'life',
    path: '/lifeServices/lottery',
    icon: 'Present',
    color: 'yellow'
  },
  {
    id: 'travel-guide',
    name: '旅游攻略',
    desc: '热门目的地攻略 + 智能行程规划',
    category: 'life',
    path: '/lifeServices/travelGuide',
    icon: 'MapLocation',
    color: 'default'
  },
  {
    id: 'oil-price',
    name: '今日油价',
    desc: '全国各省市实时油价一键查询',
    category: 'life',
    path: '/lifeServices/oilPrice',
    icon: 'Coin',
    color: 'green'
  },
  {
    id: 'weather',
    name: '天气预报',
    desc: '全国城市实时天气与多日预报查询',
    category: 'life',
    path: '/lifeServices/weather',
    icon: 'Sunny',
    color: 'blue'
  },
  {
    id: 'travel-memo',
    name: '出行备忘',
    desc: '出行物品清单管理，打包不遗漏',
    category: 'life',
    path: '/lifeServices/travelMemo',
    icon: 'Memo',
    color: 'orange'
  },
  {
    id: 'task-alchemist',
    name: '第二人生·任务炼金术士',
    desc: '精力标签化任务管理、心流专注、时间税防拖延、AI伙伴陪伴成长',
    category: 'life',
    path: '/lifeServices/taskAlchemist',
    icon: 'MagicStick',
    color: 'yellow'
  },
  {
    id: 'eternal-archive',
    name: '永恒档案',
    desc: '个人重要文档保险库，智能分类、版本管理、安全分享、全文检索',
    category: 'life',
    path: '/lifeServices/eternalArchive',
    icon: 'FolderOpened',
    color: 'green'
  },
  {
    id: 'recipe-lab',
    name: '食验室 · 灵感灶',
    desc: '输入食材智能推荐菜谱，命运之勺随机抽选，解决今天吃什么',
    category: 'life',
    path: '/lifeServices/recipeLab',
    icon: 'Dish',
    color: 'red'
  },

  // ========== 家庭/教育 ==========
  {
    id: 'baby-sleep',
    name: '宝宝哄睡',
    desc: '白噪音、摇篮曲、自然音效，帮助宝宝安心入睡',
    category: 'family',
    path: '/familyEducation/babySleep',
    icon: 'Moon',
    color: 'purple'
  },
  {
    id: 'family-meeting',
    name: '家庭会议',
    desc: '私密安全的家庭会议：议题收集、语音转写、记忆墙与决策追踪',
    category: 'family',
    path: '/familyEducation/familyMeeting',
    icon: 'ChatDotRound',
    color: 'green'
  },
  {
    id: 'family-members',
    name: '家庭成员管理',
    desc: '管理家庭成员信息、角色权限与邀请码',
    category: 'family',
    path: '/familyEducation/members',
    icon: 'UserFilled',
    color: 'blue'
  },

  // ========== 技能学习 ==========
  {
    id: 'frontend-dev',
    name: '前端开发',
    desc: '前端开发技能学习、知识沉淀与练习（内容建设中）',
    category: 'study',
    path: '/study/frontend-dev',
    icon: 'Monitor',
    color: 'blue'
  }
]

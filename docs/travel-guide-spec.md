# 旅游攻略规划工具 - 完整功能规格文档

> ⚠️ 本文档是 AI 辅助生成的项目规格，记录所有讨论确认的功能点。
> 每次修改代码前后都应参考本文档，防止遗漏。
> 最后更新：2026-06-27

---

## 📋 目录

1. [项目概述](#项目概述)
2. [Phase 1 - 核心时间线 & 地图增强](#phase-1---核心时间线--地图增强)
3. [Phase 2 - 多天行程 & 基础增强](#phase-2---多天行程--基础增强)
4. [Phase 3 - 打卡动态调整 & 分享导出](#phase-3---打卡动态调整--分享导出)
5. [Phase 4 - AI 深度优化 & 数据沉淀](#phase-4---ai-深度优化--数据沉淀)
6. [外部攻略整合方案](#外部攻略整合方案)
7. [数据模型](#数据模型)
8. [后端接口清单](#后端接口清单)
9. [前端文件改动清单](#前端文件改动清单)
10. [已确认的技术决策](#已确认的技术决策)

---

## 项目概述

**路径**：
- 前端：`f:\personal\个人网站项目\PersonalStaticStation`
- 后端：`f:\personal\个人网站项目\node\PersonalStaticStationBacend`

**核心定位**：一个智能旅游攻略规划工具，帮用户生成"酒店→景点→美食→景点→美食→酒店"的完整一日/多日时间线。

**当前状态**：选择组件（RoutePanel/FoodPanel/HotelPanel）可用，但三者独立运作，没有统一时间线。result 页是静态时间线展示，不支持排序和动态调整。

---

## Phase 1 - 核心时间线 & 地图增强

### 1.1 统一时间线数据模型

**目标**：替代当前分散的 `selectedSpotIds` / `selectedFoodIds` / `selectedHotelId`。

**数据结构**：
```js
timelineNodes: [
  { id: 'day_header_1', type: 'day_header', day: 1, title: '第一天' },
  { id: 'hotel_start', type: 'hotel', day: 1, role: 'start', 
    data: { name, lng, lat, address }, startTime: '08:00', endTime: '08:00' },
  { id: 'spot_1', type: 'spot', day: 1, order: 1, 
    data: { name, lng, lat, price, stayDuration: 90 }, 
    startTime: '08:30', endTime: '10:00' },
  { id: 'food_1', type: 'food', day: 1, order: 2, 
    data: { name, lng, lat, avgPrice }, mealType: 'lunch',
    startTime: '11:45', endTime: '12:45' },
  { id: 'spot_2', type: 'spot', day: 1, order: 3, ... },
  { id: 'food_2', type: 'food', day: 1, order: 4, mealType: 'dinner', ... },
  { id: 'hotel_end', type: 'hotel', day: 1, role: 'end', ... },
]
```

### 1.2 智能时间规划算法（后端实现）

```
输入：有序节点列表 + 出发时间（默认 8:00）
流程：
  1. currentTime = 出发时间
  2. 遍历每个节点：
     a. hotel(start)：跳过，不计时间
     b. spot：startTime=currentTime, endTime=currentTime+stayDuration
        currentTime += stayDuration + 交通缓冲(默认15min)
     c. food：判断 currentTime 是否在合理用餐时段
        - 午餐窗口 11:00-13:30
        - 晚餐窗口 17:00-19:30
        - 如果偏差太大，给出"该吃饭了"标记
        currentTime += 用餐时长(60min) + 缓冲
     d. hotel(end)：currentTime 即为到达时间
  3. 如果超出入住时间（>21:00），给出警告
```

### 1.3 Plan 页面改造

- 保留 RoutePanel / FoodPanel / HotelPanel 三个独立面板（用于初选）
- **新增**第四个面板：「行程总览」统一时间线面板
- 支持拖拽排序（vuedraggable），景点/美食可穿插排列
- 显示实时预估时间

### 1.4 Result 页面改造 - 左右分栏布局

```
┌─────────────────────────────────────────────────────┐
│  [← 返回]  标题  [基础|AI]  [Day选择]               │
├────────────────────┬────────────────────────────────┤
│                    │  📋 行程时间线                  │
│    🗺️ 路线地图     │                                │
│                    │  🏨 08:00 出发                 │
│   · 节点连线       │    ↕ 步行5分钟 (800m)          │
│   · 序号标记①②③   │  📍 08:30-10:00 午门 (30分钟)  │
│   · 进度着色       │    ✓ 已打卡                    │
│   · 信息窗         │    ↕ 步行3分钟                 │
│   · 按天切换       │  📍 10:15-11:15 太和殿 (60分钟)│
│                    │    ...                         │
│   · 交通方式标注   │                                │
│                    │  🏨 20:00 返回酒店             │
├────────────────────┴────────────────────────────────┤
│  [🔄 重新规划]  [💾 保存]  [📤 导出]               │
└─────────────────────────────────────────────────────┘
```

### 1.5 地图增强（MapView.vue）

| 功能 | 说明 |
|------|------|
| 全节点连线 | 酒店→景点→美食→...按时间线画 polyline |
| 序号标记 | marker 显示 ①②③ 序号 |
| 信息窗口 | 点击弹出：名称、时间、停留时长、票价 |
| 进度着色 | 已打卡=绿、进行中=蓝闪、未开始=灰、忽略=删除线 |
| 交通方式 | 节点间标注步行/驾车距离和时间 |

### 1.6 Store 改动（plan.js）

新增 state：
- `timelineNodes` - 统一时间线
- `totalDays` - 总天数
- `currentDay` - 当前查看的天数

新增 mutation：
- `SET_TIMELINE_NODES` / `UPDATE_TIMELINE_ORDER` / `REMOVE_TIMELINE_NODE`
- `SET_CURRENT_DAY`

新增 action：
- `generateTimeline()` - 调后端生成时间线
- `reorderTimeline(nodes)` - 排序后重新计算时间

### 1.7 基础推荐 vs AI 推荐

- **基础推荐**：前端本地贪心排序（酒店→最近景点→判断午饭→美食→下午景点→晚饭→酒店），调后端计算时间
- **AI 推荐**：发送完整数据给 DeepSeek，AI 返回优化排序+时长建议+用餐建议

---

## Phase 2 - 多天行程 & 基础增强

### 2.1 多天行程支持

- Plan 页面顶部新增**天数选择器**（步进器，默认 1 天）
- 后端根据天数 + 总停留时长自动分配每天内容
- 算法：每天有效游玩时间 ~660分钟（8:00-19:00 扣除用餐），按此计算所需天数
- 时间线数据 model 中每个节点加 `day` 字段
- Result 页支持按天切换（tab 或下拉）

### 2.2 酒店跨天处理

- Day N 的终点酒店自动成为 Day N+1 的起点酒店
- 用户也可以选择每天换酒店

### 2.3 天气联动

- 选择出发日期 → 调高德天气 API 获取预报
- 行程总览面板顶部显示每日天气
- 雨天自动建议调整户外景点或带伞
- AI 推荐中加入天气因素

**后端接口**：`POST /travel/plan-weather`

### 2.4 预算管理

- 行程总览面板底部实时预算统计：
  - 🎫 景点门票合计
  - 🍽️ 美食合计
  - 🏨 住宿合计
  - 🚗 交通预估
  - 💰 总预算 / 👥 人均（支持设置人数）
- 选中/移除节点时实时刷新

### 2.5 交通方式规划

- 节点间调用高德路径规划 API：
  - 步行（< 1km）
  - 公交（1-5km）
  - 地铁（2-10km）
  - 驾车（3-20km）
- 时间线显示：交通方式 + 距离 + 预估时间 + 费用

**后端接口**：`POST /travel/route-distance`

### 2.6 离线缓存

- 生成攻略后自动缓存到 localStorage
- 断网时显示缓存数据 + 📡离线模式提示
- PWA Service Worker 可选

### 2.7 行程备注

- 每个时间线节点支持添加自由文本备注
- 备注存储在 localStorage（不必须保存到后端）

---

## Phase 3 - 打卡动态调整 & 分享导出

### 3.1 打卡自动调整

```
触发：用户在 result 页打卡或忽略某个节点
流程：
  1. 计算实际时间 vs 计划时间的偏差
  2. 偏差 > 30分钟的阈值 → 弹出提醒
  3. 用户确认后 → 调后端重新规划剩余行程
  4. 可能的调整：
     - 压缩后续景点的停留时间
     - 建议跳过优先级低的景点
     - 推迟用餐时间并提醒
     - 推荐附近快餐代替原定餐厅
```

**后端接口**：`POST /travel/plan-adjust`

### 3.2 用户节奏学习

长期数据积累：
- 记录用户实际停留 vs 计划停留的偏差
- 后续规划自动给景点 × buffer 系数
- 存储：localStorage → 后续可迁移到后端用户表

### 3.3 导出分享

| 方式 | 实现 |
|------|------|
| 复制文字 | 一键复制纯文本行程到剪贴板 |
| 生成图片 | html2canvas 截取 → 保存 |
| 导出 PDF | jspdf 生成 A4 PDF |

### 3.4 备选方案推荐

- 每个大热门景点/美食 AI 生成 1-2 个备选
- 打卡页显示备选入口
- 遇到排队/闭馆等意外可一键切换

### 3.5 轻型用户身份标识

**背景**：P1/P2 阶段所有数据存 localStorage。P3 引入用户体系以支持跨设备同步和行程持久化。

**方案（轻型）**：昵称 + 4位PIN，零注册流程

```
后端新增依赖：better-sqlite3（纯JS，无需安装数据库服务）
数据库文件：data/travel_guide.db

API：
  POST /user/identify     { nickname, pin } → token
  GET  /user/plans        获取所有行程
  POST /user/plans        保存行程
  DELETE /user/plans/:id  删除行程
  GET  /user/preferences  用户偏好

SQLite 表：
  user_identity    — 昵称hash + PIN bcrypt hash
  travel_plans     — timeline_nodes JSON + 状态
  user_preferences — 偏好权重、停留修正系数、预算级别
```

**安全边界**：PIN 仅用于防止他人误操作，不是正式密码。bcrypt 10轮哈希存储。token 7天过期。

---

## Phase 4 - AI 深度优化 & 数据沉淀

### 4.1 行程历史 & 复盘

「我的旅行」历史列表：
- 每次完成的行程可保存
- 打卡率 / 实际用时 vs 计划 / 景点评分
- 支持写游记
- 数据反哺 AI 推荐

### 4.2 偏好学习

- 基于历史选择学习用户的：
  - 偏好的景点类型（人文/自然/网红）
  - 偏好的美食口味/价位
  - 偏好的酒店档次
- 后续推荐自动加权

### 4.3 行李/准备清单

- AI 根据目的地、天气、景点类型生成推荐清单
- 用户可勾选/自定义

---

## 外部攻略整合方案

### 安全原则

> ⚠️ 所有外部内容获取必须在后端进行，前端不直接请求第三方。

### 实现策略

**方案一（推荐）：后端代理 + 内容清洗**
```
前端 → 后端 /travel/fetch-guide → 后端请求第三方 → 清洗 HTML → 返回纯文本摘要
安全措施：
  1. 所有请求走后端，隐藏真实请求来源
  2. 频率限制（同一 IP 每分钟最多 N 次）
  3. 内容过滤（过滤 JS/iframe/外链等 XSS 风险）
  4. 只提取文本类攻略信息，不执行任何脚本
  5. 缓存结果（相同查询 1 小时内复用）
```

**方案二：用户自行粘贴**
```
提供一个"粘贴攻略链接"输入框
→ 用户粘贴小红书/马蜂窝链接
→ 后端解析 + 清洗
→ 提取关键信息（景点名、时间建议、注意事项）
→ 填充到对应节点的备注中
```

### 数据字段

提取后填入节点备注：
```
📍 太和殿（来自小红书攻略）
  📝 建议早上9点前到，排队少
  📝 东侧角落拍照最好看
  📝 旁边有文创店可以盖章
```

---

## 数据模型

### timelineNodes（核心）

```ts
interface TimelineNode {
  id: string                    // 唯一标识
  type: 'day_header' | 'hotel' | 'spot' | 'food' | 'transport'
  day: number                   // 第几天（从1开始）
  order: number                 // 当天内排序
  
  // 酒店
  role?: 'start' | 'end'
  
  // 美食
  mealType?: 'lunch' | 'dinner' | 'snack'
  
  // 通用
  data: {
    name: string
    lng: number
    lat: number
    address?: string
    image?: string
    // 景点
    price?: number
    stayDuration?: number        // 分钟
    stayDurationAI?: number      // AI 建议时长
    // 美食
    avgPrice?: number
    // 酒店
    starRating?: number
    checkInTime?: string
  }
  
  // 时间规划（后端计算填充）
  startTime?: string             // '08:30'
  endTime?: string               // '10:00'
  
  // 状态（result 页）
  state?: 'pending' | 'checked' | 'ignored'
  actualStartTime?: string
  actualEndTime?: string
  
  // 用户备注
  notes?: string
  guideNotes?: string[]          // 外部攻略提取的备注
  
  // 备选
  alternatives?: {
    id: string
    name: string
    reason: string
  }[]
  
  // 交通（到下一个节点的距离）
  transportToNext?: {
    mode: 'walk' | 'bus' | 'metro' | 'drive'
    distance: number             // 米
    duration: number             // 分钟
    cost: number                 // 元
  }
}
```

---

## 后端接口清单

| 序号 | 接口 | 方法 | Phase | 说明 |
|------|------|------|-------|------|
| 1 | `/travel/plan-timeline` | POST | P1 | 生成统一时间线（接收节点+天数，返回含时间的 timelineNodes） |
| 2 | `/travel/ai-recommend` | POST | P1 | AI 推荐排序+时长+用餐建议（增强现有接口） |
| 3 | `/travel/plan-multi` | POST | P1 | 多景点串联规划（增强现有接口，支持多天） |
| 4 | `/travel/route-distance` | POST | P1 | 两坐标间交通方式+距离+时间（调高德 API） |
| 5 | `/travel/plan-weather` | POST | P2 | 获取指定日期+坐标的天气预报 |
| 6 | `/travel/plan-adjust` | POST | P3 | 打卡后动态调整剩余行程 |
| 7 | `/travel/plan-save` | POST | P3 | 保存行程到用户历史 |
| 8 | `/travel/plan-history` | GET | P4 | 获取用户历史行程列表 |
| 9 | `/travel/fetch-guide` | POST | P3 | 外部攻略内容获取（后端代理+清洗） |
| 10 | `/user/identify` | POST | P3 | 昵称+PIN 身份标识，返回 token |
| 11 | `/user/plans` | GET/POST/DELETE | P3 | 行程的增删查 |
| 12 | `/user/preferences` | GET/POST | P4 | 用户偏好读写 |

---

## 前端文件改动清单

| 文件 | Phase | 改动内容 |
|------|-------|---------|
| `store/modules/plan.js` | P1 | 新增 timelineNodes 状态体系、重写 recommend actions、新增 timeline mutations/actions |
| `plan/index.vue` | P1 | 新增天数选择器 + 行程总览面板（统一拖拽） |
| `plan/components/RoutePanel.vue` | P1 | 微调，选中数据同步到 timelineNodes |
| `plan/components/FoodPanel.vue` | P1 | 微调，选中数据同步到 timelineNodes |
| `plan/components/HotelPanel.vue` | P1 | 微调，选中数据同步到 timelineNodes |
| `plan/components/MapView.vue` | P1 | 增强：信息窗口、进度着色、序号标记、交通连线 |
| `result/index.vue` | P1 | **大改**：左右分栏、拖拽排序、打卡逻辑、时间显示增强、重新计算按钮 | ✅ 完成 |
| `result/index.vue` | P2 | 天气展示、预算面板、备注功能、天切换 | ⏳ |
| `result/index.vue` | P3 | 打卡触发调整弹窗、导出按钮、备选方案入口 | ⏳ |
| **新增** `plan/components/TimelinePanel.vue` | P1 | 行程总览面板（统一拖拽排序） | ✅ 完成 |
| **新增** `result/components/ResultMapView.vue` | P1 | 结果页增强地图（序号标记+进度着色+信息窗+全节点连线） | ✅ 完成 |
| **新增** `result/components/ExportDialog.vue` | P3 | 导出弹窗（复制/图片/PDF） | ⏳ |
| **新增** `result/components/BudgetOverview.vue` | P2 | 预算概览组件 |
| **新增** `components/WeatherBar.vue` | P2 | 天气信息条 |
| **新增** `views/history/` | P4 | 行程历史页面 |
| `mock/data.js` | P1 | 移除硬编码的时间逻辑，改为调后端 |
| **后端新增** `routes/user.js` | P3 | 用户身份标识 + 行程 CRUD |
| **后端新增** `data/` 目录 | P3 | SQLite 数据库文件存储 |
| **后端新增** 依赖 `better-sqlite3` | P3 | SQLite 驱动（零配置） |

---

## 已确认的技术决策

| 决策 | 结论 | 原因 |
|------|------|------|
| 时间规划算法位置 | **后端** | 统一计算，前端只展示 |
| Plan 页面面板布局 | **保留三个独立面板 + 新增总览面板** | 初选和排序分离，体验更好 |
| Result 页排序行为 | **排序后自动重算时间** | 所见即所得 |
| 行程天数 | **支持单天和多天** | 覆盖短途和长途 |
| 同行人协作 | **不做** | 个人项目，太重 |
| 外部攻略整合 | **后端代理 + 清洗** | 安全防风险 |
| 离线缓存 | **localStorage + PWA 可选** | 成本低收益高 |
| AI 推荐 | **后端 DeepSeek** | 已接入，需增强 |
| 用户体系 | **渐进式：P1/P2 用 localStorage → P3 引入轻型身份标识（昵称+PIN + SQLite）** | MVP 先不搞用户系统，Phase 3 再加 |

---

## 📊 进度总览

| Phase | 状态 | 完成日期 |
|-------|------|----------|
| **P1** - 核心时间线 & 地图增强 | ✅ **已完成** | 2026-06-27 |
| **P2** - 多天行程 & 基础增强 | ✅ **已完成** | 2026-06-27 |
| **P3** - 打卡动态调整 & 分享导出 | ✅ **已完成** | 2026-06-27 |
| **P4** - AI 深度优化 & 数据沉淀 | ✅ **已完成** | 2026-06-27 |

### P1 完成内容清单
- ✅ 后端 `POST /travel/plan-timeline` 时间规划引擎
- ✅ AI 推荐提示词增强
- ✅ Store 新增 `timelineNodes` 状态体系
- ✅ `generatePlan` action 改造
- ✅ 新增 `TimelinePanel.vue`
- ✅ `plan/index.vue` 集成 TimelinePanel
- ✅ `result/index.vue` 重大重构：左右分栏+拖拽排序+交通过渡+用餐提醒
- ✅ 新增 `ResultMapView.vue`
- ✅ 响应式适配
- ✅ 打卡状态 localStorage 持久化
- ✅ `POST /travel/plan-multi` 多景点串联规划

### P2 完成内容清单
- ✅ 多天行程支持：`plan/index.vue` 天数选择器 (1-7天)
- ✅ 后端 `plan-timeline` 自动按天分配景点/美食
- ✅ 酒店跨天自动继承
- ✅ `POST /travel/plan-weather` 天气查询（高德API+缓存）
- ✅ `WeatherBar.vue` 天气信息条组件（含预报+雨天提醒）
- ✅ `BudgetOverview.vue` 预算概览组件（门票/美食/交通/总预算/人均）
- ✅ 人数设置（影响人均预算计算）
- ✅ `POST /travel/route-distance` 交通方式规划（高德路径+降级估算）
- ✅ 离线缓存：`cachePlanOffline`/`loadOfflineCache` localStorage 持久化
- ✅ 行程备注：每节点可编辑自由文本备注，存储到 localStorage

### P3 完成内容清单
- ✅ `POST /travel/plan-adjust` 打卡后动态调整（压缩时长/跳过建议/用餐提醒）
- ✅ `AdjustDialog.vue` 调整弹窗组件
- ✅ 打卡偏差检测：偏差>30分钟自动弹出调整建议
- ✅ `ExportDialog.vue` 导出弹窗（复制文字/生成图片/导出PDF）
- ✅ 复制文字：纯文本格式完整行程
- ✅ 保存行程：`POST /travel/plan-save` 文件存储+`/user/plans` CRUD
- ✅ `POST /travel/fetch-guide` 外部攻略获取（后端代理+清洗+频率限制）
- ✅ `POST /user/identify` 轻型用户身份标识（昵称+4位PIN）
- ✅ `routes/user.js` 用户路由（身份/行程CRUD/偏好）
- ✅ 前台 `identifyUser` action + localStorage 持久化

### P4 完成内容清单
- ✅ `GET /travel/plan-history` 行程历史列表
- ✅ `GET/POST /user/preferences` 用户偏好（景点类型/预算/美食口味/停留修正系数）
- ✅ Store `userPreferences` + 自动同步后端
- ✅ `generateLuggageChecklist` 行李清单自动生成（根据天气/温度智能推荐）
- ✅ 行李清单可勾选交互
- ✅ 用户偏好本地+后端双存储

---

## ⚠️ AI 助手备忘

> 这是给 AI 编码助手看的备忘录：
>
> 1. **Phase 1 是当前最优先的工作**，其他 Phase 的代码不要提前写
> 2. 改代码前先读此文档确认范围
> 3. 所有时间计算逻辑放后端 `PersonalStaticStationBacend`
> 4. 前端 `mock/data.js` 的 `generatePlan` 需要逐步废弃
> 5. 新增组件统一放在 `travelGuide/` 对应子目录下
> 6. 每次修改完代码后，更新本文档的进度状态

/**
 * 旅游攻略 Mock 数据
 * 包含「故宫博物院」和「上海迪士尼乐园」两套完整数据
 */

// ==================== 主景点（全国 Top 20 热门目的地）====================
export const attractions = [
  { id: 1,  name: '故宫博物院',         lat: 39.9163, lng: 116.3972, region: '华北', province: '北京', category: '人文历史', emoji: '🏯', desc: '世界五大宫之首，明清皇家宫殿，六百年历史的文化瑰宝', level: '5A', features: ['人文历史', '皇家建筑'], cost: '¥60', rating: '4.8' },
  { id: 2,  name: '上海迪士尼乐园',     lat: 31.1444, lng: 121.6608, region: '华东', province: '上海', category: '主题乐园', emoji: '🏰', desc: '中国大陆首座迪士尼乐园，七大主题园区，梦幻与欢乐的王国', level: '5A', features: ['主题乐园'], cost: '¥475起', rating: '4.7' },
  { id: 3,  name: '杭州西湖',           lat: 30.2381, lng: 120.1487, region: '华东', province: '浙江', category: '自然', emoji: '🌊', desc: '世界文化景观遗产，十景闻名天下，人间天堂的经典代表', level: '5A', features: ['风景名胜', '湖光山色'], cost: '免费', rating: '4.7' },
  { id: 4,  name: '黄山',               lat: 30.1347, lng: 118.1677, region: '华东', province: '安徽', category: '自然', emoji: '⛰️', desc: '五岳归来不看山，黄山归来不看岳，奇松怪石云海温泉四绝', level: '5A', features: ['风景名胜', '地质奇观'], cost: '¥190', rating: '4.8' },
  { id: 5,  name: '九寨沟',             lat: 33.2615, lng: 103.9145, region: '西南', province: '四川', category: '自然', emoji: '💧', desc: '人间瑶池童话世界，五彩斑斓的海子与瀑布群令人屏息', level: '5A', features: ['风景名胜', '瀑布飞泉'], cost: '¥169', rating: '4.7' },
  { id: 6,  name: '张家界国家森林公园',  lat: 29.3288, lng: 110.4422, region: '华中', province: '湖南', category: '自然', emoji: '🏔️', desc: '阿凡达取景地，三千奇峰拔地而起，世界自然遗产奇观', level: '5A', features: ['森林公园', '地质奇观'], cost: '¥228', rating: '4.6' },
  { id: 7,  name: '桂林漓江',           lat: 25.2736, lng: 110.2902, region: '华南', province: '广西', category: '自然', emoji: '🛶', desc: '桂林山水甲天下，漓江百里画廊，水墨丹青般的诗意风光', level: '5A', features: ['风景名胜', '湖光山色'], cost: '¥215', rating: '4.6' },
  { id: 8,  name: '厦门鼓浪屿',         lat: 24.4479, lng: 118.0686, region: '华东', province: '福建', category: '海岛', emoji: '🏝️', desc: '万国建筑博览岛，钢琴之岛，文艺浪漫的海上花园', level: '5A', features: ['海滨风光', '人文历史'], cost: '¥50', rating: '4.5' },
  { id: 9,  name: '泰山',               lat: 36.2570, lng: 117.1066, region: '华东', province: '山东', category: '自然', emoji: '🏔️', desc: '五岳之首天下第一山，帝王封禅圣地，日出云海壮丽磅礴', level: '5A', features: ['风景名胜', '人文历史'], cost: '¥115', rating: '4.7' },
  { id: 10, name: '华山',               lat: 34.4854, lng: 110.0890, region: '西北', province: '陕西', category: '自然', emoji: '🧗', desc: '奇险天下第一山，长空栈道惊心动魄，五峰耸立如莲', level: '5A', features: ['风景名胜', '地质奇观'], cost: '¥160', rating: '4.6' },
  { id: 11, name: '峨眉山',             lat: 29.5918, lng: 103.3698, region: '西南', province: '四川', category: '自然', emoji: '⛰️', desc: '四大佛教名山，金顶佛光云海，灵猴穿梭的仙山佛国', level: '5A', features: ['风景名胜', '人文历史'], cost: '¥160', rating: '4.6' },
  { id: 12, name: '布达拉宫',           lat: 29.6574, lng: 91.1172, region: '西南', province: '西藏', category: '人文历史', emoji: '🏛️', desc: '世界上海拔最高的宫殿群，藏传佛教圣地，雪域高原明珠', level: '5A', features: ['人文历史'], cost: '¥200', rating: '4.8' },
  { id: 13, name: '三亚亚龙湾',         lat: 18.2266, lng: 109.6426, region: '华南', province: '海南', category: '海岛', emoji: '🏖️', desc: '天下第一湾，洁白沙滩与碧蓝海水，热带度假天堂', level: '4A', features: ['海滨风光'], cost: '免费', rating: '4.5' },
  { id: 14, name: '丽江古城',           lat: 26.8721, lng: 100.2299, region: '西南', province: '云南', category: '古城', emoji: '🏘️', desc: '世界文化遗产，小桥流水纳西风情，艳遇之都慢生活', level: '5A', features: ['古镇古村', '人文历史'], cost: '免费', rating: '4.5' },
  { id: 15, name: '大理洱海',           lat: 25.6065, lng: 100.2320, region: '西南', province: '云南', category: '自然', emoji: '🌅', desc: '苍山洱海风花雪月，环湖骑行邂逅最美田园风光', level: '4A', features: ['湖光山色', '风景名胜'], cost: '免费', rating: '4.6' },
  { id: 16, name: '西安兵马俑',         lat: 34.3833, lng: 109.2730, region: '西北', province: '陕西', category: '人文历史', emoji: '🗿', desc: '世界第八大奇迹，秦始皇地下军阵，两千年前的震撼', level: '5A', features: ['人文历史'], cost: '¥120', rating: '4.7' },
  { id: 17, name: '黄果树瀑布',         lat: 25.9922, lng: 105.6661, region: '西南', province: '贵州', category: '自然', emoji: '💦', desc: '亚洲最大瀑布群，水帘洞穿越体验，气势磅礴震撼人心', level: '5A', features: ['瀑布飞泉', '风景名胜'], cost: '¥160', rating: '4.5' },
  { id: 18, name: '长白山天池',         lat: 42.0060, lng: 128.0565, region: '东北', province: '吉林', category: '自然', emoji: '❄️', desc: '中国最深高山湖泊，十六峰环抱，神秘壮美的火山口湖', level: '5A', features: ['湖光山色', '地质奇观'], cost: '¥125', rating: '4.6' },
  { id: 19, name: '青海湖',             lat: 36.9359, lng: 100.2339, region: '西北', province: '青海', category: '自然', emoji: '💎', desc: '中国最大内陆咸水湖，油菜花海与碧湖蓝天交相辉映', level: '5A', features: ['湖光山色', '风景名胜'], cost: '¥100', rating: '4.5' },
  { id: 20, name: '呼伦贝尔草原',       lat: 49.2116, lng: 119.7657, region: '华北', province: '内蒙古', category: '草原', emoji: '🌿', desc: '世界四大草原之一，风吹草低见牛羊，夏季绿浪无边无际', level: '4A', features: ['风景名胜'], cost: '免费', rating: '4.6' },
  { id: 21, name: '花果山',             lat: 34.5895, lng: 119.2945, region: '华东', province: '江苏', category: '自然', emoji: '🐒', desc: '孙悟空的老家，西游记发源地，江苏最高峰玉女峰所在地', level: '5A', features: ['风景名胜', '人文历史'], cost: '¥90', rating: '4.5' },
  { id: 22, name: '连岛景区',           lat: 34.7600, lng: 119.4700, region: '华东', province: '江苏', category: '海岛', emoji: '🏝️', desc: '江苏最大海岛，金色沙滩与碧海蓝天，夏日避暑胜地', level: '4A', features: ['海滨风光', '风景名胜'], cost: '¥50', rating: '4.4' }
]

// 地区色系映射
export const regionColors = {
  '华北': { bg: 'linear-gradient(135deg, #ef4444, #f97316)', tag: '#ef4444' },
  '华东': { bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)', tag: '#6366f1' },
  '华南': { bg: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', tag: '#06b6d4' },
  '西南': { bg: 'linear-gradient(135deg, #10b981, #34d399)', tag: '#10b981' },
  '西北': { bg: 'linear-gradient(135deg, #f59e0b, #eab308)', tag: '#f59e0b' },
  '东北': { bg: 'linear-gradient(135deg, #3b82f6, #60a5fa)', tag: '#3b82f6' },
  '华中': { bg: 'linear-gradient(135deg, #ec4899, #f472b6)', tag: '#ec4899' }
}

// 快捷搜索关键词
export const quickSearchTags = ['故宫', '迪士尼', '西湖', '九寨沟', '黄山', '丽江', '三亚', '兵马俑', '张家界', '长白山', '花果山', '连岛']

// ==================== 故宫 子路线 ====================
const gugongSpots = [
  { id: 101, attraction_id: 1, name: '午门', lat: 39.9139, lng: 116.3970, stay_duration: 20, default_order: 1, ticket_price: 0, highlight: '故宫正门，气势恢宏的城门建筑', desc: '故宫正门，气势恢宏的城门建筑，检票入口。' },
  { id: 102, attraction_id: 1, name: '太和殿', lat: 39.9155, lng: 116.3972, stay_duration: 40, default_order: 2, ticket_price: 0, highlight: '故宫最大殿宇，皇帝登基大典举办地', desc: '故宫最大的宫殿，皇帝登基、大婚等重大典礼的举办地。' },
  { id: 103, attraction_id: 1, name: '中和殿', lat: 39.9160, lng: 116.3973, stay_duration: 15, default_order: 3, ticket_price: 0, highlight: '皇帝前往太和殿前休憩之所', desc: '皇帝前往太和殿前休息和准备的地方。' },
  { id: 104, attraction_id: 1, name: '保和殿', lat: 39.9165, lng: 116.3974, stay_duration: 20, default_order: 4, ticket_price: 0, highlight: '清代殿试场所，皇家最高学府', desc: '清代殿试的举办场所，建筑精美。' },
  { id: 105, attraction_id: 1, name: '乾清宫', lat: 39.9180, lng: 116.3975, stay_duration: 30, default_order: 5, ticket_price: 0, highlight: '正大光明匾所在地，明代皇帝寝宫', desc: '明代和清初皇帝的寝宫，正大光明匾所在地。' },
  { id: 106, attraction_id: 1, name: '交泰殿', lat: 39.9185, lng: 116.3976, stay_duration: 15, default_order: 6, ticket_price: 0, highlight: '皇后接受朝贺的宫殿', desc: '皇后生日接受朝贺的地方。' },
  { id: 107, attraction_id: 1, name: '坤宁宫', lat: 39.9190, lng: 116.3977, stay_duration: 20, default_order: 7, ticket_price: 0, highlight: '皇后寝宫，清代改为祭祀重地', desc: '皇后的寝宫，清代改为祭祀场所。' },
  { id: 108, attraction_id: 1, name: '御花园', lat: 39.9198, lng: 116.3975, stay_duration: 40, default_order: 8, ticket_price: 0, highlight: '600年古树参天的皇家园林', desc: '皇家园林，古树参天，亭台楼阁错落有致。' },
  { id: 109, attraction_id: 1, name: '神武门', lat: 39.9205, lng: 116.3973, stay_duration: 10, default_order: 9, ticket_price: 0, highlight: '故宫北门出口，可远眺景山', desc: '故宫北门，出口处，可远眺景山。' }
]

// ==================== 故宫 美食 ====================
const gugongFoods = [
  { id: 201, attraction_id: 1, name: '四季民福烤鸭店', recommend_dish: '北京烤鸭', lat: 39.9148, lng: 116.4035, price_per_person: 150, highlight: '景观位可观东华门，故宫旁人气名店' },
  { id: 202, attraction_id: 1, name: '故宫冰窖餐厅', recommend_dish: '宫廷糕点套餐', lat: 39.9172, lng: 116.3978, price_per_person: 80, highlight: '故宫院内唯一餐厅，皇家庭院中用餐' },
  { id: 203, attraction_id: 1, name: '老北京炸酱面大王', recommend_dish: '炸酱面', lat: 39.9200, lng: 116.4000, price_per_person: 45, highlight: '三代传承，地道京味炸酱面' },
  { id: 204, attraction_id: 1, name: '护国寺小吃', recommend_dish: '豆汁焦圈', lat: 39.9215, lng: 116.3985, price_per_person: 30, highlight: '老北京传统小吃集合，品种超百种' },
  { id: 205, attraction_id: 1, name: '东来顺饭庄', recommend_dish: '铜锅涮羊肉', lat: 39.9155, lng: 116.4050, price_per_person: 120, highlight: '百年老字号，手切鲜羊肉一绝' }
]

// ==================== 故宫 酒店 ====================
const gugongHotels = [
  { id: 301, attraction_id: 1, name: '北京王府井希尔顿酒店', price_range: '800-1500元/晚', lat: 39.9180, lng: 116.4100, highlight: '步行10分钟直达故宫东华门' },
  { id: 302, attraction_id: 1, name: '北京饭店', price_range: '600-1200元/晚', lat: 39.9120, lng: 116.4080, highlight: '百年传奇酒店，长安街核心位置' },
  { id: 303, attraction_id: 1, name: '如家精选(故宫店)', price_range: '300-500元/晚', lat: 39.9205, lng: 116.4040, highlight: '性价比之选，步行可达神武门' },
  { id: 304, attraction_id: 1, name: '景山花园酒店', price_range: '500-800元/晚', lat: 39.9220, lng: 116.3990, highlight: '紧邻景山公园，屋顶可观故宫全景' }
]

// ==================== 迪士尼 子路线 ====================
const disneySpots = [
  { id: 401, attraction_id: 2, name: '米奇大街', lat: 31.1430, lng: 121.6585, stay_duration: 30, default_order: 1, ticket_price: 0, highlight: '入园首站，米奇米妮合影打卡点', desc: '入园第一站，购物和拍照的好地方，米奇米妮见面点。' },
  { id: 402, attraction_id: 2, name: '探险岛', lat: 31.1445, lng: 121.6600, stay_duration: 60, default_order: 2, ticket_price: 0, highlight: '翱翔·飞越地平线，排队必玩项目', desc: '翱翔·飞越地平线、雷鸣山漂流等热门项目所在地。' },
  { id: 403, attraction_id: 2, name: '宝藏湾', lat: 31.1450, lng: 121.6615, stay_duration: 50, default_order: 3, ticket_price: 0, highlight: '加勒比海盗主题，沉落宝藏之战', desc: '加勒比海盗主题区，沉落宝藏之战不容错过。' },
  { id: 404, attraction_id: 2, name: '梦幻世界', lat: 31.1440, lng: 121.6620, stay_duration: 70, default_order: 4, ticket_price: 0, highlight: '七个小矮人矿山车，全家欢乐首选', desc: '七个小矮人矿山车、小飞侠天空奇遇等家庭项目。' },
  { id: 405, attraction_id: 2, name: '明日世界', lat: 31.1435, lng: 121.6630, stay_duration: 50, default_order: 5, ticket_price: 0, highlight: '创极速光轮，科技感爆棚的过山车', desc: '创极速光轮、巴斯光年星际营救等科技感十足的项目。' },
  { id: 406, attraction_id: 2, name: '奇想花园', lat: 31.1425, lng: 121.6595, stay_duration: 40, default_order: 6, ticket_price: 0, highlight: '旋转木马+夜晚烟花最佳观赏区', desc: '旋转木马、小飞象，夜晚烟花秀最佳观赏区域。' }
]

// ==================== 迪士尼 美食 ====================
const disneyFoods = [
  { id: 501, attraction_id: 2, name: '皇家宴会厅', recommend_dish: '公主主题套餐', lat: 31.1430, lng: 121.6590, price_per_person: 350, highlight: '城堡内用餐，可与迪士尼公主合影' },
  { id: 502, attraction_id: 2, name: '巴波萨烧烤', recommend_dish: '烤猪肋排', lat: 31.1450, lng: 121.6615, price_per_person: 100, highlight: '加勒比海盗主题餐厅，氛围感满分' },
  { id: 503, attraction_id: 2, name: '部落丰盛堂', recommend_dish: '火鸡腿饭', lat: 31.1445, lng: 121.6600, price_per_person: 85, highlight: '迪士尼招牌火鸡腿，排队也要吃' },
  { id: 504, attraction_id: 2, name: '米奇好伙伴美味集市', recommend_dish: '米奇头披萨', lat: 31.1430, lng: 121.6585, price_per_person: 90, highlight: '米奇造型美食，拍照出片率100%' },
  { id: 505, attraction_id: 2, name: '星露台餐厅', recommend_dish: '芝士牛肉汉堡', lat: 31.1435, lng: 121.6630, price_per_person: 80, highlight: '科幻主题餐厅，经典汉堡套餐' }
]

// ==================== 迪士尼 酒店 ====================
const disneyHotels = [
  { id: 601, attraction_id: 2, name: '上海迪士尼乐园酒店', price_range: '2000-4000元/晚', lat: 31.1400, lng: 121.6650, highlight: '梦幻城堡酒店，专属入园通道免排队' },
  { id: 602, attraction_id: 2, name: '玩具总动员酒店', price_range: '800-1500元/晚', lat: 31.1390, lng: 121.6640, highlight: '巴斯光年主题酒店，亲子家庭首选' },
  { id: 603, attraction_id: 2, name: '上海邻家美利亚酒店', price_range: '600-1200元/晚', lat: 31.1410, lng: 121.6580, highlight: '步行5分钟即可入园，性价比超高' }
]

// ==================== 花果山 子路线 ====================
const huaguoshanSpots = [
  { id: 701, attraction_id: 21, name: '山门', lat: 34.5880, lng: 119.2920, stay_duration: 10, default_order: 1, ticket_price: 0, highlight: '花果山入口，西游记主题雕塑', desc: '花果山景区入口，西游记主题雕塑群，检票入园。' },
  { id: 702, attraction_id: 21, name: '十八盘', lat: 34.5890, lng: 119.2935, stay_duration: 20, default_order: 2, ticket_price: 0, highlight: '蜿蜒登山古道，沿途风景秀丽', desc: '蜿蜒曲折的登山古道，沿途山林葱郁，是登山的必经之路。' },
  { id: 703, attraction_id: 21, name: '九龙桥', lat: 34.5900, lng: 119.2940, stay_duration: 15, default_order: 3, ticket_price: 0, highlight: '九条山涧汇流，古桥流水', desc: '九条山涧在此汇聚，古桥横跨溪流，是拍照打卡的好去处。' },
  { id: 704, attraction_id: 21, name: '水帘洞', lat: 34.5910, lng: 119.2950, stay_duration: 30, default_order: 4, ticket_price: 0, highlight: '孙悟空的老家！瀑布飞流直下', desc: '花果山的核心景点，瀑布从洞口飞流直下，洞内宽敞可容纳百人。' },
  { id: 705, attraction_id: 21, name: '三元宫', lat: 34.5908, lng: 119.2955, stay_duration: 25, default_order: 5, ticket_price: 0, highlight: '千年道教古刹，香火旺盛', desc: '始建于唐代的道教宫观，供奉天、地、水三官，建筑古朴庄重。' },
  { id: 706, attraction_id: 21, name: '七十二洞', lat: 34.5905, lng: 119.2960, stay_duration: 20, default_order: 6, ticket_price: 0, highlight: '怪石嶙峋，洞洞相连似迷宫', desc: '天然形成的奇石洞穴群，洞洞相连如同迷宫，充满探险趣味。' },
  { id: 707, attraction_id: 21, name: '玉女峰', lat: 34.5920, lng: 119.2965, stay_duration: 40, default_order: 7, ticket_price: 0, highlight: '江苏最高峰！一览众山小', desc: '海拔624.4米的江苏省最高点，登顶可俯瞰连云港全景和东海碧波。' },
  { id: 708, attraction_id: 21, name: '猴园', lat: 34.5895, lng: 119.2958, stay_duration: 25, default_order: 8, ticket_price: 0, highlight: '与猕猴亲密互动，投喂小猴子', desc: '散养猕猴的乐园，可以近距离观察猴群嬉戏，注意保管好随身物品！' },
  // 前程景观车
  { id: 709, attraction_id: 21, name: '前程景观车(山门→玉女峰)', lat: 34.5885, lng: 119.2930, stay_duration: 0, default_order: 0, ticket_price: 50, highlight: '景区观光车直达玉女峰，省时省力', desc: '从山门直达玉女峰的景区观光车，沿途欣赏花果山全貌。' }
]

// ==================== 花果山 美食 ====================
const huaguoshanFoods = [
  { id: 801, attraction_id: 21, name: '花果山素斋馆', recommend_dish: '素面套餐', lat: 34.5905, lng: 119.2952, price_per_person: 35, highlight: '三元宫旁的素斋，食材取自山中泉水' },
  { id: 802, attraction_id: 21, name: '海鲜一条街·望海楼', recommend_dish: '清蒸梭子蟹', lat: 34.6000, lng: 119.2800, price_per_person: 120, highlight: '连云港本地海鲜，每日渔船直供' },
  { id: 803, attraction_id: 21, name: '花果山农家乐', recommend_dish: '土鸡炖蘑菇', lat: 34.5875, lng: 119.2915, price_per_person: 60, highlight: '山脚下地道农家菜，散养土鸡一绝' },
  { id: 804, attraction_id: 21, name: '小沙东海战纪念馆餐厅', recommend_dish: '海鲜大咖', lat: 34.5950, lng: 119.2850, price_per_person: 100, highlight: '海鲜大咖拼盘，视觉与味觉的双重震撼' },
  { id: 805, attraction_id: 21, name: '老海边小吃', recommend_dish: '海蛎煎', lat: 34.5800, lng: 119.2780, price_per_person: 25, highlight: '本地人常去的平价小店，海蛎煎外酥里嫩' }
]

// ==================== 花果山 酒店 ====================
const huaguoshanHotels = [
  { id: 901, attraction_id: 21, name: '连云港花果山国际酒店', price_range: '400-800元/晚', lat: 34.5850, lng: 119.2880, highlight: '景区附近五星标准，登山接驳车直达' },
  { id: 902, attraction_id: 21, name: '花果山禅意民宿', price_range: '200-400元/晚', lat: 34.5870, lng: 119.2900, highlight: '山脚禅意小院，清晨闻鸟鸣而起' },
  { id: 903, attraction_id: 21, name: '连云港苏宁索菲特酒店', price_range: '500-900元/晚', lat: 34.5950, lng: 119.2100, highlight: '市中心法式奢华，距花果山20分钟车程' }
]

// ==================== 连岛 子路线 ====================
const liandaoSpots = [
  { id: 1001, attraction_id: 22, name: '连岛游客中心', lat: 34.7580, lng: 119.4680, stay_duration: 10, default_order: 1, ticket_price: 0, highlight: '购票入园，领取导览地图', desc: '连岛景区入口，购票后乘坐接驳车入岛。' },
  { id: 1002, attraction_id: 22, name: '大沙湾海滨浴场', lat: 34.7610, lng: 119.4710, stay_duration: 90, default_order: 2, ticket_price: 0, highlight: '江苏最美沙滩，沙质细腻海水清澈', desc: '连岛最大的海滨浴场，金色沙滩绵延千米，海水浴、沙滩排球首选。' },
  { id: 1003, attraction_id: 22, name: '苏马湾生态园', lat: 34.7630, lng: 119.4725, stay_duration: 60, default_order: 3, ticket_price: 0, highlight: '原始生态海湾，赶海拾贝好去处', desc: '保持原始生态的海湾，礁石间可赶海拾贝，退潮时收获满满。' },
  { id: 1004, attraction_id: 22, name: '孔雀园', lat: 34.7620, lng: 119.4715, stay_duration: 30, default_order: 4, ticket_price: 0, highlight: '百只孔雀开屏争艳', desc: '栖息着上百只孔雀，运气好能看到集体开屏的壮观场面。' },
  { id: 1005, attraction_id: 22, name: '海岛地质公园', lat: 34.7640, lng: 119.4730, stay_duration: 40, default_order: 5, ticket_price: 0, highlight: '海蚀地貌奇观，天然海蚀洞', desc: '亿万年海蚀形成的地质奇观，海蚀洞、海蚀柱形态各异。' },
  { id: 1006, attraction_id: 22, name: '日落观景台', lat: 34.7635, lng: 119.4735, stay_duration: 30, default_order: 6, ticket_price: 0, highlight: '连岛最佳日落观赏点', desc: '面朝大海的观景平台，傍晚时分金色落日与海面相映成辉。' },
  // 连岛观光车
  { id: 1007, attraction_id: 22, name: '连岛观光车(环岛)', lat: 34.7590, lng: 119.4690, stay_duration: 0, default_order: 0, ticket_price: 20, highlight: '环岛观光车，轻松游览全岛', desc: '环岛观光车，覆盖大沙湾→苏马湾→地质公园全线，随上随下。' }
]

// ==================== 连岛 美食 ====================
const liandaoFoods = [
  { id: 1101, attraction_id: 22, name: '连岛海鲜大排档', recommend_dish: '蒜蓉生蚝', lat: 34.7600, lng: 119.4705, price_per_person: 80, highlight: '海边现捞现做，生蚝肥美多汁' },
  { id: 1102, attraction_id: 22, name: '海景渔家乐', recommend_dish: '海鲜面', lat: 34.7615, lng: 119.4720, price_per_person: 50, highlight: '渔家自晒海鲜面，汤头鲜美无比' },
  { id: 1103, attraction_id: 22, name: '沙滩BBQ', recommend_dish: '烤鱿鱼串', lat: 34.7610, lng: 119.4708, price_per_person: 60, highlight: '面朝大海撸串，夏日夜晚绝配' },
  { id: 1104, attraction_id: 22, name: '连云港老街·海之味', recommend_dish: '葱油海螺片', lat: 34.7500, lng: 119.4600, price_per_person: 90, highlight: '百年老街里的口碑老店，海螺片脆嫩弹牙' },
  { id: 1105, attraction_id: 22, name: '岛上咖啡屋', recommend_dish: '海盐拿铁', lat: 34.7625, lng: 119.4728, price_per_person: 35, highlight: '苏马湾旁悬崖咖啡，海风配咖啡超治愈' }
]

// ==================== 连岛 酒店 ====================
const liandaoHotels = [
  { id: 1201, attraction_id: 22, name: '连岛海景度假酒店', price_range: '500-1000元/晚', lat: 34.7605, lng: 119.4695, highlight: '推窗即海景，步行3分钟到沙滩' },
  { id: 1202, attraction_id: 22, name: '苏马湾露营基地', price_range: '150-300元/晚', lat: 34.7630, lng: 119.4720, highlight: '海边帐篷露营，篝火+星空体验' },
  { id: 1203, attraction_id: 22, name: '连云港金陵海州湾会议中心', price_range: '400-700元/晚', lat: 34.7550, lng: 119.4620, highlight: '四星级海景酒店，距连岛10分钟车程' }
]

// ==================== 获取全量规划数据 ====================
const planData = {
  1: { attraction: attractions[0], spots: gugongSpots, foods: gugongFoods, hotels: gugongHotels },
  2: { attraction: attractions[1], spots: disneySpots, foods: disneyFoods, hotels: disneyHotels },
  21: { attraction: attractions[20], spots: huaguoshanSpots, foods: huaguoshanFoods, hotels: huaguoshanHotels },
  22: { attraction: attractions[21], spots: liandaoSpots, foods: liandaoFoods, hotels: liandaoHotels }
}

/** 模拟搜索主景点 */
export function searchAttractions(keyword) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!keyword || !keyword.trim()) { resolve(attractions); return }
      const kw = keyword.trim().toLowerCase()
      resolve(attractions.filter(a => a.name.toLowerCase().includes(kw)))
    }, 300)
  })
}

/** 获取景点全量规划数据 */
export function getAttractionPlan(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const data = planData[id]
      data ? resolve({ ...data }) : reject(new Error('景点数据不存在'))
    }, 400)
  })
}

/** 解析门票价格字符串 → 数字（"¥90"→90, "¥475起"→475, "免费"→0） */
function parseCostToNumber(costStr) {
  if (!costStr || costStr === '免费') return 0
  const match = String(costStr).match(/(\d+)/)
  return match ? Number(match[1]) : 0
}

/** 模拟生成攻略 */
export function generatePlan({ attractionId, selectedSpotIds, selectedFoodIds, hotelId, customHotelName, transportMode = 'drive' }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = planData[attractionId]
      if (!data) { resolve(null); return }

      const orderedSpots = selectedSpotIds.map(id => data.spots.find(s => s.id === id)).filter(Boolean)
      const selectedFoods = selectedFoodIds.map(id => data.foods.find(f => f.id === id)).filter(Boolean)
      let hotelName = customHotelName
      if (Number(hotelId) > 0) {
        const hotel = data.hotels.find(h => h.id === Number(hotelId))
        hotelName = hotel ? hotel.name : '未选择'
      }

      // 🎫 主门票 + 子景点/观光车费用
      const mainTicket = parseCostToNumber(data.attraction.cost)
      const spotsBudget = orderedSpots.reduce((sum, s) => sum + (s.ticket_price || 0), 0) + mainTicket
      const foodBudget = selectedFoods.reduce((sum, f) => sum + (f.price_per_person || 0), 0)

      // ===== Haversine 距离计算 =====
      const haversineDist = (from, to) => {
        if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return 0
        const R = 6371000
        const toRad = d => d * Math.PI / 180
        const dLat = toRad(to.lat - from.lat), dLng = toRad(to.lng - from.lng)
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2
        return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
      }
      // ===== 交通方式估算 =====
      const estimateTransport = (from, to) => {
        if (!from || !to) return { mode: 'walk', distance: 0, duration: 5 }
        const dist = haversineDist(from, to)
        if (transportMode === 'transit') {
          if (dist < 1500) return { mode: 'walk', distance: dist, duration: Math.max(3, Math.round(dist / 80) + 3) }
          return { mode: 'transit', distance: dist, duration: Math.max(15, Math.round(dist / 300) + 15) }
        }
        // 自驾模式（~48km/h）
        if (dist < 1500) return { mode: 'walk', distance: dist, duration: Math.max(2, Math.round(dist / 80) + 2) }
        return { mode: 'drive', distance: dist, duration: Math.max(5, Math.round(dist / 800) + 5) }
      }

      const formatTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
      const timeline = []
      let t = 480
      let prevNode = null

      if (orderedSpots.length) {
        const half = Math.ceil(orderedSpots.length / 2)
        timeline.push({ type: 'section', title: '🎯 上午行程' })
        orderedSpots.slice(0, half).forEach((s, idx) => {
          const transport = estimateTransport(prevNode, s)
          t += transport.duration
          // 上午第一个景点不展示通行时间
          timeline.push({ type: 'spot', time: formatTime(t), data: { ...s }, transportFromPrev: idx === 0 ? null : transport })
          t += s.stay_duration
          prevNode = s
        })
        t += 15
      }
      if (selectedFoods.length) {
        t = Math.max(t, 690)
        timeline.push({ type: 'section', title: '🍽️ 午餐推荐' })
        timeline.push({ type: 'food', time: formatTime(t), data: { ...selectedFoods[0] } })
        t += 60
        prevNode = selectedFoods[0]
      }
      if (orderedSpots.length > 1) {
        const half = Math.ceil(orderedSpots.length / 2)
        timeline.push({ type: 'section', title: transportMode === 'drive' ? '🚗 下午行程' : '🚌 下午行程' })
        orderedSpots.slice(half).forEach(s => {
          const transport = estimateTransport(prevNode, s)
          t += transport.duration
          timeline.push({ type: 'spot', time: formatTime(t), data: { ...s }, transportFromPrev: transport })
          t += s.stay_duration
          prevNode = s
        })
        t += 15
      }
      if (selectedFoods.length > 1) {
        t = Math.max(t, 1050)
        timeline.push({ type: 'section', title: '🍲 晚餐推荐' })
        timeline.push({ type: 'food', time: formatTime(t), data: { ...selectedFoods[1] } })
      }
      timeline.push({ type: 'section', title: '🏨 住宿安排' })
      timeline.push({ type: 'hotel', time: '21:00', data: { name: hotelName || '未选择' } })

      resolve({
        attractionName: data.attraction.name,
        timeline,
        summary: {
          spotsCount: orderedSpots.length,
          foodsCount: selectedFoods.length,
          hotelName: hotelName || '未选择',
          mainTicket,
          totalBudget: spotsBudget + foodBudget,
          lat: data.attraction.lat,
          lng: data.attraction.lng
        }
      })
    }, 500)
  })
}

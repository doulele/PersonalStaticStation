// 中国主要城市经纬度数据
export const cities = [
  // 直辖市
  { name: '北京', province: '北京', lat: 39.9042, lng: 116.4074 },
  { name: '上海', province: '上海', lat: 31.2304, lng: 121.4737 },
  { name: '天津', province: '天津', lat: 39.3434, lng: 117.3616 },
  { name: '重庆', province: '重庆', lat: 29.4316, lng: 106.9123 },

  // 广东省
  { name: '广州', province: '广东', lat: 23.1291, lng: 113.2644 },
  { name: '深圳', province: '广东', lat: 22.5431, lng: 114.0579 },
  { name: '珠海', province: '广东', lat: 22.2707, lng: 113.5767 },
  { name: '东莞', province: '广东', lat: 23.0208, lng: 113.7518 },
  { name: '佛山', province: '广东', lat: 23.0218, lng: 113.1219 },
  { name: '中山', province: '广东', lat: 22.5176, lng: 113.3920 },
  { name: '惠州', province: '广东', lat: 23.1107, lng: 114.4168 },
  { name: '汕头', province: '广东', lat: 23.3541, lng: 116.6820 },

  // 浙江省
  { name: '杭州', province: '浙江', lat: 30.2741, lng: 120.1551 },
  { name: '宁波', province: '浙江', lat: 29.8683, lng: 121.5440 },
  { name: '温州', province: '浙江', lat: 28.0015, lng: 120.6988 },
  { name: '嘉兴', province: '浙江', lat: 30.7710, lng: 120.7551 },

  // 江苏省
  { name: '南京', province: '江苏', lat: 32.0603, lng: 118.7969 },
  { name: '苏州', province: '江苏', lat: 31.2990, lng: 120.5853 },
  { name: '无锡', province: '江苏', lat: 31.4912, lng: 120.3124 },
  { name: '常州', province: '江苏', lat: 31.8112, lng: 119.9737 },
  { name: '南通', province: '江苏', lat: 31.9817, lng: 120.8943 },
  { name: '扬州', province: '江苏', lat: 32.3936, lng: 119.4126 },
  { name: '徐州', province: '江苏', lat: 34.2658, lng: 117.1853 },

  // 四川省
  { name: '成都', province: '四川', lat: 30.5728, lng: 104.0668 },
  { name: '绵阳', province: '四川', lat: 31.4675, lng: 104.6796 },

  // 湖北省
  { name: '武汉', province: '湖北', lat: 30.5928, lng: 114.3055 },
  { name: '宜昌', province: '湖北', lat: 30.6907, lng: 111.2864 },

  // 湖南省
  { name: '长沙', province: '湖南', lat: 28.2282, lng: 112.9388 },
  { name: '张家界', province: '湖南', lat: 29.1170, lng: 110.4789 },
  { name: '衡阳', province: '湖南', lat: 26.8932, lng: 112.5720 },

  // 福建省
  { name: '福州', province: '福建', lat: 26.0745, lng: 119.2965 },
  { name: '厦门', province: '福建', lat: 24.4798, lng: 118.0894 },
  { name: '泉州', province: '福建', lat: 24.8741, lng: 118.6746 },

  // 山东省
  { name: '济南', province: '山东', lat: 36.6518, lng: 117.1201 },
  { name: '青岛', province: '山东', lat: 36.0671, lng: 120.3826 },
  { name: '烟台', province: '山东', lat: 37.4645, lng: 121.4480 },
  { name: '威海', province: '山东', lat: 37.5131, lng: 122.1205 },
  { name: '日照', province: '山东', lat: 35.4167, lng: 119.5272 },
  { name: '泰安', province: '山东', lat: 36.2000, lng: 117.0876 },

  // 辽宁省
  { name: '沈阳', province: '辽宁', lat: 41.8057, lng: 123.4315 },
  { name: '大连', province: '辽宁', lat: 38.9140, lng: 121.6147 },

  // 陕西省
  { name: '西安', province: '陕西', lat: 34.3416, lng: 108.9398 },

  // 河南省
  { name: '郑州', province: '河南', lat: 34.7466, lng: 113.6254 },
  { name: '洛阳', province: '河南', lat: 34.6182, lng: 112.4540 },
  { name: '开封', province: '河南', lat: 34.7972, lng: 114.3073 },

  // 河北省
  { name: '石家庄', province: '河北', lat: 38.0428, lng: 114.5149 },
  { name: '秦皇岛', province: '河北', lat: 39.9354, lng: 119.5996 },
  { name: '保定', province: '河北', lat: 38.8738, lng: 115.4642 },

  // 安徽省
  { name: '合肥', province: '安徽', lat: 31.8206, lng: 117.2272 },
  { name: '黄山', province: '安徽', lat: 29.7152, lng: 118.3387 },

  // 江西省
  { name: '南昌', province: '江西', lat: 28.6820, lng: 115.8579 },
  { name: '九江', province: '江西', lat: 29.7049, lng: 116.0019 },

  // 广西
  { name: '南宁', province: '广西', lat: 22.8170, lng: 108.3665 },
  { name: '桂林', province: '广西', lat: 25.2736, lng: 110.2905 },
  { name: '北海', province: '广西', lat: 21.4731, lng: 109.1203 },

  // 云南省
  { name: '昆明', province: '云南', lat: 25.0389, lng: 102.7183 },
  { name: '大理', province: '云南', lat: 25.6065, lng: 100.2676 },
  { name: '丽江', province: '云南', lat: 26.8550, lng: 100.2271 },
  { name: '西双版纳', province: '云南', lat: 22.0091, lng: 100.7976 },

  // 贵州省
  { name: '贵阳', province: '贵州', lat: 26.6470, lng: 106.6302 },

  // 海南省
  { name: '海口', province: '海南', lat: 20.0440, lng: 110.1999 },
  { name: '三亚', province: '海南', lat: 18.2528, lng: 109.5120 },

  // 吉林省
  { name: '长春', province: '吉林', lat: 43.8171, lng: 125.3235 },

  // 黑龙江省
  { name: '哈尔滨', province: '黑龙江', lat: 45.8038, lng: 126.5349 },

  // 甘肃省
  { name: '兰州', province: '甘肃', lat: 36.0611, lng: 103.8343 },
  { name: '敦煌', province: '甘肃', lat: 40.1418, lng: 94.6620 },

  // 西藏
  { name: '拉萨', province: '西藏', lat: 29.6500, lng: 91.1000 },

  // 新疆
  { name: '乌鲁木齐', province: '新疆', lat: 43.8256, lng: 87.6168 },

  // 内蒙古
  { name: '呼和浩特', province: '内蒙古', lat: 40.8424, lng: 111.7490 },
  { name: '呼伦贝尔', province: '内蒙古', lat: 49.2122, lng: 119.7657 },

  // 青海省
  { name: '西宁', province: '青海', lat: 36.6171, lng: 101.7782 },

  // 宁夏
  { name: '银川', province: '宁夏', lat: 38.4872, lng: 106.2309 },
]

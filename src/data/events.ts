import { MarathonEvent, EventCategory } from '../types';

export const eventCategories: EventCategory[] = [
  { id: 'all', name: '全部', icon: '◉' },
  { id: 'full', name: '全马', icon: '🏃' },
  { id: 'half', name: '半马', icon: '🚴' },
  { id: '10k', name: '10公里', icon: '👟' },
  { id: '5k', name: '迷你跑', icon: '🎽' },
  { id: 'relay', name: '接力', icon: '🤝' }
];

export const mockEvents: MarathonEvent[] = [
  {
    id: 'e001',
    title: '2026北京国际马拉松',
    subtitle: '第44届北京马拉松',
    coverImage: 'https://picsum.photos/id/1036/750/400',
    location: '北京市·天安门广场',
    date: '2026-11-15 07:30',
    signupDeadline: '2026-10-10 18:00',
    status: 'open',
    categories: ['full', 'half'],
    groups: [
      {
        id: 'g001',
        name: '马拉松（42.195km）',
        distance: '42.195公里',
        price: 200,
        totalQuota: 20000,
        remainingQuota: 8523,
        cutoffTime: '6小时15分',
        description: '限20岁以上，需提供近2年内半马及以上完赛证明'
      },
      {
        id: 'g002',
        name: '半程马拉松（21.0975km）',
        distance: '21.0975公里',
        price: 150,
        totalQuota: 10000,
        remainingQuota: 3241,
        cutoffTime: '3小时15分',
        description: '限16岁以上，建议有跑步训练基础'
      }
    ],
    features: ['中国大满贯', '金标赛事', 'PB赛道', '奖牌刻字'],
    description:
      '北京马拉松是经国际田径联合会（IAAF）认证，中国田径协会备案的国内最高水平马拉松赛事，自1981年首届举办至今已有44年历史。赛道途经天安门、金融街、中关村、奥林匹克公园等北京地标建筑，是国内外跑者心中的朝圣之路。',
    rules: [
      '参赛者须年满20周岁（马拉松项目），半程马拉松须年满16周岁',
      '参赛者须身体健康，有长期参加跑步锻炼的基础',
      '马拉松项目须提供近2年内半程及以上完赛证明',
      '禁止弄虚作假，一经发现取消参赛资格并追究责任',
      '比赛采用分区起跑，请按照号码布分区检录',
      '参赛者须全程佩戴号码布于胸前明显位置'
    ],
    routeImage: 'https://picsum.photos/id/1039/750/500',
    faqs: [
      { question: '如何领取参赛包？', answer: '凭本人身份证原件在领物期间前往指定地点领取，不可代领。' },
      { question: '可以退赛退款吗？', answer: '报名截止前可申请退款，收取30%手续费；报名截止后不支持退款。' },
      { question: '比赛当天提供存包服务吗？', answer: '提供，起点设有存包车，请按号码布尾号对应车辆存包。' }
    ],
    medalImage: 'https://picsum.photos/id/1025/400/400',
    organizer: '中国田径协会、北京市体育局',
    tags: ['大满贯', '金标', '一线城市']
  },
  {
    id: 'e002',
    title: '2026上海国际马拉松',
    subtitle: '第27届上海马拉松',
    coverImage: 'https://picsum.photos/id/1044/750/400',
    location: '上海市·外滩金牛广场',
    date: '2026-11-22 07:00',
    signupDeadline: '2026-10-15 18:00',
    status: 'open',
    categories: ['full', '10k', '5k'],
    groups: [
      {
        id: 'g003',
        name: '全程马拉松',
        distance: '42.195公里',
        price: 220,
        totalQuota: 15000,
        remainingQuota: 12500,
        cutoffTime: '6小时',
        description: '需提供全马或半马完赛证明'
      },
      {
        id: 'g004',
        name: '10公里跑',
        distance: '10公里',
        price: 100,
        totalQuota: 5000,
        remainingQuota: 4800,
        cutoffTime: '1小时40分',
        description: '适合入门跑者'
      },
      {
        id: 'g005',
        name: '迷你健身跑',
        distance: '5公里',
        price: 60,
        totalQuota: 5000,
        remainingQuota: 5000,
        cutoffTime: '1小时',
        description: '适合家庭、亲子参与'
      }
    ],
    features: ['白金标赛事', '外滩起点', '沿途补水站密集'],
    description:
      '上海国际马拉松赛始于1996年，是中国规模最大、最具国际影响力的马拉松赛事之一。赛道从外滩出发，横跨黄浦江两岸，途经南京路、淮海路、世博园等经典地标，完赛率居全国前列。',
    rules: [
      '马拉松参赛者须在比赛当年12月31日前满20周岁',
      '参赛者须持有绿色健康码，赛前7天无中高风险地区旅居史',
      '比赛当日须佩戴口罩至起跑区',
      '完赛奖牌需在终点凭号码布领取'
    ],
    routeImage: 'https://picsum.photos/id/1015/750/500',
    faqs: [
      { question: '参赛服可以更换尺码吗？', answer: '报名截止后不支持更换，请报名时仔细确认。' }
    ],
    medalImage: 'https://picsum.photos/id/1018/400/400',
    organizer: '中国田径协会、上海市体育局',
    tags: ['白金标', '国际赛事']
  },
  {
    id: 'e003',
    title: '2027厦门马拉松',
    subtitle: '第22届厦门马拉松',
    coverImage: 'https://picsum.photos/id/1018/750/400',
    location: '厦门市·厦门国际会展中心',
    date: '2027-01-03 07:30',
    signupDeadline: '2026-12-01 18:00',
    status: 'upcoming',
    categories: ['full'],
    groups: [
      {
        id: 'g006',
        name: '全程马拉松',
        distance: '42.195公里',
        price: 200,
        totalQuota: 28000,
        remainingQuota: 28000,
        cutoffTime: '6小时',
        description: '最美沿海赛道，世界田联精英标赛事'
      }
    ],
    features: ['最美赛道', '沿海赛道', '1月新年第一跑'],
    description:
      '厦门马拉松创办于2003年，是国内四大满贯赛事之一，也是世界田联授予的"精英白金标"赛事。赛道沿环岛路展开，无敌海景相伴，被誉为"世界上最美的马拉松赛道"。',
    rules: [
      '全程马拉松参赛者须年满20周岁',
      '需提供近3年内全马完赛成绩证书或1年内半马完赛证书',
      '厦马选手直通需要符合相应成绩标准'
    ],
    routeImage: 'https://picsum.photos/id/1019/750/500',
    faqs: [],
    medalImage: 'https://picsum.photos/id/1027/400/400',
    organizer: '厦门市人民政府',
    tags: ['新年第一跑', '海景赛道']
  },
  {
    id: 'e004',
    title: '2026无锡马拉松',
    subtitle: '粉色马拉松',
    coverImage: 'https://picsum.photos/id/1015/750/400',
    location: '无锡市·太湖大道隐秀路口',
    date: '2026-03-22 07:30',
    signupDeadline: '2026-02-20 18:00',
    status: 'full',
    categories: ['full', 'half'],
    groups: [
      {
        id: 'g007',
        name: '全程马拉松',
        distance: '42.195公里',
        price: 200,
        totalQuota: 12000,
        remainingQuota: 0,
        cutoffTime: '6小时15分',
        description: '已满员，可候补'
      },
      {
        id: 'g008',
        name: '半程马拉松',
        distance: '21.0975公里',
        price: 160,
        totalQuota: 10000,
        remainingQuota: 0,
        cutoffTime: '3小时',
        description: '已满员，可候补'
      }
    ],
    features: ['樱花赛道', '粉色主题', 'PB赛道'],
    description:
      '无锡马拉松，人送外号"小清新"，以其粉色主题、樱花赛道和精美的完赛奖牌闻名。赛道环绕太湖，春天樱花盛开，美不胜收，是众多跑友必打卡的赛事。',
    rules: ['参赛者须年满18周岁'],
    routeImage: 'https://picsum.photos/id/1021/750/500',
    faqs: [],
    medalImage: 'https://picsum.photos/id/1035/400/400',
    organizer: '无锡市体育局',
    tags: ['网红赛事', '樱花']
  },
  {
    id: 'e005',
    title: '2026广州马拉松',
   subtitle: '第12届广州马拉松',
    coverImage: 'https://picsum.photos/id/1043/750/400',
    location: '广州市·天河体育中心',
    date: '2026-12-13 07:30',
    signupDeadline: '2026-11-05 18:00',
    status: 'open',
    categories: ['full', 'half'],
    groups: [
      {
        id: 'g009',
        name: '全程马拉松',
        distance: '42.195公里',
        price: 200,
        totalQuota: 18000,
        remainingQuota: 15600,
        cutoffTime: '6小时15分',
        description: '广马全马'
      },
      {
        id: 'g010',
        name: '半程马拉松',
        distance: '21.0975公里',
        price: 140,
        totalQuota: 12000,
        remainingQuota: 10200,
        cutoffTime: '3小时15分',
        description: '广马半马'
      }
    ],
    features: ['双金赛事', '年末收官'],
    description:
      '广州马拉松赛自2012年创办，是中国田径协会、广州市人民政府联合主办的大型城市马拉松赛。赛道途经花城广场、猎德大桥、广州塔等地标，尽显岭南风情。',
    rules: [],
    routeImage: 'https://picsum.photos/id/1031/750/500',
    faqs: [],
    medalImage: 'https://picsum.photos/id/1062/400/400',
    organizer: '广州市人民政府',
    tags: ['双金', '年末赛事']
  },
  {
    id: 'e006',
    title: '2026杭州马拉松',
    subtitle: '第36届杭州马拉松',
    coverImage: 'https://picsum.photos/id/1039/750/400',
    location: '杭州市·黄龙体育中心',
    date: '2026-11-08 07:30',
    signupDeadline: '2026-10-01 18:00',
    status: 'closed',
    categories: ['full', 'half'],
    groups: [
      {
        id: 'g011',
        name: '全程马拉松',
        distance: '42.195公里',
        price: 200,
        totalQuota: 20000,
        remainingQuota: 0,
        cutoffTime: '6小时15分',
        description: '报名已结束'
      }
    ],
    features: ['西湖赛道'],
    description: '杭州马拉松始于1987年，赛道穿越西湖景区，风景如画。',
    rules: [],
    routeImage: 'https://picsum.photos/id/1016/750/500',
    faqs: [],
    medalImage: 'https://picsum.photos/id/1067/400/400',
    organizer: '杭州市体育局',
    tags: ['西湖美景']
  },
  {
    id: 'e007',
    title: '2026成都马拉松',
    subtitle: '第5届成都马拉松',
    coverImage: 'https://picsum.photos/id/1019/750/400',
    location: '成都市·天府广场',
    date: '2026-10-26 07:30',
    signupDeadline: '2026-09-20 18:00',
    status: 'open',
    categories: ['full', 'half', 'relay'],
    groups: [
      {
        id: 'g012',
        name: '全程马拉松',
        distance: '42.195公里',
        price: 200,
        totalQuota: 12000,
        remainingQuota: 9800,
        cutoffTime: '6小时15分',
        description: '须提供近2年完赛证明'
      },
      {
        id: 'g013',
        name: '半程马拉松',
        distance: '21.0975公里',
        price: 150,
        totalQuota: 8000,
        remainingQuota: 6500,
        cutoffTime: '3小时15分',
        description: ''
      },
      {
        id: 'g014',
        name: '团队接力赛',
        distance: '6人接力',
        price: 900,
        totalQuota: 200,
        remainingQuota: 156,
        cutoffTime: '6小时',
        description: '每队6人，累计完成全马距离'
      }
    ],
    features: ['美食赛道', '熊猫主题'],
    description: '成都马拉松，一座来了就不想走的城市。赛道途经宽窄巷子、锦里、杜甫草堂等著名景点，沿途补给有火锅、串串，被誉为"最好吃的马拉松"。',
    rules: [],
    routeImage: 'https://picsum.photos/id/1023/750/500',
    faqs: [],
    medalImage: 'https://picsum.photos/id/1074/400/400',
    organizer: '成都市体育局',
    tags: ['美食', '熊猫']
  },
  {
    id: 'e008',
    title: '2026重庆国际马拉松',
    subtitle: '第15届重庆马拉松',
    coverImage: 'https://picsum.photos/id/1021/750/400',
    location: '重庆市·南滨路',
    date: '2026-03-23 07:30',
    signupDeadline: '2026-02-25 18:00',
    status: 'upcoming',
    categories: ['full', 'half', '5k'],
    groups: [
      {
        id: 'g015',
        name: '全程马拉松',
        distance: '42.195公里',
        price: 200,
        totalQuota: 10000,
        remainingQuota: 10000,
        cutoffTime: '6小时',
        description: '重马全马'
      }
    ],
    features: ['火锅赛道', '山城美景'],
    description: '重庆马拉松沿长江、嘉陵江两岸举办，赛道平坦，是PB的好选择。完赛后记得去吃一顿地道的重庆火锅！',
    rules: [],
    routeImage: 'https://picsum.photos/id/1025/750/500',
    faqs: [],
    medalImage: 'https://picsum.photos/id/1080/400/400',
    organizer: '重庆市体育局',
    tags: ['火锅', '山城']
  }
];

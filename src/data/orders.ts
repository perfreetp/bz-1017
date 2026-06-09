import { RegistrationOrder, Notification, RaceAssistantInfo } from '../types';

const teamMembers = [
  { id: 'tm1', name: '张*明', phone: '138****8888', status: 'paid' as const, shirtSize: 'L' },
  { id: 'tm2', name: '李*华', phone: '139****6666', status: 'paid' as const, shirtSize: 'M' },
  { id: 'tm3', name: '王*强', phone: '137****9999', status: 'paid' as const, shirtSize: 'XL' },
  { id: 'tm4', name: '赵*云', phone: '136****5555', status: 'paid' as const, shirtSize: 'L' },
  { id: 'tm5', name: '钱*佳', phone: '135****7777', status: 'paid' as const, shirtSize: 'M' }
];

export const mockOrders: RegistrationOrder[] = [
  {
    id: 'o001',
    orderNo: 'BM2026111500123',
    eventId: 'e001',
    eventTitle: '2026北京国际马拉松',
    eventCover: 'https://picsum.photos/id/1036/750/400',
    groupId: 'g001',
    groupName: '马拉松（42.195km）',
    amount: 200,
    status: 'review_passed',
    createdAt: '2026-09-15 10:32',
    paidAt: '2026-09-15 10:35',
    paymentRecords: [
      { id: 'p001', amount: 200, method: 'wechat', status: 'success', paidAt: '2026-09-15 10:35', transactionNo: 'WX20260915103500123' }
    ],
    reviewResult: 'pass',
    reviewComment: '资料审核通过，祝您取得好成绩！',
    bibNumber: 'A12345',
    pickupInfo: {
      date: '2026-11-13 至 11-14',
      time: '09:00 - 18:00',
      location: '北京国家会议中心E3馆',
      booth: 'B区23号展台'
    },
    qrCode: 'BJM2026A12345',
    runnerInfo: {
      name: '张*明',
      idCardLast4: '1234',
      shirtSize: 'L',
      phone: '138****8888',
      gender: '男'
    },
    isTeamRegistration: false,
    lockedFields: ['realName', 'idCardNumber', 'gender', 'groupId']
  },
  {
    id: 'o002',
    orderNo: 'SH2026112200456',
    eventId: 'e002',
    eventTitle: '2026上海国际马拉松',
    eventCover: 'https://picsum.photos/id/1044/750/400',
    groupId: 'g003',
    groupName: '全程马拉松',
    amount: 220,
    status: 'reviewing',
    createdAt: '2026-09-20 14:18',
    paidAt: '2026-09-20 14:22',
    paymentRecords: [
      { id: 'p002', amount: 220, method: 'alipay', status: 'success', paidAt: '2026-09-20 14:22', transactionNo: 'ALI20260920142200456' }
    ],
    runnerInfo: {
      name: '张*明',
      idCardLast4: '1234',
      shirtSize: 'L',
      phone: '138****8888',
      gender: '男'
    },
    isTeamRegistration: false,
    lockedFields: ['realName', 'idCardNumber']
  },
  {
    id: 'o003',
    orderNo: 'CD2026102600789',
    eventId: 'e007',
    eventTitle: '2026成都马拉松',
    eventCover: 'https://picsum.photos/id/1019/750/400',
    groupId: 'g014',
    groupName: '团队接力赛',
    amount: 900,
    status: 'paid',
    createdAt: '2026-09-25 09:45',
    paidAt: '2026-09-25 09:50',
    paymentRecords: [
      { id: 'p003', amount: 900, method: 'wechat', status: 'success', paidAt: '2026-09-25 09:50', transactionNo: 'WX20260925095000789' }
    ],
    runnerInfo: {
      name: '张*明',
      idCardLast4: '1234',
      shirtSize: 'L',
      phone: '138****8888',
      gender: '男'
    },
    isTeamRegistration: true,
    teamName: '飞毛腿战队',
    teamMemberCount: 5,
    teamMembers: teamMembers,
    lockedFields: ['realName', 'idCardNumber', 'groupId']
  },
  {
    id: 'o004',
    orderNo: 'WX2026032200321',
    eventId: 'e004',
    eventTitle: '2026无锡马拉松',
    eventCover: 'https://picsum.photos/id/1015/750/400',
    groupId: 'g007',
    groupName: '全程马拉松',
    amount: 200,
    status: 'review_failed',
    createdAt: '2026-08-10 16:20',
    paidAt: '2026-08-10 16:25',
    paymentRecords: [
      { id: 'p004', amount: 200, method: 'wechat', status: 'success', paidAt: '2026-08-10 16:25', transactionNo: 'WX20260810162500321' }
    ],
    reviewResult: 'fail',
    reviewComment: '上传的成绩证明不清晰，请重新上传近2年内的完赛证书',
    reviewMaterials: ['成绩证明'],
    runnerInfo: {
      name: '张*明',
      idCardLast4: '1234',
      shirtSize: 'L',
      phone: '138****8888',
      gender: '男'
    },
    isTeamRegistration: false,
    lockedFields: ['realName', 'idCardNumber']
  },
  {
    id: 'o005',
    orderNo: 'HZ2026110800111',
    eventId: 'e006',
    eventTitle: '2026杭州马拉松',
    eventCover: 'https://picsum.photos/id/1039/750/400',
    groupId: 'g011',
    groupName: '全程马拉松',
    amount: 200,
    status: 'refund_applying',
    createdAt: '2026-07-20 11:00',
    paidAt: '2026-07-20 11:05',
    paymentRecords: [
      { id: 'p005', amount: 200, method: 'wechat', status: 'success', paidAt: '2026-07-20 11:05', transactionNo: 'WX20260720110500111' },
      { id: 'r001', amount: 200, method: 'refund', status: 'pending', refundedAt: '2026-09-30 10:00', remark: '工作时间冲突，无法参赛' }
    ],
    refundAmount: 200,
    runnerInfo: {
      name: '张*明',
      idCardLast4: '1234',
      shirtSize: 'XL',
      phone: '138****8888',
      gender: '男'
    },
    isTeamRegistration: false,
    lockedFields: ['realName', 'idCardNumber', 'groupId']
  },
  {
    id: 'o006',
    orderNo: 'GZ2026121300555',
    eventId: 'e005',
    eventTitle: '2026广州马拉松',
    eventCover: 'https://picsum.photos/id/1043/750/400',
    groupId: 'g009',
    groupName: '全程马拉松',
    amount: 200,
    status: 'pending_payment',
    createdAt: '2026-09-28 20:30',
    runnerInfo: {
      name: '张*明',
      idCardLast4: '1234',
      shirtSize: 'L',
      phone: '138****8888',
      gender: '男'
    },
    isTeamRegistration: false,
    lockedFields: []
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'n001',
    type: 'review',
    title: '北京马拉松审核通过',
    content: '恭喜！您报名的2026北京国际马拉松（全程）资料审核已通过，参赛号A12345。',
    orderId: 'o001',
    createdAt: '2026-09-28 15:30',
    isRead: true
  },
  {
    id: 'n002',
    type: 'review',
    title: '无锡马拉松审核未通过',
    content: '很遗憾，您报名的2026无锡马拉松资料审核未通过，原因：成绩证明不清晰，请重新上传。',
    orderId: 'o004',
    createdAt: '2026-09-18 09:15',
    isRead: false
  },
  {
    id: 'n003',
    type: 'pickup',
    title: '北马领物通知',
    content: '2026北京国际马拉松领物时间为11月13-14日，地点国家会议中心E3馆B区23号。',
    orderId: 'o001',
    createdAt: '2026-11-01 10:00',
    isRead: false
  },
  {
    id: 'n004',
    type: 'event',
    title: '开赛提醒',
    content: '距离2026北京国际马拉松开赛还有14天，请保持训练，注意饮食和休息。',
    orderId: 'o001',
    createdAt: '2026-11-01 08:00',
    isRead: false
  },
  {
    id: 'n005',
    type: 'payment',
    title: '待支付提醒',
    content: '您有一笔广州马拉松报名订单待支付，请在30分钟内完成支付，超时订单将自动取消。',
    orderId: 'o006',
    createdAt: '2026-09-28 20:30',
    isRead: true
  },
  {
    id: 'n006',
    type: 'system',
    title: '系统通知',
    content: '马拉松报名小程序已更新至v2.0，新增团队报名功能，欢迎体验！',
    createdAt: '2026-09-01 12:00',
    isRead: true
  }
];

export const mockRaceAssistant: RaceAssistantInfo = {
  eventId: 'e001',
  eventTitle: '2026北京国际马拉松',
  bibNumber: 'A12345',
  corral: 'A区',
  startTime: '2026-11-15 07:30',
  raceDate: '2026-11-15',
  pickupInfo: {
    date: '2026年11月13日 - 11月14日',
    timeRange: '09:00 - 18:00（14日延至21:00）',
    location: '北京国家会议中心E3馆',
    address: '北京市朝阳区天辰东路7号',
    booth: 'B区23号展台',
    requiredDocs: ['本人身份证原件', '报名确认单（电子即可）', '健康承诺书（现场签署）']
  },
  qrCode: 'BJM2026-E001-A12345-RUNNER',
  weather: '晴',
  temperature: '8°C - 15°C',
  reminders: [
    '比赛日气温较低，建议赛前穿保暖外套，存包时脱下',
    'A区选手请于6:30前到达起点检录',
    '起点设有厕所和热身区，请合理安排时间',
    '赛道每5公里设有补水站，25公里后提供能量补给'
  ]
};

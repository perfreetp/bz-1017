import { UserProfile, Team } from '../types';

export const mockUser: UserProfile = {
  id: 'u001',
  avatar: 'https://picsum.photos/id/1012/200/200',
  nickname: '追风少年',
  realName: '张明',
  phone: '138****8888',
  idCardNumber: '110101********1234',
  gender: 'male',
  birthday: '1995-06-15',
  shirtSize: 'L',
  bloodType: 'O型',
  emergencyContact: {
    name: '李华',
    phone: '139****9999',
    relation: '配偶'
  },
  totalRaces: 12,
  totalDistance: 486.5,
  bestRecords: [
    { distance: '全马', time: '3:42:18' },
    { distance: '半马', time: '1:42:30' },
    { distance: '10公里', time: '46:15' }
  ]
};

export const mockTeams: Team[] = [
  {
    id: 't001',
    name: '飞毛腿战队',
    leaderId: 'u001',
    leaderName: '张明',
    eventId: 'e007',
    groupId: 'g014',
    inviteCode: 'TEAM2026CD',
    maxMembers: 6,
    createdAt: '2026-09-25',
    members: [
      { id: 'm001', name: '张明', phone: '138****8888', status: 'paid', shirtSize: 'L' },
      { id: 'm002', name: '李强', phone: '137****7777', status: 'paid', shirtSize: 'XL' },
      { id: 'm003', name: '王芳', phone: '136****6666', status: 'paid', shirtSize: 'M' },
      { id: 'm004', name: '赵磊', phone: '135****5555', status: 'pending', shirtSize: 'L' },
      { id: 'm005', name: '陈静', phone: '134****4444', status: 'registered', shirtSize: 'S' }
    ]
  }
];

export const shirtSizes = [
  { value: 'XS', label: 'XS（适合身高155-160cm）', chest: '96', length: '60' },
  { value: 'S', label: 'S（适合身高160-165cm）', chest: '100', length: '62' },
  { value: 'M', label: 'M（适合身高165-170cm）', chest: '104', length: '64' },
  { value: 'L', label: 'L（适合身高170-175cm）', chest: '108', length: '66' },
  { value: 'XL', label: 'XL（适合身高175-180cm）', chest: '112', length: '68' },
  { value: 'XXL', label: 'XXL（适合身高180-185cm）', chest: '116', length: '70' },
  { value: 'XXXL', label: 'XXXL（适合身高185cm以上）', chest: '120', length: '72' }
];

export const bloodTypes = ['A型', 'B型', 'AB型', 'O型', '不清楚'];

export const idCardTypes = [
  { value: 'idcard', label: '居民身份证' },
  { value: 'passport', label: '护照' },
  { value: 'hkmacao', label: '港澳居民来往内地通行证' },
  { value: 'taiwan', label: '台湾居民来往大陆通行证' }
];

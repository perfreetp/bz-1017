export interface EventCategory {
  id: string;
  name: string;
  icon: string;
}

export interface EventGroup {
  id: string;
  name: string;
  distance: string;
  price: number;
  totalQuota: number;
  remainingQuota: number;
  cutoffTime: string;
  description: string;
}

export interface MarathonEvent {
  id: string;
  title: string;
  subtitle: string;
  coverImage: string;
  location: string;
  date: string;
  signupDeadline: string;
  status: 'open' | 'full' | 'closed' | 'upcoming';
  categories: string[];
  groups: EventGroup[];
  features: string[];
  description: string;
  rules: string[];
  routeImage: string;
  faqs: { question: string; answer: string }[];
  medalImage: string;
  organizer: string;
  tags: string[];
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface RegistrationForm {
  realName: string;
  idCardType: string;
  idCardNumber: string;
  gender: 'male' | 'female';
  birthday: string;
  phone: string;
  email: string;
  nationality: string;
  address: string;
  shirtSize: string;
  emergencyContact: EmergencyContact;
  certificateUrl: string;
  bloodType: string;
  medicalHistory: string;
  agreeTerms: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  phone: string;
  status: 'registered' | 'pending' | 'paid';
  shirtSize: string;
}

export interface Team {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  eventId: string;
  groupId: string;
  inviteCode: string;
  members: TeamMember[];
  maxMembers: number;
  createdAt: string;
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'pending_review'
  | 'reviewing'
  | 'review_passed'
  | 'review_failed'
  | 'refund_applying'
  | 'refunded'
  | 'refund_rejected'
  | 'cancelled';

export interface PaymentRecord {
  id: string;
  amount: number;
  method: 'wechat' | 'alipay' | 'refund';
  status: 'success' | 'pending' | 'failed';
  paidAt?: string;
  refundedAt?: string;
  transactionNo?: string;
  remark?: string;
}

export interface RegistrationOrder {
  id: string;
  orderNo: string;
  eventId: string;
  eventTitle: string;
  eventCover: string;
  groupId: string;
  groupName: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  paidAt?: string;
  paymentRecords?: PaymentRecord[];
  refundAmount?: number;
  reviewResult?: string;
  reviewComment?: string;
  reviewMaterials?: string[];
  bibNumber?: string;
  pickupInfo?: {
    date: string;
    time: string;
    location: string;
    booth: string;
  };
  qrCode?: string;
  runnerInfo: {
    name: string;
    idCardLast4: string;
    shirtSize: string;
    phone: string;
    gender?: string;
  };
  isTeamRegistration: boolean;
  teamName?: string;
  teamMemberCount?: number;
  teamMembers?: TeamMember[];
  lockedFields: string[];
}

export interface UserProfile {
  id: string;
  avatar: string;
  nickname: string;
  realName: string;
  phone: string;
  idCardNumber: string;
  gender: 'male' | 'female';
  birthday: string;
  shirtSize: string;
  bloodType: string;
  emergencyContact: EmergencyContact;
  totalRaces: number;
  totalDistance: number;
  bestRecords: { distance: string; time: string }[];
}

export interface Notification {
  id: string;
  type: 'system' | 'review' | 'event' | 'pickup' | 'payment';
  title: string;
  content: string;
  orderId?: string;
  createdAt: string;
  isRead: boolean;
}

export interface RaceAssistantInfo {
  eventId: string;
  eventTitle: string;
  bibNumber: string;
  corral: string;
  startTime: string;
  raceDate: string;
  pickupInfo: {
    date: string;
    timeRange: string;
    location: string;
    address: string;
    booth: string;
    requiredDocs: string[];
  };
  qrCode: string;
  weather: string;
  temperature: string;
  reminders: string[];
}

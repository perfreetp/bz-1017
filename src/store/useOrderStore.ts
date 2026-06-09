import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Taro from '@tarojs/taro';
import { RegistrationOrder, OrderStatus, TeamMember } from '../types';
import { mockOrders, mockNotifications, mockRaceAssistant } from '../data/orders';
import { Notification, RaceAssistantInfo } from '../types';
import { mockUser } from '../data/user';

const taroStorage = {
  getItem: (name: string) => {
    try {
      return Taro.getStorageSync(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      Taro.setStorageSync(name, value);
    } catch (e) {
      console.error('[Storage] setItem failed:', e);
    }
  },
  removeItem: (name: string) => {
    try {
      Taro.removeStorageSync(name);
    } catch (e) {
      console.error('[Storage] removeItem failed:', e);
    }
  }
};

interface OrderStore {
  orders: RegistrationOrder[];
  notifications: Notification[];
  raceAssistant: RaceAssistantInfo;

  addOrder: (order: RegistrationOrder) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, extra?: Partial<RegistrationOrder>) => void;
  updateTeamMembers: (orderId: string, members: TeamMember[]) => void;
  markOrderPaid: (orderId: string, payMethod?: 'wechat' | 'alipay') => void;
  submitRefund: (orderId: string, reason: string, mode?: 'full' | 'member', memberIds?: string[]) => void;
  resubmitMaterials: (orderId: string, certificateUrl?: string) => void;
  getOrderById: (orderId: string) => RegistrationOrder | undefined;

  addNotification: (notif: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markNotifRead: (notifId: string) => void;
  markAllNotifsRead: () => void;
  getNotificationsByOrderId: (orderId: string) => Notification[];
}

const generateOrderNo = (eventId: string): string => {
  const prefix = eventId.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'MR';
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = String(Math.floor(Math.random() * 900000) + 100000);
  return `${prefix}${dateStr}${random}`;
};

const maskPhone = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

const maskIdCard = (id: string): string => {
  if (!id) return '';
  if (id.length >= 4) return id.slice(-4);
  return id;
};

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [...mockOrders],
      notifications: [...mockNotifications],
      raceAssistant: { ...mockRaceAssistant },

      addOrder: (order) => {
        set((state) => ({ orders: [order, ...state.orders] }));
        console.log('[Store] addOrder:', order.id, order.status, 'teamMembers:', order.teamMembers?.length);
      },

      updateOrderStatus: (orderId, status, extra) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status, ...(extra || {}) } : o
          )
        }));
        const order = get().getOrderById(orderId);
        if (order) {
          const statusMetaMap: Partial<Record<OrderStatus, {
            type: 'payment' | 'review' | 'refund' | 'event' | 'resubmit';
            text: string;
            anchor: 'review' | 'payment' | 'refund' | 'timeline' | 'materials';
          }>> = {
            paid: { type: 'payment', text: '支付成功', anchor: 'payment' },
            pending_review: { type: 'payment', text: '进入审核', anchor: 'review' },
            reviewing: { type: 'review', text: '审核中', anchor: 'review' },
            review_passed: { type: 'review', text: '审核通过', anchor: 'review' },
            review_failed: { type: 'review', text: '审核未通过', anchor: 'materials' },
            refund_applying: { type: 'refund', text: '退款申请中', anchor: 'refund' },
            refunded: { type: 'refund', text: '已退款', anchor: 'refund' },
            refund_rejected: { type: 'refund', text: '退款被拒绝', anchor: 'refund' },
            cancelled: { type: 'event', text: '已取消', anchor: 'timeline' }
          };
          const meta = statusMetaMap[status];
          if (meta) {
            get().addNotification({
              type: meta.type,
              title: `${order.eventTitle} ${meta.text}`,
              content: extra?.reviewComment || `您的订单状态已更新为「${meta.text}」`,
              orderId,
              anchor: meta.anchor
            });
          }
        }
      },

      updateTeamMembers: (orderId, members) => {
        console.log('[Store] updateTeamMembers:', orderId, members.length);
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  teamMembers: members,
                  teamMemberCount: members.length
                }
              : o
          )
        }));
      },

      markOrderPaid: (orderId, payMethod = 'wechat') => {
        const now = new Date();
        const paidAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const order = get().getOrderById(orderId);
        const extra: Partial<RegistrationOrder> = { paidAt };

        if (order) {
          const payRecord = {
            id: `p${Date.now()}`,
            amount: order.amount,
            method: payMethod as 'wechat' | 'alipay',
            status: 'success' as const,
            paidAt,
            transactionNo: `${payMethod.toUpperCase()}${Date.now()}`
          };
          extra.paymentRecords = [...(order.paymentRecords || []), payRecord];

          if (order.isTeamRegistration && order.teamMembers && order.teamMembers.length > 0) {
            extra.teamMembers = order.teamMembers.map((m) => ({ ...m, status: 'paid' as const }));
            console.log('[Store] markOrderPaid team:', order.teamMembers.length, 'members set to paid');
          }
        }

        get().updateOrderStatus(orderId, 'paid', extra);

        setTimeout(() => {
          get().updateOrderStatus(orderId, 'pending_review');
          setTimeout(() => {
            get().updateOrderStatus(orderId, 'reviewing');
          }, 2000);
        }, 1500);
      },

      submitRefund: (orderId, reason) => {
        const order = get().getOrderById(orderId);
        if (order) {
          const now = new Date();
          const arrivalDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          const expectedArrival = `${arrivalDate.getFullYear()}-${String(arrivalDate.getMonth() + 1).padStart(2, '0')}-${String(arrivalDate.getDate()).padStart(2, '0')}`;
          const isTeamOrder = !!order.isTeamRegistration;
          const memberCount = order.teamMemberCount || order.teamMembers?.length || 1;
          const unitPrice = memberCount > 0 ? order.amount / memberCount : order.amount;

          const refundAmountCalc = () => {
            if (mode === 'member' && memberIds && isTeamOrder) {
              return Math.min(
                memberIds.length * unitPrice,
                order.amount - (order.refundAmount || 0)
              );
            }
            return order.amount - (order.refundAmount || 0);
          };
          const refundAmount = refundAmountCalc();

          const refundRecord: PaymentRecord = {
            id: `r${Date.now()}`,
            amount: refundAmount,
            method: 'refund',
            status: 'pending',
            refundedAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
            remark: reason,
            refundMode: mode,
            memberIds,
            expectedArrivalDate: expectedArrival,
            refundProgress: '提交申请 · 等待审核',
            reviewDays: 3
          };

          let updatedMembers = order.teamMembers ? [...order.teamMembers] : undefined;
          if (updatedMembers) {
            updatedMembers = updatedMembers.map((m) => {
              if (mode === 'full') {
                return { ...m, refundStatus: 'applying' as const, refundAmount: (m.refundAmount || 0) + unitPrice };
              }
              if (mode === 'member' && memberIds?.includes(m.id)) {
                return { ...m, refundStatus: 'applying' as const, refundAmount: (m.refundAmount || 0) + unitPrice };
              }
              return m;
            });
          }

          get().updateOrderStatus(orderId, 'refund_applying', {
            paymentRecords: [...(order.paymentRecords || []), refundRecord],
            refundAmount: (order.refundAmount || 0) + refundAmount,
            teamMembers: updatedMembers
          });
        } else {
          get().updateOrderStatus(orderId, 'refund_applying');
        }
        console.log('[Store] submitRefund:', orderId, mode, reason, 'memberIds:', memberIds?.length);
      },

      resubmitMaterials: (orderId, certificateUrl) => {
        const order = get().getOrderById(orderId);
        if (order) {
          get().addNotification({
            type: 'resubmit',
            title: `${order.eventTitle} 补件已提交`,
            content: '您已重新提交报名资料，将再次进入审核队列',
            orderId,
            anchor: 'review'
          });
        }
        const extra: Partial<RegistrationOrder> = {};
        if (certificateUrl) {
          extra.runnerInfo = {
            ...(get().getOrderById(orderId)?.runnerInfo || {
              name: mockUser.realName,
              idCardLast4: maskIdCard(mockUser.idCardNumber),
              shirtSize: mockUser.shirtSize,
              phone: maskPhone(mockUser.phone)
            })
          };
        }
        get().updateOrderStatus(orderId, 'reviewing', {
          ...extra,
          reviewResult: undefined,
          reviewComment: certificateUrl ? '补件已上传，等待重新审核' : undefined,
          reviewMaterials: []
        });
        console.log('[Store] resubmitMaterials:', orderId);
      },

      getOrderById: (orderId) => {
        return get().orders.find((o) => o.id === orderId);
      },

      addNotification: (notif) => {
        const newNotif: Notification = {
          ...notif,
          id: `n${Date.now()}`,
          createdAt: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
          isRead: false
        };
        set((state) => ({ notifications: [newNotif, ...state.notifications] }));
      },

      markNotifRead: (notifId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notifId ? { ...n, isRead: true } : n
          )
        }));
      },

      markAllNotifsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true }))
        }));
      },

      getNotificationsByOrderId: (orderId) => {
        return get().notifications.filter((n) => n.orderId === orderId);
      }
    }),
    {
      name: 'marathon-order-store',
      storage: createJSONStorage(() => taroStorage)
    }
  )
);

export { generateOrderNo, maskPhone, maskIdCard };

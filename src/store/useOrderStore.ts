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
  markOrderPaid: (orderId: string) => void;
  submitRefund: (orderId: string, reason: string) => void;
  resubmitMaterials: (orderId: string, certificateUrl?: string) => void;
  getOrderById: (orderId: string) => RegistrationOrder | undefined;

  addNotification: (notif: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markNotifRead: (notifId: string) => void;
  markAllNotifsRead: () => void;
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
          const statusTextMap: Partial<Record<OrderStatus, string>> = {
            paid: '支付成功',
            pending_review: '进入审核',
            reviewing: '审核中',
            review_passed: '审核通过',
            review_failed: '审核未通过',
            refund_applying: '退款申请中',
            refunded: '已退款',
            refund_rejected: '退款被拒绝',
            cancelled: '已取消'
          };
          if (statusTextMap[status]) {
            get().addNotification({
              type: status.startsWith('refund') ? 'payment' : status.startsWith('review') ? 'review' : 'payment',
              title: `${order.eventTitle} ${statusTextMap[status]}`,
              content: extra?.reviewComment || `您的订单状态已更新为「${statusTextMap[status]}」`,
              orderId
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

      markOrderPaid: (orderId) => {
        const now = new Date();
        const paidAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const order = get().getOrderById(orderId);
        const extra: Partial<RegistrationOrder> = { paidAt };

        if (order?.isTeamRegistration && order.teamMembers && order.teamMembers.length > 0) {
          extra.teamMembers = order.teamMembers.map((m) => ({ ...m, status: 'paid' as const }));
          console.log('[Store] markOrderPaid team:', order.teamMembers.length, 'members set to paid');
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
        get().updateOrderStatus(orderId, 'refund_applying');
        console.log('[Store] submitRefund:', orderId, reason);
      },

      resubmitMaterials: (orderId, certificateUrl) => {
        const extra: Partial<RegistrationOrder> = {};
        if (certificateUrl) {
          extra.runnerInfo = {
            ...(get().getOrderById(orderId)?.runnerInfo || {
              name: mockUser.realName,
              idCardLast4: maskIdCard(mockUser.idCardNumber),
              shirtSize: mockUser.shirtSize,
              phone: maskPhone(mockUser.phone)
            }),
            ...(certificateUrl ? {} : {})
          };
        }
        get().updateOrderStatus(orderId, 'reviewing', {
          ...extra,
          reviewResult: undefined,
          reviewComment: undefined,
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
      }
    }),
    {
      name: 'marathon-order-store',
      storage: createJSONStorage(() => taroStorage)
    }
  )
);

export { generateOrderNo, maskPhone, maskIdCard };

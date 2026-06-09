import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockRaceAssistant } from '../../data/orders';
import { useOrderStore } from '../../store/useOrderStore';
import SectionHeader from '../../components/SectionHeader';
import EmptyState from '../../components/EmptyState';
import { countdownTo, showToast, copyToClipboard, navigateTo } from '../../utils';
import { Notification, RegistrationOrder } from '../../types';

const AssistantPage: React.FC = () => {
  const router = useRouter();
  const orderIdParam = router.params.orderId || '';

  const getOrderById = useOrderStore((s) => s.getOrderById);
  const orders = useOrderStore((s) => s.orders);
  const notifications = useOrderStore((s) => s.notifications);
  const markNotifRead = useOrderStore((s) => s.markNotifRead);
  const markAllNotifsRead = useOrderStore((s) => s.markAllNotifsRead);

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });

  const passedOrder: RegistrationOrder | undefined = useMemo(() => {
    if (orderIdParam) {
      const o = getOrderById(orderIdParam);
      if (o && o.status === 'review_passed') return o;
      return undefined;
    }
    return orders.find((o) => o.status === 'review_passed');
  }, [orderIdParam, orders, getOrderById]);

  const hasUpcomingRace = !!passedOrder;

  const assistantInfo = useMemo(() => {
    if (passedOrder?.bibNumber) {
      return {
        ...mockRaceAssistant,
        eventId: passedOrder.eventId,
        eventTitle: passedOrder.eventTitle,
        bibNumber: passedOrder.bibNumber,
        qrCode: passedOrder.qrCode || mockRaceAssistant.qrCode,
        pickupInfo: passedOrder.pickupInfo
          ? {
              ...mockRaceAssistant.pickupInfo,
              date: passedOrder.pickupInfo.date,
              timeRange: passedOrder.pickupInfo.time,
              location: passedOrder.pickupInfo.location,
              booth: passedOrder.pickupInfo.booth
            }
          : mockRaceAssistant.pickupInfo
      };
    }
    return mockRaceAssistant;
  }, [passedOrder]);

  useEffect(() => {
    const targetDate = '2026-11-15T07:30:00';
    const updateCountdown = () => {
      setCountdown(countdownTo(targetDate));
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    console.log('[Assistant] refresh');
    setTimeout(() => {
      try {
        if (typeof Taro.stopPullDownRefresh === 'function') {
          Taro.stopPullDownRefresh();
        }
      } catch (e) {
        // ignore
      }
      showToast('刷新成功', 'success');
    }, 800);
  };

  useEffect(() => {
    try {
      if (typeof Taro.onPullDownRefresh === 'function') {
        Taro.onPullDownRefresh(handleRefresh);
      }
    } catch (e) {
      console.warn('[Assistant] onPullDownRefresh not supported');
    }
    return () => {
      try {
        if (typeof Taro.offPullDownRefresh === 'function') {
          Taro.offPullDownRefresh(handleRefresh);
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  useDidShow(() => {
    console.log('[Assistant] didShow, passed:', !!passedOrder, 'bib:', passedOrder?.bibNumber);
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    markAllNotifsRead();
    showToast('已全部标记为已读', 'success');
  };

  const notifIconMap: Record<string, string> = {
    system: '🔔',
    review: '✅',
    event: '🏃',
    pickup: '📦',
    payment: '💰'
  };

  const handleClickNotif = (notif: Notification) => {
    markNotifRead(notif.id);
    if (notif.orderId) {
      if (notif.type === 'review') {
        navigateTo(`/pages/review/index?orderId=${notif.orderId}`);
      } else {
        navigateTo(`/pages/orderDetail/index?orderId=${notif.orderId}`);
      }
    }
  };

  // 有 orderId 但该订单未审核通过，显示专属空状态
  if (orderIdParam && !passedOrder) {
    const order = getOrderById(orderIdParam);
    return (
      <ScrollView scrollY className={styles.page} style={{ height: '100vh' }}>
        <View className="pageContainer">
          <EmptyState
            icon="⏳"
            title={order ? '审核未完成，暂未生成参赛信息' : '订单不存在'}
            description={
              order
                ? '当前订单状态：审核中，待审核通过后这里将自动展示参赛号、领物时间、检录二维码等参赛信息'
                : '请返回列表后重新查看'
            }
            actionText={order ? '查看订单详情' : '返回报名列表'}
            onAction={() => {
              if (order) {
                navigateTo(`/pages/orderDetail/index?orderId=${orderIdParam}`);
              } else {
                Taro.switchTab({ url: '/pages/orders/index' }).catch(() => {});
              }
            }}
          />
        </View>
      </ScrollView>
    );
  }

  if (!hasUpcomingRace) {
    return (
      <ScrollView scrollY className={styles.page} style={{ height: '100vh' }}>
        <View className="pageContainer">
          <EmptyState
            icon="🎯"
            title="暂无即将开始的赛事"
            description="报名成功的赛事审核通过后，这里将为您提供专属参赛助手服务（参赛号、领物信息、检录二维码、赛前提醒等）"
            actionText="去报名"
            onAction={() => Taro.switchTab({ url: '/pages/home/index' })}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView scrollY className={styles.page} style={{ height: '100vh' }}>
      <View className="pageContainer">
        <View className={styles.heroCard}>
          <View className={styles.heroBg} />
          <Text className={styles.heroLabel}>距离开赛还有</Text>
          <Text className={styles.heroTitle}>{assistantInfo.eventTitle}</Text>
          <View className={styles.countdown}>
            <View className={styles.countdownItem}>
              <Text className={styles.countdownNum}>{countdown.days}</Text>
              <Text className={styles.countdownUnit}>天</Text>
            </View>
            <View className={styles.countdownItem}>
              <Text className={styles.countdownNum}>{String(countdown.hours).padStart(2, '0')}</Text>
              <Text className={styles.countdownUnit}>时</Text>
            </View>
            <View className={styles.countdownItem}>
              <Text className={styles.countdownNum}>{String(countdown.minutes).padStart(2, '0')}</Text>
              <Text className={styles.countdownUnit}>分</Text>
            </View>
            <View className={styles.countdownItem}>
              <Text className={styles.countdownNum}>{String(countdown.seconds).padStart(2, '0')}</Text>
              <Text className={styles.countdownUnit}>秒</Text>
            </View>
          </View>
        </View>

        <View className={styles.infoGrid}>
          <View className={styles.infoCard}>
            <Text className={styles.infoCardIcon}>🎫</Text>
            <Text className={styles.infoCardLabel}>参赛号</Text>
            <Text className={styles.infoCardValue}>{assistantInfo.bibNumber}</Text>
          </View>
          <View className={styles.infoCard}>
            <Text className={styles.infoCardIcon}>🏁</Text>
            <Text className={styles.infoCardLabel}>起跑区域</Text>
            <Text className={styles.infoCardValue}>{assistantInfo.corral}</Text>
          </View>
          <View className={styles.infoCard}>
            <Text className={styles.infoCardIcon}>🌤️</Text>
            <Text className={styles.infoCardLabel}>比赛天气</Text>
            <Text className={styles.infoCardValue}>{assistantInfo.weather} {assistantInfo.temperature}</Text>
          </View>
          <View className={styles.infoCard}>
            <Text className={styles.infoCardIcon}>⏰</Text>
            <Text className={styles.infoCardLabel}>起跑时间</Text>
            <Text className={styles.infoCardValue} style={{ fontSize: '26rpx' }}>{assistantInfo.startTime}</Text>
          </View>
        </View>

        <View className={styles.qrSection}>
          <Text className={styles.qrTitle}>检录二维码</Text>
          <Text className={styles.qrSubtitle}>比赛日入场检录使用，请妥善保管</Text>
          <View className={styles.qrWrapper} onClick={() => copyToClipboard(assistantInfo.qrCode, '二维码内容已复制')}>
            <Image
              className={styles.qrCode}
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(assistantInfo.qrCode)}`}
              mode="aspectFit"
            />
          </View>
          <Text className={styles.qrCodeData}>{assistantInfo.qrCode}</Text>
          <Text className={styles.qrTips}>
            💡 提示：请截图保存二维码，比赛日提前到达起点检录区进行扫描
          </Text>
        </View>

        <SectionHeader title="领物信息" subtitle="请在规定时间内领取参赛包" />
        <View className={styles.pickupSection}>
          <View className={styles.pickupRow}>
            <Text className={styles.pickupIcon}>📅</Text>
            <View className={styles.pickupContent}>
              <Text className={styles.pickupLabel}>领物日期</Text>
              <Text className={styles.pickupValue}>{assistantInfo.pickupInfo.date}</Text>
            </View>
          </View>
          <View className={styles.pickupRow}>
            <Text className={styles.pickupIcon}>⏱️</Text>
            <View className={styles.pickupContent}>
              <Text className={styles.pickupLabel}>领物时间</Text>
              <Text className={styles.pickupValue}>{assistantInfo.pickupInfo.timeRange}</Text>
            </View>
          </View>
          <View className={styles.pickupRow}>
            <Text className={styles.pickupIcon}>📍</Text>
            <View className={styles.pickupContent}>
              <Text className={styles.pickupLabel}>领物地点</Text>
              <Text className={styles.pickupValue}>
                {assistantInfo.pickupInfo.location}
                {'\n'}
                {assistantInfo.pickupInfo.address}
                {'\n'}
                {assistantInfo.pickupInfo.booth}
              </Text>
            </View>
          </View>
          <View className={styles.pickupRow}>
            <Text className={styles.pickupIcon}>📋</Text>
            <View className={styles.pickupContent}>
              <Text className={styles.pickupLabel}>所需证件</Text>
              <View className={styles.docsList}>
                {assistantInfo.pickupInfo.requiredDocs.map((doc, i) => (
                  <View key={i} className={styles.docTag}>
                    <Text>{doc}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <SectionHeader title="赛前提醒" subtitle="重要事项请仔细阅读" />
        <View className={styles.reminders}>
          {assistantInfo.reminders.map((reminder, idx) => (
            <View key={idx} className={styles.reminderItem}>
              <View className={styles.reminderBullet} />
              <Text className={styles.reminderText}>{reminder}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: '$spacing-xl', marginTop: '$spacing-xl' }} />

        <View className={styles.notificationHeader}>
          <Text className={styles.notificationTitle}>消息通知</Text>
          {unreadCount > 0 ? (
            <Text className={styles.notificationBadge} onClick={markAllRead}>
              {unreadCount}条未读 · 全部已读
            </Text>
          ) : null}
        </View>

        <View className={styles.notificationList}>
          {notifications.slice(0, 4).map((notif) => (
            <View
              key={notif.id}
              className={classnames(styles.notificationItem, !notif.isRead && styles.unread)}
              onClick={() => handleClickNotif(notif)}
            >
              <View className={styles.notificationIcon}>
                <Text>{notifIconMap[notif.type] || '📩'}</Text>
              </View>
              <View className={styles.notificationBody}>
                <Text className={styles.notificationItemTitle}>{notif.title}</Text>
                <Text className={styles.notificationContent}>{notif.content}</Text>
                <Text className={styles.notificationTime}>{notif.createdAt}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default AssistantPage;

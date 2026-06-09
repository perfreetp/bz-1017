import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockRaceAssistant } from '../../data/orders';
import { useOrderStore } from '../../store/useOrderStore';
import SectionHeader from '../../components/SectionHeader';
import EmptyState from '../../components/EmptyState';
import { countdownTo, showToast, copyToClipboard, navigateTo, getStatusText } from '../../utils';
import { Notification, RegistrationOrder } from '../../types';

const statusConfig: Record<string, { icon: string; title: string; tip: string; color: string; bg: string }> = {
  pending_payment: { icon: '⏳', title: '订单待支付', tip: '您的订单尚未完成支付，请及时支付以免名额失效', color: '#DD6B20', bg: 'rgba(221,107,32,0.08)' },
  paid: { icon: '✅', title: '支付成功待审核', tip: '已收到您的报名费，报名资料即将进入审核队列', color: '#38A169', bg: 'rgba(56,161,105,0.08)' },
  pending_review: { icon: '📦', title: '资料待审核', tip: '资料已提交，预计1-3个工作日内完成审核', color: '#3182CE', bg: 'rgba(49,130,206,0.08)' },
  reviewing: { icon: '🔍', title: '资料审核中', tip: '审核人员正在核验您的报名信息和成绩证明', color: '#3182CE', bg: 'rgba(49,130,206,0.08)' },
  review_failed: { icon: '⚠️', title: '资料审核未通过', tip: '请按要求补充资料或修改信息后重新提交审核', color: '#E74C3C', bg: 'rgba(231,76,60,0.08)' },
  refund_applying: { icon: '💸', title: '退款申请中', tip: '您的退款申请正在处理，请耐心等待审核', color: '#DD6B20', bg: 'rgba(221,107,32,0.08)' },
  refunded: { icon: '💰', title: '已退款', tip: '退款已完成，感谢您对本次赛事的关注', color: '#718096', bg: 'rgba(113,128,150,0.08)' },
  cancelled: { icon: '🚫', title: '订单已取消', tip: '欢迎报名其他马拉松赛事', color: '#A0AEC0', bg: 'rgba(160,174,192,0.08)' }
};

const AssistantPage: React.FC = () => {
  const router = useRouter();
  const orderIdParam = router.params.orderId || '';

  const getOrderById = useOrderStore((s) => s.getOrderById);
  const orders = useOrderStore((s) => s.orders);
  const notifications = useOrderStore((s) => s.notifications);
  const markNotifRead = useOrderStore((s) => s.markNotifRead);
  const markAllNotifsRead = useOrderStore((s) => s.markAllNotifsRead);
  const _notifications = useOrderStore((s) => s.notifications);
  const _orders = useOrderStore((s) => s.orders);

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });

  // 分类：审核通过 / 其他
  const { passedOrders, otherOrders } = useMemo(() => {
    const passed: RegistrationOrder[] = [];
    const other: RegistrationOrder[] = [];
    orders.forEach((o) => {
      if (o.status === 'review_passed') passed.push(o);
      else other.push(o);
    });
    return { passedOrders: passed, otherOrders: other };
  }, [orders, _orders]);

  const [activeOrderId, setActiveOrderId] = useState<string>(() => {
    if (orderIdParam) return orderIdParam;
    return passedOrders[0]?.id || otherOrders[0]?.id || '';
  });

  useDidShow(() => {
    if (orderIdParam && orderIdParam !== activeOrderId) {
      setActiveOrderId(orderIdParam);
    }
  });

  const activeOrder = useMemo(
    () => (activeOrderId ? getOrderById(activeOrderId) : undefined),
    [activeOrderId, getOrderById, _orders]
  );

  const isPassed = activeOrder?.status === 'review_passed';

  const assistantInfo = useMemo(() => {
    if (activeOrder && activeOrder.status === 'review_passed' && activeOrder.bibNumber) {
      return {
        ...mockRaceAssistant,
        eventId: activeOrder.eventId,
        eventTitle: activeOrder.eventTitle,
        bibNumber: activeOrder.bibNumber,
        qrCode: activeOrder.qrCode || mockRaceAssistant.qrCode,
        pickupInfo: activeOrder.pickupInfo
          ? {
              ...mockRaceAssistant.pickupInfo,
              date: activeOrder.pickupInfo.date,
              timeRange: activeOrder.pickupInfo.time,
              location: activeOrder.pickupInfo.location,
              address: activeOrder.pickupInfo.location,
              booth: activeOrder.pickupInfo.booth
            }
          : mockRaceAssistant.pickupInfo
      };
    }
    return activeOrder
      ? { ...mockRaceAssistant, eventId: activeOrder.eventId, eventTitle: activeOrder.eventTitle }
      : mockRaceAssistant;
  }, [activeOrder]);

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
    setTimeout(() => {
      try {
        if (typeof Taro.stopPullDownRefresh === 'function') {
          Taro.stopPullDownRefresh();
        }
      } catch (e) { /* ignore */ }
      showToast('刷新成功', 'success');
    }, 800);
  };

  useEffect(() => {
    try {
      if (typeof Taro.onPullDownRefresh === 'function') {
        Taro.onPullDownRefresh(handleRefresh);
      }
    } catch (e) { /* ignore */ }
    return () => {
      try {
        if (typeof Taro.offPullDownRefresh === 'function') {
          Taro.offPullDownRefresh(handleRefresh);
        }
      } catch (e) { /* ignore */ }
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    markAllNotifsRead();
    showToast('已全部标记为已读', 'success');
  };

  const notifIconMap: Record<string, string> = {
    system: '🔔', review: '✅', event: '🏃', pickup: '📦',
    payment: '💰', refund: '↩️', resubmit: '📝'
  };

  const handleClickNotif = (notif: Notification) => {
    markNotifRead(notif.id);
    if (notif.orderId) {
      if (notif.type === 'review') {
        navigateTo(`/pages/review/index?orderId=${notif.orderId}`);
      } else {
        navigateTo(`/pages/orderDetail/index?orderId=${notif.orderId}&anchor=${notif.anchor || 'timeline'}`);
      }
    }
  };

  const handleOrderClick = (orderId: string) => {
    navigateTo(`/pages/orderDetail/index?orderId=${orderId}`);
  };

  const handlePay = () => {
    if (!activeOrder) return;
    const base = `/pages/payment/index?orderId=${activeOrder.id}&eventId=${activeOrder.eventId}&groupId=${activeOrder.groupId}&mode=${activeOrder.isTeamRegistration ? 'team' : 'single'}`;
    if (activeOrder.isTeamRegistration) {
      navigateTo(
        `${base}&teamName=${encodeURIComponent(activeOrder.teamName || '')}&memberCount=${activeOrder.teamMemberCount || activeOrder.teamMembers?.length || 1}&totalAmount=${activeOrder.amount}`
      );
    } else {
      navigateTo(base);
    }
  };

  const statusData = activeOrder ? (statusConfig[activeOrder.status] || { icon: '📋', title: getStatusText(activeOrder.status), tip: '欢迎报名', color: '#718096', bg: 'rgba(113,128,150,0.08)' }) : null;

  // 所有订单都没有时，显示空状态
  if (!activeOrder && passedOrders.length === 0 && otherOrders.length === 0) {
    return (
      <ScrollView scrollY className={styles.page} style={{ height: '100vh' }}>
        <View className="pageContainer">
          <EmptyState
            icon="🎯"
            title="暂无赛事信息"
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

        {/* ===== 订单切换栏 ===== */}
        {(passedOrders.length > 1 || (passedOrders.length + otherOrders.length) > 1) && (
          <View className={styles.orderSwitcher}>
            {passedOrders.length > 0 && (
              <>
                <View className={styles.switcherGroupTitle}>
                  <Text style={{ color: '#38A169', fontWeight: 600 }}>✓ 审核通过</Text>
                  <Text>{passedOrders.length}场</Text>
                </View>
                <View className={styles.orderTabs}>
                  {passedOrders.map((o) => (
                    <View
                      key={o.id}
                      className={classnames(styles.orderTab, activeOrderId === o.id && styles.orderTabActive)}
                      onClick={() => setActiveOrderId(o.id)}
                    >
                      <Text className={styles.orderTabTitle}>
                        {o.eventTitle.length > 8 ? o.eventTitle.substring(0, 8) + '...' : o.eventTitle}
                      </Text>
                      {o.isTeamRegistration && <Text className={styles.orderTabTag}>团队</Text>}
                      <Text className={styles.orderTabBib}>参赛号 {o.bibNumber}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {otherOrders.length > 0 && (
              <>
                <View className={styles.switcherGroupTitle}>
                  <Text style={{ color: '#718096', fontWeight: 600 }}>其他订单</Text>
                  <Text>{otherOrders.length}张</Text>
                </View>
                <View className={styles.orderTabs}>
                  {otherOrders.map((o) => (
                    <View
                      key={o.id}
                      className={classnames(styles.orderTab, styles.orderTabOther, activeOrderId === o.id && styles.orderTabActive)}
                      onClick={() => setActiveOrderId(o.id)}
                    >
                      <Text className={styles.orderTabTitle}>
                        {o.eventTitle.length > 8 ? o.eventTitle.substring(0, 8) + '...' : o.eventTitle}
                      </Text>
                      <Text className={classnames(styles.orderTabStatus, `status-${o.status}`)}>
                        {getStatusText(o.status)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* ===== 当前订单状态卡 ===== */}
        {activeOrder && !isPassed && statusData && (
          <View className={styles.statusCard} style={{ background: statusData.bg }}>
            <View className={styles.statusCardLeft}>
              <Text className={styles.statusCardIcon}>{statusData.icon}</Text>
              <View className={styles.statusCardText}>
                <Text className={styles.statusCardTitle} style={{ color: statusData.color }}>
                  {statusData.title}
                </Text>
                <Text className={styles.statusCardTip}>{statusData.tip}</Text>
                <Text className={styles.statusCardMeta}>
                  订单号：{activeOrder.orderNo}
                  {activeOrder.isTeamRegistration && ` · 团队·${activeOrder.teamMemberCount || activeOrder.teamMembers?.length || 1}人`}
                </Text>
              </View>
            </View>
            <View className={styles.statusCardActions}>
              {activeOrder.status === 'pending_payment' && (
                <View className={styles.statusBtn} onClick={handlePay}>
                  立即支付
                </View>
              )}
              {activeOrder.status === 'review_failed' && (
                <View
                  className={styles.statusBtn}
                  onClick={() => navigateTo(`/pages/register/index?mode=resubmit&orderId=${activeOrder.id}`)}
                >
                  补件重提
                </View>
              )}
              <View
                className={classnames(styles.statusBtn, styles.statusBtnSecondary)}
                onClick={() => handleOrderClick(activeOrder.id)}
              >
                订单详情
              </View>
            </View>
          </View>
        )}

        {/* ===== 审核通过时才显示倒计时+参赛号+二维码+领物 ===== */}
        {isPassed && activeOrder && (
          <>
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
          </>
        )}

        <View style={{ height: '$spacing-xl', marginTop: '$spacing-xl' }} />

        {/* ===== 消息通知 ===== */}
        <View className={styles.notificationHeader}>
          <Text className={styles.notificationTitle}>消息通知</Text>
          {unreadCount > 0 ? (
            <Text className={styles.notificationBadge} onClick={markAllRead}>
              {unreadCount}条未读 · 全部已读
            </Text>
          ) : null}
        </View>

        <View className={styles.notificationList}>
          {notifications.length > 0 ? (
            notifications.slice(0, 6).map((notif) => (
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
            ))
          ) : (
            <View style={{ padding: 40, textAlign: 'center' }}>
              <Text style={{ color: '#A0AEC0', fontSize: 24 }}>暂无消息</Text>
              <Text style={{ color: '#CBD5E0', fontSize: 22, marginTop: 8, display: 'block' }}>
                赛事相关通知会第一时间在这里提醒您
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default AssistantPage;
